// "Surprise me": the 2 best trips for the visitor's answers, one per country (a good hotel when it fits, else a
// budget hotel). Focus destinations (Southeast Asia) lead: they're picked whenever they fit, or nearly fit, the
// budget; the other countries are the backup that fits smaller budgets. Pure: the server runs it for the preview
// and again, from the same answers, when the visitor orders (so the locked program never travels through the browser).

import type { StayType } from "../../data/brain";
import { priceTrip, type BuilderData, type BuiltTrip, type PricedTrip } from "./builder.ts";
import { suggestTrips, tripNights, type BrainInput, type BrainOption, type Season } from "./engine.ts";

export type PickLabel = "best_match" | "best_value" | "best_experience" | "stretch";

export interface Pick {
  country: string;
  label: PickLabel;
  trip: BuiltTrip;
  priced: PricedTrip;
  season: Season;
  vibesMatched: string[];
  fits: boolean;
  /** Extra budget needed (whole trip, rounded up to 50 DT) when it doesn't fit; 0 otherwise. Never over 150 DT per person. */
  missingTND: number;
}

export type PickResult =
  | { status: "need_info"; missing: string[] }
  | { status: "ok"; picks: Pick[] }
  /** Trips exist for these answers, but none within MAX_STRETCH_PER_PERSON_TND of the budget. */
  | { status: "too_tight"; minPerPersonTND: number };

interface Candidate {
  country: string;
  trip: BuiltTrip;
  fits: boolean;
  score: number;
  season: Season;
  vibesMatched: string[];
}

const toTrip = (country: string, stay: StayType, bases: BrainOption["bases"]): BuiltTrip => ({
  country,
  stops: bases.map((b) => ({ slug: b.slug, nights: b.nights, stay, activities: b.activities.map((a) => a.name) })),
});

function candidate(input: BrainInput, countryCode: string, data: BuilderData): Candidate | null {
  const country = data.countries.find((c) => c.code === countryCode);
  if (!country) return null;
  for (const stay of ["good_hotel", "budget_hotel"] as const) {
    const r = suggestTrips({ ...input, stay }, [country], data.bases, data.settings);
    if (r.status === "ok") {
      const o = r.options[0];
      return { country: countryCode, trip: toTrip(countryCode, stay, o.bases), fits: true, score: o.score, season: o.season, vibesMatched: o.vibesMatched };
    }
  }
  const r = suggestTrips({ ...input, stay: "budget_hotel" }, [country], data.bases, data.settings);
  if (r.status !== "no_fit" || !r.closest) return null;
  const seasons = r.closest.bases.map((b) => b.season);
  const matched = input.vibes.filter((v) => r.closest!.bases.some((b) => data.bases.find((x) => x.slug === b.slug)?.strengths.includes(v)));
  return {
    country: countryCode,
    trip: toTrip(countryCode, "budget_hotel", r.closest.bases),
    fits: false,
    score: -r.closest.shortfallTND,
    season: seasons.includes("ok") ? "ok" : "best",
    vibesMatched: matched,
  };
}

/**
 * Every country's best trip for these answers, best first: the ones that fit, by score, then the closest.
 * Countries the visitor asked to replace (`input.exclude`) are left out.
 */
function rankCandidates(input: BrainInput, data: BuilderData): Candidate[] {
  const skip = new Set(input.exclude ?? []);
  return [...data.countries]
    .filter((c) => !skip.has(c.code))
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((c) => candidate(input, c.code, data))
    .filter((c): c is Candidate => c !== null)
    .sort((a, b) => Number(b.fits) - Number(a.fits) || b.score - a.score);
}

/**
 * The most a shown trip may ask on top of the visitor's budget, per person. Anything further is never shown:
 * when nothing fits within it, the visitor is told the budget is too tight (status "too_tight").
 */
export const MAX_STRETCH_PER_PERSON_TND = 150;

