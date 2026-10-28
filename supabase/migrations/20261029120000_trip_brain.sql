-- Trip brain: the countries and bases the questionnaire picks from, and its thresholds.
-- Prices are SAFRA's reference estimates in TND (edited in /admin/brain) until live sources exist.

create table public.brain_countries (
  code text primary key check (code ~ '^[a-z0-9-]{2,40}$'),
  name text not null check (char_length(name) between 1 and 80),
  airport text not null default '' check (char_length(airport) <= 40),
  -- Round trip from Tunis-Carthage per person, economy with a checked bag.
  flight_tnd integer not null check (flight_tnd > 0),
  flight_hours numeric(4, 1) not null check (flight_hours > 0),
  visa_tnd integer not null default 0 check (visa_tnd >= 0),
  internal_move_tnd integer not null default 0 check (internal_move_tnd >= 0),
  insurance_day_tnd integer not null default 0 check (insurance_day_tnd >= 0),
  esim_tnd integer not null default 0 check (esim_tnd >= 0),
  image_url text not null default '',
  translations jsonb not null default '{}'::jsonb check (jsonb_typeof(translations) = 'object'),
  sort_order smallint not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.brain_bases (
  slug text primary key check (slug ~ '^[a-z0-9-]{2,40}$'),
  country_code text not null references public.brain_countries (code) on update cascade on delete cascade,
  place text not null check (char_length(place) between 1 and 80),
  strengths text[] not null default '{}',
  -- Months 1–12; months in neither list are "bad" (never suggested).
  best_months smallint[] not null default '{}'
    check (best_months <@ array[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]::smallint[]),
  ok_months smallint[] not null default '{}'
    check (ok_months <@ array[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]::smallint[]),
  stay_areas text[] not null default '{}',
  min_nights smallint not null default 2 check (min_nights between 1 and 30),
  family_ok boolean not null default true,
  -- {"solo": 0–1, "couple": …, "honeymoon": …, "friends": …, "family": …}
  group_fit jsonb not null default '{}'::jsonb check (jsonb_typeof(group_fit) = 'object'),
  -- Per night per room: {"budget_hotel": n, "good_hotel": n, "apartment": n}
  stay_tnd jsonb not null check (jsonb_typeof(stay_tnd) = 'object'),
  food_budget_tnd integer not null check (food_budget_tnd >= 0),
  food_mid_tnd integer not null check (food_mid_tnd >= 0),
  transport_day_tnd integer not null default 0 check (transport_day_tnd >= 0),
  transfer_tnd integer not null default 0 check (transfer_tnd >= 0),
  -- [{"name", "vibes", "priceTND", "booking", "kidFriendly"}]
  activities jsonb not null default '[]'::jsonb check (jsonb_typeof(activities) = 'array'),
  translations jsonb not null default '{}'::jsonb check (jsonb_typeof(translations) = 'object'),
  sort_order smallint not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (not (best_months && ok_months))
);

create index brain_bases_country_idx on public.brain_bases (country_code);

create trigger brain_countries_updated_at before update on public.brain_countries
  for each row execute function public.set_updated_at();
create trigger brain_bases_updated_at before update on public.brain_bases
  for each row execute function public.set_updated_at();

alter table public.brain_countries enable row level security;
alter table public.brain_bases enable row level security;

create policy "public reads active brain countries" on public.brain_countries
  for select to anon, authenticated using (is_active or (select private.is_admin()));
create policy "admins insert brain countries" on public.brain_countries
  for insert to authenticated with check ((select private.is_admin()));
create policy "admins update brain countries" on public.brain_countries
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins delete brain countries" on public.brain_countries
  for delete to authenticated using ((select private.is_admin()));

create policy "public reads active brain bases" on public.brain_bases
  for select to anon, authenticated using (is_active or (select private.is_admin()));
create policy "admins insert brain bases" on public.brain_bases
  for insert to authenticated with check ((select private.is_admin()));
create policy "admins update brain bases" on public.brain_bases
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins delete brain bases" on public.brain_bases
  for delete to authenticated using ((select private.is_admin()));

revoke insert, update, delete on public.brain_countries, public.brain_bases from anon;

-- Thresholds (section 10 of the brain).
alter table public.site_settings
  add column brain_min_pocket_tnd integer not null default 60 check (brain_min_pocket_tnd between 0 and 10000),
  add column brain_card_fee_pct numeric(4, 1) not null default 3 check (brain_card_fee_pct between 0 and 20),
  add column brain_max_flight_share integer not null default 45 check (brain_max_flight_share between 5 and 100),
  add column brain_activity_every smallint not null default 2 check (brain_activity_every between 1 and 14);
