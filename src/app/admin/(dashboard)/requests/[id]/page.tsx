import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import {
  CHANNEL_LABEL,
  KIND_LABEL,
  LANGUAGE_LABEL,
  SOURCE_LABEL,
  STATUS_LABEL,
  customerWhatsappUrl,
  formatDT,
  formatDate,
  formatDateTime,
  paymentLabel,
} from "@/lib/admin/format";
import { requireAdmin } from "@/lib/admin/session";
import { BackLink, Card, Facts, StatusBadge } from "../../../ui";
import { isBrainSnapshot } from "@/lib/brain/snapshot";
import { StatusControl } from "./StatusControl";
import { TripBrainCard } from "./TripBrainCard";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `Request ${id.slice(0, 8)}` };
}

const yesNo = (value: boolean) => (value ? "Yes" : "No");

export default async function RequestPage({ params }: Props) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const { supabase, userId } = await requireAdmin();

  const { data: r } = await supabase
    .from("requests")
    .select("*, destinations(title, country), safaris(name)")
    .eq("id", id)
    .maybeSingle();
  if (!r) notFound();

  const [{ data: visa }, { data: events }, { data: admins }] = await Promise.all([
    r.kind === "visa"
      ? supabase.from("visa_applications").select("*, services(name, country, flag)").eq("request_id", id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("request_events").select("id, from_status, to_status, actor, created_at").eq("request_id", id).order("id"),
    supabase.from("admins").select("user_id, email"),
  ]);
  const adminEmail = new Map((admins ?? []).map((a) => [a.user_id, a.email]));
  const who = (actor: string | null) =>
    actor === null ? "Website form" : actor === userId ? "You" : (adminEmail.get(actor) ?? "Former admin");

  const visaCountry = visa?.services?.country || "the destination";
  const what =
    r.kind === "visa"
      ? (visa?.services ? `${visa.services.flag} ${visa.services.name}`.trim() : "Visa assistance")
      : r.kind === "safari"
        ? (r.safaris?.name ?? "Safari")
        : (r.destinations ? `${r.destinations.title}, ${r.destinations.country}` : r.destination_text) ?? "—";

  return (
    <div className="grid gap-4">
      <BackLink href="/admin">All requests</BackLink>

      {/* Summary: who, what, how much, and the one action used most (WhatsApp). */}
      <div className="grid gap-4 rounded-2xl border border-ink/8 bg-white p-4 shadow-[0_1px_2px_rgba(32,61,53,.05)] sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="grid min-w-0 gap-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="m-0 text-2xl font-black tracking-[-0.02em] sm:text-3xl">{r.reference}</h1>
              <StatusBadge status={r.status} />
            </div>
            <p className="m-0 text-sm text-ink/60">
              {KIND_LABEL[r.kind]} · received {formatDateTime(r.created_at)} · {CHANNEL_LABEL[r.channel] ?? r.channel}
            </p>
          </div>
          <a
            href={customerWhatsappUrl(r.whatsapp, r.full_name, r.reference, r.locale)}
            target="_blank"
            rel="noopener"
            className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 text-sm font-black text-white shadow-sm hover:brightness-95 sm:w-auto"
          >
            Message {r.full_name.split(" ")[0]} on WhatsApp ↗
          </a>
        </div>
        <dl className="m-0 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {(
            [
              ["Customer", r.full_name],
              ["For", what],
              ["Travelers", String(r.travelers)],
              r.payment_method ? ["Order total", formatDT(r.total_dt)] : ["Budget", formatDT(r.budget_dt)],
            ] as [string, string][]
          ).map(([label, value]) => (
            <div key={label} className="grid min-w-0 gap-0.5 rounded-xl bg-ink/[0.035] px-3 py-2.5">
              <dt className="text-xs font-extrabold text-ink/55">{label}</dt>
              <dd className="m-0 truncate font-black" title={value}>
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        {/* On phones the status comes first (it's what changes); on wide screens it sits in the side column. */}
        <div className="lg:hidden">
          <Card title="Status">
            <StatusControl id={r.id} status={r.status} />
          </Card>
        </div>
        <div className="grid min-w-0 gap-4">
          <Card title="Customer">
            <Facts
              rows={[
                ["Name", r.full_name],
                ["WhatsApp", r.whatsapp],
                ["Travelers", r.travelers],
                ["Language", LANGUAGE_LABEL[r.locale] ?? r.locale],
              ]}
            />
          </Card>

          <Card title="Request">
            <Facts
              rows={[
                ["For", what],
                ...(r.kind !== "visa"
                  ? ([
                      ["Preferred date", formatDate(r.preferred_date)],
                      ["Duration", r.duration_days ? `${r.duration_days} days` : (r.duration_text ?? "—")],
                      ["Budget (total)", formatDT(r.budget_dt)],
                    ] as [string, React.ReactNode][])
                  : []),
                ["Category", r.category ?? "—"],
                ["Came from", SOURCE_LABEL[r.source]],
                ["Notes", r.notes ? <span className="whitespace-pre-line">{r.notes}</span> : "—"],
              ]}
            />
          </Card>

          {isBrainSnapshot(r.quiz_answers) ? <TripBrainCard snapshot={r.quiz_answers} /> : null}

          {r.payment_method ? (
            <Card title={`Trip plan order · ${formatDT(r.total_dt)}`}>
              <Facts
                rows={[
                  [
                    "Payment",
                    r.payment_method === "cod"
                      ? "Cash on delivery — collect on delivery"
                      : `${paymentLabel(r.payment_method)} — check the receipt on WhatsApp before marking it Paid`,
                  ],
                  ["Plan price", formatDT(r.plan_price_dt)],
                  ["Delivery fee", r.payment_method === "cod" ? formatDT(r.delivery_fee_dt) : "— (online)"],
                  ...(r.assist
                    ? ([
                        [
                          "WhatsApp assistance",
                          r.assist === "included"
                            ? "Included in the plan — assist from departure to return"
                            : r.assist === "added"
                              ? `Paid add-on, ${formatDT(r.assist_dt ?? 0)} — assist from departure to return`
                              : "Not taken (add-on declined)",
                        ],
                      ] as [string, React.ReactNode][])
                    : []),
                  ["Total", <strong>{formatDT(r.total_dt)}</strong>],
                  // Every order since the two-page checkout has an address; older online orders don't.
                  ...(r.delivery_governorate || r.delivery_address
                    ? ([
                        ["Governorate", r.delivery_governorate ?? "—"],
                        ["Address", r.delivery_address ?? "—"],
                      ] as [string, React.ReactNode][])
                    : []),
                ]}
              />
            </Card>
          ) : null}

          {visa ? (
            <Card title={`Visa application · ${formatDT(visa.price_dt)}`}>
              <Facts
                rows={[
                  ["Date of birth", formatDate(visa.date_of_birth)],
                  ["Nationality", visa.nationality],
                  ["Passport no.", <span className="font-mono">{visa.passport_number}</span>],
                  ["Passport expiry", formatDate(visa.passport_expiry)],
                  ["Arrival", formatDate(visa.arrival_date)],
                  ["Departure", formatDate(visa.departure_date)],
                  ["Purpose", visa.purpose_of_travel],
                  ["Occupation", visa.occupation_status],
                  ["Flight booked", yesNo(visa.flight_booked)],
                  ["Accommodation booked", yesNo(visa.accommodation_booked)],
                  [`Visited ${visaCountry} before`, yesNo(visa.previous_visit)],
                  ["Previous visa refusal", yesNo(visa.previous_visa_refusal)],
                ]}
              />
            </Card>
          ) : null}
        </div>

        <div className="grid min-w-0 gap-4 lg:sticky lg:top-20">
          <div className="hidden lg:block">
            <Card title="Status">
              <StatusControl id={r.id} status={r.status} />
            </Card>
          </div>

          <Card title="History">
            <ol className="m-0 grid list-none gap-3 p-0">
              {(events ?? []).map((e) => (
                <li key={e.id} className="grid gap-0.5 border-l-2 border-orange/60 pl-3 text-sm">
                  <span className="font-bold">
                    {e.from_status ? `${STATUS_LABEL[e.from_status]} → ${STATUS_LABEL[e.to_status]}` : "Request received"}
                  </span>
                  <span className="opacity-65">
                    {who(e.actor)} · {formatDateTime(e.created_at)}
                  </span>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </div>
  );
}
