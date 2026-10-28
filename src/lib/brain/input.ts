// The questionnaire's answers (the brain's section 3 input): validation shared by the server action,
// the checkout and the links between them. Client-safe.

import { z } from "zod";
import { GROUP_TYPES, STAY_TYPES } from "@/data/brain";
import { VIBE_OPTIONS } from "@/lib/quiz";
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

/** URL-safe encoding, so a chosen option can be carried to the checkout and recomputed there. */
export function encodeBrainInput(input: BrainInput): string {
  const bytes = new TextEncoder().encode(JSON.stringify(input));
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

export function decodeBrainInput(value: string | undefined): BrainInput | null {
  if (!value || value.length > 2000) return null;
  try {
    const binary = atob(value.replaceAll("-", "+").replaceAll("_", "/"));
    const json = new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
    return parseBrainInput(JSON.parse(json));
  } catch {
    return null;
  }
}
