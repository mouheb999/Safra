-- SAFRA initial schema
--   Catalog (public read):   destinations, safaris, services
--   Requests (admin only):   requests, visa_applications, request_events
--   Access control:          admins + public.is_admin()
--
-- Visitors never touch request tables directly: the Next.js server calls
-- public.submit_request() with the secret key (service_role). anon/authenticated
-- have no insert/select on requests at all.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Admins
-- ---------------------------------------------------------------------------

create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

comment on table public.admins is 'Supabase Auth users allowed into /admin. Add rows by hand (SQL editor).';

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;

revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Catalog
-- ---------------------------------------------------------------------------

create table public.destinations (
  slug text primary key check (slug ~ '^[a-z0-9-]{2,40}$'),
  country text not null check (char_length(country) between 1 and 80),
  title text not null check (char_length(title) between 1 and 120),
  description text not null,
  highlights text[] not null default '{}',
  match_default smallint not null default 90 check (match_default between 0 and 99),
  duration text not null,
  estimated_total integer not null check (estimated_total > 0),
  min_budget integer not null check (min_budget > 0),
  max_budget integer not null,
  hero_image_url text not null,
  hero_image_alt text not null default '',
  card_image_url text not null,
  card_image_alt text not null default '',
  teaser_budget integer not null check (teaser_budget > 0),
  teaser_duration text not null,
  teaser_tags text[] not null default '{}',
  -- Quiz scoring inputs (see src/lib/quiz.ts)
  quiz_tags text[] not null default '{}',
  duration_bands text[] not null default '{}'
    check (duration_bands <@ array['Weekend', '5–7 days', '8–12 days', '2+ weeks']),
  month_affinity smallint[] not null default '{}'
    check (month_affinity <@ array[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]::smallint[]),
  traveler_suitability jsonb not null default '{}'::jsonb
    check (jsonb_typeof(traveler_suitability) = 'object'),
  sort_order smallint not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (max_budget >= min_budget)
);

