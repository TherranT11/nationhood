-- ════════════════════════════════════════════════════════════════════
-- 20270675 — Aircraft Assembly Facility: wire the build path
--
-- The narrowbody aircraft tier requires an aircraft_assembly_facility
-- to produce, but the building type was never wired into the
-- construction system. Designers + production logic (20261028 /
-- 20261102 / 20270586 / 20270611 / 20270639) all reference it; the
-- gates that let a player actually own one were missing. This
-- migration closes the loop.
--
-- Changes (each function is recreated in full since PostgreSQL has
-- no ALTER FUNCTION body-patch syntax):
--
--   1. corp_building_required_sector — adds the sector lock so only
--      aviation_manufacturing corps can own one.
--
--   2. corp_building_cost_profile — pins eff_tier='major' (ambition
--      = 4 falls out of the eff_tier → ambition CASE), cost override
--      = $175M (between light_assembly_plant's $75M and the major-
--      tier base of $200M), and a NEW per-type duration override of
--      16 ticks. Duration overrides are new here — added so the
--      facility's build time can be tuned independently of its
--      ambition tier (the major eff_tier's natural 33-tick base is
--      explicitly NOT what we want).
--
--   3. corp_commercial_build_load — includes aircraft_assembly_
--      facility in the CY-capacity-gate count alongside the other
--      commercial-scale plants.
--
--   4. begin_construction — adds to the building_type whitelist, to
--      the CY capacity gate, and to the event_log display-name
--      CASE. Direct-build path (used by construction corps building
--      a facility for themselves or on spec for the broker market).
--
--   5. request_building_construction — adds to the whitelist.
--      Commission path (used by aviation_manufacturing corps that
--      want a facility and don't want to build it themselves; the
--      sector lock added in change 1 keeps non-aviation buyers out
--      of the contract).
--
-- Cost calibration: $175M with a 16-tick duration is a high-capex /
-- short-window play vs. light_assembly_plant ($75M, 30 ticks). The
-- short build doesn't reduce CY load (it's still counted as
-- commercial scale) — it just means an aviation_manufacturing corp
-- can pivot to narrowbody fast at high cost.
--
-- Client mirrors (entrepreneur-corp.html — separate commit):
--   PLANT_PROFILE.aircraft_assembly_facility = { cost: 175000000,
--                                                 ticks: 16, amb: 4 }
--   isPlantType: || t === 'aircraft_assembly_facility'
--   SECTOR_OF_TYPE.aircraft_assembly_facility = 'aviation_manufacturing'
--
-- Apply after 20270674.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Sector lock ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.corp_building_required_sector(p_building_type text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT CASE p_building_type
        WHEN 'construction_yard'         THEN 'construction'
        WHEN 'port'                      THEN 'shipping'
        WHEN 'banking_office'            THEN 'banking'
        WHEN 'engine_assembly_plant'     THEN 'aviation_manufacturing'
        WHEN 'light_assembly_plant'      THEN 'aviation_manufacturing'
        WHEN 'aircraft_assembly_facility' THEN 'aviation_manufacturing'
        WHEN 'apartment_basic'           THEN 'real_estate'
        WHEN 'apartment_modest'          THEN 'real_estate'
        WHEN 'apartment_luxury'          THEN 'real_estate'
        WHEN 'pump_jack'                 THEN 'oil_and_gas'
        WHEN 'refinery_small'            THEN 'oil_and_gas'
        WHEN 'refinery_regular'          THEN 'oil_and_gas'
        WHEN 'refinery_large'            THEN 'oil_and_gas'
        WHEN 'gas_station'               THEN 'oil_and_gas'
        ELSE NULL
    END;
$$;

-- ── 2. Cost / duration / ambition profile ────────────────────────────
CREATE OR REPLACE FUNCTION public.corp_building_cost_profile(
    p_building_type text,
    p_tier          text,
    p_nation_id     uuid,
    OUT eff_tier    text,
    OUT cost        bigint,
    OUT duration    int,
    OUT ambition    smallint,
    OUT col         numeric,
    OUT inf         numeric,
    OUT mult        numeric
)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
    v_cost_base   bigint;
    v_dur_base    int;
    v_sensitivity numeric;
    v_apt_premium numeric;
BEGIN
    eff_tier := CASE p_building_type
        WHEN 'engine_assembly_plant'      THEN 'medium'
        WHEN 'light_assembly_plant'       THEN 'large'
        WHEN 'aircraft_assembly_facility' THEN 'major'
        WHEN 'apartment_basic'            THEN 'small'
        WHEN 'apartment_modest'           THEN 'medium'
        WHEN 'apartment_luxury'           THEN 'large'
        WHEN 'pump_jack'                  THEN 'small'
        WHEN 'refinery_small'             THEN 'small'
        WHEN 'refinery_regular'           THEN 'medium'
        WHEN 'refinery_large'             THEN 'large'
        WHEN 'gas_station'                THEN 'small'
        ELSE p_tier
    END;

    v_cost_base := CASE eff_tier
        WHEN 'small'      THEN 20000000
        WHEN 'medium'     THEN 50000000
        WHEN 'large'      THEN 100000000
        WHEN 'major'      THEN 200000000
        WHEN 'monumental' THEN 400000000
        ELSE NULL
    END;
    v_dur_base := CASE eff_tier
        WHEN 'small' THEN 24 WHEN 'medium' THEN 27 WHEN 'large' THEN 30
        WHEN 'major' THEN 33 WHEN 'monumental' THEN 36 ELSE NULL
    END;
    ambition := CASE eff_tier
        WHEN 'small' THEN 1 WHEN 'medium' THEN 2 WHEN 'large' THEN 3
        WHEN 'major' THEN 4 WHEN 'monumental' THEN 5 ELSE NULL
    END;

    -- Per-type cost overrides.
    IF p_building_type = 'engine_assembly_plant' THEN
        v_cost_base := 45000000;
    ELSIF p_building_type = 'light_assembly_plant' THEN
        v_cost_base := 75000000;
    ELSIF p_building_type = 'aircraft_assembly_facility' THEN
        v_cost_base := 175000000;
    ELSIF p_building_type = 'apartment_basic' THEN
        v_cost_base := 12000000;
    ELSIF p_building_type = 'apartment_modest' THEN
        v_cost_base := 25000000;
    ELSIF p_building_type = 'apartment_luxury' THEN
        v_cost_base := 60000000;
    ELSIF p_building_type = 'pump_jack' THEN
        v_cost_base := 8000000;
    ELSIF p_building_type = 'refinery_small' THEN
        v_cost_base := 80000000;
    ELSIF p_building_type = 'refinery_regular' THEN
        v_cost_base := 170000000;
    ELSIF p_building_type = 'refinery_large' THEN
        v_cost_base := 300000000;
    ELSIF p_building_type = 'gas_station' THEN
        v_cost_base := 6000000;
    END IF;

    -- Per-type duration overrides. New surface — added so a building
    -- can pin its build-time independently of its ambition tier.
    -- aircraft_assembly_facility is the first user: it sits at the
    -- major ambition tier (4) but only takes 16 ticks to build
    -- (vs. the major base of 33).
    IF p_building_type = 'aircraft_assembly_facility' THEN
        v_dur_base := 16;
    END IF;

    -- Apartment Pattern-B sensitivity (every other type defaults 1.0).
    v_sensitivity := CASE p_building_type
        WHEN 'apartment_modest' THEN 1.3
        WHEN 'apartment_luxury' THEN 1.7
        ELSE 1.0
    END;

    SELECT COALESCE(cost_of_living, 50), COALESCE(infrastructure, 50)
      INTO col, inf
      FROM nations WHERE id = p_nation_id;
    col  := COALESCE(col, 50);
    inf  := COALESCE(inf, 50);
    mult := (0.5 + col / 100.0) * (0.5 + (100 - inf) / 100.0);

    v_apt_premium := 1.0 + (v_sensitivity - 1.0) * (100.0 - inf) / 100.0;

    IF v_cost_base IS NULL THEN
        cost := NULL; duration := NULL;
    ELSE
        cost     := ROUND(v_cost_base::numeric * mult * v_apt_premium)::bigint;
        duration := GREATEST(1, ROUND(v_dur_base::numeric * mult)::int);
    END IF;
END;
$$;

-- ── 3. Commercial build-load counter ─────────────────────────────────
CREATE OR REPLACE FUNCTION public.corp_commercial_build_load(p_corp_id uuid, p_nation_id uuid)
RETURNS int
LANGUAGE sql
STABLE
SET search_path = public
AS $$
    SELECT (
        (SELECT count(*) FROM corp_buildings
          WHERE builder_corp_id = p_corp_id AND nation_id = p_nation_id
            AND status = 'in_progress'
            AND building_type IN ('port','banking_office','real_estate_office',
                                  'engine_assembly_plant','light_assembly_plant',
                                  'aircraft_assembly_facility',
                                  'apartment_basic','apartment_modest','apartment_luxury',
                                  'pump_jack','refinery_small','refinery_regular',
                                  'refinery_large','gas_station'))
        + (SELECT count(*) FROM ent_construction_contracts
            WHERE winner_corp_id = p_corp_id AND nation_id = p_nation_id
              AND status = 'active')
    )::int;
$$;

-- ── 4. begin_construction (direct build) ─────────────────────────────
CREATE OR REPLACE FUNCTION public.begin_construction(
    p_corp_id        uuid,
    p_nation_id      uuid,
    p_name           text,
    p_tier           text,
    p_building_type  text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_corp         entrepreneur_corps%ROWTYPE;
    v_fac          factions%ROWTYPE;
    v_prof         record;
    v_eff_tier     text;
    v_cost         bigint;
    v_duration     int;
    v_ambition     smallint;
    v_tick         int;
    v_nation_name  text;
    v_id           uuid;
    v_has_rhq      boolean;
    v_cy_count     int;
    v_load         int;
    v_corp_cash    numeric;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL OR p_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_name IS NULL OR length(btrim(p_name)) < 2 OR length(btrim(p_name)) > 80 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_name');
    END IF;
    IF p_building_type NOT IN ('regional_hq','construction_yard','port','banking_office',
                               'real_estate_office','engine_assembly_plant','light_assembly_plant',
                               'aircraft_assembly_facility') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_building_type');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.industry <> 'construction' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_construction_corp');
    END IF;

    SELECT name INTO v_nation_name FROM nations WHERE id = p_nation_id;
    IF v_nation_name IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_not_found');
    END IF;

    SELECT * INTO v_prof FROM corp_building_cost_profile(p_building_type, p_tier, p_nation_id);
    v_eff_tier := v_prof.eff_tier;
    v_cost     := v_prof.cost;
    v_duration := v_prof.duration;
    v_ambition := v_prof.ambition;
    IF v_cost IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_tier');
    END IF;
    IF p_building_type = 'regional_hq' AND v_eff_tier NOT IN ('small','medium','large') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_rhq_tier');
    END IF;

    IF p_building_type <> 'regional_hq' THEN
        IF p_nation_id <> v_corp.hq_nation_id THEN
            SELECT EXISTS (
                SELECT 1 FROM corp_buildings
                 WHERE owner_corp_id = p_corp_id
                   AND nation_id = p_nation_id
                   AND building_type = 'regional_hq'
                   AND status = 'completed'
            ) INTO v_has_rhq;
            IF NOT v_has_rhq THEN
                RETURN jsonb_build_object('success', false, 'reason', 'no_rhq_in_nation');
            END IF;
        END IF;
    END IF;

    -- Capacity gate (CY × 2) for commercial builds; shared pool with
    -- commissioned contracts via corp_commercial_build_load.
    IF p_building_type IN ('port','banking_office','real_estate_office',
                           'engine_assembly_plant','light_assembly_plant',
                           'aircraft_assembly_facility') THEN
        SELECT COUNT(*) INTO v_cy_count FROM corp_buildings
         WHERE owner_corp_id = p_corp_id
           AND nation_id = p_nation_id
           AND building_type = 'construction_yard'
           AND status = 'completed';
        v_load := corp_commercial_build_load(p_corp_id, p_nation_id);
        IF v_load >= v_cy_count * 2 THEN
            RETURN jsonb_build_object('success', false, 'reason', 'capacity_exceeded',
                'cy_count', v_cy_count, 'max', v_cy_count * 2, 'in_progress', v_load);
        END IF;
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;
    IF v_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    v_corp_cash := COALESCE(v_corp.treasury_cash, 0);
    IF v_corp_cash < v_cost THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'have', v_corp_cash::bigint, 'need', v_cost, 'payer', 'corp');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE entrepreneur_corps
       SET treasury_cash = COALESCE(treasury_cash, 0) - v_cost, updated_at = now()
     WHERE id = p_corp_id;
    UPDATE factions
       SET ent_influence = COALESCE(ent_influence, 0) + v_ambition
     WHERE id = v_fac.id;

    INSERT INTO corp_buildings
        (builder_corp_id, owner_corp_id, nation_id, name, tier, building_type,
         cost_paid, ambition_granted, status, started_at_tick, completes_at_tick)
    VALUES
        (p_corp_id, p_corp_id, p_nation_id, btrim(p_name), v_eff_tier, p_building_type,
         v_cost, v_ambition, 'in_progress', v_tick, v_tick + v_duration)
    RETURNING id INTO v_id;

    INSERT INTO event_log (
        nation_id, faction_id, event_name, description_used,
        category, trigger_key, effects_applied, fired_at_tick
    ) VALUES (
        p_nation_id, v_fac.id, 'Construction Begins',
        format('%s breaks ground on %s (%s) in %s.',
               v_corp.name, btrim(p_name),
               CASE p_building_type
                   WHEN 'regional_hq'                THEN 'Regional HQ'
                   WHEN 'construction_yard'           THEN 'Construction Yard'
                   WHEN 'port'                        THEN 'Port'
                   WHEN 'banking_office'              THEN 'Banking Office'
                   WHEN 'real_estate_office'          THEN 'Real Estate Office'
                   WHEN 'engine_assembly_plant'       THEN 'Engine Assembly Plant'
                   WHEN 'light_assembly_plant'        THEN 'Light Assembly Plant'
                   WHEN 'aircraft_assembly_facility'  THEN 'Aircraft Assembly Facility'
               END, v_nation_name),
        'corporate', 'begin_construction',
        jsonb_build_object(
            'building_id', v_id, 'corp_id', p_corp_id, 'corp_name', v_corp.name,
            'tier', v_eff_tier, 'building_type', p_building_type, 'cost', v_cost,
            'duration', v_duration, 'completes_at_tick', v_tick + v_duration,
            'influence_bump', v_ambition, 'cost_multiplier', ROUND(v_prof.mult, 3),
            'cost_of_living', v_prof.col, 'infrastructure', v_prof.inf, 'payer', 'corp_treasury'
        ),
        v_tick
    );

    RETURN jsonb_build_object(
        'success', true, 'building_id', v_id, 'tier', v_eff_tier,
        'building_type', p_building_type, 'cost', v_cost, 'duration', v_duration,
        'influence_bump', v_ambition, 'started_at_tick', v_tick,
        'completes_at_tick', v_tick + v_duration,
        'corp_cash_after', (v_corp_cash - v_cost)::bigint, 'cost_multiplier', ROUND(v_prof.mult, 3)
    );
