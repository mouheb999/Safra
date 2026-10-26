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
| `/` | static | Home: hero, budget slider whose destination cards re-rank and re-price as it moves |
| `/find-my-trip` | dynamic | 5-step quiz → scored results (`?budget=`, `?category=safari` prefill) |
| `/trip?destination=thailand\|egypt\|turkiye` | dynamic, server-only | Destination preview carrying the quiz answers |
| `/trip-request` | dynamic | Trip plan checkout (`?mode=direct`), or the visa form (`?mode=visa`) |
| `/visas` | static | Thailand visa service + application |
| `/safari` | static | Safari collection + request dialog |
| `/experiences` | static | Every destination with budget, duration and highlights |
| `/robots.txt`, `/sitemap.xml`, `/opengraph-image`, `/icon.svg` | static | SEO: `/admin` and `/trip-request` are not indexed; canonical URLs and social cards come from `src/lib/site.ts` |

## Languages

Every public route exists in English (no prefix), French (`/fr/…`) and Arabic (`/ar/…`, right-to-left). `src/proxy.ts` sends first-time visitors to their browser's language and remembers the switcher choice in the `NEXT_LOCALE` cookie; `/en/…` redirects to the unprefixed URL. The admin stays in English.

- Interface text: `src/i18n/messages/{en,fr,ar}.ts` (English is the reference; the other two must have the same keys, or the build fails). Client components use `useI18n()` and import `fmt`/`label` from `@/i18n/fmt`; server code uses `getMessages(locale)`.
- Catalog text: each destination / safari / visa service has a `translations` column (`{ "fr": {…}, "ar": {…} }`), edited under **Translations** in the admin editors. Empty fields show the English text.
- Requests store the visitor's language (`requests.locale`, shown in the admin), and the WhatsApp message is written in that language. The English message is unchanged from the original site.

## Layout

```
src/
  app/                 routes
  components/
    budget/            BudgetRange (shared track) + home BudgetDiscovery (slider + cards)
    quiz/TripQuiz      quiz UI
    trip/              TripExperience (server component)
    request/           TripRequestForm (trip plan checkout), VisaRequest
    safari/            SafariCard (server) + SafariRequestDialog (client, native <dialog>)
    forms.tsx          Field, input styles, validation + WhatsApp launch hooks
    icons.tsx
  data/                destinations + safaris (seed source for Supabase)
  lib/
    quiz.ts            answer model + destination scoring (pure)
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
destinations, safaris and the visa price from Supabase instead (re-read every 5 minutes; on errors it logs
`[catalog] … falling back` and serves the local copy).

```
supabase/migrations/…_initial_schema.sql   tables, constraints, RLS, submit_request()
supabase/seed.sql                          generated from src/data — don't edit by hand
scripts/verify-db.mts                      schema + RLS test suite (in-process Postgres, no Docker)
```

| Table | Who can read | Who can write |
|---|---|---|
| `destinations`, `safaris`, `services` | everyone (active rows) | admins |
| `requests`, `visa_applications`, `request_events` | admins only | server only, via `submit_request()` |
| `admins` | own row | SQL editor |

Requests get a human reference (`SAFRA-1000`, `SAFRA-1001`, …); every status change is logged in
`request_events` with the admin who made it.

```bash
npm run db:verify            # apply migrations + seed to an in-process Postgres and run 34 checks
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
- **Catalog**: add, edit, hide/show destinations, safaris and visa services (country, flag, price, what's
  included, required documents). Images are uploaded straight to the public Supabase Storage bucket `catalog`
  (admins only), or can be links on the hosts in `src/lib/images.ts` (shared with `next.config.ts`).
  Saves refresh the public site immediately.
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

The quiz and the home cards lead to `/trip`, whose "Get my complete trip plan" opens the checkout at
`/trip-request`: trip details, contact, then payment.

- **Cash on delivery**: governorate + address; a delivery company brings the order to the customer’s home, paid in cash (plan price + delivery fee).
- **Pay online**: D17, Flouci, Wafacash or bank transfer, no API — the checkout shows the account to pay into
  (with copy buttons); after ordering, the confirmation repeats it and opens WhatsApp with the order so the
  customer attaches their receipt. Mark the request **Paid** once the receipt checks out.

`submit_request()` prices every order from `site_settings` (the browser never sends a price) and refuses an
online method whose account details are empty. Orders show as "Plan order" in Requests, with the method,
amounts and delivery address on the request page. Trip orders always confirm on the site (whatever the booking
mode), because the customer needs to see how to pay.

## How the flow works

Home slider → `sessionStorage` → quiz → `/trip?…` → `/trip-request?…` → WhatsApp (`api.whatsapp.com/send?phone=21697433003`).
Each form first stores the request via the `submitRequest` server action → `public.submit_request()`, and the
message carries its reference (`Reference: SAFRA-1000`). If storage is unavailable the visitor still gets
WhatsApp, just without a reference. Apart from that line, the message text is byte-identical to the original
Framer site. (The original linked via `wa.me`, whose redirect turns the 👋 into "�".)
