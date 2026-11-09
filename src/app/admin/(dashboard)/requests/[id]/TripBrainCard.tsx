import { CATEGORIES, type Category } from "@/lib/brain/pricing";
import type { TripBrainSnapshot } from "@/lib/brain/snapshot";
import type { Tip } from "@/lib/brain/builder";
import { formatDate, formatDT } from "@/lib/admin/format";
import { MIN_LEAD_DAYS, searchDates } from "@/lib/live/prices";
import { Card, Facts } from "../../../ui";

const CATEGORY_LABEL: Record<Category, string> = {
  flights: "Flights",
  stays: "Stays",
  visa: "Visa",
  local_transport: "Local transport",
  food: "Food",
  activities: "Activities",
  insurance: "Insurance",
  sim_esim: "SIM / eSIM",
  pocket_money: "Pocket money",
};
const STAY = { budget_hotel: "Budget hotel", good_hotel: "Good hotel", apartment: "Apartment" } as const;
const SEASON = { best: "best season", ok: "shoulder season", bad: "RAINY SEASON" } as const;
const MONTH = new Intl.DateTimeFormat("en-GB", { month: "long", timeZone: "UTC" });

/** What the brain still flagged when the customer ordered (they may have ordered anyway). */
function tipText(tip: Tip, place: (slug: string) => string): string | null {
  switch (tip.kind) {
    case "over":
      return `Over budget by about ${formatDT(tip.amountTND)}`;
    case "low_pocket":
      return `Only ${formatDT(tip.pocketTND)} per person per day left to spend (minimum ${formatDT(tip.minTND)})`;
    case "rainy":
      return `${place(tip.slug)} is in its rainy season on these dates`;
    case "min_nights":
      return `${place(tip.slug)} is shorter than its minimum (${tip.nights} nights)`;
    case "nights":
      return `Planned ${tip.planned} nights; the dates have ${tip.target}`;
    case "many_moves":
      return "Many moves for the number of nights";
    default:
      return null;
  }
}

