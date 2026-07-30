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
  created_at  timestamptz not null default now()
);

-- Birthplace added for tables created before it existed (idempotent): add it
-- nullable, backfill any pre-existing rows, then enforce NOT NULL so the column
-- is guaranteed on every path (fresh create above, or an older table upgraded).
alter table public.characters add column if not exists birthplace text;
update public.characters set birthplace = 'rome' where birthplace is null;
alter table public.characters alter column birthplace set not null;

alter table public.characters
  drop constraint if exists characters_birthplace_len;
alter table public.characters
  add constraint characters_birthplace_len
  check (char_length(birthplace) between 1 and 40);

-- One gens per account: user_id is UNIQUE above. Shape guards so a stray client
-- can't write nonsense — names bounded, exactly four ranked priorities.
alter table public.characters
  drop constraint if exists characters_name_len;
alter table public.characters
  add constraint characters_name_len
  check (char_length(praenomen) between 1 and 20 and char_length(nomen) between 1 and 20);

-- cardinality() returns 0 for an empty array (array_length returns NULL, and a
-- NULL check would *pass* — letting {} slip through). This rejects {} and NULL alike.
alter table public.characters
  drop constraint if exists characters_priorities_four;
alter table public.characters
  add constraint characters_priorities_four
  check (cardinality(priorities) = 4);

-- Lock it down: nothing readable/writable until a policy allows it.
alter table public.characters enable row level security;

-- A citizen reads only their own character.
drop policy if exists "characters_select_own" on public.characters;
create policy "characters_select_own"
  on public.characters for select
  using (auth.uid() = user_id);

-- A citizen founds their own gens. Only once — the UNIQUE user_id enforces it,
-- so a second insert fails with 23505 (the client turns that into a clear notice).
drop policy if exists "characters_insert_own" on public.characters;
create policy "characters_insert_own"
  on public.characters for insert
  with check (auth.uid() = user_id);

-- No update or delete policy on purpose: a founded gens is locked.
