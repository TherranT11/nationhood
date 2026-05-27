-- ════════════════════════════════════════════════════════════════════
-- EXPAND INFRASTRUCTURE → entrepreneur construction corps bid on it
-- ════════════════════════════════════════════════════════════════════
-- The Interior Minister's Expand Infrastructure used to post a corp_contracts
-- GOVERNMENT row — a bid pipeline with no live bidders (place_construction_bid
-- has no caller). Repoint it to the LIVE ent_construction_contracts system as a
-- 'government' contract: player-run construction corps (industry='construction'
-- with a completed Construction Yard in the nation) bid through the existing
-- ent_place_construction_bid flow, the lowest bid auto-wins at close, and on
-- completion process_ent_construction_contracts pays the winner from the national
-- budget and applies the tier's stat effects to the nation (its government branch
-- already does this). Stat-only — no building is delivered (building_type NULL).
--
-- No bid floor (build_cost = 0): bids range up to the tier budget, lowest wins.
-- The Interior post fee still comes from the ministry discretionary balance; the
-- winning bid is paid from nations.budget at completion.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION post_interior_infrastructure(p_size TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller      UUID := auth.uid();
    v_tier        JSONB;
    v_ministry    ministries%ROWTYPE;
    v_nation_id   UUID;
    v_tick        INT;
    v_existing    UUID;
    v_contract_id UUID;
    v_contract_no TEXT;
    v_year        INT;
    v_name        TEXT;
    v_post_cost   BIGINT;
    v_budget      BIGINT;
    v_timeline    INT;
    v_spec_tier   TEXT;
    v_balance     NUMERIC;
    v_eff         JSONB;
BEGIN
    v_tier := interior_infrastructure_tiers() -> p_size;
    IF v_tier IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid tier: ' || COALESCE(p_size, 'NULL'));
    END IF;

    SELECT * INTO v_ministry FROM ministries
        WHERE ministry_key = 'interior' AND is_active = true
          AND EXISTS (SELECT 1 FROM factions f
                      WHERE f.id = ministries.party_id AND (f.id = v_caller OR f.linked_user_id = v_caller))
        ORDER BY created_at DESC LIMIT 1
        FOR UPDATE;
    IF v_ministry.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Only the active Interior Minister can post this contract');
    END IF;
    v_nation_id := v_ministry.nation_id;
    v_balance   := COALESCE(v_ministry.discretionary_balance, 0);

    v_post_cost := (v_tier->>'post_cost')::BIGINT;
    IF v_balance < v_post_cost THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Insufficient discretionary balance — post fee is $%s; ministry has $%s',
                to_char(v_post_cost, 'FM999,999,999'), to_char(v_balance, 'FM999,999,999')),
            'balance', v_balance, 'cost', v_post_cost);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Shard not found');
    END IF;

    -- Cap: one open/active government infrastructure contract per nation.
    SELECT id INTO v_existing FROM ent_construction_contracts
        WHERE issuer_nation_id = v_nation_id AND contract_type = 'government'
          AND status IN ('open', 'active') LIMIT 1;
    IF v_existing IS NOT NULL THEN
        RETURN jsonb_build_object('success', false,
            'error', 'An Interior Infrastructure contract is already open or active for this nation. Wait for it to complete or be cancelled before posting another.');
    END IF;

    UPDATE ministries SET discretionary_balance = v_balance - v_post_cost WHERE id = v_ministry.id;

    v_year        := 2000 + (v_tick / 12);
    v_contract_no := 'INT-' || v_year::TEXT || '-' || lpad((floor(random() * 1000)::INT)::TEXT, 3, '0');
    v_name        := v_tier->>'name';
    v_budget      := (v_tier->>'budget')::BIGINT;
    v_timeline    := (v_tier->>'timeline')::INT;
    v_spec_tier   := CASE p_size WHEN 'small' THEN 'light' WHEN 'modest' THEN 'heavy'
                                 WHEN 'extravagant' THEN 'mega' ELSE 'light' END;
    -- Map the tier's stat_effects → the gov completion_effects shape {gdp, sol, approval}.
    v_eff := jsonb_build_object(
        'gdp',      COALESCE((SELECT (e->>'delta')::numeric FROM jsonb_array_elements(v_tier->'stat_effects') e WHERE e->>'stat' = 'gdp_growth'), 0),
        'sol',      COALESCE((SELECT (e->>'delta')::numeric FROM jsonb_array_elements(v_tier->'stat_effects') e WHERE e->>'stat' = 'standard_of_living'), 0),
        'approval', COALESCE((SELECT (e->>'delta')::numeric FROM jsonb_array_elements(v_tier->'stat_effects') e WHERE e->>'stat' = 'public_approval'), 0)
    );

    -- Government, stat-only (building_type NULL), no bid floor (build_cost 0),
    -- nation_id = issuer so the CY-in-nation bid gate + bidders' panel surface it.
    INSERT INTO ent_construction_contracts (
        contract_number, name, contract_type, issuer_nation_id, nation_id, issuer_name,
        building_type, spec_tier, build_cost, budget, timeline_ticks,
        bidding_closes_tick, completion_effects, created_at_tick
    ) VALUES (
        v_contract_no, v_name, 'government', v_nation_id, v_nation_id, 'Ministry of the Interior',
        NULL, v_spec_tier, 0, v_budget, v_timeline,
        v_tick + 6, v_eff, v_tick
    ) RETURNING id INTO v_contract_id;

    RETURN jsonb_build_object('success', true, 'contract_id', v_contract_id,
        'tier', p_size, 'name', v_name, 'post_cost', v_post_cost, 'budget', v_budget, 'timeline', v_timeline);
