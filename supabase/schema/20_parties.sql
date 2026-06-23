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
  pop_floor     numeric not null default 0,     -- support floor: the base attacks can't push below, % (fractional — Organize moves it in tenths)
  pop_ceiling   numeric not null default 5,     -- support ceiling: current reach / cap on popularity, % (fractional — Ad Blitz nudges it)
  funds         bigint  not null default 0,      -- party treasury, in the nation's currency
  in_government boolean not null default false, -- governing vs in opposition
  actions_remaining int not null default 12,    -- party actions left this turn; reset to 12 each tick by advance_tick(). Standing actions cost 4 (schema/40 _standing_cost), the rest cost 1.
  conviction    int     not null default 1,     -- Manifesto currency: earned over time, spent on planks. Every new party starts with 1.
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
alter table public.parties add column if not exists pop_ceiling numeric not null default 5;
alter table public.parties alter column pop_ceiling type numeric using pop_ceiling::numeric; -- widen int → numeric for fractional ceiling
alter table public.parties add column if not exists funds bigint not null default 0;
alter table public.parties add column if not exists in_government boolean not null default false;
alter table public.parties add column if not exists actions_remaining int not null default 12;
alter table public.parties add column if not exists conviction int not null default 0;
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
-- New parties begin with one conviction point (existing rows keep what they have).
alter table public.parties alter column conviction set default 1;

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
-- pop_ceiling, funds, in_government, conviction — are GAME-CONTROLLED, so they
-- are left out of the client's insert/update privileges entirely: a crafted request can no
-- longer set e.g. popularity = 100. Only the identity fields the founding flow
-- writes are granted (user_id is included so the upsert's DO UPDATE works; the
-- WITH CHECK above keeps it pinned to the caller). When standings start changing
-- server-side, do it via a service-role path (which bypasses these grants).
revoke insert, update on public.parties from authenticated;
grant insert (user_id, nation_id, name, abbreviation, description) on public.parties to authenticated;
grant update (user_id, nation_id, name, abbreviation, description, color, logo_url) on public.parties to authenticated;

-- Archetype crowding: a party's popularity ceiling is trimmed by 2 points for every
-- OTHER party in the nation sharing its archetype. ONE source for the gameplay cap
-- (the leader actions in schema/40) and the Party page display (mirrored in JS).
create or replace function public._archetype_ceiling_penalty(p_nation text, p_archetype text)
returns numeric language sql stable as $$
  select 2 * greatest(0, count(*) - 1)::numeric
    from public.parties where nation_id = p_nation and archetype = p_archetype;
$$;
-- A party's EFFECTIVE popularity ceiling: its own ceiling less the crowding penalty,
-- never below its floor. The cap the raise actions actually enforce.
create or replace function public._effective_ceiling(p_nation text, p_archetype text, p_ceiling numeric, p_floor numeric)
returns numeric language sql stable as $$
  select greatest(coalesce(p_floor, 0), p_ceiling - public._archetype_ceiling_penalty(p_nation, p_archetype));
$$;
