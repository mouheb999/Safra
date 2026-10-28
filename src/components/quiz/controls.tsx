"use client";

// Small form controls shared by the "Find my trip" questions and the trip builder.

import type { ReactNode } from "react";

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
    <label className="grid gap-1.5 font-bold">
      {text}
      <input type="date" value={value} min={min || undefined} onChange={(e) => onChange(e.target.value)} className="w-full min-w-0 rounded-xl border border-ink/25 bg-white px-3 py-2.5" />
    </label>
  );
}
