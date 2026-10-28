// The trip builder (Mode B): the visitor shapes their own trip — places, nights, hotel level, activities —
// and the brain prices it live and advises. The engine (engine.ts) only proposes the starting route.
// Pure and client-safe: the same functions run in the browser and on the server when the order is stored.

import type { BrainBase, BrainCountry, BrainSettings, StayType } from "../../data/brain";
import { seasonOf, suggestTrips, tripMonths, tripNights, type BrainInput } from "./engine.ts";
import { priceStops, type Costing } from "./pricing.ts";

export interface BuilderData {
  countries: BrainCountry[];
  bases: BrainBase[];
  settings: BrainSettings;
}

export interface BuiltStop {
  slug: string;
  nights: number;
  stay: StayType;
  /** Activity names, from the base's list. */
  activities: string[];
}

export interface BuiltTrip {
  country: string;
  stops: BuiltStop[];
}

export type StopSeason = "best" | "ok" | "bad";

export const MAX_STOPS = 5;
export const STAY_ORDER: StayType[] = ["budget_hotel", "apartment", "good_hotel"];

const youngKids = (input: BrainInput) => input.children > 0 && (input.childAges.length < input.children || input.childAges.some((a) => a < 12));

export const totalBudget = (input: BrainInput) =>
  input.budgetScope === "per_person" ? input.budgetTND * (input.adults + input.children) : input.budgetTND;

/** The activities a stop can offer this party (adults-only ones are hidden with children under 12). */
export const activitiesFor = (base: BrainBase, input: BrainInput) => base.activities.filter((a) => !youngKids(input) || a.kidFriendly);

export function stopSeason(base: BrainBase, input: BrainInput): StopSeason {
  return seasonOf(base, tripMonths(input));
}

export interface PricedTrip extends Costing {
  totalBudgetTND: number;
  /** Nights the visitor's dates (or chosen length) call for. */
  targetNights: number;
  /** Budget left after the trip and the minimum pocket money (negative = short by that much). */
  marginTND: number;
}

/** Prices the visitor's trip. Unknown places or activities (edited URLs, removed rows) are ignored. */
export function priceTrip(input: BrainInput, trip: BuiltTrip, data: BuilderData): PricedTrip | null {
  const country = data.countries.find((c) => c.code === trip.country);
  if (!country) return null;
  const stops = trip.stops.flatMap((s) => {
    const base = data.bases.find((b) => b.slug === s.slug && b.countryCode === country.code);
    if (!base) return [];
    const offered = activitiesFor(base, input);
    const activityPrices = s.activities.flatMap((name) => offered.filter((a) => a.name === name).map((a) => a.priceTND));
    return [{ base, nights: s.nights, stay: s.stay, activityPrices }];
  });
  const total = totalBudget(input);
  const costing = priceStops(country, stops, input, data.settings, total);
  return {
    ...costing,
    totalBudgetTND: total,
    targetNights: tripNights(input) ?? costing.nights,
    marginTND: costing.budget.pocket_money - data.settings.minPocketTND * costing.travelers * costing.days,
  };
}

/** Keeps only the places and activities that exist for this country and party. */
export function cleanTrip(input: BrainInput, trip: BuiltTrip, data: BuilderData): BuiltTrip {
  return {
    country: trip.country,
    stops: trip.stops
      .filter((s) => data.bases.some((b) => b.slug === s.slug && b.countryCode === trip.country))
      .slice(0, MAX_STOPS)
      .map((s) => {
        const base = data.bases.find((b) => b.slug === s.slug)!;
        const offered = new Set(activitiesFor(base, input).map((a) => a.name));
        return { ...s, activities: s.activities.filter((a) => offered.has(a)) };
      }),
  };
}

/**
 * The starting route in a country: the engine's best plan for these answers with a good hotel, else with a
 * budget hotel, else its closest plan; with no vibe match, the best-season place for the whole stay.
 */
