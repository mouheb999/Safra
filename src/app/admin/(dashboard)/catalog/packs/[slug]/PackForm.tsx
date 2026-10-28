"use client";

import { useActionState } from "react";
import type { Tables } from "@/lib/supabase/database.types";
import { PACK_FIELDS } from "@/lib/admin/translations";
import { VIBE_OPTIONS } from "@/lib/quiz";
import { deletePack, savePack, type FormState } from "../../../../actions/catalog";
import { Notice, adminInput, adminPrimaryButton, adminSecondaryButton } from "../../../../ui";
import { Checkboxes, Field, Fieldset, TextArea, TextInput, TranslationFields } from "../../fields";
import { ImageField } from "../../ImageField";

type Pack = Tables<"packs">;

const INCLUDES = [
  { value: "flights", label: "Flights from Tunis" },
  { value: "hotel", label: "Hotels" },
  { value: "breakfast", label: "Breakfast" },
  { value: "transfers", label: "Airport transfers" },
  { value: "activities", label: "Selected activities" },
  { value: "visa", label: "Visa handled" },
  { value: "plan", label: "Day-by-day plan" },
];
const VIBES = VIBE_OPTIONS.map((v) => ({ value: v, label: v }));

export function PackForm({ pack, destinations }: { pack: Pack | null; destinations: { slug: string; country: string; title: string }[] }) {
  const p = pack;
  const [state, action, pending] = useActionState<FormState, FormData>(savePack.bind(null, p?.slug ?? null), { error: null });

  return (
    <>
      <form action={action} className="grid gap-4">
        <Fieldset legend="On the site">
          {p ? null : (
            <Field label="Slug" hint="Used in links, e.g. /trip-request?pack=bali-escape. Can’t be changed later.">
              <TextInput name="slug" required pattern="[a-z0-9-]{2,40}" placeholder="bali-escape" />
            </Field>
          )}
          <Field label="Title" hint="e.g. Bangkok & Krabi">
            <TextInput name="title" required maxLength={80} defaultValue={p?.title} />
          </Field>
          <Field label="Country">
            <TextInput name="country" required maxLength={60} defaultValue={p?.country} />
          </Field>
          <Field label="Route" hint="The places, e.g. Bangkok · Ao Nang">
            <TextInput name="route" maxLength={120} defaultValue={p?.route} />
          </Field>
          <Field label="Short description" hint="One sentence on the card (max 300 characters)." wide>
            <TextArea name="blurb" rows={2} maxLength={300} defaultValue={p?.blurb} />
          </Field>
          <Field label="Sort order" hint="Packs are shown cheapest first; this breaks ties.">
            <TextInput name="sort_order" type="number" min={0} max={999} defaultValue={p?.sort_order ?? 0} />
          </Field>
          <label className="flex items-center gap-2 self-end text-sm font-bold">
            <input type="checkbox" name="is_active" defaultChecked={p?.is_active ?? true} className="size-4 accent-orange" />
            Visible on the site
          </label>
        </Fieldset>

        <Fieldset legend="Price and length">
          <Field label="Price per person (DT)" hint="Flights from Tunis included. The home page budget slider uses it.">
            <TextInput name="price_dt" type="number" min={1} required defaultValue={p?.price_dt} />
          </Field>
          <Field label="Nights">
            <TextInput name="nights" type="number" min={1} max={60} required defaultValue={p?.nights ?? 7} />
          </Field>
          <Field label="What’s included" hint="Shown on the card (up to four, plus the plan)." wide>
            <Checkboxes name="includes" options={INCLUDES} checked={p?.includes ?? ["flights", "hotel", "transfers", "plan"]} />
          </Field>
          <Field label="Vibes" hint="For matching packs to the quiz later." wide>
            <Checkboxes name="vibes" options={VIBES} checked={p?.vibes ?? []} />
          </Field>
          <Field label="Destination page" hint="Optional. Links the checkout to a destination from the catalog." wide>
            <select name="destination_slug" defaultValue={p?.destination_slug ?? ""} className={adminInput}>
              <option value="">— None —</option>
              {destinations.map((d) => (
                <option key={d.slug} value={d.slug}>
                  {d.country} — {d.title}
                </option>
              ))}
            </select>
          </Field>
        </Fieldset>

        <Fieldset legend="Photo">
          <ImageField name="image_url" label="Card photo" folder="packs" required defaultValue={p?.image_url} />
        </Fieldset>

        <TranslationFields fields={PACK_FIELDS} stored={p?.translations} />

        {state.error ? <Notice tone="error">{state.error}</Notice> : null}
        <div className="sticky bottom-0 -mx-4 flex gap-3 border-t border-ink/10 bg-[#F3EEE2]/95 px-4 py-3 backdrop-blur">
          <button disabled={pending} className={adminPrimaryButton}>
            {pending ? "Saving…" : p ? "Save changes" : "Create pack"}
          </button>
        </div>
      </form>

      {p ? (
        <form
          action={deletePack.bind(null, p.slug)}
          onSubmit={(e) => {
            if (!window.confirm(`Delete “${p.title}”? This can’t be undone. (To take it off the site for now, untick “Visible on the site” instead.)`)) e.preventDefault();
          }}
          className="flex items-center justify-between gap-3 rounded-2xl border border-[#C2410C]/25 bg-white p-4"
        >
          <span className="text-sm opacity-75">Delete this pack for good. Past requests keep its name in their notes.</span>
          <button className={`${adminSecondaryButton} border-[#C2410C]/40 text-[#9A3412]`}>Delete pack</button>
        </form>
      ) : null}
    </>
  );
}
