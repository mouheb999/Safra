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
import { BackLink, Card, Facts, StatusBadge, adminPrimaryButton } from "../../../ui";
import { StatusControl } from "./StatusControl";

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

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="m-0 text-3xl font-black tracking-[-0.02em]">{r.reference}</h1>
        <StatusBadge status={r.status} />
        <span className="text-sm opacity-70">
          {KIND_LABEL[r.kind]} · received {formatDateTime(r.created_at)} · {CHANNEL_LABEL[r.channel] ?? r.channel}
        </span>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="grid gap-4">
          <Card
            title="Customer"
            actions={
              <a href={customerWhatsappUrl(r.whatsapp, r.full_name, r.reference, r.locale)} target="_blank" rel="noopener" className={adminPrimaryButton}>
                Message on WhatsApp ↗
              </a>
            }
          >
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
                  ["Total", <strong>{formatDT(r.total_dt)}</strong>],
                  ...(r.payment_method === "cod"
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

        <div className="grid gap-4">
          <Card title="Status">
            <StatusControl id={r.id} status={r.status} />
          </Card>

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
