import type { Metadata } from "next";
import { BrainQuiz } from "@/components/quiz/BrainQuiz";
import { getMessages } from "@/i18n";
import { routeLocale, type LocaleParams } from "@/i18n/server";
import { getCheckoutConfig, getSiteSettings } from "@/lib/catalog";
import { availableOnlineMethods } from "@/lib/payments";
import { parseQuizParams, type SearchParams } from "@/lib/search-params";
import { pageMetadata } from "@/lib/site";

type Props = LocaleParams & { searchParams: Promise<SearchParams> };

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await routeLocale(params);
  return pageMetadata(locale, { ...getMessages(locale).meta.findMyTrip, path: "/find-my-trip" });
}

export default async function FindMyTripPage({ params, searchParams }: Props) {
  await routeLocale(params);
  const [sp, checkout, settings] = await Promise.all([searchParams, getCheckoutConfig(), getSiteSettings()]);
  return (
    <main className="px-4 py-10 sm:px-7">
      <BrainQuiz
        prefill={parseQuizParams(sp)}
        planPriceDT={checkout.planPriceDT}
        payOnline={availableOnlineMethods(checkout.accounts).length > 0}
        whatsappNumber={settings.whatsappNumber}
      />
    </main>
  );
}
