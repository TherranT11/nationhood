-- =====================================================
-- Migration: Fix RLS ownership policies
-- Date: 2026-03-02
-- =====================================================
-- Replaces permissive USING(true) write policies with proper
-- ownership checks. Adds ownership validation to AP functions.
-- Creates helper RPCs for cross-faction operations that need
-- server-side authorization.
--
-- IMPORTANT: service_role (edge functions / tick processor)
-- bypasses RLS automatically — these changes only affect
-- client-side (anon/authenticated) access.
--
-- NOTE: Some tables (nations, shard, event_log, bills) still
-- have permissive write policies because client-side code
-- writes to them directly (coups, diplomacy events, presidential
-- actions). These need to be migrated to server-side RPCs in a
-- follow-up PR before their RLS policies can be tightened.
-- =====================================================

BEGIN;

-- =====================================================
-- PART 1: FACTIONS — players can only modify their own row
-- factions.id = auth.uid() (faction PK IS the user's auth UUID)
-- =====================================================

DROP POLICY IF EXISTS "Allow insert for all" ON factions;
DROP POLICY IF EXISTS "Allow update for all" ON factions;
DROP POLICY IF EXISTS "Allow delete for all" ON factions;
-- Keep "Allow select for all" — game state is public

CREATE POLICY "Factions insert own"
    ON factions FOR INSERT TO authenticated
    WITH CHECK (id = auth.uid());

CREATE POLICY "Factions update own"
    ON factions FOR UPDATE TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- No DELETE policy: factions are disbanded via service_role (tick processor),
-- not deleted directly by clients.

-- =====================================================
-- PART 2: BILL_SUPPORT — players can only cast their own votes
-- Prevents: vote fraud, seat_count manipulation for other factions
-- =====================================================

ALTER TABLE bill_support ENABLE ROW LEVEL SECURITY;

-- Drop any existing permissive policies
DROP POLICY IF EXISTS "Allow select for all" ON bill_support;
DROP POLICY IF EXISTS "Allow insert for all" ON bill_support;
DROP POLICY IF EXISTS "Allow update for all" ON bill_support;
DROP POLICY IF EXISTS "Allow delete for all" ON bill_support;

CREATE POLICY "Bill support select all"
    ON bill_support FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Bill support insert own"
    ON bill_support FOR INSERT TO authenticated
    WITH CHECK (faction_id = auth.uid());

CREATE POLICY "Bill support update own"
    ON bill_support FOR UPDATE TO authenticated
    USING (faction_id = auth.uid())
    WITH CHECK (faction_id = auth.uid());

CREATE POLICY "Bill support delete own"
    ON bill_support FOR DELETE TO authenticated
    USING (faction_id = auth.uid());

-- =====================================================
-- PART 2b: RPC for cross-faction vote operations
-- The bill proposer needs to convert conditional votes to
-- accepts when conditions are met. This RPC validates
-- authorization server-side instead of allowing arbitrary
-- cross-faction writes.
-- =====================================================

CREATE OR REPLACE FUNCTION convert_conditional_vote(
    p_bill_id UUID,
    p_faction_id UUID,
    p_seat_count INT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Only the bill proposer can convert conditional votes
    IF NOT EXISTS (
        SELECT 1 FROM bills
        WHERE id = p_bill_id AND proposed_by = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Only the bill proposer can convert conditional votes';
    END IF;

    -- Target faction must have an existing conditional vote
    IF NOT EXISTS (
        SELECT 1 FROM bill_support
        WHERE bill_id = p_bill_id AND faction_id = p_faction_id AND stance = 'conditional'
    ) THEN
        RAISE EXCEPTION 'No conditional vote found for this faction';
    END IF;

    UPDATE bill_support
    SET stance = 'accept', seat_count = p_seat_count
    WHERE bill_id = p_bill_id AND faction_id = p_faction_id;
END;
$$;

ALTER FUNCTION convert_conditional_vote(UUID, UUID, INT) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION convert_conditional_vote(UUID, UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION convert_conditional_vote(UUID, UUID, INT) TO service_role;

-- RPC for bill withdrawal: proposer can delete all votes on their bill
CREATE OR REPLACE FUNCTION withdraw_bill_votes(p_bill_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Only the bill proposer can withdraw all votes
    IF NOT EXISTS (
        SELECT 1 FROM bills
        WHERE id = p_bill_id AND proposed_by = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Only the bill proposer can withdraw votes';
    END IF;

    DELETE FROM bill_support WHERE bill_id = p_bill_id;
END;
$$;

ALTER FUNCTION withdraw_bill_votes(UUID) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION withdraw_bill_votes(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION withdraw_bill_votes(UUID) TO service_role;

-- =====================================================
-- PART 3: READ-ONLY SYSTEM TABLES
-- These are only written by the tick processor (service_role).
-- Remove INSERT/UPDATE/DELETE policies for clients.
-- =====================================================

-- nations_history (tick snapshots)
DROP POLICY IF EXISTS "Allow insert for all" ON nations_history;
DROP POLICY IF EXISTS "Allow update for all" ON nations_history;
DROP POLICY IF EXISTS "Allow delete for all" ON nations_history;

-- active_crises (created/resolved by tick processor)
DROP POLICY IF EXISTS "Allow insert for all" ON active_crises;
DROP POLICY IF EXISTS "Allow update for all" ON active_crises;
DROP POLICY IF EXISTS "Allow delete for all" ON active_crises;

-- ministry_action_log (audit trail, system writes only)
DROP POLICY IF EXISTS "Allow insert for all" ON ministry_action_log;
DROP POLICY IF EXISTS "Allow update for all" ON ministry_action_log;
DROP POLICY IF EXISTS "Allow delete for all" ON ministry_action_log;

-- elections (created/managed by tick processor)
DROP POLICY IF EXISTS "Allow insert for all" ON elections;
DROP POLICY IF EXISTS "Allow update for all" ON elections;
DROP POLICY IF EXISTS "Allow delete for all" ON elections;

-- active_laws (enacted by tick processor when bills pass)
DROP POLICY IF EXISTS "Allow insert for all" ON active_laws;
DROP POLICY IF EXISTS "Allow update for all" ON active_laws;
DROP POLICY IF EXISTS "Allow delete for all" ON active_laws;

-- administrations (created by tick processor on government formation)
DROP POLICY IF EXISTS "Allow insert for all" ON administrations;
DROP POLICY IF EXISTS "Allow update for all" ON administrations;
DROP POLICY IF EXISTS "Allow delete for all" ON administrations;

-- head_of_government (set by tick processor)
DROP POLICY IF EXISTS "Allow insert for all" ON head_of_government;
DROP POLICY IF EXISTS "Allow update for all" ON head_of_government;
DROP POLICY IF EXISTS "Allow delete for all" ON head_of_government;

-- presidents (set by tick processor on election)
DROP POLICY IF EXISTS "Allow insert for all" ON presidents;
DROP POLICY IF EXISTS "Allow update for all" ON presidents;
DROP POLICY IF EXISTS "Allow delete for all" ON presidents;

-- =====================================================
-- PART 4: PLAYER-OWNED TABLES — ownership checks on writes
-- =====================================================

-- ideology_history: players log their own ideology changes
DROP POLICY IF EXISTS "Allow insert for all" ON ideology_history;
DROP POLICY IF EXISTS "Allow update for all" ON ideology_history;
DROP POLICY IF EXISTS "Allow delete for all" ON ideology_history;

CREATE POLICY "Ideology history insert own"
    ON ideology_history FOR INSERT TO authenticated
    WITH CHECK (faction_id = auth.uid());

-- campaign_actions: players create their own campaign actions
DROP POLICY IF EXISTS "Allow insert for all" ON campaign_actions;
DROP POLICY IF EXISTS "Allow update for all" ON campaign_actions;
DROP POLICY IF EXISTS "Allow delete for all" ON campaign_actions;

CREATE POLICY "Campaign actions insert own"
    ON campaign_actions FOR INSERT TO authenticated
    WITH CHECK (party_id = auth.uid());

-- faction_ideology: players set their own ideology
DROP POLICY IF EXISTS "Allow insert for all" ON faction_ideology;
DROP POLICY IF EXISTS "Allow update for all" ON faction_ideology;
DROP POLICY IF EXISTS "Allow delete for all" ON faction_ideology;

CREATE POLICY "Faction ideology insert own"
    ON faction_ideology FOR INSERT TO authenticated
    WITH CHECK (faction_id = auth.uid());

CREATE POLICY "Faction ideology update own"
    ON faction_ideology FOR UPDATE TO authenticated
    USING (faction_id = auth.uid())
    WITH CHECK (faction_id = auth.uid());

-- pm_candidates: players nominate themselves
DROP POLICY IF EXISTS "Allow insert for all" ON pm_candidates;
DROP POLICY IF EXISTS "Allow update for all" ON pm_candidates;
DROP POLICY IF EXISTS "Allow delete for all" ON pm_candidates;

CREATE POLICY "PM candidates insert own"
    ON pm_candidates FOR INSERT TO authenticated
    WITH CHECK (faction_id = auth.uid());

-- ministry_requests: players request their own ministry actions
DROP POLICY IF EXISTS "Allow insert for all" ON ministry_requests;
DROP POLICY IF EXISTS "Allow update for all" ON ministry_requests;
DROP POLICY IF EXISTS "Allow delete for all" ON ministry_requests;

CREATE POLICY "Ministry requests insert own"
    ON ministry_requests FOR INSERT TO authenticated
    WITH CHECK (faction_id = auth.uid());

-- =====================================================
-- PART 5: AP FUNCTIONS — ownership validation
-- Prevents any authenticated user from granting AP to or
-- draining AP from arbitrary factions.
-- service_role (auth.uid() = NULL) passes through for tick processing.
-- =====================================================

CREATE OR REPLACE FUNCTION deduct_ap(
    p_faction_id UUID,
    p_cost INT
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_new_ap INT;
BEGIN
    -- Ownership check: clients can only deduct their own AP.
    -- service_role has auth.uid() = NULL, so it bypasses this check.
    IF auth.uid() IS NOT NULL AND p_faction_id != auth.uid() THEN
        RETURN -1;
    END IF;

    UPDATE factions
    SET action_points = action_points - p_cost
    WHERE id = p_faction_id
      AND action_points >= p_cost
    RETURNING action_points INTO v_new_ap;

    IF NOT FOUND THEN
        RETURN -1;
    END IF;

    RETURN v_new_ap;
END;
$$;

ALTER FUNCTION deduct_ap(UUID, INT) OWNER TO postgres;

CREATE OR REPLACE FUNCTION accumulate_ap(
    p_faction_id UUID,
    p_gain INT,
    p_max_ap INT DEFAULT 20
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_new_ap INT;
BEGIN
    -- Ownership check: clients can only accumulate their own AP.
    -- service_role has auth.uid() = NULL, so it bypasses this check.
    IF auth.uid() IS NOT NULL AND p_faction_id != auth.uid() THEN
        RETURN -1;
    END IF;

    UPDATE factions
    SET action_points = LEAST(COALESCE(action_points, 0) + p_gain, p_max_ap)
    WHERE id = p_faction_id
    RETURNING action_points INTO v_new_ap;

    IF NOT FOUND THEN
        RETURN -1;
    END IF;

    RETURN v_new_ap;
END;
$$;

ALTER FUNCTION accumulate_ap(UUID, INT, INT) OWNER TO postgres;

-- Ensure grants are in place
GRANT EXECUTE ON FUNCTION deduct_ap(UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION deduct_ap(UUID, INT) TO service_role;
GRANT EXECUTE ON FUNCTION accumulate_ap(UUID, INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION accumulate_ap(UUID, INT, INT) TO service_role;

COMMIT;

-- =====================================================
-- TODO: Follow-up RLS hardening (requires client → RPC migration)
-- =====================================================
-- These tables still have permissive write policies because
-- client-side code writes to them directly. Each needs its
-- writes migrated to a SECURITY DEFINER RPC before the
-- policy can be tightened:
--
-- * nations      — coups (parties.html:1815), steward actions
--                   (parties.html:1593,1722), presidential decree
--                   (laws.html:2196), government.html:133,1800
-- * shard        — admin.html:722,1437 (should use service_role)
-- * event_log    — diplomacy.html:1256,1620,3643,4295
-- * bills        — presidential sign/veto (laws.html:1106),
--                   decree creation, ambassador bills
-- * ambassadors  — nomination flow
-- * ministries   — appointment flow
-- * gov_formations / active_coalitions — coalition negotiations
-- =====================================================
