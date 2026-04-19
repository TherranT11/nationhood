-- =====================================================
-- Migration: SELECT policy for administrations + gov_approval_log
-- Date: 2026-04-19
-- =====================================================
-- Both tables currently have RLS disabled. That opens cross-nation
-- reads (good — game history is public record, matches the codebase
-- convention of "Keep Allow select for all — game state is public"
-- from 20260302_fix_rls_ownership.sql) but ALSO leaves writes
-- unrestricted, which is a security gap.
--
-- Fix: enable RLS on both tables and add a single permissive SELECT
-- policy. No INSERT / UPDATE / DELETE policies — writes happen only
-- via service_role (tick processor, RPCs like rollover_administration),
-- which bypasses RLS automatically.
--
-- After this migration:
--   - Any authenticated user can SELECT any row (cross-nation history
--     browsing in the PAST ADMINISTRATIONS subtab works).
--   - Clients cannot INSERT / UPDATE / DELETE — only the tick
--     processor (service_role) can.
-- =====================================================

BEGIN;

-- ---------------------------------------------------------------
-- administrations: the chronicle of every government term.
-- Rich historical record; publicly readable by design.
-- ---------------------------------------------------------------
ALTER TABLE administrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select for all" ON administrations;
CREATE POLICY "Allow select for all" ON administrations
    FOR SELECT USING (true);

-- ---------------------------------------------------------------
-- gov_approval_log: audit trail of every approval delta with source.
-- Powers the approval-arc narrative in the PAST ADMINISTRATIONS
-- subtab for any nation the viewer browses.
-- ---------------------------------------------------------------
ALTER TABLE gov_approval_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select for all" ON gov_approval_log;
CREATE POLICY "Allow select for all" ON gov_approval_log
    FOR SELECT USING (true);

COMMIT;
