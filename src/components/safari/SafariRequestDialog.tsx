"use client";

import { useRef } from "react";
import {
  Field,
  FormError,
  HONEYPOT_FIELD,
  Honeypot,
  ReservationConfirmation,
  SubmitButton,
  WhatsAppFallback,
  inputClass,
  primaryButtonClass,
  str,
  useConciergeSubmit,
  useRequestForm,
} from "@/components/forms";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/fmt";
import type { BookingConfig, RequestDraft } from "@/lib/requests";

/** "Request this Safari" button + modal form that stores the request, then confirms it or opens WhatsApp. */
export function SafariRequestDialog({ safari, slug, booking }: { safari: string; slug: string; booking: BookingConfig }) {
  const { t } = useI18n();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { send, pending, error, fallbackHref, confirmation } = useConciergeSubmit(booking);

  const form = useRequestForm((data) => {
    const request: RequestDraft = {
      kind: "safari",
      safari,
      safariSlug: slug,
      fullName: str(data, "fullName"),
      whatsapp: str(data, "whatsapp"),
      travelers: str(data, "travelers"),
      preferredDate: str(data, "preferredDate"),
      preferredDuration: str(data, "preferredDuration"),
      budgetDT: str(data, "budgetDT"),
      specialRequests: str(data, "specialRequests"),
    };
    send(request, str(data, HONEYPOT_FIELD));
  });

  return (
    <>
      <button type="button" onClick={() => dialogRef.current?.showModal()} className={primaryButtonClass}>
        {t.safari.request}
      </button>

      <dialog
        ref={dialogRef}
        aria-label={t.safari.dialogLabel}
        // Close when the backdrop (the dialog element itself, outside its content) is clicked.
        onClick={(e) => e.target === e.currentTarget && e.currentTarget.close()}
        className="m-auto max-h-[90dvh] w-[min(760px,calc(100%-36px))] animate-fade overflow-auto rounded-3xl border border-ink/14 bg-cream p-0 text-ink shadow-[0_18px_44px_rgba(0,0,0,.24)] backdrop:bg-black/40 motion-reduce:animate-none"
      >
        <div className="@container grid gap-3 p-[18px]">
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="cursor-pointer justify-self-end rounded-full bg-white px-3 py-2 font-extrabold"
          >
            {t.safari.close}
          </button>

          {confirmation ? (
            <ReservationConfirmation confirmation={confirmation} what={fmt(t.forms.what.safari, { name: safari })} />
          ) : (
          <form {...form} className="grid gap-3 rounded-[20px] border border-ink/14 bg-white/85 p-[18px]">
            <h3 className="m-0 text-[34px] leading-[1.05] font-black tracking-[-0.02em] rtl:leading-[1.3] rtl:tracking-normal">
              {t.safari.dialogTitle}
            </h3>
            <p className="m-0 font-extrabold">
              {t.safari.selected}{" "}
              <span className="inline-block rounded-full border border-ink/16 bg-white px-2.5 py-1 align-top [overflow-wrap:anywhere]">
                {safari}
              </span>
            </p>
            <p className="m-0 text-[13px] opacity-85">{booking.mode === "onsite" ? t.safari.introOnsite : t.safari.introWhatsapp}</p>

            <div className="grid grid-cols-2 gap-2.5 @max-[700px]:grid-cols-1">
              <Field label={t.forms.fullName}>
                <input name="fullName" required type="text" maxLength={120} autoComplete="name" className={inputClass} />
              </Field>
              <Field label={t.forms.whatsapp}>
                <input name="whatsapp" required type="tel" dir="ltr" maxLength={40} autoComplete="tel" className={`${inputClass} rtl:text-end`} />
              </Field>
              <Field label={t.forms.travelers}>
                <input name="travelers" required type="number" min={1} max={99} defaultValue="1" className={inputClass} />
              </Field>
              <Field label={t.forms.preferredDate}>
                <input name="preferredDate" type="date" className={inputClass} />
              </Field>
              <Field label={t.safari.duration}>
                <input name="preferredDuration" type="text" maxLength={60} placeholder={t.safari.durationPlaceholder} className={inputClass} />
              </Field>
              <Field label={t.safari.budget} hint={t.safari.budgetHint}>
                <input name="budgetDT" required type="number" min={1} className={inputClass} />
              </Field>
            </div>

            <Field label={t.safari.special}>
              <textarea name="specialRequests" rows={4} maxLength={1000} className={`${inputClass} resize-y`} />
            </Field>

            <Honeypot />
            <FormError message={error} />
            <SubmitButton pending={pending} mode={booking.mode} />
            <WhatsAppFallback href={fallbackHref} />
          </form>
          )}
        </div>
      </dialog>
    </>
  );
}
