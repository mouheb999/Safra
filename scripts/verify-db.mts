// Applies supabase/migrations + seed.sql to an in-process Postgres (PGlite) and checks
// the schema, constraints and RLS rules. No Docker or Supabase project needed.
// Run: npm run db:verify

import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { localDestinations } from "../src/data/destinations.ts";
import { localSafaris } from "../src/data/safaris.ts";
import { toDestination, toSafari } from "../src/lib/supabase/mappers.ts";

const root = process.env.SUPABASE_DIR ?? fileURLToPath(new URL("../supabase/", import.meta.url));
const db = new PGlite();

// --- Minimal stand-in for what Supabase provides out of the box -------------------------
await db.exec(`
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  create schema auth;
  create table auth.users (id uuid primary key, email text);
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'sub', '')::uuid
  $$;
  create schema storage;
  create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets (id), name text, owner uuid default auth.uid());
  alter table storage.objects enable row level security;
  grant usage on schema storage to anon, authenticated, service_role;
  grant all on storage.objects to anon, authenticated, service_role;
  grant usage on schema public, auth to anon, authenticated, service_role;
  grant execute on function auth.uid() to anon, authenticated, service_role;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
  alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
`);

// --- Apply migrations + seed -------------------------------------------------------------
const migrations = readdirSync(`${root}migrations`).filter((f) => f.endsWith(".sql")).sort();
for (const file of migrations) await db.exec(readFileSync(`${root}migrations/${file}`, "utf8"));
await db.exec(readFileSync(`${root}seed.sql`, "utf8"));

// --- Tiny test harness -------------------------------------------------------------------
let passed = 0;
const failures: string[] = [];
async function check(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (error) {
    failures.push(name);
    console.log(`  ✗ ${name}\n      ${(error as Error).message}`);
  }
}
/** JSON with object keys sorted — jsonb doesn't preserve key order, and order carries no meaning here. */
function canonical(value: unknown): string {
  return JSON.stringify(value, (_key, v) =>
    v && typeof v === "object" && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort()) : v,
  );
}
function assertEqual<T>(actual: T, expected: T, label = "") {
  if (canonical(actual) !== canonical(expected))
    throw new Error(`${label} expected ${canonical(expected)}, got ${canonical(actual)}`);
}
async function expectError(promise: Promise<unknown>, pattern: RegExp) {
  try {
    await promise;
  } catch (error) {
    const message = (error as Error).message;
    if (!pattern.test(message)) throw new Error(`wrong error: ${message}`);
    return;
  }
  throw new Error(`expected an error matching ${pattern}`);
}

const ADMIN = "11111111-1111-1111-1111-111111111111";
const USER = "22222222-2222-2222-2222-222222222222";

/** Run `fn` as a Supabase role (optionally signed in as `sub`), like PostgREST does. */
async function as<T>(role: "anon" | "authenticated" | "service_role", fn: () => Promise<T>, sub?: string): Promise<T> {
  await db.exec(`set role ${role}`);
  await db.query(`select set_config('request.jwt.claims', $1, false)`, [JSON.stringify(sub ? { sub, role } : { role })]);
  try {
    return await fn();
  } finally {
    await db.exec(`reset role; select set_config('request.jwt.claims', '', false);`);
  }
}
const rows = async <T = Record<string, unknown>>(sql: string, params: unknown[] = []) =>
  (await db.query<T>(sql, params)).rows;
const submit = (payload: object) =>
  rows<{ id: string; reference: string }>(`select * from public.submit_request($1::jsonb)`, [JSON.stringify(payload)]);

