-- Repair: platform sector-popularity prerequisites missing on live DB
--
-- adopt_platform (20270103) fails at runtime with
--   column "popularity_applied" of relation "faction_platforms" does not exist
-- because 20260727_platform_sector_popularity.sql was never applied to
-- the live database. 20270103 redefined adopt_platform to depend on
-- three objects that 20260727 introduced:
--
--   1. faction_platforms.popularity_applied  (column)
--   2. platform_sector_effects               (catalog table + seed)
--   3. _apply_platform_sector_effects(...)    (function)
--
-- This migration installs exactly those three, verbatim from 20260727
-- §0–§2 (all idempotent: ADD COLUMN IF NOT EXISTS / CREATE TABLE IF NOT
-- EXISTS / ON CONFLICT DO NOTHING / CREATE OR REPLACE). It deliberately
-- does NOT redefine adopt_platform — re-running the whole of 20260727
-- would clobber the current no-AP, auth-gated adopt_platform (20270103)
-- with the old AP-charging version. The existing adopt_platform is
-- already correct; it just needs these prerequisites to exist.
--
-- Safe to run whether or not 20260727 was partially applied.

BEGIN;

-- ── 1. faction_platforms.popularity_applied ─────────────────────
ALTER TABLE public.faction_platforms
    ADD COLUMN IF NOT EXISTS popularity_applied BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.faction_platforms.popularity_applied IS
    'TRUE iff _apply_platform_sector_effects(... mode=adopt) ran at adoption time. The failure path checks this before reverting boosts so pre-migration platforms (adopted before sector popularity was wired in) do not get popularity docked that was never granted.';


-- ── 2. platform_sector_effects catalog + seed ───────────────────
CREATE TABLE IF NOT EXISTS public.platform_sector_effects (
    platform_key  TEXT     NOT NULL,
    sector_key    TEXT     NOT NULL,
    effect_type   TEXT     NOT NULL CHECK (effect_type IN ('boost','penalty')),
    delta_tenths  SMALLINT NOT NULL CHECK (delta_tenths <> 0),
    PRIMARY KEY (platform_key, sector_key)
);

ALTER TABLE public.platform_sector_effects ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
         WHERE schemaname = 'public'
           AND tablename  = 'platform_sector_effects'
           AND policyname = 'Anyone can read platform_sector_effects'
    ) THEN
        CREATE POLICY "Anyone can read platform_sector_effects"
            ON public.platform_sector_effects FOR SELECT USING (true);
    END IF;
END $$;

