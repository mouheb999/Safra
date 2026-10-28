// The questionnaire's answers (the brain's section 3 input): validation shared by the server action,
// the checkout and the links between them. Client-safe.

import { z } from "zod";
import { GROUP_TYPES, STAY_TYPES } from "@/data/brain";
import { VIBE_OPTIONS } from "@/lib/quiz";
import type { BuiltTrip } from "./builder";
import type { BrainInput } from "./engine";

const isoDate = z.union([z.iso.date(), z.null()]);

export const brainInputSchema = z
  .object({
    budgetTND: z.number().int().min(100).max(1_000_000),
    budgetScope: z.enum(["total", "per_person"]),
    adults: z.number().int().min(1).max(20),
    children: z.number().int().min(0).max(10),
    childAges: z.array(z.number().int().min(0).max(17)).max(10),
    group: z.enum(GROUP_TYPES),
    depart: isoDate,
    ret: isoDate,
    flexDays: z.number().int().min(0).max(7),
    month: z.number().int().min(1).max(12).nullable(),
    nights: z.number().int().min(1).max(60).nullable(),
    vibes: z.array(z.enum(VIBE_OPTIONS)).max(3),
    stay: z.enum(STAY_TYPES),
  })
  .refine((i) => !i.depart || !i.ret || i.ret > i.depart, "Return must be after departure.");

export const parseBrainInput = (value: unknown): BrainInput | null => {
  const parsed = brainInputSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
};

const slug = z.string().regex(/^[a-z0-9-]{2,40}$/);

export const builtTripSchema = z.object({
  country: slug,
  stops: z
    .array(
      z.object({
        slug,
        nights: z.number().int().min(1).max(30),
        stay: z.enum(STAY_TYPES),
        activities: z.array(z.string().max(120)).max(12),
      }),
    )
    .min(1)
    .max(5)
    .refine((stops) => stops.reduce((n, s) => n + s.nights, 0) <= 60, "At most 60 nights."),
});

export interface EncodedBuild {
  input: BrainInput;
  trip: BuiltTrip;
}

const buildSchema = z.object({ input: brainInputSchema, trip: builtTripSchema });

function encode(value: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function decode(value: string | undefined, max: number): unknown {
  if (!value || value.length > max) return null;
  try {
    const binary = atob(value.replaceAll("-", "+").replaceAll("_", "/"));
    return JSON.parse(new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0))));
  } catch {
    return null;
  }
}

/** URL-safe encoding of the answers + the trip the visitor built, carried to the checkout and recomputed there. */
export const encodeBuild = (build: EncodedBuild) => encode(build);

export function decodeBuild(value: string | undefined): EncodedBuild | null {
  const parsed = buildSchema.safeParse(decode(value, 6000));
  return parsed.success ? parsed.data : null;
}
