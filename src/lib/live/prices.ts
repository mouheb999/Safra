// Live prices of the day (SerpApi: Google Flights + Google Hotels) for the "Find my trip" picks. Pure: every
// side effect — HTTP, the cache, the monthly search budget, the clock — comes in through LiveDeps, so the same
// code runs on the server (src/lib/live/server.ts) and in scripts/verify-brain.mts with fakes.
//
// Rules: a live price only replaces SAFRA's estimate when it parses and looks sane; anything missing, failing
// or over budget falls back to the estimate (or a recent cached price). Prices are cached for a day.

import type { BrainBase, BrainCountry, StayType } from "../../data/brain";
import { priceTrip, type BuilderData } from "../brain/builder.ts";
import { tripNights, type BrainInput } from "../brain/engine.ts";
import { keepInReach, pickTwo, rankCountries, type PickResult } from "../brain/surprise.ts";

export const SERPAPI_URL = "https://serpapi.com/search.json";
export const FX_URL = "https://open.er-api.com/v6/latest/EUR";
/** SAFRA flies its customers from Tunis-Carthage. */
export const ORIGIN_AIRPORT = "TUN";
const DAY_MS = 86_400_000;
/** A cached price is "today's" for this long… */
const FRESH_MS = DAY_MS;
/**
 * Live flights are fetched for this many countries per new search: the best ones on the estimates. The rest
 * can hardly be picked, so searching them would only spend the monthly budget.
 */
export const LIVE_FLIGHT_COUNTRIES = 5;
/** Google Flights has almost nothing for departures this close, so they use the estimates (and cost nothing). */
export const MIN_LEAD_DAYS = 2;
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

/** Where a live flight price came from: the day's Google Flights search, for SAFRA to open when the order comes in. */
export interface FlightLink {
  url: string;
  /** Round trip per person, TND (before the card fee). */
  priceTND: number;
  airline: string | null;
  depart: string;
  ret: string;
}

/** Where a place's live hotel rates came from: the day's Google Hotels search, and a hotel at each rate used. */
export interface HotelLink {
  url: string;
  checkIn: string;
  checkOut: string;
  examples: { stay: StayType; name: string; nightTND: number; url: string | null }[];
}

/**
 * What was live in a result. Only the yes/no flags reach the visitor (src/lib/brain/preview.ts); the links are
 * stored with the order for SAFRA (src/lib/brain/snapshot.ts) and never sent to the browser.
 */
export interface LiveInfo {
  /** Countries whose flight price is live. */
  flights: string[];
  /** Bases (slugs) whose hotel prices are live. */
  hotels: string[];
  eurTnd: number | null;
  checkedAt: string | null;
  /** By country code. */
  flightLinks: Record<string, FlightLink>;
  /** By base slug. */
  hotelLinks: Record<string, HotelLink>;
}

export const NO_LIVE: LiveInfo = { flights: [], hotels: [], eurTnd: null, checkedAt: null, flightLinks: {}, hotelLinks: {} };

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

/** The airline of the cheapest itinerary, when the response names it. */
function cheapestAirline(json: unknown): string | null {
  const j = (json ?? {}) as Record<string, unknown>;
  const offers = [...arr(j.best_flights), ...arr(j.other_flights)].filter((f) => num(f.price) !== null);
  offers.sort((a, b) => num(a.price)! - num(b.price)!);
  const airlines = [...new Set(arr(offers[0]?.flights).map((leg) => leg.airline).filter((a): a is string => typeof a === "string"))];
  return airlines.length ? airlines.join(" + ") : null;
}

/** A Google link from SerpApi's search metadata (only Google's own pages: never a SerpApi URL). */
function googleUrl(json: unknown, field: "google_flights_url" | "google_hotels_url"): string | null {
  const url = ((json ?? {}) as { search_metadata?: Record<string, unknown> }).search_metadata?.[field];
  return typeof url === "string" && /^https:\/\/www\.google\.[a-z.]+\//.test(url) ? url : null;
}

