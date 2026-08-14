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

alter table public.rf_nations enable row level security;

-- Owner-only for now — there's no shared-map/world view built yet for other
-- players to see a nation exists. Once that's built, the select policy will
-- need to open up (at minimum civ_name should become publicly visible);
-- until then, keeping it private is the safer default.
drop policy if exists "Owner can read their nation" on public.rf_nations;
create policy "Owner can read their nation"
  on public.rf_nations for select
  using (auth.uid() = user_id);

drop policy if exists "Owner can found their nation" on public.rf_nations;
create policy "Owner can found their nation"
  on public.rf_nations for insert
  with check (auth.uid() = user_id);

-- No update/delete policy yet: nothing in the game can rename a civilization
-- or decline it (that's the whole Decline mechanic, not built) — so there is
-- nothing for a client to legitimately change here yet.
