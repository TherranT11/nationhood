-- ════════════════════════════════════════════════════════════════════
-- Real Estate Phase 1 — Apartment Complex building types
--
-- Adds three residential building types that Real Estate corps can
-- request to be built:
--
--   apartment_basic    base $12M  tier_sensitivity 1.0  → eff_tier small
--   apartment_modest   base $25M  tier_sensitivity 1.3  → eff_tier medium
--   apartment_luxury   base $60M  tier_sensitivity 1.7  → eff_tier large
--
-- Pattern B cost scaling: final = base × multiplier^sensitivity, where
-- multiplier = nation_construction_cost_multiplier (col + inf curve).
-- Effect: Luxury in a low-SoL/low-Inf nation costs disproportionately
-- more (no skilled labor / materials / designers locally) — players
-- naturally match tier to nation development. Basic stays linear so
-- it remains buildable everywhere; Modest sits in between.
--
-- This phase only adds the building type. Rent / occupancy / maintenance
-- (Phase 2) and dashboard signaling (Phase 3) land in later migrations.
-- Apartments built in Phase 1 sit as inert inventory in the RE corp's
-- properties list — owned, sellable, but generating no income yet.
--
-- Four surgical extensions, all on existing single-source helpers:
--
--   1. corp_building_required_sector — three new entries → 'real_estate'.
--   2. corp_building_cost_profile — apartment branch with Pattern B
--      and pinned tier/duration/ambition per type.
--   3. corp_commercial_build_load — apartment types join the
--      CY-capacity-gated commercial-build pool.
--   4. request_building_construction whitelist — extended with the
--      three apartment types so the issuer-side gate accepts them.
--
-- begin_construction is NOT touched: the design has apartments built
-- via request_building_construction (RE corp issues, Construction corp
-- bids and delivers). Sector lock blocks any other industry from
-- becoming the owner. RE corps can self-build only the real_estate_office
-- (their existing tooling building); apartments must come from a
-- construction-corp bid, preserving the inter-industry dependency.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Sector lock: apartment types are real-estate only ────────────
CREATE OR REPLACE FUNCTION public.corp_building_required_sector(p_building_type text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT CASE p_building_type
        WHEN 'construction_yard'     THEN 'construction'
        WHEN 'port'                  THEN 'shipping'
        WHEN 'banking_office'        THEN 'banking'
        WHEN 'engine_assembly_plant' THEN 'aviation_manufacturing'
        WHEN 'light_assembly_plant'  THEN 'aviation_manufacturing'
        WHEN 'apartment_basic'       THEN 'real_estate'
        WHEN 'apartment_modest'      THEN 'real_estate'
        WHEN 'apartment_luxury'      THEN 'real_estate'
        ELSE NULL
    END;
$$;

COMMENT ON FUNCTION public.corp_building_required_sector(text) IS
    'Single source of truth for the building_type → required buyer industry sector-lock. NULL = no restriction (regional_hq, real_estate_office). engine/light_assembly_plant → aviation_manufacturing. apartment_basic/modest/luxury → real_estate (20270435 Phase 1). Called by broker_buy_listing, buy_building, accept_offer, request_building_construction.';

-- ── 2. Cost profile: apartments use Pattern B ───────────────────────
-- Body identical to 20270225's profile, plus an apartment branch that
-- (a) pins the effective tier per type (basic→small, modest→medium,
-- luxury→large) for duration + ambition, and (b) overrides the cost
-- formula to base × multiplier^sensitivity instead of base × multiplier.
--
-- Multiplier comes from the same nation col+inf math the other types
-- already use — that's the only "nation development" curve in the
-- codebase, and we're reusing it (not introducing a parallel one).
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
BEGIN
    -- Pinned effective tier for typed buildings (plants + apartments).
    -- Drives the duration/ambition lookup below; for apartments the
    -- cost CASE on eff_tier is bypassed by the override block.
    eff_tier := CASE p_building_type
        WHEN 'engine_assembly_plant' THEN 'medium'
        WHEN 'light_assembly_plant'  THEN 'large'
        WHEN 'apartment_basic'       THEN 'small'
        WHEN 'apartment_modest'      THEN 'medium'
        WHEN 'apartment_luxury'      THEN 'large'
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

    -- Fixed per-type cost for plants (overrides the tier base).
    IF p_building_type = 'engine_assembly_plant' THEN
        v_cost_base := 45000000;
    ELSIF p_building_type = 'light_assembly_plant' THEN
        v_cost_base := 75000000;
    -- Apartments: per-type base cost. Pattern B exponent applied below.
    ELSIF p_building_type = 'apartment_basic' THEN
        v_cost_base := 12000000;
    ELSIF p_building_type = 'apartment_modest' THEN
        v_cost_base := 25000000;
    ELSIF p_building_type = 'apartment_luxury' THEN
        v_cost_base := 60000000;
    END IF;

    -- Per-type tier sensitivity to the nation multiplier. Default 1.0
    -- (linear scaling, current behaviour for every existing type).
    -- Apartments only: basic 1.0 / modest 1.3 / luxury 1.7. Higher
    -- sensitivity → low-development nations punish you harder on cost.
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

    IF v_cost_base IS NULL THEN
        cost := NULL; duration := NULL;       -- invalid tier
    ELSE
        -- Pattern B: cost = base × multiplier^sensitivity. For
        -- sensitivity = 1.0 this collapses to the existing
        -- base × multiplier formula — exact backwards-compat for
        -- every non-apartment type.
        cost     := ROUND(v_cost_base::numeric * power(mult, v_sensitivity))::bigint;
        duration := GREATEST(1, ROUND(v_dur_base::numeric * mult)::int);
    END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION public.corp_building_cost_profile(text, text, uuid) TO authenticated;

COMMENT ON FUNCTION public.corp_building_cost_profile(text, text, uuid) IS
    'Single source for a corp building''s cost / duration / ambition given type+tier+nation. Plants pin medium/large + fixed cost; apartments pin small/medium/large + fixed cost per type AND apply Pattern B exponent to the nation multiplier (basic 1.0, modest 1.3, luxury 1.7) so Luxury costs disproportionately more in undeveloped nations. cost=NULL means invalid tier. Used by begin_construction + request_building_construction.';

-- ── 3. Commercial-build capacity: apartments consume CY slots ───────
-- Apartments are physically built by a Construction corp on a
-- contract, same as the other commercial types — they consume the
-- same CY capacity slots. Without this, a player could blow past
-- the (completed CYs × 2) cap by bidding on apartment contracts.
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
                                  'apartment_basic','apartment_modest','apartment_luxury'))
      + (SELECT count(*) FROM ent_construction_contracts
          WHERE winner_corp_id = p_corp_id AND nation_id = p_nation_id
            AND status = 'active'
            AND building_type IN ('port','banking_office','real_estate_office',
                                  'engine_assembly_plant','light_assembly_plant',
                                  'apartment_basic','apartment_modest','apartment_luxury'))
    )::int;
