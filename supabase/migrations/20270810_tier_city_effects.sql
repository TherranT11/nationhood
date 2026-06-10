-- ════════════════════════════════════════════════════════════════════
-- 20270810 — Quality tiers move the host city's stats on completion
--
-- A finished building changes the city it stands in:
--
--   Low Cost     +0.1 Affordability
--   Standard     —
--   High End     −0.1 Affordability
--   Luxury       −0.3 Affordability, +0.1 Appeal
--   Ultra Rich   −0.3 Affordability, +0.1 Appeal  (same as Luxury —
--                the two spec passes assigned these numbers to each;
--                retune Ultra Rich upward any time)
--
-- Fractional deltas need fractional stats: cities.affordability and
-- cities.appeal convert int → numeric. Every existing reader keeps
-- working (the ordinance resolver's dynamic clamp is type-agnostic;
-- displays render 3.1 where they rendered 3).
--
-- complete_construction_projects re-emitted byte-faithful to
-- 20270807 except the tier-effect block: tier is read from the
-- project's blueprint (one source — never snapshotted twice), city
-- moves clamp 1..10 like ordinance stat effects.
--
-- The Draft Blueprint modal's Engineering Quality "+0.1 Appeal" perk
-- remains future copy — the user's tier table is the city-effect
-- model; only Ultra Rich touches Appeal today.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.cities
    ALTER COLUMN affordability TYPE numeric USING affordability::numeric,
    ALTER COLUMN appeal        TYPE numeric USING appeal::numeric;

CREATE OR REPLACE FUNCTION public.complete_construction_projects(p_tick int)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_proj      RECORD;
    v_completed int := 0;
    v_tier      text;
    v_aff       numeric;
    v_app       numeric;
BEGIN
    IF p_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    FOR v_proj IN
        SELECT * FROM corp_construction_projects
         WHERE status = 'building' AND completes_at_tick <= p_tick
         FOR UPDATE SKIP LOCKED
    LOOP
        UPDATE corp_construction_projects SET status = 'completed'
         WHERE id = v_proj.id;
        -- The escrowed price lands; stamped through the revenue
        -- accumulator so the Finances cards and corporate tax both
        -- see construction income.
        UPDATE entrepreneur_corps
           SET treasury_cash = COALESCE(treasury_cash, 0) + v_proj.price
         WHERE id = v_proj.corp_id;
        PERFORM stamp_entrepreneur_corp_revenue(v_proj.corp_id, p_tick, v_proj.price);

        -- Quality-tier city effects (20270810): the finished building
        -- moves the host city's stats. Tier comes from the blueprint
        -- (one source); a deleted blueprint or a city-less project
        -- simply applies nothing. Clamped 1..10 like the ordinance
        -- resolver's stat moves.
        --   low_cost +0.1 Affordability · standard — ·
        --   high_end −0.1 Affordability · luxury and ultra_rich
        --   −0.3 Affordability and +0.1 Appeal
        IF v_proj.city_id IS NOT NULL AND v_proj.blueprint_id IS NOT NULL THEN
            SELECT quality_tier INTO v_tier
              FROM corp_blueprints WHERE id = v_proj.blueprint_id;
            v_aff := CASE v_tier
                WHEN 'low_cost'   THEN  0.1
                WHEN 'high_end'   THEN -0.1
                WHEN 'luxury'     THEN -0.3
                WHEN 'ultra_rich' THEN -0.3
                ELSE 0 END;
            v_app := CASE v_tier WHEN 'luxury' THEN 0.1 WHEN 'ultra_rich' THEN 0.1 ELSE 0 END;
            IF v_aff <> 0 OR v_app <> 0 THEN
                UPDATE cities
                   SET affordability = GREATEST(1, LEAST(10, COALESCE(affordability, 5) + v_aff)),
                       appeal        = GREATEST(1, LEAST(10, COALESCE(appeal, 5)        + v_app))
                 WHERE id = v_proj.city_id;
            END IF;
        END IF;

        v_completed := v_completed + 1;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'completed', v_completed);
END $$;

REVOKE EXECUTE ON FUNCTION public.complete_construction_projects(int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.complete_construction_projects(int) TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
