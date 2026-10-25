"use client";

import { useActionState } from "react";
import { saveSettings, type SettingsState } from "../../actions/settings";
import { Notice, adminInput, adminPrimaryButton } from "../../ui";

const MODES = [
  {
    value: "whatsapp",
    title: "WhatsApp hand-off",
    body: "The request is saved, then the visitor’s WhatsApp opens with a prepared message (with its SAFRA reference). They tap Send.",
  },
  {
    value: "onsite",
    title: "Reservation on the site",
    body: "The request is saved and the visitor sees a confirmation with their reference. No WhatsApp step — SAFRA contacts them. Shown as “Reserved on site” in Requests.",
  },
] as const;

export function SettingsForm({ bookingMode, whatsappNumber }: { bookingMode: string; whatsappNumber: string }) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(saveSettings, { error: null });

  return (
    <form action={action} className="grid gap-4">
      <fieldset className="grid gap-3 rounded-2xl border border-ink/10 bg-white p-4 sm:p-5">
        <legend className="px-1 text-lg font-black">How visitors send requests</legend>
        {MODES.map((m) => (
          <label
            key={m.value}
            className="flex cursor-pointer gap-3 rounded-xl border border-ink/12 p-3 has-checked:border-orange has-checked:bg-orange/10"
          >
            <input type="radio" name="booking_mode" value={m.value} defaultChecked={bookingMode === m.value} className="mt-1 size-4 accent-orange" />
            <span className="grid gap-0.5">
              <span className="font-extrabold">{m.title}</span>
              <span className="text-sm opacity-75">{m.body}</span>
            </span>
          </label>
        ))}
        <p className="m-0 text-xs opacity-70">
          Applies to every form: trip requests, visa applications and safaris. If saving ever fails, visitors still get
          WhatsApp so no request is lost.
        </p>
      </fieldset>

      <fieldset className="grid gap-2 rounded-2xl border border-ink/10 bg-white p-4 sm:p-5">
        <legend className="px-1 text-lg font-black">SAFRA’s WhatsApp number</legend>
        <label className="grid max-w-[320px] gap-1.5 text-sm font-bold">
          Number with country code
          <input name="whatsapp_number" type="tel" required defaultValue={`+${whatsappNumber}`} className={adminInput} />
        </label>
        <p className="m-0 text-xs opacity-70">Every “Message on WhatsApp” link and prepared message goes to this number.</p>
      </fieldset>

      {state.error ? <Notice tone="error">{state.error}</Notice> : null}
      <button disabled={pending} className={`${adminPrimaryButton} justify-self-start`}>
        {pending ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
