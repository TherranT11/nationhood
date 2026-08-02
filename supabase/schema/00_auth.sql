-- 00 · Profiles + auth  (Nationhood: Prophecy & Plague)
-- Idempotent — safe to paste into the Supabase SQL Editor and re-run.
-- Depends only on auth.users.
--
-- Passwords are NOT stored here; Supabase Auth manages credentials in auth.users
-- (hashed). This mirrors each ruler's email + chosen nickname into a queryable
-- profiles row, created automatically on sign-up by the trigger below.

create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  nickname   text,
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists nickname text;

-- Lock the table: nothing readable/writable until a policy allows it.
alter table public.profiles enable row level security;

-- A ruler may read / update only their own profile.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- No client INSERT policy: profiles are created only by the trigger below
-- (security definer), so a client can't forge rows.

-- Create a profile on sign-up, copying the email and the nickname passed as auth
-- metadata (options.data.nickname on signUp). A duplicate nickname trips the
-- unique index below and fails the sign-up cleanly.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, nickname)
  values (new.id, new.email, nullif(new.raw_user_meta_data ->> 'nickname', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Resolve a nickname to its email so players can log in by nickname. Runs before
-- the caller is authenticated, so execute is granted to anon. NOTE: this lets a
-- nickname be mapped to an email (an enumeration surface) — acceptable for now;
-- move to an edge function or restrict if that privacy matters.
create or replace function public.email_for_nickname(_nick text)
returns text language sql security definer set search_path = public as $$
  select email from public.profiles where lower(nickname) = lower(_nick) limit 1;
$$;
grant execute on function public.email_for_nickname(text) to anon, authenticated;

-- Ruler names are unique (case-insensitive). Run LAST: if this errors, you have
-- duplicate nicknames in legacy rows — clean them up, then re-run. Nulls are
-- ignored, so pre-existing profiles without a nickname are fine.
create unique index if not exists profiles_nickname_lower_uidx
  on public.profiles (lower(nickname));
