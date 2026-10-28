"use client";

import { useActionState } from "react";
import { GROUP_TYPES, STAY_TYPES, type BrainActivity } from "@/data/brain";
import { BRAIN_BASE_FIELDS } from "@/lib/admin/translations";
import { VIBE_OPTIONS } from "@/lib/quiz";
import type { Tables } from "@/lib/supabase/database.types";
import { deleteBrainBase, saveBrainBase, type FormState } from "../../../../actions/brain";
import { Notice, adminInput, adminPrimaryButton, adminSecondaryButton } from "../../../../ui";
import { Checkboxes, Field, Fieldset, TextArea, TextInput, TranslationFields } from "../../../catalog/fields";

type Base = Tables<"brain_bases">;

const VIBES = VIBE_OPTIONS.map((v) => ({ value: v, label: v }));
const MONTHS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" }).format(new Date(Date.UTC(2026, i, 1))),
}));
const GROUP_LABEL = { solo: "Solo", couple: "Couple", honeymoon: "Honeymoon", friends: "Friends", family: "Family" } as const;
const STAY_LABEL = { budget_hotel: "Budget hotel", good_hotel: "Good hotel", apartment: "Apartment (up to 4)" } as const;

/** The activities textarea: one per line, "Name | price | vibes | book or walk-in | kids or adults". */
const activityLines = (value: unknown) =>
  ((Array.isArray(value) ? value : []) as BrainActivity[])
    .map((a) => [a.name, a.priceTND, a.vibes.join(", "), a.booking ? "book" : "walk-in", a.kidFriendly ? "kids" : "adults"].join(" | "))
    .join("\n");

