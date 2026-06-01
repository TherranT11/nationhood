-- ════════════════════════════════════════════════════════════════════
-- Building requests — drop the budget cap
--
-- Player wanted the budget input gone from the request modal: the
-- issuer puts in just (name, type, tier, nation) and lets bidders
-- offer whatever they want, even below their own distance-adjusted
-- cost. The old flow required the issuer to set a max-payable budget
-- and gated all bids by it.
--
-- Three surgical changes:
--   1. ent_construction_contracts.budget made nullable. Other contract
--      flows (ent_issue_private_construction_contract — spec'd labor
--      jobs with light/heavy/mega tier; government infrastructure
--      RFPs) still set and consume it, so the column stays.
--   2. request_building_construction loses its p_budget parameter.
--      Building-delivery rows now ship with budget = NULL.
--   3. ent_place_construction_bid drops the bid-below-floor check
--      entirely. The over-budget check stays in place but auto-skips
--      when budget IS NULL (PostgreSQL: `x > NULL` is NULL, falsy in
--      IF) — so non-building contracts (which still set budget) keep
--      their existing cap behaviour.
--
-- Issuer-side sanity check (treasury >= construction floor) at request
-- time is KEPT. Bidders can still bid above the floor, but the issuer
-- has at least enough to cover the floor case. The issuer pays the
-- winning bid at completion — if a wildly-high bid is accepted and
-- the issuer can't pay then, that's the existing completion-failure
-- path's concern (out of scope for this migration).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Schema: make budget nullable ─────────────────────────────────
ALTER TABLE ent_construction_contracts
    ALTER COLUMN budget DROP NOT NULL;
-- The shipped 20270216 CHECK was `CHECK (budget > 0)`. CHECK constraints
-- on a single column allow NULL by default, so dropping NOT NULL is
-- the only change; the CHECK keeps the positive constraint on
-- non-NULL rows (private spec jobs, government infra).

-- ── 2. request_building_construction — drop p_budget ────────────────
-- Old signature dropped explicitly so we don't leave a 7-param ghost
-- on the schema. New body = 20270225 minus the p_budget parameter,
-- the budget validation, and the budget column on the INSERT.
DROP FUNCTION IF EXISTS public.request_building_construction(uuid, text, text, uuid, text, bigint, int);

CREATE OR REPLACE FUNCTION public.request_building_construction(
    p_corp_id       uuid,
    p_name          text,
    p_building_type text,
    p_nation_id     uuid,
    p_tier          text,
    p_bidding_ticks int
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_fac          factions%ROWTYPE;
    v_corp         entrepreneur_corps%ROWTYPE;
    v_req_sector   text;
    v_prof         record;
    v_nation_name  text;
    v_tick         int;
    v_id           uuid;
    v_num          text;
BEGIN
    IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated'); END IF;
    IF p_corp_id IS NULL OR p_nation_id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments'); END IF;
    IF p_name IS NULL OR length(btrim(p_name)) < 2 OR length(btrim(p_name)) > 80 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_name');
    END IF;
    IF p_building_type NOT IN ('regional_hq','construction_yard','port','banking_office',
                               'real_estate_office','engine_assembly_plant','light_assembly_plant') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_building_type');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id;
    IF v_corp.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found'); END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur' AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1;
    IF v_fac.id IS NULL OR v_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    v_req_sector := corp_building_required_sector(p_building_type);
    IF v_req_sector IS NOT NULL AND v_req_sector <> v_corp.industry THEN
        RETURN jsonb_build_object('success', false, 'reason', 'wrong_sector',
            'required', v_req_sector, 'have', v_corp.industry);
    END IF;

    SELECT name INTO v_nation_name FROM nations WHERE id = p_nation_id;
    IF v_nation_name IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'nation_not_found'); END IF;

    SELECT * INTO v_prof FROM corp_building_cost_profile(p_building_type, p_tier, p_nation_id);
    IF v_prof.cost IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'invalid_tier'); END IF;
    IF p_building_type = 'regional_hq' AND v_prof.eff_tier NOT IN ('small','medium','large') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_rhq_tier');
    END IF;

    -- Issuer-side sanity: treasury must at least cover the floor at
    -- request time. The actual payment happens at completion against
    -- the winning bid (which can be above or below the floor — the
    -- user's design lets bidders offer any price).
    IF COALESCE(v_corp.treasury_cash, 0) < v_prof.cost THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'have', COALESCE(v_corp.treasury_cash, 0)::bigint, 'need', v_prof.cost);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    v_num  := 'BLD-' || v_tick || '-' || left(replace(gen_random_uuid()::text, '-', ''), 5);

    -- budget column omitted from INSERT → defaults to NULL.
    -- Other contract flows still populate it; this one leaves it open
    -- so the over_budget check in ent_place_construction_bid auto-skips
    -- for building-delivery RFPs.
    INSERT INTO ent_construction_contracts (
        contract_number, name, contract_type, issuer_corp_id, issuer_name,
        building_type, nation_id, tier, build_cost, spec_tier, timeline_ticks,
        bidding_closes_tick, completion_effects, created_at_tick
    ) VALUES (
        v_num, btrim(p_name), 'private', p_corp_id, v_corp.name,
        p_building_type, p_nation_id, v_prof.eff_tier, v_prof.cost, NULL, v_prof.duration,
        v_tick + GREATEST(1, COALESCE(p_bidding_ticks, 6)), '{}'::jsonb, v_tick
    ) RETURNING id INTO v_id;

    RETURN jsonb_build_object('success', true, 'contract_id', v_id,
        'floor', v_prof.cost, 'timeline_ticks', v_prof.duration,
        'bidding_closes_tick', v_tick + GREATEST(1, COALESCE(p_bidding_ticks, 6)));
