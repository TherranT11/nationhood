-- ════════════════════════════════════════════════════════════════════
-- 20270660 — Cities V1: schema, seed, view RPCs
--
-- Foundation for the City Council subsystem. Each nation has up to
-- three cities (Capital, Major City 1, Major City 2). Each city has
-- a description, an NPC Mayor with an archetype (drawn from the same
-- archetype list parties use), and six stats:
--
--   Budget         (dollars in the city treasury)
--   Infrastructure (0–100)
--   Appeal         (0–100)
--   Growth         (0–100)
--   Crime          (0–100, lower = better)
--   Approval       (0–100, "of the city government overall")
--
-- The Mayor archetype is the lever for the upcoming ordinance
-- mechanic — every proposal will list support_archetypes /
-- oppose_archetypes, and the Mayor's archetype determines their
-- Endorse / Ignore / Resist reaction (V2).
--
-- ── V1 scope ────────────────────────────────────────────────────────
--   • cities table + seed for the three foundable nations
--     (Melizea / Avelia / Montequilla per 20270657).
--   • get_city_view(p_city_id) — returns one city's full payload.
--   • list_cities_for_nation(p_nation_id) — picker source.
--   • [View City] role-card action on CC Member (politician-home.html)
--     — opens a modal showing the stats + Mayor + placeholder sections
--     for Current Ordinances and City Council Votes (V2 surfaces).
--
-- ── Out of scope (V2) ──────────────────────────────────────────────
--   • city_ordinances + city_council_votes tables.
--   • Propose / vote / resolve flow.
--   • Mayor reaction roll.
--   • Per-tick city stat drift / decay.
--   • Cities for nations outside the foundable allowlist (added when
--     the playable footprint expands).
--
-- ── Notes on data choices ──────────────────────────────────────────
--   • City names hardcoded per nation in the seed block — they're
--     identity, not procedurally generated. Avelia's capital is Oros
--     per user direction; the others fit each nation's analog
--     (Colombia / Italy / Argentina).
--   • Mayor names use pick_random_pool_name (20270415) from the
--     nation's first/last pools. No collision check against party
--     officers — mayors are a small set, unlikely to clash. If they
--     do, the same pattern as 20270659 (pick_unique_pool_name_pair)
--     can be extended later.
--   • Stat defaults seeded with light variance per city tier
--     (capital tends a little higher on Infrastructure/Appeal/Budget,
--     a little higher on Crime; the Major Cities run leaner). All
--     within reasonable starting ranges so V2 ordinances have room
--     to move them in both directions.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. cities table ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cities (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nation_id          uuid NOT NULL REFERENCES public.nations(id) ON DELETE CASCADE,
    city_type          text NOT NULL CHECK (city_type IN ('capital', 'major_city_1', 'major_city_2')),
    city_name          text NOT NULL,
    description        text,
    mayor_first_name   text,
    mayor_last_name    text,
    mayor_age          int,
    mayor_archetype    text CHECK (
        mayor_archetype IS NULL OR mayor_archetype IN (
            'Reform', 'Social Democratic', 'Traditional Conservative',
            'Liberal', 'Libertarian', 'Communist / Leftist',
            'Green', 'Nationalist', 'Populist', 'Centrist'
        )
    ),
    budget             bigint NOT NULL DEFAULT 1000000,
    infrastructure     int    NOT NULL DEFAULT 50 CHECK (infrastructure BETWEEN 0 AND 100),
    appeal             int    NOT NULL DEFAULT 50 CHECK (appeal         BETWEEN 0 AND 100),
    growth             int    NOT NULL DEFAULT 50 CHECK (growth         BETWEEN 0 AND 100),
    crime              int    NOT NULL DEFAULT 25 CHECK (crime          BETWEEN 0 AND 100),
    approval           int    NOT NULL DEFAULT 50 CHECK (approval       BETWEEN 0 AND 100),
    created_at         timestamptz NOT NULL DEFAULT now(),
    UNIQUE (nation_id, city_type)
);

CREATE INDEX IF NOT EXISTS idx_cities_nation ON public.cities(nation_id);

COMMENT ON TABLE public.cities IS
    'Cities V1 (20270660). Each nation has up to three: capital, major_city_1, major_city_2. Drives the CC Member / CC President subsystem — players view via [View City], propose ordinances against (V2), votes resolve against the Council composition (V2), Mayor reacts per archetype (V2).';