export function BaseForm({ base: b, countries, defaultCountry }: { base: Base | null; countries: { code: string; name: string }[]; defaultCountry?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveBrainBase.bind(null, b?.slug ?? null), { error: null });
  const fit = (b?.group_fit ?? {}) as Partial<Record<(typeof GROUP_TYPES)[number], number>>;
  const stay = (b?.stay_tnd ?? {}) as Partial<Record<(typeof STAY_TYPES)[number], number>>;

  return (
    <>
      <form action={action} className="grid gap-4">
        <Fieldset legend="Place">
          {b ? null : (
            <Field label="Code" hint="Lowercase, e.g. koh-lanta. Can’t be changed later.">
              <TextInput name="slug" required pattern="[a-z0-9-]{2,40}" placeholder="koh-lanta" />
            </Field>
          )}
          <Field label="Name" hint="As visitors see it, e.g. Krabi (Ao Nang).">
            <TextInput name="place" required maxLength={80} defaultValue={b?.place} />
          </Field>
          <Field label="Country">
            <select name="country_code" required defaultValue={b?.country_code ?? defaultCountry ?? countries[0]?.code} className={adminInput}>
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Minimum nights" hint="Never planned for fewer nights than this.">
            <TextInput name="min_nights" type="number" min={1} max={30} required defaultValue={b?.min_nights ?? 3} />
          </Field>
          <Field label="Sort order">
            <TextInput name="sort_order" type="number" min={0} max={999} defaultValue={b?.sort_order ?? 0} />
          </Field>
          <div className="grid content-end gap-2">
            <label className="flex items-center gap-2 text-sm font-bold">
              <input type="checkbox" name="is_active" defaultChecked={b?.is_active ?? true} className="size-4 accent-orange" />
              Suggested by “Find my trip”
            </label>
            <label className="flex items-center gap-2 text-sm font-bold">
              <input type="checkbox" name="family_ok" defaultChecked={b?.family_ok ?? true} className="size-4 accent-orange" />
              OK for families with children under 12
            </label>
          </div>
          <Field label="Strong in" hint="Visitors pick up to 3 vibes; a place is only suggested if it shares one." wide>
            <Checkboxes name="strengths" options={VIBES} checked={b?.strengths ?? []} />
          </Field>
          <Field label="Areas to stay in" hint="One per line, best first. Shown only in the paid plan." wide>
            <TextArea name="stay_areas" rows={3} defaultValue={b?.stay_areas.join("\n")} />
          </Field>
        </Fieldset>

        <Fieldset legend="Weather">
          <Field label="Best months" hint="Dry, sunny season." wide>
            <Checkboxes name="best_months" options={MONTHS} checked={(b?.best_months ?? []).map(String)} />
          </Field>
          <Field label="Okay months" hint="Shoulder season. Months in neither list are never suggested." wide>
            <Checkboxes name="ok_months" options={MONTHS} checked={(b?.ok_months ?? []).map(String)} />
          </Field>
        </Fieldset>

        <Fieldset legend="Costs (DT)">
          {STAY_TYPES.map((s) => (
            <Field key={s} label={`${STAY_LABEL[s]} — per night per room`}>
              <TextInput name={`stay:${s}`} type="number" min={0} required defaultValue={stay[s]} />
            </Field>
          ))}
          <Field label="Food per person per day — budget" hint="Used with budget hotels.">
            <TextInput name="food_budget_tnd" type="number" min={0} required defaultValue={b?.food_budget_tnd} />
          </Field>
          <Field label="Food per person per day — mid-range" hint="Used with good hotels and apartments.">
            <TextInput name="food_mid_tnd" type="number" min={0} required defaultValue={b?.food_mid_tnd} />
          </Field>
          <Field label="Local transport per person per day">
            <TextInput name="transport_day_tnd" type="number" min={0} defaultValue={b?.transport_day_tnd ?? 0} />
          </Field>
          <Field label="Airport transfer, one way, per group">
            <TextInput name="transfer_tnd" type="number" min={0} defaultValue={b?.transfer_tnd ?? 0} />
          </Field>
        </Fieldset>

        <Fieldset legend="Who it suits (0 to 1)">
          {GROUP_TYPES.map((g) => (
            <Field key={g} label={GROUP_LABEL[g]}>
              <TextInput name={`fit:${g}`} type="number" min={0} max={1} step={0.1} defaultValue={fit[g] ?? 0.5} />
            </Field>
          ))}
        </Fieldset>

        <Fieldset legend="Activities">
          <Field
            label="One per line"
            hint={
              <>
                Name | price per person | vibes | <b>book</b> or <b>walk-in</b> | <b>kids</b> or <b>adults</b>. Example: Four Islands
                longtail tour | 120 | Beach, Nature | book | kids
              </>
            }
            wide
          >
            <textarea name="activities" rows={6} defaultValue={activityLines(b?.activities)} className={`${adminInput} resize-y font-mono text-[13px]`} />
          </Field>
        </Fieldset>

        <TranslationFields fields={BRAIN_BASE_FIELDS} stored={b?.translations} />

        {state.error ? <Notice tone="error">{state.error}</Notice> : null}
        <div className="sticky bottom-0 -mx-4 flex gap-3 border-t border-ink/10 bg-[#F3EEE2]/95 px-4 py-3 backdrop-blur">
          <button disabled={pending} className={adminPrimaryButton}>
            {pending ? "Saving…" : b ? "Save changes" : "Create place"}
          </button>
        </div>
      </form>

      {b ? (
        <form
          action={deleteBrainBase.bind(null, b.slug)}
          onSubmit={(e) => {
            if (!window.confirm(`Delete “${b.place}”? This can’t be undone. (To stop suggesting it for now, untick “Suggested” instead.)`)) e.preventDefault();
          }}
          className="flex items-center justify-between gap-3 rounded-2xl border border-[#C2410C]/25 bg-white p-4"
        >
          <span className="text-sm opacity-75">Delete this place for good. Orders already placed keep their saved plan.</span>
          <button className={`${adminSecondaryButton} border-[#C2410C]/40 text-[#9A3412]`}>Delete place</button>
        </form>
      ) : null}
    </>
  );
}
