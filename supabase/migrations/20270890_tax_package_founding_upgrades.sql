-- ════════════════════════════════════════════════════════════════════
-- 20270890 — City tax packages discount founding and asset upgrades
--
-- User spec: a mayor's tax package should also take cost off
-- starting a new corporation in that city and off upgrading an
-- asset there, visible in both UIs. The package's one mechanism
-- generalizes: a charge = one discounted economic action in the
-- city (-10%), consumed with its +1 Growth / -1 Unemployment
-- rebate. Consumers now: construction requests (as before),
-- corporation founding, the construction Logistical Overhaul, and
-- automotive asset upgrades (the corp's HQ city is the venue for
-- upgrades — matched by nation + city name, the columns corps
-- actually carry).
--
--   • _consume_tax_package_charge(city) — the one consume+rebate
--     seam; request_building_construction re-emits onto it.
--   • _tax_package_city(nation, name) — the one HQ-city resolver
--     for the name-keyed consumers, locking the charged row so two
--     concurrent actions can't both discount off one charge.
--   • businessman_start_corporation (20270889 body): -10% on the
--     founding cost when the chosen city has charges — banking's
--     20/80 split applies to the discounted figure.
--   • logistical_overhaul (20270852 body) + upgrade_automotive_asset
--     (20270855 body): -10% when the HQ city has charges; consumed
--     on success. All three return tax_package_applied for the UI.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. The consume+rebate seam ────────────────────────────────────
CREATE OR REPLACE FUNCTION public._consume_tax_package_charge(p_city_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    UPDATE cities
       SET tax_package_discount_charges = tax_package_discount_charges - 1,
           growth       = LEAST(10, GREATEST(1, COALESCE(growth, 5) + 1)),
           unemployment = LEAST(10, GREATEST(1, COALESCE(unemployment, 5) - 1))
     WHERE id = p_city_id
       AND COALESCE(tax_package_discount_charges, 0) > 0;
    RETURN FOUND;
END $$;

REVOKE EXECUTE ON FUNCTION public._consume_tax_package_charge(uuid) FROM PUBLIC;

-- The HQ-city resolver for upgrades (corps carry hq_nation_id + a
-- text hq_city, no city id): the charged city's id, or NULL. FOR
-- UPDATE locks the row so check-then-consume serializes — under
-- READ COMMITTED the loser re-evaluates charges > 0 after the lock
-- and pays full price.
CREATE OR REPLACE FUNCTION public._tax_package_city(p_nation_id uuid, p_city_name text)
RETURNS uuid
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
    SELECT id FROM cities
     WHERE nation_id = p_nation_id
       AND lower(city_name) = lower(COALESCE(p_city_name, ''))
       AND COALESCE(tax_package_discount_charges, 0) > 0
     LIMIT 1
     FOR UPDATE
$$;

REVOKE EXECUTE ON FUNCTION public._tax_package_city(uuid, text) FROM PUBLIC;

-- ── 2. Founding ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.businessman_start_corporation(
    p_faction_id uuid,
    p_city_id    uuid,
    p_industry   text,
    p_name       text,
    p_logo_url   text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid    uuid := auth.uid();
    v_fac    factions%ROWTYPE;
    v_city   cities%ROWTYPE;
    v_tick   int;
    v_cost   numeric;
    v_reserve bigint := 0;
    v_tax  boolean := false;
    v_sol    numeric;
    v_corp_id uuid;
    v_name   text;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL OR p_city_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_industry NOT IN ('construction', 'automotive', 'banking') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_industry');
    END IF;
    v_name := btrim(COALESCE(p_name, ''));
    IF length(v_name) < 2 OR length(v_name) > 60 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_name');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE id = p_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'businessman'
       AND abandoned_at IS NULL
     FOR UPDATE;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_businessman');
    END IF;
    IF lower(COALESCE(v_fac.status, '')) = 'arrested' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'arrested');
    END IF;

    -- Locked: the tax-package check below must serialize against a
    -- concurrent consumer of the city's last charge.
    SELECT * INTO v_city FROM cities
     WHERE id = p_city_id AND nation_id = v_fac.nation_id
     FOR UPDATE;
    IF v_city.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_city');
    END IF;

    IF EXISTS (SELECT 1 FROM entrepreneur_corps WHERE lower(name) = lower(v_name)) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'name_taken');
    END IF;

    -- Founding capital — $10M construction / $35M automotive / $50M
    -- banking (20270889), scaled by the nation's Standard of Living
    -- (50 is baseline: SoL 75 costs 1.5×, SoL 40 costs 0.8×).
    -- Banking splits the charge 20/80: a fifth burns as the charter,
    -- the rest is DEPOSITED into the corp treasury as the bank's
    -- opening reserve — a bank with an empty vault is a sign on a
    -- door. Construction/automotive fees burn in full as before.
    SELECT GREATEST(1, COALESCE(standard_of_living, 50)) INTO v_sol
      FROM nations WHERE id = v_fac.nation_id;
    v_cost := ROUND(CASE p_industry
                        WHEN 'banking'    THEN 50000000
                        WHEN 'automotive' THEN 35000000
                        ELSE                   10000000
                    END * COALESCE(v_sol, 50) / 50.0);
    -- City tax package (20270890): an active package in the founding
    -- city discounts the charter 10%; the charge is consumed (with
    -- its +1 Growth / -1 Unemployment rebate) when the corp is born.
    v_tax := COALESCE(v_city.tax_package_discount_charges, 0) > 0;
    IF v_tax THEN
        v_cost := ROUND(v_cost * 0.90);
    END IF;
    v_reserve := CASE WHEN p_industry = 'banking'
                      THEN ROUND(v_cost * 0.80) ELSE 0 END;

    IF COALESCE(v_fac.party_funds, 0) < v_cost THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'cost', v_cost, 'funds', COALESCE(v_fac.party_funds, 0));
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE factions
       SET party_funds = COALESCE(party_funds, 0) - v_cost
     WHERE id = v_fac.id;

    INSERT INTO entrepreneur_corps (
        owner_faction_id, name, industry,
        hq_city, hq_nation_id,
        starting_capital, founding_fee, listing,
        founded_tick, logo_url, experience, treasury_cash
    ) VALUES (
        v_fac.id, v_name, p_industry,
        v_city.city_name, v_fac.nation_id,
        v_reserve, v_cost, 'private',
        v_tick, NULLIF(btrim(COALESCE(p_logo_url, '')), ''),
        -- 20270832: automotive corps open with 5 Experience — the
        -- Design Studio bootstrap (construction earns from builds).
        CASE WHEN p_industry = 'automotive' THEN 5 ELSE 0 END,
        -- Banking: the 80% reserve opens the vault (20270889).
        v_reserve
    ) RETURNING id INTO v_corp_id;

    IF v_tax THEN
        PERFORM _consume_tax_package_charge(p_city_id);
    END IF;

    INSERT INTO event_log (
        nation_id, faction_id,
        event_name, description_used,
        category, trigger_key, fired_at_tick
    ) VALUES (
        v_fac.nation_id, v_fac.id,
        'Corporation Founded',
        COALESCE(v_fac.faction_name, 'A businessman') || ' has founded ' || v_name
            || ' in ' || v_city.city_name || '.',
        'economy', 'businessman_founded_corp', v_tick
    );

    RETURN jsonb_build_object(
        'success',   true,
        'corp_id',   v_corp_id,
        'corp_name', v_name,
        'city',      v_city.city_name,
        'reserve_deposited', v_reserve,
        'tax_package_applied', v_tax,
        'new_funds', COALESCE(v_fac.party_funds, 0) - v_cost
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.businessman_start_corporation(uuid, uuid, text, text, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.businessman_start_corporation(uuid, uuid, text, text, text) TO authenticated;

-- ── 3. Construction overhaul ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.logistical_overhaul(
    p_corp_id uuid,
    p_asset   text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid  uuid := auth.uid();
    v_fac  factions%ROWTYPE;
    v_corp entrepreneur_corps%ROWTYPE;
    v_tick int;
    v_cost bigint;
    v_tax_city uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL OR p_asset IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_asset NOT IN ('project_management', 'heavy_equipment', 'supply_material',
                       'system_design', 'regulatory_compliance') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_asset');
    END IF;

    -- Lock the corp row: allowance + treasury checks must serialize.
    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.industry <> 'construction' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'industry_not_chartered');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE id = v_corp.owner_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'businessman'
       AND abandoned_at IS NULL;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;
    IF lower(COALESCE(v_fac.status, '')) = 'arrested' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'arrested');
    END IF;

    -- All five assets climb the same price ladder ($7-40M).
    IF p_asset = 'heavy_equipment' THEN
        v_cost := yard_upgrade_cost(COALESCE(v_corp.supply_tier, 0) + 1);
    ELSIF p_asset = 'supply_material' THEN
        v_cost := yard_upgrade_cost(COALESCE(v_corp.materials_tier, 0) + 1);
    ELSIF p_asset = 'regulatory_compliance' THEN
        v_cost := yard_upgrade_cost(COALESCE(v_corp.reg_tier, 0) + 1);
    ELSIF p_asset = 'system_design' THEN
        v_cost := yard_upgrade_cost(COALESCE(v_corp.design_tier, 0) + 1);
    ELSE
        v_cost := yard_upgrade_cost(COALESCE(v_corp.pm_tier, 0) + 1);
        -- PM levels also demand owned commercial buildings — checks
        -- that cannot pass until commercial categories are chartered.
        IF v_cost IS NOT NULL
           AND NOT _pm_upgrade_requirement_met(p_corp_id, COALESCE(v_corp.pm_tier, 0) + 1) THEN
            RETURN jsonb_build_object('success', false, 'reason', 'requires_building');
        END IF;
    END IF;
    IF v_cost IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'max_tier');
    END IF;

    -- City tax package (20270890): an active package in the HQ city
    -- discounts the spend 10%; the charge is consumed (with its
    -- +1 Growth / -1 Unemployment rebate) only when the action lands.
    v_tax_city := _tax_package_city(v_corp.hq_nation_id, v_corp.hq_city);
    IF v_tax_city IS NOT NULL THEN
        v_cost := ROUND(v_cost * 0.90);
    END IF;

    IF FLOOR(COALESCE(v_corp.treasury_cash, 0)) < v_cost THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_treasury',
            'need', v_cost, 'have', FLOOR(COALESCE(v_corp.treasury_cash, 0))::bigint);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_corp.exec_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    UPDATE entrepreneur_corps
       SET treasury_cash    = COALESCE(treasury_cash, 0) - v_cost,
           supply_tier      = COALESCE(supply_tier, 0)
               + CASE WHEN p_asset = 'heavy_equipment' THEN 1 ELSE 0 END,
           pm_tier          = COALESCE(pm_tier, 0)
               + CASE WHEN p_asset = 'project_management' THEN 1 ELSE 0 END,
           materials_tier   = COALESCE(materials_tier, 0)
               + CASE WHEN p_asset = 'supply_material' THEN 1 ELSE 0 END,
           reg_tier         = COALESCE(reg_tier, 0)
               + CASE WHEN p_asset = 'regulatory_compliance' THEN 1 ELSE 0 END,
           design_tier      = COALESCE(design_tier, 0)
               + CASE WHEN p_asset = 'system_design' THEN 1 ELSE 0 END,
           exec_action_tick = v_tick
     WHERE id = p_corp_id;

    IF v_tax_city IS NOT NULL THEN
        PERFORM _consume_tax_package_charge(v_tax_city);
    END IF;

    PERFORM _log_corp_history(p_corp_id, v_tick, format('Logistical Overhaul — upgraded the %s asset ($%s).', replace(p_asset, '_', ' '), v_cost));
    RETURN jsonb_build_object('success', true, 'asset', p_asset, 'cost', v_cost,
        'tax_package_applied', v_tax_city IS NOT NULL,
        'new_tier', CASE p_asset
                         WHEN 'heavy_equipment'       THEN COALESCE(v_corp.supply_tier, 0) + 1
                         WHEN 'supply_material'       THEN COALESCE(v_corp.materials_tier, 0) + 1
                         WHEN 'regulatory_compliance' THEN COALESCE(v_corp.reg_tier, 0) + 1
                         WHEN 'system_design'         THEN COALESCE(v_corp.design_tier, 0) + 1
                         ELSE COALESCE(v_corp.pm_tier, 0) + 1 END);
