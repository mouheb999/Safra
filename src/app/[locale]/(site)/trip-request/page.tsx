import type { Metadata } from "next";
import { TripRequestForm, type BrainCheckoutTrip } from "@/components/request/TripRequestForm";
import { VisaRequest } from "@/components/request/VisaRequest";
import { getMessages } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { fmt } from "@/i18n/fmt";
import { routeLocale, type LocaleParams } from "@/i18n/server";
import { pick } from "@/data/translations";
import { decodeInput } from "@/lib/brain/input";
import { pickTwo } from "@/lib/brain/surprise";
import { getBookingConfig, getBrainData, getCheckoutConfig, getDestinations, getPacks, getVisaServices } from "@/lib/catalog";
import { parseTripRequestParams, type SearchParams } from "@/lib/search-params";
import { pageMetadata } from "@/lib/site";

type Props = LocaleParams & { searchParams: Promise<SearchParams> };

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await routeLocale(params);
  return pageMetadata(locale, { ...getMessages(locale).meta.tripRequest, path: "/trip-request", noindex: true });
}

/** ?pick=&country= from "Find my trip": the chosen trip, rebuilt here from the answers (never sent in the URL). */
async function pickedTrip(sp: SearchParams, locale: Locale): Promise<BrainCheckoutTrip | undefined> {
  const encoded = typeof sp.pick === "string" ? sp.pick : undefined;
  const input = decodeInput(encoded);
  if (!encoded || !input || typeof sp.country !== "string") return undefined;
  const data = await getBrainData();
  const result = pickTwo(input, data);
  const chosen = result.status === "ok" ? result.picks.find((p) => p.country === sp.country) : undefined;
  const country = data.countries.find((c) => c.code === chosen?.country);
  if (!chosen || !country) return undefined;
  const { trip, priced } = chosen;
  const t = getMessages(locale).brain;
  const place = (slug: string) => {
    const b = data.bases.find((x) => x.slug === slug)!;
    return pick(b.translations, locale, "place", b.place);
  };
  return {
    pick: encoded,
    country: country.code,
    countryName: pick(country.translations, locale, "name", country.name),
    image: country.image,
    itinerary: trip.stops.map((s) => fmt(t.nightsIn, { place: place(s.slug), n: s.nights })).join(" + "),
    tripCostTND: Math.round(priced.tripCostTND / 50) * 50,
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
  const brainTrip = await pickedTrip(sp, locale);
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
