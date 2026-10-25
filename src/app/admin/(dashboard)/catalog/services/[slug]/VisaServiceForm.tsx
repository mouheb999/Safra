"use client";

import { useActionState } from "react";
import type { Tables } from "@/lib/supabase/database.types";
import { saveVisaService, type FormState } from "../../../../actions/catalog";
import { Notice, adminPrimaryButton } from "../../../../ui";
import { VISA_FIELDS } from "@/lib/admin/translations";
import { Field, Fieldset, TextArea, TextInput, TranslationFields } from "../../fields";

export function VisaServiceForm({ service }: { service: Tables<"services"> | null }) {
  const v = service;
  const [state, action, pending] = useActionState<FormState, FormData>(saveVisaService.bind(null, v?.slug ?? null), {
    error: null,
  });

  return (
    <form action={action} className="grid gap-4">
      <Fieldset legend="Service">
        {v ? null : (
          <Field label="Slug" hint="Lowercase, e.g. uae-visa. Can’t be changed later.">
            <TextInput name="slug" required pattern="[a-z0-9-]{2,40}" placeholder="uae-visa" />
          </Field>
        )}
        <Field label="Name" hint="Shown as the card title and in the WhatsApp message.">
          <TextInput name="name" required maxLength={120} defaultValue={v?.name} placeholder="UAE Visa Assistance" />
        </Field>
        <Field label="Country" hint="Used in the form (“Previous … visit”) and the message.">
          <TextInput name="country" required maxLength={80} defaultValue={v?.country} placeholder="United Arab Emirates" />
        </Field>
        <Field label="Flag" hint="One emoji, e.g. 🇦🇪 (Windows shows the letters instead).">
          <TextInput name="flag" maxLength={16} defaultValue={v?.flag} placeholder="🇦🇪" />
        </Field>
        <Field label="Price (DT)" hint="New requests use this price; received requests keep theirs.">
          <TextInput name="price_dt" type="number" min={0} step={1} required defaultValue={v?.price_dt ?? 0} />
        </Field>
        <Field label="Sort order" hint="Lower comes first.">
          <TextInput name="sort_order" type="number" min={0} max={999} defaultValue={v?.sort_order ?? 0} />
        </Field>
        <Field label="Short description (optional)" wide>
          <TextArea name="description" rows={2} maxLength={600} defaultValue={v?.description} />
        </Field>
        <Field label="What’s included" hint="One per line, shown as a bullet list on the card." wide>
          <TextArea name="includes" rows={4} defaultValue={v?.includes.join("\n")} placeholder={"Document checklist\nDocument review"} />
        </Field>
        <Field label="Documents the customer sends" hint="One per line. Listed on the form and in the WhatsApp message." wide>
          <TextArea name="documents" rows={5} defaultValue={v?.documents.join("\n")} placeholder={"Passport copy\nPersonal photo"} />
        </Field>
        <label className="flex items-center gap-2 text-sm font-bold sm:col-span-2">
          <input type="checkbox" name="is_active" defaultChecked={v?.is_active ?? true} className="size-4 accent-orange" />
          Open for applications on the site
        </label>
      </Fieldset>

      <TranslationFields fields={VISA_FIELDS} stored={v?.translations} />

      {state.error ? <Notice tone="error">{state.error}</Notice> : null}
      <div className="sticky bottom-0 -mx-4 flex gap-3 border-t border-ink/10 bg-[#F3EEE2]/95 px-4 py-3 backdrop-blur">
        <button disabled={pending} className={adminPrimaryButton}>
          {pending ? "Saving…" : v ? "Save changes" : "Create visa service"}
        </button>
      </div>
    </form>
  );
}
