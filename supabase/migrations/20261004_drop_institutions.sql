-- ════════════════════════════════════════════════════════════════
-- Remove the Institutions feature.
--
-- Background: Institution Funding is being fundamentally reworked.
-- Per design directive, all current institution state is being
-- dropped wholesale — the rework will land with a fresh schema.
--
-- Application-side, this migration leaves a clean state:
--   • Stat decay continues at its natural rates. The
--     institution-as-shield logic (which let funded institutions
--     reduce decay speed for related stats) is being removed.
--   • Funding bills as a bill type stay; the institution sliders
--     that were the bills' primary content are being stripped.
--     Sponsoring a funding bill currently has nothing to fund
--     until the rework adds new sliders.
--   • Crisis templates that previously gated on institution_ids
--     no longer have that gate; the column is dropped here.
--
-- Tables dropped:
--   • budget_item_allocations  — funding allocations per institution
--   • ministry_institution_config — institution definitions / costs
--   • ministry_institutions    — legacy table, never seeded
--
-- Columns dropped:
--   • crisis_templates.institution_ids
--
-- CASCADE on the table drops because nothing else should hold a
-- foreign key to these and we want the migration to succeed even
-- if a stray reference slipped in.
-- ════════════════════════════════════════════════════════════════

BEGIN;

DROP TABLE IF EXISTS budget_item_allocations    CASCADE;
DROP TABLE IF EXISTS ministry_institution_config CASCADE;
DROP TABLE IF EXISTS ministry_institutions      CASCADE;

ALTER TABLE crisis_templates
    DROP COLUMN IF EXISTS institution_ids;

NOTIFY pgrst, 'reload schema';

COMMIT;
