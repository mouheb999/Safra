// "Find my trip" quiz: answer model + destination scoring (pure, no React).

import type { Destination, DurationBand, Traveler } from "@/data/destinations";
import type { Locale } from "@/i18n/config";
import { fmt, label } from "@/i18n/fmt";
import type { Messages } from "@/i18n/messages/en";
import { formatBudget } from "./budget";

export type QuizStep = "Budget" | "When" | "Duration" | "Travelers" | "Vibe" | "Loading" | "Results";
export const QUESTION_STEPS = ["Budget", "When", "Duration", "Travelers", "Vibe"] as const satisfies QuizStep[];

export const WHEN_OPTIONS = ["This month", "Next month", "Pick dates", "I’m flexible"] as const;
export const DURATION_OPTIONS: DurationBand[] = ["Weekend", "5–7 days", "8–12 days", "2+ weeks"];
export const TRAVELER_OPTIONS: Traveler[] = ["Just me", "Couple", "Friends", "Family"];
export const VIBE_OPTIONS = ["Beach", "Nightlife", "Adventure", "Nature", "Food", "City", "Culture", "Luxury"] as const;
export const MAX_VIBES = 3;

export type When = (typeof WHEN_OPTIONS)[number];

export interface QuizAnswers {
  budget: number;
  when: When | "";
  startDate: string;
  endDate: string;
  duration: DurationBand | "";
  travelers: Traveler | "";
  vibes: string[];
}

export interface QuizResult {
  destination: Destination;
  matchPercent: number;
  rangeMin: number;
  rangeMax: number;
  duration: string;
  tags: string[];
}

export function emptyAnswers(budget: number, vibes: string[] = []): QuizAnswers {
  return { budget, when: "", startDate: "", endDate: "", duration: "", travelers: "", vibes };
}

/** Vibes preselected when the quiz is opened from a category link (?category=safari). */
export function vibesForCategory(category: string): string[] {
  if (category === "safari") return ["Nature", "Adventure"];
  if (category === "experience" || category === "experiences") return ["Culture", "Food"];
  return [];
}

export function canContinue(step: QuizStep, a: QuizAnswers): boolean {
  switch (step) {
    case "Budget":
      return true;
    case "When":
      if (!a.when) return false;
      if (a.when !== "Pick dates") return true;
      return Boolean(a.startDate && a.endDate) && a.endDate >= a.startDate;
    case "Duration":
      return a.duration !== "";
    case "Travelers":
      return a.travelers !== "";
    case "Vibe":
      return a.vibes.length > 0;
    default:
      return false;
  }
}

/** "Next month", "2026-11-02 → 2026-11-09", or "—" when unanswered. */
export function whenSummary(a: QuizAnswers): string {
  if (a.when === "Pick dates") return `${a.startDate || "?"} → ${a.endDate || "?"}`;
  return a.when || "—";
}

function selectedMonth(a: QuizAnswers, now: Date): number | null {
  if (a.when === "This month") return now.getMonth() + 1;
  if (a.when === "Next month") return ((now.getMonth() + 1) % 12) + 1;
  if (a.when === "Pick dates" && a.startDate) {
    const parsed = new Date(a.startDate);
    if (!Number.isNaN(parsed.getTime())) return parsed.getMonth() + 1;
  }
  return null;
}

/**
 * Scores every destination the budget can reach (max ≈ 99):
 * budget fit 35 · vibe overlap 25 · duration 15 · traveler type 12 · season 12.
 * `shuffleSeed` rotates the top 3 for "Surprise me again".
 */
export function scoreDestinations(
  catalog: Destination[],
  a: QuizAnswers,
  shuffleSeed = 0,
  now = new Date(),
): QuizResult[] {
  const month = selectedMonth(a, now);

  const scored = catalog
    .filter((d) => a.budget >= d.minBudget)
    .map((d) => {
      const q = d.quiz;
      const center = (d.minBudget + d.maxBudget) / 2;
      const spread = Math.max(1, (d.maxBudget - d.minBudget) / 2);
      const budgetFit = a.budget > d.maxBudget ? 26 : Math.max(0, 35 - (Math.abs(a.budget - center) / spread) * 35);

      const vibeMatches = q.tags.filter((tag) => a.vibes.includes(tag)).length;
      const vibeScore = a.vibes.length > 0 ? (vibeMatches / a.vibes.length) * 25 : 10;

      const durationFits = a.duration !== "" && q.durationBands.includes(a.duration);
      const durationScore = durationFits ? 15 : a.duration ? 4 : 8;

      const travelerScore = a.travelers ? 12 * (q.travelerSuitability[a.travelers] ?? 0.45) : 8;

      const seasonScore =
        month && q.monthAffinity.includes(month) ? 12 : a.when && a.when !== "I’m flexible" ? 4 : 8;

      const score = budgetFit + vibeScore + durationScore + travelerScore + seasonScore;
      const rangeMax = Math.max(d.minBudget, Math.min(d.maxBudget, a.budget));
      const duration = durationFits
        ? (a.duration as DurationBand)
        : q.durationBands.includes("5–7 days")
          ? "5–7 days"
          : q.durationBands[0];

      return {
        result: {
          destination: d,
          matchPercent: Math.max(0, Math.min(99, Math.round(score))),
          rangeMin: d.minBudget,
          rangeMax,
          duration,
          tags: q.tags.slice(0, 3),
        },
        score,
        // Tie-break on the slug so the order is the same in every language.
        tie: d.slug.length % 7,
      };
    })
    .sort((x, y) => (x.score === y.score ? y.tie - x.tie : y.score - x.score))
    .slice(0, 3)
    .map((s) => s.result);

  if (scored.length <= 1) return scored;
  const rotation = shuffleSeed % scored.length;
  return [...scored.slice(rotation), ...scored.slice(0, rotation)];
}

