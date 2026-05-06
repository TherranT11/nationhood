-- 20260915_stadium_costs_to_nation_budget.sql
--
-- Design change: Sports Minister actions (Invest in National Sports
-- Culture, Expand Stadium Infrastructure) now pull from nation.budget
-- (abstract dollars, $5 = $5) instead of ministries.discretionary_balance
-- (raw dollars, $5M = 5,000,000). If budget runs negative, the per-tick
-- balance math (processNationDebtTick) sweeps the shortfall into debt
-- next tick.
--
-- Only the cancel-refund target needs an SQL change. The post / accept
-- / reject flows for stadiums never touched discretionary in the
-- minister's faction's row; they only checked ministry ownership. So
-- this migration replaces cancel_stadium_contract to refund nation.budget
-- with the new abstract postingCost mapping ($3 / $7 / $10 instead of
-- $3M / $7M / $10M).

BEGIN;

CREATE OR REPLACE FUNCTION cancel_stadium_contract(p_contract_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_caller         UUID := auth.uid();
    v_contract       corp_contracts%ROWTYPE;
    v_refund_amount  NUMERIC := 0;
BEGIN
    SELECT * INTO v_contract FROM corp_contracts WHERE id = p_contract_id FOR UPDATE;
    IF v_contract.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Contract not found');
    END IF;
    IF v_contract.status <> 'open' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Contract is no longer open');
    END IF;
    IF v_contract.project_subtype <> 'Vola Stadium' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not a stadium contract');
    END IF;
    IF v_caller IS NOT NULL AND NOT _is_active_sports_minister(v_contract.issuer_nation_id, v_caller) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Only the Sports Minister can cancel this contract');
    END IF;

    -- Refund mapping: spec_category → posting cost in abstract dollars.
    -- Mirrors VOLA_STADIUM_TIERS.postingCost in js/game/political-actions.js.
    v_refund_amount := CASE v_contract.spec_category
        WHEN 'Light Infrastructure' THEN 3
        WHEN 'Heavy Infrastructure' THEN 7
        WHEN 'Megaproject'          THEN 10
        ELSE 0
    END;

    -- Cancel contract.
    UPDATE corp_contracts SET status = 'cancelled' WHERE id = p_contract_id;

    -- Reject any pending bids on this contract.
    UPDATE corp_contract_bids
       SET status = 'rejected'
     WHERE contract_id = p_contract_id AND status = 'pending';

    -- Refund to the issuing nation's budget (no floor — already-negative
    -- budget gets brought less negative).
    IF v_refund_amount > 0 THEN
        UPDATE nations
           SET budget = COALESCE(budget, 0) + v_refund_amount
         WHERE id = v_contract.issuer_nation_id;
    END IF;

    RETURN jsonb_build_object('success', true, 'refund_amount', v_refund_amount);
END;
$$;

GRANT EXECUTE ON FUNCTION cancel_stadium_contract(UUID) TO authenticated;

COMMENT ON FUNCTION cancel_stadium_contract(UUID) IS
  'Sports Minister cancels an open stadium contract. Refunds the abstract-dollar posting cost ($3/$7/$10 by spec_category) to nation.budget and rejects any pending bids.';

NOTIFY pgrst, 'reload schema';

COMMIT;
