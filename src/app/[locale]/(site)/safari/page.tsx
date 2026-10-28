import { permanentRedirect } from "next/navigation";
import { localizedPath } from "@/i18n/config";
import { routeLocale, type LocaleParams } from "@/i18n/server";

// Safaris are no longer sold; old links land on the packs.
export default async function SafariPage({ params }: LocaleParams) {
  permanentRedirect(localizedPath(await routeLocale(params), "/packs"));
}
