import type { Metadata } from "next";
import { BrainQuiz } from "@/components/quiz/BrainQuiz";
import { getMessages } from "@/i18n";
import { routeLocale, type LocaleParams } from "@/i18n/server";
import { getSiteSettings } from "@/lib/catalog";
import { parseQuizParams, type SearchParams } from "@/lib/search-params";
import { pageMetadata } from "@/lib/site";

type Props = LocaleParams & { searchParams: Promise<SearchParams> };

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await routeLocale(params);
  return pageMetadata(locale, { ...getMessages(locale).meta.findMyTrip, path: "/find-my-trip" });
}

export default async function FindMyTripPage({ params, searchParams }: Props) {
  await routeLocale(params);
  const [sp, settings] = await Promise.all([searchParams, getSiteSettings()]);
  return (
    <main className="px-4 py-10 sm:px-7">
      <BrainQuiz prefill={parseQuizParams(sp)} whatsappNumber={settings.whatsappNumber} />
    </main>
  );
}
