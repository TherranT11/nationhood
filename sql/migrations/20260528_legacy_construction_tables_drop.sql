-- ══════════════════════════════════════════════════════════════
-- ⚠ DEFERRED — DO NOT APPLY YET (Path 1 Phase 1E.A)
--
-- This migration drops the legacy construction tables. It was
-- written but is parked unapplied because a wider audit found the
-- legacy tables are still queried from multiple user-facing pages
-- and SECURITY DEFINER RPCs. Dropping the tables right now would
-- break (with "relation does not exist") every query in:
--
--   Pages (~25 query sites total):
--     corp-operations-shipping.html  (13 refs)
--     corp-dashboard-home2.html      (6  refs)
--     expansion.html                 (4  refs)
--     corp-nations.html              (1  ref)
--     economy.html                   (1  ref)
--
--   Server-side RPCs:
--     20260420_close_stuck_construction_insurance.sql
--     20260421_declare_corp_bankruptcy_rpc.sql
--     20260507_construction_auto_award_cron.sql
--
--   Plus the legacy code paths in advance-corp-tick:
--     generateProjectEvents, resolveExpiredEvents,
--     processActiveProjects, resolveExpiredBids, and the
--     Phase 1A stubs (generateConstructionContracts,
--     generateInfraRenewalContracts).
--
-- Phases 1A–1D are all live and shipped; the new corp_contracts
-- pipeline is the canonical one going forward. The legacy tables
-- continue to drain naturally as their 41 in-progress contracts
-- complete (max ~100 ticks each), but they remain queryable so
-- the pages above keep rendering.
--
-- BEFORE APPLYING THIS MIGRATION:
--   1. Audit the 5 page files. Decide page-by-page whether they're
--      still reachable from the navigation; if not, delete them.
--      For pages that stay, stub the legacy queries to return [].
--   2. Decide on each of the 3 legacy RPCs. Either DROP FUNCTION
--      them or rewrite to query corp_contracts.
--   3. Push a Phase 1E.B commit that gutting advance-corp-tick's
--      legacy paths (generateProjectEvents, resolveExpiredEvents,
--      processActiveProjects, resolveExpiredBids, both Phase 1A
--      stubs, all call sites in the per-nation construction try-block).
--   4. Apply this migration (the in-flight safety gate below still
--      protects against running before contracts drain).
--   5. Redeploy advance-corp-tick.
--
-- The safety gate below stays in place: even if applied accidentally,
-- the migration aborts with a clear exception if any in-flight legacy
-- contract or active legacy event remains.
--
-- Tables this migration drops once approved:
--   construction_contracts        — gate-checked
--   construction_events           — gate-checked
--   mega_project_cooldowns        — 0 rows at Phase 1A; harmless
--   project_material_allocations  — cascading dependent
-- ══════════════════════════════════════════════════════════════

-- ── Hard guard: deferred-apply marker. ──
-- Forces explicit operator intent. To apply this migration, comment
-- this DO block out (or delete it). The safety gates below still run
-- after that and protect against premature drain.
DO $$
BEGIN
    RAISE EXCEPTION
        'Migration 20260528 is DEFERRED. Read the header before applying. To proceed, remove the deferred-apply guard at the top of the file.';
END $$;

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
