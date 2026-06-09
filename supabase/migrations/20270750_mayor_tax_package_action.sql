-- ════════════════════════════════════════════════════════════════════
-- 20270750 — Mayor Tax Package action + city tax-discount mechanic
--
-- Per user spec:
--   • Third Mayor action: TAX PACKAGE. Mayor picks Minor / Moderate
--     / Major. Pay an upfront city stat hit; the city gains N
--     "discount charges" that take 10% off the next N construction
--     requests in this city.
--   • Tiers:
--       Minor    −1 Growth, −1 Jobs   → 2 charges
--       Moderate −2 Growth, −2 Jobs   → 3 charges
--       Major    −3 Growth, −3 Jobs   → 5 charges
--   • Each time a construction request is posted in this city while
--     charges > 0:
--       — Reference build_cost gets an additional ×0.90 on top of
--         the existing Jobs discount (multiplicative).
--       — Counter decrements by 1.
--       — City gets +1 Growth +1 Jobs (clamped 1-10) as the
--         Mayor's "rebate" for the construction agreement.
--   • Stacking blocked while a package is active (charges > 0)
--     per user choice.
--   • Trigger at request-posted time (not bid-accepted) per user
--     choice — keeps build_cost stable for bidders.
--
-- Cooldown: shares next_member_action_tick with Collect Taxes +
-- Campaign, matching the existing Mayor action pattern.
--
-- Insufficient-stat guard: Mayor can't drop city Growth or Jobs
-- below 1. Reject with insufficient_growth / insufficient_jobs so
-- the UI can surface a specific reason.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ════════════════════════════════════════════════════════════════════
-- 1. Schema: cities.tax_package_discount_charges
-- ════════════════════════════════════════════════════════════════════
ALTER TABLE public.cities
    ADD COLUMN IF NOT EXISTS tax_package_discount_charges int NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.cities.tax_package_discount_charges IS
    'Remaining −10%% construction-discount charges granted by a Mayor Tax Package (20270750). Decrements on every construction request posted in this city while > 0; also gives +1 Growth +1 Jobs rebate per consumed charge.';


