"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { LocalizedPack } from "@/data/packs";
import { BudgetRange } from "@/components/budget/BudgetRange";
import { ArrowIcon } from "@/components/icons";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/fmt";
import { DEFAULT_BUDGET, DISCOVERY_BUDGET_KEY, clampBudget, formatBudget, formatDT } from "@/lib/budget";
import { PackCard } from "./PackCard";

/**
 * Home page budget slider + the packs under it. The packs sit in one row ordered by price; moving the
 * slider glides the row to the most expensive pack the budget covers (the best use of it), packs within
 * budget are marked, the others fade and say how much more they cost. The row only moves when that pack
 * changes, so dragging the slider never makes it jitter. The budget is remembered for the quiz.
 */
export function PacksSlider({ packs }: { packs: LocalizedPack[] }) {
  const { t, locale, href } = useI18n();
  const [budget, setBudget] = useState(DEFAULT_BUDGET);
  const railRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  // The first positioning (on load, and after restoring a saved budget) jumps instead of gliding.
  const instant = useRef(true);

  useEffect(() => {
    try {
      const stored = Number(sessionStorage.getItem(DISCOVERY_BUDGET_KEY));
      if (stored > 0) setBudget(clampBudget(stored));
    } catch {
      // sessionStorage unavailable
    }
    const settle = setTimeout(() => (instant.current = false), 150);
    return () => clearTimeout(settle);
  }, []);

  function onChange(value: number) {
    setBudget(value);
    try {
      sessionStorage.setItem(DISCOVERY_BUDGET_KEY, String(value));
    } catch {
      // Storage can be unavailable (private mode); the quiz then starts from its default.
    }
  }

  const fits = packs.map((p) => p.priceDT <= budget);
  const fitCount = fits.filter(Boolean).length;
  const focus = Math.max(0, fits.lastIndexOf(true));

  // Centre the focused pack. scrollBy with a measured delta works the same in RTL.
  const focusRef = useRef(focus);
  const centre = useCallback((glide: boolean) => {
    const rail = railRef.current;
    const card = cardRefs.current[focusRef.current];
    if (!rail || !card) return;
    const r = rail.getBoundingClientRect();
    const c = card.getBoundingClientRect();
    const delta = c.left + c.width / 2 - (r.left + r.width / 2);
    const still = !glide || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    rail.scrollBy({ left: delta, behavior: still ? "auto" : "smooth" });
  }, []);

  useEffect(() => {
    focusRef.current = focus;
    centre(!instant.current);
  }, [focus, centre]);

  // Jump back into place whenever the row or its cards change size: when the layout settles on load,
  // and on rotation or window resizing.
  useEffect(() => {
    const rail = railRef.current;
    const first = cardRefs.current[0];
    if (!rail || !first) return;
    const observer = new ResizeObserver(() => centre(false));
    observer.observe(rail);
    observer.observe(first);
    return () => observer.disconnect();
  }, [centre]);

  /** Desktop arrows: one card forward (+1) or back (-1), whatever the reading direction. */
  const step = useCallback((dir: 1 | -1) => {
    const rail = railRef.current;
    const card = cardRefs.current[0];
    if (!rail || !card) return;
    const rtl = getComputedStyle(rail).direction === "rtl";
    rail.scrollBy({ left: dir * (rtl ? -1 : 1) * (card.offsetWidth + 20), behavior: "smooth" });
  }, []);

  return (
    <section className="mt-24 lg:mt-32">
      <div className="mx-auto grid max-w-[1180px] gap-8 px-4 sm:px-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end lg:gap-16">
        <div>
          <p className="m-0 text-xs font-black tracking-[0.14em] text-sea rtl:tracking-normal">{t.home.budgetEyebrow}</p>
          <h2 className="m-0 mt-3 text-[34px] leading-[1.06] font-black tracking-[-0.025em] sm:text-[46px] lg:text-[52px] text-balance rtl:leading-[1.3] rtl:tracking-normal">
            {t.home.budgetTitle}
          </h2>
          <p className="m-0 mt-4 max-w-[460px] text-lg leading-relaxed text-pretty opacity-85">{t.home.budgetBody}</p>
        </div>

        <div className="rounded-[28px] bg-white/75 p-6 shadow-[0_10px_30px_-20px_rgba(32,61,53,.35)] ring-1 ring-ink/8 sm:p-7">
          <div className="text-center text-[52px] leading-none font-black tracking-[-0.03em] tabular-nums sm:text-[60px] rtl:tracking-normal">
            {formatBudget(budget, locale)}
          </div>
          <div className="mt-5">
            <BudgetRange value={budget} onChange={onChange} />
          </div>
          <p aria-live="polite" className="m-0 mt-4 text-center text-sm font-extrabold text-sea">
            {fitCount > 0
              ? fmt(t.home.fitCount, { budget: formatBudget(budget, locale), n: fitCount, total: packs.length })
              : fmt(t.home.noneFit, { budget: formatDT(packs[0]?.priceDT ?? 0, locale) })}
          </p>
        </div>
      </div>

      <div className="mx-auto mt-10 hidden max-w-[1180px] justify-end gap-2 px-7 md:flex">
        <RailButton onClick={() => step(-1)} back />
        <RailButton onClick={() => step(1)} />
      </div>

      <div
        ref={railRef}
        className="mt-6 flex snap-x snap-mandatory gap-5 overflow-x-auto pt-2 pb-8 [--g:16px] [scrollbar-width:none] sm:[--g:28px] md:mt-4 [&::-webkit-scrollbar]:hidden"
        style={{ paddingInline: "max(var(--g), calc((100% - 1180px) / 2 + var(--g)))", scrollPaddingInline: "var(--g)" }}
      >
        {packs.map((p, i) => (
          <div
            key={p.slug}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            className={`w-[78vw] max-w-[340px] shrink-0 snap-center transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none sm:w-[340px] ${
              fits[i] ? "" : "scale-[.97]"
            }`}
          >
            <PackCard
              pack={p}
              muted={!fits[i]}
              badge={fits[i] ? t.home.fits : fmt(t.home.over, { amount: formatDT(p.priceDT - budget, locale) })}
              sizes="340px"
            />
          </div>
        ))}
      </div>

      <div className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-3 px-4 sm:px-7">
        <Link href={href("/packs")} className="inline-flex items-center gap-2 rounded-full bg-orange px-7 py-4 text-lg font-extrabold hover:brightness-95">
          {t.home.allPacks}
          <ArrowIcon size={16} />
        </Link>
        <Link href={href("/find-my-trip")} className="rounded-full border border-ink/15 bg-white/60 px-6 py-4 text-lg font-extrabold transition-colors hover:bg-white">
          {t.home.custom}
        </Link>
        <p className="m-0 basis-full pt-3 text-xs opacity-70">{t.home.disclaimer}</p>
      </div>
    </section>
  );
}

function RailButton({ onClick, back = false }: { onClick: () => void; back?: boolean }) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={back ? t.home.prev : t.home.next}
      className="grid size-11 cursor-pointer place-items-center rounded-full border border-ink/12 bg-white text-ink transition-colors hover:border-ink/35"
    >
      {/* ArrowIcon already mirrors in RTL; "back" points the other way. */}
      <span aria-hidden className={back ? "-scale-x-100" : ""}>
        <ArrowIcon size={16} />
      </span>
    </button>
  );
}
