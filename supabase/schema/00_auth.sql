-- 00 · Profiles + auth trigger  (ROME: Rise and Fall)
-- Idempotent — safe to paste into the Supabase SQL Editor (Dashboard → SQL Editor
-- → New query) and re-run. Depends only on auth.users.
--
-- Passwords are NOT stored here; Supabase Auth manages credentials in auth.users
-- (hashed). This mirrors each citizen's email + chosen nickname into a queryable
-- profiles row, created automatically on sign-up by the trigger at the bottom.

-- profiles: one row per authenticated citizen -------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  nickname   text,
  created_at timestamptz not null default now()
);

-- The nickname is shown next to a character name; capped at 16 characters. Added
-- as a separate step so this file stays safe to run against a pre-existing
-- profiles table (adds the column only if missing).
alter table public.profiles
  add column if not exists nickname text;

alter table public.profiles
  drop constraint if exists profiles_nickname_len;
alter table public.profiles
  add constraint profiles_nickname_len
  check (nickname is null or char_length(nickname) <= 16);

-- Lock the table: nothing readable/writable until a policy allows it ---------
alter table public.profiles enable row level security;

-- A citizen may read only their own profile (not other players').
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

-- A citizen may update only their own profile.
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- No INSERT policy on purpose: rows are created only by the trigger below, which
-- runs as the table owner (security definer) and so bypasses RLS. Clients cannot
-- forge profile rows directly.

-- Auto-create a profile on sign-up, copying the email and the nickname that the
-- client passes as auth metadata (options.data.nickname on signUp). The nickname
-- is trimmed to 16 chars server-side as defence in depth, and NULLed if empty.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, nickname)
  values (
    new.id,
    new.email,
    nullif(left(coalesce(new.raw_user_meta_data ->> 'nickname', ''), 16), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
