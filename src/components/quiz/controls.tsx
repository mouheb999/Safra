"use client";

// Small form controls shared by the "Find my trip" questions and the trip builder.

import Image from "next/image";
import type { ReactNode } from "react";

/** The big question title of every step ("Find my trip" and the trip plan checkout look the same). */
export const questionHeading =
  "m-0 text-[38px] leading-[1.03] font-black tracking-[-0.03em] outline-none @min-[501px]:text-[44px] @min-[811px]:text-[56px] rtl:leading-[1.3] rtl:tracking-normal";

/** The orange "Continue →" button of every step. */
export const stepButton =
  "mt-2 inline-flex cursor-pointer items-center gap-2 justify-self-start rounded-full bg-orange px-7 py-[18px] font-black shadow-[0_14px_28px_-16px_rgba(255,128,85,.95)] transition-[transform,filter] duration-200 hover:-translate-y-0.5 hover:brightness-105 disabled:cursor-not-allowed disabled:bg-[#B9C0B8] disabled:shadow-none disabled:hover:translate-y-0 motion-reduce:transition-none";

/** "02/05" and a bar per step. */
export function StepProgress({ current, total }: { current: number; total: number }) {
  return (
    <div className="mb-3.5 flex items-center justify-between">
      <div className="text-[15px] font-extrabold tabular-nums">
        {String(current).padStart(2, "0")}/{String(total).padStart(2, "0")}
      </div>
      <div className="flex w-[120px] gap-1.5" aria-hidden>
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < current ? "bg-orange" : "bg-[#D2D8CF]"}`} />
        ))}
      </div>
    </div>
  );
}

/** The photo beside each question on wide screens (hidden on phones), with a short line above it. */
export function StepVisual({ image, position, label, detail }: { image: string; position?: string; label: string; detail: string }) {
  return (
    <aside className="relative w-full self-stretch @max-[810px]:hidden">
      <div className="sticky top-2.5 grid gap-2">
        <div className="text-xs font-black tracking-[.12em] text-sea rtl:tracking-normal">{label}</div>
        <div className="text-[13px] font-bold opacity-80">{detail}</div>
        <Image
          src={image}
          alt=""
          width={760}
          height={860}
          preload
          sizes="380px"
          className="mt-2 h-[430px] w-full rounded-[80px_24px_100px_28px] bg-sky object-cover shadow-[0_12px_28px_rgba(32,61,53,.18)] rtl:rounded-[24px_80px_28px_100px]"
          style={{ objectPosition: position }}
        />
      </div>
    </aside>
  );
}

export const choiceBase =
  "relative min-h-20 min-w-0 cursor-pointer rounded-[20px] border border-ink/16 px-4 py-3.5 text-start font-extrabold transition-all pointer-fine:hover:-translate-y-0.5 pointer-fine:hover:shadow-[0_10px_24px_rgba(32,61,53,.12)] motion-reduce:transition-none motion-reduce:hover:translate-none";

export function Choice({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: ReactNode; children: ReactNode }) {
  return (
    <button type="button" aria-pressed={active} onClick={onClick} className={`${choiceBase} ${active ? "border-orange bg-orange" : "bg-white/67"}`}>
      <span className="flex min-w-0 items-center gap-2.5 text-lg @max-[810px]:text-base">
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-white/67">{icon}</span>
        {children}
      </span>
    </button>
  );
}

export function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`cursor-pointer rounded-full border px-4 py-2.5 text-sm font-extrabold transition-colors ${active ? "border-orange bg-orange" : "border-ink/16 bg-white/67 hover:border-ink/35"}`}
    >
      {children}
    </button>
  );
}

export function Stepper({ label: text, value, min, max, onChange, display }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void; display?: string }) {
  const btn = "grid size-11 cursor-pointer place-items-center rounded-full border border-ink/16 bg-white text-xl font-black disabled:cursor-default disabled:opacity-35";
  return (
    <div className="grid gap-1.5">
      <span className="font-bold">{text}</span>
      <div className="flex items-center gap-3">
        <button type="button" aria-label={`${text} −`} disabled={value <= min} onClick={() => onChange(value - 1)} className={btn}>
          −
        </button>
        <span aria-live="polite" className="min-w-[3ch] text-center text-xl font-black tabular-nums">
          {display ?? value}
        </span>
        <button type="button" aria-label={`${text} +`} disabled={value >= max} onClick={() => onChange(value + 1)} className={btn}>
          +
        </button>
      </div>
    </div>
  );
}

export function DateField({ label: text, value, min, onChange }: { label: string; value: string; min?: string; onChange: (v: string) => void }) {
  return (
    <label className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-1.5 font-bold">
      {text}
      <input type="date" value={value} min={min || undefined} onChange={(e) => onChange(e.target.value)} className="w-full min-w-0 rounded-xl border border-ink/25 bg-white px-3 py-2.5" />
    </label>
  );
}