/** The trip picked for the customer on "Find my trip" (the program they paid to unlock), as priced when they ordered. */
export function TripBrainCard({ snapshot: s }: { snapshot: TripBrainSnapshot }) {
  const i = s.input;
  const when = i.depart
    ? `${formatDate(i.depart)} → ${formatDate(i.ret)}${i.flexDays ? ` (± ${i.flexDays} days)` : ""}`
    : i.month
      ? `${MONTH.format(new Date(Date.UTC(2026, i.month - 1, 1)))}, ${i.nights} nights`
      : "—";
  const party = [`${i.adults} adult${i.adults === 1 ? "" : "s"}`, ...(i.children ? [`${i.children} child${i.children === 1 ? "" : "ren"} (${i.childAges.join(", ")})`] : [])];
  const place = (slug: string) => s.stops.find((x) => x.slug === slug)?.place ?? slug;
  const flags = s.tips.map((t) => tipText(t, place)).filter((t): t is string => t !== null);
  // Shares of the whole (the budget, or the trip cost when it goes over), so they add up to 100%.
  const overBy = Math.max(0, -s.budget.pocket_money);
  const shareBase = Math.max(s.totalBudgetTND, s.tripCostTND);

  return (
    <Card title={`Find my trip · ${s.countryName}`}>
      <div className="grid gap-4">
        {s.live?.flights || s.live?.hotels.length ? (
          <p className="m-0 rounded-xl bg-[#DCFCE7] px-3 py-2 text-sm font-bold text-[#166534]">
            Live prices when ordered: flights {s.live.flights ? "✓" : "— estimate"} · hotels{" "}
            {s.stops.map((b) => `${b.place} ${s.live!.hotels.includes(b.slug) ? "✓" : "— estimate"}`).join(", ")}
            {s.live.eurTnd ? ` · 1 EUR = ${s.live.eurTnd.toFixed(3)} DT` : ""}. Food, transport and activities are estimates.
          </p>
        ) : null}
        <LiveLinks snapshot={s} />
        {flags.length ? (
          <ul className="m-0 grid gap-1 rounded-xl bg-red-50 px-3 py-2 ps-7 text-sm font-bold text-red-800">
            {flags.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        ) : null}

        <Facts
          rows={[
            ["Budget", `${formatDT(i.budgetTND)} ${i.budgetScope === "per_person" ? "per person" : "in total"} · ${formatDT(s.totalBudgetTND)} total`],
            ["Group", `${i.group} · ${party.join(", ")}`],
            ["When", when],
            ["Vibes", i.vibes.join(", ") || "—"],
            ...(i.exclude?.length
              ? ([["Other destinations", `Asked for others — passed on: ${i.exclude.join(", ")}`]] as [string, string][])
              : []),
          ]}
        />

        <div className="grid gap-2">
          <h3 className="m-0 text-base font-black">
            Itinerary · {s.nights} nights{s.nights !== s.targetNights ? ` (dates: ${s.targetNights})` : ""}
          </h3>
          <ol className="m-0 grid list-none gap-2 p-0">
            {s.stops.map((b) => (
              <li key={b.slug} className="grid gap-1 rounded-xl border border-ink/10 p-3 text-sm">
                <span className="font-black">
                  {b.place} · {b.nights} nights · {STAY[b.stay]} <span className="font-bold opacity-60">({SEASON[b.season]})</span>
                </span>
                <span>
                  Suggested area: {b.stayArea || "—"} · on the ground ≈ {formatDT(b.costTND)}
                </span>
                {b.activities.length ? (
                  <ul className="m-0 grid gap-0.5 ps-4">
                    {b.activities.map((a) => (
                      <li key={a.name}>
                        {a.name} · {formatDT(a.priceTND)} pp · {a.booking ? "book ahead" : "pay on the spot"}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="opacity-60">No paid activities chosen</span>
                )}
              </li>
            ))}
          </ol>
        </div>

        <div className="grid gap-2">
          <h3 className="m-0 text-base font-black">Budget split (exact)</h3>
          <table className="w-full border-collapse text-sm">
            <tbody>
              {CATEGORIES.map((c) => {
                // Over budget, the "pocket money" left is negative: show 0 and say how much is missing instead.
                const value = c === "pocket_money" ? Math.max(0, s.budget[c]) : s.budget[c];
                return (
                  <tr key={c} className="border-b border-ink/8">
                    <td className="py-1.5">{CATEGORY_LABEL[c]}</td>
                    <td className="py-1.5 text-end font-bold whitespace-nowrap">{formatDT(value)}</td>
                    <td className="w-14 py-1.5 text-end opacity-60">{shareBase ? `${Math.round((value / shareBase) * 100)}%` : ""}</td>
                  </tr>
                );
              })}
              {overBy > 0 ? (
                <tr className="bg-red-50 text-red-800">
                  <td className="px-1 py-1.5 font-black">Over the budget by</td>
                  <td className="py-1.5 text-end font-black whitespace-nowrap">{formatDT(overBy)}</td>
                  <td className="w-14 py-1.5 text-end text-xs font-bold">of {formatDT(s.totalBudgetTND)}</td>
                </tr>
              ) : null}
            </tbody>
          </table>
          <Facts
            rows={[
              ["Trip cost", <strong key="cost">{formatDT(s.tripCostTND)}</strong>],
              ["Customer’s budget", formatDT(s.totalBudgetTND)],
              ["Pocket money", overBy > 0 ? "None left (over budget)" : `${formatDT(s.pocketPerPersonPerDay)} per person per day`],
              ["Margin", s.marginTND >= 0 ? `${formatDT(s.marginTND)} above the minimum pocket money` : `Short by ${formatDT(-s.marginTND)}`],
            ]}
          />
        </div>
        <p className="m-0 text-xs opacity-60">Priced {new Date(s.computedAt).toLocaleString("en-GB", { timeZone: "Africa/Tunis" })}</p>
      </div>
    </Card>
  );
}

const link = "font-bold text-sea underline underline-offset-2 hover:no-underline";

const enc = encodeURIComponent;
const DAY_MS = 86_400_000;
const addDays = (iso: string, n: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * DAY_MS).toISOString().slice(0, 10);
/** A Google Flights search for the order's dates, to check prices by hand (no API, nothing stored). */
const flightsSearch = (country: string, depart: string, ret: string) =>
  `https://www.google.com/travel/flights?hl=en&q=${enc(`Flights from Tunis to ${country} on ${depart} through ${ret}`)}`;
/** A Google Hotels search for a place and its nights. */
const hotelsSearch = (place: string, country: string, checkIn: string, checkOut: string) =>
  `https://www.google.com/travel/search?hl=en&q=${enc(`hotels in ${place}, ${country} from ${checkIn} to ${checkOut}`)}`;

/**
 * Where the flight and hotel prices came from, always with links: the day's Google Flights / Google Hotels
 * searches when the prices were live, otherwise why they're SAFRA's estimates and the same searches ready for
 * the order's dates, to check by hand.
 */
function LiveLinks({ snapshot: s }: { snapshot: TripBrainSnapshot }) {
  const ordered = new Date(s.computedAt);
  const dates = searchDates(s.input, ordered);
  const live = s.live;
  const day = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { timeZone: "Africa/Tunis", day: "numeric", month: "short", year: "numeric" });
  const anyLive = Boolean(live?.flights || live?.hotels.length);
  const tooClose = dates ? Date.parse(`${dates.depart}T00:00:00Z`) - ordered.getTime() < MIN_LEAD_DAYS * DAY_MS : false;
  const why = anyLive
    ? null
    : tooClose
      ? `Departure ${formatDate(dates!.depart)} was less than ${MIN_LEAD_DAYS} days after the order, so no live search was made (Google has almost no fares this close).`
      : "No live price was found for this order (live prices off, no key, monthly limit reached, or nothing on Google for these dates).";
  const flight = live?.flightLink;
  let offset = 0;
  const stays = s.stops.map((b) => {
    const checkIn = dates ? addDays(dates.depart, offset) : null;
    offset += b.nights;
    const checkOut = checkIn ? addDays(checkIn, b.nights) : null;
    return { b, checkIn, checkOut, link: live?.hotelLinks?.[b.slug], isLive: Boolean(live?.hotels.includes(b.slug)) };
  });

  return (
    <div className={`grid gap-2 rounded-xl border p-3 text-sm ${anyLive ? "border-[#16A34A]/30 bg-[#F0FDF4]" : "border-orange/40 bg-orange/8"}`}>
      <h3 className="m-0 text-base font-black">
        Price sources &amp; links{anyLive && live?.checkedAt ? ` · live prices checked ${day(live.checkedAt)}` : " · SAFRA estimates"}
      </h3>
      {why ? <p className="m-0 font-bold">{why} Use the links to check today’s prices before sending the plan.</p> : null}
      <ul className="m-0 grid list-none gap-2 p-0">
        <li className="grid gap-0.5">
          {flight ? (
            <>
              <span>
                <strong>Flights · live</strong> TUN ⇄ {s.countryName} · {formatDate(flight.depart)} → {formatDate(flight.ret)} ·{" "}
                {formatDT(flight.priceTND)} pp{flight.airline ? ` · ${flight.airline}` : ""}
              </span>
              <a href={flight.url} target="_blank" rel="noopener noreferrer" className={link}>
                Open the search behind this price on Google Flights ↗
              </a>
            </>
          ) : (
            <>
              <span>
                <strong>Flights · {live?.flights ? "live (link not kept on this older order)" : "SAFRA estimate"}</strong> TUN ⇄ {s.countryName}
                {dates ? ` · ${formatDate(dates.depart)} → ${formatDate(dates.ret)}` : ""} · {formatDT(s.budget.flights)} for {s.travelers}
              </span>
              {dates ? (
                <a href={flightsSearch(s.countryName, dates.depart, dates.ret)} target="_blank" rel="noopener noreferrer" className={link}>
                  Check on Google Flights ↗
                </a>
              ) : null}
            </>
          )}
        </li>
        {stays.map(({ b, checkIn, checkOut, link: h, isLive }) => (
          <li key={b.slug} className="grid gap-0.5">
            <span>
              <strong>
                Hotels in {b.place} · {h ? "live" : isLive ? "live (link not kept on this older order)" : "SAFRA estimate"}
              </strong>
              {checkIn && checkOut ? ` · ${formatDate(checkIn)} → ${formatDate(checkOut)}` : ""} · {STAY[b.stay]}
            </span>
            {h ? (
              <a href={h.url} target="_blank" rel="noopener noreferrer" className={link}>
                Open the search behind these prices on Google Hotels ↗
              </a>
            ) : checkIn && checkOut ? (
              <a href={hotelsSearch(b.place, s.countryName, checkIn, checkOut)} target="_blank" rel="noopener noreferrer" className={link}>
                Check on Google Hotels ↗
              </a>
            ) : null}
            {h?.examples.length ? (
              <ul className="m-0 grid gap-0.5 ps-4">
                {h.examples.map((e) => (
                  <li key={e.stay} className={e.stay === b.stay ? "font-bold" : "opacity-75"}>
                    {STAY[e.stay]}:{" "}
                    {e.url ? (
                      <a href={e.url} target="_blank" rel="noopener noreferrer" className={link}>
                        {e.name}
                      </a>
                    ) : (
                      e.name
                    )}{" "}
                    · {formatDT(e.nightTND)} / night{e.stay === b.stay ? " (the level picked)" : ""}
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