-- ════════════════════════════════════════════════════════════════════
-- 2. mayor_enact_tax_package — new Mayor RPC
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.mayor_enact_tax_package(
    p_faction_id uuid,
    p_city_id    uuid,
    p_tier       text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_pol          factions%ROWTYPE;
    v_city         cities%ROWTYPE;
    v_tick         int;
    v_tier         text;
    v_growth_cost  int;
    v_jobs_cost    int;
    v_charges_add  int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL OR p_city_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    v_tier := COALESCE(p_tier, '');
    IF v_tier NOT IN ('minor', 'moderate', 'major') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_tier');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.politician_office <> 'mayor' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_mayor');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF v_pol.next_member_action_tick IS NOT NULL
       AND v_pol.next_member_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'on_cooldown',
            'ready_at_tick', v_pol.next_member_action_tick);
    END IF;

    SELECT * INTO v_city FROM cities WHERE id = p_city_id;
    IF v_city.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'city_not_found');
    END IF;
    -- Mayor-of-this-city check — same name+party stamp pattern the
    -- propose / collect-taxes / campaign actions use.
    IF v_city.nation_id IS DISTINCT FROM v_pol.nation_id
       OR v_city.mayor_first_name IS DISTINCT FROM v_pol.leader_first_name
       OR v_city.mayor_last_name  IS DISTINCT FROM v_pol.leader_last_name
       OR v_city.mayor_party_id   IS DISTINCT FROM v_pol.politician_party_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_this_citys_mayor');
    END IF;

    IF COALESCE(v_city.tax_package_discount_charges, 0) > 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'package_active',
            'charges_remaining', v_city.tax_package_discount_charges);
    END IF;

    -- Tier → upfront cost + charges granted.
    IF v_tier = 'minor' THEN
        v_growth_cost := 1; v_jobs_cost := 1; v_charges_add := 2;
    ELSIF v_tier = 'moderate' THEN
        v_growth_cost := 2; v_jobs_cost := 2; v_charges_add := 3;
    ELSE  -- major
        v_growth_cost := 3; v_jobs_cost := 3; v_charges_add := 5;
    END IF;

    -- Require enough headroom to pay the upfront cost without
    -- dropping below the 1-10 stat floor.
    IF COALESCE(v_city.growth, 5) - v_growth_cost < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_growth',
            'have', v_city.growth, 'need', v_growth_cost + 1);
    END IF;
    IF COALESCE(v_city.jobs, 5) - v_jobs_cost < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_jobs',
            'have', v_city.jobs, 'need', v_jobs_cost + 1);
    END IF;

    UPDATE cities
       SET growth = LEAST(10, GREATEST(1, COALESCE(growth, 5) - v_growth_cost)),
           jobs   = LEAST(10, GREATEST(1, COALESCE(jobs, 5)   - v_jobs_cost)),
           tax_package_discount_charges = v_charges_add
     WHERE id = p_city_id;

    UPDATE factions
       SET next_member_action_tick = v_tick + 1
     WHERE id = v_pol.id;

    RETURN jsonb_build_object(
        'success',          true,
        'tier',             v_tier,
        'charges',          v_charges_add,
        'growth_cost',      v_growth_cost,
        'jobs_cost',        v_jobs_cost,
        'next_action_tick', v_tick + 1
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.mayor_enact_tax_package(uuid, uuid, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.mayor_enact_tax_package(uuid, uuid, text) TO authenticated;


-- ════════════════════════════════════════════════════════════════════
-- 3. request_building_construction — tax package discount + rebate
-- ════════════════════════════════════════════════════════════════════
-- Replaces the 20270749 7-arg version. Two additions on top:
--   • If cities.tax_package_discount_charges > 0 at request time,
--     apply an extra ×0.90 to the already-Jobs-discounted cost
--     (multiplicative). Treasury check uses the final discounted
--     cost. build_cost stored is the final value bidders see.
--   • On successful insert, decrement the city's charge counter
--     by 1 and bump +1 Growth +1 Jobs (clamped 1-10) — the
--     Mayor's "rebate" per construction agreement.
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
    v_uid                uuid := auth.uid();
    v_fac                factions%ROWTYPE;
    v_corp               entrepreneur_corps%ROWTYPE;
    v_req_sector         text;
    v_prof               record;
    v_nation             record;
    v_city               cities%ROWTYPE;
    v_jobs               int;
    v_jobs_discount_pct  numeric;
    v_tax_active         boolean;
    v_discounted_cost    bigint;
    v_tick               int;
    v_id                 uuid;
    v_num                text;
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

    SELECT * INTO v_city FROM cities WHERE id = p_city_id FOR UPDATE;
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
    -- per 20270736; NULL falls back to 0 (no discount).
    v_jobs              := COALESCE(v_city.jobs, 0);
    v_jobs_discount_pct := v_jobs * 0.03;
    v_discounted_cost   := ROUND(v_prof.cost * (1 - v_jobs_discount_pct))::bigint;

    -- Tax Package discount: extra ×0.90 if charges remain. Multiplicative
    -- on top of the Jobs discount.
    v_tax_active := COALESCE(v_city.tax_package_discount_charges, 0) > 0;
    IF v_tax_active THEN
        v_discounted_cost := ROUND(v_discounted_cost * 0.90)::bigint;
    END IF;

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

    -- Tax Package consumption: decrement charge, rebate +1 Growth +1 Jobs.
    IF v_tax_active THEN
        UPDATE cities
           SET tax_package_discount_charges = GREATEST(0, COALESCE(tax_package_discount_charges, 0) - 1),
               growth = LEAST(10, GREATEST(1, COALESCE(growth, 5) + 1)),
               jobs   = LEAST(10, GREATEST(1, COALESCE(jobs, 5)   + 1))
         WHERE id = p_city_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true, 'contract_id', v_id, 'contract_number', v_num,
        'building_type', p_building_type, 'tier', v_prof.eff_tier,
        'cost', v_discounted_cost, 'base_cost', v_prof.cost,
        'jobs_discount_pct', v_jobs_discount_pct,
        'tax_package_applied', v_tax_active,
        'duration', v_prof.duration,
        'bidding_closes_tick', v_tick + GREATEST(1, COALESCE(p_bidding_ticks, 6))
    );
END;
$$;

NOTIFY pgrst, 'reload schema';

COMMIT;