END;
$$;

GRANT EXECUTE ON FUNCTION post_interior_infrastructure(TEXT) TO authenticated;

COMMENT ON FUNCTION post_interior_infrastructure(TEXT) IS
    'Ministry of the Interior — Expand Infrastructure. Posts a government ent_construction_contracts row (stat-only, building_type NULL, no bid floor) for the chosen tier; entrepreneur construction corps with a Construction Yard in the nation bid via ent_place_construction_bid, lowest auto-wins at close, and process_ent_construction_contracts'' government branch pays the winner from nations.budget and applies the tier stat effects on completion. One open/active per nation. Post fee from ministry discretionary.';

-- Extend the bid gate so GOVERNMENT infrastructure also requires a completed
-- Construction Yard in the contract's nation (it previously only gated
-- building-delivery contracts). Body reproduced from 20270225 with the one
-- condition widened; floor stays build_cost (0 for gov → any positive bid).
CREATE OR REPLACE FUNCTION public.ent_place_construction_bid(
    p_corp_id     uuid,
    p_contract_id uuid,
    p_bid_amount  bigint
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid      uuid := auth.uid();
    v_fac      factions%ROWTYPE;
    v_corp     entrepreneur_corps%ROWTYPE;
    v_contract ent_construction_contracts%ROWTYPE;
    v_has_cy   boolean;
    v_tick     int;
BEGIN
    IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated'); END IF;
    IF p_bid_amount IS NULL OR p_bid_amount <= 0 THEN RETURN jsonb_build_object('success', false, 'reason', 'invalid_amount'); END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id;
    IF v_corp.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found'); END IF;
    IF v_corp.industry <> 'construction' THEN RETURN jsonb_build_object('success', false, 'reason', 'not_construction'); END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur' AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1;
    IF v_fac.id IS NULL OR v_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    SELECT * INTO v_contract FROM ent_construction_contracts WHERE id = p_contract_id FOR UPDATE;
    IF v_contract.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'contract_not_found'); END IF;
    IF v_contract.status <> 'open' THEN RETURN jsonb_build_object('success', false, 'reason', 'not_open'); END IF;
    IF v_contract.issuer_corp_id IS NOT NULL AND v_contract.issuer_corp_id = p_corp_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'own_contract');
    END IF;
    IF p_bid_amount > v_contract.budget THEN
        RETURN jsonb_build_object('success', false, 'reason', 'over_budget', 'budget', v_contract.budget);
    END IF;

    -- Local-presence + floor gates: building-delivery contracts AND government
    -- infrastructure both require a completed Construction Yard in the nation.
    IF v_contract.building_type IS NOT NULL OR v_contract.contract_type = 'government' THEN
        SELECT EXISTS (
            SELECT 1 FROM corp_buildings
             WHERE owner_corp_id = p_corp_id AND nation_id = v_contract.nation_id
               AND building_type = 'construction_yard' AND status = 'completed'
        ) INTO v_has_cy;
        IF NOT v_has_cy THEN
            RETURN jsonb_build_object('success', false, 'reason', 'no_cy_in_nation');
        END IF;
        IF v_contract.build_cost IS NOT NULL AND p_bid_amount < v_contract.build_cost THEN
            RETURN jsonb_build_object('success', false, 'reason', 'bid_below_floor', 'floor', v_contract.build_cost);
        END IF;
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    INSERT INTO ent_construction_bids (contract_id, bidder_corp_id, bid_amount, created_tick)
    VALUES (p_contract_id, p_corp_id, p_bid_amount, v_tick)
    ON CONFLICT (contract_id, bidder_corp_id)
        DO UPDATE SET bid_amount = EXCLUDED.bid_amount, status = 'pending', created_tick = EXCLUDED.created_tick;

    RETURN jsonb_build_object('success', true, 'bid_amount', p_bid_amount);
END;
$$;
GRANT EXECUTE ON FUNCTION public.ent_place_construction_bid(uuid, uuid, bigint) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
