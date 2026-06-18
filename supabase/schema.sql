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
  legislature_seats int not null default 0, -- total seats in the nation's legislature
  stats          jsonb not null default '{}'::jsonb, -- {prosperity, welfare, order, image, growth}
  economy        jsonb not null default '{}'::jsonb, -- {regime, inflation, unemployment, budget, debt, currency}
  created_at     timestamptz not null default now()
);
-- For installs created before these columns existed.
alter table public.nations add column if not exists economy jsonb not null default '{}'::jsonb;
alter table public.nations add column if not exists legislature_seats int not null default 0;
-- The active-party count is derived live from public.parties (one source), not
-- stored — drop the old counter column if an earlier install still has it.
alter table public.nations drop column if exists active_parties;

alter table public.nations enable row level security;

-- Anyone may read the nation roster (public game data); clients never write it.
drop policy if exists "nations_select_all" on public.nations;
create policy "nations_select_all" on public.nations for select using (true);

-- Seed the first nation with its starting numbers (idempotent; won't clobber a
-- live row's values on re-run).
insert into public.nations (id, name, description, flag, population, gdp, legislature_seats, stats, economy)
values (
  'sessau',
  'Sessau',
  'A nation in Meridian, steeped in culture and history.',
  '/assets/Sessau.png',
  69000000,
  678000000000,
  280,
  '{"prosperity":14,"welfare":13,"order":13,"image":16,"growth":9}'::jsonb,
  '{"regime":"Electoral Democracy. 45% Ceiling.","inflation":13,"unemployment":9,"budget":12.4,"debt":31,"currency":"₶"}'::jsonb
)
on conflict (id) do nothing;

-- Backfill on an already-seeded Sessau row (the insert above is a no-op once the
-- row exists). Each only touches a row that hasn't got the value yet.
update public.nations
   set economy = '{"regime":"Electoral Democracy. 45% Ceiling.","inflation":13,"unemployment":9,"budget":12.4,"debt":31,"currency":"₶"}'::jsonb
 where id = 'sessau' and (economy is null or economy = '{}'::jsonb);
update public.nations set economy = economy || '{"currency":"₶"}'::jsonb
 where id = 'sessau' and not (economy ? 'currency');
update public.nations set legislature_seats = 280
 where id = 'sessau' and legislature_seats = 0;

-- ---------------------------------------------------------------------------
-- Parties: a player's party within a nation. One per player for now (unique
-- user_id). Public read — the roster is shared game data, and this single
-- multiplayer instance shows every party in a nation to everyone (the active
-- count + list are derived from these rows). A player may write only their own
-- row. The 8-per-nation cap is currently enforced on the client; a race-proof
-- cap would need a server-side check (a trigger/function — deliberately not
-- added here without sign-off, to avoid hidden automation).
-- ---------------------------------------------------------------------------
create table if not exists public.parties (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  nation_id    text not null references public.nations (id),
  name         text not null,
  abbreviation text not null,
  archetype    text not null,
  -- Starting standings. A brand-new party begins at zero on every count; game
  -- logic moves these later. They live here so each page reads one source.
  seats         int     not null default 0,     -- seats held in the legislature
  popularity    numeric not null default 0,     -- public support, % (fractional — actions move it in tenths)
  pop_floor     int     not null default 0,     -- support floor: the base attacks can't push below, %
  pop_ceiling   int     not null default 5,     -- support ceiling: current reach / cap on popularity, %
  funds         bigint  not null default 0,      -- party treasury, in the nation's currency
  in_government boolean not null default false, -- governing vs in opposition
  actions_remaining int not null default 3,     -- party actions left this turn (no auto-reset until the turn system exists)
  created_at   timestamptz not null default now(),
  unique (user_id)
);
-- For installs created before these columns existed.
alter table public.parties add column if not exists abbreviation text;
alter table public.parties add column if not exists seats int not null default 0;
alter table public.parties add column if not exists popularity numeric not null default 0;
alter table public.parties alter column popularity type numeric using popularity::numeric; -- widen int → numeric for fractional support
alter table public.parties add column if not exists pop_floor int not null default 0;
alter table public.parties add column if not exists pop_ceiling int not null default 5;
alter table public.parties add column if not exists funds bigint not null default 0;
alter table public.parties add column if not exists in_government boolean not null default false;
alter table public.parties add column if not exists actions_remaining int not null default 3;

