"use client";

import { useActionState } from "react";
import type { Tables } from "@/lib/supabase/database.types";
import { saveSafari, type FormState } from "../../../../actions/catalog";
import { Notice, adminPrimaryButton } from "../../../../ui";
import { SAFARI_FIELDS } from "@/lib/admin/translations";
import { Field, Fieldset, TextArea, TextInput, TranslationFields } from "../../fields";
import { ImageField } from "../../ImageField";

export function SafariForm({ safari }: { safari: Tables<"safaris"> | null }) {
  const s = safari;
  const [state, action, pending] = useActionState<FormState, FormData>(saveSafari.bind(null, s?.slug ?? null), { error: null });

  return (
    <form action={action} className="grid gap-4">
      <Fieldset legend="Safari">
        {s ? null : (
          <Field label="Slug" hint="Lowercase, e.g. botswana. Can’t be changed later.">
            <TextInput name="slug" required pattern="[a-z0-9-]{2,40}" placeholder="botswana" />
          </Field>
        )}
        <Field label="Name" hint="Shown on the card and in WhatsApp requests.">
          <TextInput name="name" required maxLength={80} defaultValue={s?.name} />
        </Field>
        <Field label="Suggested duration" hint="Shown as “Suggested: …”">
          <TextInput name="duration" required maxLength={40} defaultValue={s?.duration} placeholder="7–10 days" />
        </Field>
        <Field label="Sort order" hint="Lower comes first.">
          <TextInput name="sort_order" type="number" min={0} max={999} defaultValue={s?.sort_order ?? 0} />
        </Field>
        <Field label="Description" wide>
          <TextArea name="description" required rows={3} maxLength={600} defaultValue={s?.description} />
        </Field>
        <Field label="Highlights" hint="One per line (max 6)." wide>
          <TextArea name="highlights" required rows={3} defaultValue={s?.highlights.join("\n")} />
        </Field>
        <ImageField name="image_url" label="Image" folder="safaris" required defaultValue={s?.image_url} />
        <Field label="Image description (alt)" hint="Describe the photo for screen readers and Google." wide>
          <TextInput name="image_alt" maxLength={160} defaultValue={s?.image_alt} />
        </Field>
        <label className="flex items-center gap-2 text-sm font-bold sm:col-span-2">
          <input type="checkbox" name="is_active" defaultChecked={s?.is_active ?? true} className="size-4 accent-orange" />
          Visible on the site
        </label>
      </Fieldset>

      <TranslationFields fields={SAFARI_FIELDS} stored={s?.translations} />

      {state.error ? <Notice tone="error">{state.error}</Notice> : null}
      <div className="sticky bottom-0 -mx-4 flex gap-3 border-t border-ink/10 bg-[#F3EEE2]/95 px-4 py-3 backdrop-blur">
        <button disabled={pending} className={adminPrimaryButton}>
          {pending ? "Saving…" : s ? "Save changes" : "Create safari"}
        </button>
      </div>
    </form>
  );
}
