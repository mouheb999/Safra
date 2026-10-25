"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { GlobeIcon } from "@/components/icons";
import { useI18n } from "@/i18n/client";
import { LOCALE_COOKIE, localeNames, localizedPath, locales, splitLocale, type Locale } from "@/i18n/config";

/** Same page in another language; remembers the choice so unprefixed links follow it. */
export function LanguageSwitcher() {
  const { locale, t } = useI18n();
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const { path } = splitLocale(pathname);
  const target = (l: Locale) => `${localizedPath(l, path)}${search ? `?${search}` : ""}`;
  const remember = (l: Locale) => {
    document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={t.nav.language}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-ink/10 bg-white px-3 py-2 text-[13px] font-bold"
      >
        <GlobeIcon size={14} color="#317DA1" strokeWidth={2} />
        <span className="uppercase">{locale}</span>
        <span aria-hidden>▾</span>
      </button>
      {open ? (
        <ul className="absolute end-0 top-full z-30 m-0 mt-2 grid min-w-[150px] list-none gap-0.5 rounded-2xl border border-ink/10 bg-white p-1.5 shadow-[0_12px_28px_rgba(32,61,53,.14)]">
          {locales.map((l) => (
            <li key={l}>
              {/* Plain link: switching language reloads the document so <html lang dir> changes. */}
              <a
                href={target(l)}
                lang={l}
                hrefLang={l}
                aria-current={l === locale ? "true" : undefined}
                onClick={() => remember(l)}
                className={`block rounded-xl px-3 py-2 text-sm font-bold ${l === locale ? "bg-orange/20" : "hover:bg-ink/5"}`}
              >
                {localeNames[l]}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
