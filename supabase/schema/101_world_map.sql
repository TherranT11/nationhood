-- 101 · World map (standalone hex map).
-- A field of hexes in axial (q, r) coordinates. Each row is a LAND hex (or a sea hex that
-- carries data); a hex with no row is open sea. Hexes carry their own name / population /
-- resources for the MAP's sake — they are standalone and do NOT feed nation totals (the
-- nation's population/production stay on the nations table). Run after 10 (nations).
--
-- Authored in adminsetup (paint land/sea, assign a nation, set name/pop/resources). Public
-- read (the map is public); admin-only writes — same is_admin() pattern as the other admin
-- tables. Run after 10 (nations).

create table if not exists public.world_hexes (
  q          int  not null,
  r          int  not null,
  terrain    text not null default 'sea',           -- 'land' | 'sea'
  nation_id  text references public.nations (id) on delete set null,
  name       text,
  population numeric,
  resources  jsonb not null default '{}'::jsonb,     -- { energy, food, minerals, goods, services, military, … } any amounts
  continent  text,                                    -- separate layer: which continent this hex belongs to
  primary key (q, r)
);
-- Continent layer (a hex belongs to a nation AND a continent, independently). Added here so
-- an existing world_hexes table picks it up.
alter table public.world_hexes add column if not exists continent text;

alter table public.world_hexes enable row level security;
-- World-readable (the board is public).
drop policy if exists "hex_select_all" on public.world_hexes;
create policy "hex_select_all" on public.world_hexes for select using (true);
-- Admin-only writes (mirrors declarations / policies / modifiers).
drop policy if exists "hex_insert_admin" on public.world_hexes;
create policy "hex_insert_admin" on public.world_hexes for insert with check (public.is_admin());
drop policy if exists "hex_update_admin" on public.world_hexes;
create policy "hex_update_admin" on public.world_hexes for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "hex_delete_admin" on public.world_hexes;
create policy "hex_delete_admin" on public.world_hexes for delete using (public.is_admin());

notify pgrst, 'reload schema';
