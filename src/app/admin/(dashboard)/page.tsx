import type { Metadata } from "next";
import Link from "next/link";
import {
  KIND_LABEL,
  LANGUAGE_LABEL,
  STATUSES,
  STATUS_LABEL,
  formatDT,
  formatDateTime,
  paymentLabel,
  type RequestKind,
  type RequestStatus,
} from "@/lib/admin/format";
import { requireAdmin } from "@/lib/admin/session";
import { Notice, PageHeader, StatusBadge, adminInput, adminPrimaryButton } from "../ui";

export const metadata: Metadata = { title: "Requests" };

const OPEN: RequestStatus[] = ["new", "contacted", "quoted", "paid"];
type View = "open" | "all" | RequestStatus;

const PAGE_SIZE = 100;

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; kind?: string; q?: string }>;
}) {
  const { supabase } = await requireAdmin();
  const sp = await searchParams;
  const view: View = sp.view === "all" || STATUSES.includes(sp.view as RequestStatus) ? (sp.view as View) : "open";
  const kind = (["trip", "visa", "safari"] as const).find((k) => k === sp.kind);
  // Keep PostgREST filter syntax out of the search term.
  const q = (sp.q ?? "").replace(/[%,()*\\]/g, " ").trim().slice(0, 60);

  // Counts per status for the tabs (one small query; fine at concierge volumes).
  const { data: statusRows } = await supabase.from("requests").select("status");
  const counts = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<RequestStatus, number>;
  for (const row of statusRows ?? []) counts[row.status]++;
  const openCount = OPEN.reduce((sum, s) => sum + counts[s], 0);

  let query = supabase
    .from("requests")
    .select("id, reference, kind, status, channel, locale, full_name, whatsapp, travelers, destination_text, budget_dt, payment_method, total_dt, created_at, safaris(name), visa_applications(services(country))")
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);
  if (view === "open") query = query.in("status", OPEN);
  else if (view !== "all") query = query.eq("status", view);
  if (kind) query = query.eq("kind", kind);
  if (q) query = query.or(`reference.ilike.%${q}%,full_name.ilike.%${q}%,whatsapp.ilike.%${q}%,destination_text.ilike.%${q}%`);
  const { data: requests, error } = await query;

  const tabs: [View, string, number][] = [
    ["open", "Open", openCount],
    ...STATUSES.map((s) => [s, STATUS_LABEL[s], counts[s]] as [View, string, number]),
    ["all", "All", statusRows?.length ?? 0],
  ];
  const href = (next: Partial<{ view: View; kind: RequestKind | undefined; q: string }>) => {
    const p = new URLSearchParams();
    const v = "view" in next ? next.view : view;
    const k = "kind" in next ? next.kind : kind;
    const search = "q" in next ? next.q : q;
    if (v && v !== "open") p.set("view", v);
    if (k) p.set("kind", k);
    if (search) p.set("q", search);
    const s = p.toString();
    return s ? `/admin?${s}` : "/admin";
  };

  const destinationOf = (r: NonNullable<typeof requests>[number]) =>
    r.kind === "visa" ? (r.visa_applications?.services?.country ?? "—") : r.kind === "safari" ? (r.safaris?.name ?? "—") : (r.destination_text ?? "—");
  const stats: [string, number, string, View][] = [
    ["Open", openCount, "To handle", "open"],
    ["New", counts.new, "Not contacted yet", "new"],
    ["Paid", counts.paid, "Plans to deliver", "paid"],
    ["All", statusRows?.length ?? 0, "Since the start", "all"],
  ];

  return (
    <div className="grid gap-5">
      <PageHeader title="Requests" lead="Trip plan orders and visa applications from the site, newest first." />

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
        {stats.map(([label, value, hint, v]) => (
          <Link
            key={label}
            href={href({ view: v })}
            className={`grid gap-0.5 rounded-2xl border bg-white p-3.5 shadow-[0_1px_2px_rgba(32,61,53,.05)] transition-colors hover:border-ink/25 sm:p-4 ${
              view === v ? "border-orange ring-1 ring-orange" : "border-ink/8"
            }`}
          >
            <span className="text-[13px] font-extrabold text-ink/60">{label}</span>
            <span className="text-[28px] leading-tight font-black tabular-nums">{value}</span>
            <span className="text-xs text-ink/55">{hint}</span>
          </Link>
        ))}
      </div>

      <div className="grid gap-3 rounded-2xl border border-ink/8 bg-white p-3 shadow-[0_1px_2px_rgba(32,61,53,.05)] sm:p-4">
        <form className="flex gap-2" action="/admin">
          {view !== "open" ? <input type="hidden" name="view" value={view} /> : null}
          {kind ? <input type="hidden" name="kind" value={kind} /> : null}
          <input name="q" defaultValue={q} placeholder="Search reference, name, phone, destination" aria-label="Search requests" className={`${adminInput} flex-1`} />
          <button className={adminPrimaryButton}>Search</button>
        </form>

        <nav aria-label="Status" className="-mx-3 flex gap-1.5 overflow-x-auto px-3 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
          {tabs.map(([v, label, count]) => (
            <Link
              key={v}
              href={href({ view: v })}
              aria-current={v === view ? "page" : undefined}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-extrabold whitespace-nowrap ${
                v === view ? "bg-ink text-cream" : "bg-ink/5 text-ink/75 hover:bg-ink/10"
              }`}
            >
              {label}
              <span className={`rounded-md px-1.5 text-xs tabular-nums ${v === view ? "bg-cream/20" : "bg-white"}`}>{count}</span>
            </Link>
          ))}
        </nav>

        <div className="flex flex-wrap items-center gap-1.5 text-sm">
          <span className="font-bold text-ink/55">Type</span>
          <div className="inline-flex rounded-lg bg-ink/5 p-0.5">
            {([undefined, "trip", "visa"] as const).map((k) => (
              <Link
                key={k ?? "any"}
                href={href({ kind: k })}
                className={`rounded-md px-3 py-1 font-extrabold ${k === kind ? "bg-white shadow-sm" : "text-ink/65 hover:text-ink"}`}
              >
                {k ? KIND_LABEL[k] : "Any"}
              </Link>
            ))}
          </div>
          {q ? (
            <Link href={href({ q: "" })} className="ms-auto font-bold underline">
              Clear “{q}”
            </Link>
          ) : null}
        </div>
      </div>

      {error ? <Notice tone="error">Couldn’t load requests: {error.message}</Notice> : null}

      {requests && requests.length > 0 ? (
        <>
          {/* Phones: one card per request. */}
          <ul className="m-0 grid list-none gap-2.5 p-0 md:hidden">
            {requests.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/admin/requests/${r.id}`}
                  className="grid gap-2 rounded-2xl border border-ink/8 bg-white p-3.5 shadow-[0_1px_2px_rgba(32,61,53,.05)] active:bg-cream"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-black tracking-[0.01em]">{r.reference}</span>
                    <StatusBadge status={r.status} />
                  </div>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="min-w-0 truncate font-extrabold">
                      {r.full_name}
                      {r.locale !== "en" ? <LocaleChip locale={r.locale} /> : null}
                    </span>
                    <span className="shrink-0 text-xs text-ink/55">{formatDateTime(r.created_at)}</span>
                  </div>
                  <div className="text-sm text-ink/70">
                    <span className="font-bold text-ink">{KIND_LABEL[r.kind]}</span> · {destinationOf(r)} · {r.travelers} pax
                  </div>
                  <div className="flex items-center justify-between gap-2 border-t border-ink/6 pt-2 text-sm">
                    {r.payment_method ? (
                      <span className="inline-flex items-center gap-1.5 font-bold">
                        <span className="rounded-md bg-[#CDEBD3] px-1.5 py-0.5 text-xs font-extrabold">Plan order</span>
                        {paymentLabel(r.payment_method)}
                      </span>
                    ) : (
                      <span className="text-ink/55">{r.budget_dt ? `Budget ${formatDT(r.budget_dt)}` : KIND_LABEL[r.kind]}</span>
                    )}
                    <strong className="tabular-nums">{r.payment_method ? formatDT(r.total_dt) : ""}</strong>
                  </div>
                  {r.channel === "onsite" ? <span className="text-xs font-bold text-[#9A3412]">Reserved on site — SAFRA contacts the customer</span> : null}
                </Link>
              </li>
            ))}
          </ul>

          {/* Wider screens: a table. */}
          <div className="hidden overflow-hidden rounded-2xl border border-ink/8 bg-white shadow-[0_1px_2px_rgba(32,61,53,.05)] md:block">
            <table className="w-full border-collapse text-left text-[15px]">
              <thead className="border-b border-ink/8 bg-ink/[0.03] text-xs font-extrabold tracking-wide text-ink/55 uppercase">
                <tr>
                  <th className="px-4 py-3">Ref</th>
                  <th className="px-4 py-3">Received</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Request</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id} className="border-b border-ink/6 last:border-0 hover:bg-cream/50">
                    <td className="px-4 py-3 font-extrabold whitespace-nowrap">
                      <Link href={`/admin/requests/${r.id}`} className="underline-offset-2 hover:underline">
                        {r.reference}
                      </Link>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-ink/65">{formatDateTime(r.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="font-bold">
                        {r.full_name}
                        {r.locale !== "en" ? <LocaleChip locale={r.locale} /> : null}
                      </div>
                      <div className="text-sm text-ink/60">{r.whatsapp}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold">{KIND_LABEL[r.kind]}</span> · {destinationOf(r)}
                      <span className="text-ink/55"> · {r.travelers} pax</span>
                      {r.payment_method ? (
                        <div className="mt-1 text-xs font-bold whitespace-nowrap">
                          <span className="rounded-md bg-[#CDEBD3] px-1.5 py-0.5">Plan order</span> {paymentLabel(r.payment_method)}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {r.payment_method ? <strong>{formatDT(r.total_dt)}</strong> : <span className="text-ink/60">{r.budget_dt ? `Budget ${formatDT(r.budget_dt)}` : "—"}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                      {r.channel === "onsite" ? (
                        <div className="mt-1 text-xs font-bold whitespace-nowrap text-[#9A3412]" title="Reserved on the site: SAFRA contacts the customer">
                          Reserved on site
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-ink/20 bg-white/60 p-10 text-center">
          <p className="m-0 font-bold">{q || kind || view !== "open" ? "No requests match these filters." : "No open requests."}</p>
          <p className="m-0 mt-1 text-sm text-ink/60">New requests from the site’s forms appear here with their SAFRA reference.</p>
        </div>
      )}
      {requests && requests.length === PAGE_SIZE ? (
        <p className="m-0 text-sm text-ink/60">Showing the newest {PAGE_SIZE}. Narrow it down with a status, type or search.</p>
      ) : null}
    </div>
  );
}

function LocaleChip({ locale }: { locale: string }) {
  return (
    <span className="ms-1.5 rounded bg-sky px-1.5 py-0.5 align-middle text-[11px] font-extrabold uppercase" title={`Wrote in ${LANGUAGE_LABEL[locale] ?? locale}`}>
      {locale}
    </span>
  );
}
