-- ════════════════════════════════════════════════════════════════════
-- 20270749 — Request Construction: city picker, Jobs discount,
-- construction-start Growth bump
--
-- Design change per user spec:
--   1. Building requests now target a SPECIFIC CITY in the chosen
--      nation, not the nation at large. ent_construction_contracts
--      gains a city_id column (nullable for back-compat with the
--      handful of pre-cut-over open contracts).
--   2. That city's `jobs` stat (1-10) drives a discount on the
--      reference build_cost:  -3% per 1 Job. A jobs=7 city → -21%,
--      a jobs=10 city → -30%. No explicit clamp per user choice;
--      the cities.jobs column is already 1-10-constrained
--      (20270736), so the natural discount range is 3-30%.
--   3. When construction STARTS (bid accepted / auto-awarded), the
--      target city gets +1 Growth (one-time, clamped 1-10).
--
-- _ent_award_construction_contract is the single chokepoint for
-- "construction starts" (both manual accept via
-- ent_accept_construction_bid AND the tick-driven auto-award call
-- it from the same code path), so the Growth bump lives there once.
--
-- Forward-only. Existing contracts with city_id IS NULL still
-- award and complete normally; the +1 Growth simply doesn't fire
-- when there's no city to credit it to.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ════════════════════════════════════════════════════════════════════
-- 1. Schema: ent_construction_contracts.city_id
-- ════════════════════════════════════════════════════════════════════
ALTER TABLE public.ent_construction_contracts
    ADD COLUMN IF NOT EXISTS city_id uuid REFERENCES public.cities(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS ent_construction_contracts_city_idx
    ON public.ent_construction_contracts (city_id);

COMMENT ON COLUMN public.ent_construction_contracts.city_id IS
    'Target city for the build (20270749). NULL only for legacy rows posted before the city-picker requirement landed. The +1 Growth bump on construction start applies to this city.';


-- ════════════════════════════════════════════════════════════════════
-- 2. request_building_construction — city pick + Jobs discount
-- ════════════════════════════════════════════════════════════════════
-- Signature gains p_city_id (last arg so existing positional callers
-- still bind cleanly). Validation:
--   • p_city_id must reference a city in p_nation_id.
--   • cities.jobs read once and applied as a flat -3%-per-Jobs
--     discount to v_prof.cost. Final build_cost is rounded to a
--     bigint and stored — bidders see the discounted reference,
--     treasury sanity check uses the discounted value.
CREATE OR REPLACE FUNCTION public.request_building_construction(
    p_corp_id       uuid,
    p_name          text,
    p_building_type text,
    p_nation_id     uuid,
    p_tier          text,
    p_bidding_ticks int,
    p_city_id       uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid             uuid := auth.uid();
    v_fac             factions%ROWTYPE;
    v_corp            entrepreneur_corps%ROWTYPE;
    v_req_sector      text;
    v_prof            record;
    v_nation          record;
    v_city            cities%ROWTYPE;
    v_jobs            int;
    v_discount_pct    numeric;
    v_discounted_cost bigint;
    v_tick            int;
    v_id              uuid;
    v_num             text;
BEGIN
    IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated'); END IF;
    IF p_corp_id IS NULL OR p_nation_id IS NULL OR p_city_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_name IS NULL OR length(btrim(p_name)) < 2 OR length(btrim(p_name)) > 80 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_name');
    END IF;
    IF p_building_type NOT IN ('regional_hq','construction_yard','port','banking_office',
                               'real_estate_office','engine_assembly_plant','light_assembly_plant',
                               'aircraft_assembly_facility',
                               'apartment_basic','apartment_modest','apartment_luxury',
                               'pump_jack','refinery_small','refinery_regular','refinery_large',
                               'gas_station') THEN
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

    SELECT name, foundable_for_construction
      INTO v_nation
      FROM nations WHERE id = p_nation_id;
    IF v_nation.name IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'nation_not_found'); END IF;
    IF v_nation.foundable_for_construction IS NOT TRUE THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_buildable');
    END IF;

    SELECT * INTO v_city FROM cities WHERE id = p_city_id;
    IF v_city.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'city_not_found');
    END IF;
    IF v_city.nation_id IS DISTINCT FROM p_nation_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'city_wrong_nation');
    END IF;

    SELECT * INTO v_prof FROM corp_building_cost_profile(p_building_type, p_tier, p_nation_id);
    IF v_prof.cost IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'invalid_tier'); END IF;
    IF p_building_type = 'regional_hq' AND v_prof.eff_tier NOT IN ('small','medium','large') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_rhq_tier');
    END IF;

    -- Jobs discount: -3% per 1 Jobs. cities.jobs is 1-10-constrained
    -- per 20270736; NULL falls back to 0 (no discount) so a not-yet-
    -- seeded city doesn't crash the math.
    v_jobs            := COALESCE(v_city.jobs, 0);
    v_discount_pct    := v_jobs * 0.03;
    v_discounted_cost := ROUND(v_prof.cost * (1 - v_discount_pct))::bigint;

    IF COALESCE(v_corp.treasury_cash, 0) < v_discounted_cost THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'have', COALESCE(v_corp.treasury_cash, 0)::bigint, 'need', v_discounted_cost);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    v_num  := 'BLD-' || v_tick || '-' || left(replace(gen_random_uuid()::text, '-', ''), 5);

    INSERT INTO ent_construction_contracts (
        contract_number, name, contract_type, issuer_corp_id, issuer_name,
        building_type, nation_id, city_id, tier, build_cost, spec_tier, timeline_ticks,
        bidding_closes_tick, completion_effects, created_at_tick
    ) VALUES (
        v_num, btrim(p_name), 'private', p_corp_id, v_corp.name,
        p_building_type, p_nation_id, p_city_id, v_prof.eff_tier, v_discounted_cost,
        NULL, v_prof.duration,
        v_tick + GREATEST(1, COALESCE(p_bidding_ticks, 6)), '{}'::jsonb, v_tick
    ) RETURNING id INTO v_id;

    RETURN jsonb_build_object(
        'success', true, 'contract_id', v_id, 'contract_number', v_num,
        'building_type', p_building_type, 'tier', v_prof.eff_tier,
        'cost', v_discounted_cost, 'base_cost', v_prof.cost,
        'jobs_discount_pct', v_discount_pct,
        'duration', v_prof.duration,
        'bidding_closes_tick', v_tick + GREATEST(1, COALESCE(p_bidding_ticks, 6))
    );