const future = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
const tripPayload = {
  kind: "trip",
  source: "quiz",
  fullName: "Amira Ben Salah",
  whatsapp: "+216 20 123 456",
  travelers: "2",
  destination: "Egypt",
  destinationSlug: "egypt",
  category: "beach",
  preferredDate: "",
  durationDays: "5",
  budgetDT: "6000",
  notes: "",
  quizAnswers: { budget: 3000, vibes: ["Beach", "Food"] },
};
const visaPayload = {
  kind: "visa",
  source: "visa",
  fullName: "Amira Ben Salah",
  whatsapp: "+216 20 123 456",
  travelers: "1",
  category: "",
  dateOfBirth: "1995-03-02",
  nationality: "Tunisian",
  passportNumber: "X1234567",
  passportExpiry: future(900),
  arrivalDate: future(30),
  departureDate: future(41),
  purposeOfTravel: "Tourism",
  occupationStatus: "Engineer",
  flightBooked: "Yes",
  accommodationBooked: "No",
  previousVisit: "No",
  serviceSlug: "thailand-visa",
  previousVisaRefusal: "No",
  notes: "Halal food please",
};
const safariPayload = {
  kind: "safari",
  source: "safari",
  safari: "Tanzania + Zanzibar",
  fullName: "Youssef Trabelsi",
  whatsapp: "+216 55 987 654",
  travelers: "3",
  preferredDate: "",
  preferredDuration: "8–10 days",
  budgetDT: "15000",
  specialRequests: "",
};

// --- Tests -------------------------------------------------------------------------------
console.log(`\nApplied ${migrations.length} migration(s) + seed.\n\nCatalog`);

await check("seed loads 3 destinations, 5 safaris, 1 service", async () => {
  const [c] = await rows<{ d: number; s: number; v: number }>(
    `select (select count(*)::int from destinations) d, (select count(*)::int from safaris) s, (select count(*)::int from services) v`,
  );
  assertEqual([c.d, c.s, c.v], [3, 5, 1]);
});

await check("visitors (anon) read active destinations", async () => {
  const r = await as("anon", () => rows<{ slug: string }>(`select slug from destinations order by sort_order`));
  assertEqual(r.map((x) => x.slug), ["thailand", "egypt", "turkiye"]);
});

await check("inactive destinations are hidden from visitors", async () => {
  await db.exec(`update destinations set is_active = false where slug = 'turkiye'`);
  const r = await as("anon", () => rows(`select slug from destinations`));
  await db.exec(`update destinations set is_active = true where slug = 'turkiye'`);
  assertEqual(r.length, 2);
});

await check("visitors cannot edit the catalog", async () => {
  await expectError(as("anon", () => rows(`update destinations set min_budget = 1`)), /permission denied/);
});

await check("signed-in non-admins cannot edit the catalog", async () => {
  const r = await as("authenticated", () => rows(`update destinations set min_budget = 1 returning slug`), USER);
  assertEqual(r.length, 0, "rows changed:");
});

await check("seeded destinations map back to exactly the app's local data", async () => {
  const r = await rows<Parameters<typeof toDestination>[0]>(`select * from destinations order by sort_order`);
  assertEqual(r.map(toDestination), localDestinations);
});

await check("seeded safaris map back to exactly the app's local data", async () => {
  const r = await rows<Parameters<typeof toSafari>[0]>(`select * from safaris order by sort_order`);
  assertEqual(r.map(toSafari), localSafaris);
});

await check("bad catalog data is rejected (max < min budget)", async () => {
  await expectError(rows(`update destinations set max_budget = 100 where slug = 'egypt'`), /check constraint/);
});

console.log("\nSubmitting requests");

await check("visitors cannot call submit_request directly", async () => {
  await expectError(as("anon", () => submit(tripPayload)), /permission denied/);
});

await check("signed-in users cannot call submit_request directly", async () => {
  await expectError(as("authenticated", () => submit(tripPayload), USER), /permission denied/);
});

await check("server (service_role) stores a trip request → SAFRA-1000", async () => {
  const [r] = await as("service_role", () => submit(tripPayload));
  assertEqual(r.reference, "SAFRA-1000");
  const [row] = await rows<Record<string, unknown>>(`select kind, source, travelers, destination_slug, budget_dt, duration_days, notes, status from requests where id = $1`, [r.id]);
  assertEqual(row, { kind: "trip", source: "quiz", travelers: 2, destination_slug: "egypt", budget_dt: 6000, duration_days: 5, notes: null, status: "new" });
});

