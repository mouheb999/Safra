// Form building blocks for the catalog editors (server-safe).

import type { ReactNode } from "react";
import {
  TRANSLATED_LOCALES,
  translationInputName,
  translationValue,
  type TranslatedField,
} from "@/lib/admin/translations";
import { adminInput } from "../../ui";

export function Field({ label, hint, children, wide = false }: { label: string; hint?: ReactNode; children: ReactNode; wide?: boolean }) {
  return (
    <label className={`grid content-start gap-1.5 text-sm font-bold ${wide ? "sm:col-span-2" : ""}`}>
      {label}
      {children}
      {hint ? <span className="text-xs font-semibold opacity-60">{hint}</span> : null}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={adminInput} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${adminInput} resize-y`} />;
}

export function Fieldset({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <fieldset className="grid gap-4 rounded-2xl border border-ink/10 bg-white p-4 sm:grid-cols-2 sm:p-5">
      <legend className="px-1 text-lg font-black">{legend}</legend>
      {children}
    </fieldset>
  );
}

export function Checkboxes({ name, options, checked }: { name: string; options: { value: string; label: string }[]; checked: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <label key={o.value} className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 bg-white px-3 py-1 text-sm font-bold has-checked:border-orange has-checked:bg-orange/20">
          <input type="checkbox" name={name} value={o.value} defaultChecked={checked.includes(o.value)} className="accent-orange" />
          {o.label}
        </label>
      ))}
    </div>
  );
}

/** One collapsible block per extra language; anything left empty shows the English text. */
export function TranslationFields({ fields, stored }: { fields: TranslatedField[]; stored: unknown }) {
  return (
    <fieldset className="grid gap-3 rounded-2xl border border-ink/10 bg-white p-4 sm:p-5">
      <legend className="px-1 text-lg font-black">Translations</legend>
      <p className="m-0 text-sm opacity-70">
        French and Arabic versions of the text above. Leave a field empty to show the English text on that language.
      </p>
      {TRANSLATED_LOCALES.map(({ locale, label, dir }) => {
        const filled = fields.filter((f) => translationValue(stored, locale, f)).length;
        return (
          <details key={locale} className="group rounded-xl border border-ink/10 bg-[#FBF8F1] open:bg-white">
            <summary className="flex cursor-pointer items-center justify-between gap-2 px-4 py-3 font-extrabold">
              {label}
              <span className="text-xs font-bold opacity-60">
                {filled}/{fields.length} filled
              </span>
            </summary>
            <div className="grid gap-4 px-4 pb-4 sm:grid-cols-2">
              {fields.map((f) => {
                const common = {
                  name: translationInputName(locale, f.key),
                  defaultValue: translationValue(stored, locale, f),
                  dir,
                  lang: locale,
                };
                return (
                  <Field key={f.key} label={f.label} wide={f.kind !== "text"}>
                    {f.kind === "text" ? (
                      <TextInput {...common} maxLength={f.max} />
                    ) : (
                      <TextArea {...common} rows={f.kind === "lines" ? 4 : 3} maxLength={f.kind === "textarea" ? f.max : undefined} />
                    )}
                  </Field>
                );
              })}
            </div>
          </details>
        );
      })}
    </fieldset>
  );
}