END;
$$;
GRANT EXECUTE ON FUNCTION public.request_building_construction(uuid, text, text, uuid, text, int) TO authenticated;

COMMENT ON FUNCTION public.request_building_construction(uuid, text, text, uuid, text, int) IS
    'Building-delivery RFP. Issuer specifies name + type + tier + nation + bidding-window length. No budget cap (per 20270429) — bidders can offer any positive price including below their own distance-adjusted cost. Issuer pays the winning bid at completion. Sanity check at post time: treasury >= floor cost (cheapest possible outcome).';

-- ── 3. ent_place_construction_bid — drop the bid-below-floor check ──
-- Body = 20270350 minus the IF v_contract.build_cost IS NOT NULL AND
-- p_bid_amount < v_contract.build_cost branch. Over-budget check
-- stays — naturally skips when v_contract.budget IS NULL (the new
-- building-delivery state); still fires for non-building contracts
-- (private spec jobs, government infra) that set budget.
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
    -- over_budget naturally skipped when budget IS NULL (building RFPs
    -- under 20270429). Still fires for non-building contracts.
    IF p_bid_amount > v_contract.budget THEN
        RETURN jsonb_build_object('success', false, 'reason', 'over_budget', 'budget', v_contract.budget);
    END IF;

    -- Local-presence gate: building-delivery + government infrastructure
    -- both require a completed Construction Yard in the contract nation.
    -- The bid-below-floor gate was dropped in 20270429 — bidders may
    -- now offer below their own distance-adjusted cost.
    IF v_contract.building_type IS NOT NULL OR v_contract.contract_type = 'government' THEN
        SELECT EXISTS (
            SELECT 1 FROM corp_buildings
             WHERE owner_corp_id = p_corp_id AND nation_id = v_contract.nation_id
               AND building_type = 'construction_yard' AND status = 'completed'
        ) INTO v_has_cy;
        IF NOT v_has_cy THEN
            RETURN jsonb_build_object('success', false, 'reason', 'no_cy_in_nation');
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

COMMENT ON FUNCTION public.ent_place_construction_bid(uuid, uuid, bigint) IS
    'Construction corp places a bid on an open contract. Gates: caller is a construction corp; not the issuer; over_budget if budget IS NOT NULL; (building-delivery + government infra) bidder owns a completed Construction Yard in the contract nation. 20270429 dropped the bid-below-floor gate — bidders may offer below their distance-adjusted cost.';

NOTIFY pgrst, 'reload schema';

COMMIT;
