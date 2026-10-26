"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useI18n } from "@/i18n/client";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Nav() {
  const { t, href } = useI18n();
  const links = [
    { path: "/experiences", label: t.nav.experiences },
    { path: "/safari", label: t.nav.safari },
    { path: "/visas", label: t.nav.visa },
  ];

  return (
    <header className="px-4 pt-4 sm:px-7 sm:pt-5">
      <nav className="mx-auto flex max-w-[1180px] items-center justify-between gap-3 rounded-[28px] bg-white/80 px-4 py-3 shadow-[0_6px_24px_rgba(32,61,53,0.08)] sm:px-6">
        <Link href={href("/")} className="text-[22px] font-black tracking-[0.06em] sm:text-2xl">
          SAFRA
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          <ul className="hidden items-center gap-4 text-[15px] font-bold md:flex">
            {links.map((l) => (
              <li key={l.path}>
                <Link href={href(l.path)} className="hover:text-orange">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href={href("/find-my-trip")}
            className="rounded-full bg-ink px-3 py-2.5 text-sm font-extrabold whitespace-nowrap text-cream hover:opacity-90 sm:px-5"
          >
            {t.nav.planTrip}
          </Link>
          {/* useSearchParams needs a Suspense boundary on statically rendered pages. */}
          <Suspense fallback={null}>
            <LanguageSwitcher />
          </Suspense>
        </div>
      </nav>
    </header>
  );
}
