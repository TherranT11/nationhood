-- 20260812_construction_bid_supply_chain_cost.sql
--
-- Design change: every construction bid burns Supply Chain.
--   • Bidding on a contract in your own nation:   −1.0 Supply Chain
--   • Bidding on a contract in another nation:    −1.5 Supply Chain
--
-- Re-defines place_construction_bid (latest body from 20260807). Adds
-- the decay step after the bid row is upserted, so a validation failure
-- earlier in the function leaves Supply Chain untouched. Floors at 0
-- (the bid cost-formula assumes the stat in [0, 10]; going negative
-- would invert the supply_mult and silently inflate every future bid).
--
-- Idempotent CREATE OR REPLACE. The bid amount itself is still
-- computed from the corp's PRE-decay supply chain — the decay applies
-- to the next bid, not this one.

BEGIN;

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

    -- ── Supply Chain decay (new in this migration) ───────────────
    -- Cross-nation bids cost more because logistics get harder when
    -- you're sourcing across borders. Same-nation contracts are -1.0.
    -- A NULL issuer_nation_id (system / unscoped contract) is treated
    -- as foreign — there's no "home" for the contract to share with.
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
