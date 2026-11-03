"use client";

import { useActionState } from "react";
import { runLivePriceTest, saveLiveSettings, type FormState, type LiveTestState } from "../../actions/brain";
import { Notice, adminPrimaryButton, adminSecondaryButton } from "../../ui";
import { Field, TextInput } from "../catalog/fields";

export interface LivePricesValues {
  live_prices_enabled: boolean;
  live_prices_monthly_limit: number;
  live_eur_tnd: number;
}

export function LivePricesForm({ values: v, canTest }: { values: LivePricesValues; canTest: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveLiveSettings, { error: null });
  const [test, runTest, testing] = useActionState<LiveTestState>(runLivePriceTest, { result: null });

  return (
    <div className="grid gap-4">
      <form action={action} className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="flex items-center gap-2 self-end text-sm font-bold">
            <input type="checkbox" name="live_prices_enabled" defaultChecked={v.live_prices_enabled} className="size-4 accent-orange" />
            Use live prices on “Find my trip”
          </label>
          <Field label="Searches per month (limit)" hint="Never more than this a month; past it, cached prices or the estimates are used. Free SerpApi plan: keep it at or under your plan’s searches.">
            <TextInput name="live_prices_monthly_limit" type="number" min={0} max={100000} required defaultValue={v.live_prices_monthly_limit} />
          </Field>
          <Field label="EUR → DT rate (fallback)" hint="Prices come in euros and are converted with the day’s rate; this one is used only if that service is down.">
            <TextInput name="live_eur_tnd" type="number" min={1.001} max={9.999} step={0.001} required defaultValue={v.live_eur_tnd} />
          </Field>
        </div>
        {state.error ? <Notice tone="error">{state.error}</Notice> : null}
        <button disabled={pending} className={`${adminPrimaryButton} justify-self-start`}>
          {pending ? "Saving…" : "Save live prices"}
        </button>
      </form>

      <form action={runTest} className="grid gap-2 border-t border-ink/10 pt-4">
        <div className="flex flex-wrap items-center gap-3">
          <button disabled={!canTest || testing} className={adminSecondaryButton}>
            {testing ? "Checking…" : "Test live prices"}
          </button>
          <span className="text-sm opacity-70">One real flight search (Tunis → first country, next month). Repeats the same day are free.</span>
        </div>
        {test.result ? (
          test.result.ok ? (
            <Notice>
              Working: {test.result.route}, {test.result.dates} — {test.result.priceTND.toLocaleString("en-US")} DT per person (1 EUR ={" "}
              {test.result.eurTnd.toFixed(3)} DT).
            </Notice>
          ) : (
            <Notice tone="error">Not working: {test.result.reason}</Notice>
          )
        ) : null}
      </form>
    </div>
  );
}
