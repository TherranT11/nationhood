-- ════════════════════════════════════════════════════════════════════
-- Movement parties: Deputy / Whip ages
-- ════════════════════════════════════════════════════════════════════
-- 20270376 added deputy_first_name / deputy_last_name / whip_first_name /
-- whip_last_name. Leader has carried leader_age since the original
-- factions schema. Mirrors that on the two new roles so party.html can
-- render "Deputy Leader · age N" / "Party Whip · age N" alongside the
-- existing "Party Leader · age 55" line.
--
-- Same backfill scope as 20270376 — HRF only. Other movement_party rows
-- (none seeded today) can have ages supplied at Add Party time.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE factions ADD COLUMN IF NOT EXISTS deputy_age int;
ALTER TABLE factions ADD COLUMN IF NOT EXISTS whip_age   int;

COMMENT ON COLUMN factions.deputy_age IS
    'Movement-party Deputy Leader age. Nullable. Mirrors leader_age shape.';
COMMENT ON COLUMN factions.whip_age IS
    'Movement-party Party Whip age. Nullable. Mirrors leader_age shape.';

-- HRF backfill: ages picked to sit just below Leader Mujar Adin (55).
-- Deputy older than Whip is the conventional party hierarchy.
UPDATE factions
   SET deputy_age = COALESCE(deputy_age, 49),
       whip_age   = COALESCE(whip_age,   44)
 WHERE faction_type = 'movement_party'
   AND faction_name = 'Hajjaran Royal Front';

COMMIT;

-- ── ROLLBACK ──
-- BEGIN;
-- ALTER TABLE factions DROP COLUMN IF EXISTS whip_age;
-- ALTER TABLE factions DROP COLUMN IF EXISTS deputy_age;
-- COMMIT;