END $$;

-- ── 4. Automotive upgrades ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.upgrade_automotive_asset(
    p_corp_id uuid,
    p_asset   text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid  uuid := auth.uid();
    v_fac  factions%ROWTYPE;
    v_corp entrepreneur_corps%ROWTYPE;
    v_tier int;
    v_cost bigint;
    v_tax_city uuid;
    v_tick int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL OR p_asset NOT IN
       ('design_studio', 'assembly', 'data_center', 'parts_depot', 'franchise') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    -- Lock the corp row: the treasury debit and tier bump must
    -- serialize against a concurrent upgrade.
    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.industry <> 'automotive' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'industry_not_chartered');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE id = v_corp.owner_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'businessman'
       AND abandoned_at IS NULL;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;
    IF lower(COALESCE(v_fac.status, '')) = 'arrested' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'arrested');
    END IF;

    v_tier := COALESCE(CASE p_asset
        WHEN 'design_studio' THEN v_corp.design_studio_tier
        WHEN 'assembly'      THEN v_corp.assembly_tier
        WHEN 'data_center'   THEN v_corp.data_center_tier
        WHEN 'parts_depot'   THEN v_corp.parts_depot_tier
        WHEN 'franchise'     THEN v_corp.franchise_tier
    END, 1);
    IF v_tier >= 5 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'max_tier');
    END IF;

    -- The construction price ladder, aligned by Roman numeral:
    -- II $10M · III $16M · IV $25M · V $40M (Level I is free at
    -- founding). yard_upgrade_cost is the one price source.
    v_cost := yard_upgrade_cost(v_tier + 1);

    -- City tax package (20270890): an active package in the HQ city
    -- discounts the spend 10%; the charge is consumed (with its
    -- +1 Growth / -1 Unemployment rebate) only when the action lands.
    v_tax_city := _tax_package_city(v_corp.hq_nation_id, v_corp.hq_city);
    IF v_tax_city IS NOT NULL THEN
        v_cost := ROUND(v_cost * 0.90);
    END IF;

    IF floor(COALESCE(v_corp.treasury_cash, 0))::bigint < v_cost THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_treasury',
            'need', v_cost, 'have', floor(COALESCE(v_corp.treasury_cash, 0))::bigint);
    END IF;

    -- The overhaul is the day's executive action (20270855 — the
    -- on-card free upgrades retired with the Logistical Overhaul
    -- card, construction parity).
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_corp.exec_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    UPDATE entrepreneur_corps SET
        treasury_cash      = COALESCE(treasury_cash, 0) - v_cost,
        exec_action_tick   = v_tick,
        design_studio_tier = CASE WHEN p_asset = 'design_studio' THEN v_tier + 1 ELSE design_studio_tier END,
        assembly_tier      = CASE WHEN p_asset = 'assembly'      THEN v_tier + 1 ELSE assembly_tier END,
        data_center_tier   = CASE WHEN p_asset = 'data_center'   THEN v_tier + 1 ELSE data_center_tier END,
        parts_depot_tier   = CASE WHEN p_asset = 'parts_depot'   THEN v_tier + 1 ELSE parts_depot_tier END,
        franchise_tier     = CASE WHEN p_asset = 'franchise'     THEN v_tier + 1 ELSE franchise_tier END
     WHERE id = p_corp_id;

    IF v_tax_city IS NOT NULL THEN
        PERFORM _consume_tax_package_charge(v_tax_city);
    END IF;

    PERFORM _log_corp_history(p_corp_id, v_tick,
        format('Logistical Overhaul — upgraded the %s asset to Level %s ($%s).',
               replace(p_asset, '_', ' '), v_tier + 1, v_cost));

    RETURN jsonb_build_object('success', true,
        'asset', p_asset, 'tier', v_tier + 1, 'cost', v_cost,
        'tax_package_applied', v_tax_city IS NOT NULL);
END $$;

-- ── 5. Construction requests ride the shared seam ─────────────────
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

    -- Unemployment discount (20270881): -3% per point — idle labor
    -- is cheap labor. cities.unemployment is 1-10-constrained
    -- per 20270736; NULL falls back to 0 (no discount).
    v_jobs              := COALESCE(v_city.unemployment, 0);
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

    -- Tax Package consumption (20270890): the shared helper — one
    -- charge burned, +1 Growth / -1 Unemployment rebated.
    IF v_tax_active THEN
        PERFORM _consume_tax_package_charge(p_city_id);
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
