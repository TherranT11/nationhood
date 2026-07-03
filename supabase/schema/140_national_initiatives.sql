-- 140 · National Initiatives (admin-authored)
-- World-readable, admin-only writes via is_admin() — the same pattern as crises, policies and
-- objectives. The whole initiative is one JSONB definition per row: the canonical object the
-- adminsetup Initiative Builder edits. AUTHORING ONLY for now — a nation actually carrying an
-- initiative out (spend over time → raise a production output), and the player-facing UI, are
-- later runtime slices that will read these rows.
--
--   definition = {
--     name, description,
--     resource,            -- 'Energy' | 'Food' | 'Minerals' | 'Goods' | 'Services' | 'Diplomacy' | 'Military'
--     quantity,            -- + production the finished programme adds
--     cadence,             -- 'one_time' | 'recurring'
--     cost,                -- base $B (before the private/state adjustment)
--     lengthMonths: [min, max],
--     ownership,           -- 'private' | 'state' (null while unset)
--     executors: [corp_id … ],   -- the selected qualifying corporations (empty = direct programme)
--     eligibleNations,     -- '*' for every nation, else [nation_id …]
--     startEvent, finishEvent
--   }
-- Depends on: 10 (nations, is_admin). Run after 10.

create table if not exists public.national_initiatives (
  id         uuid primary key default gen_random_uuid(),
  definition jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.national_initiatives enable row level security;

drop policy if exists "nat_init_select_all"   on public.national_initiatives;
create policy "nat_init_select_all"   on public.national_initiatives for select using (true);
drop policy if exists "nat_init_insert_admin" on public.national_initiatives;
create policy "nat_init_insert_admin" on public.national_initiatives for insert with check (public.is_admin());
drop policy if exists "nat_init_update_admin" on public.national_initiatives;
create policy "nat_init_update_admin" on public.national_initiatives for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "nat_init_delete_admin" on public.national_initiatives;
create policy "nat_init_delete_admin" on public.national_initiatives for delete using (public.is_admin());

notify pgrst, 'reload schema';
