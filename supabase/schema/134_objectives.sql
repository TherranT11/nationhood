-- ===========================================================================
-- 134 · National Objectives (admin-authored)
-- World-readable, admin-only writes via is_admin() — the same pattern as crises (schema/99),
-- policies and convictions. One JSONB definition per row: the canonical object the admin
-- Objectives Builder (adminsetup) edits. A national objective is a TIMED GOAL — a nation is
-- given `ticks` turns to satisfy every condition, and completing it pays out the rewards.
--
-- THIS SLICE STORES THE AUTHORED DEFINITIONS ONLY. Assigning objectives to nations, scoring
-- them each tick (some conditions need a baseline snapshot — "increase X by Y"), and paying out
-- rewards is a later runtime slice. A few authored condition/reward types also wait on systems
-- that don't exist yet: Relations between nations and FDI tokens have no data model today, so
-- they're authorable now but won't be evaluable until those systems land.
--
--   definition = {
--     name, desc,
--     ticks: int,                          -- turns the nation has to complete it
--     conditions: [ condition ... ],       -- ALL must hold for the objective to complete
--     rewards:    [ reward ... ]            -- applied once on completion
--   }
--   condition = { kind, ...params }   -- kinds authored by the Objectives Builder, e.g.
--       stat_up/stat_down {stat, amount} · prod_up {resource, amount} · budget {amount}
--       debt_down {pct} · fdi {count} · trade {count} · mil_dom {continent} · gdp_up {pct}
--       allies {count, continent} · units {unit, count} · relations {nation, value}
--   reward    = { kind, ...params }   -- popularity/confidence/budget/debt {amount} ·
--       onhand {resource, amount} · relations {nation, amount} · stat {stat, amount}
-- ===========================================================================

create table if not exists public.objectives (
  id         uuid primary key default gen_random_uuid(),
  definition jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.objectives enable row level security;

drop policy if exists "objectives_select_all"   on public.objectives;
create policy "objectives_select_all"   on public.objectives for select using (true);
drop policy if exists "objectives_insert_admin" on public.objectives;
create policy "objectives_insert_admin" on public.objectives for insert with check (public.is_admin());
drop policy if exists "objectives_update_admin" on public.objectives;
create policy "objectives_update_admin" on public.objectives for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "objectives_delete_admin" on public.objectives;
create policy "objectives_delete_admin" on public.objectives for delete using (public.is_admin());

notify pgrst, 'reload schema';
