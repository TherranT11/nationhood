-- ════════════════════════════════════════════════════════════════
-- Drop crews_assigned (Option B: collapse the two-step crew model)
--
-- Background. The original construction-contract design had two
-- crew fields:
--   • corp_contract_bids.crews_committed — locked in at bid time,
--     drives the price multiplier (1.00/1.05/1.10) and the timeline
--     multiplier (1.00/0.80/0.70).
--   • corp_contracts.crews_assigned       — set after winning, via
--     assign_construction_crews; the tick processor stalls progress
--     until crews_assigned >= crews_committed.
--
-- In practice every player corp stalled on first contract because
-- they didn't realise there was a step 2; the supposed "rotate
-- crews across parallel jobs" depth was never used. This migration
-- collapses the model: progress no longer requires a separate
-- assignment step, and bait-and-switch protection moves to bid time
-- via an aggregate crew-cap check inside place_construction_bid.
--
-- Changes:
--   1. DROP FUNCTION assign_construction_crews(UUID, NUMERIC) — both
--      the original signature (20260503) and the total-cap rewrite
--      (20260811) used the same signature; one DROP suffices.
--   2. ALTER TABLE corp_contracts DROP COLUMN crews_assigned (with
--      its CHECK constraint).
--   3. CREATE OR REPLACE place_construction_bid (latest body from
--      20260812) plus an aggregate crew-cap: a corp can't have more
--      crews_committed across every pending+accepted bid than they
--      own work crews. This replaces the bait-and-switch deterrent
--      that the per-tick gate used to provide.
--
-- The edge function (advance-corp-tick) is updated in lockstep to
-- drop the gate; deploy that BEFORE running this migration so a
-- mid-deploy tick doesn't try to read the dropped column.
-- ════════════════════════════════════════════════════════════════

BEGIN;

-- 1. Retire the assign-crews RPC.
DROP FUNCTION IF EXISTS public.assign_construction_crews(UUID, NUMERIC);

-- 2. Drop the column + its CHECK constraint.
ALTER TABLE public.corp_contracts
    DROP CONSTRAINT IF EXISTS corp_contracts_crews_assigned_range;
ALTER TABLE public.corp_contracts
    DROP COLUMN IF EXISTS crews_assigned;

