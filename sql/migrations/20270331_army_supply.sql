-- ════════════════════════════════════════════════════════════════════
-- ARMY SUPPLY — per-tick supply consumption for armies on a war front
-- ════════════════════════════════════════════════════════════════════
-- When a nation is at war (diplomatic_relations.relation_type='war'), each of
-- its armies assigned to a front sits in a SECTOR and consumes supply every
-- tick. Supply comes from the capital and loses 1 per sector it travels
-- through to reach the army. Consumption:
--   round(manpower / 1000)
--   + 2 per Mechanized brigade, + 3 per Armor, + 1 per Artillery, − 3 per Support
--   + 1 if the army is a Guard formation, − 1 if paramilitary   (floored at 0)
-- Generated = factions.army_supplies × 5; transport cap = army_logistics × 4
-- (both already exist, 0–100). If delivered < needed the army is under-supplied
-- and its faction's army_cohesion drains a few points that tick.
--
-- All of the above runs in the tick (military-units.js processArmySupply); this
-- migration only adds the two columns it reads/writes. Live war-state, no client
-- writes — armies has no client-write policy.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.armies
    ADD COLUMN IF NOT EXISTS current_sector_id UUID REFERENCES war_sectors(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS supply_balance    NUMERIC;

COMMENT ON COLUMN public.armies.current_sector_id IS
    'war_sectors.id this army occupies on its assigned front, or NULL = not yet placed. Set to the capital-adjacent sector when war begins; cleared if the sector is removed.';
COMMENT ON COLUMN public.armies.supply_balance IS
    'Last tick''s supply delivered minus supply needed. Negative = under-supplied (drains army_cohesion). Recomputed every tick by processArmySupply.';

NOTIFY pgrst, 'reload schema';

COMMIT;
