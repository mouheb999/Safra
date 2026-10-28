"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { LocaleFlag } from "@/components/Flags";
import { useI18n } from "@/i18n/client";
import { LOCALE_COOKIE, localeNames, localizedPath, locales, splitLocale, type Locale } from "@/i18n/config";

/**
 * The three languages as flags in one pill (UK, France, Tunisia); the current one sits in a filled circle.
 * Each flag links to the same page in that language and remembers the choice, so unprefixed links follow it.
 * Plain links on purpose: switching reloads the document so <html lang dir> changes.
 */
export function LanguageSwitcher() {
  const { locale, t } = useI18n();
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const { path } = splitLocale(pathname);
  const target = (l: Locale) => `${localizedPath(l, path)}${search ? `?${search}` : ""}`;
  const remember = (l: Locale) => {
    document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
  };

  return (
    <div role="group" aria-label={t.nav.language} className="flex items-center gap-0.5 rounded-full border border-ink/10 bg-white p-1">
      {locales.map((l) => {
        const current = l === locale;
        return (
          <a
            key={l}
            href={target(l)}
            lang={l}
            hrefLang={l}
            aria-label={localeNames[l]}
            aria-current={current ? "true" : undefined}
            title={localeNames[l]}
            onClick={() => remember(l)}
            className={`grid size-9 place-items-center rounded-full transition-[background-color,opacity,filter] duration-200 ${
              current ? "bg-orange/25" : "opacity-55 grayscale-[.4] hover:opacity-100 hover:grayscale-0"
            }`}
          >
            <LocaleFlag locale={l} size={current ? 24 : 22} />
          </a>
        );
      })}
    </div>
  );
}