INSERT INTO public.platform_sector_effects (platform_key, sector_key, effect_type, delta_tenths) VALUES
    -- Economic Reform: pro-capital growth
    ('economic_reform',       'CAPITAL_OWNERS_EXECUTIVES',     'boost',    15),
    ('economic_reform',       'SMALL_BUSINESS_OWNERS',         'boost',     7),
    ('economic_reform',       'SERVICE_GIG_WORKERS',           'penalty', -15),
    ('economic_reform',       'SKILLED_TRADES_MANUFACTURING',  'penalty',  -7),

    -- Social Justice: redistribution
    ('social_justice',        'SERVICE_GIG_WORKERS',           'boost',    15),
    ('social_justice',        'STUDENTS_YOUNG_PRECARIAT',      'boost',    10),
    ('social_justice',        'CAPITAL_OWNERS_EXECUTIVES',     'penalty', -15),
    ('social_justice',        'SMALL_BUSINESS_OWNERS',         'penalty',  -7),

    -- National Security: borders & order
    ('national_security',     'RELIGIOUS_CONSERVATIVES',       'boost',    15),
    ('national_security',     'RETIREES_PENSIONERS',           'boost',     7),
    ('national_security',     'IMMIGRANT_MINORITY_COMMUNITIES','penalty', -17),
    ('national_security',     'CULTURAL_PRODUCERS',            'penalty', -10),

    -- Anti-Corruption: clean government, institutional efficiency
    ('anti_corruption',       'URBAN_PROFESSIONALS',           'boost',    15),
    ('anti_corruption',       'TECH_ENGINEERING_CLASS',        'boost',     7),
    ('anti_corruption',       'CAPITAL_OWNERS_EXECUTIVES',     'penalty', -10),

    -- Green Transition: climate & environment
    ('green_transition',      'URBAN_PROFESSIONALS',           'boost',    15),
    ('green_transition',      'CULTURAL_PRODUCERS',            'boost',     7),
    ('green_transition',      'RURAL_AGRICULTURAL',            'penalty', -15),
    ('green_transition',      'SKILLED_TRADES_MANUFACTURING',  'penalty', -10),

    -- Industrialization: factories & blue-collar jobs
    ('industrialization',     'SKILLED_TRADES_MANUFACTURING',  'boost',    15),
    ('industrialization',     'RURAL_AGRICULTURAL',            'boost',     7),
    ('industrialization',     'URBAN_PROFESSIONALS',           'penalty',  -7),
    ('industrialization',     'CULTURAL_PRODUCERS',            'penalty', -10),

    -- Digital Modernization: tech & connectivity
    ('digital_modernization', 'TECH_ENGINEERING_CLASS',        'boost',    15),
    ('digital_modernization', 'URBAN_PROFESSIONALS',           'boost',    10),
    ('digital_modernization', 'SKILLED_TRADES_MANUFACTURING',  'penalty', -15),
    ('digital_modernization', 'RETIREES_PENSIONERS',           'penalty',  -7),

    -- Welfare State: universal services
    ('welfare_state',         'SERVICE_GIG_WORKERS',           'boost',    15),
    ('welfare_state',         'RETIREES_PENSIONERS',           'boost',    10),
    ('welfare_state',         'CAPITAL_OWNERS_EXECUTIVES',     'penalty', -15),
    ('welfare_state',         'SMALL_BUSINESS_OWNERS',         'penalty',  -7),

    -- Populist Nationalism: anti-immigrant, anti-globalist
    ('populist_nationalism',  'RURAL_AGRICULTURAL',            'boost',    15),
    ('populist_nationalism',  'RELIGIOUS_CONSERVATIVES',       'boost',    10),
    ('populist_nationalism',  'IMMIGRANT_MINORITY_COMMUNITIES','penalty', -17),
    ('populist_nationalism',  'CULTURAL_PRODUCERS',            'penalty', -15),

    -- Free Market Liberalism: deregulate
    ('free_market',           'CAPITAL_OWNERS_EXECUTIVES',     'boost',    15),
    ('free_market',           'SMALL_BUSINESS_OWNERS',         'boost',    10),
    ('free_market',           'SERVICE_GIG_WORKERS',           'penalty', -17),
    ('free_market',           'STUDENTS_YOUNG_PRECARIAT',      'penalty',  -7),

    -- Law & Order: tough on crime
    ('law_and_order',         'RELIGIOUS_CONSERVATIVES',       'boost',    15),
    ('law_and_order',         'SMALL_BUSINESS_OWNERS',         'boost',     7),
    ('law_and_order',         'IMMIGRANT_MINORITY_COMMUNITIES','penalty', -15),
    ('law_and_order',         'STUDENTS_YOUNG_PRECARIAT',      'penalty',  -7),

    -- Education First: schools, research
    ('education_first',       'STUDENTS_YOUNG_PRECARIAT',      'boost',    15),
    ('education_first',       'TECH_ENGINEERING_CLASS',        'boost',     7),
    ('education_first',       'CAPITAL_OWNERS_EXECUTIVES',     'penalty',  -7),

    -- Healthcare Reform: fix the hospitals
    ('healthcare_reform',     'RETIREES_PENSIONERS',           'boost',    15),
    ('healthcare_reform',     'SERVICE_GIG_WORKERS',           'boost',    10),
    ('healthcare_reform',     'CAPITAL_OWNERS_EXECUTIVES',     'penalty', -10),
    ('healthcare_reform',     'SMALL_BUSINESS_OWNERS',         'penalty',  -7),

    -- Housing & Cost of Living: kitchen-table
    ('housing_cost',          'SERVICE_GIG_WORKERS',           'boost',    15),
    ('housing_cost',          'STUDENTS_YOUNG_PRECARIAT',      'boost',    10),
    ('housing_cost',          'CAPITAL_OWNERS_EXECUTIVES',     'penalty', -15),
    ('housing_cost',          'SMALL_BUSINESS_OWNERS',         'penalty',  -7),

    -- Energy Independence: domestic oil/gas
    ('energy_independence',   'RURAL_AGRICULTURAL',            'boost',    15),
    ('energy_independence',   'SKILLED_TRADES_MANUFACTURING',  'boost',    10),
    ('energy_independence',   'URBAN_PROFESSIONALS',           'penalty', -10),
    ('energy_independence',   'CULTURAL_PRODUCERS',            'penalty',  -7),

    -- Open Society: liberal democracy, civil liberties
    ('open_society',          'IMMIGRANT_MINORITY_COMMUNITIES','boost',    15),
    ('open_society',          'CULTURAL_PRODUCERS',            'boost',    10),
    ('open_society',          'TECH_ENGINEERING_CLASS',        'boost',     5),
    ('open_society',          'RELIGIOUS_CONSERVATIVES',       'penalty', -15),
    ('open_society',          'RURAL_AGRICULTURAL',            'penalty',  -7)
