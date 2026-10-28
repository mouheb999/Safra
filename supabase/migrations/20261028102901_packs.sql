-- Our packs: ready-made trips with a price per person, edited from /admin/catalog.
-- Same shape as the other catalog tables: English text in columns, French/Arabic in `translations`
-- ({"fr": {"title", "country", "route", "blurb"}, "ar": {...}}), public reads of active rows, admin writes.

create table public.packs (
  slug text primary key check (slug ~ '^[a-z0-9-]{2,40}$'),
  title text not null check (char_length(title) between 1 and 80),
  country text not null check (char_length(country) between 1 and 60),
  route text not null default '' check (char_length(route) <= 120),
  blurb text not null default '' check (char_length(blurb) <= 300),
  -- Price per person in DT, flights from Tunis included.
  price_dt integer not null check (price_dt between 1 and 1000000),
  nights smallint not null check (nights between 1 and 60),
  image_url text not null,
  -- What the price covers (labels live in the site's translations).
  includes text[] not null default '{}'
    check (includes <@ array['flights', 'hotel', 'breakfast', 'transfers', 'activities', 'visa', 'plan']),
  vibes text[] not null default '{}',
  -- Optional link to a catalog destination (the checkout uses it).
  destination_slug text references public.destinations (slug) on update cascade on delete set null,
  translations jsonb not null default '{}'::jsonb check (jsonb_typeof(translations) = 'object'),
  sort_order smallint not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index packs_destination_idx on public.packs (destination_slug);

create trigger packs_updated_at before update on public.packs
  for each row execute function public.set_updated_at();

alter table public.packs enable row level security;

create policy "public reads active packs" on public.packs
  for select to anon, authenticated using (is_active or (select private.is_admin()));
create policy "admins insert packs" on public.packs
  for insert to authenticated with check ((select private.is_admin()));
create policy "admins update packs" on public.packs
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins delete packs" on public.packs
  for delete to authenticated using ((select private.is_admin()));

revoke insert, update, delete on public.packs from anon;
