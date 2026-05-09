-- ════════════════════════════════════════════════════════════════
-- Aviation Manufacturing — Phase A: hero-stat columns on factions.
--
-- The 5th corporation sector lands in waves:
--   A. (this) Hero-stat columns: production_capacity, quality_control,
--      innovation. INT 1-10 scale; non-aviation corps get 0.
--   B. corp-setup.html sector picker entry (alpha-code 'Airways1').
--   C. corp-nation-select.html founding flow seeds 1/3/1 +
--      Light Industrial Facility row in corp_properties.
--   D. aviation-operations.html UI scaffold reading these stats.
--   E. Topbar / sector→ops-page wiring.
--   F. (later) Designs, R&D, Orders mechanics.
--
-- Buildings re-use the existing corp_properties table —
-- 'light_industrial_facility' joins 'national_hq' / 'regional_hq' /
-- 'airline_terminal' as a recognized type. The maintenance loop,
-- valuation, expansion display, and bankruptcy paths already read
-- corp_properties; reusing it means no duplicated infrastructure.
--
-- CHECK (col BETWEEN 0 AND 10) accommodates the default-0 placeholder
-- for non-aviation corps AND the 1-10 valid range that aviation
-- manufacturing uses. Founding flow in Phase C seeds 1/3/1.
-- ════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE factions
    ADD COLUMN IF NOT EXISTS corp_production_capacity INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS corp_quality_control     INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS corp_innovation          INT NOT NULL DEFAULT 0;

ALTER TABLE factions DROP CONSTRAINT IF EXISTS factions_aviation_stats_range;
ALTER TABLE factions ADD CONSTRAINT factions_aviation_stats_range CHECK (
    corp_production_capacity BETWEEN 0 AND 10
    AND corp_quality_control  BETWEEN 0 AND 10
    AND corp_innovation       BETWEEN 0 AND 10
) NOT VALID;

COMMENT ON COLUMN factions.corp_production_capacity IS
    'Aviation Manufacturing only. 1-10 integer. Drives how many aircraft the corp can build per tick. Founding state = 1. Non-aviation corps remain at 0.';
COMMENT ON COLUMN factions.corp_quality_control IS
    'Aviation Manufacturing only. 1-10 integer. The corp''s standing with aviation safety regulators, airworthiness authorities, and international certification bodies (FAA / EASA / ICAO equivalents). High Quality Control means aircraft are trusted, approved for sale in major markets, and can fly anywhere. Low Quality Control means groundings, blocked sales, recalls, and the nightmare scenario every aviation manufacturer fears: a fatal crash traced back to a design flaw the firm signed off on. Founding state = 3.';
COMMENT ON COLUMN factions.corp_innovation IS
    'Aviation Manufacturing only. 1-10 integer. Design throughput. Higher Innovation accelerates R&D, unlocks more advanced airframe blueprints, and lets the firm push the engineering envelope (longer-range, more efficient, novel-class aircraft). Low Innovation traps the firm in derivative designs that compete on price alone. Founding state = 1.';

NOTIFY pgrst, 'reload schema';

COMMIT;
