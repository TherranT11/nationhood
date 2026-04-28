-- ══════════════════════════════════════════════════════════════════════════
-- Fix: ipo_invitations and ipo_members_update RLS policies missed linked
-- factions (follow-up to 20260426_ipo_rls_linked_faction_support.sql).
--
-- A linked-secondary-faction user (factions.linked_user_id = auth.uid()) hit
-- "new row violates row-level security policy" on:
--   • Sending an invitation              (ipo_invitations INSERT)
-- And would also have hit silent rejections on:
--   • Reading invites sent to them       (ipo_invitations SELECT)
--   • Accepting / declining an invite    (ipo_invitations UPDATE)
--   • Expelling / soft-removing a member (ipo_members UPDATE — president flow)
--
-- The 2026-04-26 fix only handled international_orgs (insert/update) and
-- ipo_members INSERT. This migration extends the same canonical pattern
--    faction_id = auth.uid()
--    OR EXISTS (SELECT 1 FROM factions WHERE id = faction_id AND linked_user_id = auth.uid())
-- to the four remaining policies.
--
-- Idempotent (DROP IF EXISTS + CREATE).
-- ══════════════════════════════════════════════════════════════════════════

BEGIN;

-- 1. ipo_invitations INSERT — let linked-faction members invite parties.
DROP POLICY IF EXISTS "ipo_invitations_insert" ON ipo_invitations;
CREATE POLICY "ipo_invitations_insert" ON ipo_invitations
    FOR INSERT TO authenticated
    WITH CHECK (
        (
            invited_by = auth.uid()
            OR EXISTS (
                SELECT 1 FROM factions
                WHERE id = invited_by
                  AND linked_user_id = auth.uid()
            )
        )
        AND
        org_id IN (
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

-- 2. ipo_invitations SELECT — let invitees see invites under either route.
DROP POLICY IF EXISTS "ipo_invitations_select" ON ipo_invitations;
CREATE POLICY "ipo_invitations_select" ON ipo_invitations
    FOR SELECT TO authenticated
    USING (
        target_faction_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM factions
            WHERE id = target_faction_id
              AND linked_user_id = auth.uid()
        )
        OR org_id IN (
            SELECT m.org_id FROM ipo_members m
            WHERE m.is_active = true
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

-- 3. ipo_invitations UPDATE — let invitees accept/decline, and inviters cancel.
DROP POLICY IF EXISTS "ipo_invitations_update" ON ipo_invitations;
CREATE POLICY "ipo_invitations_update" ON ipo_invitations
    FOR UPDATE TO authenticated
    USING (
        target_faction_id = auth.uid()
        OR invited_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM factions
            WHERE (id = target_faction_id OR id = invited_by)
              AND linked_user_id = auth.uid()
        )
    );

-- 4. ipo_members UPDATE — let linked-faction presidents expel and update
--    membership rows (the soft-delete flow sets is_active=false).
DROP POLICY IF EXISTS "ipo_members_update" ON ipo_members;
CREATE POLICY "ipo_members_update" ON ipo_members
    FOR UPDATE TO authenticated
    USING (
        faction_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM factions
            WHERE id = faction_id
              AND linked_user_id = auth.uid()
        )
        OR org_id IN (
            SELECT m.org_id FROM ipo_members m
            WHERE m.is_active = true
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
