-- ════════════════════════════════════════════════════════════════════
-- 20270711 — Sierramar: Miramar del Sur, Clara del Vega, Alta Sierra
--
-- Three more cities for Sierramar per user spec. Three real schema
-- changes needed before the seed can land:
--
-- 1. cities.city_type CHECK widens to allow 'major_city_3'. The
--    original 20270660 schema capped each nation at three cities
--    (capital + major_city_1 + major_city_2); Sierramar now has
--    four. UNIQUE (nation_id, city_type) still applies — each city
--    has a distinct type.
--
-- 2. cities.mayor_archetype CHECK DROPPED. The 20270660 schema
--    hard-coded a 10-archetype list, which has been over-restrictive
--    twice now: admin-set party archetypes can drift from the canonical
--    spelling, and flavor archetypes for non-canonical mayors
--    ("Grassroots Left / MAB Alternative", here) can't fit at all.
--    Dropping the CHECK without replacement; mayor_archetype is now
--    freeform text. The display surfaces don't read it for band
--    mapping (city stats use their own columns); the Geography card
--    just prints whatever's there as fallback flavor.
--
-- 3. cities.population_pct NUMERIC column added. Until now the
--    Geography card hardcoded 11% of nation.population for every
--    city — appropriate for a capital, wrong for smaller secondary
--    cities. Per-city percentage lets each one carry its own share
--    without leaking nation population into the cities table. UI
--    falls back to 11% when NULL so legacy rows render unchanged.
--
-- Seed values per user spec, 1..10 user-facing scale translated to
-- the canonical 0..100 storage scale (user_value × 10):
--
--   Miramar del Sur  (major_city_1, 4% of nation pop, $9M budget)
--   ─────────────────────────────────────────────────────────────
--   Mayor: Elena Cruz-Velasco (ACD)
--   Infrastructure 30 · Pollution 10 · Crime 30 · Appeal 70 ·
--   Growth 30 · Jobs 50 · Services 50 · Affordability 30
--
--   Clara del Vega   (major_city_2, 2.5% of nation pop, $2M budget)
--   ──────────────────────────────────────────────────────────────
--   Mayor: Hector "El Toro" Sabater (ACD)
--   Infrastructure 50 · Pollution 50 · Crime 10 · Appeal 30 ·
--   Growth 50 · Jobs 70 · Services 30 · Affordability 70
--
--   Alta Sierra      (major_city_3, 1.2% of nation pop, $1M budget)
--   ──────────────────────────────────────────────────────────────
--   Mayor: Mateo "Teo" Barea — "Grassroots Left / MAB Alternative"
--   (NOT linked to an actual party faction — mayor_party_id stays
--   NULL because the user-spec'd archetype label isn't an existing
--   Sierramar party. UI falls back to displaying the mayor_archetype
--   text in that case, per the 20270708 design.)
--   Infrastructure 10 · Pollution 10 · Crime 50 · Appeal 50 ·
--   Growth 10 · Jobs 10 · Services 10 · Affordability 50
--
-- ACD's faction_id is looked up via faction_name 'Alianza Cívica y
-- Democrática' in the Sierramar nation; raises a NOTICE if missing
-- (won't fail the migration — leaves mayor_party_id NULL, falls back
-- to mayor_archetype display). Puerto Rey's population_pct is also
-- set to 11 here so the per-city column has a value across all four
-- Sierramar cities, not just the new ones.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Widen city_type CHECK ──────────────────────────────────────
ALTER TABLE public.cities
    DROP CONSTRAINT IF EXISTS cities_city_type_check;
ALTER TABLE public.cities
    ADD CONSTRAINT cities_city_type_check
    CHECK (city_type IN ('capital', 'major_city_1', 'major_city_2', 'major_city_3'));

-- ── 1a. Drop mayor_archetype CHECK ────────────────────────────────
-- The 20270660 schema hard-coded the 10-archetype list, which has
-- been over-restrictive twice now: (a) admin-set party archetypes
-- may not match the casing/spelling exactly (see 20270710's fuzzy
-- backfill workaround), and (b) flavor archetypes for non-canonical
-- mayors ("Grassroots Left / MAB Alternative") can't fit at all.
-- mayor_archetype becomes freeform text; the band-display surface
-- doesn't read it, the Geography card just prints whatever's there
-- as a fallback when mayor_party_id is NULL.
ALTER TABLE public.cities
    DROP CONSTRAINT IF EXISTS cities_mayor_archetype_check;

-- ── 2. Add population_pct column ──────────────────────────────────
ALTER TABLE public.cities
    ADD COLUMN IF NOT EXISTS population_pct numeric
        CHECK (population_pct IS NULL OR (population_pct >= 0 AND population_pct <= 100));

