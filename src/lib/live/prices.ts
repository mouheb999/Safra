// Live prices of the day (SerpApi: Google Flights + Google Hotels) for the "Find my trip" picks. Pure: every
// side effect — HTTP, the cache, the monthly search budget, the clock — comes in through LiveDeps, so the same
// code runs on the server (src/lib/live/server.ts) and in scripts/verify-brain.mts with fakes.
//
// Rules: a live price only replaces SAFRA's estimate when it parses and looks sane; anything missing, failing
// or over budget falls back to the estimate (or a recent cached price). Prices are cached for a day.

import type { BrainBase, BrainCountry, StayType } from "../../data/brain";
import { priceTrip, type BuilderData } from "../brain/builder.ts";
import { tripNights, type BrainInput } from "../brain/engine.ts";
import { labelPicks, pickTwo, type PickResult } from "../brain/surprise.ts";

export const SERPAPI_URL = "https://serpapi.com/search.json";
export const FX_URL = "https://open.er-api.com/v6/latest/EUR";
/** SAFRA flies its customers from Tunis-Carthage. */
export const ORIGIN_AIRPORT = "TUN";
const DAY_MS = 86_400_000;
/** A cached price is "today's" for this long… */
const FRESH_MS = DAY_MS;
/** …and still better than an estimate for this long, once the monthly budget is spent. */
const STALE_OK_MS = 7 * DAY_MS;

export interface LiveSettings {
  enabled: boolean;
  monthlyLimit: number;
  /** Used when the exchange-rate service can't be reached. */
  fallbackEurTnd: number;
}

export interface CachedValue {
  value: unknown;
  fetchedAt: Date;
}

export interface LiveDeps {
  apiKey: string | null;
  fetchJson(url: string): Promise<unknown>;
  cacheGet(key: string): Promise<CachedValue | null>;
  cacheSet(key: string, kind: "flight" | "hotel" | "fx", value: unknown): Promise<void>;
  /** Counts one SerpApi search against the monthly limit; false once the limit is reached. */
  claimSearch(limit: number): Promise<boolean>;
  now(): Date;
}

/** What was live in a result (shown to the visitor, stored with the order). */
export interface LiveInfo {
  /** Countries whose flight price is live. */
  flights: string[];
  /** Bases (slugs) whose hotel prices are live. */
  hotels: string[];
  eurTnd: number | null;
  checkedAt: string | null;
}

export const NO_LIVE: LiveInfo = { flights: [], hotels: [], eurTnd: null, checkedAt: null };

// ---- Dates ------------------------------------------------------------------------------------

const iso = (d: Date) => d.toISOString().slice(0, 10);

/** The dates to search: the visitor's own, or the 15th of the chosen month (next occurrence) + the nights. */
export function searchDates(input: BrainInput, today: Date): { depart: string; ret: string } | null {
  if (input.depart && input.ret) return { depart: input.depart, ret: input.ret };
  const nights = tripNights(input);
  if (!input.month || !nights) return null;
  let year = today.getUTCFullYear();
  if (input.month < today.getUTCMonth() + 1 || (input.month === today.getUTCMonth() + 1 && today.getUTCDate() > 10)) year++;
  const depart = new Date(Date.UTC(year, input.month - 1, 15));
  return { depart: iso(depart), ret: iso(new Date(depart.getTime() + nights * DAY_MS)) };
}

const addDays = (isoDate: string, n: number) => iso(new Date(Date.parse(`${isoDate}T00:00:00Z`) + n * DAY_MS));

// ---- Parsing ----------------------------------------------------------------------------------

const num = (v: unknown): number | null => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/[^\d.]/g, ""));
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  return null;
};
const arr = (v: unknown): Record<string, unknown>[] => (Array.isArray(v) ? (v.filter((x) => x && typeof x === "object") as Record<string, unknown>[]) : []);

/** Cheapest round-trip price for one adult (the search's currency) from a Google Flights response. */
export function parseFlightPrice(json: unknown): number | null {
  const j = (json ?? {}) as Record<string, unknown>;
  const prices = [...arr(j.best_flights), ...arr(j.other_flights)].map((f) => num(f.price)).filter((p): p is number => p !== null);
  const insights = num((j.price_insights as Record<string, unknown> | undefined)?.lowest_price);
  if (insights !== null) prices.push(insights);
  return prices.length ? Math.min(...prices) : null;
}

const percentile = (xs: number[], p: number) => {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.max(0, Math.round((s.length - 1) * p)))];
};

/**
 * Typical nightly room rates (2 adults) from a Google Hotels response: a budget hotel is the lower third of
 * 1–3 star hotels, a good hotel the middle of 4–5 star ones. Needs at least 3 hotels per level.
 */
