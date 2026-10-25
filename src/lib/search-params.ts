// Server-side parsing of the query strings the pages hand to each other
// (quiz → /trip → /trip-request). Same rules the Framer components applied in the browser.

import { clampBudget } from "./budget";
import { findDestination, type Destination } from "@/data/destinations";

export type SearchParams = Record<string, string | string[] | undefined>;

function param(sp: SearchParams, key: string): string {
  const value = sp[key];
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

function positiveNumber(raw: string): number | null {
  if (!raw.trim()) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

// ---------- /trip ----------

export interface TripExperienceParams {
  destination: Destination;
  when: string;
  travelers: string;
  category: string;
  duration: string;
  budget: number | null;
  match: number | null;
  range: { min: number; max: number } | null;
}

export function parseTripExperienceParams(sp: SearchParams, catalog: Destination[]): TripExperienceParams {
  const match = Number(param(sp, "match"));
  const hasMatch = param(sp, "match").trim() !== "" && Number.isFinite(match);
  const rangeMin = Number(param(sp, "rangemin"));
  const rangeMax = Number(param(sp, "rangemax"));
  const budget = positiveNumber(param(sp, "budget"));

  return {
    destination: findDestination(catalog, param(sp, "destination")) ?? catalog[0],
    when: param(sp, "when").slice(0, 100),
    travelers: param(sp, "travelers").slice(0, 50),
    category: param(sp, "category").slice(0, 50),
    duration: param(sp, "duration").slice(0, 50),
    budget: budget === null ? null : Math.round(budget),
    match: hasMatch ? Math.max(0, Math.min(99, Math.round(match))) : null,
    range:
      Number.isFinite(rangeMin) && Number.isFinite(rangeMax) && rangeMin > 0 && rangeMax >= rangeMin
        ? { min: Math.round(rangeMin), max: Math.round(rangeMax) }
        : null,
  };
}

// ---------- /trip-request & /visas ----------

export type RequestMode = "trip" | "direct" | "visa";

export interface TripRequestPrefill {
  mode: RequestMode;
  /** Destination picked upstream (quiz or /trip); empty when the visitor arrived directly. */
  selectedSlug: string;
  selectedCountry: string;
  desiredDestination: string;
  category: string;
  preferredDate: string;
  travelers: string;
  durationDays: string;
  budgetDT: string;
}

export function parseTripRequestParams(
  sp: SearchParams,
  defaultMode: RequestMode,
  catalog: Destination[],
): TripRequestPrefill {
  const modeParam = param(sp, "mode").toLowerCase();
  const mode: RequestMode = modeParam === "direct" || modeParam === "visa" ? modeParam : defaultMode;

  const selected = findDestination(catalog, param(sp, "destination"));
  const selectedCountry = selected?.country ?? "";
  const desiredDestination = (param(sp, "desiredDestination") || selectedCountry).slice(0, 120);

  // "when" may be "Next month" or "2026-11-02 → 2026-11-09"; only a real date prefills the date input.
  const isoDate = param(sp, "when").slice(0, 100).match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? "";
  const preferredDate = isoDate && !Number.isNaN(new Date(isoDate).getTime()) ? isoDate : "";

  // The quiz budget is per traveler; the form asks for the party total.
  const budgetPerTraveler = param(sp, "budget").replace(/[^\d]/g, "").slice(0, 8);
  const rawTravelers = param(sp, "travelers").trim();
  const travelerLabel = rawTravelers.toLowerCase();
  let travelers = rawTravelers.replace(/[^\d]/g, "").slice(0, 3);
  let blankTravelers = false;
  if (!travelers) {
    if (travelerLabel === "couple") travelers = "2";
    else if (travelerLabel === "just me") travelers = "1";
    else if (travelerLabel === "friends" || travelerLabel === "family") blankTravelers = true;
  }

  let budgetDT = "";
  const perTraveler = Number(budgetPerTraveler);
  if (budgetPerTraveler && perTraveler > 0) {
    if (Number(travelers) >= 1) budgetDT = String(perTraveler * Number(travelers));
    else if (!blankTravelers) budgetDT = budgetPerTraveler;
  }

  const durationQuery = param(sp, "duration").toLowerCase();
  const durationNumber = Number(durationQuery.match(/\d+/)?.[0]);
  const durationDays =
    durationNumber > 0 ? String(durationQuery.includes("week") ? durationNumber * 7 : durationNumber) : "";

  return {
    mode,
    selectedSlug: selected?.slug ?? "",
    selectedCountry,
    desiredDestination,
    category: param(sp, "category").slice(0, 50),
    preferredDate,
    travelers: Number(travelers) >= 1 ? travelers : blankTravelers ? "" : "1",
    durationDays,
    budgetDT,
  };
}

// ---------- /find-my-trip ----------

export interface QuizPrefill {
  budget: number | null;
  category: string;
}

export function parseQuizParams(sp: SearchParams): QuizPrefill {
  const budget = positiveNumber(param(sp, "budget"));
  return { budget: budget === null ? null : clampBudget(budget), category: param(sp, "category").toLowerCase() };
}