END;
$$;

-- Drop the previous 6-arg signature so PostgREST routes to the new
-- 7-arg version. CREATE OR REPLACE only matches on full arg list, so
-- without the drop both versions would co-exist and PostgREST would
-- error on ambiguous resolution.
DROP FUNCTION IF EXISTS public.request_building_construction(uuid, text, text, uuid, text, int);


-- ════════════════════════════════════════════════════════════════════
-- 3. _ent_award_construction_contract — +1 Growth on start
-- ════════════════════════════════════════════════════════════════════
-- Single chokepoint for "construction starts." Both the manual
-- Accept path (ent_accept_construction_bid) and the tick-driven
-- auto-award call this. Apply the one-time +1 Growth bump on the
-- target city — clamped 1-10 to match the cities stat scale —
-- whenever city_id is set. Legacy contracts with city_id IS NULL
-- just skip the bump.
CREATE OR REPLACE FUNCTION public._ent_award_construction_contract(
    p_contract_id uuid,
    p_bid_id      uuid,
    p_tick        int
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_winner  uuid;
    v_amount  bigint;
    v_city_id uuid;
BEGIN
    SELECT bidder_corp_id, bid_amount INTO v_winner, v_amount
      FROM ent_construction_bids WHERE id = p_bid_id;

    UPDATE ent_construction_contracts
       SET status = 'active', winner_corp_id = v_winner, winning_bid = v_amount,
           started_at_tick = p_tick, progress_ticks = 0
     WHERE id = p_contract_id
    RETURNING city_id INTO v_city_id;

    UPDATE ent_construction_bids SET status = 'won'  WHERE id = p_bid_id;
    UPDATE ent_construction_bids SET status = 'lost'
     WHERE contract_id = p_contract_id AND id <> p_bid_id AND status = 'pending';

    -- Construction-start Growth bump (20270749). One-time, clamped
    -- 1-10. Skipped when the contract pre-dates the city-picker
    -- requirement (city_id IS NULL).
    IF v_city_id IS NOT NULL THEN
        UPDATE cities
           SET growth = LEAST(10, GREATEST(1, COALESCE(growth, 5) + 1))
         WHERE id = v_city_id;
    END IF;
END;
$$;
REVOKE EXECUTE ON FUNCTION public._ent_award_construction_contract(uuid,uuid,int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public._ent_award_construction_contract(uuid,uuid,int) TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
