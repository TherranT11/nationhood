-- 150 · Ministry stats (admin-authored per-nation values)
--
-- The Government page's ministry stats (Budget Balance, Growth, Bureaucracy, … Global
-- Warming — the same set as POLICY_STATS in policies.js, and what policy effects target).
-- Stored as a jsonb map { "<Stat Name>": <number> } on the nation, authored in the admin
-- Edit Nation form. A stat absent from the map has no value yet (the UI shows "--").
--
-- Public read / admin write is already covered by the nations RLS (schema/10: world-readable
-- select, is_admin() insert/update), so no new policies are needed here.
alter table public.nations add column if not exists ministry_stats jsonb not null default '{}'::jsonb;

notify pgrst, 'reload schema';
