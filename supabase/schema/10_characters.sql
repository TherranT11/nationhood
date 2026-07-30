-- 10 · Characters — one gens per account  (ROME: Rise and Fall)
-- Idempotent — safe to paste into the Supabase SQL Editor and re-run.
-- Depends on auth.users.

create table if not exists public.characters (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null unique references auth.users (id) on delete cascade,
  praenomen   text not null,
  nomen       text not null,
  priorities  text[] not null,   -- ranked keys, [0] = 1st: e.g. {influence,wealth,family,strategy}
  birthplace  text not null,     -- region key: rome | latium | etruria | campania
  denarii     int  not null default 0,   -- gens stats, seeded from the ranking at founding
  influence   int  not null default 0,
  strategy    int  not null default 0,
  location    text not null default 'rome',
  created_at  timestamptz not null default now()
);

-- Columns added for tables created before they existed (idempotent). ---------
alter table public.characters add column if not exists birthplace text;
alter table public.characters add column if not exists denarii   int;
alter table public.characters add column if not exists influence int;
alter table public.characters add column if not exists strategy  int;
alter table public.characters add column if not exists location  text;

-- One source for the founding stat formula: a priority's rank (its position in
-- the array, 1..4) maps to a value. Used by found_gens() AND the backfill below,
-- so the numbers live in exactly one place.
create or replace function public.gens_stat(priorities text[], which text)
returns int language sql immutable as $$
  select case which
    when 'denarii'   then (array[12, 9, 5, 3])[array_position(priorities, 'wealth')]
    when 'influence' then (array[10, 7, 4, 2])[array_position(priorities, 'influence')]
    when 'strategy'  then (array[5,  4, 1, 0])[array_position(priorities, 'strategy')]
  end;
$$;

-- Backfill rows created before these columns, then enforce NOT NULL. ---------
update public.characters set
  birthplace = coalesce(birthplace, 'rome'),
  denarii    = coalesce(denarii,   gens_stat(priorities, 'denarii')),
  influence  = coalesce(influence, gens_stat(priorities, 'influence')),
  strategy   = coalesce(strategy,  gens_stat(priorities, 'strategy')),
  location   = coalesce(location,  'rome')
where birthplace is null or denarii is null or influence is null
   or strategy is null or location is null;

alter table public.characters alter column birthplace set not null;
alter table public.characters alter column denarii   set not null;
alter table public.characters alter column influence set not null;
alter table public.characters alter column strategy  set not null;
alter table public.characters alter column location  set not null;
alter table public.characters alter column location  set default 'rome';

-- Shape guards ---------------------------------------------------------------
alter table public.characters drop constraint if exists characters_name_len;
alter table public.characters add constraint characters_name_len
  check (char_length(praenomen) between 1 and 20 and char_length(nomen) between 1 and 20);

alter table public.characters drop constraint if exists characters_priorities_four;
alter table public.characters add constraint characters_priorities_four
  check (cardinality(priorities) = 4);

alter table public.characters drop constraint if exists characters_birthplace_len;
alter table public.characters add constraint characters_birthplace_len
  check (char_length(birthplace) between 1 and 40);

-- RLS ------------------------------------------------------------------------
alter table public.characters enable row level security;

-- A citizen reads only their own character.
drop policy if exists "characters_select_own" on public.characters;
create policy "characters_select_own" on public.characters for select
  using (auth.uid() = user_id);

-- No client INSERT/UPDATE/DELETE policy on purpose: a gens is founded only
-- through found_gens() below (security definer), which seeds the game-controlled
-- stats server-side so a client can't forge them. A founded gens is then locked.
drop policy if exists "characters_insert_own" on public.characters;

-- Found the caller's gens, seeding stats from the priority ranking. One gens per
-- account — the UNIQUE user_id raises 23505 on a second call, which the client
-- turns into a clear "already founded" notice.
create or replace function public.found_gens(
  _praenomen text, _nomen text, _priorities text[], _birthplace text
) returns public.characters
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  result public.characters;
begin
  if uid is null then raise exception 'not authenticated'; end if;
  insert into public.characters
    (user_id, praenomen, nomen, priorities, birthplace, location, denarii, influence, strategy)
  values
    (uid, _praenomen, _nomen, _priorities, _birthplace, 'rome',
     gens_stat(_priorities, 'denarii'),
     gens_stat(_priorities, 'influence'),
     gens_stat(_priorities, 'strategy'))
  returning * into result;
  return result;
end;
$$;

grant execute on function public.found_gens(text, text, text[], text) to authenticated;
