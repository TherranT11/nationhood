-- ════════════════════════════════════════════════════════════════════
-- 20270905 — Cull the army-unit / war-combat backend (Phase C)
--
-- The military faction was retired (UI removed in Phase B; the army
-- unit/supply/combat tick sweeps + js/game/military-units.js removed
-- from advance-tick). This reclaims the schema:
--
--   • Drop the army-unit tables (army_units, armies, brigade_equipment,
--     unit_dispatch_events) — read by nothing live after the cull
--     (budget.js's unit-maintenance now returns 0; no edge/tick or
--     client query touches them).
--   • Drop the army-unit creation RPCs (create_unit, create_army,
--     resign_military_faction) — their only callers were the deleted
--     army pages.
--   • Drop the factions.army_* stat + officer columns — no live reader.
--   • Abandon existing faction_type='military' rows (no live path
--     creates them; abandon rather than hard-delete to keep chat/event
--     referential history intact).
--
-- DELIBERATELY KEPT:
--   • war_fronts / war_sectors + generate_war_fronts / upsert_war_sector
--     — still read by js/game/diplomacy-constants.js (the diplomacy
--     engine). They go in Phase D with that surface.
--   • The 'defense' major ministry career (Deputy Minister / Permanent
--     Secretary of Defense) + allocate_defense_funds (degrades to a
--     harmless no-op with no army faction to fund) + ministries.
--   • js/game/military-loyalty.js (the Military Loyalty Act *policy* —
--     Defense-Minister↔HoG sync; politician logic, not army units).
--   • The Combined Arms School completion sweep (reads corp_contracts,
--     not army_units) — its own follow-up.
--
-- IF EXISTS / CASCADE throughout so this applies cleanly regardless of
-- which tables/columns a given database carries.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Army-unit tables (dependents first; CASCADE clears FKs) ────
DROP TABLE IF EXISTS public.brigade_equipment   CASCADE;
DROP TABLE IF EXISTS public.unit_dispatch_events CASCADE;
DROP TABLE IF EXISTS public.army_units           CASCADE;
DROP TABLE IF EXISTS public.armies               CASCADE;

-- ── 2. Army-unit creation RPCs (callers removed in Phase B) ───────
DROP FUNCTION IF EXISTS public.create_unit(uuid, text, jsonb);
DROP FUNCTION IF EXISTS public.create_army(uuid, text, text, jsonb);
DROP FUNCTION IF EXISTS public.resign_military_faction(uuid);

-- ── 3. Army stat + officer columns on factions (no live reader) ───
ALTER TABLE public.factions
    DROP COLUMN IF EXISTS army_manpower,
    DROP COLUMN IF EXISTS army_training,
    DROP COLUMN IF EXISTS army_equipment,
    DROP COLUMN IF EXISTS army_armor,
    DROP COLUMN IF EXISTS army_artillery,
    DROP COLUMN IF EXISTS army_logistics,
    DROP COLUMN IF EXISTS army_special_forces,
    DROP COLUMN IF EXISTS army_supplies,
    DROP COLUMN IF EXISTS army_id,
    DROP COLUMN IF EXISTS army_qm_first_name,
    DROP COLUMN IF EXISTS army_qm_last_name,
    DROP COLUMN IF EXISTS army_qm_age,
    DROP COLUMN IF EXISTS army_intel_first_name,
    DROP COLUMN IF EXISTS army_intel_last_name,
    DROP COLUMN IF EXISTS army_intel_age,
    DROP COLUMN IF EXISTS army_cmd_first_name,
    DROP COLUMN IF EXISTS army_cmd_last_name,
    DROP COLUMN IF EXISTS army_cmd_age;

-- ── 4. Retire existing military factions ──────────────────────────
UPDATE public.factions
   SET abandoned_at = now()
 WHERE faction_type = 'military'
   AND abandoned_at IS NULL;

NOTIFY pgrst, 'reload schema';

COMMIT;
