// The locked preview (brain section 5): what the client may see of the engine's result.
// Places, nights, label, season, rounded money — never stay areas, activity names or exact amounts.

import type { Locale } from "@/i18n/config";
import { pick } from "@/data/translations";
import type { BrainData } from "@/lib/catalog";
import { previewBudget, round50, suggestTrips, type Budget, type BrainInput, type Label, type Season } from "./engine";

export interface PreviewOption {
  country: string;
  countryName: string;
  image: string;
  label: Label;
  bases: { place: string; nights: number }[];
  season: Season;
  vibesMatched: string[];
  tripCostTND: number;
  budget: Budget;
  pocketPerPersonPerDay: number;
  adjustments: string[];
}

export type BrainPreview =
  | { status: "need_info"; missing: string[] }
  | { status: "ok"; options: PreviewOption[]; nights: number; travelers: number; totalBudgetTND: number }
  | {
      status: "no_fit";
      nights: number;
      travelers: number;
      totalBudgetTND: number;
      closest: { countryName: string; places: string[]; missingTND: number; fitsWithNights: number | null } | null;
    };

export function buildPreview(input: BrainInput, data: BrainData, locale: Locale): BrainPreview {
  const result = suggestTrips(input, data.countries, data.bases, data.settings);
  const country = (code: string) => data.countries.find((c) => c.code === code)!;
  const countryName = (code: string) => {
    const c = country(code);
    return pick(c.translations, locale, "name", c.name);
  };
  const place = (slug: string) => {
    const b = data.bases.find((x) => x.slug === slug)!;
    return pick(b.translations, locale, "place", b.place);
  };

  if (result.status === "need_info") return result;
  if (result.status === "no_fit") {
    return {
      status: "no_fit",
      nights: result.nights,
      travelers: result.travelers,
      totalBudgetTND: result.totalBudgetTND,
      closest: result.closest && {
        countryName: countryName(result.closest.country),
        places: result.closest.bases.map((b) => place(b.slug)),
        missingTND: result.closest.shortfallTND,
        fitsWithNights: result.closest.fitsWithNights,
      },
    };
  }
  return {
    status: "ok",
    nights: result.nights,
    travelers: result.travelers,
    totalBudgetTND: result.totalBudgetTND,
    options: result.options.map((o) => ({
      country: o.country,
      countryName: countryName(o.country),
      image: country(o.country).image,
      label: o.label,
      bases: o.bases.map((b) => ({ place: place(b.slug), nights: b.nights })),
      season: o.season,
      vibesMatched: o.vibesMatched,
      tripCostTND: round50(o.tripCostTND),
      budget: previewBudget(o.budget),
      pocketPerPersonPerDay: Math.floor(o.pocketPerPersonPerDay / 5) * 5,
      adjustments: o.adjustments,
    })),
  };
}
