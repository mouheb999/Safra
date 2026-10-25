-- Admin dashboard support.
--
-- 1. admins.email (filled from auth.users on insert) so the dashboard can show who changed a
--    request's status, and every admin may read the admin list.
-- 2. private.add_admin(email): grant dashboard access from the SQL editor.
--      select private.add_admin('you@example.com');

alter table public.admins add column email text;

create or replace function private.fill_admin_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is null then
    select u.email into new.email from auth.users u where u.id = new.user_id;
  end if;
  return new;
end;
$$;

revoke execute on function private.fill_admin_email() from public, anon, authenticated;

create trigger admins_fill_email before insert on public.admins
  for each row execute function private.fill_admin_email();

drop policy "admins read own row" on public.admins;
create policy "admins read admins" on public.admins
  for select to authenticated using (user_id = (select auth.uid()) or (select private.is_admin()));

create or replace function private.add_admin(admin_email text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
begin
  select u.id into v_user_id from auth.users u where lower(u.email) = lower(btrim(admin_email));
  if v_user_id is null then
    raise exception 'No Supabase Auth user with email %', admin_email;
  end if;
  insert into public.admins (user_id) values (v_user_id) on conflict (user_id) do nothing;
  return v_user_id;
end;
$$;

-- SQL editor / dashboard only.
revoke execute on function private.add_admin(text) from public, anon, authenticated, service_role;