create table public.safaris (
  slug text primary key check (slug ~ '^[a-z0-9-]{2,40}$'),
  name text not null unique check (char_length(name) between 1 and 80),
  description text not null,
  duration text not null,
  highlights text[] not null default '{}',
  image_url text not null,
  image_alt text not null default '',
  sort_order smallint not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.services (
  slug text primary key check (slug ~ '^[a-z0-9-]{2,40}$'),
  name text not null,
  price_dt integer not null check (price_dt >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger destinations_updated_at before update on public.destinations
  for each row execute function public.set_updated_at();
create trigger safaris_updated_at before update on public.safaris
  for each row execute function public.set_updated_at();
create trigger services_updated_at before update on public.services
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Requests
-- ---------------------------------------------------------------------------

create type public.request_kind as enum ('trip', 'visa', 'safari');
create type public.request_status as enum ('new', 'contacted', 'quoted', 'paid', 'closed', 'cancelled');
create type public.request_source as enum ('quiz', 'trip', 'direct', 'visa', 'safari');

create table public.requests (
  id uuid primary key default gen_random_uuid(),
  number bigint generated always as identity (start with 1000) unique,
  -- Human reference quoted in the WhatsApp message, e.g. SAFRA-1042
  reference text generated always as ('SAFRA-' || number::text) stored,
  kind public.request_kind not null,
  source public.request_source not null,
  status public.request_status not null default 'new',
  full_name text not null check (char_length(btrim(full_name)) between 1 and 120),
  whatsapp text not null check (char_length(regexp_replace(whatsapp, '\D', '', 'g')) between 6 and 15),
  travelers smallint not null check (travelers between 1 and 99),
  destination_slug text references public.destinations (slug) on update cascade on delete set null,
  destination_text text check (char_length(destination_text) <= 120),
  safari_slug text references public.safaris (slug) on update cascade on delete set null,
  category text check (char_length(category) <= 50),
  preferred_date date,
  duration_days smallint check (duration_days between 1 and 365),
  duration_text text check (char_length(duration_text) <= 60),
  budget_dt integer check (budget_dt > 0),
  notes text check (char_length(notes) <= 1500),
  quiz_answers jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Trip and safari requests always carry the party budget
  check (kind = 'visa' or budget_dt is not null),
  check (kind <> 'safari' or safari_slug is not null)
);

create index requests_status_created_idx on public.requests (status, created_at desc);
create index requests_destination_idx on public.requests (destination_slug);
create index requests_safari_idx on public.requests (safari_slug);

create trigger requests_updated_at before update on public.requests
  for each row execute function public.set_updated_at();

-- Passport data: admin-read only. Consider purging rows once a visa is processed.
create table public.visa_applications (
  request_id uuid primary key references public.requests (id) on delete cascade,
  service_slug text not null references public.services (slug),
  price_dt integer not null check (price_dt >= 0), -- price at the time of the request
  date_of_birth date not null,
  nationality text not null check (char_length(btrim(nationality)) between 1 and 120),
  passport_number text not null check (char_length(btrim(passport_number)) between 1 and 40),
  passport_expiry date not null,
  arrival_date date not null,
  departure_date date not null,
  purpose_of_travel text not null check (char_length(btrim(purpose_of_travel)) between 1 and 120),
  occupation_status text not null check (char_length(btrim(occupation_status)) between 1 and 120),
  flight_booked boolean not null,
  accommodation_booked boolean not null,
  previous_thailand_visit boolean not null,
  previous_visa_refusal boolean not null,
  created_at timestamptz not null default now(),
  check (departure_date >= arrival_date),
  check (date_of_birth < arrival_date)
);

create index visa_applications_service_idx on public.visa_applications (service_slug);

-- Status history for the admin pipeline.
create table public.request_events (
  id bigint generated always as identity primary key,
  request_id uuid not null references public.requests (id) on delete cascade,
  from_status public.request_status,
  to_status public.request_status not null,
  actor uuid default auth.uid(),
  created_at timestamptz not null default now()
);

create index request_events_request_idx on public.request_events (request_id, created_at);

create or replace function public.log_request_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.request_events (request_id, from_status, to_status) values (new.id, null, new.status);
  elsif new.status is distinct from old.status then
    insert into public.request_events (request_id, from_status, to_status) values (new.id, old.status, new.status);
  end if;
  return new;
end;
$$;

revoke execute on function public.log_request_status() from public;

create trigger requests_log_status after insert or update of status on public.requests
  for each row execute function public.log_request_status();

-- ---------------------------------------------------------------------------
-- submit_request: one atomic insert for every form on the site.
-- Payload keys match src/lib/requests.ts (camelCase). Returns id + reference.
-- ---------------------------------------------------------------------------

create or replace function public.submit_request(payload jsonb)
returns table (id uuid, reference text)
language plpgsql
set search_path = ''
as $$
declare
  v_kind public.request_kind := (payload ->> 'kind')::public.request_kind;
  v_today date := (now() at time zone 'Africa/Tunis')::date;
  v_request public.requests%rowtype;
  v_service public.services%rowtype;
  v_safari_slug text;
  v_destination_slug text;
  v_arrival date;
  v_departure date;
  v_expiry date;
  v_dob date;
begin
  -- Optional links to catalog rows; unknown slugs are ignored rather than rejected.
  select d.slug into v_destination_slug
    from public.destinations d where d.slug = nullif(payload ->> 'destinationSlug', '');

  if v_kind = 'safari' then
    select s.slug into v_safari_slug
      from public.safaris s
     where s.slug = nullif(payload ->> 'safariSlug', '') or s.name = nullif(payload ->> 'safari', '')
     limit 1;
    if v_safari_slug is null then
      raise exception 'Unknown safari' using errcode = '22023';
    end if;
  end if;

  if v_kind = 'visa' then
    select * into v_service from public.services s
     where s.slug = coalesce(nullif(payload ->> 'serviceSlug', ''), 'thailand-visa') and s.is_active;
    if not found then
      raise exception 'Visa service unavailable' using errcode = '22023';
    end if;

    v_arrival := (payload ->> 'arrivalDate')::date;
    v_departure := (payload ->> 'departureDate')::date;
    v_expiry := (payload ->> 'passportExpiry')::date;
    v_dob := (payload ->> 'dateOfBirth')::date;
    if v_arrival < v_today then
      raise exception 'Arrival date must be today or later.' using errcode = '22023';
    end if;
    if v_expiry <= v_today then
      raise exception 'Passport expiry must be in the future.' using errcode = '22023';
    end if;
    if v_dob >= v_today then
      raise exception 'Date of birth must be in the past.' using errcode = '22023';
    end if;
  end if;

  insert into public.requests (
    kind, source, full_name, whatsapp, travelers,
    destination_slug, destination_text, safari_slug, category,
    preferred_date, duration_days, duration_text, budget_dt, notes, quiz_answers
  )
  values (
    v_kind,
    coalesce(nullif(payload ->> 'source', ''), v_kind::text)::public.request_source,
    btrim(payload ->> 'fullName'),
    btrim(payload ->> 'whatsapp'),
    (payload ->> 'travelers')::smallint,
    v_destination_slug,
    nullif(btrim(payload ->> 'destination'), ''),
    v_safari_slug,
    nullif(btrim(payload ->> 'category'), ''),
    nullif(payload ->> 'preferredDate', '')::date,
    nullif(payload ->> 'durationDays', '')::smallint,
    nullif(btrim(payload ->> 'preferredDuration'), ''),
    nullif(payload ->> 'budgetDT', '')::integer,
    nullif(btrim(coalesce(payload ->> 'notes', payload ->> 'specialRequests')), ''),
    payload -> 'quizAnswers'
  )
  returning * into v_request;

  if v_kind = 'visa' then
    insert into public.visa_applications (
      request_id, service_slug, price_dt, date_of_birth, nationality, passport_number, passport_expiry,
      arrival_date, departure_date, purpose_of_travel, occupation_status,
      flight_booked, accommodation_booked, previous_thailand_visit, previous_visa_refusal
    )
    values (
      v_request.id, v_service.slug, v_service.price_dt, v_dob,
      btrim(payload ->> 'nationality'), btrim(payload ->> 'passportNumber'), v_expiry,
      v_arrival, v_departure,
      btrim(payload ->> 'purposeOfTravel'), btrim(payload ->> 'occupationStatus'),
      (payload ->> 'flightBooked') = 'Yes',
      (payload ->> 'accommodationBooked') = 'Yes',
      (payload ->> 'previousThailandVisit') = 'Yes',
      (payload ->> 'previousVisaRefusal') = 'Yes'
    );
  end if;

  return query select v_request.id, v_request.reference;
end;
$$;

comment on function public.submit_request(jsonb) is
  'Server-only (service_role). Validates and stores a concierge request; visa details go to visa_applications.';

revoke execute on function public.submit_request(jsonb) from public, anon, authenticated;
grant execute on function public.submit_request(jsonb) to service_role;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.admins enable row level security;
alter table public.destinations enable row level security;
alter table public.safaris enable row level security;
alter table public.services enable row level security;
alter table public.requests enable row level security;
alter table public.visa_applications enable row level security;
alter table public.request_events enable row level security;

-- Admins can see their own membership (lets the app check the role).
create policy "admins read own row" on public.admins
  for select to authenticated using (user_id = (select auth.uid()));

-- Catalog: everyone reads active rows; admins read and manage everything.
create policy "public reads active destinations" on public.destinations
  for select to anon, authenticated using (is_active or (select public.is_admin()));
create policy "admins manage destinations" on public.destinations
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "public reads active safaris" on public.safaris
  for select to anon, authenticated using (is_active or (select public.is_admin()));
create policy "admins manage safaris" on public.safaris
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "public reads active services" on public.services
  for select to anon, authenticated using (is_active or (select public.is_admin()));
create policy "admins manage services" on public.services
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- Requests: admin only. No insert policy — inserts go through submit_request (service_role).
create policy "admins read requests" on public.requests
  for select to authenticated using ((select public.is_admin()));
create policy "admins update requests" on public.requests
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "admins read visa applications" on public.visa_applications
  for select to authenticated using ((select public.is_admin()));

create policy "admins read request events" on public.request_events
  for select to authenticated using ((select public.is_admin()));

-- Belt and braces on top of RLS: visitors get no write privileges anywhere,
-- and no privileges at all on request data.
revoke insert, update, delete on public.destinations, public.safaris, public.services from anon;
revoke all on public.requests, public.visa_applications, public.request_events, public.admins from anon;