const travelersOf = (input: BrainInput) => input.adults + input.children;
const totalBudget = (input: BrainInput) => (input.budgetScope === "per_person" ? input.budgetTND * travelersOf(input) : input.budgetTND);
const ceil50 = (n: number) => Math.ceil(n / 50) * 50;

interface Priced extends Candidate {
  priced: PricedTrip;
  /** Exact amount missing for the whole trip (0 when it fits). */
  shortTND: number;
}

/** Every country's trip, priced exactly, best first. */
function pricedCandidates(input: BrainInput, data: BuilderData): Priced[] {
  return rankCandidates(input, data).flatMap((c) => {
    const priced = priceTrip(input, c.trip, data);
    return priced ? [{ ...c, priced, shortTND: c.fits ? 0 : Math.max(0, -priced.marginTND) }] : [];
  });
}

/** Within the budget, or at most MAX_STRETCH_PER_PERSON_TND more per person. */
const inReach = (c: Priced, input: BrainInput) => c.fits || c.shortTND / travelersOf(input) <= MAX_STRETCH_PER_PERSON_TND;

/**
 * The 2 trips to show, only from trips in reach of the budget: the ones that fit first, then the ones a little over
 * (≤ 150 DT per person); in each group focus destinations (Southeast Asia) first, then the best score.
 */
function chooseTwo(list: Priced[], featured: Set<string>, input: BrainInput): Priced[] {
  const rank = (c: Priced) => (c.fits ? 0 : 2) + (featured.has(c.country) ? 0 : 1);
  return list
    .filter((c) => inReach(c, input))
    .sort((a, b) => rank(a) - rank(b) || (a.fits ? b.score - a.score : a.shortTND - b.shortTND))
    .slice(0, 2);
}

/** The budget per person (rounded up to 50 DT) the cheapest trip for these answers needs. */
function smallestBudgetPerPerson(list: Priced[], input: BrainInput): number {
  const needed = list.map((c) => (totalBudget(input) + c.shortTND) / travelersOf(input));
  return ceil50(Math.min(...needed));
}

const featuredOf = (data: BuilderData) => new Set(data.countries.filter((c) => c.featured).map((c) => c.code));

/**
 * Country codes in pick order: the 2 picks, then the others closest to the budget (used to spend live searches
 * on the countries that can actually be picked — a live fare can bring a country within reach).
 */
export function rankCountries(input: BrainInput, data: BuilderData): string[] {
  const list = pricedCandidates(input, data);
  const chosen = chooseTwo(list, featuredOf(data), input).map((c) => c.country);
  const rest = [...list].sort((a, b) => a.shortTND - b.shortTND).map((c) => c.country);
  return [...new Set([...chosen, ...rest])];
}

/** Whether "Show me 2 other destinations" has anything in reach once these countries are skipped too. */
export function hasMoreDestinations(input: BrainInput, data: BuilderData, shown: string[]): boolean {
  const next = { ...input, exclude: [...(input.exclude ?? []), ...shown] };
  return pricedCandidates(next, data).some((c) => inReach(c, next));
}

export function pickTwo(input: BrainInput, data: BuilderData): PickResult {
  const probe = suggestTrips(input, [], data.bases, data.settings);
  if (probe.status === "need_info") return probe;

  const list = pricedCandidates(input, data);
  const chosen = chooseTwo(list, featuredOf(data), input);
  // Nothing in reach (but trips exist): say so, with the budget that would work, instead of showing trips far over it.
  if (chosen.length === 0 && list.length > 0) return { status: "too_tight", minPerPersonTND: smallestBudgetPerPerson(list, input) };

  const picks = chosen.map(({ score: _score, shortTND, ...c }) => ({ ...c, missingTND: c.fits ? 0 : ceil50(shortTND), label: "best_match" as PickLabel }));
  return { status: "ok", picks: labelPicks(picks) };
}

