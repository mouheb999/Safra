import { permanentRedirect } from "next/navigation";
import { localizedPath } from "@/i18n/config";
import { routeLocale, type LocaleParams } from "@/i18n/server";

// Experiences became "Our packs".
export default async function ExperiencesPage({ params }: LocaleParams) {
  permanentRedirect(localizedPath(await routeLocale(params), "/packs"));
}
