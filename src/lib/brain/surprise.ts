// "Surprise me": the 2 best trips for the visitor's answers, one per country (a good hotel when it fits, else a
// budget hotel). Focus destinations (Southeast Asia) lead: they're picked whenever they fit, or nearly fit, the
// budget; the other countries are the backup that fits smaller budgets. Pure: the server runs it for the preview
// and again, from the same answers, when the visitor orders (so the locked program never travels through the browser).

import type { StayType } from "../../data/brain";
import { priceTrip, type BuilderData, type BuiltTrip, type PricedTrip } from "./builder.ts";
import { suggestTrips, type BrainInput, type BrainOption, type Season } from "./engine.ts";

export type PickLabel = "best_match" | "best_value" | "best_experience" | "stretch";

export interface Pick {
  country: string;
  label: PickLabel;
  trip: BuiltTrip;
  priced: PricedTrip;
  season: Season;
  vibesMatched: string[];
  fits: boolean;
  /** Extra budget needed (whole trip) when it doesn't fit; 0 otherwise. */
  missingTND: number;
}

export type PickResult = { status: "need_info"; missing: string[] } | { status: "ok"; picks: Pick[] };

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

/** Every country's best trip for these answers, best first: the ones that fit, by score, then the closest. */
function rankCandidates(input: BrainInput, data: BuilderData): Candidate[] {
  return [...data.countries]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((c) => candidate(input, c.code, data))
    .filter((c): c is Candidate => c !== null)
    .sort((a, b) => Number(b.fits) - Number(a.fits) || b.score - a.score);
}

/** A focus trip this close to the budget (share of the total) is still suggested, with what it needs. */
export const NEAR_BUDGET_SHARE = 0.2;

/**
 * The 2 trips to show, focus destinations first:
 * - 2 focus trips that fit → both;
 * - 1 fits → it, then the next focus trip if it's within reach (≤ 20% over), else the best backup that fits;
 * - none fits → the closest focus trip (with what it needs), then the best backup that fits (or nearly fits).
 * Without focus destinations (none ticked), simply the 2 best.
 */
function chooseTwo(ranked: Candidate[], featured: Set<string>, totalBudgetTND: number): Candidate[] {
  const focus = ranked.filter((c) => featured.has(c.country));
  const backup = ranked.filter((c) => !featured.has(c.country));
  if (focus.length === 0) return ranked.slice(0, 2);
  const focusFits = focus.filter((c) => c.fits);
  const near = (c: Candidate) => !c.fits && -c.score <= totalBudgetTND * NEAR_BUDGET_SHARE;
  const backupFit = backup.find((c) => c.fits) ?? backup.find(near);
  const first = focusFits[0] ?? focus[0];
  const second = focusFits[1] ?? (focusFits.length ? focus.find(near) : undefined) ?? backupFit ?? focus.find((c) => c !== first) ?? backup[0];
  return [first, second].filter((c, i, all): c is Candidate => c !== undefined && all.indexOf(c) === i);
}

const totalBudget = (input: BrainInput) => (input.budgetScope === "per_person" ? input.budgetTND * (input.adults + input.children) : input.budgetTND);

/**
 * Country codes in pick order: the 2 picks, then the other focus destinations, then the backups (used to spend
 * live searches on the countries that can actually be picked).
 */
export function rankCountries(input: BrainInput, data: BuilderData): string[] {
  const ranked = rankCandidates(input, data);
  const featured = new Set(data.countries.filter((c) => c.featured).map((c) => c.code));
  const chosen = chooseTwo(ranked, featured, totalBudget(input)).map((c) => c.country);
  const rest = [...ranked.filter((c) => featured.has(c.country)), ...ranked.filter((c) => !featured.has(c.country))].map((c) => c.country);
  return [...new Set([...chosen, ...rest])];
}

export function pickTwo(input: BrainInput, data: BuilderData): PickResult {
  const probe = suggestTrips(input, [], data.bases, data.settings);
  if (probe.status === "need_info") return probe;

  const featured = new Set(data.countries.filter((c) => c.featured).map((c) => c.code));
  const ranked = chooseTwo(rankCandidates(input, data), featured, totalBudget(input));

  const picks = ranked.flatMap((c) => {
    const priced = priceTrip(input, c.trip, data);
    if (!priced) return [];
    return [{ ...c, priced, missingTND: c.fits ? 0 : Math.ceil(Math.max(0, -priced.marginTND) / 50) * 50 }];
  });

  return { status: "ok", picks: labelPicks(picks.map(({ score: _score, ...p }) => ({ ...p, label: "best_match" as PickLabel }))) };
}

/** The first is the best match; the second says what it's better at (or that it needs a bigger budget). */
export function labelPicks<T extends Pick>(picks: T[]): T[] {
  return picks.map((p, i) => ({
    ...p,
    label: !p.fits ? "stretch" : i === 0 ? "best_match" : p.priced.tripCostTND < picks[0].priced.tripCostTND ? "best_value" : "best_experience",
  }));
}