-- Authenticated clients read directly for the picker; writes go
-- through SECURITY DEFINER RPCs (admin tooling + V2 propose/vote).
REVOKE INSERT, UPDATE, DELETE ON public.cities FROM PUBLIC, anon, authenticated;
GRANT  SELECT                  ON public.cities TO authenticated;

-- ── 2. Seed: per-nation city tuples ───────────────────────────────
-- Hardcoded city names (identity, not procedural). Mayor names use
-- pick_random_pool_name on each nation's pools; archetype is rolled
-- uniformly from the 10-archetype list. Stat defaults vary slightly
-- by city tier (capital higher on Budget/Infra/Appeal/Crime; major
-- cities run leaner). ON CONFLICT (nation_id, city_type) DO NOTHING
-- keeps the migration idempotent on re-runs.
DO $$
DECLARE
    v_archetypes constant text[] := ARRAY[
        'Reform', 'Social Democratic', 'Traditional Conservative',
        'Liberal', 'Libertarian', 'Communist / Leftist',
        'Green', 'Nationalist', 'Populist', 'Centrist'
    ];
    v_city_names constant jsonb := jsonb_build_object(
        'Melizea',     jsonb_build_array('Tepequa',    'Carlita',  'Sangréz'),
        'Avelia',      jsonb_build_array('Oros',       'Verana',   'Castelmare'),
        'Montequilla', jsonb_build_array('Vallarriba', 'Andesa',   'Plata Verde')
    );
    v_city_descs constant jsonb := jsonb_build_object(
        'Melizea',     jsonb_build_array(
            'Capital of Melizea — coastal, congested, the country''s political heart.',
            'A river-port city built on coffee money and old families.',
            'The southern industrial belt — refineries, port traffic, restless labor.'
        ),
        'Avelia',      jsonb_build_array(
            'The seat of Avelian power and its oldest continuous government.',
            'Inland and prosperous, known for its banks and its bell-towers.',
            'A Mediterranean port city — tourism, shipping, and the country''s second-largest stock exchange.'
        ),
        'Montequilla', jsonb_build_array(
            'Capital of Montequilla — broad avenues, federal ministries, the river view.',
            'A grain-belt city whose council habitually outvotes the central government.',
            'A high-altitude mining town turned tech-services hub.'
        )
    );
    v_city_types constant text[] := ARRAY['capital', 'major_city_1', 'major_city_2'];
    v_nation        RECORD;
    v_first_pool    text[];
    v_last_pool     text[];
    v_names         jsonb;
    v_descs         jsonb;
    v_idx           int;
    v_budget        bigint;
    v_infra         int;
    v_appeal        int;
    v_growth        int;
    v_crime         int;
    v_approval      int;
    v_seeded        int := 0;
BEGIN
    FOR v_nation IN
        SELECT id, name, first_name_pool, last_name_pool
          FROM public.nations
         WHERE foundable_for_corp = TRUE
    LOOP
        v_names := v_city_names->v_nation.name;
        v_descs := v_city_descs->v_nation.name;
        IF v_names IS NULL OR jsonb_array_length(v_names) < 3 THEN
            CONTINUE;
        END IF;
        v_first_pool := v_nation.first_name_pool;
        v_last_pool  := v_nation.last_name_pool;

        FOR v_idx IN 1..3 LOOP
            -- Capital tier (idx=1) runs richer; major cities lean.
            IF v_idx = 1 THEN
                v_budget   := 2500000;
                v_infra    := 60 + floor(random() * 11)::int;   -- 60-70
                v_appeal   := 55 + floor(random() * 16)::int;   -- 55-70
                v_growth   := 45 + floor(random() * 16)::int;   -- 45-60
                v_crime    := 25 + floor(random() * 16)::int;   -- 25-40
                v_approval := 45 + floor(random() * 16)::int;   -- 45-60
            ELSE
                v_budget   := 800000 + (floor(random() * 4)::int * 100000);  -- 0.8-1.1M
                v_infra    := 40 + floor(random() * 16)::int;   -- 40-55
                v_appeal   := 40 + floor(random() * 21)::int;   -- 40-60
                v_growth   := 45 + floor(random() * 21)::int;   -- 45-65
                v_crime    := 20 + floor(random() * 21)::int;   -- 20-40
                v_approval := 40 + floor(random() * 21)::int;   -- 40-60
            END IF;

            INSERT INTO public.cities (
                nation_id, city_type, city_name, description,
                mayor_first_name, mayor_last_name, mayor_age, mayor_archetype,
                budget, infrastructure, appeal, growth, crime, approval
            ) VALUES (
                v_nation.id,
                v_city_types[v_idx],
                v_names->>(v_idx - 1),
                v_descs->>(v_idx - 1),
                COALESCE(pick_random_pool_name(v_first_pool), 'Mayor'),
                COALESCE(pick_random_pool_name(v_last_pool),  'Smith'),
                40 + floor(random() * 26)::int,
                v_archetypes[1 + floor(random() * array_length(v_archetypes, 1))::int],
                v_budget, v_infra, v_appeal, v_growth, v_crime, v_approval
            )
            ON CONFLICT (nation_id, city_type) DO NOTHING;

            v_seeded := v_seeded + 1;
        END LOOP;
    END LOOP;
    RAISE NOTICE '20270660 seed: inserted up to % city rows (ON CONFLICT skips existing)', v_seeded;
