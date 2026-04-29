-- =========================================================================
-- Phase 4 of the parliamentary two-table refactor — DROP active_coalitions.
--
-- Pre-conditions (all completed in Phases 2 + 3):
--   * Zero JS reads or writes against active_coalitions.
--   * Zero RPC reads or writes against active_coalitions
--     (verified after running 20260429_phase3_drop_active_coalitions_writes.sql).
--   * Zero FK references INTO active_coalitions.
--   * Zero views, triggers, or work_foreign_keys.sql entries that touch it.
--
-- After this migration runs, government_formations is the sole source of
-- truth for parliamentary government state. The "two-tier table state"
-- smell flagged in the parliamentary deep-dive audit is resolved.
--
-- Rollback DDL is preserved as a comment block at the bottom of this file
-- so the table can be reconstructed from a snapshot if a forgotten reader
-- surfaces post-deploy. (No data preservation — this is a hard drop.)
-- =========================================================================

DROP TABLE IF EXISTS active_coalitions;

-- ── Verify ──────────────────────────────────────────────────────────
SELECT
    'active_coalitions' AS table_name,
    EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'active_coalitions'
    ) AS still_present;
-- Expected: still_present = false.

-- =========================================================================
-- ROLLBACK REFERENCE — schema as of just before the drop.
-- If you need to recreate the table for any reason, paste this
-- (uncommented) into the SQL editor.
-- =========================================================================
-- CREATE TABLE active_coalitions (
--     id                 uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
--     nation_id          uuid          NOT NULL,
--     election_id        uuid          NOT NULL,
--     party_ids          uuid[]        NOT NULL,
--     lead_party_id      uuid,                          -- NOT NULL dropped 20260422
--     total_seats        integer       NOT NULL,
--     stability_penalty  integer       NOT NULL,
--     formed_at          timestamptz   DEFAULT now(),
--     dissolved_at       timestamptz,
--     ministry_allocations jsonb,
--     status             text          DEFAULT 'formed'
-- );
-- ALTER TABLE active_coalitions
--     ADD CONSTRAINT active_coalitions_lead_party_id_fkey
--     FOREIGN KEY (lead_party_id) REFERENCES factions(id) ON DELETE SET NULL;
-- =========================================================================
