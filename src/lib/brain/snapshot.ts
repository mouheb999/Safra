// What a trip-brain order stores (requests.quiz_answers): the answers, and the chosen trip recomputed
// by the server with the exact amounts, stay areas and activities. The admin request page reads it back.

import type { BrainData } from "@/lib/catalog";
import { suggestTrips, type BrainInput, type BrainOption } from "./engine.ts";

export const BRAIN_SNAPSHOT_KIND = "trip_brain";

export interface TripBrainSnapshot {
  kind: typeof BRAIN_SNAPSHOT_KIND;
  input: BrainInput;
  /** Country code of the trip the visitor chose. */
  choice: string;
  /** Null when the trip no longer fits with today's prices: SAFRA rebuilds it by hand. */
  option: (BrainOption & { countryName: string; places: Record<string, string> }) | null;
  nights: number | null;
  travelers: number | null;
  totalBudgetTND: number | null;
  /** The reference prices are starter estimates until SAFRA confirms them. */
  estimated: boolean;
  computedAt: string;
}

export function brainSnapshot(input: BrainInput, choice: string, data: BrainData, now = new Date()): TripBrainSnapshot {
  const result = suggestTrips(input, data.countries, data.bases, data.settings);
  const ok = result.status === "ok" ? result : null;
  const option = ok?.options.find((o) => o.country === choice) ?? null;
  const country = data.countries.find((c) => c.code === choice);
  return {
    kind: BRAIN_SNAPSHOT_KIND,
    input,
    choice,
    option: option && {
      ...option,
      countryName: country?.name ?? choice,
      places: Object.fromEntries(option.bases.map((b) => [b.slug, data.bases.find((x) => x.slug === b.slug)?.place ?? b.slug])),
    },
    nights: ok?.nights ?? null,
    travelers: ok?.travelers ?? null,
    totalBudgetTND: ok?.totalBudgetTND ?? null,
    estimated: ok ? ok.warnings.includes("estimated_prices") : true,
    computedAt: now.toISOString(),
  };
}

export function isBrainSnapshot(value: unknown): value is TripBrainSnapshot {
  return typeof value === "object" && value !== null && (value as { kind?: unknown }).kind === BRAIN_SNAPSHOT_KIND;
}
