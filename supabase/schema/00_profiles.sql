-- 00 · Profiles + tutorial state + auth trigger
-- Run the schema/ files in numeric order in the Supabase SQL Editor. Each file is
-- idempotent and self-contained for its domain; this one depends only on auth.users.
--
-- Passwords are NOT stored here. Supabase Auth manages credentials in auth.users
-- (hashed). This only mirrors each user's email into a queryable profiles row.

-- ---------------------------------------------------------------------------
-- profiles: one row per authenticated user
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Tutorial state: ONE jsonb blob per player, holding every tutorial field:
--   party, government_formed, theo_task, party_actions, coalition, bill_votes,
--   week, crisis, floor_bill, legislation, party_popularity.
-- One column means one migration ever — adding a new tutorial field never needs a
-- schema change, and a write can never fail on a "missing column". Idempotent.
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists tutorial_state jsonb not null default '{}'::jsonb;

-- One-time consolidation: if the old per-field tutorial_* columns still exist,
-- copy their (non-null) values into tutorial_state, then drop them. Guarded by a
-- column-existence check so this whole file stays safe to re-run.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'tutorial_party'
  ) then
    update public.profiles set tutorial_state = tutorial_state || jsonb_strip_nulls(jsonb_build_object(
      'party',            tutorial_party,
      'government_formed', tutorial_government_formed,
      'theo_task',        tutorial_theo_task,
      'party_actions',    tutorial_party_actions,
      'coalition',        tutorial_coalition,
      'bill_votes',       tutorial_bill_votes,
      'week',             tutorial_week,
      'crisis',           tutorial_crisis,
      'floor_bill',       tutorial_floor_bill,
      'legislation',      tutorial_legislation,
      'party_popularity', tutorial_party_popularity,
      'confidence_adj',   tutorial_confidence_adj
    ));
    alter table public.profiles
      drop column tutorial_party,
      drop column tutorial_government_formed,
      drop column tutorial_theo_task,
      drop column tutorial_party_actions,
      drop column tutorial_coalition,
      drop column tutorial_bill_votes,
      drop column tutorial_week,
      drop column tutorial_crisis,
      drop column tutorial_floor_bill,
      drop column tutorial_legislation,
      drop column tutorial_party_popularity,
      drop column tutorial_confidence_adj;
  end if;
end $$;

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
-- Atomic partial-merge of a tutorial_state patch for the calling player. The
-- client sends only the fields it changed; this merges them server-side
-- (jsonb ||) so two writes never clobber each other's unrelated fields. Security
-- invoker: the auth.uid() filter + the update policy restrict it to the caller's
-- own row.
-- ---------------------------------------------------------------------------
create or replace function public.tutorial_merge(patch jsonb)
returns void
language sql
security invoker
set search_path = public
as $$
  update public.profiles
     set tutorial_state = coalesce(tutorial_state, '{}'::jsonb) || patch
   where id = auth.uid();
$$;

grant execute on function public.tutorial_merge(jsonb) to authenticated;

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
