// Small presentational pieces shared by the admin pages (server-safe: no hooks).

import Link from "next/link";
import type { ReactNode } from "react";
import { STATUS_LABEL, STATUS_STYLE, type RequestStatus } from "@/lib/admin/format";

export const adminInput =
  "w-full min-w-0 rounded-lg border border-ink/15 bg-white px-3 py-2.5 text-[15px] text-ink shadow-[inset_0_1px_1px_rgba(32,61,53,.04)] focus-visible:border-orange focus-visible:outline-2 focus-visible:outline-orange/40";
export const adminPrimaryButton =
  "inline-flex min-h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-sm font-extrabold whitespace-nowrap text-cream shadow-sm transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60";
export const adminSecondaryButton =
  "inline-flex min-h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-ink/15 bg-white px-4 py-2 text-sm font-extrabold whitespace-nowrap transition-colors hover:bg-ink/5 disabled:cursor-wait disabled:opacity-60";
/** The save bar at the bottom of long forms: stays in view, just above the phone tab bar. */
export const adminSaveBar =
  "sticky bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-20 -mx-4 flex gap-3 border-t border-ink/10 bg-[#F3EEE2]/95 px-4 py-3 backdrop-blur md:bottom-0 [&>button]:w-full sm:[&>button]:w-auto";
/** Small buttons inside list rows. */
export const adminSmallButton =
  "inline-flex h-8 cursor-pointer items-center justify-center rounded-lg border border-ink/15 bg-white px-3 text-[13px] font-extrabold whitespace-nowrap transition-colors hover:bg-ink/5";

export function StatusBadge({ status }: { status: RequestStatus }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-extrabold whitespace-nowrap ${STATUS_STYLE[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

export function Card({ title, actions, children }: { title?: ReactNode; actions?: ReactNode; children: ReactNode }) {
  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-ink/8 bg-white shadow-[0_1px_2px_rgba(32,61,53,.05)]">
      {title || actions ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/6 px-4 py-3 sm:px-5">
          {title ? <h2 className="m-0 text-base font-black tracking-[-0.01em]">{title}</h2> : <span />}
          {actions}
        </div>
      ) : null}
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

/** Label/value rows for detail pages: label above value on phones, side by side on wider screens. */
export function Facts({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="m-0 grid text-[15px]">
      {rows.map(([label, value]) => (
        <div
          key={label}
          className="grid gap-0.5 border-b border-ink/6 py-2.5 first:pt-0 last:border-0 last:pb-0 sm:grid-cols-[minmax(130px,190px)_minmax(0,1fr)] sm:gap-4"
        >
          <dt className="text-[13px] font-bold text-ink/55 sm:text-[14px]">{label}</dt>
          <dd className="m-0 min-w-0 font-semibold [overflow-wrap:anywhere]">{value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

/** The top of every admin page: title, one line under it, and the page's main actions. */
export function PageHeader({ title, lead, actions }: { title: ReactNode; lead?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="grid min-w-0 gap-1">
        <h1 className="m-0 text-2xl font-black tracking-[-0.02em] sm:text-3xl">{title}</h1>
        {lead ? <p className="m-0 max-w-[760px] text-sm text-ink/65">{lead}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

/** One item in a catalog or trip-brain list: order, name and detail, then Hide/Show and Edit. */
export function ItemRow({
  order,
  name,
  detail,
  active,
  toggle,
  href,
}: {
  order: number;
  name: ReactNode;
  detail: ReactNode;
  active: boolean;
  toggle: () => Promise<void>;
  href: string;
}) {
  return (
    <li className="grid grid-cols-[28px_minmax(0,1fr)] items-center gap-x-3 gap-y-2 border-b border-ink/6 py-3 first:pt-0 last:border-0 last:pb-0 sm:grid-cols-[28px_minmax(0,1fr)_auto]">
      <span className="grid size-7 place-items-center rounded-md bg-ink/5 text-xs font-extrabold text-ink/60" title="Sort order">
        {order}
      </span>
      <div className={`min-w-0 ${active ? "" : "opacity-55"}`}>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-extrabold">
          {name}
          {active ? null : <span className="rounded-full bg-ink/10 px-2 py-0.5 text-[11px] font-extrabold">Hidden</span>}
        </div>
        <div className="mt-0.5 text-[13px] text-ink/65 [overflow-wrap:anywhere]">{detail}</div>
      </div>
      <div className="col-start-2 flex gap-2 sm:col-start-auto">
        <form action={toggle}>
          <button className={adminSmallButton}>{active ? "Hide" : "Show"}</button>
        </form>
        <Link href={href} className={adminSmallButton}>
          Edit
        </Link>
      </div>
    </li>
  );
}

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 justify-self-start text-sm font-extrabold text-ink/65 hover:text-ink">
      <span aria-hidden>←</span> {children}
    </Link>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "error"; children: ReactNode }) {
  const style = tone === "error" ? "bg-[#FFF1EC] text-[#9A3412]" : "bg-[#E6F4EA] text-[#1E5631]";
  return (
    <p role={tone === "error" ? "alert" : "status"} className={`m-0 rounded-xl px-3.5 py-2.5 text-sm font-bold ${style}`}>
      {children}
    </p>
  );
}
