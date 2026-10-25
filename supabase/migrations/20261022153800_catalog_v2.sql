-- Catalog v2
--   1. `catalog` storage bucket for images uploaded from /admin (public read, admin write)
--   2. Several visa services (country, flag, what's included, documents) instead of Thailand only
--   3. site_settings: booking mode (WhatsApp hand-off or on-site reservation) + WhatsApp number
--   4. requests.channel records which booking mode a request came through

-- 1. Image uploads ----------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('catalog', 'catalog', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do nothing;

-- Public bucket: files are readable by URL without a select policy, so visitors can't list them.
-- Admins get select too (Storage may read back the row it just inserted).
create policy "admins read catalog image records" on storage.objects
  for select to authenticated using (bucket_id = 'catalog' and (select private.is_admin()));
create policy "admins upload catalog images" on storage.objects
  for insert to authenticated with check (bucket_id = 'catalog' and (select private.is_admin()));
create policy "admins delete catalog images" on storage.objects
  for delete to authenticated using (bucket_id = 'catalog' and (select private.is_admin()));

-- 2. Visa services ----------------------------------------------------------------------

alter table public.services
  add column country text not null default '' check (char_length(country) <= 80),
  add column flag text not null default '' check (char_length(flag) <= 16),
  add column description text not null default '' check (char_length(description) <= 600),
  add column includes text[] not null default '{}',
  add column documents text[] not null default '{}',
  add column sort_order smallint not null default 0;

update public.services
   set country = 'Thailand',
       flag = '🇹🇭',
       includes = array['Document checklist', 'Document review', 'Application preparation / guidance', 'SAFRA support'],
       documents = array['Passport copy', 'Personal photo', 'Flight / travel details', 'Accommodation details',
                         'Bank statement / financial proof', 'Employment / business documents if required']
 where slug = 'thailand-visa';

alter table public.visa_applications rename column previous_thailand_visit to previous_visit;

-- 3. Site settings ----------------------------------------------------------------------

create table public.site_settings (
  id smallint primary key default 1 check (id = 1),
  -- 'whatsapp': store the request, then open a prefilled WhatsApp message
  -- 'onsite':   store the request and confirm it on the site; SAFRA contacts the customer
  booking_mode text not null default 'whatsapp' check (booking_mode in ('whatsapp', 'onsite')),
  -- International format, digits only (e.g. 21697433003)
  whatsapp_number text not null default '21697433003' check (whatsapp_number ~ '^[1-9][0-9]{6,14}$'),
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id) values (1) on conflict (id) do nothing;

create trigger site_settings_updated_at before update on public.site_settings
  for each row execute function public.set_updated_at();

alter table public.site_settings enable row level security;
create policy "public reads site settings" on public.site_settings
  for select to anon, authenticated using (true);
create policy "admins update site settings" on public.site_settings
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
revoke insert, update, delete on public.site_settings from anon;

-- 4. Booking channel --------------------------------------------------------------------

alter table public.requests
  add column channel text not null default 'whatsapp' check (channel in ('whatsapp', 'onsite'));

-- submit_request: services are generic now (serviceSlug required for visas), previousVisit
-- replaces previousThailandVisit, and the request records the current booking mode.
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
  v_channel text;
  v_arrival date;
  v_departure date;
  v_expiry date;
  v_dob date;
begin
  select s.booking_mode into v_channel from public.site_settings s where s.id = 1;

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
      raise exception 'This visa service is not available.' using errcode = '22023';
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
    kind, source, channel, full_name, whatsapp, travelers,
    destination_slug, destination_text, safari_slug, category,
    preferred_date, duration_days, duration_text, budget_dt, notes, quiz_answers
  )
  values (
    v_kind,
    coalesce(nullif(payload ->> 'source', ''), v_kind::text)::public.request_source,
    coalesce(v_channel, 'whatsapp'),
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
      flight_booked, accommodation_booked, previous_visit, previous_visa_refusal
    )
    values (
      v_request.id, v_service.slug, v_service.price_dt, v_dob,
      btrim(payload ->> 'nationality'), btrim(payload ->> 'passportNumber'), v_expiry,
      v_arrival, v_departure,
      btrim(payload ->> 'purposeOfTravel'), btrim(payload ->> 'occupationStatus'),
      (payload ->> 'flightBooked') = 'Yes',
      (payload ->> 'accommodationBooked') = 'Yes',
      (payload ->> 'previousVisit') = 'Yes',
      (payload ->> 'previousVisaRefusal') = 'Yes'
    );
  end if;

  return query select v_request.id, v_request.reference;
end;
$$;

revoke execute on function public.submit_request(jsonb) from public, anon, authenticated;
grant execute on function public.submit_request(jsonb) to service_role;