const percentile = <T extends { rate: number }>(xs: T[], p: number): T => {
  const s = [...xs].sort((a, b) => a.rate - b.rate);
  return s[Math.min(s.length - 1, Math.max(0, Math.round((s.length - 1) * p)))];
};

/**
 * Typical nightly room rates (2 adults) from a Google Hotels response: a budget hotel is the lower third of
 * 1–3 star hotels, a good hotel the middle of 4–5 star ones. Needs at least 3 hotels per level.
 */
export function parseHotelRates(json: unknown): Partial<Record<StayType, number>> {
  return Object.fromEntries(Object.entries(parseHotelOffers(json)).map(([stay, h]) => [stay, h.rate]));
}

interface HotelOffer {
  rate: number;
  stars: number | null;
  name: string;
  url: string | null;
}

/** parseHotelRates, plus the hotel each rate comes from (its name and website, for SAFRA). */
export function parseHotelOffers(json: unknown): Partial<Record<StayType, HotelOffer>> {
  const j = (json ?? {}) as Record<string, unknown>;
  const hotels = arr(j.properties)
    .filter((p) => typeof p.type !== "string" || /hotel/i.test(p.type))
    .map((p) => {
      const rate = (p.rate_per_night ?? {}) as Record<string, unknown>;
      const stars = num(p.extracted_hotel_class) ?? num(p.hotel_class);
      const link = typeof p.link === "string" && /^https?:\/\//.test(p.link) ? p.link : null;
      return { rate: num(rate.extracted_lowest) ?? num(rate.lowest), stars, name: typeof p.name === "string" ? p.name : "", url: link };
    })
    .filter((h): h is HotelOffer => h.rate !== null);
  const out: Partial<Record<StayType, HotelOffer>> = {};
  const budget = hotels.filter((h) => h.stars === null || h.stars <= 3);
  const good = hotels.filter((h) => h.stars !== null && h.stars >= 4);
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
      if (value && typeof value === "object") {
        const error = (value as { error?: unknown }).error;
        if (!error) {
          await deps.cacheSet(key, kind, value).catch(() => undefined);
          return { value, fetchedAt: deps.now() };
        }
        // "No results" for these dates is the day's answer too: keep it, so the next visitor doesn't pay again.
        // Account problems (key, plan, credits) aren't, so they recover as soon as they're fixed.
        if (!hit && typeof error === "string" && !/api key|account|plan|credit|searches/i.test(error)) {
          await deps.cacheSet(key, kind, value).catch(() => undefined);
        }
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
  return (await liveFlight(country, dates, fx, settings, deps))?.priceTND ?? null;
}

/** liveFlightTND, with the Google Flights link it came from. */
export async function liveFlight(
  country: BrainCountry,
  dates: { depart: string; ret: string },
  fx: number,
  settings: LiveSettings,
  deps: LiveDeps,
): Promise<FlightLink | null> {
  const search = flightSearch(country, dates, deps.apiKey);
  if (!search) return null;
  const hit = await cachedSearch(search.key, "flight", search.url, settings, deps);
  const priceTND = saneFlightTND(hit ? parseFlightPrice(hit.value) : null, fx);
  if (!hit || priceTND === null) return null;
  const fallback = `https://www.google.com/travel/flights?hl=en&q=${encodeURIComponent(
    `Flights from ${ORIGIN_AIRPORT} to ${search.airport} on ${dates.depart} through ${dates.ret}`,
  )}`;
  return { url: googleUrl(hit.value, "google_flights_url") ?? fallback, priceTND, airline: cheapestAirline(hit.value), ...dates };
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
  return (await liveHotel(base, countryName, stay, fx, settings, deps)).rates;
}

/** liveHotelTND, with the Google Hotels link and a hotel at each rate (link null when nothing was measured). */
export async function liveHotel(
  base: BrainBase,
  countryName: string,
  stay: { checkIn: string; checkOut: string },
  fx: number,
  settings: LiveSettings,
  deps: LiveDeps,
): Promise<{ rates: Partial<Record<StayType, number>>; link: HotelLink | null }> {
  if (!deps.apiKey) return { rates: {}, link: null };
  const query = `hotels in ${base.place}, ${countryName}`;
  const key = `hotel:${base.slug}:${stay.checkIn}:${stay.checkOut}`;
  const url = serpUrl({ engine: "google_hotels", q: query, check_in_date: stay.checkIn, check_out_date: stay.checkOut, adults: "2" }, deps.apiKey);
  const hit = await cachedSearch(key, "hotel", url, settings, deps);
  const offers = hit ? parseHotelOffers(hit.value) : {};
  const rates: Partial<Record<StayType, number>> = {};
  const examples: HotelLink["examples"] = [];
  for (const [stayType, offer] of Object.entries(offers) as [StayType, HotelOffer][]) {
    const tnd = Math.round(offer.rate * fx);
    if (tnd < 30 || tnd > 5000) continue;
    rates[stayType] = tnd;
    if (offer.name) examples.push({ stay: stayType, name: offer.name, nightTND: tnd, url: offer.url });
  }
  if (!hit || Object.keys(rates).length === 0) return { rates, link: null };
  const fallback = `https://www.google.com/travel/search?hl=en&q=${encodeURIComponent(query)}`;
  return { rates, link: { url: googleUrl(hit.value, "google_hotels_url") ?? fallback, ...stay, examples } };
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
  if (Date.parse(`${dates.depart}T00:00:00Z`) - deps.now().getTime() < MIN_LEAD_DAYS * DAY_MS) return offline;

  const fx = await eurToTnd(settings, deps);
  const shortlist = new Set(rankCountries(input, data).slice(0, LIVE_FLIGHT_COUNTRIES));
  const flights = await Promise.all(
    data.countries.map((c) => (shortlist.has(c.code) ? liveFlight(c, dates, fx, settings, deps).catch(() => null) : Promise.resolve(null))),
  );
  const withFlights: BuilderData = {
    ...data,
    countries: data.countries.map((c, i) => (flights[i] ? { ...c, flightTND: flights[i]!.priceTND } : c)),
  };
  const result = pickTwo(input, withFlights);
  const flightLinks = Object.fromEntries(data.countries.flatMap((c, i) => (flights[i] ? [[c.code, flights[i]!] as const] : [])));
  const liveFlightCodes = data.countries.filter((_, i) => flights[i] !== null).map((c) => c.code);
  // With the day's fares nothing is in reach of the budget: say so (never fall back to estimates that would show it).
  if (result.status === "too_tight" && liveFlightCodes.length) {
    return { result, data: withFlights, live: { ...NO_LIVE, flights: liveFlightCodes, eurTnd: fx, checkedAt: deps.now().toISOString(), flightLinks } };
  }
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
      return liveHotel(base, country.name, s, fx, settings, deps).catch(() => ({ rates: {}, link: null }));
    }),
  );
  const liveRates = new Map(stays.map((s, i) => [s.slug, rates[i].rates] as const).filter(([, r]) => Object.keys(r).length > 0));
  const hotelLinks = Object.fromEntries(stays.flatMap((s, i) => (rates[i].link ? [[s.slug, rates[i].link!] as const] : [])));
  const priced: BuilderData = {
    ...withFlights,
    bases: withFlights.bases.map((b) => (liveRates.has(b.slug) ? { ...b, stayTND: { ...b.stayTND, ...liveRates.get(b.slug) } } : b)),
  };

  const picks = result.picks.map((p) => {
    const re = priceTrip(input, p.trip, priced) ?? p.priced;
    const fits = re.marginTND >= 0;
    return { ...p, priced: re, fits, missingTND: fits ? 0 : Math.ceil(Math.max(0, -re.marginTND) / 50) * 50 };
  });
  const liveFlights = liveFlightCodes;
  return {
    // The day's hotel rates can push a pick beyond reach: it's dropped then (none left → too tight).
    result: keepInReach(input, picks),
    data: priced,
    live: {
      flights: liveFlights,
      hotels: [...liveRates.keys()],
      eurTnd: liveFlights.length || liveRates.size ? fx : null,
      checkedAt: liveFlights.length || liveRates.size ? deps.now().toISOString() : null,
      flightLinks,
      hotelLinks,
    },
  };
}
