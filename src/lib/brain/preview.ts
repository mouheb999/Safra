// What "Surprise me" shows before payment: the 2 trips' places, nights, weather, total cost and the shape of
// the day-by-day program (day numbers and places only). The money split, hotels, areas, activity names and the
// plan itself never leave the server; the browser blurs placeholder text where they would be.

import type { Locale } from "@/i18n/config";
import { pick as tr } from "../../data/translations.ts";
import type { BrainInput, Season } from "./engine";
import type { BuilderData } from "./builder";
import { pickTwo, type PickLabel } from "./surprise.ts";

export interface ProgramDay {
  day: number;
  place: string;
  kind: "arrive" | "stay" | "move" | "depart";
}

export interface SurpriseOption {
  country: string;
  countryName: string;
  image: string;
  label: PickLabel;
  stops: { place: string; nights: number }[];
  season: Season;
  vibesMatched: string[];
  tripCostTND: number;
  pocketPerPersonPerDay: number;
  fits: boolean;
  missingTND: number;
  activityCount: number;
  days: ProgramDay[];
}

export type SurprisePreview =
  | { status: "need_info" }
  | { status: "ok"; options: SurpriseOption[]; nights: number; travelers: number; totalBudgetTND: number };

const round50 = (n: number) => Math.round(n / 50) * 50;

/** Day 1 arrives at the first place; each move to the next place is its own day; the last day flies home. */
export function programDays(stops: { place: string; nights: number }[]): ProgramDay[] {
  const days: ProgramDay[] = [];
  stops.forEach((s, i) => {
    for (let n = 0; n < s.nights; n++) {
      days.push({ day: days.length + 1, place: s.place, kind: n === 0 ? (i === 0 ? "arrive" : "move") : "stay" });
    }
  });
  if (stops.length) days.push({ day: days.length + 1, place: stops[stops.length - 1].place, kind: "depart" });
  return days;
}

export function buildPreview(input: BrainInput, data: BuilderData, locale: Locale): SurprisePreview {
  const result = pickTwo(input, data);
  if (result.status === "need_info" || result.picks.length === 0) return { status: "need_info" };
  const first = result.picks[0].priced;
  return {
    status: "ok",
    nights: first.targetNights,
    travelers: first.travelers,
    totalBudgetTND: first.totalBudgetTND,
    options: result.picks.map((p) => {
      const country = data.countries.find((c) => c.code === p.country)!;
      const stops = p.trip.stops.map((s) => {
        const base = data.bases.find((b) => b.slug === s.slug)!;
        return { place: tr(base.translations, locale, "place", base.place), nights: s.nights };
      });
      return {
        country: p.country,
        countryName: tr(country.translations, locale, "name", country.name),
        image: country.image,
        label: p.label,
        stops,
        season: p.season,
        vibesMatched: p.vibesMatched,
        tripCostTND: round50(p.priced.tripCostTND),
        pocketPerPersonPerDay: Math.max(0, Math.floor(p.priced.pocketPerPersonPerDay / 5) * 5),
        fits: p.fits,
        missingTND: p.missingTND,
        activityCount: p.trip.stops.reduce((n, s) => n + s.activities.length, 0),
        days: programDays(stops),
      };
    }),
  };
}
