"use server";

// "Surprise me": the questionnaire's answers → the 2 best trips, as a locked preview (src/lib/brain/preview.ts).

import { isLocale } from "@/i18n/config";
import { parseBrainInput } from "@/lib/brain/input";
import { buildPreview, type SurprisePreview } from "@/lib/brain/preview";
import { getBrainData } from "@/lib/catalog";

export async function surpriseMe(answers: unknown, locale: string): Promise<SurprisePreview> {
  const input = parseBrainInput(answers);
  if (!input) return { status: "need_info" };
  return buildPreview(input, await getBrainData(), isLocale(locale) ? locale : "en");
}
