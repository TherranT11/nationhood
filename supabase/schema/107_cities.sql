-- ===========================================================================
-- 107 · Cities — a per-nation roster of named cities (admin-authored).
-- Depends on: 10 (nations), is_admin() (10). Run after 106.
--
-- A city is flavour: a name, an optional share of the nation's population, and a
-- description. Shown on the public Nation page; authored in adminsetup. No mechanical
-- effect — nothing in the tick reads these.
--
-- The CAPITAL is NOT stored here — there is ONE source for it: the 'capital_name'
-- declaration (the player-settable name slot, schema/80). The Nation page and the
-- admin roster mark whichever city's name matches that declared capital; the cities
-- table never carries its own capital flag (which would let the two diverge).
-- ===========================================================================

create table if not exists public.cities (
  id          uuid primary key default gen_random_uuid(),
  nation_id   text not null references public.nations (id) on delete cascade,
  name        text not null,
  pop_pct     numeric,                       -- share of the nation's population (0–100); null = unset
  description text,
  created_at  timestamptz not null default now()
);
create index if not exists cities_nation_idx on public.cities (nation_id);
-- Drop the early capital flag if a prior apply created it: the capital is derived from the
-- 'capital_name' declaration now (one source), not stored per city.
alter table public.cities drop column if exists is_capital;

-- RLS: world-readable (cities show on the public Nation page); admin writes only —
-- mirrors the declarations table. Players never write cities from the client.
alter table public.cities enable row level security;
drop policy if exists "cities_select_all"  on public.cities;
create policy "cities_select_all"  on public.cities for select using (true);
drop policy if exists "cities_insert_admin" on public.cities;
create policy "cities_insert_admin" on public.cities for insert with check (public.is_admin());
drop policy if exists "cities_update_admin" on public.cities;
create policy "cities_update_admin" on public.cities for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "cities_delete_admin" on public.cities;
create policy "cities_delete_admin" on public.cities for delete using (public.is_admin());

notify pgrst, 'reload schema';
