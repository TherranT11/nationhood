-- Nationhood Game: auth + profiles schema
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New query).
--
-- Passwords are NOT stored here. Supabase Auth manages credentials in the
-- auth.users table and stores the password as a secure hash. This file only
-- mirrors each user's email into a queryable public.profiles row for the app.

-- ---------------------------------------------------------------------------
-- profiles: one row per authenticated user
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  created_at timestamptz not null default now()
);

-- The party a player chose during the tutorial. One source of truth for that
-- choice: exactly one value (or null if not done yet), never a contradiction.
-- Idempotent so this file is safe to re-run on an existing database.
alter table public.profiles
  add column if not exists tutorial_party text
  check (tutorial_party in ('Labour', 'Nationalist', 'Liberal'));

-- Whether the player has formed their government in the tutorial. Once true,
-- the Government screen shows the standard view instead of the formation UI.
alter table public.profiles
  add column if not exists tutorial_government_formed boolean not null default false;

-- The task the player assigns to Théo Lefèvre (Interior Minister) in the
-- tutorial. Null until they assign one. One value per player; idempotent so
-- this file is safe to re-run on an existing database.
alter table public.profiles
  add column if not exists tutorial_theo_task text;

-- Party actions the player has left this tutorial week. Starts at 3; assigning
-- a task spends its cost (e.g. Labour Talks costs 2 while Labour Unrest is
-- active). Idempotent.
alter table public.profiles
  add column if not exists tutorial_party_actions integer not null default 3;

-- A snapshot of the coalition the player formed: the full assembly (each party
-- with seats/colour/archetype and a gov flag), the government seat total, and
-- the contradictory-partner count. Null until a government is formed. The
-- formed Government screen renders entirely from this. Idempotent.
alter table public.profiles
  add column if not exists tutorial_coalition jsonb;

-- Lock the table down: nothing is readable/writable until a policy allows it.
alter table public.profiles enable row level security;

-- A user may read only their own profile (not other players').
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

-- A user may update only their own profile.
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- Note: there is intentionally no INSERT policy. Profiles are created only by
-- the trigger below, which runs as the table owner (security definer) and so
-- bypasses RLS. Clients cannot forge profile rows directly.

-- ---------------------------------------------------------------------------
-- Auto-create a profile whenever a new auth user signs up
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