/** The "Why SAFRA picked this for you" paragraph, in the page's language. */
export function reasonText(a: QuizAnswers, lead: string, t: Messages, locale: Locale): string {
  const r = t.quiz.reason;
  const answered = a.when !== "" || a.duration !== "" || a.travelers !== "" || a.vibes.length > 0;
  if (!answered) return r.incomplete;
  const when = whenSummary(a);
  return fmt(r.template, {
    budget: formatBudget(a.budget, locale),
    duration: a.duration ? label(t.options.duration, a.duration) : r.flexibleDuration,
    party: label(r.party, a.travelers || "none"),
    vibes: a.vibes.length > 0 ? a.vibes.map((v) => label(t.options.vibes, v)).join(r.list) : r.differentMoods,
    when: when === "—" ? r.flexibleTiming : label(t.options.when, when),
    lead,
  });
}

/** Link to /trip carrying the answers forward (English values; the page translates them). */
export function tripHref(r: QuizResult, a: QuizAnswers, queryCategory: string): string {
  const p = new URLSearchParams({ destination: r.destination.slug });
  const when = whenSummary(a);
  if (when !== "—") p.set("when", when);
  if (a.travelers) p.set("travelers", a.travelers);
  p.set("duration", r.duration || a.duration);
  p.set("budget", String(a.budget));
  p.set("match", String(r.matchPercent));
  p.set("rangemin", String(r.rangeMin));
  p.set("rangemax", String(r.rangeMax));
  const category = queryCategory || a.vibes[0]?.toLowerCase();
  if (category) p.set("category", category);
  return `/trip?${p}`;
}

export interface BudgetTeaser {
  destination: Destination;
  /** The budget reaches the destination's minimum (the same rule the quiz uses). */
  fits: boolean;
  /** Budget-only match (68–99) when it fits. */
  matchPercent: number;
  /** What the trip costs at this budget: from the minimum up to the budget (capped at the maximum). */
  rangeMin: number;
  rangeMax: number;
}

/**
 * Home page cards for a per-traveler budget: destinations the budget reaches first, best fit first
 * (budget closest to the middle of their range), then the rest from the cheapest.
 */
export function budgetTeasers(catalog: Destination[], budget: number): BudgetTeaser[] {
  const teasers = catalog.map((d) => {
    const fits = budget >= d.minBudget;
    const center = (d.minBudget + d.maxBudget) / 2;
    const spread = Math.max(1, (d.maxBudget - d.minBudget) / 2);
    // Inside the range: 0.6 (an edge) to 1 (the middle). Above it: from 0.6 down to 0.2 the more
    // budget would go unused, so a bigger budget brings the bigger trips forward.
    const fit =
      budget > d.maxBudget
        ? Math.max(0.2, 0.6 - (0.4 * (budget - d.maxBudget)) / d.maxBudget)
        : 1 - (0.4 * Math.abs(budget - center)) / spread;
    return {
      destination: d,
      fits,
      matchPercent: fits ? Math.round(60 + 39 * fit) : 0,
      rangeMin: d.minBudget,
      rangeMax: Math.max(d.minBudget, Math.min(d.maxBudget, budget)),
    };
  });
  return teasers.sort((x, y) =>
    x.fits !== y.fits
      ? Number(y.fits) - Number(x.fits)
      : x.fits
        ? y.matchPercent - x.matchPercent || x.destination.minBudget - y.destination.minBudget
        : x.destination.minBudget - y.destination.minBudget,
  );
}

/** /trip link for a home card, carrying the budget so the trip page shows the same range. */
export function teaserHref(t: BudgetTeaser, budget: number): string {
  const p = new URLSearchParams({ destination: t.destination.slug, budget: String(budget) });
  if (t.fits) {
    p.set("match", String(t.matchPercent));
    p.set("rangemin", String(t.rangeMin));
    p.set("rangemax", String(t.rangeMax));
  }
  return `/trip?${p}`;
}
