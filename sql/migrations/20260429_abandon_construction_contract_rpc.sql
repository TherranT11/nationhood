-- =========================================================================
-- abandon_construction_contract(p_contract_id UUID) — escape hatch for
-- corporations stuck on an 'awarded' contract they can't fulfil.
--
-- Authoritatively does, in one transaction:
--   1. Validates the caller is the awarded corp.
--   2. Validates the contract is still 'awarded' (atomic gate against
--      the in_progress race).
--   3. Forfeits the performance bond if any: principal goes to the
--      lender's corp_cash_reserves, bond status -> 'defaulted'.
--   4. Reduces the abandoning corp's reputation by 3 (floored at 0).
--   5. Marks the won bid 'lost' (semantically abandoned; uses 'lost'
--      to stay within the values the live schema already accepts).
--   6. Sets the contract to 'expired' and clears
--      awarded_to_faction / awarded_at_tick.
--
-- Called from corp-operations.html abandonContract(). The JS path
-- previously did each write directly from the user session, which
-- failed silently on the cross-faction lender-cash UPDATE due to
-- "Factions update own" RLS (20260302_fix_rls_ownership.sql:37). The
-- RPC runs SECURITY DEFINER so it can write across factions while
-- still gating on the caller's auth.uid().
--
-- Idempotent against double-click: if the second call lands while the
-- contract is already 'expired', the status check rejects with
-- INVALID_STATUS instead of double-forfeiting.
-- =========================================================================

CREATE OR REPLACE FUNCTION abandon_construction_contract(
    p_contract_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
    v_actor          UUID;
    v_contract       construction_contracts%ROWTYPE;
    v_current_tick   INT := 0;
    v_bond_principal NUMERIC := 0;
    v_bond_lender    UUID;
    v_lender_cash    NUMERIC;
BEGIN
    v_actor := auth.uid();
    IF v_actor IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'code', 'UNAUTHENTICATED', 'message', 'Authentication required.');
    END IF;

    SELECT * INTO v_contract
    FROM construction_contracts
    WHERE id = p_contract_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('ok', false, 'code', 'NOT_FOUND', 'message', 'Contract not found.');
    END IF;

    IF v_contract.status <> 'awarded' THEN
        RETURN jsonb_build_object('ok', false, 'code', 'INVALID_STATUS', 'message', 'Contract is not in awarded status; abandon aborted.');
    END IF;

    IF v_contract.awarded_to_faction IS DISTINCT FROM v_actor THEN
        RETURN jsonb_build_object('ok', false, 'code', 'UNAUTHORIZED', 'message', 'Only the awarded corp may abandon this contract.');
    END IF;

    SELECT current_tick INTO v_current_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_current_tick := COALESCE(v_current_tick, 0);

    -- Forfeit performance bond (mirrors the FAIL-delivery path in
    -- advance-corp-tick/index.ts: principal to lender, bond to defaulted).
    IF v_contract.bond_id IS NOT NULL THEN
        SELECT principal, lender_faction_id
        INTO v_bond_principal, v_bond_lender
        FROM finance_active_loans
        WHERE id = v_contract.bond_id AND status = 'current'
        FOR UPDATE;

        IF v_bond_lender IS NOT NULL THEN
            SELECT corp_cash_reserves INTO v_lender_cash FROM factions WHERE id = v_bond_lender;
            UPDATE factions
            SET corp_cash_reserves = COALESCE(v_lender_cash, 0) + COALESCE(v_bond_principal, 0)
            WHERE id = v_bond_lender;

            UPDATE finance_active_loans
            SET status = 'defaulted', completed_tick = v_current_tick
            WHERE id = v_contract.bond_id;
        END IF;
    END IF;

    -- Reputation hit on the abandoning corp.
    UPDATE factions
    SET corp_reputation = GREATEST(0, COALESCE(corp_reputation, 65) - 3)
    WHERE id = v_actor;

    -- Mark the won bid as lost (existing accepted value); the abandon
    -- audit trail lives on the contract row + event_log, not the bid.
    UPDATE contract_bids
    SET status = 'lost'
    WHERE contract_id = p_contract_id
      AND faction_id = v_actor
      AND status = 'won';

    -- Expire the contract.
    UPDATE construction_contracts
    SET status = 'expired',
        awarded_to_faction = NULL,
        awarded_at_tick = NULL
    WHERE id = p_contract_id;

    RETURN jsonb_build_object(
        'ok', true,
        'code', 'ABANDONED',
        'tick', v_current_tick,
        'bond_forfeited', v_contract.bond_id IS NOT NULL AND v_bond_lender IS NOT NULL
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('ok', false, 'code', 'EXCEPTION', 'message', SQLERRM);
END;
$fn$;

ALTER FUNCTION abandon_construction_contract(UUID) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION abandon_construction_contract(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION abandon_construction_contract(UUID) TO service_role;
