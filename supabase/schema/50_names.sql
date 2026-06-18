-- 50 · Sessau name pool (structure only)
-- Depends on: nothing. Run after 40. The rows are bulk data and live in
-- supabase/seed/sessau_names.sql — run that once after this file.

-- ---------------------------------------------------------------------------
-- Sessau name pool: the source for Sessau-flavoured names (used for generated
-- politicians/characters). One row per name, tagged by kind (male / female first
-- names, surname). Public read; clients never write it. Only the structure lives
-- here; the names are seeded from supabase/seed/sessau_names.sql.
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