export function parseHotelRates(json: unknown): Partial<Record<StayType, number>> {
  const j = (json ?? {}) as Record<string, unknown>;
  const hotels = arr(j.properties)
    .filter((p) => typeof p.type !== "string" || /hotel/i.test(p.type))
    .map((p) => {
      const rate = (p.rate_per_night ?? {}) as Record<string, unknown>;
      const stars = num(p.extracted_hotel_class) ?? num(p.hotel_class);
      return { rate: num(rate.extracted_lowest) ?? num(rate.lowest), stars };
    })
    .filter((h): h is { rate: number; stars: number | null } => h.rate !== null);
  const out: Partial<Record<StayType, number>> = {};
  const budget = hotels.filter((h) => h.stars === null || h.stars <= 3).map((h) => h.rate);
  const good = hotels.filter((h) => h.stars !== null && h.stars >= 4).map((h) => h.rate);
  if (budget.length >= 3) out.budget_hotel = percentile(budget, 0.3);
  if (good.length >= 3) out.good_hotel = percentile(good, 0.5);
  return out;
}

export function parseEurTnd(json: unknown): number | null {
  const rate = num(((json ?? {}) as { rates?: Record<string, unknown> }).rates?.TND);
  return rate !== null && rate > 1 && rate < 10 ? rate : null;
}

// ---- Fetching through the cache and the budget -------------------------------------------------

async function cachedSearch(key: string, kind: "flight" | "hotel", url: string, settings: LiveSettings, deps: LiveDeps) {
  const now = deps.now().getTime();
  const hit = await deps.cacheGet(key).catch(() => null);
  if (hit && now - hit.fetchedAt.getTime() < FRESH_MS) return hit;
  if (deps.apiKey && (await deps.claimSearch(settings.monthlyLimit).catch(() => false))) {
    try {
      const value = await deps.fetchJson(url);
      if (value && typeof value === "object" && !(value as { error?: unknown }).error) {
        await deps.cacheSet(key, kind, value).catch(() => undefined);
        return { value, fetchedAt: deps.now() };
      }
    } catch {
      // fall through to the cache or the estimate
    }
  }
  return hit && now - hit.fetchedAt.getTime() < STALE_OK_MS ? hit : null;
}

const serpUrl = (params: Record<string, string>, apiKey: string) =>
  `${SERPAPI_URL}?${new URLSearchParams({ ...params, hl: "en", currency: "EUR", api_key: apiKey })}`;

/** The day's EUR → TND rate (free service, cached a day), else the admin's fallback rate. */
export async function eurToTnd(settings: LiveSettings, deps: LiveDeps): Promise<number> {
  const now = deps.now().getTime();
  const hit = await deps.cacheGet("fx:EUR-TND").catch(() => null);
  const cached = hit ? parseEurTnd(hit.value) : null;
  if (hit && cached && now - hit.fetchedAt.getTime() < FRESH_MS) return cached;
  try {
    const value = await deps.fetchJson(FX_URL);
    const rate = parseEurTnd(value);
    if (rate) {
      await deps.cacheSet("fx:EUR-TND", "fx", value).catch(() => undefined);
      return rate;
    }
  } catch {
    // keep going with what we have
  }
  return cached ?? settings.fallbackEurTnd;
}

/** The Google Flights search for one country: its cache key and URL (null without an airport or a key). */
export function flightSearch(country: BrainCountry, dates: { depart: string; ret: string }, apiKey: string | null) {
  const airport = country.airport.match(/[A-Z]{3}/)?.[0];
  if (!airport || !apiKey) return null;
  return {
    airport,
    key: `flight:${ORIGIN_AIRPORT}-${airport}:${dates.depart}:${dates.ret}`,
    url: serpUrl(
      { engine: "google_flights", departure_id: ORIGIN_AIRPORT, arrival_id: airport, outbound_date: dates.depart, return_date: dates.ret, type: "1", adults: "1" },
      apiKey,
    ),
  };
}

/** A parsed flight price (EUR) in TND, if it looks like a real round trip (never 300 or 30,000 DT). */
export const saneFlightTND = (eur: number | null, fx: number) => {
  const tnd = eur === null ? null : Math.round(eur * fx);
  return tnd !== null && tnd >= 400 && tnd <= 20_000 ? tnd : null;
};

