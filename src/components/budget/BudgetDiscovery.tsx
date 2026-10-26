"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Destination } from "@/data/destinations";
import { useI18n } from "@/i18n/client";
import { fmt, label } from "@/i18n/fmt";
import { DEFAULT_BUDGET, DISCOVERY_BUDGET_KEY, clampBudget, formatBudget, formatDT, formatRange } from "@/lib/budget";
import { budgetTeasers, teaserHref } from "@/lib/quiz";
import { BudgetRange } from "./BudgetRange";

/**
 * Home page budget slider + the destination cards under it. Moving the slider re-ranks the cards:
 * destinations the budget reaches come first (best fit leads), with the price range at that budget;
 * the others show what they start from. The value is remembered for the quiz via sessionStorage.
 */
export function BudgetDiscovery({ destinations }: { destinations: Destination[] }) {
  const { t, locale, href } = useI18n();
  const [budget, setBudget] = useState(DEFAULT_BUDGET);

  // Coming back to the home page: pick up where the slider was left.
  useEffect(() => {
    try {
      const stored = Number(sessionStorage.getItem(DISCOVERY_BUDGET_KEY));
      if (stored > 0) setBudget(clampBudget(stored));
    } catch {
      // sessionStorage unavailable
    }
  }, []);

  function onChange(value: number) {
    setBudget(value);
    try {
      sessionStorage.setItem(DISCOVERY_BUDGET_KEY, String(value));
    } catch {
      // Storage can be unavailable (private mode); the quiz then starts from its default.
    }
  }

  const teasers = useMemo(() => budgetTeasers(destinations, budget), [destinations, budget]);
  const [featured, ...others] = teasers;
  const tag = (value: string) => label(t.options.vibes, value);
  const nothingFits = teasers.length > 0 && !teasers.some((x) => x.fits);

  return (
    <>
      {/* Budget */}
      <section className="mx-auto mt-24 max-w-[560px] px-4 text-center">
        <h2 className="text-[34px] leading-[1.08] font-black tracking-[-0.02em] sm:text-[44px] rtl:leading-[1.3] rtl:tracking-normal">
          {t.home.budgetTitle}
        </h2>
        <p className="mt-3 text-lg">{t.home.budgetBody}</p>
        <div className="mt-10 flex h-[170px] flex-col justify-center gap-4 text-start">
          <div className="text-center text-[56px] leading-none font-black tracking-[-0.02em]">{formatBudget(budget, locale)}</div>
          <BudgetRange value={budget} onChange={onChange} />
        </div>
        <p aria-live="polite" className={`mt-2 min-h-6 font-bold text-sea ${nothingFits ? "" : "invisible"}`}>
          {nothingFits ? fmt(t.home.stretchHint, { budget: formatDT(featured.destination.minBudget, locale) }) : null}
        </p>
      </section>

      {/* Trip teasers */}
      {featured ? (
        <section className="mx-auto mt-10 max-w-[1180px]">
          <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-4 sm:px-7">
            <Link
              key={featured.destination.slug}
              href={href(teaserHref(featured, budget))}
              className={`w-[86vw] max-w-[560px] shrink-0 animate-enter snap-start overflow-hidden rounded-[0_40px_40px_40px] bg-ink text-cream transition-opacity motion-reduce:animate-none rtl:rounded-[40px_0_40px_40px] ${featured.fits ? "" : "opacity-80"}`}
            >
              <div className="relative h-[240px] sm:h-[300px]">
                <Image src={featured.destination.cardImage.src} alt={featured.destination.cardImage.alt} fill sizes="560px" className="object-cover" />
              </div>
              <div className="grid gap-3 p-6 sm:p-7">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-orange px-3 py-1.5 text-xs font-black text-ink">
                    {featured.fits ? fmt(t.match, { n: featured.matchPercent }) : fmt(t.home.outOfReach, { budget: formatDT(featured.rangeMin, locale) })}
                  </span>
                  {featured.fits ? <span className="text-xs font-black tracking-[.06em] text-orange rtl:tracking-normal">{t.home.fits}</span> : null}
                </div>
                <h3 className="text-4xl font-black tracking-[-0.02em] sm:text-[44px] rtl:tracking-normal">{featured.destination.country}</h3>
                <p className="text-lg">
                  {fmt(t.home.rangeMeta, {
                    range: formatRange(featured.rangeMin, featured.fits ? featured.rangeMax : featured.destination.maxBudget, locale),
                    duration: featured.destination.teaser.duration,
                  })}
                </p>
                <div className="flex flex-wrap gap-2">
                  {featured.destination.teaser.tags.map((x) => (
                    <span key={x} className="rounded-full border border-cream/40 px-3 py-1 text-xs font-bold">
                      {tag(x)}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
            {others.map((x) => (
              <Link
                key={x.destination.slug}
                href={href(teaserHref(x, budget))}
                className={`w-[60vw] max-w-[260px] shrink-0 snap-start transition-[opacity,filter] duration-300 ${x.fits ? "" : "opacity-55 grayscale-[.5] hover:opacity-80"}`}
              >
                <div className="relative h-[240px] overflow-hidden rounded-[120px_120px_28px_28px]">
                  <Image src={x.destination.cardImage.src} alt={x.destination.cardImage.alt} fill sizes="260px" className="object-cover" />
                  {x.fits ? (
                    <span className="absolute start-3 bottom-3 rounded-full bg-orange px-2.5 py-1 text-[11px] font-black">
                      {fmt(t.match, { n: x.matchPercent })}
                    </span>
                  ) : null}
                </div>
                <h3 className="mt-4 text-2xl font-black">{x.destination.country}</h3>
                <p className="mt-1">
                  {x.fits
                    ? fmt(t.home.rangeMeta, { range: formatRange(x.rangeMin, x.rangeMax, locale), duration: x.destination.teaser.duration })
                    : fmt(t.home.outOfReach, { budget: formatDT(x.rangeMin, locale) })}
                </p>
                <p className="mt-2 text-xs font-semibold">{x.destination.teaser.tags.map(tag).join(" · ")}</p>
              </Link>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-center gap-3 text-sm">
            <span className="flex gap-1.5" aria-hidden>
              <span className="h-1.5 w-5 rounded-full bg-orange" />
              <span className="h-1.5 w-1.5 rounded-full bg-ink/20" />
              <span className="h-1.5 w-1.5 rounded-full bg-ink/20" />
            </span>
            {t.home.slide}
          </div>

          <div className="mt-7 text-center">
            <Link href={href("/find-my-trip")} className="inline-flex rounded-full bg-orange px-8 py-4 text-lg font-extrabold hover:brightness-95">
              {t.home.cta}
            </Link>
            <p className="mt-6 px-4 text-xs">{t.home.disclaimer}</p>
          </div>
        </section>
      ) : null}
    </>
  );
}
