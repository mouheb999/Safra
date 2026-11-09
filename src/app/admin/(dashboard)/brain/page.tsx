import type { Metadata } from "next";
import Link from "next/link";
import { DEFAULT_BRAIN_SETTINGS } from "@/data/brain";
import { formatDT } from "@/lib/admin/format";
import { requireAdmin } from "@/lib/admin/session";
import { setBrainActive } from "../../actions/brain";
import { Card, ItemRow, Notice, PageHeader, adminPrimaryButton, adminSecondaryButton } from "../../ui";
import { liveKeyConfigured } from "@/lib/live/server";
import { BrainSettingsForm } from "./BrainSettingsForm";
import { LivePricesForm } from "./LivePricesForm";

// Live prices (SerpApi) can take 10–20 s on a new search; give the server action and page room to wait.
export const maxDuration = 60;

export const metadata: Metadata = { title: "Trip brain" };

const MONTHS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

export default async function BrainPage({ searchParams }: { searchParams: Promise<{ saved?: string; deleted?: string }> }) {
  const { supabase } = await requireAdmin();
  const { saved, deleted } = await searchParams;

  const month = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Tunis", year: "numeric", month: "2-digit" }).format(new Date());
  const [{ data: countries }, { data: bases }, { data: settings }, { data: usage }, { count: cached }, { data: latest }] = await Promise.all([
    supabase.from("brain_countries").select("code, name, flight_tnd, visa_tnd, flight_hours, sort_order, is_active, is_featured").order("sort_order"),
    supabase.from("brain_bases").select("slug, country_code, place, min_nights, best_months, ok_months, strengths, sort_order, is_active").order("sort_order"),
    supabase
      .from("site_settings")
      .select("brain_min_pocket_tnd, brain_card_fee_pct, brain_max_flight_share, brain_activity_every, live_prices_enabled, live_prices_monthly_limit, live_eur_tnd")
      .eq("id", 1)
      .maybeSingle(),
    supabase.from("live_price_usage").select("searches").eq("month", month).maybeSingle(),
    supabase.from("live_prices").select("cache_key", { count: "exact", head: true }).neq("kind", "fx"),
    supabase.from("live_prices").select("fetched_at").neq("kind", "fx").order("fetched_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  const keySet = liveKeyConfigured();
  const limit = settings?.live_prices_monthly_limit ?? 240;

  return (
    <div className="grid gap-5">
      <PageHeader
        title="Trip brain"
        lead="What “Find my trip” picks from. The prices below are SAFRA’s estimates in DT: they’re used whenever live prices aren’t available, and always for food, transport and activities, so keep them close to what you actually pay. Changes apply to the questionnaire right away."
      />
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

      <Card title="Live prices (SerpApi)">
        <div className="mb-4 grid gap-1 text-sm">
          <p className="m-0">
            {keySet ? (
              <strong className="text-[#166534]">● Key connected.</strong>
            ) : (
              <strong className="text-[#9A3412]">● No key yet.</strong>
            )}{" "}
            {keySet
              ? "Visitors get the day’s flight prices for their dates, and hotel prices for the places in their 2 trips. Anything missing uses the estimates below."
              : "Add SERPAPI_API_KEY in Vercel → Settings → Environment Variables, then redeploy. Until then, the estimates below are used."}
          </p>
          <p className="m-0 opacity-75">
            This month: {(usage?.searches ?? 0).toLocaleString("en-US")} / {limit.toLocaleString("en-US")} searches · {cached ?? 0} prices cached
            {latest?.fetched_at ? ` · last checked ${new Date(latest.fetched_at).toLocaleString("en-GB", { timeZone: "Africa/Tunis" })}` : ""}
          </p>
        </div>
        <LivePricesForm
          canTest={keySet}
          values={{
            live_prices_enabled: settings?.live_prices_enabled ?? true,
            live_prices_monthly_limit: limit,
            live_eur_tnd: Number(settings?.live_eur_tnd ?? 3.4),
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
            <ItemRow
              key={c.code}
              name={
                <>
                  {c.name}
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${c.is_featured ? "bg-orange/25" : "bg-sky"}`}>
                    {c.is_featured ? "Focus" : "Backup"}
                  </span>
                </>
              }
              detail={`Flights ${formatDT(c.flight_tnd)} pp · ${Number(c.flight_hours)} h · visa ${c.visa_tnd ? formatDT(c.visa_tnd) : "none"} · ${(bases ?? []).filter((b) => b.country_code === c.code).length} places`}
              active={c.is_active}
              order={c.sort_order}
              toggle={setBrainActive.bind(null, "brain_countries", c.code, !c.is_active)}
              href={`/admin/brain/countries/${c.code}`}
            />
          ))}
        </ul>
      </Card>

      <div className="grid gap-2.5">
        <h2 className="m-0 text-lg font-black">Places</h2>
        {(countries ?? []).map((c) => {
          const places = (bases ?? []).filter((b) => b.country_code === c.code);
          return (
            // One collapsible section per country, so the page stays short on a phone.
            <details key={c.code} className="group overflow-hidden rounded-2xl border border-ink/8 bg-white shadow-[0_1px_2px_rgba(32,61,53,.05)]">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 sm:px-5 [&::-webkit-details-marker]:hidden">
                <span className="flex min-w-0 items-center gap-2.5">
                  <span className="font-black">{c.name}</span>
                  <span className="rounded-md bg-ink/5 px-2 py-0.5 text-xs font-extrabold text-ink/60">
                    {places.length} place{places.length === 1 ? "" : "s"}
                  </span>
                </span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0 transition-transform group-open:rotate-180">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </summary>
              <div className="grid gap-3 border-t border-ink/6 p-4 sm:p-5">
                <ul className="m-0 grid list-none gap-0 p-0">
                  {places.map((b) => (
                    <ItemRow
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
                <Link href={`/admin/brain/places/new?country=${c.code}`} className={`${adminSecondaryButton} justify-self-start`}>
                  + New place in {c.name}
                </Link>
              </div>
            </details>
          );
        })}
      </div>
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
