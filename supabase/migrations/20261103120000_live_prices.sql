-- Live prices of the day for "Find my trip" (SerpApi: Google Flights + Google Hotels).
-- The server (service role) caches every search for a day and counts searches per month against a limit
-- set in /admin/brain, so the bill can't run away. Admins can read both tables; visitors can't.

create table public.live_prices (
  cache_key text primary key check (char_length(cache_key) between 1 and 200),
  kind text not null check (kind in ('flight', 'hotel', 'fx')),
  value jsonb not null,
  fetched_at timestamptz not null default now()
);

create table public.live_price_usage (
  month text primary key check (month ~ '^\d{4}-\d{2}$'),
  searches integer not null default 0 check (searches >= 0),
  updated_at timestamptz not null default now()
);

alter table public.live_prices enable row level security;
alter table public.live_price_usage enable row level security;

create policy "admins read live prices" on public.live_prices
  for select to authenticated using ((select private.is_admin()));
create policy "admins read live price usage" on public.live_price_usage
  for select to authenticated using ((select private.is_admin()));

revoke all on public.live_prices, public.live_price_usage from anon, authenticated;
grant select on public.live_prices, public.live_price_usage to authenticated;

-- One SerpApi search against this month's limit (Tunis time). True if it may run; false once the limit is
-- reached. Atomic, so parallel visitors can't overshoot.
create function public.claim_live_price_search(p_limit integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_month text := to_char(now() at time zone 'Africa/Tunis', 'YYYY-MM');
  v_count integer;
begin
  insert into public.live_price_usage (month, searches) values (v_month, 0) on conflict (month) do nothing;
  update public.live_price_usage
    set searches = searches + 1, updated_at = now()
    where month = v_month and searches < p_limit
    returning searches into v_count;
  return v_count is not null;
end;
$$;

revoke execute on function public.claim_live_price_search(integer) from public, anon, authenticated;
grant execute on function public.claim_live_price_search(integer) to service_role;

alter table public.site_settings
  add column live_prices_enabled boolean not null default true,
  add column live_prices_monthly_limit integer not null default 240 check (live_prices_monthly_limit between 0 and 100000),
  add column live_eur_tnd numeric(6, 3) not null default 3.400 check (live_eur_tnd > 1 and live_eur_tnd < 10);