COMMENT ON COLUMN public.cities.population_pct IS
    'Per-city population as a percentage of the nation population (20270711). NULL falls back to the 11% blanket the Geography card used through 20270710. Computed at display time (population_pct × nations.population / 100).';

-- ── 3. Backfill Puerto Rey ────────────────────────────────────────
UPDATE public.cities
   SET population_pct = 11
 WHERE city_type = 'capital'
   AND city_name  = 'Puerto Rey'
   AND population_pct IS NULL;


-- ── 4. Seed the three new Sierramar cities ────────────────────────
DO $$
DECLARE
    v_nation_id uuid;
    v_acd_id    uuid;
BEGIN
    SELECT id INTO v_nation_id
      FROM public.nations
     WHERE name = 'Sierramar'
     LIMIT 1;

    IF v_nation_id IS NULL THEN
        RAISE NOTICE 'Sierramar nation not found; three-city seed skipped.';
        RETURN;
    END IF;

    -- ACD party id (best-effort: skip linking if the party doesn't
    -- exist, mayor will display as archetype-only).
    SELECT id INTO v_acd_id
      FROM public.factions
     WHERE nation_id    = v_nation_id
       AND faction_type = 'movement_party'
       AND abandoned_at IS NULL
       AND faction_name = 'Alianza Cívica y Democrática'
     LIMIT 1;
    IF v_acd_id IS NULL THEN
        RAISE NOTICE 'ACD (Alianza Cívica y Democrática) not found in Sierramar; Miramar/Clara will fall back to archetype display.';
    END IF;

    -- Miramar del Sur — major_city_1
    INSERT INTO public.cities (
        nation_id, city_type, city_name, description,
        mayor_first_name, mayor_last_name, mayor_age, mayor_archetype, mayor_party_id,
        budget, population_pct,
        infrastructure, pollution, crime, appeal,
        growth, jobs, services, affordability
    ) VALUES (
        v_nation_id, 'major_city_1', 'Miramar del Sur',
        'Settled deep in the flat, sun-baked agricultural heartland, this dense inland hub is the crucial sorting grounds for the nation''s domestic food supply. Surrounded by vast tobacco fields and state farms, its massive railway junctions and open-air markets are constantly humming with rural labor and political rallies.',
        'Elena', 'Cruz-Velasco', 35 + floor(random() * 31)::int, 'Social Democratic', v_acd_id,
        9000000, 4,
        30, 10, 30, 70,
        30, 50, 50, 30
    ) ON CONFLICT (nation_id, city_type) DO NOTHING;

    -- Clara del Vega — major_city_2
    INSERT INTO public.cities (
        nation_id, city_type, city_name, description,
        mayor_first_name, mayor_last_name, mayor_age, mayor_archetype, mayor_party_id,
        budget, population_pct,
        infrastructure, pollution, crime, appeal,
        growth, jobs, services, affordability
    ) VALUES (
        v_nation_id, 'major_city_2', 'Clara del Vega',
        'Sierramar''s premier southern coastal destination, where decaying mid-century luxury hotels line a sweeping turquoise bay. Once a playground for foreign socialites, it now relies on heavily state-rationed international tourism, leaving its vibrant local music scene and residential quarters to weather the salt air with little support.',
        'Hector "El Toro"', 'Sabater', 35 + floor(random() * 31)::int, 'Social Democratic', v_acd_id,
        2000000, 2.5,
        50, 50, 10, 30,
        50, 70, 30, 70
    ) ON CONFLICT (nation_id, city_type) DO NOTHING;

    -- Alta Sierra — major_city_3
    -- mayor_party_id intentionally NULL — "Grassroots Left / MAB
    -- Alternative" isn't an existing party faction. The Geography
    -- card's display falls through to mayor_archetype text.
    INSERT INTO public.cities (
        nation_id, city_type, city_name, description,
        mayor_first_name, mayor_last_name, mayor_age, mayor_archetype, mayor_party_id,
        budget, population_pct,
        infrastructure, pollution, crime, appeal,
        growth, jobs, services, affordability
    ) VALUES (
        v_nation_id, 'major_city_3', 'Alta Sierra',
        'A misty, isolated mountain outpost clinging to the rugged slopes of the central peaks. Born as a mining camp and a historic guerrilla sanctuary, it remains fiercely independent, battling harsh terrain, an unreliable power grid, and a proud, tight-knit population that distrusts the capital.',
        'Mateo "Teo"', 'Barea', 35 + floor(random() * 31)::int, 'Grassroots Left / MAB Alternative', NULL,
        1000000, 1.2,
        10, 10, 50, 50,
        10, 10, 10, 50
    ) ON CONFLICT (nation_id, city_type) DO NOTHING;
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
