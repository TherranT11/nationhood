-- ════════════════════════════════════════════════════════════════════
-- 20270707 — Cities V1.1: extra stats + Sierramar capital seed
--
-- Two parts:
--
-- 1. Schema additions. The 20270660 Cities V1 schema carries five
--    stats (infrastructure, appeal, growth, crime, approval). Per
--    user spec we need four more so the nation-page Geography card
--    can show the full picture:
--      • pollution    — environmental load (lower is better)
--      • jobs         — labour-market availability
--      • services     — public-service delivery
--      • affordability — cost-of-living balance
--    All four follow the existing 0..100 NUMERIC convention so the
--    CHECK constraint family stays homogeneous. The UI maps stored
--    value → 5-band label (Failing / Strained / Adequate / Modern /
--    Advanced and analogous for the others) via js/game/city-labels.js.
--    User-facing scale is 1..10; stored values are user-value × 10.
--
-- 2. Sierramar capital seed. 20270660's city seed predates Sierramar
--    joining the politician system (20270695), so Sierramar has no
--    cities row today. INSERT Puerto Rey as the capital with the
--    user-spec'd 8 stat values:
--
--       Stat            User (1..10)  Stored  Band label
--       ------          ------------  ------  --------------------
--       Infrastructure  3             30      Strained
--       Pollution       5             50      Moderate
--       Crime           4             40      Smuggling Dominant
--       Appeal          2             20      Bleak Eyesore
--       Growth          3             30      Stagnant
--       Jobs            4             40      Limited Availability
--       Services        2             20      Long Queues
--       Affordability   6             60      Cost of Living Balance
--
--    Budget = $6M (the existing budget column is bigint dollars).
--    Mayor name picks from Sierramar's name pools (Crucera Spanish,
--    via pick_random_pool_name); age random 35..65; archetype rolled
--    uniformly from the existing 10-archetype list — same pattern as
--    20270660's seed block.
--
-- Idempotent: ON CONFLICT (nation_id, city_type) DO NOTHING means
-- the seed is a no-op once Puerto Rey exists. Re-running just
-- ensures the schema is in place.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Schema additions ───────────────────────────────────────────
ALTER TABLE public.cities
    ADD COLUMN IF NOT EXISTS pollution     int NOT NULL DEFAULT 50 CHECK (pollution     BETWEEN 0 AND 100),
    ADD COLUMN IF NOT EXISTS jobs          int NOT NULL DEFAULT 50 CHECK (jobs          BETWEEN 0 AND 100),
    ADD COLUMN IF NOT EXISTS services      int NOT NULL DEFAULT 50 CHECK (services      BETWEEN 0 AND 100),
    ADD COLUMN IF NOT EXISTS affordability int NOT NULL DEFAULT 50 CHECK (affordability BETWEEN 0 AND 100);

COMMENT ON COLUMN public.cities.pollution     IS '20270707 Cities V1.1. 0..100. UI maps 5-band label (Pristine / Minor / Moderate / Severe / Hazardous).';
COMMENT ON COLUMN public.cities.jobs          IS '20270707 Cities V1.1. 0..100. UI maps 5-band label (Critical Deficit / Limited / Modest / Robust / Surging).';
COMMENT ON COLUMN public.cities.services      IS '20270707 Cities V1.1. 0..100. UI maps 5-band label (Non-Existent / Long Queues / Functional / Efficient / Comprehensive).';
COMMENT ON COLUMN public.cities.affordability IS '20270707 Cities V1.1. 0..100. UI maps 5-band label (Extreme Hardship / Pricing Out / Balance / Accessible / Dirt Cheap).';


-- ── 2. Seed Sierramar's capital ───────────────────────────────────
DO $$
DECLARE
    v_archetypes constant text[] := ARRAY[
        'Reform', 'Social Democratic', 'Traditional Conservative',
        'Liberal', 'Libertarian', 'Communist / Leftist',
        'Green', 'Nationalist', 'Populist', 'Centrist'
    ];
    v_nation_id  uuid;
    v_first_pool text[];
    v_last_pool  text[];
    v_first      text;
    v_last       text;
    v_age        int;
    v_archetype  text;
BEGIN
    SELECT id, first_name_pool, last_name_pool
      INTO v_nation_id, v_first_pool, v_last_pool
      FROM public.nations
     WHERE name = 'Sierramar'
     LIMIT 1;

    IF v_nation_id IS NULL THEN
        RAISE NOTICE 'Sierramar nation not found; capital seed skipped.';
        RETURN;
    END IF;

    -- Idempotency: skip if Puerto Rey already exists. The seed
    -- otherwise picks random mayor identity, which would change on
    -- every re-run if we kept doing INSERT … DO NOTHING.
    IF EXISTS (SELECT 1 FROM public.cities
                WHERE nation_id = v_nation_id AND city_type = 'capital') THEN
        RAISE NOTICE 'Sierramar capital already seeded; skipping.';
        RETURN;
    END IF;

    v_first     := COALESCE(public.pick_random_pool_name(v_first_pool), 'Carlos');
    v_last      := COALESCE(public.pick_random_pool_name(v_last_pool),  'Velasco');
    v_age       := 35 + floor(random() * 31)::int;  -- 35..65
    v_archetype := v_archetypes[1 + floor(random() * array_length(v_archetypes, 1))::int];

    INSERT INTO public.cities (
        nation_id, city_type, city_name, description,
        mayor_first_name, mayor_last_name, mayor_age, mayor_archetype,
        budget,
        infrastructure, pollution, crime, appeal,
        growth, jobs, services, affordability
    ) VALUES (
        v_nation_id, 'capital', 'Puerto Rey',
        'Sierramar''s port capital, wrapped around a deepwater harbour at the heart of one of the busiest transit lanes in the region. Coffee from the Sierra del Mar highlands and refined sugar from the lowland flats both pass through its quays.',
        v_first, v_last, v_age, v_archetype,
        6000000,
        30, 50, 40, 20,
        30, 40, 20, 60
    );
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
