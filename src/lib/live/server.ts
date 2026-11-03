// Server side of live prices: real HTTP, the Supabase cache (public.live_prices) and the monthly search
// budget (public.claim_live_price_search). Without SERPAPI_API_KEY — or without the database — everything
// falls back to SAFRA's estimates, so the site never depends on it.

import "server-only";
import { getBrainData, getSiteSettings } from "@/lib/catalog";
import type { BrainInput } from "@/lib/brain/engine";
import { getAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";
import {
  ORIGIN_AIRPORT,
  eurToTnd,
  flightSearch,
  parseFlightPrice,
  pickTwoLive,
  saneFlightTND,
  searchDates,
  type LiveDeps,
  type LivePick,
} from "./prices";

/**
 * Each outside call gets this long; slower ones count as failed (the estimate is used). Google Flights through
 * SerpApi often takes 10–20 s on a new search (cached ones are instant), so pages that call it allow 60 s.
 */
const TIMEOUT_MS = 30_000;

export const liveKeyConfigured = () => Boolean(process.env.SERPAPI_API_KEY);

function deps(): LiveDeps {
  const db = getAdminClient();
  return {
    apiKey: process.env.SERPAPI_API_KEY || null,
    async fetchJson(url) {
      const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    async cacheGet(key) {
      if (!db) return null;
      const { data } = await db.from("live_prices").select("value, fetched_at").eq("cache_key", key).maybeSingle();
      return data ? { value: data.value, fetchedAt: new Date(data.fetched_at) } : null;
    },
    async cacheSet(key, kind, value) {
      if (!db) return;
      await db.from("live_prices").upsert({ cache_key: key, kind, value: value as Json, fetched_at: new Date().toISOString() });
    },
    async claimSearch(limit) {
      // No database to count against: don't spend searches that can't be capped.
      if (!db) return false;
      const { data, error } = await db.rpc("claim_live_price_search", { p_limit: limit });
      return !error && data === true;
    },
    now: () => new Date(),
  };
}

/** The 2 "Find my trip" picks, with the day's flight and hotel prices where available. */
export async function pickTwoWithLivePrices(input: BrainInput): Promise<LivePick> {
  const [data, settings] = await Promise.all([getBrainData(), getSiteSettings()]);
  return pickTwoLive(input, data, settings.live, deps());
}

export type LiveTestResult =
  | { ok: true; route: string; dates: string; priceTND: number; eurTnd: number; seconds: number }
  | { ok: false; reason: string };

/**
 * For /admin/brain: one real flight search (Tunis → the first country, next month, 10 nights) to check the key
 * and the connection. Uses the cache like visitors do, so repeating it the same day costs nothing.
 */
export async function testLivePrices(): Promise<LiveTestResult> {
  if (!liveKeyConfigured()) return { ok: false, reason: "SERPAPI_API_KEY isn’t set on this deployment." };
  if (!getAdminClient()) return { ok: false, reason: "SUPABASE_SECRET_KEY isn’t set, so searches can’t be counted or cached." };
  const [data, settings] = await Promise.all([getBrainData(), getSiteSettings()]);
  const country = data.countries[0];
  if (!country) return { ok: false, reason: "No trip brain country is active." };
  const d = deps();
  const today = d.now();
  const month = ((today.getUTCMonth() + 1) % 12) + 1;
  const dates = searchDates({ ...({} as BrainInput), depart: null, ret: null, month, nights: 10 }, today)!;
  const fx = await eurToTnd(settings.live, d);
  const search = flightSearch(country, dates, d.apiKey);
  if (!search) return { ok: false, reason: `${country.name} has no airport code (e.g. BKK) in Trip brain → Countries.` };
  const route = `${ORIGIN_AIRPORT} → ${search.airport}`;
  const when = `${dates.depart} → ${dates.ret}`;

  // Already searched today: no new search needed.
  const hit = await d.cacheGet(search.key).catch(() => null);
  const cachedPrice = hit ? saneFlightTND(parseFlightPrice(hit.value), fx) : null;
  if (cachedPrice) return { ok: true, route, dates: when, priceTND: cachedPrice, eurTnd: fx, seconds: 0 };

  if (!(await d.claimSearch(settings.live.monthlyLimit))) {
    return { ok: false, reason: `This month’s limit (${settings.live.monthlyLimit} searches) is used up, or searches can’t be counted.` };
  }
  // The same request visitors make, but every failure is reported as it is.
  const started = Date.now();
  const seconds = () => Math.round((Date.now() - started) / 100) / 10;
  let res: Response;
  try {
    res = await fetch(search.url, { cache: "no-store", signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (error) {
    const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    return {
      ok: false,
      reason: timedOut
        ? `SerpApi didn’t answer within ${TIMEOUT_MS / 1000} s (${route}, ${when}).`
        : `Couldn’t reach SerpApi: ${error instanceof Error ? error.message : String(error)}.`,
    };
  }
  let json: Record<string, unknown> = {};
  try {
    json = (await res.json()) as Record<string, unknown>;
  } catch {
    // reported below
  }
  if (typeof json.error === "string") return { ok: false, reason: `SerpApi says: “${json.error}” (HTTP ${res.status}, ${seconds()} s).` };
  if (!res.ok) return { ok: false, reason: `SerpApi answered HTTP ${res.status} after ${seconds()} s.` };
  const eur = parseFlightPrice(json);
  const flights = (Array.isArray(json.best_flights) ? json.best_flights.length : 0) + (Array.isArray(json.other_flights) ? json.other_flights.length : 0);
  const price = saneFlightTND(eur, fx);
  if (!price) {
    return {
      ok: false,
      reason: eur === null ? `SerpApi found ${flights} flights for ${route}, ${when}, but none had a price.` : `SerpApi’s cheapest price (${eur} EUR) doesn’t look like a real round trip.`,
    };
  }
  await d.cacheSet(search.key, "flight", json).catch(() => undefined);
  return { ok: true, route, dates: when, priceTND: price, eurTnd: fx, seconds: seconds() };
}
