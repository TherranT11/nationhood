-- ═══════════════════════════════════════════════════════════════════════════════
-- ADD NATION — admin_create_nation RPC
-- ═══════════════════════════════════════════════════════════════════════════════
-- One transactional RPC that materialises a brand-new, playable nation from the
-- Admin Panel "Add Nation" tab. Replaces the manual phased SQL walkthrough
-- (insert_<nation>.sql Phase 2 → Phase 18) with a single call.
--
-- What it seeds, in order (all in one txn — any error rolls the whole thing back):
--   1. nations           — base identity + head-of-state + headline economics +
--                          schedule. Stat columns are left at their NOT NULL
--                          DEFAULT 50 unless overridden via p_payload->'stats'.
--                          (The AFTER INSERT trigger seeds the 12 default sectors
--                           + faction popularity automatically — no action here.)
--   2. nations (stats)   — COALESCE overrides for every stat supplied in 'stats'.
--   3. nation_profiles   — lore / flag / sidebar metadata (minimal; the rest is
--                          editable later in the existing nation editors).
--   4. ministries        — cabinet slots, vacant. prime_minister included for
--                          every gov type EXCEPT pure Presidential (mirrors
--                          hasParliamentaryPM() in js/game/government-types.js).
--   5. diplomatic_relations — one neutral row fanned out to every existing nation
--                          (relation_score 30, embassies open, single proximity).
--   6. administrations   — a caretaker administration covering the window until
--                          the first election (closed by inauguratePresident /
--                          formation when it fires). Mirrors Danwei Phase 16.
--   7. nation_policies   — pre-activates the chosen catalog policies as already-
--                          baked structural law (activated_at_tick 0, effects
--                          completed). Categorisation is COPIED from the policies
--                          catalog row so it never drifts. Mirrors the Calveth seed.
--
-- Government-type handling (canonical values stored in nations.government_type):
--   'Presidential'        — direct-vote president, no PM seat, presidential term cols.
--   'Semi-Presidential'   — president + PM, both presidential and parliamentary terms.
--   'Parliamentary'       — PM-led. A Constitutional Monarchy is THIS type with a
--                           hereditary head of state (hos_election_method='hereditary',
--                           head_of_state_title='King'/'Queen', dynasty_* set) —
--                           exactly the Calveth pattern.
--   'Absolute Monarchy'   — hereditary, PM seat present, NO elections (static seats,
--                           next_election_tick NULL — the known monarchy gap).
--
-- Auth: SECURITY DEFINER, gated by is_admin() (same as admin_create_hub).
-- Idempotency: blocks a duplicate nation name; safe to retry after a failure.
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.admin_create_nation(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_name        text := btrim(COALESCE(p_payload->>'name', ''));
    v_gov_type    text := COALESCE(NULLIF(btrim(p_payload->>'government_type'), ''), 'Parliamentary');
    v_capital     text := btrim(COALESCE(p_payload->>'capital', ''));
    v_continent   text := btrim(COALESCE(p_payload->>'continent', ''));
    v_shard_name  text := COALESCE(NULLIF(btrim(p_payload->>'shard_name'), ''), 'Alpha Shard');
    v_shard_id    uuid;
    v_cur_tick    int;
    v_cur_date    text;
    v_nation_id   uuid;
    v_stats       jsonb := COALESCE(p_payload->'stats', '{}'::jsonb);
    v_policy_ids  uuid[];
    v_include_pm  boolean;
    v_has_elect   boolean;
    v_next_elect  int;
    v_proximity   int := COALESCE(NULLIF(p_payload->>'proximity', '')::int, 80);
    v_total_seats int := COALESCE(NULLIF(p_payload->>'total_seats', '')::int, 100);
    v_min_count   int;
    v_dipl_count  int;
    v_pol_count   int;
BEGIN
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;

    -- ── Validate ─────────────────────────────────────────────────────────────
    IF length(v_name) < 2 OR length(v_name) > 60 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_name');
    END IF;
    IF EXISTS (SELECT 1 FROM nations WHERE LOWER(name) = LOWER(v_name)) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'name_exists');
    END IF;
    IF length(v_capital) < 2 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_capital');
    END IF;
    IF v_gov_type NOT IN ('Parliamentary', 'Presidential', 'Semi-Presidential', 'Absolute Monarchy') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_government_type');
    END IF;
    IF v_total_seats < 1 OR v_total_seats > 1000 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_total_seats');
    END IF;

    SELECT id, current_tick, "current_date"
      INTO v_shard_id, v_cur_tick, v_cur_date
      FROM shard WHERE name = v_shard_name;
    IF v_shard_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'shard_not_found');
    END IF;

    v_include_pm := (v_gov_type <> 'Presidential');
    v_has_elect  := (v_gov_type <> 'Absolute Monarchy');
    v_next_elect := CASE WHEN v_has_elect
                         THEN v_cur_tick + (floor(random() * 6) + 1)::int
                         ELSE NULL END;

    -- ── 1. Base nations row (unset stats fall to their NOT NULL DEFAULT 50) ────
    INSERT INTO nations (
        name, government_type, total_seats, max_parties, capital, shard_id, continent,
        hos_election_method, head_of_state_title,
        head_of_state_first_name, head_of_state_last_name, head_of_state_age,
        dynasty_name, dynasty_established_tick,
        population, eligible_voters, gdp, debt,
        presidential_term_ticks, presidential_term_limit, parliamentary_term_ticks,
        election_frequency, next_election_tick
    ) VALUES (
        v_name, v_gov_type, v_total_seats,
        COALESCE(NULLIF(p_payload->>'max_parties', '')::int, 8),
        v_capital, v_shard_id, NULLIF(v_continent, ''),
        NULLIF(btrim(p_payload->>'hos_election_method'), ''),
        NULLIF(btrim(p_payload->>'head_of_state_title'), ''),
        NULLIF(btrim(p_payload->>'head_of_state_first_name'), ''),
        NULLIF(btrim(p_payload->>'head_of_state_last_name'), ''),
        NULLIF(p_payload->>'head_of_state_age', '')::int,
        NULLIF(btrim(p_payload->>'dynasty_name'), ''),
        CASE WHEN (p_payload ? 'dynasty_name') THEN COALESCE(NULLIF(p_payload->>'dynasty_established_tick', '')::int, 0) END,
        COALESCE(NULLIF(p_payload->>'population', '')::bigint, 10000000),
        COALESCE(NULLIF(p_payload->>'eligible_voters', '')::numeric, 8000000),
        COALESCE(NULLIF(p_payload->>'gdp', '')::numeric, 500000000000),
        COALESCE(NULLIF(p_payload->>'debt', '')::numeric, 100000000000),
        CASE WHEN v_gov_type IN ('Presidential', 'Semi-Presidential')
             THEN COALESCE(NULLIF(p_payload->>'presidential_term_ticks', '')::int, 48) END,
        CASE WHEN v_gov_type IN ('Presidential', 'Semi-Presidential')
             THEN COALESCE(NULLIF(p_payload->>'presidential_term_limit', '')::int, 2) END,
        CASE WHEN v_include_pm
             THEN COALESCE(NULLIF(p_payload->>'parliamentary_term_ticks', '')::int, 48) END,
        COALESCE(NULLIF(p_payload->>'election_frequency', '')::int, 48),
        v_next_elect
    )
    RETURNING id INTO v_nation_id;

    -- ── 2. Stat overrides (only those supplied; rest keep the DB default) ──────
    UPDATE nations SET
        gdp_growth                  = COALESCE(NULLIF(v_stats->>'gdp_growth', '')::numeric, gdp_growth),
        debt_growth                 = COALESCE(NULLIF(v_stats->>'debt_growth', '')::numeric, debt_growth),
        inflation                   = COALESCE(NULLIF(v_stats->>'inflation', '')::numeric, inflation),
        interest_rates              = COALESCE(NULLIF(v_stats->>'interest_rates', '')::numeric, interest_rates),
        trade_balance               = COALESCE(NULLIF(v_stats->>'trade_balance', '')::numeric, trade_balance),
        currency_strength           = COALESCE(NULLIF(v_stats->>'currency_strength', '')::numeric, currency_strength),
        foreign_investment          = COALESCE(NULLIF(v_stats->>'foreign_investment', '')::numeric, foreign_investment),
        credit                      = COALESCE(NULLIF(v_stats->>'credit', '')::numeric, credit),
        income_tax                  = COALESCE(NULLIF(v_stats->>'income_tax', '')::numeric, income_tax),
        corporate_tax               = COALESCE(NULLIF(v_stats->>'corporate_tax', '')::numeric, corporate_tax),
        sales_tax                   = COALESCE(NULLIF(v_stats->>'sales_tax', '')::numeric, sales_tax),
        tariffs                     = COALESCE(NULLIF(v_stats->>'tariffs', '')::numeric, tariffs),
        unemployment                = COALESCE(NULLIF(v_stats->>'unemployment', '')::numeric, unemployment),
        labor_force_participation   = COALESCE(NULLIF(v_stats->>'labor_force_participation', '')::numeric, labor_force_participation),
        minimum_wage                = COALESCE(NULLIF(v_stats->>'minimum_wage', '')::numeric, minimum_wage),
        union_strength              = COALESCE(NULLIF(v_stats->>'union_strength', '')::numeric, union_strength),
        poverty_rate                = COALESCE(NULLIF(v_stats->>'poverty_rate', '')::numeric, poverty_rate),
        income_inequality           = COALESCE(NULLIF(v_stats->>'income_inequality', '')::numeric, income_inequality),
        population_growth           = COALESCE(NULLIF(v_stats->>'population_growth', '')::numeric, population_growth),
        median_age                  = COALESCE(NULLIF(v_stats->>'median_age', '')::int, median_age),
        ethnic_diversity            = COALESCE(NULLIF(v_stats->>'ethnic_diversity', '')::numeric, ethnic_diversity),
        healthcare_quality          = COALESCE(NULLIF(v_stats->>'healthcare_quality', '')::numeric, healthcare_quality),
        healthcare_accessibility    = COALESCE(NULLIF(v_stats->>'healthcare_accessibility', '')::numeric, healthcare_accessibility),
        beds_per_100k               = COALESCE(NULLIF(v_stats->>'beds_per_100k', '')::numeric, beds_per_100k),
        lifespan                    = COALESCE(NULLIF(v_stats->>'lifespan', '')::numeric, lifespan),
        drug_use                    = COALESCE(NULLIF(v_stats->>'drug_use', '')::numeric, drug_use),
        literacy                    = COALESCE(NULLIF(v_stats->>'literacy', '')::numeric, literacy),
        higher_education            = COALESCE(NULLIF(v_stats->>'higher_education', '')::numeric, higher_education),
        education_accessibility     = COALESCE(NULLIF(v_stats->>'education_accessibility', '')::numeric, education_accessibility),
        academic_immigration        = COALESCE(NULLIF(v_stats->>'academic_immigration', '')::numeric, academic_immigration),
        physical_infrastructure     = COALESCE(NULLIF(v_stats->>'physical_infrastructure', '')::numeric, physical_infrastructure),
        digital_infrastructure      = COALESCE(NULLIF(v_stats->>'digital_infrastructure', '')::numeric, digital_infrastructure),
        rail_network                = COALESCE(NULLIF(v_stats->>'rail_network', '')::numeric, rail_network),
        urbanization                = COALESCE(NULLIF(v_stats->>'urbanization', '')::numeric, urbanization),
        energy_generation           = COALESCE(NULLIF(v_stats->>'energy_generation', '')::numeric, energy_generation),
        renewable_energy_percentage = COALESCE(NULLIF(v_stats->>'renewable_energy_percentage', '')::numeric, renewable_energy_percentage),
        arable_land                 = COALESCE(NULLIF(v_stats->>'arable_land', '')::numeric, arable_land),
        rare_minerals               = COALESCE(NULLIF(v_stats->>'rare_minerals', '')::numeric, rare_minerals),
        oil_and_gas                 = COALESCE(NULLIF(v_stats->>'oil_and_gas', '')::numeric, oil_and_gas),
        fuel_prices                 = COALESCE(NULLIF(v_stats->>'fuel_prices', '')::numeric, fuel_prices),
        pollution                   = COALESCE(NULLIF(v_stats->>'pollution', '')::numeric, pollution),
        carbon_emissions            = COALESCE(NULLIF(v_stats->>'carbon_emissions', '')::numeric, carbon_emissions),
        standard_of_living          = COALESCE(NULLIF(v_stats->>'standard_of_living', '')::numeric, standard_of_living),
        happiness                   = COALESCE(NULLIF(v_stats->>'happiness', '')::numeric, happiness),
        social_mobility             = COALESCE(NULLIF(v_stats->>'social_mobility', '')::numeric, social_mobility),
        benefits                    = COALESCE(NULLIF(v_stats->>'benefits', '')::numeric, benefits),
        crime_rate                  = COALESCE(NULLIF(v_stats->>'crime_rate', '')::numeric, crime_rate),
        incarceration_rate          = COALESCE(NULLIF(v_stats->>'incarceration_rate', '')::numeric, incarceration_rate),
        stability                   = COALESCE(NULLIF(v_stats->>'stability', '')::numeric, stability),
        legitimacy                  = COALESCE(NULLIF(v_stats->>'legitimacy', '')::numeric, legitimacy),
        efficiency                  = COALESCE(NULLIF(v_stats->>'efficiency', '')::numeric, efficiency),
        gov_approval                = COALESCE(NULLIF(v_stats->>'gov_approval', '')::real, gov_approval),
        corruption                  = COALESCE(NULLIF(v_stats->>'corruption', '')::numeric, corruption),
        press_freedom               = COALESCE(NULLIF(v_stats->>'press_freedom', '')::numeric, press_freedom),
        judicial_independence       = COALESCE(NULLIF(v_stats->>'judicial_independence', '')::numeric, judicial_independence),
        freedom_index               = COALESCE(NULLIF(v_stats->>'freedom_index', '')::numeric, freedom_index),
        polarization                = COALESCE(NULLIF(v_stats->>'polarization', '')::numeric, polarization),
        civil_unrest                = COALESCE(NULLIF(v_stats->>'civil_unrest', '')::numeric, civil_unrest),
        terrorism                   = COALESCE(NULLIF(v_stats->>'terrorism', '')::numeric, terrorism),
        political_violence          = COALESCE(NULLIF(v_stats->>'political_violence', '')::numeric, political_violence),
        immigration                 = COALESCE(NULLIF(v_stats->>'immigration', '')::numeric, immigration),
        illegal_immigration         = COALESCE(NULLIF(v_stats->>'illegal_immigration', '')::numeric, illegal_immigration),
        emigration                  = COALESCE(NULLIF(v_stats->>'emigration', '')::numeric, emigration),
        religiosity                 = COALESCE(NULLIF(v_stats->>'religiosity', '')::numeric, religiosity),
        cost_of_living              = COALESCE(NULLIF(v_stats->>'cost_of_living', '')::numeric, cost_of_living),
        housing_affordability       = COALESCE(NULLIF(v_stats->>'housing_affordability', '')::numeric, housing_affordability),
        manufacturing_output        = COALESCE(NULLIF(v_stats->>'manufacturing_output', '')::numeric, manufacturing_output),
        service_output              = COALESCE(NULLIF(v_stats->>'service_output', '')::numeric, service_output)
    WHERE id = v_nation_id;

    -- ── 3. nation_profiles (minimal; rest editable later) ─────────────────────
    INSERT INTO nation_profiles (
        nation_id, flag_url, overview, motto, official_name, demonym,
        languages, religion, currency_name, founded_year
    ) VALUES (
        v_nation_id,
        NULLIF(btrim(p_payload->>'flag_url'), ''),
        NULLIF(btrim(p_payload->>'overview'), ''),
        NULLIF(btrim(p_payload->>'motto'), ''),
        NULLIF(btrim(p_payload->>'official_name'), ''),
        NULLIF(btrim(p_payload->>'demonym'), ''),
        NULLIF(btrim(p_payload->>'languages'), ''),
        NULLIF(btrim(p_payload->>'religion'), ''),
        NULLIF(btrim(p_payload->>'currency_name'), ''),
        NULLIF(btrim(p_payload->>'founded_year'), '')
    )
    ON CONFLICT (nation_id) DO NOTHING;

    -- ── 4. Ministries (vacant). prime_minister only when the gov type has a PM. ─
    INSERT INTO ministries (nation_id, ministry_key, ministry_name, is_active, party_id)
    SELECT v_nation_id, m.key, m.name, true, NULL
      FROM (VALUES
            ('prime_minister', 'Prime Minister',            v_include_pm),
            ('interior',       'Ministry of the Interior',  true),
            ('foreign',        'Foreign Ministry',          true),
            ('defense',        'Ministry of Defense',       true),
            ('finance',        'Ministry of Finance',       true),
            ('education',      'Ministry of Education',      true),
            ('healthcare',     'Ministry of Healthcare',    true),
            ('labor',          'Ministry of Labor',         true),
            ('justice',        'Ministry of Justice',       true),
            ('trade',          'Ministry of Trade',         true),
            ('energy',         'Ministry of Energy',        true),
            ('transportation', 'Ministry of Transportation',true)
           ) AS m(key, name, include)
     WHERE m.include
       AND NOT EXISTS (
           SELECT 1 FROM ministries mn
            WHERE mn.nation_id = v_nation_id AND mn.ministry_key = m.key
       );

    -- ── 5. Diplomatic relations — neutral fan-out to every existing nation ─────
    INSERT INTO diplomatic_relations (
        nation_a_id, nation_b_id, relation_type, relation_score, proximity
    )
    SELECT LEAST(v_nation_id, n.id), GREATEST(v_nation_id, n.id),
           'neutral', 30, v_proximity
      FROM nations n
     WHERE n.id <> v_nation_id
    ON CONFLICT (nation_a_id, nation_b_id) DO NOTHING;

    -- ── 6. Caretaker administration (closed automatically at first election) ───
    INSERT INTO administrations (
        nation_id, admin_name, head_of_state, head_of_state_title,
        president_name, president_party_id, president_party_name,
        coalition_parties, total_seats, government_type,
        started_at_tick, started_at_date, stats_at_start, approval_at_start
    )
    SELECT
        v_nation_id,
        'Caretaker Administration',
        btrim(COALESCE(n.head_of_state_first_name, '') || ' ' || COALESCE(n.head_of_state_last_name, '')),
        n.head_of_state_title,
        btrim(COALESCE(n.head_of_state_first_name, '') || ' ' || COALESCE(n.head_of_state_last_name, '')),
        NULL::uuid, NULL::text, '[]'::jsonb, 0, v_gov_type,
        v_cur_tick, v_cur_date, NULL::jsonb, 50
      FROM nations n
     WHERE n.id = v_nation_id
       AND NOT EXISTS (
           SELECT 1 FROM administrations a
            WHERE a.nation_id = v_nation_id AND a.ended_at_tick IS NULL
       );

    -- ── 7. Pre-activate selected catalog policies as already-baked law ─────────
    IF jsonb_typeof(p_payload->'policy_ids') = 'array' THEN
        SELECT array_agg(elem::uuid)
          INTO v_policy_ids
          FROM jsonb_array_elements_text(p_payload->'policy_ids') AS elem
         WHERE elem <> '';
    END IF;

    IF v_policy_ids IS NOT NULL AND array_length(v_policy_ids, 1) > 0 THEN
        INSERT INTO nation_policies (
            nation_id, policy_id, major_sector, law_category, fiscal_category,
            status, activated_at_tick, effects_started, effects_completed, ticks_elapsed
        )
        SELECT v_nation_id, p.id, p.major_sector, p.law_category, p.fiscal_category,
               'active', 0, true, true, 48
          FROM policies p
         WHERE p.id = ANY(v_policy_ids)
        ON CONFLICT DO NOTHING;
    END IF;

    -- ── Counts for the UI confirmation toast ───────────────────────────────────
    SELECT COUNT(*) INTO v_min_count  FROM ministries WHERE nation_id = v_nation_id;
    SELECT COUNT(*) INTO v_dipl_count FROM diplomatic_relations
        WHERE nation_a_id = v_nation_id OR nation_b_id = v_nation_id;
    SELECT COUNT(*) INTO v_pol_count  FROM nation_policies WHERE nation_id = v_nation_id;

    RETURN jsonb_build_object(
        'success', true,
        'nation_id', v_nation_id,
        'name', v_name,
        'government_type', v_gov_type,
        'ministries', v_min_count,
        'diplomatic_relations', v_dipl_count,
        'policies', v_pol_count,
        'first_election_tick', v_next_elect
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_create_nation(jsonb) TO authenticated;

COMMIT;