export function suggestRoute(input: BrainInput, countryCode: string, data: BuilderData): BuiltTrip {
  const country = data.countries.find((c) => c.code === countryCode);
  const nights = tripNights(input) ?? 7;
  if (!country) return { country: countryCode, stops: [] };
  const run = (patch: Partial<BrainInput>) => suggestTrips({ ...input, ...patch }, [country], data.bases, data.settings);

  for (const stay of ["good_hotel", "budget_hotel"] as const) {
    const r = run({ stay });
    if (r.status === "ok") {
      const o = r.options[0];
      return { country: countryCode, stops: o.bases.map((b) => ({ slug: b.slug, nights: b.nights, stay, activities: b.activities.map((a) => a.name) })) };
    }
  }
  const closest = run({ stay: "budget_hotel" });
  if (closest.status === "no_fit" && closest.closest) {
    return { country: countryCode, stops: closest.closest.bases.map((b) => ({ slug: b.slug, nights: b.nights, stay: "budget_hotel", activities: [] })) };
  }
  const relaxed = run({ stay: "budget_hotel", vibes: [] });
  const plan = relaxed.status === "ok" ? relaxed.options[0].bases : relaxed.status === "no_fit" ? relaxed.closest?.bases : undefined;
  if (plan?.length) return { country: countryCode, stops: plan.map((b) => ({ slug: b.slug, nights: b.nights, stay: "budget_hotel", activities: [] })) };

  // Every place is in its rainy season: still start somewhere, and let the tips say so.
  const rank = { best: 0, ok: 1, bad: 2 };
  const base = data.bases
    .filter((b) => b.countryCode === countryCode)
    .sort((a, b) => rank[stopSeason(a, input)] - rank[stopSeason(b, input)] || a.sortOrder - b.sortOrder)[0];
  return { country: countryCode, stops: base ? [{ slug: base.slug, nights, stay: "budget_hotel", activities: [] }] : [] };
}

export interface CountryCard {
  code: string;
  season: StopSeason;
  route: BuiltTrip;
  priced: PricedTrip;
}

/** One card per country: its weather on the dates and what the suggested route costs. Best fits first. */
export function countryCards(input: BrainInput, data: BuilderData): CountryCard[] {
  const rank = { best: 0, ok: 1, bad: 2 };
  return [...data.countries]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .flatMap((country) => {
      const bases = data.bases.filter((b) => b.countryCode === country.code);
      if (bases.length === 0) return [];
      const season = bases.map((b) => stopSeason(b, input)).sort((a, b) => rank[a] - rank[b])[0];
      const route = suggestRoute(input, country.code, data);
      const priced = priceTrip(input, route, data);
      return priced ? [{ code: country.code, season, route, priced }] : [];
    })
    .sort((a, b) => Number(b.priced.marginTND >= 0) - Number(a.priced.marginTND >= 0) || rank[a.season] - rank[b.season] || a.priced.tripCostTND - b.priced.tripCostTND);
}

// ---- Tips ------------------------------------------------------------------------------------

export type Tip =
  /** The trip costs more than the whole budget. */
  | { kind: "over"; amountTND: number }
  /** It fits, but leaves less than the minimum pocket money (per person per day). */
  | { kind: "low_pocket"; pocketTND: number; minTND: number }
  | { kind: "cheaper_stay"; slug: string; stay: StayType; saveTND: number }
  | { kind: "drop_activity"; slug: string; name: string; saveTND: number }
  | { kind: "rainy"; slug: string }
  | { kind: "min_nights"; slug: string; nights: number }
  | { kind: "nights"; planned: number; target: number }
  | { kind: "many_moves" }
  | { kind: "add_place"; slug: string; costTND: number }
  | { kind: "upgrade"; slug: string; stay: StayType; costTND: number };

const replaceStop = (trip: BuiltTrip, i: number, patch: Partial<BuiltStop>): BuiltTrip => ({
  ...trip,
  stops: trip.stops.map((s, j) => (j === i ? { ...s, ...patch } : s)),
});

