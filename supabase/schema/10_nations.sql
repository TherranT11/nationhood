-- 10 · Nations — one founded nation per account  (Nationhood: Prophecy & Plague)
-- Idempotent — safe to paste into the Supabase SQL Editor and re-run.
-- Depends on auth.users.
--
-- NOTE: named pp_nations (not "nations") because this Supabase project is reused
-- and already holds a legacy `nations` table from an earlier game with a
-- different schema. Namespacing avoids the collision.

create table if not exists public.pp_nations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null unique references auth.users (id) on delete cascade,
  people     text not null,   -- humans | elves | dwarves | orcs | undead
  side       text not null,   -- good | evil | end  (derived from people)
  realm      text not null,   -- polity name (Realm/Court/Hold/Clan/Dominion of ___)
  house      text not null,   -- lineage name (House/Line/Kin/Blood/Wake of ___)
  capital    text not null,   -- capital city name (chosen by the ruler)
  capital_slot text,          -- id of the map settlement this nation claimed (pp_world_map)
  created_at timestamptz not null default now()
);

-- capital added for tables created before it existed (idempotent): add nullable,
-- backfill, then lock NOT NULL.
alter table public.pp_nations add column if not exists capital text;
update public.pp_nations set capital = coalesce(capital, realm) where capital is null;
alter table public.pp_nations alter column capital set not null;

-- capital_slot: the settlement id on the world map a nation occupies. Founding
-- claims an empty capital of the ruler's people and records its id here. Stays
-- nullable — one map slot per nation, enforced by the partial unique index.
alter table public.pp_nations add column if not exists capital_slot text;
create unique index if not exists pp_nations_capital_slot_uidx
  on public.pp_nations (capital_slot) where capital_slot is not null;

-- Shape guards ---------------------------------------------------------------
alter table public.pp_nations drop constraint if exists pp_nations_people_chk;
alter table public.pp_nations add constraint pp_nations_people_chk
  check (people in ('humans','elves','dwarves','orcs','undead'));

alter table public.pp_nations drop constraint if exists pp_nations_side_chk;
alter table public.pp_nations add constraint pp_nations_side_chk
  check (side in ('good','evil','end'));

alter table public.pp_nations drop constraint if exists pp_nations_realm_len;
alter table public.pp_nations add constraint pp_nations_realm_len check (char_length(realm) between 2 and 20);

alter table public.pp_nations drop constraint if exists pp_nations_house_len;
alter table public.pp_nations add constraint pp_nations_house_len check (char_length(house) between 2 and 20);

alter table public.pp_nations drop constraint if exists pp_nations_capital_len;
alter table public.pp_nations add constraint pp_nations_capital_len check (char_length(capital) between 2 and 20);

-- RLS ------------------------------------------------------------------------
alter table public.pp_nations enable row level security;

-- A ruler reads only their own nation for now. (Broaden to a public read when
-- the shared world map / diplomacy needs to list other realms.)
drop policy if exists "pp_nations_select_own" on public.pp_nations;
create policy "pp_nations_select_own" on public.pp_nations for select using (auth.uid() = user_id);

-- No client INSERT/UPDATE/DELETE policy: a nation is founded only through
-- pp_found_nation() below (security definer), which sets the side server-side.

-- side is derived from people — one source, so a "good" people can never be
-- stored on the "evil" side by a tampered client.
create or replace function public.pp_side_of(_people text)
returns text language sql immutable as $$
  select case _people
    when 'humans'  then 'good'
    when 'elves'   then 'good'
    when 'dwarves' then 'good'
    when 'orcs'    then 'evil'
    when 'undead'  then 'end'
  end;
$$;

-- The world-map settlement `type` a people claims when founding. One source for
-- the people → home-village mapping. Humans and orcs each have a village drawn on
-- the map; elves/dwarves/undead return null, so founding tells those rulers their
-- lands aren't charted yet.
create or replace function public.pp_capital_type_of(_people text)
returns text language sql immutable as $$
  select case _people
    when 'humans' then 'humanVillage'
    when 'orcs'   then 'orcVillage'
    else null                              -- not yet drawn on the world map
  end;
$$;

-- Found the caller's nation. One per account — the UNIQUE user_id raises 23505
-- on a second attempt, which the client turns into a clear "already founded".
--
-- Founding also claims the ruler's place on the map: it grabs the first empty
-- village of their people from the authored world map (pp_world_map) and records
-- its settlement id in capital_slot. The partial unique index on capital_slot
-- guarantees no two nations hold the same slot; a slot taken by a concurrent
-- founding between our SELECT and INSERT just makes us try the next free one.
drop function if exists public.pp_found_nation(text, text, text);   -- replaced by the 4-arg form below
create or replace function public.pp_found_nation(_people text, _realm text, _house text, _capital text)
returns public.pp_nations
language plpgsql security definer set search_path = public as $$
declare
  uid      uuid := auth.uid();
  s        text := pp_side_of(_people);
  cap_type text := pp_capital_type_of(_people);
  slot     text;
  result   public.pp_nations;
begin
  if uid is null then raise exception 'not authenticated'; end if;
  if s   is null then raise exception 'unknown people'; end if;

  -- Fail early and clearly if this account already founded (mirrors the 23505
  -- the client already handles), so the claim loop below never runs twice.
  if exists (select 1 from public.pp_nations where user_id = uid) then
    raise exception 'already founded' using errcode = 'unique_violation';
  end if;

  if cap_type is null then
    raise exception 'No lands have been charted for your people yet.';
  end if;

  -- Claim the first unclaimed village of this people from the world map.
  for slot in
    select st->>'id'
    from public.pp_world_map wm
      cross join lateral jsonb_array_elements(coalesce(wm.data->'settlements', '[]'::jsonb)) st
    where wm.id = 1
      and st->>'type' = cap_type
      and not exists (select 1 from public.pp_nations n where n.capital_slot = st->>'id')
    order by st->>'id'
  loop
    begin
      insert into public.pp_nations (user_id, people, side, realm, house, capital, capital_slot)
      values (uid, _people, s, btrim(_realm), btrim(_house), btrim(_capital), slot)
      returning * into result;
      return result;
    exception when unique_violation then
      -- If our own account just got a nation (concurrent same-user found),
      -- propagate the 23505. Otherwise the slot was taken — try the next.
      if exists (select 1 from public.pp_nations where user_id = uid) then raise; end if;
      continue;
    end;
  end loop;

  raise exception 'No empty village remains for your people — the world is full.';
end;
$$;

grant execute on function public.pp_found_nation(text, text, text, text) to authenticated;
