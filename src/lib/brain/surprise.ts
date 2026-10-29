// "Surprise me": the 2 best trips for the visitor's answers, one per country. Trips that fit the budget come
// first (a good hotel when it fits, else a budget hotel), ranked by the engine's score; when fewer than 2 fit,
// the closest ones fill in, with what they'd still need. Pure: the server runs it for the preview and again,
// from the same answers, when the visitor orders (so the locked program never travels through the browser).

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

export function pickTwo(input: BrainInput, data: BuilderData): PickResult {
  const probe = suggestTrips(input, [], data.bases, data.settings);
  if (probe.status === "need_info") return probe;

  const ranked = [...data.countries]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((c) => candidate(input, c.code, data))
    .filter((c): c is Candidate => c !== null)
    .sort((a, b) => Number(b.fits) - Number(a.fits) || b.score - a.score)
    .slice(0, 2);

  const picks = ranked.flatMap((c) => {
    const priced = priceTrip(input, c.trip, data);
    if (!priced) return [];
    return [{ ...c, priced, missingTND: c.fits ? 0 : Math.ceil(Math.max(0, -priced.marginTND) / 50) * 50 }];
  });

  // The first is the best match; the second says what it's better at (or that it needs a bigger budget).
  return {
    status: "ok",
    picks: picks.map(({ score: _score, ...p }, i) => ({
      ...p,
      label: !p.fits ? "stretch" : i === 0 ? "best_match" : p.priced.tripCostTND < picks[0].priced.tripCostTND ? "best_value" : "best_experience",
    })),
  };
}
