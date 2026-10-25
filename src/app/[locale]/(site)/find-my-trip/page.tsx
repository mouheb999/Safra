import type { Metadata } from "next";
import { TripQuiz } from "@/components/quiz/TripQuiz";
import { getMessages } from "@/i18n";
import { routeLocale, type LocaleParams } from "@/i18n/server";
import { getDestinations } from "@/lib/catalog";
import { parseQuizParams, type SearchParams } from "@/lib/search-params";
import { pageMetadata } from "@/lib/site";

type Props = LocaleParams & { searchParams: Promise<SearchParams> };

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await routeLocale(params);
  return pageMetadata(locale, { ...getMessages(locale).meta.findMyTrip, path: "/find-my-trip" });
}

export default async function FindMyTripPage({ params, searchParams }: Props) {
  const locale = await routeLocale(params);
  const [sp, destinations] = await Promise.all([searchParams, getDestinations(locale)]);
  const prefill = parseQuizParams(sp);
  return (
    <main className="px-4 py-10 sm:px-7">
      <TripQuiz destinations={destinations} prefill={prefill} />
    </main>
  );
}
