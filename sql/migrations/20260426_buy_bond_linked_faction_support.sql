-- ════════════════════════════════════════════════════════════════════════════
-- Fix: buy_bond rejected linked (secondary) factions
--
-- 20260424_debt_system_phase1.sql introduced buy_bond with an ownership check
-- that only recognised the PRIMARY route (factions.id = auth.uid()):
--
--     IF p_buyer_faction_id <> v_user_id THEN
--         RAISE EXCEPTION 'Faction ownership required';
--     END IF;
--
-- A user logged in under a LINKED secondary corp (linked_user_id = auth.uid())
-- got "Bond purchase failed: Faction ownership required" on every attempt.
-- The companion sell/dispute RPCs in 20260423 already used the correct
-- "primary OR linked" idiom; this one was a regression in the next-day
-- migration.
--
-- Recreates buy_bond with the correct check. Function body otherwise
-- identical to the original. Idempotent (CREATE OR REPLACE).
-- ════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION buy_bond(
    p_request_id        UUID,
    p_buyer_faction_id  UUID,
    p_amount            BIGINT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
    v_user_id  UUID;
    v_buyer    factions%ROWTYPE;
    v_request  finance_loan_requests%ROWTYPE;
    v_tick     INT;
    v_holding_id UUID;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

    -- Ownership check: accept either the PRIMARY route (factions.id = auth.uid())
    -- or the LINKED route (factions.linked_user_id = auth.uid()).
    IF p_buyer_faction_id <> v_user_id
       AND NOT EXISTS (
           SELECT 1 FROM factions
           WHERE id = p_buyer_faction_id
             AND linked_user_id = v_user_id
       ) THEN
        RAISE EXCEPTION 'Faction ownership required';
    END IF;

    IF p_amount IS NULL OR p_amount <= 0 THEN
        RAISE EXCEPTION 'Amount must be positive';
    END IF;

    SELECT * INTO v_buyer FROM factions WHERE id = p_buyer_faction_id;
    IF v_buyer.id IS NULL THEN RAISE EXCEPTION 'Buyer faction not found'; END IF;
    IF v_buyer.faction_type IS DISTINCT FROM 'corporation' THEN
        RAISE EXCEPTION 'Only corporations can buy bonds';
    END IF;
    IF v_buyer.abandoned_at IS NOT NULL THEN
        RAISE EXCEPTION 'Abandoned corps cannot buy bonds';
    END IF;
    IF LOWER(COALESCE(v_buyer.corp_sector, '')) <> 'finance'
       OR LOWER(COALESCE(v_buyer.corp_subsector, '')) <> 'investment' THEN
        RAISE EXCEPTION 'Only Investment Corps can buy bonds';
    END IF;
    IF COALESCE(v_buyer.corp_cash_reserves, 0) < p_amount THEN
        RAISE EXCEPTION 'Insufficient corp cash reserves';
    END IF;

    -- Lock the request row so concurrent buyers serialize on principal_remaining.
    SELECT * INTO v_request FROM finance_loan_requests WHERE id = p_request_id FOR UPDATE;
    IF v_request.id IS NULL THEN RAISE EXCEPTION 'Bond request not found'; END IF;
    IF v_request.request_type IS DISTINCT FROM 'bond' THEN
        RAISE EXCEPTION 'Request is not a bond (%)', v_request.request_type;
    END IF;
    IF v_request.status <> 'open' THEN
        RAISE EXCEPTION 'Bond request is %', v_request.status;
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard';
    IF v_request.expires_tick <= v_tick THEN
        RAISE EXCEPTION 'Bond offer has expired';
    END IF;

    IF p_amount > COALESCE(v_request.principal_remaining, v_request.amount) THEN
        RAISE EXCEPTION 'Amount exceeds remaining principal (%)',
            COALESCE(v_request.principal_remaining, v_request.amount);
    END IF;

    -- Cash flow: corp → issuer nation. nations.debt incremented to keep
    -- in sync with SUM(active bond_holdings.principal).
    UPDATE factions
       SET corp_cash_reserves = COALESCE(corp_cash_reserves, 0) - p_amount
     WHERE id = p_buyer_faction_id;

    UPDATE nations
       SET budget_reserves = COALESCE(budget_reserves, 0) + p_amount,
           debt            = COALESCE(debt, 0) + p_amount
     WHERE id = v_request.issuer_nation_id;

    -- Record the holding with the request's locked coupon_rate.
    INSERT INTO bond_holdings (
        request_id, issuer_nation_id, holder_faction_id,
        principal, coupon_rate,
        issued_at_tick, matures_at_tick
    ) VALUES (
        v_request.id, v_request.issuer_nation_id, p_buyer_faction_id,
        p_amount, COALESCE(v_request.coupon_rate, 0.005),
        v_request.created_tick, v_request.created_tick + COALESCE(v_request.term_months, 36)
    )
    RETURNING id INTO v_holding_id;

    -- Decrement remaining; flip funded if exhausted.
    UPDATE finance_loan_requests
       SET principal_remaining = COALESCE(principal_remaining, amount) - p_amount,
           status = CASE WHEN COALESCE(principal_remaining, amount) - p_amount = 0
                         THEN 'funded' ELSE status END,
           funded_tick = CASE WHEN COALESCE(principal_remaining, amount) - p_amount = 0
                              THEN v_tick ELSE funded_tick END
     WHERE id = p_request_id;

    RETURN jsonb_build_object(
        'success',         true,
        'holding_id',      v_holding_id,
        'principal',       p_amount,
        'coupon_rate',     COALESCE(v_request.coupon_rate, 0.005),
        'matures_at_tick', v_request.created_tick + COALESCE(v_request.term_months, 36)
    );
END;
$fn$;

GRANT EXECUTE ON FUNCTION buy_bond(UUID, UUID, BIGINT) TO authenticated;
