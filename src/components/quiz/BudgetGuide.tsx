"use client";

// The budget step's live answer to "what does this budget get me?": how many destinations a typical week for two
// fits at this budget per person, from the same prices as the picks (src/lib/brain/surprise.ts → budgetGuide).

import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/fmt";
import { formatDT } from "@/lib/budget";

export interface GuideDestination {
  code: string;
  /** In the visitor's language. */
  name: string;
  featured: boolean;
  minPerPersonTND: number;
}

/** Where the slider turns amber (first destination in reach) and green (Southeast Asia in reach). */
export function guideZones(guide: GuideDestination[]): { amberFrom: number; greenFrom: number } | undefined {
  if (!guide.length) return undefined;
  const asia = guide.find((g) => g.featured);
  return { amberFrom: guide[0].minPerPersonTND, greenFrom: asia?.minPerPersonTND ?? guide[0].minPerPersonTND };
}

const TONE = {
  red: { box: "bg-[#FEECEC] ring-[#E5484D]/30 text-[#8F1D22]", dot: "bg-[#E5484D]" },
  amber: { box: "bg-[#FFF6E0] ring-[#F59E0B]/35 text-[#7A4B00]", dot: "bg-[#F59E0B]" },
  green: { box: "bg-[#E8F7EE] ring-[#16A34A]/30 text-[#14532D]", dot: "bg-[#16A34A]" },
} as const;

export function BudgetGuide({ value, guide }: { value: number; guide: GuideDestination[] }) {
  const { t, locale } = useI18n();
  const b = t.brain;
  if (!guide.length) return null;
  const inReach = guide.filter((g) => g.minPerPersonTND <= value);
  const asia = guide.filter((g) => g.featured);
  const asiaInReach = inReach.some((g) => g.featured);
  const tone = inReach.length === 0 ? "red" : asiaInReach || asia.length === 0 ? "green" : "amber";
  // "Morocco, Egypt and Turkey" in the visitor's language.
  const names = new Intl.ListFormat(locale, { type: "conjunction" }).format(inReach.slice(0, 3).map((g) => g.name));
  const text =
    tone === "red"
      ? fmt(b.guideNone, { min: formatDT(guide[0].minPerPersonTND, locale) })
      : tone === "green"
        ? asia.length
          ? fmt(b.guideAll, { n: inReach.length })
          : fmt(inReach.length === 1 ? b.guideOne : b.guideSome, { n: inReach.length, names })
        : `${fmt(inReach.length === 1 ? b.guideOne : b.guideSome, { n: inReach.length, names })} ${fmt(b.guideAsia, { asia: formatDT(asia[0].minPerPersonTND, locale) })}`;

  return (
    <div aria-live="polite" className={`grid gap-1 rounded-2xl px-4 py-3 ring-1 transition-colors ${TONE[tone].box}`}>
      <p className="m-0 flex items-start gap-2.5 font-extrabold">
        <span aria-hidden className={`mt-[7px] size-2.5 shrink-0 rounded-full ${TONE[tone].dot}`} />
        {text}
      </p>
      <p className="m-0 ps-5 text-[13px] font-semibold opacity-80">{b.guideNote}</p>
    </div>
  );
}
