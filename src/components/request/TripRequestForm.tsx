"use client";

import {
  Field,
  FormError,
  HONEYPOT_FIELD,
  Honeypot,
  ReservationConfirmation,
  SubmitButton,
  WhatsAppFallback,
  bookingCopy,
  inputClass,
  str,
  useConciergeSubmit,
  useRequestForm,
} from "@/components/forms";
import { useI18n } from "@/i18n/client";
import { fmt, label } from "@/i18n/fmt";
import type { BookingConfig, RequestDraft } from "@/lib/requests";
import type { TripRequestPrefill } from "@/lib/search-params";
import { RequestHeader, RequestShell, cardClass, chipClass } from "./RequestHeader";

/** "Let’s create your trip" — reached from /trip (destination known) or directly (destination typed in). */
export function TripRequestForm({ prefill, booking }: { prefill: TripRequestPrefill; booking: BookingConfig }) {
  const { t } = useI18n();
  const { send, pending, error, fallbackHref, confirmation } = useConciergeSubmit(booking);
  const hasSelection = prefill.selectedCountry !== "";
  const askDestination = prefill.mode === "direct" || !hasSelection;

  const form = useRequestForm((data) => {
    const typedDestination = askDestination ? str(data, "desiredDestination") : "";
    const request: RequestDraft = {
      kind: "trip",
      source: askDestination ? "direct" : "trip",
      // Keep the catalog link only while the destination is still the one picked upstream.
      destinationSlug: !typedDestination || typedDestination === prefill.selectedCountry ? prefill.selectedSlug : "",
      fullName: str(data, "fullName"),
      whatsapp: str(data, "whatsapp"),
      travelers: str(data, "travelers"),
      destination: (askDestination ? typedDestination : prefill.desiredDestination) || prefill.selectedCountry,
      category: prefill.category,
      preferredDate: str(data, "preferredDate"),
      durationDays: str(data, "durationDays"),
      budgetDT: str(data, "budgetDT"),
      notes: str(data, "notes"),
    };
    send(request, str(data, HONEYPOT_FIELD));
  });

  return (
    <RequestShell>
      <RequestHeader title={t.request.title} intro={t.request.intro}>
        {hasSelection ? <div className={chipClass}>{fmt(t.request.destinationChip, { value: prefill.selectedCountry })}</div> : null}
        {prefill.category ? (
          <div className={chipClass}>{fmt(t.request.categoryChip, { value: label(t.options.vibes, prefill.category) })}</div>
        ) : null}
      </RequestHeader>

      {confirmation ? (
        <ReservationConfirmation confirmation={confirmation} what={t.forms.what.trip} />
      ) : (
      <form {...form} className={cardClass}>
        <p className="m-0 font-bold">{bookingCopy(booking.mode, t).intro}</p>
        <p className="m-0 text-xs opacity-80">{t.forms.required}</p>

        <div className="grid grid-cols-2 gap-3 @max-[740px]:grid-cols-1">
          <Field label={t.forms.fullName}>
            <input name="fullName" required type="text" maxLength={120} autoComplete="name" placeholder={t.forms.fullNamePlaceholder} className={inputClass} />
          </Field>
          <Field label={t.forms.whatsapp}>
            <input name="whatsapp" required type="tel" dir="ltr" maxLength={40} autoComplete="tel" placeholder={t.forms.whatsappPlaceholder} className={`${inputClass} rtl:text-end`} />
          </Field>
          <Field label={t.forms.travelers}>
            <input name="travelers" required type="number" min={1} max={99} defaultValue={prefill.travelers} className={inputClass} />
          </Field>
          {askDestination ? (
            <Field label={`${t.request.desiredDestination}${hasSelection ? "" : " *"}`}>
              <input
                name="desiredDestination"
                required={!hasSelection}
                type="text"
                maxLength={120}
                defaultValue={prefill.desiredDestination}
                placeholder={t.request.desiredPlaceholder}
                className={inputClass}
              />
            </Field>
          ) : null}
          <Field label={t.forms.preferredDate}>
            <input name="preferredDate" type="date" defaultValue={prefill.preferredDate} className={inputClass} />
          </Field>
          <Field label={t.request.durationDays}>
            <input name="durationDays" type="number" min={1} defaultValue={prefill.durationDays} className={inputClass} />
          </Field>
          <Field label={t.request.budget} hint={t.request.budgetHint}>
            <input name="budgetDT" required type="number" min={1} defaultValue={prefill.budgetDT} placeholder="2900" className={inputClass} />
          </Field>
        </div>

        <Field label={t.forms.notes}>
          <textarea name="notes" rows={4} maxLength={1500} placeholder={t.forms.notesPlaceholder} className={`${inputClass} resize-y`} />
        </Field>

        <Honeypot />
        <FormError message={error} />
        <SubmitButton pending={pending} mode={booking.mode} />
        <WhatsAppFallback href={fallbackHref} />
      </form>
      )}
    </RequestShell>
  );
}
