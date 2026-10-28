import type { Metadata } from "next";
import Link from "next/link";
import { DEFAULT_BRAIN_SETTINGS } from "@/data/brain";
import { formatDT } from "@/lib/admin/format";
import { requireAdmin } from "@/lib/admin/session";
import { setBrainActive } from "../../actions/brain";
import { Card, Notice, adminPrimaryButton, adminSecondaryButton } from "../../ui";
import { BrainSettingsForm } from "./BrainSettingsForm";

export const metadata: Metadata = { title: "Trip brain" };

const MONTHS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

export default async function BrainPage({ searchParams }: { searchParams: Promise<{ saved?: string; deleted?: string }> }) {
  const { supabase } = await requireAdmin();
  const { saved, deleted } = await searchParams;

  const [{ data: countries }, { data: bases }, { data: settings }] = await Promise.all([
    supabase.from("brain_countries").select("code, name, flight_tnd, visa_tnd, flight_hours, sort_order, is_active").order("sort_order"),
    supabase.from("brain_bases").select("slug, country_code, place, min_nights, best_months, ok_months, strengths, sort_order, is_active").order("sort_order"),
    supabase.from("site_settings").select("brain_min_pocket_tnd, brain_card_fee_pct, brain_max_flight_share, brain_activity_every").eq("id", 1).maybeSingle(),
  ]);

  return (
    <div className="grid gap-4">
      <div>
        <h1 className="m-0 text-3xl font-black tracking-[-0.02em]">Trip brain</h1>
        <p className="m-0 mt-1 max-w-[760px] text-sm opacity-70">
          What “Find my trip” picks from. Prices are reference estimates in DT (shown to visitors as estimates), so keep
          flights and stays close to what you actually pay. Changes apply to the questionnaire right away.
        </p>
      </div>
      {saved ? <Notice>Saved: {saved}</Notice> : null}
      {deleted ? <Notice>Place deleted.</Notice> : null}

      <Card title="Rules">
        <BrainSettingsForm
          values={{
            brain_min_pocket_tnd: settings?.brain_min_pocket_tnd ?? DEFAULT_BRAIN_SETTINGS.minPocketTND,
            brain_card_fee_pct: Number(settings?.brain_card_fee_pct ?? DEFAULT_BRAIN_SETTINGS.cardFeePct),
            brain_max_flight_share: settings?.brain_max_flight_share ?? DEFAULT_BRAIN_SETTINGS.maxFlightSharePct,
            brain_activity_every: settings?.brain_activity_every ?? DEFAULT_BRAIN_SETTINGS.activityEveryDays,
          }}
        />
      </Card>

      <Card
        title="Countries"
        actions={
          <Link href="/admin/brain/countries/new" className={adminPrimaryButton}>
            + New country
          </Link>
        }
      >
        <ul className="m-0 grid list-none gap-0 p-0">
          {(countries ?? []).map((c) => (
            <Row
              key={c.code}
              name={c.name}
              detail={`Flights ${formatDT(c.flight_tnd)} pp · ${Number(c.flight_hours)} h · visa ${c.visa_tnd ? formatDT(c.visa_tnd) : "none"} · ${(bases ?? []).filter((b) => b.country_code === c.code).length} places`}
              active={c.is_active}
              order={c.sort_order}
              toggle={setBrainActive.bind(null, "brain_countries", c.code, !c.is_active)}
              href={`/admin/brain/countries/${c.code}`}
            />
          ))}
        </ul>
      </Card>

      {(countries ?? []).map((c) => (
        <Card
          key={c.code}
          title={`Places in ${c.name}`}
          actions={
            <Link href={`/admin/brain/places/new?country=${c.code}`} className={adminSecondaryButton}>
              + New place
            </Link>
          }
        >
          <ul className="m-0 grid list-none gap-0 p-0">
            {(bases ?? [])
              .filter((b) => b.country_code === c.code)
              .map((b) => (
                <Row
                  key={b.slug}
                  name={b.place}
                  detail={
                    <>
                      <MonthStrip best={b.best_months} ok={b.ok_months} /> · min {b.min_nights} nights · {b.strengths.join(", ")}
                    </>
                  }
                  active={b.is_active}
                  order={b.sort_order}
                  toggle={setBrainActive.bind(null, "brain_bases", b.slug, !b.is_active)}
                  href={`/admin/brain/places/${b.slug}`}
                />
              ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}

/** Best months in green, okay months in amber, the rest (never suggested) faded. */
function MonthStrip({ best, ok }: { best: number[]; ok: number[] }) {
  return (
    <span className="inline-flex gap-px align-middle font-mono text-[11px]" aria-label={`Best months ${best.join(", ")}; okay ${ok.join(", ") || "none"}`}>
      {MONTHS.map((m, i) => {
        const month = i + 1;
        const tone = best.includes(month) ? "bg-[#16A34A] text-white" : ok.includes(month) ? "bg-[#F59E0B] text-ink" : "bg-ink/8 opacity-50";
        return (
          <span key={i} className={`grid size-4 place-items-center rounded-sm ${tone}`}>
            {m}
          </span>
        );
      })}
    </span>
  );
}

function Row({
  name,
  detail,
  active,
  order,
  toggle,
  href,
}: {
  name: string;
  detail: React.ReactNode;
  active: boolean;
  order: number;
  toggle: () => Promise<void>;
  href: string;
}) {
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-ink/5 py-2.5 last:border-0">
      <span className="w-6 text-sm font-bold opacity-50" title="Sort order">
        {order}
      </span>
      <div className={`min-w-[200px] flex-1 ${active ? "" : "opacity-50"}`}>
        <div className="font-extrabold">
          {name}
          {active ? null : <span className="ml-2 rounded-full bg-ink/10 px-2 py-0.5 text-xs">Hidden</span>}
        </div>
        <div className="text-sm opacity-70">{detail}</div>
      </div>
      <form action={toggle}>
        <button className={`${adminSecondaryButton} px-3 py-1`}>{active ? "Hide" : "Show"}</button>
      </form>
      <Link href={href} className={`${adminSecondaryButton} px-3 py-1`}>
        Edit
      </Link>
    </li>
  );
}