END;
$$;

-- ── 5. request_building_construction (commission path) ───────────────
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

    SELECT name INTO v_nation_name FROM nations WHERE id = p_nation_id;
    IF v_nation_name IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'nation_not_found'); END IF;

    SELECT * INTO v_prof FROM corp_building_cost_profile(p_building_type, p_tier, p_nation_id);
    IF v_prof.cost IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'invalid_tier'); END IF;
    IF p_building_type = 'regional_hq' AND v_prof.eff_tier NOT IN ('small','medium','large') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_rhq_tier');
    END IF;

    IF COALESCE(v_corp.treasury_cash, 0) < v_prof.cost THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'have', COALESCE(v_corp.treasury_cash, 0)::bigint, 'need', v_prof.cost);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    v_num  := 'BLD-' || v_tick || '-' || left(replace(gen_random_uuid()::text, '-', ''), 5);

    INSERT INTO ent_construction_contracts (
        contract_number, name, contract_type, issuer_corp_id, issuer_name,
        building_type, nation_id, tier, build_cost, spec_tier, timeline_ticks,
        bidding_closes_tick, completion_effects, created_at_tick
    ) VALUES (
        v_num, btrim(p_name), 'private', p_corp_id, v_corp.name,
        p_building_type, p_nation_id, v_prof.eff_tier, v_prof.cost, NULL, v_prof.duration,
        v_tick + GREATEST(1, COALESCE(p_bidding_ticks, 6)), '{}'::jsonb, v_tick
    ) RETURNING id INTO v_id;

    RETURN jsonb_build_object(
        'success', true, 'contract_id', v_id, 'contract_number', v_num,
        'building_type', p_building_type, 'tier', v_prof.eff_tier,
        'cost', v_prof.cost, 'duration', v_prof.duration,
        'bidding_closes_tick', v_tick + GREATEST(1, COALESCE(p_bidding_ticks, 6))
    );
END;
$$;

NOTIFY pgrst, 'reload schema';

COMMIT;