-- No two parties in the same nation may share a name (case-insensitive) or an
-- abbreviation — enforced server-side, not just in the client.
create unique index if not exists parties_nation_name_uniq on public.parties (nation_id, lower(name));
create unique index if not exists parties_nation_abbr_uniq on public.parties (nation_id, upper(abbreviation));

alter table public.parties enable row level security;

drop policy if exists "parties_select_all" on public.parties;
create policy "parties_select_all" on public.parties for select using (true);

drop policy if exists "parties_insert_own" on public.parties;
create policy "parties_insert_own" on public.parties for insert with check (auth.uid() = user_id);

-- The update policy also carries a WITH CHECK so a player can't reassign their
-- party to someone else (user_id must stay the caller's) — needed because the
-- founding upsert's DO UPDATE may re-set user_id.
drop policy if exists "parties_update_own" on public.parties;
create policy "parties_update_own" on public.parties for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "parties_delete_own" on public.parties;
create policy "parties_delete_own" on public.parties for delete using (auth.uid() = user_id);

-- Write-scope lock (column-level). RLS gates WHICH row a player can touch; these
-- grants gate WHICH columns. The standings — seats, popularity, pop_floor,
-- pop_ceiling, funds, in_government — are GAME-CONTROLLED, so they are left out
-- of the client's insert/update privileges entirely: a crafted request can no
-- longer set e.g. popularity = 100. Only the identity fields the founding flow
-- writes are granted (user_id is included so the upsert's DO UPDATE works; the
-- WITH CHECK above keeps it pinned to the caller). When standings start changing
-- server-side, do it via a service-role path (which bypasses these grants).
revoke insert, update on public.parties from authenticated;
grant insert (user_id, nation_id, name, abbreviation, archetype) on public.parties to authenticated;
grant update (user_id, nation_id, name, abbreviation, archetype) on public.parties to authenticated;

-- ---------------------------------------------------------------------------
-- Politicians: a party's prominent politicians. Public read (shared instance —
-- everyone sees a party's roster); a player may add a politician only to a party
-- they own. The five stats are competencies (cha/acu/gui/res/com). A new party
-- is seeded client-side with exactly one politician, its Party Leader. The same
-- write-scope caveat as parties applies to the stat/age/experience columns here
-- (set on the client at creation) — lock them down when politician growth goes
-- server-side.
-- ---------------------------------------------------------------------------
create table if not exists public.politicians (
  id         uuid primary key default gen_random_uuid(),
  party_id   uuid not null references public.parties (id) on delete cascade,
  first_name text not null,
  last_name  text not null,
  age        int  not null,
  experience int  not null default 0,
  status     text not null default 'Party Member',
  cha int not null default 0,   -- Charisma
  acu int not null default 0,   -- Acumen
  gui int not null default 0,   -- Guile
  res int not null default 0,   -- Resolve
  com int not null default 0,   -- Command
  created_at timestamptz not null default now()
);

alter table public.politicians enable row level security;

drop policy if exists "politicians_select_all" on public.politicians;
create policy "politicians_select_all" on public.politicians for select using (true);

drop policy if exists "politicians_insert_own" on public.politicians;
create policy "politicians_insert_own" on public.politicians for insert
  with check (exists (select 1 from public.parties p where p.id = party_id and p.user_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- Events: the shared nation news feed (founding events are derived on the
-- client; action outcomes like rallies are stored here). Public read — the feed
-- is shared. There is intentionally NO client write policy: rows are written
-- only by the security-definer action functions below, so the body/outcome can't
-- be forged from the client.
-- ---------------------------------------------------------------------------
create table if not exists public.events (
  id         uuid primary key default gen_random_uuid(),
  nation_id  text not null references public.nations (id),
  party_id   uuid references public.parties (id) on delete cascade,
  kind       text not null,                 -- 'rally', 'fundraise', ...
  body       text not null,                 -- the fully-rendered, plain-text message
  game_date  text,                          -- in-game date the event occurred
  created_at timestamptz not null default now()
);

alter table public.events enable row level security;
drop policy if exists "events_select_all" on public.events;
create policy "events_select_all" on public.events for select using (true);

-- ---------------------------------------------------------------------------
-- party_rally(): the RALLY leader action. Server-authoritative because it writes
-- the game-controlled columns (popularity/funds/actions) the client can't. Rolls
-- 1d6 + the Party Leader's Charisma, divides by 10, and adds that to popularity
-- (capped at the ceiling); costs ₣25K and 1 action. Records a tiered event in the
-- feed. The roll happens here (server random) so it can't be gamed.
-- ---------------------------------------------------------------------------
create or replace function public.party_rally()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user  uuid := auth.uid();
  v_p     public.parties%rowtype;
  v_cha   int;
  v_roll  int;
  v_total int;
  v_delta numeric;
  v_newpop numeric;
  v_cost  bigint := 25000;
  v_tier  text;
  v_body  text;
begin
  if v_user is null then raise exception 'Not signed in.'; end if;
  select * into v_p from public.parties where user_id = v_user;
  if not found then raise exception 'You have no party.'; end if;
  if v_p.actions_remaining < 1 then raise exception 'No actions left this turn.'; end if;
  if v_p.funds < v_cost then raise exception 'Not enough funds for a rally (need ₣25K).'; end if;

  select coalesce(cha, 0) into v_cha from public.politicians
    where party_id = v_p.id and status = 'Party Leader' order by created_at limit 1;
  v_cha := coalesce(v_cha, 0);

  v_roll  := floor(random() * 6)::int + 1;                 -- 1d6
  v_total := v_roll + v_cha;
  v_delta := round((v_total::numeric) / 10.0, 1);          -- (1d6 + Cha) / 10
  v_newpop := least(v_p.popularity + v_delta, v_p.pop_ceiling::numeric); -- capped at the ceiling
  v_delta := v_newpop - v_p.popularity;                    -- the amount actually applied

  if    v_total >= 7 then v_tier := 'strong';
  elsif v_total >= 4 then v_tier := 'middling';
  else                    v_tier := 'poor';
  end if;

  v_body := 'The ' || v_p.name || ' has held a local rally' || case v_tier
    when 'strong'   then ', and it drew record-breaking crowds. Supporters spilled into the streets, the speeches landed, and the morning papers couldn''t ignore it.'
    when 'middling' then '. A steady, respectable turnout filled the hall, the faithful left heartened, even if the city beyond barely noticed.'
    else                 ', but the seats sat half-empty and the speech fell flat. Those who came went home unmoved, and the press stayed away.'
  end || ' Popularity +' || trim(to_char(v_delta, 'FM990.0')) || '%.';

  update public.parties
     set popularity = v_newpop,
         funds = funds - v_cost,
         actions_remaining = actions_remaining - 1
   where id = v_p.id;

  -- game_date is the frozen start for now; read a real game clock here once it exists.
  insert into public.events (nation_id, party_id, kind, body, game_date)
  values (v_p.nation_id, v_p.id, 'rally', v_body, 'January, 1980');

  return jsonb_build_object(
    'tier', v_tier, 'delta', v_delta, 'popularity', v_newpop,
    'funds', v_p.funds - v_cost, 'actions', v_p.actions_remaining - 1, 'body', v_body
  );
end $$;

grant execute on function public.party_rally() to authenticated;

-- ---------------------------------------------------------------------------
-- Sessau name pool: the source for Sessau-flavoured names (used later for
-- generated politicians/characters). One row per name, tagged by kind
-- (male / female first names, surname). Public read; clients never write it.
-- The rows themselves are bulk data and live in supabase/seed/sessau_names.sql
-- (run that once after this file); only the structure lives here.
-- ---------------------------------------------------------------------------
create table if not exists public.sessau_names (
  id   bigint generated always as identity primary key,
  kind text not null check (kind in ('male', 'female', 'surname')),
  name text not null,
  unique (kind, name)
);

alter table public.sessau_names enable row level security;

drop policy if exists "sessau_names_select_all" on public.sessau_names;
create policy "sessau_names_select_all" on public.sessau_names for select using (true);
