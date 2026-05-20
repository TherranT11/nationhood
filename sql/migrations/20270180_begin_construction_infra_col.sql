-- ════════════════════════════════════════════════════════════════════
-- begin_construction — fix column name (infrastructure, not
--                       physical_infrastructure)
-- ════════════════════════════════════════════════════════════════════
-- 20270172 introduced nation-aware cost scaling and 20270176 extended
-- the RPC for the real_estate_office building type. Both bodies read
--   nations.physical_infrastructure
-- which does NOT exist — the actual column on nations is just
--   nations.infrastructure
-- (defined in 20260430_alpha_stats_phase2_additive_schema.sql:53).
-- Every begin_construction call has been failing at the SELECT with
-- "column physical_infrastructure does not exist".
--
-- Fix is a single-character body swap: rename the SELECT reference
-- and the event_log key stays as 'infrastructure' (already correct).
-- All other guards, formulas, capacity gates, sector locks, and the
-- five-building-type CASE are byte-identical to 20270176.
--
-- The client (entrepreneur-corp.html) reads the same column name from
-- the row payload and is being updated in the same commit; both sides
-- now line up on 'infrastructure'.
--
-- Idempotent (CREATE OR REPLACE). No schema change.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

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
    IF p_tier NOT IN ('small','medium','large','major','monumental') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_tier');
    END IF;
    IF p_building_type NOT IN ('regional_hq','construction_yard','port','banking_office','real_estate_office') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_building_type');
    END IF;
    IF p_building_type = 'regional_hq' AND p_tier NOT IN ('small','medium','large') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_rhq_tier');
    END IF;

    CASE p_tier
        WHEN 'small'      THEN v_cost_base := 20000000;   v_dur_base := 24; v_ambition := 1;
        WHEN 'medium'     THEN v_cost_base := 50000000;   v_dur_base := 27; v_ambition := 2;
        WHEN 'large'      THEN v_cost_base := 100000000;  v_dur_base := 30; v_ambition := 3;
        WHEN 'major'      THEN v_cost_base := 200000000;  v_dur_base := 33; v_ambition := 4;
        WHEN 'monumental' THEN v_cost_base := 400000000;  v_dur_base := 36; v_ambition := 5;
    END CASE;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.industry <> 'construction' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_construction_corp');
    END IF;

    -- THE FIX: nations column is 'infrastructure', not
    -- 'physical_infrastructure'. Everything else is unchanged.
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

    IF p_building_type IN ('port','banking_office','real_estate_office') THEN
        SELECT COUNT(*) INTO v_cy_count FROM corp_buildings
         WHERE owner_corp_id = p_corp_id
           AND nation_id = p_nation_id
           AND building_type = 'construction_yard'
           AND status = 'completed';
        SELECT COUNT(*) INTO v_in_progress FROM corp_buildings
         WHERE builder_corp_id = p_corp_id
           AND nation_id = p_nation_id
           AND building_type IN ('port','banking_office','real_estate_office')
           AND status = 'in_progress';
        IF v_in_progress >= v_cy_count * 2 THEN
            RETURN jsonb_build_object('success', false, 'reason', 'capacity_exceeded',
                'cy_count', v_cy_count, 'max', v_cy_count * 2, 'in_progress', v_in_progress);
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

    IF COALESCE(v_fac.party_funds, 0) < v_cost THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'have', COALESCE(v_fac.party_funds, 0), 'need', v_cost);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE factions
       SET party_funds  = COALESCE(party_funds, 0) - v_cost,
           ent_ambition = COALESCE(ent_ambition, 0) + v_ambition
     WHERE id = v_fac.id;

    INSERT INTO corp_buildings
        (builder_corp_id, owner_corp_id, nation_id, name, tier, building_type,
         cost_paid, ambition_granted,
         status, started_at_tick, completes_at_tick)
    VALUES
        (p_corp_id, p_corp_id, p_nation_id, btrim(p_name), p_tier, p_building_type,
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
                   WHEN 'regional_hq'        THEN 'Regional HQ'
                   WHEN 'construction_yard'  THEN 'Construction Yard'
                   WHEN 'port'               THEN 'Port'
                   WHEN 'banking_office'     THEN 'Banking Office'
                   WHEN 'real_estate_office' THEN 'Real Estate Office'
               END,
               v_nation_name),
        'corporate', 'begin_construction',
        jsonb_build_object(
            'building_id',       v_id,
            'corp_id',           p_corp_id,
            'corp_name',         v_corp.name,
            'tier',              p_tier,
            'building_type',     p_building_type,
            'cost',              v_cost,
            'duration',          v_duration,
            'completes_at_tick', v_tick + v_duration,
            'ambition_bump',     v_ambition,
            'cost_multiplier',   ROUND(v_mult, 3),
            'cost_of_living',    v_col,
            'infrastructure',    v_inf
        ),
        v_tick
    );

    RETURN jsonb_build_object(
        'success',           true,
        'building_id',       v_id,
        'tier',              p_tier,
        'building_type',     p_building_type,
        'cost',              v_cost,
        'duration',          v_duration,
        'ambition_bump',     v_ambition,
        'started_at_tick',   v_tick,
        'completes_at_tick', v_tick + v_duration,
        'new_funds',         COALESCE(v_fac.party_funds, 0) - v_cost,
        'cost_multiplier',   ROUND(v_mult, 3)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.begin_construction(uuid, uuid, text, text, text) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK ──
-- Re-apply 20270176 to restore the (broken) physical_infrastructure
-- reference. There's no real reason to roll back — the previous body
-- never succeeded.
