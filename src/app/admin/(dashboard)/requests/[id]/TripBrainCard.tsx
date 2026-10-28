import { CATEGORIES, type Category } from "@/lib/brain/engine";
import type { TripBrainSnapshot } from "@/lib/brain/snapshot";
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
const LABEL = { best_value: "Best value", best_experience: "Best experience", easiest: "Easiest" } as const;
const STAY = { budget_hotel: "Budget hotel", good_hotel: "Good hotel", apartment: "Apartment" } as const;
const ADJUSTMENT = {
  fewer_activities: "fewer paid activities",
  no_activities: "no paid activities",
  fewer_bases: "one base fewer",
} as const;
const MONTH = new Intl.DateTimeFormat("en-GB", { month: "long", timeZone: "UTC" });

/** The trip chosen on "Find my trip", as the server recomputed it when the order was placed. */
export function TripBrainCard({ snapshot: s }: { snapshot: TripBrainSnapshot }) {
  const i = s.input;
  const o = s.option;
  const when = i.depart
    ? `${formatDate(i.depart)} → ${formatDate(i.ret)}${i.flexDays ? ` (± ${i.flexDays} days)` : ""}`
    : i.month
      ? `${MONTH.format(new Date(Date.UTC(2026, i.month - 1, 1)))}, ${i.nights} nights`
      : "—";
  const party = [`${i.adults} adult${i.adults === 1 ? "" : "s"}`, ...(i.children ? [`${i.children} child${i.children === 1 ? "" : "ren"} (${i.childAges.join(", ")})`] : [])];

  return (
    <Card title={o ? `Trip brain · ${o.countryName} · ${LABEL[o.label]}` : "Trip brain"}>
      <div className="grid gap-4">
        {s.estimated ? (
          <p className="m-0 rounded-xl bg-orange/15 px-3 py-2 text-sm font-bold">
            Starter price estimates — check flights and stays before you send the plan.
          </p>
        ) : null}
        {!o ? (
          <p className="m-0 rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-800">
            This trip no longer fits with today&apos;s prices. Rebuild it by hand from the answers below.
          </p>
        ) : null}

        <Facts
          rows={[
            ["Budget", `${formatDT(i.budgetTND)} ${i.budgetScope === "per_person" ? "per person" : "in total"}${s.totalBudgetTND ? ` · ${formatDT(s.totalBudgetTND)} total` : ""}`],
            ["Group", `${i.group} · ${party.join(", ")}`],
            ["When", when],
            ["Vibes", i.vibes.join(", ") || "—"],
            ["Stay", STAY[i.stay]],
          ]}
        />

        {o ? (
          <>
            <div className="grid gap-2">
              <h3 className="m-0 text-base font-black">Itinerary · {s.nights} nights</h3>
              <ol className="m-0 grid list-none gap-2 p-0">
                {o.bases.map((b) => (
                  <li key={b.slug} className="grid gap-1 rounded-xl border border-ink/10 p-3 text-sm">
                    <span className="font-black">
                      {o.places[b.slug] ?? b.slug} · {b.nights} nights{" "}
                      <span className="font-bold opacity-60">({b.season === "best" ? "best season" : "shoulder season"})</span>
                    </span>
                    <span>Stay in: {b.stayArea}</span>
                    {b.activities.length ? (
                      <ul className="m-0 grid gap-0.5 ps-4">
                        {b.activities.map((a) => (
                          <li key={a.name}>
                            {a.name} · {formatDT(a.priceTND)} pp · {a.booking ? "book ahead" : "pay on the spot"}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="opacity-60">No paid activities</span>
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
                      <td className="py-1.5 text-end font-bold whitespace-nowrap">{formatDT(o.budget[c])}</td>
                      <td className="w-14 py-1.5 text-end opacity-60">
                        {s.totalBudgetTND ? `${Math.round((o.budget[c] / s.totalBudgetTND) * 100)}%` : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Facts
                rows={[
                  ["Trip cost", <strong key="cost">{formatDT(o.tripCostTND)}</strong>],
                  ["Pocket money", `${formatDT(o.pocketPerPersonPerDay)} per person per day`],
                  ["Adjusted", o.adjustments.length ? o.adjustments.map((a) => ADJUSTMENT[a]).join(", ") : "—"],
                  ["Score", `${o.score} / 100`],
                ]}
              />
            </div>
          </>
        ) : null}
        <p className="m-0 text-xs opacity-60">Computed {new Date(s.computedAt).toLocaleString("en-GB", { timeZone: "Africa/Tunis" })}</p>
      </div>
    </Card>
  );
}
