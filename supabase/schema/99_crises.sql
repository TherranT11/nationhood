-- 99 · Crises (admin-authored)
-- World-readable, admin-only writes via is_admin() — the same pattern as policies
-- and convictions. The whole crisis is one JSONB definition per row: the canonical
-- object the admin Crisis Builder edits. A crisis fires when ALL its triggers are
-- true, then climbs a meter through five stages; management actions push it back
-- down, and reaching the terminal stage applies its effect.
--
--   definition = {
--     name, desc,
--     triggers: [ { target, op, value } ... ],              -- all must be true to fire
--     stages: [ stage1, stage2, stage3, stage4, stage5 ]    -- exactly five
--   }
--   stage 1-4 = { name, desc, growth (1 | 2 | 'd3'), at (escalation points),
--                 actions: [ action ... ] }
--   action (minister) = { type:'minister', decision, ministry, cause, mech ('roll'|'direct'),
--                         direct:[eff], stat, needed, success:[eff], failure:[eff],
--                         eventSuccess, eventFail }
--   action (law)      = { type:'law', lawName, lawEffect:[eff] }
--   stage 5 (terminal) = { descReached, reached:[eff], resolution ('persistent'|'ends') }
--   eff = { t (target), v (value) }   -- target e.g. 'Crisis Meter', 'Order', 'Budget'

create table if not exists public.crises (
  id         uuid primary key default gen_random_uuid(),
  definition jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.crises enable row level security;

drop policy if exists "crises_select_all"   on public.crises;
create policy "crises_select_all"   on public.crises for select using (true);
drop policy if exists "crises_insert_admin" on public.crises;
create policy "crises_insert_admin" on public.crises for insert with check (public.is_admin());
drop policy if exists "crises_update_admin" on public.crises;
create policy "crises_update_admin" on public.crises for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "crises_delete_admin" on public.crises;
create policy "crises_delete_admin" on public.crises for delete using (public.is_admin());
