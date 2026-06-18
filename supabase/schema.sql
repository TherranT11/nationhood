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

-- ---------------------------------------------------------------------------
-- Tutorial state: ONE jsonb blob per player, holding every tutorial field:
--   party, government_formed, theo_task, party_actions, coalition, bill_votes,
--   week, crisis, floor_bill, legislation, party_popularity, confidence_adj.
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

-- ---------------------------------------------------------------------------
-- Nations: the public game-world states a player can join. Read-only to clients
-- (no write policy → RLS denies all client writes); the nation roster is seeded
-- here. The five ladder stats are the single source of the starting numbers; the
-- word labels are derived on the client from /ladders.js (statLabel), never stored.
-- ---------------------------------------------------------------------------
create table if not exists public.nations (
  id             text primary key,
  name           text not null,
  description    text,
  flag           text,            -- asset path, e.g. /assets/Sessau.png
  population     bigint,          -- raw count; formatted on the client
  gdp            bigint,          -- raw value; formatted on the client
  active_parties int  not null default 0,
  stats          jsonb not null default '{}'::jsonb, -- {prosperity, welfare, order, image, growth}
  economy        jsonb not null default '{}'::jsonb, -- {regime, inflation, unemployment, budget, debt}
  created_at     timestamptz not null default now()
);
-- For installs created before the economy column existed.
alter table public.nations add column if not exists economy jsonb not null default '{}'::jsonb;

alter table public.nations enable row level security;

-- Anyone may read the nation roster (public game data); clients never write it.
drop policy if exists "nations_select_all" on public.nations;
create policy "nations_select_all" on public.nations for select using (true);

-- Seed the first nation with its starting numbers (idempotent; won't clobber a
-- live row's values on re-run).
insert into public.nations (id, name, description, flag, population, gdp, active_parties, stats, economy)
values (
  'sessau',
  'Sessau',
  'A nation in Meridian, steeped in culture and history.',
  '/assets/Sessau.png',
  69000000,
  678000000000,
  0,
  '{"prosperity":14,"welfare":13,"order":13,"image":16,"growth":9}'::jsonb,
  '{"regime":"Electoral Democracy. 45% Ceiling.","inflation":13,"unemployment":9,"budget":12.4,"debt":31}'::jsonb
)
on conflict (id) do nothing;

-- Backfill the economy figures on an already-seeded Sessau row (the insert above
-- is a no-op once the row exists). Only touches a row that hasn't got them yet.
update public.nations
   set economy = '{"regime":"Electoral Democracy. 45% Ceiling.","inflation":13,"unemployment":9,"budget":12.4,"debt":31}'::jsonb
 where id = 'sessau' and (economy is null or economy = '{}'::jsonb);

-- ---------------------------------------------------------------------------
-- Parties: a player's party within a nation. One per player for now (unique
-- user_id). Public read (the roster is shared game data); a player may write only
-- their own row. active_parties on nations is intentionally NOT auto-maintained
-- here — wiring that up (a derived count or a server function) is a deliberate,
-- separate step rather than a hidden trigger.
-- ---------------------------------------------------------------------------
create table if not exists public.parties (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  nation_id    text not null references public.nations (id),
  name         text not null,
  abbreviation text not null,
  archetype    text not null,
  created_at   timestamptz not null default now(),
  unique (user_id)
);
-- For installs created before the abbreviation column existed.
alter table public.parties add column if not exists abbreviation text;

-- No two parties in the same nation may share a name (case-insensitive) or an
-- abbreviation — enforced server-side, not just in the client.
create unique index if not exists parties_nation_name_uniq on public.parties (nation_id, lower(name));
create unique index if not exists parties_nation_abbr_uniq on public.parties (nation_id, upper(abbreviation));

alter table public.parties enable row level security;

drop policy if exists "parties_select_all" on public.parties;
create policy "parties_select_all" on public.parties for select using (true);

drop policy if exists "parties_insert_own" on public.parties;
create policy "parties_insert_own" on public.parties for insert with check (auth.uid() = user_id);

drop policy if exists "parties_update_own" on public.parties;
create policy "parties_update_own" on public.parties for update using (auth.uid() = user_id);

drop policy if exists "parties_delete_own" on public.parties;
create policy "parties_delete_own" on public.parties for delete using (auth.uid() = user_id);