-- 3. Replace place_construction_bid with the aggregate-cap version.
--    Body identical to 20260812 (current latest) except for the new
--    cap block right after the per-bid corp_work_crews check.
CREATE OR REPLACE FUNCTION place_construction_bid(
    p_contract_id        UUID,
    p_bidder_faction_id  UUID,
    p_crews_committed    INT,
    p_markup_pct         INT,
    p_bid_message        TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id   UUID := auth.uid();
    v_contract  corp_contracts%ROWTYPE;
    v_bidder    factions%ROWTYPE;
    v_req       JSONB;
    v_key       TEXT;
    v_threshold NUMERIC;
    v_value     NUMERIC;
    v_tick      INT;
    v_supply_mult NUMERIC;
    v_crew_mult NUMERIC;
    v_crew_time_mult NUMERIC;
    v_base_cost NUMERIC;
    v_bid_amount BIGINT;
    v_quoted_months INT;
    v_bid_fee CONSTANT BIGINT := 50000;
    v_supply_chain_cost NUMERIC;
    v_cross_nation BOOLEAN;
    v_other_committed INT;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;
    SELECT * INTO v_bidder FROM factions WHERE id = p_bidder_faction_id;
    IF v_bidder.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Bidder corporation not found');
    END IF;
    IF v_bidder.id <> v_user_id AND v_bidder.linked_user_id <> v_user_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not own this corporation');
    END IF;
    IF v_bidder.faction_type <> 'corporation' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Only corporations can bid');
    END IF;

    SELECT * INTO v_contract FROM corp_contracts WHERE id = p_contract_id;
    IF v_contract.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Contract not found');
    END IF;
    IF v_contract.status <> 'open' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Contract is not accepting bids');
    END IF;

    IF v_contract.required_sector IS NOT NULL
       AND v_contract.required_sector <> v_bidder.corp_sector THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Requires %s sector', v_contract.required_sector));
    END IF;
    IF p_crews_committed NOT IN (1, 2, 3) THEN
        RETURN jsonb_build_object('success', false, 'error', 'crews_committed must be 1, 2, or 3');
    END IF;
    IF p_markup_pct NOT IN (10, 20, 30, 40, 50) THEN
        RETURN jsonb_build_object('success', false, 'error', 'markup_pct must be one of 10/20/30/40/50');
    END IF;
    IF COALESCE(v_bidder.corp_work_crews, 0) < p_crews_committed THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Insufficient Work Crews — committed %s but you have %s',
                            p_crews_committed, v_bidder.corp_work_crews));
    END IF;

    -- ── Aggregate crew-cap (replaces the per-tick assigned/committed
    --    gate retired in this migration). Sum crews_committed across
    --    every pending or accepted bid for this corp on every OTHER
    --    contract; reject if (other_committed + this_bid) exceeds the
    --    corp's total Work Crews. The current contract is excluded so
    --    re-bidding a contract you already bid on can adjust crews
    --    without double-counting. ──
    SELECT COALESCE(SUM(crews_committed), 0) INTO v_other_committed
      FROM corp_contract_bids
     WHERE faction_id = p_bidder_faction_id
       AND contract_id <> p_contract_id
       AND status IN ('pending', 'accepted');
    IF v_other_committed + p_crews_committed > COALESCE(v_bidder.corp_work_crews, 0) THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Crew capacity exhausted — you have committed %s crews across other live bids and this would push the total to %s, but you only own %s Work Crews. Free up capacity (lose, win-and-finish, or cancel a bid) before bidding again.',
                            v_other_committed,
                            v_other_committed + p_crews_committed,
                            COALESCE(v_bidder.corp_work_crews, 0)));
    END IF;

    v_req := COALESCE(v_contract.requirements, '{}'::jsonb);
    IF jsonb_typeof(v_req) = 'object' THEN
        FOR v_key IN SELECT jsonb_object_keys(v_req) LOOP
            v_threshold := (v_req ->> v_key)::numeric;
            v_value := CASE v_key
                WHEN 'work_crews'          THEN v_bidder.corp_work_crews
                WHEN 'regulatory_standing' THEN v_bidder.corp_regulatory_standing
                WHEN 'supply_chain'        THEN v_bidder.corp_supply_chain
                ELSE NULL
            END;
            IF v_value IS NULL OR v_value < v_threshold THEN
                RETURN jsonb_build_object('success', false,
                    'error', format('Requirement not met: %s ≥ %s', v_key, v_threshold));
            END IF;
        END LOOP;
    END IF;

    IF COALESCE(v_bidder.corp_cash_reserves, 0) < v_bid_fee THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Need $%s to place a bid', to_char(v_bid_fee, 'FM999,999,999')));
    END IF;

    -- Bid amount uses PRE-decay supply chain — the decay applies to
    -- future bids, not this one.
    v_supply_mult := 1.30 - (COALESCE(v_bidder.corp_supply_chain, 0) * 0.06);
    v_crew_mult := CASE p_crews_committed WHEN 1 THEN 1.00 WHEN 2 THEN 1.05 WHEN 3 THEN 1.10 END;
    v_crew_time_mult := CASE p_crews_committed WHEN 1 THEN 1.00 WHEN 2 THEN 0.80 WHEN 3 THEN 0.70 END;

    v_base_cost := v_contract.budget * 0.70;
    v_bid_amount := ROUND(v_base_cost * v_supply_mult * v_crew_mult * (1 + p_markup_pct::numeric / 100))::BIGINT;
    v_quoted_months := ROUND(v_contract.timeline_months * v_crew_time_mult)::INT;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;

    PERFORM emit_corp_cash_event(
        p_bidder_faction_id,
        'capital_out',
        'Bid fee: ' || COALESCE(v_contract.name, 'Unnamed contract'),
        -v_bid_fee,
        v_tick
    );

    INSERT INTO corp_contract_bids (
        contract_id, faction_id, nation_id, ap_spent,
        bid_amount, bid_message, created_at_tick,
        crews_committed, markup_pct, quoted_timeline_months
    ) VALUES (
        p_contract_id, p_bidder_faction_id, v_bidder.nation_id, 0,
        v_bid_amount, p_bid_message, v_tick,
        p_crews_committed, p_markup_pct, v_quoted_months
    )
    ON CONFLICT (contract_id, faction_id) DO UPDATE SET
        bid_amount             = EXCLUDED.bid_amount,
        bid_message            = EXCLUDED.bid_message,
        created_at_tick        = EXCLUDED.created_at_tick,
        crews_committed        = EXCLUDED.crews_committed,
        markup_pct             = EXCLUDED.markup_pct,
        quoted_timeline_months = EXCLUDED.quoted_timeline_months;

    -- Cross-nation bids cost more because logistics get harder when
    -- you're sourcing across borders. Same-nation contracts are -1.0.
    v_cross_nation := v_contract.issuer_nation_id IS NULL
                   OR v_contract.issuer_nation_id <> v_bidder.nation_id;
    v_supply_chain_cost := CASE WHEN v_cross_nation THEN 1.5 ELSE 1.0 END;

    UPDATE factions
    SET corp_supply_chain = GREATEST(0::numeric,
                                     COALESCE(corp_supply_chain, 0) - v_supply_chain_cost)
    WHERE id = p_bidder_faction_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Bid placed',
        'bid_amount', v_bid_amount,
        'quoted_timeline_months', v_quoted_months,
        'crews_committed', p_crews_committed,
        'markup_pct', p_markup_pct,
        'bid_fee', v_bid_fee,
        'supply_chain_cost', v_supply_chain_cost,
        'cross_nation', v_cross_nation
    );
END;
$$;

GRANT EXECUTE ON FUNCTION place_construction_bid(UUID, UUID, INT, INT, TEXT) TO authenticated;

COMMIT;

NOTIFY pgrst, 'reload schema';
