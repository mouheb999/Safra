// Fonts ship with the code (variable woff2 files from Fontsource, SIL Open Font License), so the
// build doesn't download anything from Google Fonts — that download failed on Vercel's builders.
import localFont from "next/font/local";

export const nunito = localFont({
  src: "./fonts/nunito-latin.woff2",
  weight: "200 1000",
  variable: "--font-nunito",
  display: "swap",
});

// Nunito has no Arabic letters; Cairo has a similar rounded, friendly feel. Arabic letters only:
// digits and Latin text in Arabic pages fall back to Nunito (see globals.css).
export const cairo = localFont({
  src: "./fonts/cairo-arabic.woff2",
  weight: "200 1000",
  variable: "--font-arabic",
  display: "swap",
  declarations: [{ prop: "unicode-range", value: "U+0600-06FF, U+0750-077F, U+0870-08FF, U+200C-200E, U+2010-2011, U+204F, U+2E41, U+FB50-FDFF, U+FE70-FEFC" }],
});