/** Round-trip flight from Tunis per person, TND (before the card fee, like SAFRA's table). */
export async function liveFlightTND(country: BrainCountry, dates: { depart: string; ret: string }, fx: number, settings: LiveSettings, deps: LiveDeps) {
  const search = flightSearch(country, dates, deps.apiKey);
  if (!search) return null;
  const hit = await cachedSearch(search.key, "flight", search.url, settings, deps);
  return saneFlightTND(hit ? parseFlightPrice(hit.value) : null, fx);
}

/** Nightly room rates for one place, TND, by hotel level (only the levels that could be measured). */
export async function liveHotelTND(
  base: BrainBase,
  countryName: string,
  stay: { checkIn: string; checkOut: string },
  fx: number,
  settings: LiveSettings,
  deps: LiveDeps,
): Promise<Partial<Record<StayType, number>>> {
  if (!deps.apiKey) return {};
  const key = `hotel:${base.slug}:${stay.checkIn}:${stay.checkOut}`;
  const url = serpUrl(
    { engine: "google_hotels", q: `hotels in ${base.place}, ${countryName}`, check_in_date: stay.checkIn, check_out_date: stay.checkOut, adults: "2" },
    deps.apiKey,
  );
  const hit = await cachedSearch(key, "hotel", url, settings, deps);
  const rates = hit ? parseHotelRates(hit.value) : {};
  const out: Partial<Record<StayType, number>> = {};
  for (const [stayType, eur] of Object.entries(rates) as [StayType, number][]) {
    const tnd = Math.round(eur * fx);
    if (tnd >= 30 && tnd <= 5000) out[stayType] = tnd;
  }
  return out;
}

// ---- Picking with live prices ---------------------------------------------------------------------

export interface LivePick {
  result: PickResult;
  /** The data the picks were priced with (live flights and hotels where found); price orders with it too. */
  data: BuilderData;
  live: LiveInfo;
}

/**
 * The 2 picks with the day's prices: live flights for every country decide the picks, then live hotel rates
 * for the picked places re-price them. Without a key, when disabled, or when nothing could be fetched, this is
 * exactly pickTwo() on SAFRA's estimates.
 */
export async function pickTwoLive(input: BrainInput, data: BuilderData, settings: LiveSettings, deps: LiveDeps): Promise<LivePick> {
  const offline: LivePick = { result: pickTwo(input, data), data, live: NO_LIVE };
  const dates = searchDates(input, deps.now());
  if (!settings.enabled || !deps.apiKey || !dates || offline.result.status !== "ok") return offline;

  const fx = await eurToTnd(settings, deps);
  const flights = await Promise.all(data.countries.map((c) => liveFlightTND(c, dates, fx, settings, deps).catch(() => null)));
  const withFlights: BuilderData = {
    ...data,
    countries: data.countries.map((c, i) => (flights[i] ? { ...c, flightTND: flights[i]! } : c)),
  };
  const result = pickTwo(input, withFlights);
  if (result.status !== "ok") return offline;

  // Hotels for the picked places, each searched for its own nights within the trip.
  const stays = result.picks.flatMap((p) => {
    let offset = 0;
    return p.trip.stops.map((s) => {
      const checkIn = addDays(dates.depart, offset);
      offset += s.nights;
      return { slug: s.slug, country: p.country, checkIn, checkOut: addDays(checkIn, s.nights) };
    });
  });
  const rates = await Promise.all(
    stays.map((s) => {
      const base = data.bases.find((b) => b.slug === s.slug)!;
      const country = data.countries.find((c) => c.code === s.country)!;
      return liveHotelTND(base, country.name, s, fx, settings, deps).catch(() => ({}));
    }),
  );
  const liveRates = new Map(stays.map((s, i) => [s.slug, rates[i]] as const).filter(([, r]) => Object.keys(r).length > 0));
  const priced: BuilderData = {
    ...withFlights,
    bases: withFlights.bases.map((b) => (liveRates.has(b.slug) ? { ...b, stayTND: { ...b.stayTND, ...liveRates.get(b.slug) } } : b)),
  };

  const picks = result.picks.map((p) => {
    const re = priceTrip(input, p.trip, priced) ?? p.priced;
    const fits = re.marginTND >= 0;
    return { ...p, priced: re, fits, missingTND: fits ? 0 : Math.ceil(Math.max(0, -re.marginTND) / 50) * 50 };
  });
  const liveFlights = data.countries.filter((_, i) => flights[i] !== null).map((c) => c.code);
  return {
    result: { status: "ok", picks: labelPicks(picks) },
    data: priced,
    live: {
      flights: liveFlights,
      hotels: [...liveRates.keys()],
      eurTnd: liveFlights.length || liveRates.size ? fx : null,
      checkedAt: liveFlights.length || liveRates.size ? deps.now().toISOString() : null,
    },
  };
}
