-- ══════════════════════════════════════════════════════════════════════════
-- Fix: IPO RLS policies rejected writes from secondary (linked) factions.
--
-- The original IPO policies (20260324_international_party_orgs.sql) were
-- written before the linked-faction system existed and only recognised the
-- PRIMARY ownership route (factions.id = auth.uid()). A user logged in
-- under a secondary faction (factions.linked_user_id = auth.uid()) hit
-- "new row violates row-level security policy" on:
--   • Creating an IPO (international_orgs INSERT)
--   • Joining an IPO as the founding member (ipo_members INSERT, self-join)
--   • Updating their own org as president (international_orgs UPDATE)
--
-- This migration recreates those policies using the canonical
--    faction_id = auth.uid()
--    OR EXISTS (SELECT 1 FROM factions WHERE id = faction_id AND linked_user_id = auth.uid())
-- pattern already used by messaging_system, corp_contracts, and
-- phase5_moderation.
--
-- Idempotent (DROP IF EXISTS + CREATE).
-- ══════════════════════════════════════════════════════════════════════════

BEGIN;

-- 1. international_orgs INSERT — allow linked factions to create their own IPO
DROP POLICY IF EXISTS "international_orgs_insert" ON international_orgs;
CREATE POLICY "international_orgs_insert" ON international_orgs
    FOR INSERT TO authenticated
    WITH CHECK (
        founding_party_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM factions
            WHERE id = founding_party_id
              AND linked_user_id = auth.uid()
        )
    );

-- 2. international_orgs UPDATE — allow linked-faction presidents to update
DROP POLICY IF EXISTS "international_orgs_update" ON international_orgs;
CREATE POLICY "international_orgs_update" ON international_orgs
    FOR UPDATE TO authenticated
    USING (
        president_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM factions
            WHERE id = president_id
              AND linked_user_id = auth.uid()
        )
    );

-- 3. ipo_members INSERT — allow linked factions to self-join, and let
--    linked-faction members admit others via vote resolution. Replaces the
--    policy last set by 20260325_ipo_join_request_rls.sql.
DROP POLICY IF EXISTS "ipo_members_insert" ON ipo_members;
CREATE POLICY "ipo_members_insert" ON ipo_members
    FOR INSERT TO authenticated
    WITH CHECK (
        -- Self-join: primary or linked
        faction_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM factions
            WHERE id = faction_id
              AND linked_user_id = auth.uid()
        )
        -- Member-admits-other: caller is an active member of the org via
        -- either ownership route.
        OR org_id IN (
            SELECT m.org_id FROM ipo_members m
            WHERE m.is_active = true
              AND m.role = 'member'
              AND (
                  m.faction_id = auth.uid()
                  OR EXISTS (
                      SELECT 1 FROM factions f
                      WHERE f.id = m.faction_id
                        AND f.linked_user_id = auth.uid()
                  )
              )
        )
    );

COMMIT;

-- ══════════════════════════════════════════════════════════════════════════
-- Verification
-- ══════════════════════════════════════════════════════════════════════════
-- 1. Policies exist with the expanded check:
--      SELECT polname, pg_get_expr(polqual, polrelid)  AS using_clause,
--             pg_get_expr(polwithcheck, polrelid)      AS with_check_clause
--      FROM pg_policy
--      WHERE polname IN (
--          'international_orgs_insert',
--          'international_orgs_update',
--          'ipo_members_insert'
--      );
--    Expected: each clause references both `auth.uid()` and `linked_user_id`.
--
-- 2. Smoke (linked-faction org creation): logged in as a linked secondary
--    faction, the IPO creation flow should succeed without "new row
--    violates row-level security policy for table international_orgs".
