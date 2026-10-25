-- Languages
--   1. translations jsonb on destinations, safaris and services: optional French/Arabic text,
--      {"fr": {...}, "ar": {...}} — the site falls back to English field by field
--   2. requests.locale: the language the visitor used, so SAFRA can reply in it

alter table public.destinations
  add column translations jsonb not null default '{}'::jsonb check (jsonb_typeof(translations) = 'object');
alter table public.safaris
  add column translations jsonb not null default '{}'::jsonb check (jsonb_typeof(translations) = 'object');
alter table public.services
  add column translations jsonb not null default '{}'::jsonb check (jsonb_typeof(translations) = 'object');

alter table public.requests
  add column locale text not null default 'en' check (locale in ('en', 'fr', 'ar'));

-- submit_request: also stores the visitor's language (payload.locale).
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
  -- Visitor's language; anything unexpected is stored as English.
  v_locale text := case when payload ->> 'locale' in ('fr', 'ar') then payload ->> 'locale' else 'en' end;
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
    kind, source, channel, locale, full_name, whatsapp, travelers,
    destination_slug, destination_text, safari_slug, category,
    preferred_date, duration_days, duration_text, budget_dt, notes, quiz_answers
  )
  values (
    v_kind,
    coalesce(nullif(payload ->> 'source', ''), v_kind::text)::public.request_source,
    coalesce(v_channel, 'whatsapp'),
    v_locale,
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
