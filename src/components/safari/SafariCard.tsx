import Image from "next/image";
import type { Safari } from "@/data/safaris";
import { fmt, getMessages } from "@/i18n";
import type { Locale } from "@/i18n/config";
import type { BookingConfig } from "@/lib/requests";
import { SafariRequestDialog } from "./SafariRequestDialog";

const chip = "justify-self-start rounded-full border border-ink/18 bg-white";

export function SafariCard({
  safari,
  booking,
  locale,
  preload = false,
}: {
  safari: Safari;
  booking: BookingConfig;
  locale: Locale;
  preload?: boolean;
}) {
  const t = getMessages(locale);
  return (
    <section className="@container">
      <article className="grid min-h-[400px] grid-cols-[minmax(0,1.12fr)_minmax(0,1fr)] overflow-hidden rounded-[36px] border border-ink/13 bg-cream @max-[700px]:grid-cols-1">
        <div className="relative min-h-[400px] @max-[700px]:h-[260px] @max-[700px]:min-h-[260px]">
          <Image
            src={safari.image.src}
            alt={safari.image.alt}
            fill
            preload={preload}
            sizes="(max-width: 760px) 100vw, 600px"
            className="rounded-[36px_100px_36px_36px] object-cover @max-[700px]:rounded-[36px_36px_24px_24px] rtl:rounded-[100px_36px_36px_36px]"
          />
        </div>

        <div className="grid min-w-0 content-start gap-3.5 p-8 @max-[700px]:p-6">
          <span className={`${chip} px-3 py-1.5 text-[11px] font-black tracking-[.12em] uppercase rtl:tracking-normal`}>{t.safari.badge}</span>
          <h2 className="m-0 text-[38px] leading-[1.02] font-black tracking-[-0.03em] @max-[700px]:text-[30px] rtl:leading-[1.3] rtl:tracking-normal">
            {safari.name}
          </h2>
          <p className="m-0 leading-[1.45] font-semibold opacity-90">{safari.description}</p>
          <span className={`${chip} px-3 py-2 text-sm font-extrabold`}>{fmt(t.safari.suggested, { duration: safari.duration })}</span>
          <ul className="m-0 grid list-none gap-2 p-0">
            {safari.highlights.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm font-bold">
                <span
                  aria-hidden
                  className="grid size-[18px] shrink-0 place-items-center rounded-full border border-ink/18 bg-white text-xs"
                >
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
          <p className="m-0 text-xs font-bold opacity-80">{t.safari.note}</p>
          <SafariRequestDialog safari={safari.name} slug={safari.slug} booking={booking} />
        </div>
      </article>
    </section>
  );
}
