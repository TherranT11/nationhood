-- Tighten IPO RLS policies flagged in pre-commit audit
-- 1. ipo_fund_txn_insert: was WITH CHECK (true) — restrict to org members
-- 2. ipo_ballots_insert: add org membership check
-- 3. ipo_action_log_insert: add org membership check

-- ── Fund transactions: only org members can insert ──
DROP POLICY IF EXISTS "ipo_fund_txn_insert" ON ipo_fund_transactions;
CREATE POLICY "ipo_fund_txn_insert" ON ipo_fund_transactions
    FOR INSERT TO authenticated
    WITH CHECK (
        org_id IN (
            SELECT org_id FROM ipo_members
            WHERE faction_id = auth.uid() AND is_active = true AND role = 'member'
        )
    );

-- ── Ballots: voter must be an active member of the vote's org ──
DROP POLICY IF EXISTS "ipo_ballots_insert" ON ipo_ballots;
CREATE POLICY "ipo_ballots_insert" ON ipo_ballots
    FOR INSERT TO authenticated
    WITH CHECK (
        (faction_id = auth.uid() OR faction_id IS NULL)
        AND vote_id IN (
            SELECT v.id FROM ipo_votes v
            WHERE v.org_id IN (
                SELECT org_id FROM ipo_members
                WHERE faction_id = auth.uid() AND is_active = true AND role = 'member'
            )
        )
    );

-- ── Action log: executor must be an active member ──
DROP POLICY IF EXISTS "ipo_action_log_insert" ON ipo_action_log;
CREATE POLICY "ipo_action_log_insert" ON ipo_action_log
    FOR INSERT TO authenticated
    WITH CHECK (
        faction_id = auth.uid()
        AND org_id IN (
            SELECT org_id FROM ipo_members
            WHERE faction_id = auth.uid() AND is_active = true AND role = 'member'
        )
    );
