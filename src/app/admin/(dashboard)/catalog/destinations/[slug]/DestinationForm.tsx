"use client";

import { useActionState } from "react";
import type { Tables } from "@/lib/supabase/database.types";
import { saveDestination, type FormState } from "../../../../actions/catalog";
import { Notice, adminPrimaryButton } from "../../../../ui";
import { DESTINATION_FIELDS } from "@/lib/admin/translations";
import { Checkboxes, Field, Fieldset, TextArea, TextInput, TranslationFields } from "../../fields";
import { ImageField } from "../../ImageField";

type Destination = Tables<"destinations">;

const BANDS = ["Weekend", "5–7 days", "8–12 days", "2+ weeks"].map((b) => ({ value: b, label: b }));
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => ({
  value: String(i + 1),
  label: m,
}));
const TRAVELERS = ["Just me", "Couple", "Friends", "Family"] as const;

export function DestinationForm({ destination }: { destination: Destination | null }) {
  const d = destination;
  const [state, action, pending] = useActionState<FormState, FormData>(saveDestination.bind(null, d?.slug ?? null), {
    error: null,
  });
  const suitability = (d?.traveler_suitability ?? {}) as Record<string, number>;

  return (
    <form action={action} className="grid gap-4">
      <Fieldset legend="On the site">
        {d ? null : (
          <Field label="Slug" hint="Used in links, e.g. /trip?destination=morocco. Can’t be changed later.">
            <TextInput name="slug" required pattern="[a-z0-9-]{2,40}" placeholder="morocco" />
          </Field>
        )}
        <Field label="Country">
          <TextInput name="country" required maxLength={80} defaultValue={d?.country} />
        </Field>
        <Field label="Title" hint="e.g. Cairo & the Nile">
          <TextInput name="title" required maxLength={120} defaultValue={d?.title} />
        </Field>
        <Field label="Recommended duration">
          <TextInput name="duration" required maxLength={40} defaultValue={d?.duration} placeholder="6 days" />
        </Field>
        <Field label="Description" wide>
          <TextArea name="description" required rows={3} maxLength={600} defaultValue={d?.description} />
        </Field>
        <Field label="Highlights" hint="One per line (max 6)." wide>
          <TextArea name="highlights" required rows={3} defaultValue={d?.highlights.join("\n")} />
        </Field>
        <Field label="Default match %" hint="Shown when the visitor didn’t take the quiz.">
          <TextInput name="match_default" type="number" min={0} max={99} required defaultValue={d?.match_default ?? 90} />
        </Field>
        <Field label="Sort order" hint="Lower comes first.">
          <TextInput name="sort_order" type="number" min={0} max={999} defaultValue={d?.sort_order ?? 0} />
        </Field>
        <label className="flex items-center gap-2 text-sm font-bold sm:col-span-2">
          <input type="checkbox" name="is_active" defaultChecked={d?.is_active ?? true} className="size-4 accent-orange" />
          Visible on the site
        </label>
      </Fieldset>

      <Fieldset legend="Budget (DT)">
        <Field label="Minimum budget" hint="Quiz only suggests it at or above this budget.">
          <TextInput name="min_budget" type="number" min={1} required defaultValue={d?.min_budget} />
        </Field>
        <Field label="Maximum budget">
          <TextInput name="max_budget" type="number" min={1} required defaultValue={d?.max_budget} />
        </Field>
        <Field label="Estimated total" hint="Used when the visitor arrives without a quiz budget.">
          <TextInput name="estimated_total" type="number" min={1} required defaultValue={d?.estimated_total} />
        </Field>
      </Fieldset>

      <Fieldset legend="Images">
        <ImageField name="hero_image_url" label="Hero image (top of the trip page)" folder="destinations" required defaultValue={d?.hero_image_url} />
        <Field label="Hero image description (alt)" hint="Describe the photo for screen readers and Google." wide>
          <TextInput name="hero_image_alt" maxLength={160} defaultValue={d?.hero_image_alt} />
        </Field>
        <ImageField name="card_image_url" label="Card image (home page and quiz results)" folder="destinations" required defaultValue={d?.card_image_url} />
        <Field label="Card image description (alt)" wide>
          <TextInput name="card_image_alt" maxLength={160} defaultValue={d?.card_image_alt} />
        </Field>
      </Fieldset>

      <Fieldset legend="Home page teaser">
        <Field label="“From” budget (DT)">
          <TextInput name="teaser_budget" type="number" min={1} required defaultValue={d?.teaser_budget} />
        </Field>
        <Field label="Duration">
          <TextInput name="teaser_duration" required maxLength={40} defaultValue={d?.teaser_duration} />
        </Field>
        <Field label="Tags" hint="Comma-separated, e.g. Beach, Nightlife, Adventure" wide>
          <TextInput name="teaser_tags" defaultValue={d?.teaser_tags.join(", ")} />
        </Field>
      </Fieldset>

      <Fieldset legend="Quiz matching">
        <Field
          label="Vibes"
          hint="Comma-separated. These score: Beach, Nightlife, Adventure, Nature, Food, City, Culture, Luxury. The first three show on results."
          wide
        >
          <TextInput name="quiz_tags" defaultValue={d?.quiz_tags.join(", ")} />
        </Field>
        <Field label="Fits these trip lengths" wide>
          <Checkboxes name="duration_bands" options={BANDS} checked={d?.duration_bands ?? []} />
        </Field>
        <Field label="Best months" wide>
          <Checkboxes name="month_affinity" options={MONTHS} checked={(d?.month_affinity ?? []).map(String)} />
        </Field>
        <div className="grid gap-2 sm:col-span-2">
          <span className="text-sm font-bold">How well it suits each group (0–1)</span>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {TRAVELERS.map((t) => (
              <Field key={t} label={t}>
                <TextInput name={`suitability:${t}`} type="number" min={0} max={1} step={0.01} required defaultValue={suitability[t] ?? 0.8} />
              </Field>
            ))}
          </div>
        </div>
      </Fieldset>

      <TranslationFields fields={DESTINATION_FIELDS} stored={d?.translations} />

      {state.error ? <Notice tone="error">{state.error}</Notice> : null}
      <div className="sticky bottom-0 -mx-4 flex gap-3 border-t border-ink/10 bg-[#F3EEE2]/95 px-4 py-3 backdrop-blur">
        <button disabled={pending} className={adminPrimaryButton}>
          {pending ? "Saving…" : d ? "Save changes" : "Create destination"}
        </button>
      </div>
    </form>
  );
}
