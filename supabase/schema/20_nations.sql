-- 20 · Nations — one active civilization per account (Nationhood: Rise and
-- Fall). Idempotent — safe to paste into the Supabase SQL Editor and re-run.
-- Depends on auth.users (built in) and, conceptually, rf_profiles from
-- schema/00_auth.sql — run that first.
--
-- NOTE: named rf_nations (not "nations") because this Supabase project is
-- reused across games and may already hold a nations table from an earlier
-- one with a different shape. Namespacing avoids colliding with it.

create table if not exists public.rf_nations (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  civ_name      text not null,
  capital_name  text not null,
  -- Only the traits the /found form currently exposes as selectable are
  -- allowed here — this is the real trust boundary. The form disables the
  -- other seven tiles client-side, but disabled attributes don't stop a
  -- direct REST call, so the constraint is what actually enforces it.
  -- Widen this list (and the form) together when a trait is ready to ship.
  trait         text not null check (trait in ('mercantile', 'philosophical', 'warlike')),
  founded_at    timestamptz not null default now()
);

-- One active civilization per account; /found's insert relies on this
-- constraint to fail cleanly if someone founds twice in a race (e.g. two
-- tabs), rather than silently allowing a second nation.
create unique index if not exists rf_nations_user_id_key on public.rf_nations (user_id);

-- Where the capital sits on the current rf_world_maps sheet, chosen on
-- /found/seat. Nullable at the schema level so this migration can't fail
-- against any pre-existing rows; every insert going forward always supplies
-- both (the client validates it can't submit without a chosen hex).
alter table public.rf_nations add column if not exists hex_col integer;
alter table public.rf_nations add column if not exists hex_row integer;

alter table public.rf_nations drop constraint if exists rf_nations_hex_col_check;
alter table public.rf_nations add constraint rf_nations_hex_col_check check (hex_col is null or hex_col >= 0);
alter table public.rf_nations drop constraint if exists rf_nations_hex_row_check;
alter table public.rf_nations add constraint rf_nations_hex_row_check check (hex_row is null or hex_row >= 0);

-- Two capitals can't occupy the exact same hex. This is the one collision
-- rule enforced at the database level — it's cheap (a plain unique index,
-- no trigger) and closes the worst case outright.
--
-- KNOWN LIMITATION: the "stay N hexes clear of any capital" rule (MIN_GAP in
-- /found/seat) is only checked client-side against whatever snapshot of
-- rf_nations was loaded when the map opened. Two players founding nearby
-- hexes at nearly the same moment can both pass that check and both insert
-- successfully, landing closer together than the game intends. Closing that
-- fully needs a trigger computing hex distance against existing rows, which
-- I'm not adding without asking first — this file doesn't do anything
-- automatically beyond the constraints below.
create unique index if not exists rf_nations_hex_key on public.rf_nations (hex_col, hex_row);

alter table public.rf_nations enable row level security;

-- Public within the game: any signed-in player can see every founded
-- nation's name, capital, trait, and hex — that's what "shared world map"
-- means for /found/seat (checking where capitals already are) and for
-- other players eventually seeing who they're next to. Not open to the
-- anon key: you must at least have an account to see the world.
drop policy if exists "Owner can read their nation" on public.rf_nations;
drop policy if exists "Signed-in players can read nations" on public.rf_nations;
create policy "Signed-in players can read nations"
  on public.rf_nations for select
  to authenticated
  using (true);

drop policy if exists "Owner can found their nation" on public.rf_nations;
create policy "Owner can found their nation"
  on public.rf_nations for insert
  with check (auth.uid() = user_id);

-- No update/delete policy yet: nothing in the game can rename a civilization
-- or decline it (that's the whole Decline mechanic, not built) — so there is
-- nothing for a client to legitimately change here yet.
