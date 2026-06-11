-- ════════════════════════════════════════════════════════════════════
-- 20270831 — AUTOMOTIVE Executive Action #1: Draft Blueprint
--
-- Spend accumulated Experience to design a vehicle platform. The
-- design is five picks — type, class, engine, option packages,
-- quality — and the XP price scales with complexity:
--
--   cost = ceil( base(type) × tier_mult(class)
--                + engine_mod + 0.5 × packages + quality_mod )
--   (floor 1; the tier multiplier scales the type base only)
--
--   base:    motorcycle 2 · coupe 3 · sedan 3 · pickup 4 · sports 5
--   tier:    economy/mid ×1.0 · premium ×1.3 · luxury ×1.5 · ultra ×2.0
--   engine:  basic 3/4-cyl +0 · tuned-4/V6/hybrid/EV-basic +1 ·
--            V8/EV-performance +2 · V12 +3
--   package: +0.5 each (10 in the catalog)
--   quality: low −1 · moderate +0 · standard +1 · exceptional +2
--
-- Hard gates: Off-Road Package is pickup-only; Self-Driving Package
-- is Premium+ classes only; the V12 fits luxury classes and sports
-- cars only. vehicle_blueprint_xp_cost is the ONE place the pricing
-- lives (the client mirrors it for display).
--
-- draft_vehicle_blueprint follows the construction draft_blueprint
-- contract: owner-only, automotive-only, one executive action per
-- tick via exec_action_tick under the corp row lock — plus the XP
-- debit from entrepreneur_corps.experience (automotive has no XP
-- source yet; its earn loop comes with later actions).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE TABLE IF NOT EXISTS public.vehicle_blueprints (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    corp_id         uuid NOT NULL REFERENCES public.entrepreneur_corps(id) ON DELETE CASCADE,
    name            text NOT NULL,
    vehicle_type    text NOT NULL CHECK (vehicle_type IN
                        ('coupe', 'sedan', 'pickup', 'motorcycle', 'sports_car')),
    vehicle_class   text NOT NULL CHECK (vehicle_class IN
                        ('economy', 'mid_range', 'premium', 'luxury', 'ultra_luxury')),
    engine          text NOT NULL CHECK (engine IN
                        ('basic_3cyl', 'basic_4cyl', 'tuned_4cyl', 'v6', 'v8', 'v12',
                         'electric_basic', 'electric_performance', 'hybrid')),
    packages        text[] NOT NULL DEFAULT '{}',
    quality         text NOT NULL CHECK (quality IN
                        ('low', 'moderate', 'standard', 'exceptional')),
    xp_cost         int  NOT NULL,
    created_at_tick int  NOT NULL DEFAULT 0,
    created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS vehicle_blueprints_corp_idx
    ON public.vehicle_blueprints (corp_id);

ALTER TABLE public.vehicle_blueprints ENABLE ROW LEVEL SECURITY;

-- Public game data like the rest of the corp registry; writes only
-- through the RPC.
DROP POLICY IF EXISTS "Allow select for all" ON public.vehicle_blueprints;
CREATE POLICY "Allow select for all" ON public.vehicle_blueprints
    FOR SELECT USING (true);

-- ── vehicle_blueprint_xp_cost ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.vehicle_blueprint_xp_cost(
    p_vehicle_type  text,
    p_vehicle_class text,
    p_engine        text,
    p_package_count int,
    p_quality       text
) RETURNS int
LANGUAGE sql IMMUTABLE
AS $$
    SELECT GREATEST(1, CEIL(
        CASE p_vehicle_type
            WHEN 'motorcycle' THEN 2
            WHEN 'coupe'      THEN 3
            WHEN 'sedan'      THEN 3
            WHEN 'pickup'     THEN 4
            WHEN 'sports_car' THEN 5
            ELSE 3
        END
        * CASE p_vehicle_class
            WHEN 'premium'      THEN 1.3
            WHEN 'luxury'       THEN 1.5
            WHEN 'ultra_luxury' THEN 2.0
            ELSE 1.0
        END
        + CASE p_engine
            WHEN 'tuned_4cyl'           THEN 1
            WHEN 'v6'                   THEN 1
            WHEN 'v8'                   THEN 2
            WHEN 'v12'                  THEN 3
            WHEN 'electric_basic'       THEN 1
            WHEN 'electric_performance' THEN 2
            WHEN 'hybrid'               THEN 1
            ELSE 0
        END
        + 0.5 * GREATEST(0, COALESCE(p_package_count, 0))
        + CASE p_quality
            WHEN 'low'         THEN -1
            WHEN 'standard'    THEN 1
            WHEN 'exceptional' THEN 2
            ELSE 0
        END
    ))::int;
$$;
COMMENT ON FUNCTION public.vehicle_blueprint_xp_cost(text, text, text, int, text) IS
    'Canonical vehicle-design XP price: ceil(type base × class multiplier + engine mod + 0.5/package + quality mod), floor 1. The ONLY place the pricing lives — draft_vehicle_blueprint reads it; the client mirrors it for display.';

-- ── draft_vehicle_blueprint ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.draft_vehicle_blueprint(
    p_corp_id       uuid,
    p_name          text,
    p_vehicle_type  text,
    p_vehicle_class text,
    p_engine        text,
    p_packages      text[],
    p_quality       text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid      uuid := auth.uid();
    v_fac      factions%ROWTYPE;
    v_corp     entrepreneur_corps%ROWTYPE;
    v_tick     int;
    v_id       uuid;
    v_name     text := TRIM(COALESCE(p_name, ''));
    v_packages text[];
    v_cost     int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF length(v_name) < 2 OR length(v_name) > 60 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_name');
    END IF;
    IF p_vehicle_type NOT IN ('coupe', 'sedan', 'pickup', 'motorcycle', 'sports_car')
       OR p_vehicle_class NOT IN ('economy', 'mid_range', 'premium', 'luxury', 'ultra_luxury')
       OR p_engine NOT IN ('basic_3cyl', 'basic_4cyl', 'tuned_4cyl', 'v6', 'v8', 'v12',
                           'electric_basic', 'electric_performance', 'hybrid')
       OR p_quality NOT IN ('low', 'moderate', 'standard', 'exceptional') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    -- Packages: dedupe, then validate against the catalog and the
    -- two fitment gates (plus the V12's market restriction).
    SELECT COALESCE(array_agg(DISTINCT x), '{}') INTO v_packages
      FROM unnest(COALESCE(p_packages, '{}')) AS x;
    IF NOT (v_packages <@ ARRAY['leather_interior', 'premium_audio', 'technology',
                                'driver_assist', 'sport_performance', 'safety',
                                'appearance', 'cold_weather', 'off_road', 'self_driving']) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF 'off_road' = ANY(v_packages) AND p_vehicle_type <> 'pickup' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'off_road_pickup_only');
    END IF;
    IF 'self_driving' = ANY(v_packages)
       AND p_vehicle_class NOT IN ('premium', 'luxury', 'ultra_luxury') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'self_driving_premium_only');
    END IF;
    IF p_engine = 'v12' AND p_vehicle_type <> 'sports_car'
       AND p_vehicle_class NOT IN ('luxury', 'ultra_luxury') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'v12_restricted');
    END IF;

    -- Lock the corp row: the allowance check and the XP debit below
    -- must serialize against a concurrent draft.
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

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_corp.exec_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    v_cost := vehicle_blueprint_xp_cost(p_vehicle_type, p_vehicle_class, p_engine,
                                        COALESCE(array_length(v_packages, 1), 0), p_quality);
    IF COALESCE(v_corp.experience, 0) < v_cost THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_enough_experience',
            'xp_cost', v_cost, 'experience', COALESCE(v_corp.experience, 0));
    END IF;

    INSERT INTO vehicle_blueprints (
        corp_id, name, vehicle_type, vehicle_class, engine,
        packages, quality, xp_cost, created_at_tick
    ) VALUES (
        p_corp_id, v_name, p_vehicle_type, p_vehicle_class, p_engine,
        v_packages, p_quality, v_cost, v_tick
    ) RETURNING id INTO v_id;

    UPDATE entrepreneur_corps
       SET experience = COALESCE(experience, 0) - v_cost,
           exec_action_tick = v_tick
     WHERE id = p_corp_id;

    RETURN jsonb_build_object('success', true, 'blueprint_id', v_id,
        'name', v_name, 'xp_cost', v_cost);
END $$;

REVOKE EXECUTE ON FUNCTION public.draft_vehicle_blueprint(uuid, text, text, text, text, text[], text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.draft_vehicle_blueprint(uuid, text, text, text, text, text[], text) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
