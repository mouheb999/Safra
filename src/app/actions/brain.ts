"use server";

// Mode A of the trip brain: the questionnaire's answers → the locked preview of up to 3 trips.

import { isLocale } from "@/i18n/config";
import { parseBrainInput } from "@/lib/brain/input";
import { buildPreview, type BrainPreview } from "@/lib/brain/preview";
import { getBrainData } from "@/lib/catalog";

export async function suggestBrainTrips(answers: unknown, locale: string): Promise<BrainPreview> {
  const input = parseBrainInput(answers);
  if (!input) return { status: "need_info", missing: ["answers"] };
  return buildPreview(input, await getBrainData(), isLocale(locale) ? locale : "en");
}
