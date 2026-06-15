-- Auto-create a public.user_profiles row when a new auth.users row is inserted.
--
-- On the hosted project this was handled by an out-of-band trigger (like the
-- user_profiles table itself) that was never captured in migrations. On a fresh
-- local DB new signups therefore got no profile row, and the app's
-- `select role from user_profiles where user_id = ... .single()` returned 406 on
-- every authenticated page. This restores parity. Idempotent + safe on hosted.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (user_id, role, first_name, last_name)
  values (
    new.id,
    'user',
    nullif(new.raw_user_meta_data->>'first_name', ''),
    nullif(new.raw_user_meta_data->>'last_name', '')
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for any existing users created before this trigger existed.
insert into public.user_profiles (user_id, role)
select u.id, 'user'
from auth.users u
left join public.user_profiles up on up.user_id = u.id
where up.user_id is null
on conflict (user_id) do nothing;
