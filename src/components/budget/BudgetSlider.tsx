"use client";

import { useState } from "react";
import { useI18n } from "@/i18n/client";
import { DEFAULT_BUDGET, DISCOVERY_BUDGET_KEY, formatBudget } from "@/lib/budget";
import { BudgetRange } from "./BudgetRange";

/** Home page budget picker. The chosen value is remembered for the quiz via sessionStorage. */
export function BudgetSlider({ initialBudget = DEFAULT_BUDGET }: { initialBudget?: number }) {
  const { locale } = useI18n();
  const [budget, setBudget] = useState(initialBudget);

  function onChange(value: number) {
    setBudget(value);
    try {
      sessionStorage.setItem(DISCOVERY_BUDGET_KEY, String(value));
    } catch {
      // Storage can be unavailable (private mode); the quiz then starts from its default.
    }
  }

  return (
    <div className="flex h-[170px] flex-col justify-center gap-4">
      <div className="text-center text-[56px] leading-none font-black tracking-[-0.02em]">{formatBudget(budget, locale)}</div>
      <BudgetRange value={budget} onChange={onChange} />
    </div>
  );
}
