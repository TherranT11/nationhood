-- ════════════════════════════════════════════════════════════════════
-- CONSTRUCTION — buildable Engine / Light Assembly Plants
-- ════════════════════════════════════════════════════════════════════
-- Adds the two aviation-manufacturing plant types to the construction
-- build catalog so Construction corps can build them like Ports / Banking
-- Offices, then sell them on to Aviation Manufacturing corps via the
-- existing brokerage flow (broker_buy_listing). Mirrors the established
-- "construction builds → sector corp operates" pattern exactly.
--
--   • engine_assembly_plant — gates ent_design_engine.  Base cost $45M.
--   • light_assembly_plant  — gates ent_design_aircraft. Base cost $75M.
--
-- Both costs are FIXED per type (not tier-scaled) and then scaled by the
-- SAME nation Infrastructure + Cost-of-Living multiplier every other build
-- uses (20270180): mult = (0.5 + CoL/100) × (0.5 + (100 − Infra)/100).
-- Build profile mirrors a comparable tier (Engine ≈ medium 27t/+2 Ambition,
-- Light ≈ large 30t/+3) — so the pinned tier supplies duration/ambition and
-- only the cost base is overridden. Plants consume Construction-Yard
-- capacity (CY × 2) like Port / Banking / Real-Estate offices, and require
-- an RHQ-in-nation (HQ nation implicit), identical to those types.
--
-- begin_construction body is based on 20270182 (the latest version — it
-- debits the corp's treasury_cash, NOT party_funds) with the plant changes
-- layered on. Re-confirm 20270182 is the predecessor before applying.
--
-- Sale path: corp_building_required_sector (the single source of truth for
-- the buyer sector-lock, 20270207) gains the two plant → aviation_manufacturing
-- rows, so broker_buy_listing / buy_building / accept_offer all gate plant
-- purchases to Aviation Manufacturing corps with no per-function edits.
--
-- NOTE: place_offer keeps its older inline sector CASE (pre-20270207) and is
-- NOT touched here — it requires a real_estate SELLER, and a construction-
-- built plant is never RE-owned (it sells through brokerage while the
-- builder keeps ownership), so plants never reach that path.
--
-- The building_type CHECK already permits both plant types (20270213).
-- Idempotent (CREATE OR REPLACE). No schema change.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Sector-lock single source: plants → aviation_manufacturing ──
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
        ELSE NULL
    END;
$$;

GRANT EXECUTE ON FUNCTION public.corp_building_required_sector(text) TO authenticated;

COMMENT ON FUNCTION public.corp_building_required_sector(text) IS
    'Single source of truth for the building_type → required buyer industry sector-lock. NULL = no restriction (regional_hq, real_estate_office). engine/light_assembly_plant → aviation_manufacturing (20270224). Called by broker_buy_listing, buy_building, accept_offer.';

-- ── 2. begin_construction — accept the two plant types ─────────────
-- Body identical to 20270182 (corp treasury_cash payer) plus: plant types
-- whitelisted; a pinned effective tier (engine→medium, light→large)
-- supplies duration/ambition; the cost base is overridden to the fixed
-- plant cost; plants join the CY-capacity-gated set and the event-log
-- label CASE.
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
    v_eff_tier     text;
    v_cost_base    bigint;
    v_dur_base     int;
    v_cost         bigint;
    v_duration     int;
    v_ambition     smallint;
    v_tick         int;
    v_nation_name  text;
    v_col          numeric;
    v_inf          numeric;
    v_col_factor   numeric;
    v_inf_factor   numeric;
    v_mult         numeric;
    v_id           uuid;
    v_has_rhq      boolean;
    v_cy_count     int;
    v_in_progress  int;
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
                               'real_estate_office','engine_assembly_plant','light_assembly_plant') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_building_type');
    END IF;

    -- Plants are single-profile: pin the effective tier (which supplies
    -- duration + ambition); the client tier choice is ignored for them.
    v_eff_tier := CASE p_building_type
        WHEN 'engine_assembly_plant' THEN 'medium'
        WHEN 'light_assembly_plant'  THEN 'large'
        ELSE p_tier
    END;

    IF v_eff_tier NOT IN ('small','medium','large','major','monumental') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_tier');
    END IF;
    IF p_building_type = 'regional_hq' AND v_eff_tier NOT IN ('small','medium','large') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_rhq_tier');
    END IF;

    CASE v_eff_tier
        WHEN 'small'      THEN v_cost_base := 20000000;   v_dur_base := 24; v_ambition := 1;
        WHEN 'medium'     THEN v_cost_base := 50000000;   v_dur_base := 27; v_ambition := 2;
        WHEN 'large'      THEN v_cost_base := 100000000;  v_dur_base := 30; v_ambition := 3;
        WHEN 'major'      THEN v_cost_base := 200000000;  v_dur_base := 33; v_ambition := 4;
        WHEN 'monumental' THEN v_cost_base := 400000000;  v_dur_base := 36; v_ambition := 5;
    END CASE;

    -- Fixed per-type cost for plants (overrides the tier cost; duration +
    -- ambition stay from the pinned tier above).
    IF p_building_type = 'engine_assembly_plant' THEN
        v_cost_base := 45000000;
    ELSIF p_building_type = 'light_assembly_plant' THEN
        v_cost_base := 75000000;
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.industry <> 'construction' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_construction_corp');
    END IF;

    SELECT name, COALESCE(cost_of_living, 50), COALESCE(infrastructure, 50)
      INTO v_nation_name, v_col, v_inf
      FROM nations WHERE id = p_nation_id;
    IF v_nation_name IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_not_found');
    END IF;

    v_col_factor := 0.5 + v_col / 100.0;
    v_inf_factor := 0.5 + (100 - v_inf) / 100.0;
    v_mult       := v_col_factor * v_inf_factor;
    v_cost       := ROUND(v_cost_base::numeric * v_mult)::bigint;
    v_duration   := GREATEST(1, ROUND(v_dur_base::numeric * v_mult)::int);

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

    -- Capacity gate (CY × 2). Plants join Port/BO/RE-Office as commercial
    -- builds; RHQ + CY remain infrastructure and bypass it.
    IF p_building_type IN ('port','banking_office','real_estate_office',
                           'engine_assembly_plant','light_assembly_plant') THEN
        SELECT COUNT(*) INTO v_cy_count FROM corp_buildings
         WHERE owner_corp_id = p_corp_id
           AND nation_id = p_nation_id
           AND building_type = 'construction_yard'
           AND status = 'completed';
        SELECT COUNT(*) INTO v_in_progress FROM corp_buildings
         WHERE builder_corp_id = p_corp_id
           AND nation_id = p_nation_id
           AND building_type IN ('port','banking_office','real_estate_office',
                                 'engine_assembly_plant','light_assembly_plant')
           AND status = 'in_progress';
        IF v_in_progress >= v_cy_count * 2 THEN
            RETURN jsonb_build_object('success', false, 'reason', 'capacity_exceeded',
                'cy_count', v_cy_count, 'max', v_cy_count * 2, 'in_progress', v_in_progress);
        END IF;
    END IF;

    -- Owner gate (no money debit from party_funds — corp pays).
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

    -- Corp pays from its own treasury_cash (20270182). Ambition bump still
    -- goes to the owner — the build is the owner's accomplishment surface.
    v_corp_cash := COALESCE(v_corp.treasury_cash, 0);
    IF v_corp_cash < v_cost THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'have', v_corp_cash::bigint, 'need', v_cost,
            'payer', 'corp');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE entrepreneur_corps
       SET treasury_cash = COALESCE(treasury_cash, 0) - v_cost,
           updated_at    = now()
     WHERE id = p_corp_id;

    UPDATE factions
       SET ent_ambition = COALESCE(ent_ambition, 0) + v_ambition
     WHERE id = v_fac.id;

    INSERT INTO corp_buildings
        (builder_corp_id, owner_corp_id, nation_id, name, tier, building_type,
         cost_paid, ambition_granted,
         status, started_at_tick, completes_at_tick)
    VALUES
        (p_corp_id, p_corp_id, p_nation_id, btrim(p_name), v_eff_tier, p_building_type,
         v_cost, v_ambition,
         'in_progress', v_tick, v_tick + v_duration)
    RETURNING id INTO v_id;

    INSERT INTO event_log (
        nation_id, faction_id, event_name, description_used,
        category, trigger_key, effects_applied, fired_at_tick
    ) VALUES (
        p_nation_id, v_fac.id,
        'Construction Begins',
        format('%s breaks ground on %s (%s) in %s.',
               v_corp.name, btrim(p_name),
               CASE p_building_type
                   WHEN 'regional_hq'           THEN 'Regional HQ'
                   WHEN 'construction_yard'      THEN 'Construction Yard'
                   WHEN 'port'                   THEN 'Port'
                   WHEN 'banking_office'         THEN 'Banking Office'
                   WHEN 'real_estate_office'     THEN 'Real Estate Office'
                   WHEN 'engine_assembly_plant'  THEN 'Engine Assembly Plant'
                   WHEN 'light_assembly_plant'   THEN 'Light Assembly Plant'
               END,
               v_nation_name),
        'corporate', 'begin_construction',
        jsonb_build_object(
            'building_id',       v_id,
            'corp_id',           p_corp_id,
            'corp_name',         v_corp.name,
            'tier',              v_eff_tier,
            'building_type',     p_building_type,
            'cost',              v_cost,
            'duration',          v_duration,
            'completes_at_tick', v_tick + v_duration,
            'ambition_bump',     v_ambition,
            'cost_multiplier',   ROUND(v_mult, 3),
            'cost_of_living',    v_col,
            'infrastructure',    v_inf,
            'payer',             'corp_treasury'
        ),
        v_tick
    );

    RETURN jsonb_build_object(
        'success',           true,
        'building_id',       v_id,
        'tier',              v_eff_tier,
        'building_type',     p_building_type,
        'cost',              v_cost,
        'duration',          v_duration,
        'ambition_bump',     v_ambition,
        'started_at_tick',   v_tick,
        'completes_at_tick', v_tick + v_duration,
        'corp_cash_after',   (v_corp_cash - v_cost)::bigint,
        'cost_multiplier',   ROUND(v_mult, 3)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.begin_construction(uuid, uuid, text, text, text) TO authenticated;

COMMENT ON FUNCTION public.begin_construction(uuid, uuid, text, text, text) IS
    'Construction-corp owner-only; pays from corp treasury_cash (20270182). v3+ adds Engine/Light Assembly Plants (20270224): fixed base cost ($45M/$75M) × Infra/CoL multiplier, single-profile (pinned medium/large tier for duration+ambition). Plants require RHQ-in-nation and consume CY×2 capacity. Sold on to Aviation Manufacturing corps via brokerage.';

NOTIFY pgrst, 'reload schema';

COMMIT;
