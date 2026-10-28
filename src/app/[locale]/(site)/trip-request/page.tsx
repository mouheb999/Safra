import type { Metadata } from "next";
import { TripRequestForm, type BrainCheckoutTrip } from "@/components/request/TripRequestForm";
import { VisaRequest } from "@/components/request/VisaRequest";
import { getMessages } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { fmt } from "@/i18n/fmt";
import { routeLocale, type LocaleParams } from "@/i18n/server";
import { pick } from "@/data/translations";
import { cleanTrip, priceTrip } from "@/lib/brain/builder";
import { decodeBuild } from "@/lib/brain/input";
import { getBookingConfig, getBrainData, getCheckoutConfig, getDestinations, getPacks, getVisaServices } from "@/lib/catalog";
import { parseTripRequestParams, type SearchParams } from "@/lib/search-params";
import { pageMetadata } from "@/lib/site";

type Props = LocaleParams & { searchParams: Promise<SearchParams> };

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await routeLocale(params);
  return pageMetadata(locale, { ...getMessages(locale).meta.tripRequest, path: "/trip-request", noindex: true });
}

/** ?build= from "Find my trip": the trip the visitor built, re-priced here (never trusted from the URL). */
async function builtTrip(sp: SearchParams, locale: Locale): Promise<BrainCheckoutTrip | undefined> {
  const encoded = typeof sp.build === "string" ? sp.build : undefined;
  const build = decodeBuild(encoded);
  if (!encoded || !build) return undefined;
  const data = await getBrainData();
  const trip = cleanTrip(build.input, build.trip, data);
  const priced = priceTrip(build.input, trip, data);
  const country = data.countries.find((c) => c.code === trip.country);
  if (!priced || !country || trip.stops.length === 0) return undefined;
  const t = getMessages(locale).brain;
  const place = (slug: string) => {
    const b = data.bases.find((x) => x.slug === slug)!;
    return pick(b.translations, locale, "place", b.place);
  };
  return {
    build: encoded,
    countryName: pick(country.translations, locale, "name", country.name),
    image: country.image,
    itinerary: trip.stops.map((s) => fmt(t.nightsIn, { place: place(s.slug), n: s.nights })).join(" + "),
    tripCostTND: Math.round(priced.tripCostTND / 10) * 10,
  };
}

// Supports ?mode=direct (destination typed in) and ?mode=visa (&service=slug), plus the answers carried from the quiz.
export default async function TripRequestPage({ params, searchParams }: Props) {
  const locale = await routeLocale(params);
  const [sp, destinations, booking, checkout] = await Promise.all([
    searchParams,
    getDestinations(locale),
    getBookingConfig(),
    getCheckoutConfig(),
  ]);
  const prefill = parseTripRequestParams(sp, "trip", destinations);
  const selected = destinations.find((d) => d.slug === prefill.selectedSlug);
  // ?pack= from "Our packs": the summary shows the pack, and its name is noted on the request.
  const pack = typeof sp.pack === "string" ? (await getPacks(locale)).find((p) => p.slug === sp.pack) : undefined;
  const brainTrip = await builtTrip(sp, locale);
  const destination = brainTrip
    ? { title: brainTrip.countryName, country: brainTrip.itinerary, image: brainTrip.image }
    : pack
    ? { title: pack.title, country: pack.country, image: pack.image }
    : selected
      ? { title: selected.title, country: selected.country, image: selected.cardImage.src }
      : undefined;
  const service = typeof sp.service === "string" ? sp.service : undefined;
  return (
    <main className="py-10">
      {prefill.mode === "visa" ? (
        <VisaRequest services={await getVisaServices(locale)} booking={booking} category={prefill.category} initialSlug={service} />
      ) : (
        <TripRequestForm prefill={prefill} booking={booking} checkout={checkout} destination={destination} packTitle={pack?.title} brainTrip={brainTrip} />
      )}
    </main>
  );
}
