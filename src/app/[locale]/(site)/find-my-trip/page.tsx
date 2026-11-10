import type { Metadata } from "next";
import { BrainQuiz } from "@/components/quiz/BrainQuiz";
import { getMessages } from "@/i18n";
import { routeLocale, type LocaleParams } from "@/i18n/server";
import { pick } from "@/data/translations";
import type { TripStyle } from "@/lib/brain/engine";
import { budgetGuide } from "@/lib/brain/surprise";
import { getBrainData, getCheckoutConfig, getSiteSettings } from "@/lib/catalog";
import { availableOnlineMethods } from "@/lib/payments";
import { parseQuizParams, type SearchParams } from "@/lib/search-params";
import { pageMetadata } from "@/lib/site";

// Live prices (SerpApi) can take 10–20 s on a new search; give the server action and page room to wait.
export const maxDuration = 60;

type Props = LocaleParams & { searchParams: Promise<SearchParams> };

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await routeLocale(params);
  return pageMetadata(locale, { ...getMessages(locale).meta.findMyTrip, path: "/find-my-trip" });
}

export default async function FindMyTripPage({ params, searchParams }: Props) {
  const locale = await routeLocale(params);
  const [sp, checkout, settings, brain] = await Promise.all([searchParams, getCheckoutConfig(), getSiteSettings(), getBrainData()]);
  // The budget step's indicator, per kind of trip: what a typical week costs per person in each destination.
  const named = (style: TripStyle) =>
    budgetGuide(brain, new Date(), style).map((g) => {
      const country = brain.countries.find((c) => c.code === g.code)!;
      return { ...g, name: pick(country.translations, locale, "name", country.name) };
    });
  const guides = { standard: named("standard"), luxury: named("luxury") };
  return (
    <main className="px-4 py-10 sm:px-7">
      <BrainQuiz
        prefill={parseQuizParams(sp)}
        planPriceDT={checkout.planPriceDT}
        payOnline={availableOnlineMethods(checkout.accounts).length > 0}
        assist={checkout.assist}
        whatsappNumber={settings.whatsappNumber}
        guides={guides}
      />
    </main>
  );
}