/** Re-checks picks after live prices: drops any now beyond reach; none left → too tight (with what would work). */
export function keepInReach<T extends Pick>(input: BrainInput, picks: T[]): PickResult {
  const kept = picks.filter((p) => p.fits || p.missingTND / travelersOf(input) <= MAX_STRETCH_PER_PERSON_TND);
  if (kept.length) return { status: "ok", picks: labelPicks(kept) };
  const needed = picks.map((p) => (totalBudget(input) + p.missingTND) / travelersOf(input));
  return { status: "too_tight", minPerPersonTND: ceil50(Math.min(...needed)) };
}

// ---- Helping visitors whose budget is too small -------------------------------------------------------

/** The typical trip the budget step talks about (dates and group aren't asked yet): a week for two. */
export const GUIDE_NIGHTS = 7;
const GUIDE_MONTHS = 6;

export interface BudgetGuideEntry {
  code: string;
  featured: boolean;
  /** The smallest budget per person (rounded up to 50 DT) a typical trip there needs. */
  minPerPersonTND: number;
}

/**
 * For the budget step: in each destination, the smallest budget per person a typical trip needs — a week for two,
 * the cheapest of the next 6 months, every cost included (flights from Tunis, stays, food, pocket money…) — from
 * the same prices as the picks. Cheapest first.
 */
export function budgetGuide(data: BuilderData, today: Date): BudgetGuideEntry[] {
  const best = new Map<string, number>();
  for (let i = 1; i <= GUIDE_MONTHS; i++) {
    const input: BrainInput = {
      budgetTND: 100, budgetScope: "per_person", adults: 2, children: 0, childAges: [], group: "couple",
      depart: null, ret: null, flexDays: 0, month: ((today.getUTCMonth() + i) % 12) + 1, nights: GUIDE_NIGHTS, vibes: [], stay: "good_hotel",
    };
    for (const c of pricedCandidates(input, data)) {
      const perPerson = (totalBudget(input) + c.shortTND) / travelersOf(input);
      best.set(c.country, Math.min(best.get(c.country) ?? Infinity, perPerson));
    }
  }
  return data.countries
    .filter((c) => best.has(c.code))
    .map((c) => ({ code: c.code, featured: c.featured, minPerPersonTND: ceil50(best.get(c.code)!) }))
    .sort((a, b) => a.minPerPersonTND - b.minPerPersonTND);
}

/** One-tap ways out of "too tight": each is set only when it really leads to a trip. */
export interface BudgetFixes {
  /** Budget per person that brings a trip (when the slider can reach it). */
  budgetTND?: number;
  /** The longest shorter trip that fits the current budget. */
  nights?: number;
  /** The nearest other month a trip of the same length fits the current budget. */
  month?: number;
}

const addDaysISO = (iso: string, n: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);

export function budgetFixes(input: BrainInput, data: BuilderData, minPerPersonTND: number, maxBudgetTND: number): BudgetFixes {
  const fixes: BudgetFixes = {};
  if (input.budgetScope === "per_person" && minPerPersonTND <= maxBudgetTND) fixes.budgetTND = minPerPersonTND;
  const nights = tripNights(input) ?? 0;
  for (let n = nights - 1; n >= 3; n--) {
    const shorter = input.depart ? { ...input, ret: addDaysISO(input.depart, n) } : { ...input, nights: n };
    if (pickTwo(shorter, data).status === "ok") {
      fixes.nights = n;
      break;
    }
  }
  const from = input.month ?? (input.depart ? Number(input.depart.slice(5, 7)) : null);
  if (from && nights) {
    for (let i = 1; i < 12; i++) {
      const month = ((from - 1 + i) % 12) + 1;
      if (pickTwo({ ...input, depart: null, ret: null, flexDays: 0, month, nights }, data).status === "ok") {
        fixes.month = month;
        break;
      }
    }
  }
  return fixes;
}

/** The first is the best match; the second says what it's better at (or that it needs a bigger budget). */
export function labelPicks<T extends Pick>(picks: T[]): T[] {
  return picks.map((p, i) => ({
    ...p,
    label: !p.fits ? "stretch" : i === 0 ? "best_match" : p.priced.tripCostTND < picks[0].priced.tripCostTND ? "best_value" : "best_experience",
  }));
}
