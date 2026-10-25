import type { Metadata } from "next";
import { TripExperience } from "@/components/trip/TripExperience";
import { routeLocale, type LocaleParams } from "@/i18n/server";
import { getDestinations } from "@/lib/catalog";
import { parseTripExperienceParams, type SearchParams } from "@/lib/search-params";
import { pageMetadata } from "@/lib/site";

type Props = LocaleParams & { searchParams: Promise<SearchParams> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const locale = await routeLocale(params);
  const { destination: d } = parseTripExperienceParams(await searchParams, await getDestinations(locale));
  // One canonical URL per destination, whatever quiz answers ride along in the query string.
  return pageMetadata(locale, {
    title: `${d.title}, ${d.country}`,
    description: d.description,
    path: `/trip?destination=${d.slug}`,
    image: { url: d.heroImage.src, alt: d.heroImage.alt },
  });
}

export default async function TripPage({ params, searchParams }: Props) {
  const locale = await routeLocale(params);
  const trip = parseTripExperienceParams(await searchParams, await getDestinations(locale));
  return (
    <main className="py-10">
      <TripExperience params={trip} locale={locale} />
    </main>
  );
}
