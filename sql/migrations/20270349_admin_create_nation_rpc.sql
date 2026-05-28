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

    -- ── 2. Stat overrides ──────────────────────────────────────────────────────
    -- Writes the canonical NATION_STAT_COLUMNS surface from js/game/stats.js
    -- (minus gdp/debt, which are dollar values set in the INSERT above).
    -- Every column is numeric NOT NULL DEFAULT 50, so any stat the payload
    -- omits keeps its DB default rather than being clobbered to NULL.
    UPDATE nations SET
        gdp_growth         = COALESCE(NULLIF(v_stats->>'gdp_growth',         '')::numeric, gdp_growth),
        immigration        = COALESCE(NULLIF(v_stats->>'immigration',        '')::numeric, immigration),
        standard_of_living = COALESCE(NULLIF(v_stats->>'standard_of_living', '')::numeric, standard_of_living),
        cost_of_living     = COALESCE(NULLIF(v_stats->>'cost_of_living',     '')::numeric, cost_of_living),
        budget             = COALESCE(NULLIF(v_stats->>'budget',             '')::numeric, budget),
        state_apparatus    = COALESCE(NULLIF(v_stats->>'state_apparatus',    '')::numeric, state_apparatus),
        unrest             = COALESCE(NULLIF(v_stats->>'unrest',             '')::numeric, unrest),
        public_approval    = COALESCE(NULLIF(v_stats->>'public_approval',    '')::numeric, public_approval),
        crown_authority    = COALESCE(NULLIF(v_stats->>'crown_authority',    '')::numeric, crown_authority),
        energy             = COALESCE(NULLIF(v_stats->>'energy',             '')::numeric, energy),
        health             = COALESCE(NULLIF(v_stats->>'health',             '')::numeric, health),
        education          = COALESCE(NULLIF(v_stats->>'education',          '')::numeric, education),
        global_image       = COALESCE(NULLIF(v_stats->>'global_image',       '')::numeric, global_image),
        infrastructure     = COALESCE(NULLIF(v_stats->>'infrastructure',     '')::numeric, infrastructure),
        industry           = COALESCE(NULLIF(v_stats->>'industry',           '')::numeric, industry),
        farmland           = COALESCE(NULLIF(v_stats->>'farmland',           '')::numeric, farmland),
        service_sector     = COALESCE(NULLIF(v_stats->>'service_sector',     '')::numeric, service_sector),
        unskilled_workers  = COALESCE(NULLIF(v_stats->>'unskilled_workers',  '')::numeric, unskilled_workers),
        skilled_workers    = COALESCE(NULLIF(v_stats->>'skilled_workers',    '')::numeric, skilled_workers),
        wages              = COALESCE(NULLIF(v_stats->>'wages',              '')::numeric, wages),
        income_tax         = COALESCE(NULLIF(v_stats->>'income_tax',         '')::numeric, income_tax),
        corporate_tax      = COALESCE(NULLIF(v_stats->>'corporate_tax',      '')::numeric, corporate_tax),
        crime              = COALESCE(NULLIF(v_stats->>'crime',              '')::numeric, crime),
        corruption         = COALESCE(NULLIF(v_stats->>'corruption',         '')::numeric, corruption),
        inequality         = COALESCE(NULLIF(v_stats->>'inequality',         '')::numeric, inequality),
        minerals           = COALESCE(NULLIF(v_stats->>'minerals',           '')::numeric, minerals)
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
