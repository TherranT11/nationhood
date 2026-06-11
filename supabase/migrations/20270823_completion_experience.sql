-- ════════════════════════════════════════════════════════════════════
-- 20270823 — Completing a project grants corp Experience
--
-- The Experience pool Draft Blueprint's mechanic spends finally
-- exists: entrepreneur_corps.experience, granted on every project
-- completion (public-bid wins and self-builds alike, since both
-- finish through the one completion sweep):
--
--   +3 baseline        SYSTEM DESIGN Level 0 (CAD System & Laptop —
--                      "You gain Experience at +3 per completed
--                      project"; its own ladder may raise this later)
--   + PM ladder bonus  Level II +1 · III +2 · IV +3 · V +5
--                      (Levels 0/I add nothing)
--
--   completion_experience(pm_tier): the ONLY place these numbers
--   live. complete_construction_projects re-emitted byte-faithful to
--   20270821 except the experience grant on the payout UPDATE.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.entrepreneur_corps
    ADD COLUMN IF NOT EXISTS experience numeric NOT NULL DEFAULT 0 CHECK (experience >= 0);

COMMENT ON COLUMN public.entrepreneur_corps.experience IS
    'Corp Experience Points (20270823): granted per completed project (System Design baseline + PM ladder bonus). Draft Blueprint''s EP-allocation mechanic spends from here when it lands.';

-- ── completion_experience ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.completion_experience(p_pm_tier int)
RETURNS numeric
LANGUAGE sql IMMUTABLE
AS $$
    SELECT 3 + CASE
        WHEN COALESCE(p_pm_tier, 0) >= 5 THEN 5
        WHEN COALESCE(p_pm_tier, 0) >= 4 THEN 3
        WHEN COALESCE(p_pm_tier, 0) >= 3 THEN 2
        WHEN COALESCE(p_pm_tier, 0) >= 2 THEN 1
        ELSE 0
    END;
$$;

COMMENT ON FUNCTION public.completion_experience(int) IS
    'Experience per completed project (20270823): System Design L0 baseline of 3 + PM ladder bonus (II +1, III +2, IV +3, V +5). The ONLY place these numbers live.';

-- ── complete_construction_projects — grants Experience ────────────
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
        SELECT p.* FROM corp_construction_projects p
         WHERE p.status = 'building' AND p.completes_at_tick <= p_tick
           -- 20270817: a due build PARKS until its blueprint's
           -- materials have been supplied; it completes on the first
           -- sweep after the yard delivers. Blueprint-less projects
           -- owe nothing.
           AND p.materials_supplied >= COALESCE((
               SELECT b.materials_needed FROM corp_blueprints b
                WHERE b.id = p.blueprint_id), 0)
           -- 20270821: and one committed equipment use.
           AND p.equipment_supplied >= 1
         FOR UPDATE SKIP LOCKED
    LOOP
        UPDATE corp_construction_projects SET status = 'completed'
         WHERE id = v_proj.id;
        -- The escrowed price lands; stamped through the revenue
        -- accumulator so the Finances cards and corporate tax both
        -- see construction income.
        UPDATE entrepreneur_corps
           SET treasury_cash = COALESCE(treasury_cash, 0) + v_proj.price,
               -- 20270823: completion grants Experience — System
               -- Design's +3 baseline plus the PM ladder bonus.
               experience = COALESCE(experience, 0)
                   + completion_experience(pm_tier)
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
