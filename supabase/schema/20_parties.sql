-- 20 · Parties (a player's party within a nation) + RLS + write-scope lock
-- Depends on: 10 (nations), auth.users. Run after 10.

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
  archetype    text,                            -- no longer chosen at creation; kept nullable for existing parties + the archetype mechanics
  -- Starting standings. A brand-new party begins at zero on every count; game
  -- logic moves these later. They live here so each page reads one source.
  seats         int     not null default 0,     -- seats held in the legislature
  popularity    numeric not null default 0,     -- public support, % (fractional — actions move it in tenths)
  pop_floor     numeric not null default 0,     -- RETIRED: popularity has no floor now (floats freely 0..100). Column kept for compatibility; migration 161 zeroes it.
  pop_ceiling   numeric not null default 100,   -- RETIRED: popularity has no reach ceiling now (floats freely 0..100). Column kept for compatibility; migration 161 sets it to 100.
  funds         bigint  not null default 0,      -- party treasury, in the nation's currency
  in_government boolean not null default false, -- governing vs in opposition
  influence int not null default 12,    -- Influence: the party's action budget. Banks up to 100, accruing +3/tick (+1 for the largest party in the nation) in advance_tick (schema/60); spent on actions and campaigning. Formerly Action Points (reset to 12/tick).
  description   text,                            -- founding identity statement (≤360 chars); replaces the archetype picker at creation
  created_at   timestamptz not null default now(),
  unique (user_id)
);
-- For installs created before these columns existed.
alter table public.parties add column if not exists abbreviation text;
alter table public.parties add column if not exists seats int not null default 0;
alter table public.parties add column if not exists popularity numeric not null default 0;
alter table public.parties alter column popularity type numeric using popularity::numeric; -- widen int → numeric for fractional support
alter table public.parties add column if not exists pop_floor numeric not null default 0;
alter table public.parties alter column pop_floor type numeric using pop_floor::numeric; -- widen int → numeric for fractional floor
alter table public.parties add column if not exists pop_ceiling numeric not null default 100;
alter table public.parties alter column pop_ceiling type numeric using pop_ceiling::numeric; -- widen int → numeric for fractional ceiling
alter table public.parties alter column pop_ceiling set default 100;   -- reach ceiling retired (popularity floats 0..100)
alter table public.parties add column if not exists funds bigint not null default 0;
alter table public.parties add column if not exists in_government boolean not null default false;
-- Influence was formerly `actions_remaining` (Action Points). Rename the column IN PLACE on any
-- database that still carries the old name, so existing balances migrate rather than reset. Fresh
-- installs already have `influence` from the create table above. Idempotent: skipped once renamed,
-- and guarded so it never clashes with a manually-added `influence` column.
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'parties' and column_name = 'actions_remaining')
     and not exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'parties' and column_name = 'influence')
  then
    alter table public.parties rename column actions_remaining to influence;
  end if;
end $$;
alter table public.parties add column if not exists influence int not null default 12;
-- A new party starts with 12 Influence and banks upward to 100. The add-column above is a no-op on
-- an existing DB (it never updates the default), so set it explicitly — otherwise a freshly founded
-- party falls back to the stale legacy default the column was first created with.
alter table public.parties alter column influence set default 12;
-- Engagement heartbeat for the inactivity metric: wall-clock of the player's last
-- meaningful action. Stamped by _lock_party() (schema/40) on every action/vote/adoption.
-- Defaults to now() so existing + new parties start active. Read by the admin inactivity
-- review (schema/97) and the in-game dormancy warning.
alter table public.parties add column if not exists last_active_at timestamptz not null default now();
-- Set on every non-ruling party when a one-party state returns to multiparty (schema/98):
-- it marks a faction that may relaunch itself as a full party (rename/re-abbreviate/
-- redescribe via /party-creation). It STAYS set until the player relaunches — the choice
-- never expires; ignore it and you simply remain a faction of the former ruling party.
-- Game-controlled (not in the client write grants); cleared only by party_relaunch().
alter table public.parties add column if not exists awaiting_relaunch boolean not null default false;
-- Player-set branding: a crest colour (hex) and an uploaded logo (Storage public
-- URL). Both nullable — null colour falls back to the archetype colour, null logo
-- shows the abbreviation. Cosmetic, so they're in the client write-scope below.
alter table public.parties add column if not exists color text;
alter table public.parties add column if not exists logo_url text;
-- Founding identity statement (≤360 chars), set in place of the archetype picker.
alter table public.parties add column if not exists description text;
alter table public.parties drop constraint if exists parties_description_len;
alter table public.parties add constraint parties_description_len check (char_length(coalesce(description, '')) <= 360);
-- Archetype is no longer chosen at creation; relax the NOT NULL for new parties.
alter table public.parties alter column archetype drop not null;

-- One party per player. The `unique (user_id)` above only takes on a FRESH create table — on any
-- pre-existing parties table `create table if not exists` skips it — so it must ALSO exist as its own
-- idempotent index, or the signup upsert's ON CONFLICT (user_id) has no constraint to match and fails
-- on every attempt (mislabeled client-side as "name taken"). This is that idempotent guard.
create unique index if not exists parties_user_id_uniq on public.parties (user_id);

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
-- pop_ceiling, funds, in_government — are GAME-CONTROLLED, so they
-- are left out of the client's insert/update privileges entirely: a crafted request can no
-- longer set e.g. popularity = 100. Only the identity fields the founding flow
-- writes are granted (user_id is included so the upsert's DO UPDATE works; the
-- WITH CHECK above keeps it pinned to the caller). When standings start changing
-- server-side, do it via a service-role path (which bypasses these grants).
revoke insert, update on public.parties from authenticated;
grant insert (user_id, nation_id, name, abbreviation, description, color) on public.parties to authenticated;
grant update (user_id, nation_id, name, abbreviation, description, color, logo_url) on public.parties to authenticated;

-- Archetype crowding penalty — retired. Party popularity no longer has a reach ceiling or floor
-- (it floats freely in 0..100), so crowding no longer trims a cap. Kept as a 0-returning stub so
-- any lingering caller compiles; nothing consults it now.
create or replace function public._archetype_ceiling_penalty(p_nation text, p_archetype text)
returns numeric language sql immutable as $$ select 0::numeric $$;
-- A party's EFFECTIVE popularity ceiling. The per-party reach ceiling / floor / crowding system was
-- removed — popularity now moves in full and is bounded only by the natural 0..100 range — so the
-- effective ceiling is simply 100. Kept (with its old signature) because many raise actions call it
-- as `least(popularity + delta, _effective_ceiling(...))`; returning 100 makes those clamp at 100.
create or replace function public._effective_ceiling(p_nation text, p_archetype text, p_ceiling numeric, p_floor numeric)
returns numeric language sql immutable as $$ select 100::numeric $$;
