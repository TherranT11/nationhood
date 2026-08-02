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
  created_at timestamptz not null default now()
);

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

-- Found the caller's nation. One per account — the UNIQUE user_id raises 23505
-- on a second attempt, which the client turns into a clear "already founded".
create or replace function public.pp_found_nation(_people text, _realm text, _house text)
returns public.pp_nations
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  s   text := pp_side_of(_people);
  result public.pp_nations;
begin
  if uid is null then raise exception 'not authenticated'; end if;
  if s is null then raise exception 'unknown people'; end if;
  insert into public.pp_nations (user_id, people, side, realm, house)
  values (uid, _people, s, btrim(_realm), btrim(_house))
  returning * into result;
  return result;
end;
$$;

grant execute on function public.pp_found_nation(text, text, text) to authenticated;
