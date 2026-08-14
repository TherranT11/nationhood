-- 00 · Auth — a profile row per signed-up account (Nationhood: Rise and
-- Fall). Idempotent — safe to paste into the Supabase SQL Editor and re-run.
--
-- Supabase Auth (auth.users) has no username field, only email — rf_profiles
-- holds the public username chosen at sign-up so the /signup page can check
-- availability and, later, show it publicly, without exposing auth.users
-- (email, password hash, etc.) to anyone.
--
-- NOTE: named rf_profiles (not "profiles") because this Supabase project is
-- reused across games and may already hold a profiles table from an earlier
-- one. Namespacing avoids colliding with anything pre-existing.

create table if not exists public.rf_profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  username   text not null,
  created_at timestamptz not null default now()
);

-- Lifetime meta-progression, shown on /found ("Your Nth civilization",
-- "X legacy banked"): legacy_banked accumulates from past civilizations
-- (Decline isn't built yet, so this only ever moves once that exists), and
-- civilizations_founded counts PAST civilizations only — the one you're
-- about to found on /found isn't counted until it's founded, so a brand
-- new account correctly reads "Your 1st civilization" / "0 legacy banked".
alter table public.rf_profiles add column if not exists legacy_banked integer not null default 0;
alter table public.rf_profiles add column if not exists civilizations_founded integer not null default 0;

-- Case-insensitive uniqueness: "Theo" and "theo" are the same account name.
create unique index if not exists rf_profiles_username_key on public.rf_profiles (lower(username));

alter table public.rf_profiles enable row level security;

-- Usernames are meant to be public (the sign-up form says so), so anyone can
-- read them — needed for the availability check on /signup, which runs
-- before the caller is authenticated. Email, password, and everything else
-- about the account stays in auth.users, which this policy doesn't touch.
drop policy if exists "Profiles are publicly readable" on public.rf_profiles;
create policy "Profiles are publicly readable"
  on public.rf_profiles for select
  using (true);

-- No insert/update policy for regular callers: rows are only ever written by
-- rf_handle_new_user() below, which runs as the function owner (security
-- definer) and bypasses RLS. A user can't set someone else's username, and
-- can't rename their own post-signup (no UI for that yet either).

-- Populate rf_profiles automatically when a new auth user is created,
-- reading the chosen username out of the signUp() call's user_metadata
-- (supabase.auth.signUp({ ..., options: { data: { username } } })).
create or replace function public.rf_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.rf_profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', 'player-' || substr(new.id::text, 1, 8)));
  return new;
end;
$$;

drop trigger if exists rf_on_auth_user_created on auth.users;
create trigger rf_on_auth_user_created
  after insert on auth.users
  for each row execute function public.rf_handle_new_user();
