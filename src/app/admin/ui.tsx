// Small presentational pieces shared by the admin pages (server-safe: no hooks).

import Link from "next/link";
import type { ReactNode } from "react";
import { STATUS_LABEL, STATUS_STYLE, type RequestStatus } from "@/lib/admin/format";

export const adminInput =
  "w-full min-w-0 rounded-lg border border-ink/20 bg-white px-3 py-2 text-[15px] text-ink focus-visible:outline-2 focus-visible:outline-orange";
export const adminPrimaryButton =
  "inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-sm font-extrabold text-cream hover:opacity-90 disabled:cursor-wait disabled:opacity-60";
export const adminSecondaryButton =
  "inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-ink/20 bg-white px-4 py-2 text-sm font-extrabold hover:bg-ink/5 disabled:cursor-wait disabled:opacity-60";

export function StatusBadge({ status }: { status: RequestStatus }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-extrabold whitespace-nowrap ${STATUS_STYLE[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

export function Card({ title, actions, children }: { title?: ReactNode; actions?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-ink/10 bg-white p-4 sm:p-5">
      {title || actions ? (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          {title ? <h2 className="m-0 text-lg font-black">{title}</h2> : <span />}
          {actions}
        </div>
      ) : null}
      {children}
    </section>
  );
}

/** Label/value rows for detail pages. */
export function Facts({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="m-0 grid grid-cols-[minmax(110px,auto)_1fr] gap-x-4 gap-y-2 text-[15px]">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="font-bold opacity-65">{label}</dt>
          <dd className="m-0 min-w-0 [overflow-wrap:anywhere]">{value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="text-sm font-extrabold opacity-70 hover:opacity-100">
      ← {children}
    </Link>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "error"; children: ReactNode }) {
  const style = tone === "error" ? "bg-[#FFF1EC] text-[#9A3412]" : "bg-[#E6F4EA] text-[#1E5631]";
  return (
    <p role={tone === "error" ? "alert" : "status"} className={`m-0 rounded-lg px-3 py-2 text-sm font-bold ${style}`}>
      {children}
    </p>
  );
}
