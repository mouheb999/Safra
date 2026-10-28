import type { Metadata } from "next";
import { BrainQuiz } from "@/components/quiz/BrainQuiz";
import { getMessages } from "@/i18n";
import { routeLocale, type LocaleParams } from "@/i18n/server";
import type { BuilderData } from "@/lib/brain/builder";
import { getBrainData } from "@/lib/catalog";
import { parseQuizParams, type SearchParams } from "@/lib/search-params";
import { pageMetadata } from "@/lib/site";

type Props = LocaleParams & { searchParams: Promise<SearchParams> };

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await routeLocale(params);
  return pageMetadata(locale, { ...getMessages(locale).meta.findMyTrip, path: "/find-my-trip" });
}

export default async function FindMyTripPage({ params, searchParams }: Props) {
  await routeLocale(params);
  const [sp, brain] = await Promise.all([searchParams, getBrainData()]);
  // The builder prices trips in the browser; the areas SAFRA recommends stay in the paid plan.
  const data: BuilderData = { ...brain, bases: brain.bases.map((b) => ({ ...b, stayAreas: [] })) };
  return (
    <main className="px-4 py-10 sm:px-7">
      <BrainQuiz prefill={parseQuizParams(sp)} data={data} />
    </main>
  );
}
