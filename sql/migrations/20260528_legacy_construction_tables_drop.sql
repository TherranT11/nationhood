-- ══════════════════════════════════════════════════════════════
-- Path 1 Phase 1E.A: drop legacy construction tables (safety-gated)
--
-- Final cull of the legacy construction pipeline. After this
-- migration runs successfully, all reads/writes against
-- construction_contracts, construction_events, and the related
-- legacy tables fail loud. The JS code paths that referenced them
-- (generateProjectEvents, resolveExpiredEvents, processActiveProjects,
-- resolveExpiredBids, the disabled stubs from Phase 1A, etc.) need a
-- separate cleanup commit (Phase 1E.B) — DO NOT apply this migration
-- without coordinating that JS commit, or the next tick processor run
-- will throw on the dropped tables.
--
-- Ordering of recommended deploy:
--   1. Verify drain — run the diagnostic at the bottom of this file
--      (or the SELECT block below) and confirm 0 in-flight rows.
--   2. Apply this migration.
--   3. Push the JS cleanup commit (Phase 1E.B) and redeploy
--      advance-corp-tick.
--
-- Safety gate: DO blocks below RAISE EXCEPTION if any in-flight
-- legacy state remains. Re-running after the gate passes is safe;
-- DROP TABLE IF EXISTS makes the actual drops idempotent.
--
-- Tables dropped (CASCADE):
--   construction_contracts     — 41 in_progress + 102 open + 3
--                                bidding flagged at Phase 1A start;
--                                gate verifies all four in-flight
--                                statuses drain before dropping.
--   construction_events        — gated on no ACTIVE rows.
--   mega_project_cooldowns     — 0 rows at Phase 1A; harmless drop.
--
-- Cascading dependents (auto-cleaned by DROP ... CASCADE):
--   project_material_allocations  — FK to construction_contracts.
--                                   Rows deleted with the contracts.
-- ══════════════════════════════════════════════════════════════

-- ── Safety gate 1: no in-flight construction contracts ──
DO $$
DECLARE
    v_in_flight INT;
    v_summary   TEXT;
BEGIN
    SELECT COUNT(*) INTO v_in_flight
      FROM construction_contracts
     WHERE status IN ('open', 'bidding', 'awarded', 'in_progress');

    IF v_in_flight > 0 THEN
        SELECT string_agg(format('%s=%s', status, cnt), ', ' ORDER BY status)
          INTO v_summary
          FROM (
            SELECT status, COUNT(*) AS cnt
              FROM construction_contracts
             WHERE status IN ('open', 'bidding', 'awarded', 'in_progress')
             GROUP BY status
          ) s;
        RAISE EXCEPTION 'Phase 1E gate: % construction_contracts row(s) still in-flight (%). Wait for natural drain before applying.',
            v_in_flight, v_summary;
    END IF;
END $$;

-- ── Safety gate 2: no ACTIVE construction events ──
DO $$
DECLARE
    v_active INT;
BEGIN
    -- construction_events may already be dropped if the migration is
    -- being re-run idempotently; tolerate that.
    BEGIN
        SELECT COUNT(*) INTO v_active
          FROM construction_events
         WHERE status = 'ACTIVE';
    EXCEPTION WHEN undefined_table THEN
        v_active := 0;
    END;

    IF v_active > 0 THEN
        RAISE EXCEPTION 'Phase 1E gate: % construction_events row(s) still ACTIVE. Let resolveExpiredEvents drain them first.',
            v_active;
    END IF;
END $$;

-- ── Drops (idempotent via IF EXISTS, atomic via CASCADE) ──
DROP TABLE IF EXISTS construction_events       CASCADE;
DROP TABLE IF EXISTS project_material_allocations CASCADE;
DROP TABLE IF EXISTS construction_contracts    CASCADE;
DROP TABLE IF EXISTS mega_project_cooldowns    CASCADE;

-- Echo the post-state so the migration runner can confirm. Should be
-- four rows of "<table_name> = dropped" or empty if all gone.
SELECT table_name
  FROM information_schema.tables
 WHERE table_schema = 'public'
   AND table_name IN (
       'construction_events',
       'construction_contracts',
       'project_material_allocations',
       'mega_project_cooldowns'
   );

NOTIFY pgrst, 'reload schema';
