"use client";

import { useActionState } from "react";
import { saveBrainSettings, type FormState } from "../../actions/brain";
import { Notice, adminPrimaryButton } from "../../ui";
import { Field, TextInput } from "../catalog/fields";

export interface BrainSettingsValues {
  brain_min_pocket_tnd: number;
  brain_card_fee_pct: number;
  brain_max_flight_share: number;
  brain_activity_every: number;
}

export function BrainSettingsForm({ values: v }: { values: BrainSettingsValues }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveBrainSettings, { error: null });
  return (
    <form action={action} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Minimum pocket money (DT)" hint="Per person per day. A trip that leaves less is cut down or not suggested.">
          <TextInput name="brain_min_pocket_tnd" type="number" min={0} max={10000} required defaultValue={v.brain_min_pocket_tnd} />
        </Field>
        <Field label="Card fee (%)" hint="Added to everything paid in a foreign currency (flights, stays, activities…).">
          <TextInput name="brain_card_fee_pct" type="number" min={0} max={20} step={0.1} required defaultValue={v.brain_card_fee_pct} />
        </Field>
        <Field label="Max share for flights (%)" hint="A country whose flights take more of the budget than this is dropped.">
          <TextInput name="brain_max_flight_share" type="number" min={5} max={100} required defaultValue={v.brain_max_flight_share} />
        </Field>
        <Field label="One activity every … days" hint="How many paid activities a trip gets (2 = one every two days).">
          <TextInput name="brain_activity_every" type="number" min={1} max={14} required defaultValue={v.brain_activity_every} />
        </Field>
      </div>
      {state.error ? <Notice tone="error">{state.error}</Notice> : null}
      <button disabled={pending} className={`${adminPrimaryButton} justify-self-start`}>
        {pending ? "Saving…" : "Save rules"}
      </button>
    </form>
  );
}
