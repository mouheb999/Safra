import type { MetadataRoute } from "next";
import { locales, localizedPath } from "@/i18n/config";
import { getDestinations } from "@/lib/catalog";
import { SITE_URL, languageAlternates } from "@/lib/site";

// Re-read the catalog with the public pages, so new destinations appear here too.
export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const destinations = await getDestinations();
  const absolute = (map: Record<string, string>) =>
    Object.fromEntries(Object.entries(map).map(([lang, path]) => [lang, `${SITE_URL}${path}`]));

  // Every page once per language, each entry listing its translations (hreflang).
  const page = (path: string, priority: number, changeFrequency: "weekly" | "monthly" = "weekly") =>
    locales.map((locale) => ({
      url: `${SITE_URL}${localizedPath(locale, path)}`,
      changeFrequency,
      priority,
      alternates: { languages: absolute(languageAlternates(path)) },
    }));

  return [
    ...page("/", 1),
    ...page("/find-my-trip", 0.9),
    ...page("/packs", 0.9),
    ...page("/visas", 0.8),
    ...destinations.flatMap((d) => page(`/trip?destination=${d.slug}`, 0.7)),
  ];
}
