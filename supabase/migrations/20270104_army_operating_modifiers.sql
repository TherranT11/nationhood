-- Army Operating Modifiers — eight 0–100 stats for army factions.
--
-- These are the totality of an army faction's operating-modifier stats;
-- they're rendered on army-dashboard.html and will eventually drive
-- combat resolution and other army-side mechanics. All default to 0 so
-- newly-joined armies start with everything at the floor and have to
-- build them up through actions.
--
-- Stat reference:
--   army_manpower        — active soldiers in ground forces
--   army_training        — skill, discipline, combat readiness
--   army_equipment       — small arms, body armor, vehicles, infantry gear
--   army_armor           — tanks and armored vehicle forces
--   army_artillery       — howitzers, rocket systems, missile batteries
--   army_logistics       — moving, supplying, sustaining the army
--   army_special_forces  — elite units (recon, sabotage, CT)
--   army_supplies        — food, ammunition, sustainment for prolonged combat
--
-- Naming: prefixed `army_` (not `mil_`) because these are ground-forces
-- specific. Navy and air force will have their own stat sets when those
-- branches ship (fleet readiness, sortie generation, etc.) and will get
-- their own `navy_*` / `airforce_*` columns then.
--
-- DEFAULT 0 means existing army faction rows (e.g. the Palvera army) get
-- 0 across the board after this migration — no backfill needed. Non-
-- military faction rows also get 0; the dashboards that don't read these
-- columns are unaffected.

ALTER TABLE factions
  ADD COLUMN IF NOT EXISTS army_manpower       NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS army_training       NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS army_equipment      NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS army_armor          NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS army_artillery      NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS army_logistics      NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS army_special_forces NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS army_supplies       NUMERIC DEFAULT 0;

NOTIFY pgrst, 'reload schema';
