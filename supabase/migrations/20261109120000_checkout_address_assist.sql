-- Trip plan checkout:
-- 1. The visitor's details now always include their governorate and address, for cash on delivery and online
--    payments alike: submit_request() requires and stores them for every order (before: cash on delivery only).
-- 2. Live WhatsApp assistance, set in /admin/settings: 'included' in every plan (the default, as today), or a
--    paid 'addon' the customer ticks at checkout. submit_request() charges it from the settings, never from the
--    browser, and records what the customer got.
-- Same signature, so the function is replaced in place.

alter table public.site_settings
  add column assist_mode text not null default 'included' check (assist_mode in ('included', 'addon')),
  add column assist_price_dt integer not null default 49 check (assist_price_dt between 0 and 10000);

-- Orders: 'included' (in the plan), 'added' (paid add-on) or 'declined'; null on requests that aren't orders.
alter table public.requests
  add column assist text check (assist in ('included', 'added', 'declined')),
  add column assist_dt integer check (assist_dt >= 0);

create or replace function public.submit_request(payload jsonb)
returns table (id uuid, reference text, plan_price_dt integer, delivery_fee_dt integer, total_dt integer)
language plpgsql
set search_path = ''
as $$
declare
  v_kind public.request_kind := (payload ->> 'kind')::public.request_kind;
  v_today date := (now() at time zone 'Africa/Tunis')::date;
  v_request public.requests%rowtype;
  v_service public.services%rowtype;
  v_settings public.site_settings%rowtype;
  v_safari_slug text;
  v_destination_slug text;
  v_arrival date;
  v_departure date;
  v_expiry date;
  v_dob date;
  -- Visitor's language; anything unexpected is stored as English.
  v_locale text := case when payload ->> 'locale' in ('fr', 'ar') then payload ->> 'locale' else 'en' end;
  v_method text := nullif(payload ->> 'paymentMethod', '');
  v_plan integer;
  v_fee integer;
  v_assist text;
  v_assist_dt integer := 0;
begin
  select * into v_settings from public.site_settings s where s.id = 1;

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

  -- Trip plan order: priced here from the settings, never from the payload.
  if v_method is not null then
    if v_kind <> 'trip' then
      raise exception 'Only trip plans can be ordered.' using errcode = '22023';
    end if;
    if v_method not in ('cod', 'd17', 'flouci', 'wafacash', 'bank')
       or (v_method = 'd17' and btrim(v_settings.d17_number) = '')
       or (v_method = 'flouci' and btrim(v_settings.flouci_number) = '')
       or (v_method = 'wafacash' and (btrim(v_settings.wafacash_name) = '' or btrim(v_settings.wafacash_phone) = ''))
       or (v_method = 'bank' and btrim(v_settings.bank_rib) = '') then
      raise exception 'This payment method is not available.' using errcode = '22023';
    end if;
    -- Every order says where the customer lives (governorate + address), whatever the payment method.
    if coalesce(btrim(payload ->> 'governorate'), '') = '' or coalesce(btrim(payload ->> 'address'), '') = '' then
      raise exception 'Delivery address is required.' using errcode = '22023';
    end if;
    v_plan := coalesce(v_settings.plan_price_dt, 79);
    v_fee := case when v_method = 'cod' then coalesce(v_settings.delivery_fee_dt, 7) else 0 end;
    v_assist := case
      when coalesce(v_settings.assist_mode, 'included') = 'included' then 'included'
      when payload ->> 'assistance' = 'true' then 'added'
      else 'declined'
    end;
    v_assist_dt := case when v_assist = 'added' then coalesce(v_settings.assist_price_dt, 0) else 0 end;
  end if;

  insert into public.requests (
    kind, source, channel, locale, full_name, whatsapp, travelers,
    destination_slug, destination_text, safari_slug, category,
    preferred_date, duration_days, duration_text, budget_dt, notes, quiz_answers,
    payment_method, plan_price_dt, delivery_fee_dt, total_dt, delivery_governorate, delivery_address, assist, assist_dt
  )
  values (
    v_kind,
    coalesce(nullif(payload ->> 'source', ''), v_kind::text)::public.request_source,
    coalesce(v_settings.booking_mode, 'whatsapp'),
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
    payload -> 'quizAnswers',
    v_method,
    v_plan,
    v_fee,
    v_plan + v_fee + v_assist_dt,
    case when v_method is not null then btrim(payload ->> 'governorate') end,
    case when v_method is not null then btrim(payload ->> 'address') end,
    v_assist,
    case when v_method is not null then v_assist_dt end
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

  return query select v_request.id, v_request.reference, v_request.plan_price_dt, v_request.delivery_fee_dt, v_request.total_dt;
end;
$$;

revoke execute on function public.submit_request(jsonb) from public, anon, authenticated;
grant execute on function public.submit_request(jsonb) to service_role;
