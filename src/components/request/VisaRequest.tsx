"use client";

import { useCallback, useState } from "react";
import {
  Field,
  FormError,
  HONEYPOT_FIELD,
  Honeypot,
  ReservationConfirmation,
  SubmitButton,
  WhatsAppFallback,
  YesNoSelect,
  bookingCopy,
  inputClass,
  primaryButtonClass,
  str,
  useConciergeSubmit,
  useRequestForm,
  useTodayISO,
} from "@/components/forms";
import type { VisaService } from "@/data/visas";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/fmt";
import { formatDT } from "@/lib/budget";
import { whatsappUrl, type BookingConfig, type RequestDraft, type YesNo } from "@/lib/requests";
import { RequestHeader, RequestShell, cardClass } from "./RequestHeader";

const labelOf = (s: VisaService) => (s.flag ? `${s.flag} ${s.name}` : s.name);

/** Visa services: one card per service, then the application form for the chosen one. */
export function VisaRequest({
  services,
  booking,
  category = "",
  initialSlug,
}: {
  services: VisaService[];
  booking: BookingConfig;
  category?: string;
  initialSlug?: string;
}) {
  const { t, locale } = useI18n();
  const [selected, setSelected] = useState<VisaService | null>(() => services.find((s) => s.slug === initialSlug) ?? null);

  if (selected) {
    return (
      <RequestShell>
        <RequestHeader title={selected.name} intro={t.visa.approval} />
        <VisaForm service={selected} booking={booking} category={category} onBack={() => setSelected(null)} />
      </RequestShell>
    );
  }

  const heading = "m-0 text-[40px] leading-[1.04] font-black @max-[810px]:text-[34px] rtl:leading-[1.3]";

  if (services.length === 0) {
    return (
      <RequestShell>
        <section className={cardClass}>
          <h1 className={heading}>{t.visa.pageTitle}</h1>
          <p className="m-0 font-bold">{t.visa.noneOpen}</p>
          <a href={whatsappUrl(t.visa.askMessage, booking.whatsappNumber)} className={primaryButtonClass}>
            {t.visa.askWhatsapp}
          </a>
        </section>
      </RequestShell>
    );
  }

  const single = services.length === 1;
  return (
    <RequestShell>
      {single ? null : (
        <header className="grid gap-2">
          <h1 className="m-0 text-5xl leading-[1.05] font-black tracking-[-0.03em] @max-[810px]:text-[34px] rtl:leading-[1.3] rtl:tracking-normal">
            {t.visa.pageTitle}
          </h1>
          <p className="m-0 font-bold">{t.visa.pageLead}</p>
        </header>
      )}
      {services.map((s) => {
        const Heading = single ? "h1" : "h2";
        return (
          <section key={s.slug} className={cardClass}>
            <Heading className={heading}>{labelOf(s)}</Heading>
            <p className="m-0 text-[26px] font-black">{formatDT(s.priceDT, locale)}</p>
            {s.description ? <p className="m-0 font-bold">{s.description}</p> : null}
            {s.includes.length > 0 ? (
              <ul className="m-0 grid gap-1.5 ps-[18px] font-bold">
                {s.includes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
            <p className="m-0 font-bold">{t.visa.approval}</p>
            <button type="button" onClick={() => setSelected(s)} className={primaryButtonClass}>
              {fmt(t.visa.apply, { country: s.country || s.name, price: formatDT(s.priceDT, locale) })}
            </button>
          </section>
        );
      })}
    </RequestShell>
  );
}

function VisaForm({
  service,
  booking,
  category,
  onBack,
}: {
  service: VisaService;
  booking: BookingConfig;
  category: string;
  onBack: () => void;
}) {
  const { t, locale } = useI18n();
  const today = useTodayISO();
  const [arrivalDate, setArrivalDate] = useState("");
  const { send, pending, error, fallbackHref, confirmation } = useConciergeSubmit(booking);
  const onsite = booking.mode === "onsite";
  const country = service.country || t.visa.theDestination;

  const extraCheck = useCallback(
    (data: FormData) => {
      const arrival = str(data, "arrivalDate");
      const departure = str(data, "departureDate");
      if (arrival && departure && departure < arrival) return t.visa.departureBeforeArrival;
      const expiry = str(data, "passportExpiry");
      if (expiry && today && expiry <= today) return t.visa.passportExpired;
      return null;
    },
    [today, t],
  );

  const form = useRequestForm((data) => {
    const request: RequestDraft = {
      kind: "visa",
      service,
      fullName: str(data, "fullName"),
      whatsapp: str(data, "whatsapp"),
      travelers: str(data, "travelers"),
      category,
      dateOfBirth: str(data, "dateOfBirth"),
      nationality: str(data, "nationality"),
      passportNumber: str(data, "passportNumber"),
      passportExpiry: str(data, "passportExpiry"),
      arrivalDate: str(data, "arrivalDate"),
      departureDate: str(data, "departureDate"),
      purposeOfTravel: str(data, "purposeOfTravel"),
      occupationStatus: str(data, "occupationStatus"),
      flightBooked: str(data, "flightBooked") as YesNo,
      accommodationBooked: str(data, "accommodationBooked") as YesNo,
      previousVisit: str(data, "previousVisit") as YesNo,
      previousVisaRefusal: str(data, "previousVisaRefusal") as YesNo,
      notes: str(data, "notes"),
    };
    send(request, str(data, HONEYPOT_FIELD));
  }, extraCheck);

  if (confirmation) return <ReservationConfirmation confirmation={confirmation} what={t.forms.what.visa} />;

  return (
    <form {...form} className={cardClass}>
      <button type="button" onClick={onBack} className="cursor-pointer justify-self-start p-0 font-extrabold underline">
        {t.visa.back}
      </button>
      <p className="m-0 font-bold">{bookingCopy(booking.mode, t).intro}</p>
      <p className="m-0 text-2xl font-black">
        {labelOf(service)} — {formatDT(service.priceDT, locale)}
      </p>
      <p className="m-0 font-bold">{t.visa.approval}</p>
      <p className="m-0 text-xs opacity-80">{t.forms.required}</p>

      <div className="grid grid-cols-2 gap-3 @max-[740px]:grid-cols-1">
        <Field label={t.visa.fullName}>
          <input name="fullName" required type="text" maxLength={120} autoComplete="name" placeholder={t.forms.fullNamePlaceholder} className={inputClass} />
        </Field>
        <Field label={t.forms.whatsapp}>
          <input name="whatsapp" required type="tel" dir="ltr" maxLength={40} autoComplete="tel" placeholder={t.forms.whatsappPlaceholder} className={`${inputClass} rtl:text-end`} />
        </Field>
        <Field label={t.forms.travelers}>
          <input name="travelers" required type="number" min={1} max={99} defaultValue="1" className={inputClass} />
        </Field>
        <Field label={t.visa.dateOfBirth}>
          <input name="dateOfBirth" required type="date" max={today || undefined} className={inputClass} />
        </Field>
        <Field label={t.visa.nationality}>
          <input name="nationality" required type="text" maxLength={120} placeholder={t.visa.nationalityPlaceholder} className={inputClass} />
        </Field>
        <Field label={t.visa.country}>
          <input name="visaDestinationCountry" readOnly type="text" value={service.country} className={inputClass} />
        </Field>
        <Field label={t.visa.passportNumber}>
          <input name="passportNumber" required type="text" dir="ltr" maxLength={40} className={`${inputClass} rtl:text-end`} />
        </Field>
        <Field label={t.visa.passportExpiry}>
          <input name="passportExpiry" required type="date" min={today || undefined} className={inputClass} />
        </Field>
        <Field label={t.visa.arrival}>
          <input
            name="arrivalDate"
            required
            type="date"
            min={today || undefined}
            onChange={(e) => setArrivalDate(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label={t.visa.departure}>
          <input name="departureDate" required type="date" min={arrivalDate || today || undefined} className={inputClass} />
        </Field>
        <Field label={t.visa.purpose}>
          <input name="purposeOfTravel" required type="text" maxLength={120} className={inputClass} />
        </Field>
        <Field label={t.visa.occupation}>
          <input name="occupationStatus" required type="text" maxLength={120} className={inputClass} />
        </Field>
        <Field label={t.visa.flightBooked}>
          <YesNoSelect name="flightBooked" />
        </Field>
        <Field label={t.visa.accommodationBooked}>
          <YesNoSelect name="accommodationBooked" />
        </Field>
        <Field label={fmt(t.visa.previousVisit, { country })}>
          <YesNoSelect name="previousVisit" />
        </Field>
        <Field label={t.visa.previousRefusal}>
          <YesNoSelect name="previousVisaRefusal" />
        </Field>
      </div>

      <Field label={t.visa.notes}>
        <textarea name="notes" rows={4} maxLength={1500} placeholder={t.forms.notesPlaceholder} className={`${inputClass} resize-y`} />
      </Field>

      <p className="m-0 text-xs font-bold opacity-90">{onsite ? t.visa.passportNoteOnsite : t.visa.passportNoteWhatsapp}</p>
      {service.documents.length > 0 ? (
        <div className="grid gap-2 rounded-xl border border-ink/16 bg-white p-3">
          <div className="font-black">{onsite ? t.visa.docsOnsite : t.visa.docsWhatsapp}</div>
          <ul className="m-0 grid gap-2 ps-5 font-bold">
            {service.documents.map((doc) => (
              <li key={doc}>{doc}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <Honeypot />
      <FormError message={error} />
      <SubmitButton pending={pending} mode={booking.mode} />
      <WhatsAppFallback href={fallbackHref} />
    </form>
  );
}
