import type { Metadata } from "next";
import Image from "next/image";
import { SafariCard } from "@/components/safari/SafariCard";
import { getMessages } from "@/i18n";
import { routeLocale, type LocaleParams } from "@/i18n/server";
import { getBookingConfig, getSafaris } from "@/lib/catalog";
import { pageMetadata } from "@/lib/site";

export const revalidate = 300;

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await routeLocale(params);
  return pageMetadata(locale, { ...getMessages(locale).meta.safari, path: "/safari" });
}

export default async function SafariPage({ params }: LocaleParams) {
  const locale = await routeLocale(params);
  const t = getMessages(locale);
  const [safaris, booking] = await Promise.all([getSafaris(locale), getBookingConfig()]);
  return (
    <main className="px-4 pt-12 pb-24 sm:px-7">
      <div className="mx-auto max-w-[1180px]">
        <p className="text-xs font-black tracking-[0.12em] text-sea rtl:tracking-normal">{t.safari.eyebrow}</p>
        <h1 className="mt-3 text-[40px] leading-[1.05] font-black tracking-[-0.03em] sm:text-[56px] rtl:leading-[1.3] rtl:tracking-normal">
          {t.safari.title}
        </h1>
        <p className="mt-4 max-w-[780px] text-lg">{t.safari.intro}</p>

        <div className="relative mt-8 h-[260px] overflow-hidden rounded-[120px_40px_40px_40px] sm:h-[380px] rtl:rounded-[40px_120px_40px_40px]">
          <Image
            src="https://framerusercontent.com/images/TLy4ARVFfNc7OYXd5Eunc4hga6o.jpg"
            alt={t.safari.bannerAlt}
            fill
            preload
            sizes="(max-width: 1180px) 100vw, 1180px"
            className="object-cover"
          />
        </div>

        <div className="mt-12 grid gap-8">
          {safaris.map((safari, i) => (
            <SafariCard key={safari.slug} safari={safari} booking={booking} locale={locale} preload={i === 0} />
          ))}
        </div>

        <p className="mx-auto mt-12 max-w-[720px] text-center text-sm">{t.safari.footer}</p>
      </div>
    </main>
  );
}
