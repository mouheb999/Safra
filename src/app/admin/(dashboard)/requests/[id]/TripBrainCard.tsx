import { CATEGORIES, type Category } from "@/lib/brain/pricing";
import type { TripBrainSnapshot } from "@/lib/brain/snapshot";
import type { Tip } from "@/lib/brain/builder";
import { formatDate, formatDT } from "@/lib/admin/format";
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

/** The trip the customer built on "Find my trip", as the server priced it when the order was placed. */
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

  return (
    <Card title={`Trip built by the customer · ${s.countryName}`}>
      <div className="grid gap-4">
        {s.estimated ? (
          <p className="m-0 rounded-xl bg-orange/15 px-3 py-2 text-sm font-bold">
            Starter price estimates — check flights and stays before you send the plan.
          </p>
        ) : null}
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
              {CATEGORIES.map((c) => (
                <tr key={c} className="border-b border-ink/8">
                  <td className="py-1.5">{CATEGORY_LABEL[c]}</td>
                  <td className={`py-1.5 text-end font-bold whitespace-nowrap ${s.budget[c] < 0 ? "text-red-700" : ""}`}>{formatDT(s.budget[c])}</td>
                  <td className="w-14 py-1.5 text-end opacity-60">{s.totalBudgetTND ? `${Math.round((s.budget[c] / s.totalBudgetTND) * 100)}%` : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Facts
            rows={[
              ["Trip cost", <strong key="cost">{formatDT(s.tripCostTND)}</strong>],
              ["Pocket money", `${formatDT(s.pocketPerPersonPerDay)} per person per day`],
              ["Margin", s.marginTND >= 0 ? `${formatDT(s.marginTND)} above the minimum pocket money` : `Short by ${formatDT(-s.marginTND)}`],
            ]}
          />
        </div>
        <p className="m-0 text-xs opacity-60">Priced {new Date(s.computedAt).toLocaleString("en-GB", { timeZone: "Africa/Tunis" })}</p>
      </div>
    </Card>
  );
}
