import type { Metadata } from "next";
import { VisaRequest } from "@/components/request/VisaRequest";
import { getMessages } from "@/i18n";
import { routeLocale, type LocaleParams } from "@/i18n/server";
import { getBookingConfig, getVisaServices } from "@/lib/catalog";
import { pageMetadata } from "@/lib/site";

export const revalidate = 300;

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await routeLocale(params);
  return pageMetadata(locale, { ...getMessages(locale).meta.visas, path: "/visas" });
}

export default async function VisasPage({ params }: LocaleParams) {
  const locale = await routeLocale(params);
  const [services, booking] = await Promise.all([getVisaServices(locale), getBookingConfig()]);
  return (
    <main className="py-10">
      <VisaRequest services={services} booking={booking} />
    </main>
  );
}
