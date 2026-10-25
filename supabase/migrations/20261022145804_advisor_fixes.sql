-- Fixes from the Supabase security/performance advisors after the first deploy.
--
-- 1. is_admin() moves to a schema the REST API doesn't expose, so it is no longer
--    callable as /rest/v1/rpc/is_admin. Policies still call it (they run as the
--    requesting role, which keeps usage + execute).
-- 2. log_request_status() is a trigger function: nobody needs to call it directly.
-- 3. Catalog admin policies no longer cover SELECT, so reads are checked against a
--    single permissive policy instead of two.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;

revoke execute on function private.is_admin() from public;
grant execute on function private.is_admin() to anon, authenticated, service_role;

-- Catalog ---------------------------------------------------------------------

drop policy "public reads active destinations" on public.destinations;
drop policy "admins manage destinations" on public.destinations;
create policy "public reads active destinations" on public.destinations
  for select to anon, authenticated using (is_active or (select private.is_admin()));
create policy "admins insert destinations" on public.destinations
  for insert to authenticated with check ((select private.is_admin()));
create policy "admins update destinations" on public.destinations
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins delete destinations" on public.destinations
  for delete to authenticated using ((select private.is_admin()));

drop policy "public reads active safaris" on public.safaris;
drop policy "admins manage safaris" on public.safaris;
create policy "public reads active safaris" on public.safaris
  for select to anon, authenticated using (is_active or (select private.is_admin()));
create policy "admins insert safaris" on public.safaris
  for insert to authenticated with check ((select private.is_admin()));
create policy "admins update safaris" on public.safaris
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins delete safaris" on public.safaris
  for delete to authenticated using ((select private.is_admin()));

drop policy "public reads active services" on public.services;
drop policy "admins manage services" on public.services;
create policy "public reads active services" on public.services
  for select to anon, authenticated using (is_active or (select private.is_admin()));
create policy "admins insert services" on public.services
  for insert to authenticated with check ((select private.is_admin()));
create policy "admins update services" on public.services
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins delete services" on public.services
  for delete to authenticated using ((select private.is_admin()));

-- Requests --------------------------------------------------------------------

drop policy "admins read requests" on public.requests;
drop policy "admins update requests" on public.requests;
create policy "admins read requests" on public.requests
  for select to authenticated using ((select private.is_admin()));
create policy "admins update requests" on public.requests
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

drop policy "admins read visa applications" on public.visa_applications;
create policy "admins read visa applications" on public.visa_applications
  for select to authenticated using ((select private.is_admin()));

drop policy "admins read request events" on public.request_events;
create policy "admins read request events" on public.request_events
  for select to authenticated using ((select private.is_admin()));

drop function public.is_admin();

-- Trigger function: not callable through the API.
revoke execute on function public.log_request_status() from anon, authenticated;
