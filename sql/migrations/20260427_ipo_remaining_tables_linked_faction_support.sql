-- ══════════════════════════════════════════════════════════════════════════
-- IPO RLS — final linked-faction sweep across remaining tables.
--
-- Continues the work of:
--   • 20260426_ipo_rls_linked_faction_support.sql
--     (international_orgs.{insert, update}, ipo_members.insert)
--   • 20260427_ipo_invitations_and_members_update_linked_faction_support.sql
--     (ipo_invitations.{insert, select, update}, ipo_members.update)
--
-- Audit on 2026-04-27 found 9 remaining policies across 6 tables that
-- still rejected linked-faction users. Most importantly:
--   ipo_votes.insert — every vote-creation flow (membership, charter
--   amendment, symposium, etc.) failed for linked-faction users.
--
-- Patches use the canonical pattern already established:
--    faction_id = auth.uid()
--    OR EXISTS (SELECT 1 FROM factions WHERE id = faction_id AND linked_user_id = auth.uid())
--
-- Idempotent (DROP IF EXISTS + CREATE).
-- ══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── ipo_votes ──────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "ipo_votes_insert" ON ipo_votes;
CREATE POLICY "ipo_votes_insert" ON ipo_votes
    FOR INSERT TO authenticated
    WITH CHECK (
        (
            proposed_by = auth.uid()
            OR EXISTS (
                SELECT 1 FROM factions f
                WHERE f.id = proposed_by
                  AND f.linked_user_id = auth.uid()
            )
        )
        AND (
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
            OR vote_type = 'membership'
        )
    );

DROP POLICY IF EXISTS "ipo_votes_select" ON ipo_votes;
CREATE POLICY "ipo_votes_select" ON ipo_votes
    FOR SELECT TO authenticated
    USING (
        proposed_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM factions f
            WHERE f.id = proposed_by
              AND f.linked_user_id = auth.uid()
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

DROP POLICY IF EXISTS "ipo_votes_update" ON ipo_votes;
CREATE POLICY "ipo_votes_update" ON ipo_votes
    FOR UPDATE TO authenticated
    USING (
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

-- ── ipo_ballots ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "ipo_ballots_insert" ON ipo_ballots;
CREATE POLICY "ipo_ballots_insert" ON ipo_ballots
    FOR INSERT TO authenticated
    WITH CHECK (
        faction_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM factions f
            WHERE f.id = faction_id
              AND f.linked_user_id = auth.uid()
        )
        OR faction_id IS NULL
    );

DROP POLICY IF EXISTS "ipo_ballots_update" ON ipo_ballots;
CREATE POLICY "ipo_ballots_update" ON ipo_ballots
    FOR UPDATE TO authenticated
    USING (
        faction_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM factions f
            WHERE f.id = faction_id
              AND f.linked_user_id = auth.uid()
        )
    );

-- ── ipo_chat ───────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "ipo_chat_select" ON ipo_chat;
CREATE POLICY "ipo_chat_select" ON ipo_chat
    FOR SELECT TO authenticated
    USING (
        org_id IN (
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

-- ── ipo_action_log ─────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "ipo_action_log_insert" ON ipo_action_log;
CREATE POLICY "ipo_action_log_insert" ON ipo_action_log
    FOR INSERT TO authenticated
    WITH CHECK (
        faction_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM factions f
            WHERE f.id = faction_id
              AND f.linked_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "ipo_action_log_select" ON ipo_action_log;
CREATE POLICY "ipo_action_log_select" ON ipo_action_log
    FOR SELECT TO authenticated
    USING (
        org_id IN (
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

-- ── ipo_fund_transactions ──────────────────────────────────────────────────

DROP POLICY IF EXISTS "ipo_fund_txn_select" ON ipo_fund_transactions;
CREATE POLICY "ipo_fund_txn_select" ON ipo_fund_transactions
    FOR SELECT TO authenticated
    USING (
        org_id IN (
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
