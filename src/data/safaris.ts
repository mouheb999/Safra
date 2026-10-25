// Copy from the live /safari page. Local fallback + seed source; read it through src/lib/catalog.ts.

import { safariTranslations, type SafariText } from "./catalog-translations.ts";
import type { Img } from "./destinations";
import type { Translations } from "./translations";

export interface Safari {
  slug: string;
  name: string;
  description: string;
  duration: string;
  highlights: string[];
  image: Img;
  /** French/Arabic text; applied by localizeSafari(). */
  translations?: Translations<SafariText>;
}

const baseSafaris: Safari[] = [
  {
    slug: "kenya",
    name: "Kenya",
    description:
      "Golden savannahs, extraordinary wildlife and slow evenings under wide-open skies. Add a Nairobi stay if you’d like a little city energy.",
    duration: "6–8 days",
    highlights: ["Masai Mara wildlife safari", "Big Five experience", "Optional Nairobi stay"],
    image: { src: "https://framerusercontent.com/images/6SsI36c4HAR67C1wbKSyApsvFic.jpg", alt: "Kenya Safari" },
  },
  {
    slug: "tanzania",
    name: "Tanzania",
    description:
      "Follow the rhythm of the wild across the Serengeti and into Ngorongoro’s spectacular landscapes. An optional Zanzibar extension adds a softer landing.",
    duration: "7–10 days",
    highlights: ["Serengeti safari", "Ngorongoro Crater", "Big Five experience"],
    image: { src: "https://framerusercontent.com/images/XZnnrW7DcFPTTY3fNI61tGbCFxY.jpg", alt: "Tanzania Safari" },
  },
  {
    slug: "south-africa",
    name: "South Africa",
    description:
      "Wildlife-filled days and a fresh sense of freedom in Kruger. Extend your adventure to Cape Town for coastal scenery and a completely different pace.",
    duration: "7–10 days",
    highlights: ["Kruger National Park", "Immersive safari experience", "Optional Cape Town extension"],
    image: { src: "https://framerusercontent.com/images/l6UT91V9Fyoy0nxbUmbY6r0vAc.jpg", alt: "South Africa Safari" },
  },
  {
    slug: "kenya-zanzibar",
    name: "Kenya + Zanzibar",
    description:
      "A little wild, a little barefoot. Pair Kenya’s unforgettable wildlife with turquoise-water days on Zanzibar’s tropical shores.",
    duration: "10–14 days",
    highlights: ["Safari + tropical beach", "Masai Mara experience", "Zanzibar relaxation"],
    image: { src: "https://framerusercontent.com/images/uJRZAFdL7qhA5KTUA6Ec3MgE9E.jpg", alt: "Kenya + Zanzibar Safari" },
  },
  {
    slug: "tanzania-zanzibar",
    name: "Tanzania + Zanzibar",
    description:
      "From the Serengeti’s vast horizons to warm Indian Ocean breezes. Your wildlife adventure, finished with time to switch off by the sea.",
    duration: "10–14 days",
    highlights: ["Serengeti safari", "Wildlife experience", "Zanzibar beach extension"],
    image: { src: "https://framerusercontent.com/images/27xKKdXjS70DQEG2GWcBACV7Lx0.jpg", alt: "Tanzania + Zanzibar Safari" },
  },
];

export const localSafaris: Safari[] = baseSafaris.map((s) => ({ ...s, translations: safariTranslations[s.slug] }));
