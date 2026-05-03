-- 20260727_platform_sector_popularity.sql
--
-- Wires party platforms into the sector-popularity system.
-- Adopting a platform now applies a one-shot bump to the faction's
-- popularity within 1–3 voter blocs ("sectors": Religious Conservatives,
-- Service & Gig Workers, Capital Owners, etc.) — boosts for the
-- platform's natural constituencies, penalties for its structural
-- opposition.
--
-- Failure (promised stat targets not met by the deadline) reverts ONLY
-- the boosts at full magnitude. Penalties stay — the people you
-- alienated by adopting the platform aren't reconciled by your failure
-- to deliver. Replaces the existing −20 momentum failure penalty.
--
-- Stat-promise delta is also halved (20 → 10) so the load is split
-- between popularity (new headline) and stat targets (now lighter).
-- That change is applied in JS (PROMISE_DELTA constant).
--
-- Storage convention: faction_sector_popularity.popularity is integer
-- tenths (0–100 = 0.0–10.0). All deltas in this migration are stored
-- as tenths so +1.5 popularity = +15 stored.

BEGIN;

-- ── 1. platform_sector_effects catalog ──────────────────────────
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


-- ── 2. _apply_platform_sector_effects ───────────────────────────
-- Mode 'adopt': apply ALL deltas (boosts AND penalties).
-- Mode 'fail':  apply NEGATIVE of the boost-row deltas only.
--               (Penalties stay — failing to deliver doesn't
--               un-alienate the people you already hurt by adopting.)
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
            -- (Some nations may have custom sector loadouts that omit
            -- the canonical bloc this effect targets.)
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
-- Reachable from adopt_platform (PERFORM, function-owner privilege chain)
-- and from advance-tick edge function (service_role).


-- ── 3. adopt_platform: call _apply_platform_sector_effects ──────
-- Wraps the existing adopt_platform body, adding step 9.5 (apply
-- popularity effects). All other behavior unchanged.
CREATE OR REPLACE FUNCTION adopt_platform(
    p_faction_id UUID,
    p_nation_id UUID,
    p_platform_key TEXT,
    p_tick INT,
    p_baseline_stats JSONB DEFAULT '{}'::jsonb,
    p_target_stats JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_ap_result INT;
    v_next_slot INT;
    v_last_adopted_tick INT;
    v_existing_count INT;
    v_existing_holder RECORD;
    v_my_momentum NUMERIC;
    v_penalty NUMERIC;
    v_cooldown_ticks INT := 6;
    v_ap_cost INT := 2;
    v_pop_result JSONB;
BEGIN
    IF EXISTS (SELECT 1 FROM faction_platforms WHERE faction_id = p_faction_id AND platform_key = p_platform_key) THEN
        RETURN jsonb_build_object('success', false, 'error', 'You have already adopted this platform.');
    END IF;

    SELECT COALESCE(MAX(slot), 0) + 1 INTO v_next_slot
    FROM faction_platforms WHERE faction_id = p_faction_id;

    IF v_next_slot > 3 THEN
        RETURN jsonb_build_object('success', false, 'error', 'All 3 platform slots are full.');
    END IF;

    SELECT MAX(adopted_at_tick) INTO v_last_adopted_tick
    FROM faction_platforms WHERE faction_id = p_faction_id;

    IF v_last_adopted_tick IS NOT NULL AND (p_tick - v_last_adopted_tick) < v_cooldown_ticks THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Platform cooldown active. ' || (v_cooldown_ticks - (p_tick - v_last_adopted_tick)) || ' ticks remaining.'
        );
    END IF;

    v_ap_result := deduct_ap(p_faction_id, v_ap_cost);
    IF v_ap_result < 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not enough AP. Need ' || v_ap_cost || ' AP.');
    END IF;

    SELECT COUNT(*) INTO v_existing_count
    FROM faction_platforms
    WHERE nation_id = p_nation_id
      AND platform_key = p_platform_key
      AND faction_id != p_faction_id;

    CASE v_existing_count
        WHEN 0 THEN v_my_momentum := 12; v_penalty := 0;
        WHEN 1 THEN v_my_momentum := 6;  v_penalty := 6;
        WHEN 2 THEN v_my_momentum := 4;  v_penalty := 4;
        ELSE         v_my_momentum := 2;  v_penalty := 2;
    END CASE;

    IF v_penalty > 0 THEN
        FOR v_existing_holder IN
            SELECT fp.faction_id
            FROM faction_platforms fp
            WHERE fp.nation_id = p_nation_id
              AND fp.platform_key = p_platform_key
              AND fp.faction_id != p_faction_id
        LOOP
            PERFORM adjust_momentum(
                v_existing_holder.faction_id,
                -v_penalty,
                'Platform contested: ' || p_platform_key,
                p_tick
            );
        END LOOP;
    END IF;

    PERFORM adjust_momentum(
        p_faction_id,
        v_my_momentum,
        'Platform adopted: ' || p_platform_key,
        p_tick
    );

    INSERT INTO faction_platforms (faction_id, nation_id, platform_key, slot, adopted_at_tick, baseline_stats, target_stats)
    VALUES (p_faction_id, p_nation_id, p_platform_key, v_next_slot, p_tick, p_baseline_stats, p_target_stats);

    -- ── NEW: sector-popularity bumps (one-shot). ──
    -- Boosts + penalties both fire here. Failure path (in
    -- platform-promises.js) reverts only the boosts.
    v_pop_result := _apply_platform_sector_effects(
        p_faction_id, p_nation_id, p_platform_key, 'adopt'
    );

    RETURN jsonb_build_object(
        'success', true,
        'slot', v_next_slot,
        'momentum_gained', v_my_momentum,
        'existing_holders_penalized', v_existing_count,
        'penalty_per_holder', v_penalty,
        'sector_effects', v_pop_result
    );
END;
$$;

ALTER FUNCTION public.adopt_platform(UUID, UUID, TEXT, INT, JSONB, JSONB) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.adopt_platform(UUID, UUID, TEXT, INT, JSONB, JSONB) TO authenticated;


COMMIT;

NOTIFY pgrst, 'reload schema';