$$;
GRANT EXECUTE ON FUNCTION public.corp_commercial_build_load(uuid, uuid) TO authenticated;

-- ── 4. request_building_construction whitelist ──────────────────────
-- Body identical to 20270429 with three apartment types added to the
-- whitelist. Sector lock at line ~91 already enforces real_estate
-- via corp_building_required_sector (updated above), so the only
-- change in this RPC is the type-validity check on line 75.
DROP FUNCTION IF EXISTS public.request_building_construction(uuid, text, text, uuid, text, int);

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
                               'apartment_basic','apartment_modest','apartment_luxury') THEN
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

    RETURN jsonb_build_object('success', true, 'contract_id', v_id,
        'floor', v_prof.cost, 'timeline_ticks', v_prof.duration,
        'bidding_closes_tick', v_tick + GREATEST(1, COALESCE(p_bidding_ticks, 6)));
END;
$$;
GRANT EXECUTE ON FUNCTION public.request_building_construction(uuid, text, text, uuid, text, int) TO authenticated;

COMMENT ON FUNCTION public.request_building_construction(uuid, text, text, uuid, text, int) IS
    'Building-delivery RFP. Issuer specifies name + type + tier + nation + bidding-window length. Whitelist (20270435): regional_hq, construction_yard, port, banking_office, real_estate_office, engine/light_assembly_plant, apartment_basic/modest/luxury. Sector lock via corp_building_required_sector — apartment_* are real_estate-only. Sanity check: treasury >= floor cost at request time; winning bid paid at completion.';

NOTIFY pgrst, 'reload schema';

COMMIT;