ON CONFLICT (platform_key, sector_key) DO NOTHING;


-- ── 3. _apply_platform_sector_effects ───────────────────────────
-- Mode 'adopt': apply ALL deltas (boosts AND penalties).
-- Mode 'fail':  apply NEGATIVE of the boost-row deltas only.
CREATE OR REPLACE FUNCTION _apply_platform_sector_effects(
    p_faction_id   UUID,
    p_nation_id    UUID,
    p_platform_key TEXT,
    p_mode         TEXT  -- 'adopt' | 'fail'
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_eff      RECORD;
    v_sector_id UUID;
    v_applied  INTEGER := 0;
    v_change   SMALLINT;
BEGIN
    IF p_mode NOT IN ('adopt','fail') THEN
        RETURN jsonb_build_object('success', false, 'error', 'invalid mode');
    END IF;

    FOR v_eff IN
        SELECT sector_key, effect_type, delta_tenths
          FROM platform_sector_effects
         WHERE platform_key = p_platform_key
    LOOP
        -- Failure path skips penalty rows entirely.
        IF p_mode = 'fail' AND v_eff.effect_type = 'penalty' THEN
            CONTINUE;
        END IF;

        -- Failure path inverts the boost (the gain reverts at full magnitude).
        v_change := CASE WHEN p_mode = 'fail' THEN -v_eff.delta_tenths ELSE v_eff.delta_tenths END;

        SELECT id INTO v_sector_id
          FROM sectors
         WHERE nation_id  = p_nation_id
           AND sector_key = v_eff.sector_key
           AND is_active  = true
         LIMIT 1;

        IF v_sector_id IS NULL THEN
            -- Nation doesn't have this sector seeded — silently skip.
            CONTINUE;
        END IF;

        -- Upsert + clamp [0, 100] (tenths => 0.0–10.0 popularity).
        INSERT INTO faction_sector_popularity (faction_id, sector_id, popularity)
        VALUES (p_faction_id, v_sector_id, GREATEST(0, LEAST(100, v_change)))
        ON CONFLICT (faction_id, sector_id) DO UPDATE
            SET popularity = GREATEST(0, LEAST(100,
                    faction_sector_popularity.popularity + v_change
                )),
                updated_at = NOW();

        v_applied := v_applied + 1;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'applied', v_applied, 'mode', p_mode);
END;
$$;

REVOKE EXECUTE ON FUNCTION _apply_platform_sector_effects(UUID, UUID, TEXT, TEXT) FROM PUBLIC;

COMMIT;

NOTIFY pgrst, 'reload schema';
