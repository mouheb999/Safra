"use client";

import Image from "next/image";
import Link from "next/link";
import type { LocalizedPack } from "@/data/packs";
import { ArrowIcon } from "@/components/icons";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/fmt";
import { formatDT } from "@/lib/budget";

/** Checkout link for a pack: its destination, the price as the per-person budget, nights + 1 days. */
export const packHref = (p: LocalizedPack) =>
  `/trip-request?${new URLSearchParams({
    destination: p.destinationSlug,
    pack: p.slug,
    budget: String(p.priceDT),
    duration: `${p.nights + 1} days`,
  })}`;

/**
 * A ready-made pack: photo with the nights, country and title, route, what's included, price per person.
 * The whole card is one link to the checkout; `muted` greys it (the home slider's out-of-budget packs).
 */
export function PackCard({
  pack: p,
  sizes,
  preload = false,
  muted = false,
  badge,
}: {
  pack: LocalizedPack;
  sizes: string;
  preload?: boolean;
  muted?: boolean;
  badge?: string;
}) {
  const { t, locale, href } = useI18n();
  const shown = p.includes.filter((i) => i !== "plan" && i !== "breakfast").slice(0, 4);

  return (
    <Link
      href={href(packHref(p))}
      aria-label={`${p.title}, ${p.country} — ${fmt(t.packs.nights, { n: p.nights })}, ${formatDT(p.priceDT, locale)} ${t.packs.perPerson}`}
      className={`group @container flex h-full flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_1px_0_rgba(32,61,53,.06),0_10px_30px_-18px_rgba(32,61,53,.35)] ring-1 ring-ink/8 transition-[transform,box-shadow,opacity,filter] duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_1px_0_rgba(32,61,53,.06),0_22px_40px_-20px_rgba(32,61,53,.45)] motion-reduce:transition-none motion-reduce:hover:translate-none ${
        muted ? "opacity-55 grayscale-[.6] hover:opacity-90 hover:grayscale-0" : ""
      }`}
    >
      <div className="relative aspect-[5/4] overflow-hidden bg-sky">
        <Image
          src={p.image}
          alt=""
          fill
          preload={preload}
          sizes={sizes}
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transition-none"
        />
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-ink/55 to-transparent" />
        <span className="absolute start-3 top-3 rounded-full bg-cream/95 px-3 py-1.5 text-xs font-black">
          {fmt(t.packs.nights, { n: p.nights })}
        </span>
        {badge ? (
          <span className="absolute end-3 top-3 rounded-full bg-orange px-3 py-1.5 text-xs font-black">{badge}</span>
        ) : null}
        <span className="absolute start-4 bottom-3 text-sm font-extrabold text-cream">{p.country}</span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="grid gap-1">
          <h3 className="m-0 text-[22px] leading-tight font-black tracking-[-0.01em] rtl:tracking-normal">{p.title}</h3>
          <p className="m-0 text-sm font-bold text-sea">{p.route}</p>
        </div>
        <p className="m-0 text-[15px] leading-snug opacity-80">{p.blurb}</p>
        <p className="m-0 text-xs font-bold opacity-70">{shown.map((i) => t.packs.includes[i]).join(" · ")}</p>

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-ink/8 pt-4">
          <span className="grid">
            <span className="text-[26px] leading-none font-black tracking-[-0.02em] whitespace-nowrap rtl:tracking-normal">{formatDT(p.priceDT, locale)}</span>
            <span className="mt-1 text-xs font-bold opacity-65">{t.packs.perPerson}</span>
          </span>
          {/* Narrow cards (the home slider on phones): just the arrow; the card's label says the rest. */}
          <span className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-sm font-extrabold text-cream transition-colors group-hover:bg-orange group-hover:text-ink @max-[320px]:size-11 @max-[320px]:p-0">
            <span className="@max-[320px]:hidden">{t.packs.choose}</span>
            <ArrowIcon size={14} />
          </span>
        </div>
      </div>
    </Link>
  );
}