await check("visa request stores passport details in visa_applications with the current price", async () => {
  const [r] = await as("service_role", () => submit(visaPayload));
  assertEqual(r.reference, "SAFRA-1001");
  const [v] = await rows<Record<string, unknown>>(`select service_slug, price_dt, passport_number, flight_booked, accommodation_booked from visa_applications where request_id = $1`, [r.id]);
  assertEqual(v, { service_slug: "thailand-visa", price_dt: 55, passport_number: "X1234567", flight_booked: true, accommodation_booked: false });
});

await check("safari request resolves the safari by name", async () => {
  const [r] = await as("service_role", () => submit(safariPayload));
  const [row] = await rows<{ safari_slug: string; duration_text: string }>(`select safari_slug, duration_text from requests where id = $1`, [r.id]);
  assertEqual(row, { safari_slug: "tanzania-zanzibar", duration_text: "8–10 days" });
});

await check("unknown destination slug is ignored, free text kept", async () => {
  const [r] = await as("service_role", () => submit({ ...tripPayload, source: "direct", destinationSlug: "japan", destination: "Japan" }));
  const [row] = await rows<{ destination_slug: string | null; destination_text: string }>(`select destination_slug, destination_text from requests where id = $1`, [r.id]);
  assertEqual(row, { destination_slug: null, destination_text: "Japan" });
});

console.log("\nValidation");

const rejects: [string, object, RegExp][] = [
  ["blank name", { ...tripPayload, fullName: "   " }, /check constraint/],
  ["WhatsApp number too short", { ...tripPayload, whatsapp: "123" }, /check constraint/],
  ["trip without budget", { ...tripPayload, budgetDT: "" }, /check constraint/],
  ["zero travelers", { ...tripPayload, travelers: "0" }, /check constraint/],
  ["notes over 1500 chars", { ...tripPayload, notes: "x".repeat(1501) }, /check constraint/],
  ["unknown request kind", { ...tripPayload, kind: "hotel" }, /invalid input value for enum/],
  ["unknown safari", { ...safariPayload, safari: "Mars" }, /Unknown safari/],
  ["visa: departure before arrival", { ...visaPayload, departureDate: future(10) }, /check constraint/],
  ["visa: arrival in the past", { ...visaPayload, arrivalDate: "2020-01-01" }, /Arrival date/],
  ["visa: expired passport", { ...visaPayload, passportExpiry: "2021-01-01" }, /Passport expiry/],
  ["visa: blank passport number", { ...visaPayload, passportNumber: " " }, /check constraint/],
];
for (const [name, payload, pattern] of rejects) {
  await check(`rejects ${name}`, () => expectError(as("service_role", () => submit(payload)), pattern));
}

await check("a rejected visa leaves no half-written request behind", async () => {
  const [c] = await rows<{ n: number }>(`select count(*)::int n from requests`);
  assertEqual(c.n, 4);
});

console.log("\nAdmin access");

await db.query(`insert into auth.users (id, email) values ($1, 'owner@safra.website'), ($2, 'someone@example.com')`, [ADMIN, USER]);
await db.query(`insert into admins (user_id) values ($1)`, [ADMIN]);

await check("visitors cannot read requests", async () => {
  await expectError(as("anon", () => rows(`select * from requests`)), /permission denied/);
});

await check("visitors cannot read passport data", async () => {
  await expectError(as("anon", () => rows(`select * from visa_applications`)), /permission denied/);
});

await check("signed-in non-admins see no requests or passport data", async () => {
  const r = await as("authenticated", async () => [
    (await rows(`select id from requests`)).length,
    (await rows(`select request_id from visa_applications`)).length,
    (await rows(`select id from request_events`)).length,
  ], USER);
  assertEqual(r, [0, 0, 0]);
});

