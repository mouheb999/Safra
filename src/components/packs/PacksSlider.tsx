"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import type { Pack } from "@/data/packs";
import { BudgetRange } from "@/components/budget/BudgetRange";
import { ArrowIcon } from "@/components/icons";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/fmt";
import { DEFAULT_BUDGET, DISCOVERY_BUDGET_KEY, clampBudget, formatBudget, formatDT } from "@/lib/budget";
import { PackCard } from "./PackCard";

/** Below this many pixels a drag is a tap; above it, it changes the pack. */
const SWIPE_PX = 40;

/**
 * Home page budget slider + a carousel of the packs, ordered by price. The pack in the middle is the
 * main one; its neighbours sit smaller and faded on each side. Moving the budget slider brings the most
 * expensive pack the budget covers to the middle, and every card slides and rescales to its new place.
 * Packs within budget are marked, the others fade and say how much more they cost. Visitors can also
 * drag/swipe (the cards follow the finger), tap a side card, or use the arrows and dots. The budget is
 * remembered for the quiz.
 */
export function PacksSlider({ packs }: { packs: Pack[] }) {
  const { t, locale, href } = useI18n();
  const [budget, setBudget] = useState(DEFAULT_BUDGET);
  // A pack the visitor picked by hand (arrows, dots, swipe); cleared when the budget moves.
  const [picked, setPicked] = useState<number | null>(null);
  // Transitions start after the saved budget is restored, so the page doesn't animate on load.
  const [ready, setReady] = useState(false);
  const [drag, setDrag] = useState(0);
  const pointer = useRef<{ id: number; x: number; moved: boolean } | null>(null);

  useEffect(() => {
    try {
      const stored = Number(sessionStorage.getItem(DISCOVERY_BUDGET_KEY));
      if (stored > 0) setBudget(clampBudget(stored));
    } catch {
      // sessionStorage unavailable
    }
    const frame = requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)));
    return () => cancelAnimationFrame(frame);
  }, []);

  function onChange(value: number) {
    setBudget(value);
    setPicked(null);
    try {
      sessionStorage.setItem(DISCOVERY_BUDGET_KEY, String(value));
    } catch {
      // Storage can be unavailable (private mode); the quiz then starts from its default.
    }
  }

  const fits = packs.map((p) => p.priceDT <= budget);
  const fitCount = fits.filter(Boolean).length;
  const bestFit = Math.max(0, fits.lastIndexOf(true));
  const active = Math.min(picked ?? bestFit, packs.length - 1);
  // Cards to the right are pricier; in Arabic they go to the left.
  const dir = locale === "ar" ? -1 : 1;

  const go = (index: number) => setPicked(Math.max(0, Math.min(packs.length - 1, index)));

  // Drag / swipe: the row follows the pointer, then settles on the next or previous pack.
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    pointer.current = { id: e.pointerId, x: e.clientX, moved: false };
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const p = pointer.current;
    if (!p || p.id !== e.pointerId) return;
    const dx = e.clientX - p.x;
    if (!p.moved && Math.abs(dx) > 6) {
      p.moved = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    if (p.moved) setDrag(dx);
  };
  const onPointerEnd = (e: PointerEvent<HTMLDivElement>) => {
    const p = pointer.current;
    if (!p || p.id !== e.pointerId) return;
    const dx = e.clientX - p.x;
    if (p.moved && Math.abs(dx) > SWIPE_PX) go(active + (dx < 0 ? 1 : -1) * dir);
    setDrag(0);
    // Keep `moved` until the click that follows, so a swipe never opens a pack.
    setTimeout(() => (pointer.current = null), 0);
  };

  return (
    <section className="mt-24 lg:mt-32">
      <div className="mx-auto grid max-w-[1180px] gap-8 px-4 sm:px-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end lg:gap-16">
        <div>
          <p className="m-0 text-xs font-black tracking-[0.14em] text-sea rtl:tracking-normal">{t.home.budgetEyebrow}</p>
          <h2 className="m-0 mt-3 text-[34px] leading-[1.06] font-black tracking-[-0.025em] text-balance sm:text-[46px] lg:text-[52px] rtl:leading-[1.3] rtl:tracking-normal">
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

      {packs.length > 0 ? (
        <div
          role="region"
          aria-roledescription="carousel"
          aria-label={t.nav.packs}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") go(active + dir);
            else if (e.key === "ArrowLeft") go(active - dir);
          }}
          className="mt-12 overflow-x-clip pt-2 pb-4"
        >
          <p aria-live="polite" className="sr-only">
            {fmt(t.home.position, { n: active + 1, total: packs.length, title: packs[active].title })}
          </p>

          <div
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerEnd}
            onPointerCancel={onPointerEnd}
            onClickCapture={(e) => {
              if (pointer.current?.moved) {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
            onDragStart={(e) => e.preventDefault()}
            className="grid touch-pan-y select-none [grid-template-areas:'stack'] [--step:66vw] sm:[--step:290px] lg:[--step:330px]"
          >
            {packs.map((p, i) => {
              const offset = i - active;
              const distance = Math.abs(offset);
              const scale = distance === 0 ? 1 : distance === 1 ? 0.84 : 0.7;
              const opacity = distance === 0 ? 1 : distance === 1 ? 0.9 : distance === 2 ? 0.5 : 0;
              return (
                <div
                  key={p.slug}
                  className={`relative mx-auto w-[min(76vw,360px)] [grid-area:stack] ${
                    ready && drag === 0 ? "transition-[transform,opacity] duration-[650ms] ease-[cubic-bezier(.22,1,.36,1)]" : ""
                  } motion-reduce:transition-none ${distance > 2 ? "pointer-events-none" : ""}`}
                  style={{
                    transform: `translateX(calc(${offset * dir} * var(--step) + ${drag}px)) scale(${scale})`,
                    opacity,
                    zIndex: 10 - distance,
                  }}
                >
                  <div inert={offset !== 0} className={distance === 0 ? "drop-shadow-[0_24px_30px_rgba(32,61,53,.18)]" : ""}>
                    <PackCard
                      pack={p}
                      muted={!fits[i]}
                      badge={fits[i] ? t.home.fits : fmt(t.home.over, { amount: formatDT(p.priceDT - budget, locale) })}
                      sizes="360px"
                    />
                  </div>
                  {offset !== 0 ? (
                    // Side cards: a tap brings them to the middle (keyboard users have the arrows and dots).
                    <button
                      type="button"
                      tabIndex={-1}
                      aria-hidden
                      onClick={() => go(i)}
                      className="absolute inset-0 cursor-pointer rounded-[28px]"
                    />
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex items-center justify-center gap-4">
            <RoundButton label={t.home.prev} onClick={() => go(active - 1)} disabled={active === 0} back />
            <div className="flex items-center gap-1.5">
              {packs.map((p, i) => (
                <button
                  key={p.slug}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={fmt(t.home.showPack, { title: p.title })}
                  aria-current={i === active ? "true" : undefined}
                  className="group grid h-6 cursor-pointer place-items-center px-0.5"
                >
                  <span
                    className={`block h-2 rounded-full transition-[width,background-color] duration-300 ${
                      i === active ? "w-7 bg-orange" : fits[i] ? "w-2 bg-ink/35 group-hover:bg-ink/60" : "w-2 bg-ink/15 group-hover:bg-ink/40"
                    }`}
                  />
                </button>
              ))}
            </div>
            <RoundButton label={t.home.next} onClick={() => go(active + 1)} disabled={active === packs.length - 1} />
          </div>
        </div>
      ) : null}

      <div className="mx-auto mt-10 flex max-w-[1180px] flex-wrap items-center justify-center gap-3 px-4 sm:px-7">
        <Link href={href("/packs")} className="inline-flex items-center gap-2 rounded-full bg-orange px-7 py-4 text-lg font-extrabold hover:brightness-95">
          {t.home.allPacks}
          <ArrowIcon size={16} />
        </Link>
        <Link href={href("/find-my-trip")} className="rounded-full border border-ink/15 bg-white/60 px-6 py-4 text-lg font-extrabold transition-colors hover:bg-white">
          {t.home.custom}
        </Link>
        <p className="m-0 basis-full pt-3 text-center text-xs opacity-70">{t.home.disclaimer}</p>
      </div>
    </section>
  );
}

/** Previous / next: "back" goes to the cheaper pack. ArrowIcon already mirrors in RTL. */
function RoundButton({ label, onClick, disabled, back = false }: { label: string; onClick: () => void; disabled: boolean; back?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="grid size-11 cursor-pointer place-items-center rounded-full border border-ink/12 bg-white text-ink transition-[border-color,opacity] hover:border-ink/35 disabled:cursor-default disabled:opacity-35 disabled:hover:border-ink/12"
    >
      <span aria-hidden className={back ? "-scale-x-100" : ""}>
        <ArrowIcon size={16} />
      </span>
    </button>
  );
}
