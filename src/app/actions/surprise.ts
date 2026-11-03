"use server";

// "Surprise me": the questionnaire's answers → the 2 best trips with the day's prices where available
// (src/lib/live), as a locked preview (src/lib/brain/preview.ts).

import { isLocale } from "@/i18n/config";
import { parseBrainInput } from "@/lib/brain/input";
import { previewFromPicks, type SurprisePreview } from "@/lib/brain/preview";
import { pickTwoWithLivePrices } from "@/lib/live/server";

export async function surpriseMe(answers: unknown, locale: string): Promise<SurprisePreview> {
  const input = parseBrainInput(answers);
  if (!input) return { status: "need_info" };
  const { result, data, live } = await pickTwoWithLivePrices(input);
  return previewFromPicks(result, data, isLocale(locale) ? locale : "en", live);
}
