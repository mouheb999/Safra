"use client";

// The live WhatsApp assistance that comes with every trip plan, shown as the add-on it is: a SAFRA planner
// with the customer at each stage, from before departure until they land back home.
// - "full": the order summary (dark card) — a vertical timeline with what happens at each stage;
// - "compact": the locked trip cards on "Find my trip" (light) — the 4 stages on one line.

import type { ReactNode } from "react";
import { WhatsAppIcon } from "@/components/icons";
import { useI18n } from "@/i18n/client";

const STAGE_ICONS: ReactNode[] = [
  // Before you leave: a chat
  <path key="chat" d="M20.5 11.5a8.2 8.2 0 0 1-12.1 7.2L3.5 20.5l1.8-4.8A8.2 8.2 0 1 1 20.5 11.5Z" />,
  // Departure day: a plane taking off
  <path
    key="plane"
    d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2Z"
  />,
  // During the trip: a map pin
  <g key="pin">
    <path d="M19.5 10c0 5.5-7.5 11.5-7.5 11.5S4.5 15.5 4.5 10a7.5 7.5 0 0 1 15 0Z" />
    <circle cx="12" cy="10" r="2.6" />
  </g>,
  // Back home: a house
  <path key="home" d="M3.5 10.5 12 3.5l8.5 7V20a1 1 0 0 1-1 1h-4.8v-6H9.3v6H4.5a1 1 0 0 1-1-1Z" />,
];

function StageIcon({ i, size = 15 }: { i: number; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={i === 1 ? "rtl:-scale-x-100" : undefined}
    >
      {STAGE_ICONS[i]}
    </svg>
  );
}

/** Green dot that breathes: someone is there. */
function LiveDot() {
  return (
    <span aria-hidden className="relative inline-flex size-2.5 shrink-0">
      <span className="absolute inset-0 animate-ping rounded-full bg-[#25D366] opacity-60 motion-reduce:hidden" />
      <span className="relative size-2.5 rounded-full bg-[#25D366]" />
    </span>
  );
}

export function AssistJourney({ variant = "full" }: { variant?: "full" | "compact" }) {
  const { t } = useI18n();
  const a = t.checkout.assist;
  const full = variant === "full";

  return (
    <section
      aria-label={a.title}
      className={`relative isolate overflow-hidden rounded-[22px] p-4 ${
        full
          ? "bg-[linear-gradient(160deg,#0E4A36_0%,#123A30_60%,#173B32_100%)] text-cream ring-1 ring-[#25D366]/55 shadow-[0_0_0_5px_rgba(37,211,102,.08),0_18px_40px_-24px_rgba(37,211,102,.7)]"
          : "bg-[linear-gradient(160deg,#F0FDF4,#E3F8EA)] text-[#14532D] ring-1 ring-[#25D366]/40"
      }`}
    >
      <span aria-hidden className="pointer-events-none absolute -end-10 -top-12 -z-10 size-40 rounded-full bg-[#25D366]/20 blur-2xl" />

      <div className="flex items-center justify-between gap-3">
        <span className="relative grid size-11 shrink-0 place-items-center rounded-full bg-[#25D366] text-white shadow-[0_8px_18px_-8px_rgba(37,211,102,.95)]">
          <WhatsAppIcon size={22} />
          <span aria-hidden className={`absolute -end-0.5 -top-0.5 flex rounded-full p-[2px] ${full ? "bg-[#123A30]" : "bg-[#EAFBF0]"}`}>
            <LiveDot />
          </span>
        </span>
        <span className="rounded-full bg-orange px-2.5 py-1 text-[11px] font-black tracking-[.04em] text-ink uppercase rtl:tracking-normal">
          {a.badge}
        </span>
      </div>

      <div className="mt-3 grid gap-1">
        <strong className={`leading-tight font-black ${full ? "text-[20px]" : "text-[16px]"}`}>{a.title}</strong>
        <span className={`leading-snug font-semibold ${full ? "text-sm opacity-85" : "text-[13px] text-[#166534]"}`}>{a.lead}</span>
      </div>

      {full ? (
        <ol className="m-0 mt-4 grid list-none gap-0 p-0">
          {a.steps.map((s, i) => {
            const last = i === a.steps.length - 1;
            return (
              <li key={s.title} className="relative grid grid-cols-[32px_minmax(0,1fr)] gap-3 pb-3.5 last:pb-0">
                {!last ? (
                  <span aria-hidden className="absolute start-[15px] top-8 bottom-0 w-0.5 rounded-full bg-[repeating-linear-gradient(180deg,rgba(37,211,102,.75)_0_4px,transparent_4px_8px)]" />
                ) : null}
                <span
                  className={`relative grid size-8 place-items-center rounded-full ring-2 ${
                    last ? "bg-orange text-ink ring-orange/40" : "bg-[#25D366]/18 text-[#7CF0A9] ring-[#25D366]/45"
                  }`}
                >
                  <StageIcon i={i} />
                </span>
                <span className="grid gap-0.5 pt-1">
                  <span className="text-[15px] leading-tight font-black">{s.title}</span>
                  <span className="text-[13px] leading-snug opacity-80">{s.body}</span>
                </span>
              </li>
            );
          })}
        </ol>
      ) : (
        <ol className="relative m-0 mt-3.5 grid list-none grid-cols-4 gap-1 p-0">
          <span aria-hidden className="absolute inset-x-[12%] top-[15px] h-0.5 rounded-full bg-[repeating-linear-gradient(90deg,rgba(22,163,74,.6)_0_4px,transparent_4px_8px)]" />
          {a.steps.map((s, i) => (
            <li key={s.title} className="relative grid justify-items-center gap-1.5 text-center">
              <span
                className={`grid size-8 place-items-center rounded-full ring-2 ${
                  i === a.steps.length - 1 ? "bg-orange text-ink ring-white" : "bg-[#25D366] text-white ring-white"
                }`}
              >
                <StageIcon i={i} size={14} />
              </span>
              <span className="text-[11px] leading-tight font-extrabold">{s.title}</span>
            </li>
          ))}
        </ol>
      )}

      <p className={`m-0 mt-3.5 flex items-center gap-2 border-t pt-3 text-[13px] font-bold ${full ? "border-cream/12" : "border-[#14532D]/12"}`}>
        <LiveDot />
        {a.human}
      </p>
    </section>
  );
}

/** One line next to the order button: the assistance comes with the plan. */
export function AssistLine() {
  const { t } = useI18n();
  return (
    <p className="m-0 flex items-center gap-2.5 rounded-2xl bg-[#ECFDF3] px-3.5 py-2.5 text-[13px] leading-snug font-bold text-[#14532D] ring-1 ring-[#25D366]/35">
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#25D366] text-white">
        <WhatsAppIcon size={15} />
      </span>
      {t.checkout.assist.short}
    </p>
  );
}