END $$;

-- ── 3. RPC: get_city_view(p_city_id) ──────────────────────────────
-- Returns the city payload + placeholder ordinance / vote sections
-- so the modal can render its sections without a second round-trip
-- (V2 will fill these in with real data).
CREATE OR REPLACE FUNCTION public.get_city_view(p_city_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_city public.cities%ROWTYPE;
    v_nation_name text;
BEGIN
    IF p_city_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_city FROM public.cities WHERE id = p_city_id;
    IF v_city.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'city_not_found');
    END IF;

    SELECT name INTO v_nation_name FROM public.nations WHERE id = v_city.nation_id;

    RETURN jsonb_build_object(
        'success', true,
        'city', jsonb_build_object(
            'id',              v_city.id,
            'nation_id',       v_city.nation_id,
            'nation_name',     v_nation_name,
            'city_type',       v_city.city_type,
            'city_name',       v_city.city_name,
            'description',     v_city.description,
            'mayor_first_name', v_city.mayor_first_name,
            'mayor_last_name',  v_city.mayor_last_name,
            'mayor_age',        v_city.mayor_age,
            'mayor_archetype',  v_city.mayor_archetype,
            'budget',          v_city.budget,
            'infrastructure',  v_city.infrastructure,
            'appeal',          v_city.appeal,
            'growth',          v_city.growth,
            'crime',           v_city.crime,
            'approval',        v_city.approval
        ),
        'ordinances',      '[]'::jsonb,   -- V2 placeholder
        'council_votes',   '[]'::jsonb    -- V2 placeholder
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_city_view(uuid) TO authenticated;

COMMENT ON FUNCTION public.get_city_view(uuid) IS
    'Returns a single city''s payload — stats + Mayor + nation name + empty ordinance/vote lists (V2 placeholders). Used by the [View City] modal in politician-home.html.';

-- ── 4. RPC: list_cities_for_nation(p_nation_id) ───────────────────
-- Slim picker source for the modal's city tab strip. Ordered Capital
-- → Major City 1 → Major City 2 so the tabs render in a consistent
-- left-to-right reading order.
CREATE OR REPLACE FUNCTION public.list_cities_for_nation(p_nation_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_cities jsonb;
BEGIN
    IF p_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id',        id,
            'city_name', city_name,
            'city_type', city_type
        )
        ORDER BY CASE city_type
            WHEN 'capital'      THEN 1
            WHEN 'major_city_1' THEN 2
            WHEN 'major_city_2' THEN 3
            ELSE                     4
        END
    ), '[]'::jsonb)
      INTO v_cities
      FROM public.cities
     WHERE nation_id = p_nation_id;

    RETURN jsonb_build_object(
        'success', true,
        'cities',  v_cities
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_cities_for_nation(uuid) TO authenticated;

COMMENT ON FUNCTION public.list_cities_for_nation(uuid) IS
    'Lists a nation''s cities (id / name / type) for the [View City] modal''s tab strip. Capital ordered first.';

NOTIFY pgrst, 'reload schema';

COMMIT;
