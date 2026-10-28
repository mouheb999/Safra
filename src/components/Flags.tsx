// Round flags for the language switcher. SVG rather than flag emoji: Windows shows emoji flags as
// plain letters ("GB", "FR", "TN"), so these look the same on every device.

import { useId } from "react";
import type { Locale } from "@/i18n/config";

/** Which flag stands for each language: English → UK, French → France, Arabic → Tunisia. */
export function LocaleFlag({ locale, size = 22 }: { locale: Locale; size?: number }) {
  const clip = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden className="block shrink-0">
      <clipPath id={clip}>
        <circle cx="12" cy="12" r="12" />
      </clipPath>
      <g clipPath={`url(#${clip})`}>{FLAGS[locale]}</g>
      <circle cx="12" cy="12" r="11.5" fill="none" stroke="rgba(32,61,53,.14)" />
    </svg>
  );
}

const FLAGS: Record<Locale, React.ReactNode> = {
  en: (
    <>
      <rect width="24" height="24" fill="#012169" />
      <path d="M0 0l24 24M24 0L0 24" stroke="#fff" strokeWidth="5" />
      <path d="M0 0l24 24M24 0L0 24" stroke="#C8102E" strokeWidth="1.8" />
      <path d="M12 0v24M0 12h24" stroke="#fff" strokeWidth="7" />
      <path d="M12 0v24M0 12h24" stroke="#C8102E" strokeWidth="4" />
    </>
  ),
  fr: (
    <>
      <rect width="8" height="24" fill="#002654" />
      <rect x="8" width="8" height="24" fill="#fff" />
      <rect x="16" width="8" height="24" fill="#CE1126" />
    </>
  ),
  ar: (
    <>
      <rect width="24" height="24" fill="#E70013" />
      <circle cx="12" cy="12" r="6.2" fill="#fff" />
      <circle cx="12" cy="12" r="4.6" fill="#E70013" />
      <circle cx="13.2" cy="12" r="3.7" fill="#fff" />
      <path fill="#E70013" d="M12.10 12.00L13.42 11.54L13.45 10.15L14.29 11.26L15.63 10.85L14.83 12.00L15.63 13.15L14.29 12.74L13.45 13.85L13.42 12.46Z" />
    </>
  ),
};