/** What the brain tells the visitor about their trip, most useful first. Every money tip is priced. */
export function adviseTrip(input: BrainInput, trip: BuiltTrip, data: BuilderData): Tip[] {
  const priced = priceTrip(input, trip, data);
  if (!priced || trip.stops.length === 0) return [];
  const tips: Tip[] = [];
  const costOf = (t: BuiltTrip) => priceTrip(input, t, data)?.tripCostTND ?? priced.tripCostTND;
  const baseOf = (slug: string) => data.bases.find((b) => b.slug === slug);

  if (priced.marginTND < 0) {
    if (priced.budget.pocket_money < 0) tips.push({ kind: "over", amountTND: -priced.budget.pocket_money });
    else tips.push({ kind: "low_pocket", pocketTND: Math.max(0, priced.pocketPerPersonPerDay), minTND: data.settings.minPocketTND });
    // The biggest saving from a cheaper stay, then from the dearest activity.
    const stays = trip.stops.flatMap((s, i) =>
      STAY_ORDER.slice(0, STAY_ORDER.indexOf(s.stay)).map((stay) => ({ slug: s.slug, stay, saveTND: priced.tripCostTND - costOf(replaceStop(trip, i, { stay })) })),
    );
    const bestStay = stays.filter((s) => s.saveTND > 0).sort((a, b) => b.saveTND - a.saveTND)[0];
    if (bestStay) tips.push({ kind: "cheaper_stay", ...bestStay });
    const acts = trip.stops.flatMap((s, i) =>
      s.activities.map((name) => ({ slug: s.slug, name, saveTND: priced.tripCostTND - costOf(replaceStop(trip, i, { activities: s.activities.filter((a) => a !== name) })) })),
    );
    const bestAct = acts.sort((a, b) => b.saveTND - a.saveTND)[0];
    if (bestAct) tips.push({ kind: "drop_activity", ...bestAct });
  }

  for (const s of trip.stops) {
    const base = baseOf(s.slug);
    if (!base) continue;
    if (stopSeason(base, input) === "bad") tips.push({ kind: "rainy", slug: s.slug });
    if (s.nights < base.minNights) tips.push({ kind: "min_nights", slug: s.slug, nights: base.minNights });
  }
  if (priced.nights !== priced.targetNights) tips.push({ kind: "nights", planned: priced.nights, target: priced.targetNights });
  if (trip.stops.length > 1 && priced.nights / trip.stops.length < 2.5) tips.push({ kind: "many_moves" });

  // Room to spare: a place that fits what's left (good season, shares a vibe), else a better hotel.
  if (priced.marginTND > 0 && trip.stops.length < MAX_STOPS) {
    const used = new Set(trip.stops.map((s) => s.slug));
    const stay = trip.stops[trip.stops.length - 1].stay;
    const candidates = data.bases
      .filter((b) => b.countryCode === trip.country && !used.has(b.slug) && stopSeason(b, input) !== "bad")
      .filter((b) => input.vibes.length === 0 || b.strengths.some((v) => input.vibes.includes(v)))
      .filter((b) => !youngKids(input) || b.familyOk)
      .map((b) => ({ slug: b.slug, costTND: costOf({ ...trip, stops: [...trip.stops, { slug: b.slug, nights: b.minNights, stay, activities: [] }] }) - priced.tripCostTND }))
      .filter((c) => c.costTND <= priced.marginTND)
      .sort((a, b) => a.costTND - b.costTND);
    if (candidates[0] && priced.nights < priced.targetNights + 2) tips.push({ kind: "add_place", ...candidates[0] });
  }
  if (priced.marginTND > 0) {
    const upgrades = trip.stops.flatMap((s, i) => {
      const better = STAY_ORDER[STAY_ORDER.indexOf(s.stay) + 1];
      return better ? [{ slug: s.slug, stay: better, costTND: costOf(replaceStop(trip, i, { stay: better })) - priced.tripCostTND }] : [];
    });
    const upgrade = upgrades.filter((u) => u.costTND > 0 && u.costTND <= priced.marginTND).sort((a, b) => a.costTND - b.costTND)[0];
    if (upgrade) tips.push({ kind: "upgrade", ...upgrade });
  }
  return tips;
}
