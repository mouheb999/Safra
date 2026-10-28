"use client";

import { useActionState } from "react";
import { BRAIN_COUNTRY_FIELDS } from "@/lib/admin/translations";
import type { Tables } from "@/lib/supabase/database.types";
import { saveBrainCountry, type FormState } from "../../../../actions/brain";
import { Notice, adminPrimaryButton } from "../../../../ui";
import { Field, Fieldset, TextInput, TranslationFields } from "../../../catalog/fields";
import { ImageField } from "../../../catalog/ImageField";

export function CountryForm({ country: c }: { country: Tables<"brain_countries"> | null }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveBrainCountry.bind(null, c?.code ?? null), { error: null });

  return (
    <form action={action} className="grid gap-4">
      <Fieldset legend="Country">
        {c ? null : (
          <Field label="Code" hint="Lowercase, e.g. sri-lanka. Can’t be changed later.">
            <TextInput name="code" required pattern="[a-z0-9-]{2,40}" placeholder="sri-lanka" />
          </Field>
        )}
        <Field label="Name">
          <TextInput name="name" required maxLength={80} defaultValue={c?.name} />
        </Field>
        <Field label="Arrival airport(s)" hint="e.g. BKK or HAN / SGN">
          <TextInput name="airport" maxLength={40} defaultValue={c?.airport} />
        </Field>
        <Field label="Sort order">
          <TextInput name="sort_order" type="number" min={0} max={999} defaultValue={c?.sort_order ?? 0} />
        </Field>
        <label className="flex items-center gap-2 self-end text-sm font-bold">
          <input type="checkbox" name="is_active" defaultChecked={c?.is_active ?? true} className="size-4 accent-orange" />
          Suggested by “Find my trip”
        </label>
      </Fieldset>

      <Fieldset legend="Costs (DT, per person)">
        <Field label="Return flight from Tunis" hint="Economy with a checked bag. The card fee is added on top.">
          <TextInput name="flight_tnd" type="number" min={1} required defaultValue={c?.flight_tnd} />
        </Field>
        <Field label="Flight time (hours, one way)" hint="Door to door with one stop. Shorter trips score higher on ease.">
          <TextInput name="flight_hours" type="number" min={1} max={99} step={0.5} required defaultValue={c ? Number(c.flight_hours) : undefined} />
        </Field>
        <Field label="Visa" hint="What SAFRA charges per traveller. 0 = no visa needed.">
          <TextInput name="visa_tnd" type="number" min={0} defaultValue={c?.visa_tnd ?? 0} />
        </Field>
        <Field label="Move between two places" hint="Domestic flight or ferry, per person per move.">
          <TextInput name="internal_move_tnd" type="number" min={0} defaultValue={c?.internal_move_tnd ?? 0} />
        </Field>
        <Field label="Travel insurance per day">
          <TextInput name="insurance_day_tnd" type="number" min={0} defaultValue={c?.insurance_day_tnd ?? 0} />
        </Field>
        <Field label="eSIM for the trip" hint="Per adult.">
          <TextInput name="esim_tnd" type="number" min={0} defaultValue={c?.esim_tnd ?? 0} />
        </Field>
      </Fieldset>

      <Fieldset legend="Photo">
        <ImageField name="image_url" label="Result card photo (optional)" folder="brain" defaultValue={c?.image_url} />
      </Fieldset>

      <TranslationFields fields={BRAIN_COUNTRY_FIELDS} stored={c?.translations} />

      {state.error ? <Notice tone="error">{state.error}</Notice> : null}
      <div className="sticky bottom-0 -mx-4 flex gap-3 border-t border-ink/10 bg-[#F3EEE2]/95 px-4 py-3 backdrop-blur">
        <button disabled={pending} className={adminPrimaryButton}>
          {pending ? "Saving…" : c ? "Save changes" : "Create country"}
        </button>
      </div>
    </form>
  );
}