await check("admins see all requests and visa details", async () => {
  const r = await as("authenticated", async () => [
    (await rows(`select id from requests`)).length,
    (await rows(`select request_id from visa_applications`)).length,
  ], ADMIN);
  assertEqual(r, [4, 1]);
});

await check("non-admins cannot change a request's status", async () => {
  const r = await as("authenticated", () => rows(`update requests set status = 'closed' returning id`), USER);
  assertEqual(r.length, 0, "rows changed:");
});

await check("status changes by an admin are logged with who made them", async () => {
  await as("authenticated", () => rows(`update requests set status = 'contacted' where number = 1000`), ADMIN);
  const events = await rows<{ from_status: string | null; to_status: string; actor: string | null }>(
    `select e.from_status, e.to_status, e.actor from request_events e join requests r on r.id = e.request_id where r.number = 1000 order by e.id`,
  );
  assertEqual(events, [
    { from_status: null, to_status: "new", actor: null },
    { from_status: "new", to_status: "contacted", actor: ADMIN },
  ]);
});

await check("admins can manage the catalog", async () => {
  const r = await as("authenticated", () => rows(`update services set price_dt = 60 where slug = 'thailand-visa' returning price_dt`), ADMIN);
  assertEqual(r, [{ price_dt: 60 }]);
});

await check("users can only see their own admin membership", async () => {
  const r = await as("authenticated", async () => [(await rows(`select * from admins`)).length], USER);
  assertEqual(r, [0]);
});

console.log("\nAdmin management");

await check("an admin's email is filled in from Supabase Auth", async () => {
  const r = await as("authenticated", () => rows<{ email: string }>(`select email from admins`), ADMIN);
  assertEqual(r, [{ email: "owner@safra.website" }]);
});

await check("visitors and signed-in users cannot grant admin rights", async () => {
  await expectError(as("anon", () => rows(`select private.add_admin('someone@example.com')`)), /permission denied/);
  await expectError(as("authenticated", () => rows(`select private.add_admin('someone@example.com')`), USER), /permission denied/);
});

await check("add_admin rejects an email with no account", async () => {
  await expectError(rows(`select private.add_admin('nobody@example.com')`), /No Supabase Auth user/);
});

await check("add_admin (SQL editor) grants access, case-insensitively", async () => {
  await rows(`select private.add_admin('  SOMEONE@example.com ')`);
  const r = await as("authenticated", async () => [
    (await rows(`select id from requests`)).length,
    (await rows<{ email: string }>(`select email from admins order by email`)).map((a) => a.email),
  ], USER);
  assertEqual(r, [4, ["owner@safra.website", "someone@example.com"]]);
  await rows(`delete from admins where user_id = $1`, [USER]);
});

console.log("\nCatalog v2: settings, booking mode, visa services, image uploads");

await check("visitors read site settings (WhatsApp mode by default)", async () => {
  const r = await as("anon", () => rows(`select booking_mode, whatsapp_number from site_settings`));
  assertEqual(r, [{ booking_mode: "whatsapp", whatsapp_number: "21697433003" }]);
});

await check("visitors and non-admins can't change settings", async () => {
  await expectError(as("anon", () => rows(`update site_settings set booking_mode = 'onsite'`)), /permission denied/);
  const r = await as("authenticated", () => rows(`update site_settings set booking_mode = 'onsite' returning id`), USER);
  assertEqual(r.length, 0, "rows changed:");
});

await check("a malformed WhatsApp number is rejected", async () => {
  await expectError(as("authenticated", () => rows(`update site_settings set whatsapp_number = '+216 12'`), ADMIN), /check constraint/);
});

