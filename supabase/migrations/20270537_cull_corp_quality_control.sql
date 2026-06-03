-- ════════════════════════════════════════════════════════════════════
-- 20270537 — Cull vestigial factions.corp_quality_control
--
-- Phase A of Aviation Manufacturing (20261022) added three "hero stat"
-- columns to factions: corp_production_capacity, corp_quality_control,
-- corp_innovation. The plan was for Phases C–F to seed them at corp
-- founding and read them in the design / production / sale pipeline.
--
-- What actually shipped (Phases F-3 → RFPs, 20261107 + 20261125):
-- the production loop reads design_id + plant counts + inventory_on_hand;
-- RFPs read aircraft_class + design.availability + inventory + bid
-- prices. None of those paths read corp_quality_control. A repo-wide
-- grep (SQL migrations + .html + .js + .ts) returns zero non-schema
-- references to it. No founding flow writes a non-default value, so
-- every existing row sits at the column default of 0 — the column
-- carries no information.
--
-- The COMMENT on the column described high-stakes mechanics
-- (groundings, blocked sales, recalls, fatal-crash recalls). None of
-- that exists in code. Per REDUCE: dead state that does nothing gets
-- removed, not commented out for a future that didn't arrive.
--
-- This migration:
--   1. DROPs CHECK factions_aviation_stats_range (it references the
--      column being dropped — has to come off first).
--   2. DROPs column factions.corp_quality_control.
--   3. Re-creates the CHECK constraint without the QC clause; the
--      surviving range gates still cover corp_production_capacity
--      and corp_innovation.
--
-- Not touched (in scope for a separate decision):
--   • corp_production_capacity — identical state (declared in Phase
--     A, never read or written). If you want, the symmetric cull is
--     trivial; flagging for follow-up.
--   • corp_innovation — declared in Phase A but 20261024 corrected
--     its comment to claim cross-sector founding seeds (5 for
--     Construction / Finance / Airline, 1 for Aviation Mfg). The SQL
--     migrations don't carry those writes, so the seeds may live in
--     the TS founding paths outside this repo. Leaving alone until
--     that's confirmed dead too.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.factions
    DROP CONSTRAINT IF EXISTS factions_aviation_stats_range;

ALTER TABLE public.factions
    DROP COLUMN IF EXISTS corp_quality_control;

ALTER TABLE public.factions
    ADD CONSTRAINT factions_aviation_stats_range CHECK (
        corp_production_capacity BETWEEN 0 AND 10
        AND corp_innovation       BETWEEN 0 AND 10
    ) NOT VALID;

NOTIFY pgrst, 'reload schema';

COMMIT;
