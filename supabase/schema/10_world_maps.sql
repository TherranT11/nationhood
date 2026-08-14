-- 10 · World maps — persisted maps from the World Map Editor
-- (Nationhood: Rise and Fall). Idempotent — safe to paste into the Supabase
-- SQL Editor and re-run.
--
-- NOTE: named rf_world_maps (not "world_maps") because this Supabase project
-- is reused across games and may already hold tables from earlier ones.
-- Namespacing avoids collisions with anything pre-existing.

create extension if not exists pgcrypto;

create table if not exists public.rf_world_maps (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  cols         integer not null,
  rows         integer not null,
  layout       text not null default 'pointy-odd-r',
  terrain_keys text[] not null,
  terrain      integer[] not null,
  borders      text[] not null default '{}',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- goods_keys/goods: the optional per-hex Goods layer added alongside terrain.
-- Kept nullable-safe (default '{}') so re-running this file against a table
-- created before the Goods panel existed just adds the columns in place.
alter table public.rf_world_maps add column if not exists goods_keys text[] not null default '{}';
alter table public.rf_world_maps add column if not exists goods integer[] not null default '{}';

-- One saved row per map name; the editor's Save button upserts on this.
create unique index if not exists rf_world_maps_name_key on public.rf_world_maps (name);

alter table public.rf_world_maps enable row level security;

-- No auth system exists yet in this project, so the editor has no login gate
-- to check against — read/write here is open to anyone holding the anon key,
-- same as the page itself being unauthenticated. Tighten these policies (e.g.
-- restrict writes to a specific authenticated role) before /maptool is
-- exposed beyond trusted admins.
drop policy if exists "Anyone can read world maps" on public.rf_world_maps;
create policy "Anyone can read world maps"
  on public.rf_world_maps for select
  using (true);

drop policy if exists "Anyone can save world maps" on public.rf_world_maps;
create policy "Anyone can save world maps"
  on public.rf_world_maps for insert
  with check (true);

drop policy if exists "Anyone can update world maps" on public.rf_world_maps;
create policy "Anyone can update world maps"
  on public.rf_world_maps for update
  using (true)
  with check (true);
