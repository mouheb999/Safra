"use client";

import { useI18n } from "@/i18n/client";
import { BUDGET_STEP, MAX_BUDGET, MIN_BUDGET, budgetPercent, clampBudget, formatBudget } from "@/lib/budget";

/** Styled range track (filled bar + round knob over an invisible native input) with min/max labels. Mirrors in RTL. */
export function BudgetRange({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const { t, locale } = useI18n();
  const percent = budgetPercent(value);
  return (
    <div>
      <div className="relative rounded-2xl px-1 pt-2.5 outline-2 outline-offset-4 outline-transparent transition-[outline-color] focus-within:outline-orange">
        <div aria-hidden className="h-2.5 w-full rounded-full bg-track">
          <div className="h-full rounded-full bg-orange" style={{ width: `${percent}%` }} />
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 size-[30px] rounded-full border-[3px] border-orange bg-cream shadow-[0_2px_6px_rgba(0,0,0,0.18)]"
          style={{ insetInlineStart: `calc(${percent}% - 15px)` }}
        />
        <input
          type="range"
          aria-label={t.budget.aria}
          aria-valuetext={formatBudget(value, locale)}
          min={MIN_BUDGET}
          max={MAX_BUDGET}
          step={BUDGET_STEP}
          value={value}
          onChange={(e) => onChange(clampBudget(Number(e.target.value)))}
          className="absolute inset-x-0 top-[5px] m-0 h-[30px] w-full cursor-pointer opacity-0"
        />
      </div>
      <div className="mt-4 flex justify-between px-0.5 text-sm leading-none font-bold opacity-90">
        <span>{formatBudget(MIN_BUDGET, locale)}</span>
        <span>{formatBudget(MAX_BUDGET, locale)}</span>
      </div>
    </div>
  );
}
