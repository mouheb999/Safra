import type { Metadata } from "next";
import { TripRequestForm } from "@/components/request/TripRequestForm";
import { VisaRequest } from "@/components/request/VisaRequest";
import { getMessages } from "@/i18n";
import { routeLocale, type LocaleParams } from "@/i18n/server";
import { getBookingConfig, getDestinations, getVisaServices } from "@/lib/catalog";
import { parseTripRequestParams, type SearchParams } from "@/lib/search-params";
import { pageMetadata } from "@/lib/site";

type Props = LocaleParams & { searchParams: Promise<SearchParams> };

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await routeLocale(params);
  return pageMetadata(locale, { ...getMessages(locale).meta.tripRequest, path: "/trip-request", noindex: true });
}

// Supports ?mode=direct (destination typed in) and ?mode=visa (&service=slug), plus the answers carried from the quiz.
export default async function TripRequestPage({ params, searchParams }: Props) {
  const locale = await routeLocale(params);
  const [sp, destinations, booking] = await Promise.all([searchParams, getDestinations(locale), getBookingConfig()]);
  const prefill = parseTripRequestParams(sp, "trip", destinations);
  const service = typeof sp.service === "string" ? sp.service : undefined;
  return (
    <main className="py-10">
      {prefill.mode === "visa" ? (
        <VisaRequest services={await getVisaServices(locale)} booking={booking} category={prefill.category} initialSlug={service} />
      ) : (
        <TripRequestForm prefill={prefill} booking={booking} />
      )}
    </main>
  );
}
