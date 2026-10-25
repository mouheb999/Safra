// Message lookup for server code. Client components get their dictionary from useI18n() and
// import fmt/label from "./fmt" (importing this file would bundle every language).

import type { Locale } from "./config";
import ar from "./messages/ar";
import en, { type Messages } from "./messages/en";
import fr from "./messages/fr";

export type { Messages } from "./messages/en";
export { fmt, label } from "./fmt";

const dictionaries: Record<Locale, Messages> = { en, fr, ar };

export function getMessages(locale: Locale): Messages {
  return dictionaries[locale];
}
