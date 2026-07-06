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
--     quantity,            -- + production the programme adds once it finishes building
--     cadence,             -- 'one_time' | 'recurring'
--     budgetPerYear,       -- $B/yr subtracted from the nation's Budget Balance the WHOLE time it runs (a standing cost, not upfront)
--     influence,           -- Influence the Minister spends upfront to enact it
--     lengthMonths: [min, max],  -- build-up before the production increase lands; the $B/yr cost runs from enactment
--     sectors: [sector …], -- which sector's corps can carry it out; the enacting Minister picks private (bids) or state (its own SO firm in one)
--     joint,               -- null, or { partner: nation_id, quantity, target } — a partner nation collaborates and receives the benefit
--     eligibleNations,     -- '*' for every nation, else [nation_id …]
--     startEvent, finishEvent
--   }
-- A running initiative is PERMANENT until the Minister deactivates it (schema/141): the $B/yr cost
-- applies the entire time, the production increase persists, and deactivating reverses both.
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
