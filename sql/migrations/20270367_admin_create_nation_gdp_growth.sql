-- ═══════════════════════════════════════════════════════════════════════════════
-- ADD NATION — plumb politician_gdp_growth through the admin tool
-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration 20270364 added the politician_gdp_growth column and the politician-
-- nation.html renderer reads it, but the Add Nation form had no input for it —
-- new nations took the DEFAULT 50 (Stagnant tier) with no way to set them
-- otherwise short of hand-edited SQL. This fixes the gap:
--
--   1. admin_create_nation: read politician_gdp_growth from the payload and
--      write it on the INSERT (defaults to 50 when absent so existing payloads
--      keep working unchanged).
--   2. Admin form HTML: append a "GDP Growth (0–100)" input to the politician
--      headline stats grid, between Civil Freedoms and the close of the grid.
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- Part 1: RPC plumbing.
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
    v_include_pm  boolean;
    v_has_elect   boolean;
    v_next_elect  int;
    v_total_seats int := COALESCE(NULLIF(p_payload->>'total_seats', '')::int, 100);
    v_population  bigint := COALESCE(NULLIF(p_payload->>'population', '')::bigint, 10000000);
    v_pol_gdp     numeric := COALESCE(NULLIF(p_payload->>'politician_gdp',    '')::numeric, 500000000000);
    v_pol_budget  numeric := COALESCE(NULLIF(p_payload->>'politician_budget', '')::numeric, 100000000000);
    v_pol_debt    numeric := COALESCE(NULLIF(p_payload->>'politician_debt',   '')::numeric, 100000000000);
    v_pol_stab    int     := COALESCE(NULLIF(p_payload->>'politician_stability',      '')::int, 50);
    v_pol_civ     int     := COALESCE(NULLIF(p_payload->>'politician_civil_freedoms', '')::int, 50);
    v_pol_gdpg    int     := COALESCE(NULLIF(p_payload->>'politician_gdp_growth',     '')::int, 50);
    v_min_count   int;
    v_dipl_count  int;
    v_pol_count   int;
BEGIN
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;

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
    IF v_pol_stab < 0 OR v_pol_stab > 100
       OR v_pol_civ  < 0 OR v_pol_civ  > 100
       OR v_pol_gdpg < 0 OR v_pol_gdpg > 100 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_politician_stat');
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

    INSERT INTO nations (
        name, government_type, total_seats, max_parties, capital, shard_id, continent,
        hos_election_method, head_of_state_title,
        head_of_state_first_name, head_of_state_last_name, head_of_state_age,
        dynasty_name, dynasty_established_tick,
        population, eligible_voters, gdp, debt,
        politician_gdp, politician_budget, politician_debt,
        politician_stability, politician_civil_freedoms, politician_gdp_growth,
        presidential_term_ticks, presidential_term_limit, parliamentary_term_ticks,
        election_frequency, next_election_tick,
        is_neptune_nation
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
        v_population,
        COALESCE(NULLIF(p_payload->>'eligible_voters', '')::numeric, (v_population * 0.8)::numeric),
        v_pol_gdp, v_pol_debt,
        v_pol_gdp, v_pol_budget, v_pol_debt,
        v_pol_stab, v_pol_civ, v_pol_gdpg,
        CASE WHEN v_gov_type IN ('Presidential', 'Semi-Presidential')
             THEN COALESCE(NULLIF(p_payload->>'presidential_term_ticks', '')::int, 48) END,
        CASE WHEN v_gov_type IN ('Presidential', 'Semi-Presidential')
             THEN COALESCE(NULLIF(p_payload->>'presidential_term_limit', '')::int, 2) END,
        CASE WHEN v_include_pm
             THEN COALESCE(NULLIF(p_payload->>'parliamentary_term_ticks', '')::int, 48) END,
        COALESCE(NULLIF(p_payload->>'election_frequency', '')::int, 48),
        v_next_elect,
        TRUE
    )
    RETURNING id INTO v_nation_id;

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

    INSERT INTO diplomatic_relations (
        nation_a_id, nation_b_id, relation_type, relation_score, proximity
    )
    SELECT
        LEAST(v_nation_id, n.id), GREATEST(v_nation_id, n.id),
        'neutral', 30,
        COALESCE(NULLIF(p_payload->'proximities'->>n.id::text, '')::int, 80)
      FROM nations n
     WHERE n.id <> v_nation_id
    ON CONFLICT (nation_a_id, nation_b_id) DO NOTHING;

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

    IF jsonb_typeof(p_payload->'policies') = 'array' THEN
        INSERT INTO nation_policies (
            nation_id, policy_id, selected_option_id,
            major_sector, law_category, fiscal_category,
            status, activated_at_tick, effects_started, effects_completed, ticks_elapsed
        )
        SELECT
            v_nation_id,
            (elem->>'id')::uuid,
            NULLIF(elem->>'option_id', '')::uuid,
            p.major_sector, p.law_category, p.fiscal_category,
            'active', 0, true, true, 48
          FROM jsonb_array_elements(p_payload->'policies') AS elem
          JOIN policies p ON p.id = (elem->>'id')::uuid
        ON CONFLICT DO NOTHING;
    END IF;

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

-- Part 2: Admin form HTML — append a GDP Growth input to the politician
-- headline grid, right after Civil Freedoms.
UPDATE system_config
SET value = REPLACE(
    value,
    '                <div class="input-group"><label>Civil Freedoms (0&ndash;100)</label><input type="number" id="nn-politician_civil_freedoms" min="0" max="100" value="50"></div>
            </div>',
    '                <div class="input-group"><label>Civil Freedoms (0&ndash;100)</label><input type="number" id="nn-politician_civil_freedoms" min="0" max="100" value="50"></div>
                <div class="input-group"><label>GDP Growth (0&ndash;100)</label><input type="number" id="nn-politician_gdp_growth" min="0" max="100" value="50"></div>
            </div>'
),
    updated_at = now()
WHERE key = 'admin_panel_html'
  AND value LIKE '%id="nn-politician_civil_freedoms"%'
  AND value NOT LIKE '%id="nn-politician_gdp_growth"%';

COMMIT;
