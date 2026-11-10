# SAFRA

Rebuild of [safra.website](https://safra.website) — Next.js 16 (App Router) + TypeScript + Tailwind v4.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build + type check
```

## Routes

| Route | Rendering | Content |
|---|---|---|
| `/` | static | Home: hero (16:9 video frame: a YouTube link, a video file or a "coming soon" placeholder, see `HERO_VIDEO` in `src/lib/site.ts`), budget slider + packs carousel (main pack in the middle, swipe/arrows/dots) |
| `/find-my-trip` | dynamic | Budget + 3 questions → the 2 best trips with a locked program; `?budget=`, `?category=` prefill |
| `/trip?destination=thailand\|egypt\|turkiye` | dynamic, server-only | Destination preview carrying the quiz answers |
| `/trip-request` | dynamic | Trip plan checkout (`?mode=direct`), or the visa form (`?mode=visa`) |
| `/visas` | static | Thailand visa service + application |
| `/packs` | static | Our packs: ready-made trips with a price per person, edited in /admin/catalog; a pack opens the checkout with `?pack=` |
| `/safari`, `/experiences` | redirect | Old links, sent to `/packs` |
| `/robots.txt`, `/sitemap.xml`, `/opengraph-image`, `/icon.svg` | static | SEO: `/admin` and `/trip-request` are not indexed; canonical URLs and social cards come from `src/lib/site.ts` |

## Languages

Every public route exists in English (no prefix), French (`/fr/…`) and Arabic (`/ar/…`, right-to-left). `src/proxy.ts` sends first-time visitors to their browser's language and remembers the switcher choice in the `NEXT_LOCALE` cookie; `/en/…` redirects to the unprefixed URL. The admin stays in English.

- Interface text: `src/i18n/messages/{en,fr,ar}.ts` (English is the reference; the other two must have the same keys, or the build fails). Client components use `useI18n()` and import `fmt`/`label` from `@/i18n/fmt`; server code uses `getMessages(locale)`.
- Catalog text: each destination / visa service has a `translations` column (`{ "fr": {…}, "ar": {…} }`), edited under **Translations** in the admin editors. Empty fields show the English text.
- Requests store the visitor's language (`requests.locale`, shown in the admin), and the WhatsApp message is written in that language. The English message is unchanged from the original site.

## Layout

```
src/
  app/                 routes
  components/
    budget/            BudgetRange (shared slider track)
    packs/             PackCard + home PacksSlider
    HeroMedia.tsx      home hero video (YouTube, file or placeholder)
    Flags.tsx          round SVG flags for the language switcher
    quiz/              BrainQuiz (the questions) + SurpriseResults (the 2 trips, locked program)
    trip/              TripExperience (server component)
    request/           TripRequestForm (trip plan checkout), VisaRequest
    forms.tsx          Field, input styles, validation + WhatsApp launch hooks
    icons.tsx
  data/                destinations + packs (seed source for Supabase and local fallback)
  lib/
    brain/             trip brain: pricing, engine, the 2 picks, locked preview, input validation, order snapshot
    quiz.ts            vibe list shared by the brain, packs and the admin
    requests.ts        request payload types + WhatsApp message text
    payments.ts        checkout: payment methods, governorates, prices
    search-params.ts   server-side parsing of the URLs pages pass to each other
    budget.ts          budget constants/formatting
_framer-export/        original Framer export, kept for reference only
```

## Database (Supabase)

Live project: **`vuuoytevikywqymgabws`** (eu-west-1, Ireland), configured in `.env.local` (git-ignored).
Both migrations and the seed are applied there; Supabase's security advisor is clean apart from its own
`rls_auto_enable()` function.

The site also runs without a backend: with no env vars, `src/lib/catalog.ts` serves the local data in `src/data/`.
Set `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (see `.env.example`) and it reads
destinations and the visa price from Supabase instead (re-read every 5 minutes; on errors it logs
`[catalog] … falling back` and serves the local copy).

```
supabase/migrations/…_initial_schema.sql   tables, constraints, RLS, submit_request()
supabase/seed.sql                          generated from src/data — don't edit by hand
scripts/verify-db.mts                      schema + RLS test suite (in-process Postgres, no Docker)
```

| Table | Who can read | Who can write |
|---|---|---|
| `packs`, `destinations`, `services`, `brain_countries`, `brain_bases` (and the retired `safaris`) | everyone (active rows) | admins |
| `requests`, `visa_applications`, `request_events` | admins only | server only, via `submit_request()` |
| `admins` | own row | SQL editor |

Requests get a human reference (`SAFRA-1000`, `SAFRA-1001`, …); every status change is logged in
`request_events` with the admin who made it.

```bash
npm run db:verify            # apply migrations + seed to an in-process Postgres and run 66 checks
npm run db:seed:generate     # after editing src/data
npx supabase login           # once, with the account that owns the project
npx supabase link --project-ref vuuoytevikywqymgabws
npx supabase db push         # apply new migrations
npm run db:types             # regenerate src/lib/supabase/database.types.ts
```

Local migration filenames match the versions recorded on the project, so `db push` only applies new files.

Seed a linked project by running `supabase/seed.sql` in the SQL editor. Admin access: see below.

## Admin dashboard (`/admin`)

- **Requests**: inbox with status tabs (Open / New / Contacted / Quoted / Paid / Closed / Cancelled), type filter
  and search by reference, name, phone or destination. Each request page shows everything the customer sent
  (passport details for visas), a "Message on WhatsApp" button that opens with their reference, the status
  pipeline, and the history of who changed what.
- **Catalog**: add, edit, hide/show (and delete) packs; add, edit, hide/show destinations and visa services (country, flag, price, what's
  included, required documents). Images are uploaded straight to the public Supabase Storage bucket `catalog`
  (admins only), or can be links on the hosts in `src/lib/images.ts` (shared with `next.config.ts`).
  Saves refresh the public site immediately.
- **Trip brain**: the rules (minimum pocket money, card fee, max flight share, activity rhythm), the countries
  (flight price and time, visa, insurance, eSIM, moves between places) and their places (best / okay months,
  strengths, stay areas, stay / food / transport prices, who it suits, activities). Hidden items are never suggested.
- **Settings → Trip plan & payments**: the plan price, the cash-on-delivery fee, and the accounts customers pay
  into (D17 number, Flouci number, Wafacash recipient + phone, bank holder / bank / RIB). An empty method is
  hidden from the checkout; with none filled in, only cash on delivery is offered.
- **Settings**: booking mode — *WhatsApp hand-off* (store, then open a prefilled WhatsApp message) or
  *Reservation on the site* (store and show a confirmation with the reference; SAFRA contacts the customer;
  marked "Reserved on site" in Requests) — and SAFRA's WhatsApp number used by every link and message.

Access: Supabase Auth email + password. Create the account in the Supabase dashboard (Authentication → Users →
Add user, tick *Auto Confirm*), then in the SQL editor: `select private.add_admin('you@example.com');`
Pages and server actions check admin membership on the server, and RLS checks it again in the database;
`src/proxy.ts` only refreshes the session and redirects signed-out visitors to `/admin/login`.

## Trip plan checkout

"Find my trip", the packs and `/trip`'s "Get my complete trip plan" open the checkout at
`/trip-request`, one step per screen with the same headings, choice cards, buttons, progress bar and pictures as
"Find my trip" (shared in `src/components/quiz/controls.tsx`); each step is a browser history entry:

1. **The trip** (`TripChoices.tsx`): where (a dropdown of SAFRA's destinations — the active Trip brain countries —
   when not already chosen) → who (group cards + travelers) → when (date or "not sure yet") and how long → total
   budget and notes.
2. **The customer**: name, WhatsApp, governorate and address (required for every order), then payment.

A trip chosen on "Find my trip" skips step 1 (it's already decided) and opens on the details; Back returns to the
same results (kept in sessionStorage).

- **Cash on delivery**: a delivery company brings the order to the customer’s home, paid in cash (plan price + delivery fee).
- **Pay online**: D17, Flouci, Wafacash or bank transfer, no API — the checkout shows the account to pay into
  (with copy buttons); after ordering, the confirmation repeats it and opens WhatsApp with the order so the
  customer attaches their receipt. Mark the request **Paid** once the receipt checks out.

`submit_request()` prices every order from `site_settings` (the browser never sends a price) and refuses an
online method whose account details are empty, or an order without a governorate and address. Orders show as "Plan order" in Requests, with the method,
amounts and delivery address on the request page. Trip orders always confirm on the site (whatever the booking
mode), because the customer needs to see how to pay.

## Trip brain ("Find my trip" — surprise me)

The visitor gives a budget per person (set once, on the first step) and answers 3 quick questions (dates or a
month, who's going, up to 5 of 14 vibes). The brain answers with **exactly 2 trips** in 2 countries — places, nights, weather,
total cost and pocket money — each with a **locked block**: where the money goes (category names, blurred amounts)
on top of the day-by-day program (day numbers and places, blurred details). "Unlock my program" opens the checkout
(the plan price from /admin/settings). **Live WhatsApp assistance** (`src/components/AssistJourney.tsx`) is shown as
a door-to-door journey (before you leave → departure day → during the trip → back home) on the locked block and in
the checkout. /admin/settings decides how it's sold: **included** in every plan, or a **paid add-on** the customer
ticks at checkout (never pre-ticked); `submit_request()` charges it from the settings and records
`requests.assist` (`included` / `added` / `declined`) and `assist_dt`. Each step is a browser history entry, so Back returns
to the previous question.

- `src/lib/brain/pricing.ts`: the cost formulas — 9 categories, card fee on foreign-currency items, rooms per hotel
  type, food per eater, moves between places.
- Vibes (`src/lib/quiz.ts`): Beach, Islands, Diving, Nightlife, Adventure, Nature, Food, City, Shopping, Culture,
  Relaxation, Wellness, Romance, Luxury. A place is only suggested when it shares one, so each place's "Strong in"
  (and each activity's vibes) in /admin/brain should list every vibe it really offers.
- Destinations: 10 countries, 36 places — Southeast Asia (Thailand, Bali, Malaysia, Vietnam, Philippines) for bigger
  budgets, and closer to Tunis (Turkey, Egypt, Morocco, Jordan, Georgia) so smaller budgets get real trips too.
- `src/lib/brain/engine.ts` (Safra Trip Brain v0.5): the best plan per country — skips places in their rainy season
  or without a shared vibe, splits the nights, adds about one activity every 2 days, cuts activities or a place to
  fit, and scores (budget 30, vibe 25, season 20, group 15, ease 10).
- `src/lib/brain/surprise.ts`: the 2 picks — a good hotel when it fits, else a budget hotel. **The budget is respected**:
  only trips within it, or needing at most **150 DT more per person** (`MAX_STRETCH_PER_PERSON_TND`), are shown —
  fitting ones first, and among them **focus destinations** (Southeast Asia; `brain_countries.is_featured`, "Focus
  destination" in /admin/brain) first. When nothing is in reach, the visitor is told the budget is too tight for
  these dates, with the budget per person the cheapest trip needs ("Change my budget"). The same rule applies to
  "Show me 2 other destinations" and after live prices re-price the picks.
- **Budget guidance**: the budget step shows, live, what the budget gets (`budgetGuide()`: the smallest budget per
  person a typical week for two needs in each destination, from the same prices) — red "too low, trips start at
  about X", amber "N destinations possible… Southeast Asia from about Y", green "N destinations, Southeast Asia
  included" — with matching colour zones under the slider. When the answers are still too tight, the results offer
  one-tap fixes that re-run the search (`budgetFixes()`): raise to the budget that works, the longest shorter trip
  that fits, or the nearest month that fits — each only when it really leads to a trip.
- **"Show me 2 other destinations"** under the results: the next 2 countries, skipping every one already shown
  (`BrainInput.exclude`), until none are left ("Back to my 2 best matches" returns to the first pair). The skipped
  countries travel inside the encoded answers, so the checkout and the order rebuild exactly that pair; the admin
  request card lists them.
- `src/lib/brain/preview.ts` + `src/app/actions/surprise.ts`: computed on the server; the browser only receives what
  it shows. The money split, hotels, SAFRA's areas, activity names and the plan never leave the server, so removing
  the blur reveals nothing.
- Ordering sends the answers + the chosen country (`?pick=&country=`); the server rebuilds the same trip and stores
  the exact result in `requests.quiz_answers` (`snapshot.ts`), shown as a **Find my trip** card on the admin request
  page with places, hotel level, activities, stay areas and the exact budget — what SAFRA turns into the paid plan.
- **Live prices of the day** (`src/lib/live`): with `SERPAPI_API_KEY` set, the server gets the day's round-trip
  flights from Tunis for the visitor's dates (Google Flights, for the 5 countries most likely to be picked on the estimates) — these decide the picks — then
  hotel rates for the places in the 2 picks (Google Hotels: budget hotel = lower third of 1–3★, good hotel =
  middle of 4–5★), converted from EUR with the day's rate (open.er-api.com, admin fallback rate). Every search
  is cached for a day in `public.live_prices` (a new visitor costs ~7 searches, the next with the same dates 0)
  and counted in `public.live_price_usage` against the monthly limit set in **/admin/brain**
  (`claim_live_price_search()`, atomic). Missing, failing or over-budget prices fall back to a recent cached
  price or SAFRA's estimates; food, transport and activities are always estimates. Cards say "prices checked
  today" only when they are, and orders record what was live — with the **links**: the day's Google Flights
  search (price, airline, dates) and, per place, the day's Google Hotels search plus the hotel each rate came from,
  listed under "Price links" on the admin request page. Links are Google's own pages (never a SerpApi URL, which
  could carry the key) and are never sent to the visitor's browser. **/admin/brain → Live prices** shows usage and
  has a "Test live prices" button.

```bash
npm run brain:verify         # engine scenarios, the 2 picks, the locked preview, server re-pricing
```

## How the flow works

Home slider → `sessionStorage` → Find my trip (questions → 2 locked trips) → `/trip-request?pick=…&country=…` → WhatsApp (`api.whatsapp.com/send?phone=21697433003`).
Each form first stores the request via the `submitRequest` server action → `public.submit_request()`, and the
message carries its reference (`Reference: SAFRA-1000`). If storage is unavailable the visitor still gets
WhatsApp, just without a reference. Apart from that line, the message text is byte-identical to the original
Framer site. (The original linked via `wa.me`, whose redirect turns the 👋 into "�".)
