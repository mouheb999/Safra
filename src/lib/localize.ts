// Catalog items in the visitor's language. Missing translations fall back to English field by field.

import type { Destination } from "@/data/destinations";
import type { Safari } from "@/data/safaris";
import { pick } from "@/data/translations";
import type { VisaService } from "@/data/visas";
import type { Locale } from "@/i18n/config";

export function localizeDestination(d: Destination, locale: Locale): Destination {
  if (locale === "en") return d;
  const t = d.translations;
  return {
    ...d,
    country: pick(t, locale, "country", d.country),
    title: pick(t, locale, "title", d.title),
    description: pick(t, locale, "description", d.description),
    highlights: pick(t, locale, "highlights", d.highlights),
    duration: pick(t, locale, "duration", d.duration),
    heroImage: { ...d.heroImage, alt: pick(t, locale, "heroAlt", d.heroImage.alt) },
    cardImage: { ...d.cardImage, alt: pick(t, locale, "cardAlt", d.cardImage.alt) },
    teaser: { ...d.teaser, duration: pick(t, locale, "teaserDuration", d.teaser.duration) },
  };
}


export function localizeVisaService(v: VisaService, locale: Locale): VisaService {
  if (locale === "en") return v;
  const t = v.translations;
  return {
    ...v,
    name: pick(t, locale, "name", v.name),
    country: pick(t, locale, "country", v.country),
    description: v.description ? pick(t, locale, "description", v.description) : (t?.[locale]?.description ?? ""),
    includes: pick(t, locale, "includes", v.includes),
    documents: pick(t, locale, "documents", v.documents),
  };
}
