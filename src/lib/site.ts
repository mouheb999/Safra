// Public site identity used for SEO (canonical URLs, hreflang, sitemap, social cards, structured data).

import type { Metadata } from "next";
import { defaultLocale, localizedPath, locales, openGraphLocale, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n";

/** Set NEXT_PUBLIC_SITE_URL on staging/preview deployments; production is safra.website. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://safra.website").replace(/\/$/, "");

export const SITE_NAME = "SAFRA";

/** hreflang map for a path: every language version + x-default (English). */
export function languageAlternates(path: string): Record<string, string> {
  return {
    ...Object.fromEntries(locales.map((l) => [l, localizedPath(l, path)])),
    "x-default": localizedPath(defaultLocale, path),
  };
}

/**
 * Title, description, canonical URL, hreflang and social card for a page in one language.
 * Next.js replaces (doesn't merge) the parent `openGraph` when a page sets its own, so every
 * field is spelled out here. `path` is the English path, e.g. "/visas".
 */
export function pageMetadata(
  locale: Locale,
  {
    title,
    description,
    path,
    image,
    noindex = false,
  }: { title: string; description: string; path: string; image?: { url: string; alt: string }; noindex?: boolean },
): Metadata {
  const t = getMessages(locale);
  return {
    title,
    description,
    alternates: { canonical: localizedPath(locale, path), languages: languageAlternates(path) },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: openGraphLocale[locale],
      title: `${title} · ${SITE_NAME}`,
      description,
      url: localizedPath(locale, path),
      images: [image ?? { url: "/opengraph-image", width: 1200, height: 630, alt: `${SITE_NAME} — ${t.meta.tagline}` }],
    },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}
