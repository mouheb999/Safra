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
import { StatusBadge, adminInput, adminSecondaryButton } from "../ui";

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

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="m-0 text-3xl font-black tracking-[-0.02em]">Requests</h1>
        <form className="flex gap-2" action="/admin">
          {view !== "open" ? <input type="hidden" name="view" value={view} /> : null}
          {kind ? <input type="hidden" name="kind" value={kind} /> : null}
          <input name="q" defaultValue={q} placeholder="Reference, name, phone, destination" aria-label="Search requests" className={`${adminInput} w-[min(320px,60vw)]`} />
          <button className={adminSecondaryButton}>Search</button>
        </form>
      </div>

      <nav aria-label="Status" className="flex flex-wrap gap-1.5">
        {tabs.map(([v, label, count]) => (
          <Link
            key={v}
            href={href({ view: v })}
            aria-current={v === view ? "page" : undefined}
            className={`rounded-full px-3 py-1.5 text-sm font-extrabold ${v === view ? "bg-ink text-cream" : "bg-white hover:bg-ink/5"}`}
          >
            {label} <span className="opacity-60">{count}</span>
          </Link>
        ))}
      </nav>

      <div className="flex flex-wrap items-center gap-1.5 text-sm">
        <span className="font-bold opacity-60">Type:</span>
        {([undefined, "trip", "visa"] as const).map((k) => (
          <Link
            key={k ?? "any"}
            href={href({ kind: k })}
            className={`rounded-full px-2.5 py-1 font-bold ${k === kind ? "bg-orange" : "hover:bg-ink/5"}`}
          >
            {k ? KIND_LABEL[k] : "Any"}
          </Link>
        ))}
        {q ? (
          <Link href={href({ q: "" })} className="ml-2 font-bold underline">
            Clear search “{q}”
          </Link>
        ) : null}
      </div>

      {error ? <p role="alert" className="font-bold text-[#9A3412]">Couldn’t load requests: {error.message}</p> : null}

      {requests && requests.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl border border-ink/10 bg-white">
          <table className="w-full min-w-[760px] border-collapse text-left text-[15px]">
            <thead className="border-b border-ink/10 text-xs font-extrabold tracking-wide uppercase opacity-60">
              <tr>
                <th className="px-4 py-3">Ref</th>
                <th className="px-4 py-3">Received</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Request</th>
                <th className="px-4 py-3 text-right">Budget</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="border-b border-ink/5 last:border-0 hover:bg-cream/60">
                  <td className="px-4 py-3 font-extrabold whitespace-nowrap">
                    <Link href={`/admin/requests/${r.id}`} className="underline-offset-2 hover:underline">
                      {r.reference}
                    </Link>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap opacity-75">{formatDateTime(r.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="font-bold">
                      {r.full_name}
                      {r.locale !== "en" ? (
                        <span className="ms-1.5 rounded bg-sky px-1.5 py-0.5 align-middle text-[11px] font-extrabold uppercase" title={`Wrote in ${LANGUAGE_LABEL[r.locale] ?? r.locale}`}>
                          {r.locale}
                        </span>
                      ) : null}
                    </div>
                    <div className="text-sm opacity-65">{r.whatsapp}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-bold">{KIND_LABEL[r.kind]}</span>
                    {" · "}
                    {r.kind === "visa" ? (r.visa_applications?.services?.country ?? "—") : r.kind === "safari" ? (r.safaris?.name ?? "—") : (r.destination_text ?? "—")}
                    <span className="opacity-60"> · {r.travelers} pax</span>
                    {r.payment_method ? (
                      <div className="mt-1 text-xs font-bold whitespace-nowrap">
                        <span className="rounded bg-[#CDEBD3] px-1.5 py-0.5">Plan order</span> {paymentLabel(r.payment_method)} · {formatDT(r.total_dt)}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">{formatDT(r.budget_dt)}</td>
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
      ) : (
        <div className="rounded-2xl border border-dashed border-ink/20 bg-white/60 p-10 text-center">
          <p className="m-0 font-bold">{q || kind || view !== "open" ? "No requests match these filters." : "No open requests."}</p>
          <p className="m-0 mt-1 text-sm opacity-70">New requests from the site’s forms appear here with their SAFRA reference.</p>
        </div>
      )}
      {requests && requests.length === PAGE_SIZE ? (
        <p className="text-sm opacity-70">Showing the newest {PAGE_SIZE}. Narrow it down with a status, type or search.</p>
      ) : null}
    </div>
  );
}