await check("requests record the booking mode they came through", async () => {
  await as("authenticated", () => rows(`update site_settings set booking_mode = 'onsite'`), ADMIN);
  const [onsite] = await as("service_role", () => submit(tripPayload));
  await as("authenticated", () => rows(`update site_settings set booking_mode = 'whatsapp'`), ADMIN);
  const [whatsapp] = await as("service_role", () => submit(tripPayload));
  const r = await rows<{ channel: string }>(`select channel from requests where id in ($1, $2) order by number`, [onsite.id, whatsapp.id]);
  assertEqual(r.map((x) => x.channel), ["onsite", "whatsapp"]);
});

await check("admins can add a second visa service, booked at its own price", async () => {
  await as("authenticated", () =>
    rows(`insert into services (slug, name, country, flag, price_dt, includes, documents)
          values ('uae-visa', 'UAE Visa Assistance', 'United Arab Emirates', '🇦🇪', 90, array['Document review'], array['Passport copy'])`), ADMIN);
  const [r] = await as("service_role", () => submit({ ...visaPayload, serviceSlug: "uae-visa", previousVisit: "Yes" }));
  const [v] = await rows(`select service_slug, price_dt, previous_visit from visa_applications where request_id = $1`, [r.id]);
  assertEqual(v, { service_slug: "uae-visa", price_dt: 90, previous_visit: true });
});

await check("hidden visa services can't be booked", async () => {
  await as("authenticated", () => rows(`update services set is_active = false where slug = 'uae-visa'`), ADMIN);
  await expectError(as("service_role", () => submit({ ...visaPayload, serviceSlug: "uae-visa" })), /not available/);
});

await check("the catalog bucket is public and images-only (5 MB)", async () => {
  const [b] = await rows(`select public, file_size_limit, allowed_mime_types from storage.buckets where id = 'catalog'`);
  assertEqual(b, { public: true, file_size_limit: 5242880, allowed_mime_types: ["image/jpeg", "image/png", "image/webp", "image/avif"] });
});

await check("only admins can upload catalog images, and only to that bucket", async () => {
  await rows(`insert into storage.buckets (id, name, public) values ('other', 'other', false)`);
  const upload = (bucket: string) => rows(`insert into storage.objects (bucket_id, name) values ('${bucket}', 'x.jpg') returning name`);
  await expectError(as("anon", () => upload("catalog")), /row-level security/);
  await expectError(as("authenticated", () => upload("catalog"), USER), /row-level security/);
  await expectError(as("authenticated", () => upload("other"), ADMIN), /row-level security/);
  const r = await as("authenticated", () => upload("catalog"), ADMIN);
  assertEqual(r, [{ name: "x.jpg" }]);
  const listing = await as("anon", () => rows(`select name from storage.objects`));
  assertEqual(listing.length, 0, "visitors listing files:");
});

console.log("\nLanguages");

await check("requests store the visitor's language; unknown values become English", async () => {
  const [fr] = await as("service_role", () => submit({ ...tripPayload, locale: "fr" }));
  const [ar] = await as("service_role", () => submit({ ...safariPayload, locale: "ar" }));
  const [odd] = await as("service_role", () => submit({ ...tripPayload, locale: "de" }));
  const [none] = await as("service_role", () => submit(tripPayload));
  const r = await rows<{ locale: string }>(`select locale from requests where id in ($1, $2, $3, $4) order by number`, [fr.id, ar.id, odd.id, none.id]);
  assertEqual(r.map((x) => x.locale), ["fr", "ar", "en", "en"]);
});

await check("catalog translations are public and must be a JSON object", async () => {
  const r = await as("anon", () => rows<{ t: string }>(`select translations -> 'fr' ->> 'title' as t from destinations where slug = 'egypt'`));
  assertEqual(r, [{ t: "Le Caire et le Nil" }]);
  await expectError(rows(`update safaris set translations = '[]'::jsonb where slug = 'kenya'`), /check constraint/);
});

console.log(`\n${passed} passed, ${failures.length} failed`);
await db.close();
process.exit(failures.length ? 1 : 0);
