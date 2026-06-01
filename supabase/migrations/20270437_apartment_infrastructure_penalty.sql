-- ════════════════════════════════════════════════════════════════════
-- Apartment cost formula: switch from amplifying-exponent to explicit
-- infrastructure penalty (audit follow-up to 20270435)
--
-- 20270435 shipped Pattern B as `cost = base × power(mult, sensitivity)`.
-- The audit caught that this doesn't deliver the design intent: the
-- existing nation cost multiplier formula puts typical wealthy +
-- developed (col=80, inf=80, mult=0.91) and poor + undeveloped
-- (col=30, inf=30, mult=0.96) within 5% of each other, so amplifying
-- with an exponent doesn't punish low-development nations the way
-- the pitch promised. Luxury in a low-infrastructure backwater would
-- cost ~$56M vs ~$51M in a wealthy nation — barely a 10% gap.
--
-- New formula (per user direction):
--
--   cost = base × mult × (1 + (sensitivity - 1) × (100 - infrastructure) / 100)
--
-- The "(100 - infrastructure) / 100" term is 0 at inf=100 and 1 at
-- inf=0. Multiplied by (sensitivity - 1):
--
--   sensitivity = 1.0 (Basic)   → 0 penalty everywhere (linear scaling)
--   sensitivity = 1.3 (Modest)  → +6%   premium at inf=80, +24% at inf=20
--   sensitivity = 1.7 (Luxury)  → +14%  premium at inf=80, +56% at inf=20
--
-- Player-visible effect: Luxury in a well-infrastructured capital
-- pays a small premium on top of the existing nation multiplier.
-- Luxury in an undeveloped nation pays a substantial premium — the
-- "skilled labor, materials, designers all have to be imported"
-- cost is now real and gameplay-significant. Basic remains universally
-- viable (same cost as if it were any other building type).
--
-- Single function rewrite. All other 20270435 changes (sector lock,
-- whitelist, build-load pool, eff_tier pinning, per-type base cost)
-- stay exactly as shipped. Only the cost arithmetic moves.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

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
    -- Pinned effective tier for typed buildings (plants + apartments).
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

    -- Fixed per-type cost overrides.
    IF p_building_type = 'engine_assembly_plant' THEN
        v_cost_base := 45000000;
    ELSIF p_building_type = 'light_assembly_plant' THEN
        v_cost_base := 75000000;
    ELSIF p_building_type = 'apartment_basic' THEN
        v_cost_base := 12000000;
    ELSIF p_building_type = 'apartment_modest' THEN
        v_cost_base := 25000000;
    ELSIF p_building_type = 'apartment_luxury' THEN
        v_cost_base := 60000000;
    END IF;

    -- Per-type tier sensitivity to nation infrastructure. Default 1.0
    -- collapses the per-tier premium term to zero, leaving non-apartment
    -- types on the exact pre-20270435 linear formula (base × mult).
    -- Apartments: basic 1.0 / modest 1.3 / luxury 1.7.
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

    -- Apartment infrastructure-penalty term:
    --   premium = 1 + (sensitivity - 1) × (100 - infrastructure) / 100
    -- sensitivity=1.0 → premium=1.0 (no change for Basic + everything
    -- else). sensitivity=1.7 at inf=20 → premium=1.56 (+56% on Luxury).
    -- Lifted into a variable so the per-tier curve is named where it
    -- happens, not hidden in the cost expression.
    v_apt_premium := 1.0 + (v_sensitivity - 1.0) * (100.0 - inf) / 100.0;

    IF v_cost_base IS NULL THEN
        cost := NULL; duration := NULL;       -- invalid tier
    ELSE
        cost     := ROUND(v_cost_base::numeric * mult * v_apt_premium)::bigint;
        duration := GREATEST(1, ROUND(v_dur_base::numeric * mult)::int);
    END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION public.corp_building_cost_profile(text, text, uuid) TO authenticated;

COMMENT ON FUNCTION public.corp_building_cost_profile(text, text, uuid) IS
    'Single source for a corp building''s cost / duration / ambition given type+tier+nation. Plants pin medium/large + fixed cost; apartments pin small/medium/large + fixed cost per type AND add an infrastructure-penalty premium (basic +0%, modest 6-24%, luxury 14-56% scaled by 100-infrastructure). Non-apartment types collapse to base × mult exactly. cost=NULL = invalid tier. Used by begin_construction + request_building_construction.';

NOTIFY pgrst, 'reload schema';

COMMIT;
