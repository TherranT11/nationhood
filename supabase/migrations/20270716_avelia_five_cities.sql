-- ════════════════════════════════════════════════════════════════════
-- 20270716 — Avelia: full five-city build-out per user spec
--
-- The 20270660 seed gave Avelia three placeholder cities (Oros /
-- Verana / Castelmare) with random NPC mayors and middle-of-the-road
-- stats. User now spec'd FIVE — capital plus four majors. That
-- exceeds the 20270711 cap of major_city_3, so this migration
-- widens the city_type CHECK once more to admit major_city_4.
-- UNIQUE (nation_id, city_type) still enforces "one row per slot".
--
-- Cities + bands (user-facing 1..10 stored at user × 10):
--
--   Oros            (capital,      11% pop, $9M budget)
--   ────────────────────────────────────────────────────
--   Mayor: Lorenzo Vacchiano · PDS
--   Infrastructure 70 · Pollution 50 · Crime 30 · Appeal 70
--   Growth 50 · Jobs 50 · Services 70 · Affordability 30
--
--   Albano          (major_city_1,  6% pop, $6M budget)
--   ────────────────────────────────────────────────────
--   Mayor: Giulia Sandoval · AP
--   Infrastructure 50 · Pollution 70 · Crime 50 · Appeal 30
--   Growth 30 · Jobs 50 · Services 50 · Affordability 50
--
--   Cavallano       (major_city_2,  3% pop, $5M budget)
--   ────────────────────────────────────────────────────
--   Mayor: Marco Volpi-Pellegrini · MS
--   Infrastructure 50 · Pollution 10 · Crime 10 · Appeal 70
--   Growth 50 · Jobs 30 · Services 50 · Affordability 30
--
--   Monteforte      (major_city_3,  1.5% pop, $2M budget)
--   ────────────────────────────────────────────────────
--   Mayor: Elena Ricci · VA
--   Infrastructure 30 · Pollution 10 · Crime 10 · Appeal 90
--   Growth 30 · Jobs 30 · Services 50 · Affordability 30
--
--   Marina Ricca    (major_city_4,  0.8% pop, $1M budget)
--   ────────────────────────────────────────────────────
--   Mayor: Father Thomas Moretti · "PDS Independent"
--   mayor_party_id stays NULL — user spec'd "PDS Independent" as the
--   affiliation label, which doesn't match a clean party FK. Setting
--   the party would make the Geography card show PDS's archetype
--   instead of "Independent". NULL keeps the user's label intact via
--   the mayor_archetype text fallback (20270708 display priority).
--   Infrastructure 10 · Pollution 10 · Crime 30 · Appeal 50
--   Growth 10 · Jobs 10 · Services 30 · Affordability 70
--
-- Party lookups: PDS / AP / MS / VA are admin-created on the running
-- DB (same pattern as Sierramar's ACD/MAB and Melizea's MCN/PPR/UD).
-- Lookups are name-matched; misses log a NOTICE and the row falls
-- back to mayor_archetype display per the 20270708 priority.
--
-- UPSERT (INSERT … ON CONFLICT (nation_id, city_type) DO UPDATE) on
-- every row so the migration lands the right state whether the
-- 20270660 placeholder row exists or not. Pattern lesson from the
-- 20270715 audit — pure UPDATEs would silently no-op if the seed
-- didn't run for some reason.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Widen city_type CHECK to allow major_city_4 ────────────────
ALTER TABLE public.cities
    DROP CONSTRAINT IF EXISTS cities_city_type_check;
ALTER TABLE public.cities
    ADD CONSTRAINT cities_city_type_check
    CHECK (city_type IN ('capital', 'major_city_1', 'major_city_2', 'major_city_3', 'major_city_4'));


-- ── 2. Seed the five Avelia cities ────────────────────────────────
DO $$
DECLARE
    v_nation_id uuid;
    v_pds_id    uuid;
    v_ap_id     uuid;
    v_ms_id     uuid;
    v_va_id     uuid;
BEGIN
    SELECT id INTO v_nation_id
      FROM public.nations
     WHERE name = 'Avelia'
     LIMIT 1;

    IF v_nation_id IS NULL THEN
        RAISE NOTICE 'Avelia nation not found; five-city build-out skipped.';
        RETURN;
    END IF;

    -- Party lookups. Best-effort: skip linking on miss, fall back to
    -- mayor_archetype display.
    SELECT id INTO v_pds_id
      FROM public.factions
     WHERE nation_id    = v_nation_id
       AND faction_type = 'movement_party'
       AND abandoned_at IS NULL
       AND faction_name = 'Patto Democratico-Solvarino'
     LIMIT 1;
    IF v_pds_id IS NULL THEN
        RAISE NOTICE 'PDS (Patto Democratico-Solvarino) not found in Avelia; Oros will fall back to archetype display.';
    END IF;

    SELECT id INTO v_ap_id
      FROM public.factions
     WHERE nation_id    = v_nation_id
       AND faction_type = 'movement_party'
       AND abandoned_at IS NULL
       AND faction_name = 'Alleanza Progressista'
     LIMIT 1;
    IF v_ap_id IS NULL THEN
        RAISE NOTICE 'AP (Alleanza Progressista) not found in Avelia; Albano will fall back to archetype display.';
    END IF;

    SELECT id INTO v_ms_id
      FROM public.factions
     WHERE nation_id    = v_nation_id
       AND faction_type = 'movement_party'
       AND abandoned_at IS NULL
       AND faction_name = 'Movimento Sovranista'
     LIMIT 1;
    IF v_ms_id IS NULL THEN
        RAISE NOTICE 'MS (Movimento Sovranista) not found in Avelia; Cavallano will fall back to archetype display.';
    END IF;

    SELECT id INTO v_va_id
      FROM public.factions
     WHERE nation_id    = v_nation_id
       AND faction_type = 'movement_party'
       AND abandoned_at IS NULL
       AND faction_name = 'Verdi Avelia'
     LIMIT 1;
    IF v_va_id IS NULL THEN
        RAISE NOTICE 'VA (Verdi Avelia) not found in Avelia; Monteforte will fall back to archetype display.';
    END IF;

    -- ── Oros (capital) ───────────────────────────────────────────
    INSERT INTO public.cities (
        nation_id, city_type, city_name, description,
        mayor_first_name, mayor_last_name, mayor_age, mayor_archetype, mayor_party_id,
        budget, population_pct,
        infrastructure, pollution, crime, appeal, growth, jobs, services, affordability
    ) VALUES (
        v_nation_id, 'capital', 'Oros',
        'The historic coastal capital of Avelia, built around a deep-water bay and a prominent northern river delta. It is the administrative and financial beating heart of the Republic, where grand old-world stone architecture meets bustling commercial ports. Its politics are dominated by the traditional establishment, though the growing urban middle class is beginning to push back.',
        'Lorenzo', 'Vacchiano', 35 + floor(random() * 31)::int, 'Centrist', v_pds_id,
        9000000, 11,
        70, 50, 30, 70, 50, 50, 70, 30
    ) ON CONFLICT (nation_id, city_type) DO UPDATE SET
        city_name        = EXCLUDED.city_name,
        description      = EXCLUDED.description,
        mayor_first_name = EXCLUDED.mayor_first_name,
        mayor_last_name  = EXCLUDED.mayor_last_name,
        mayor_age        = EXCLUDED.mayor_age,
        mayor_archetype  = EXCLUDED.mayor_archetype,
        mayor_party_id   = EXCLUDED.mayor_party_id,
        budget           = EXCLUDED.budget,
        population_pct   = EXCLUDED.population_pct,
        infrastructure   = EXCLUDED.infrastructure,
        pollution        = EXCLUDED.pollution,
        crime            = EXCLUDED.crime,
        appeal           = EXCLUDED.appeal,
        growth           = EXCLUDED.growth,
        jobs             = EXCLUDED.jobs,
        services         = EXCLUDED.services,
        affordability    = EXCLUDED.affordability;

    -- ── Albano (major_city_1) ────────────────────────────────────
    INSERT INTO public.cities (
        nation_id, city_type, city_name, description,
        mayor_first_name, mayor_last_name, mayor_age, mayor_archetype, mayor_party_id,
        budget, population_pct,
        infrastructure, pollution, crime, appeal, growth, jobs, services, affordability
    ) VALUES (
        v_nation_id, 'major_city_1', 'Albano',
        'A sprawling inland industrial hub situated along the northern rim of the country. Albano is a stronghold for Avelia''s manufacturing sector, dense with historic factories, automotive assembly plants, and tight-knit working-class neighborhoods. Decades of heavy industry have left their mark on the skyline and the local air quality.',
        'Giulia', 'Sandoval', 35 + floor(random() * 31)::int, 'Social Democratic', v_ap_id,
        6000000, 6,
        50, 70, 50, 30, 30, 50, 50, 50
    ) ON CONFLICT (nation_id, city_type) DO UPDATE SET
        city_name        = EXCLUDED.city_name,
        description      = EXCLUDED.description,
        mayor_first_name = EXCLUDED.mayor_first_name,
        mayor_last_name  = EXCLUDED.mayor_last_name,
        mayor_age        = EXCLUDED.mayor_age,
        mayor_archetype  = EXCLUDED.mayor_archetype,
        mayor_party_id   = EXCLUDED.mayor_party_id,
        budget           = EXCLUDED.budget,
        population_pct   = EXCLUDED.population_pct,
        infrastructure   = EXCLUDED.infrastructure,
        pollution        = EXCLUDED.pollution,
        crime            = EXCLUDED.crime,
        appeal           = EXCLUDED.appeal,
        growth           = EXCLUDED.growth,
        jobs             = EXCLUDED.jobs,
        services         = EXCLUDED.services,
        affordability    = EXCLUDED.affordability;

    -- ── Cavallano (major_city_2) ─────────────────────────────────
    INSERT INTO public.cities (
        nation_id, city_type, city_name, description,
        mayor_first_name, mayor_last_name, mayor_age, mayor_archetype, mayor_party_id,
        budget, population_pct,
        infrastructure, pollution, crime, appeal, growth, jobs, services, affordability
    ) VALUES (
        v_nation_id, 'major_city_2', 'Cavallano',
        'Located in the sun-drenched southern valleys, Cavallano is an affluent provincial hub that anchors Avelia''s agricultural elite and winemaking regions. It is a highly traditional, orderly city characterized by clean plazas and historic churches, though its local leaders are increasingly resentful of sending tax revenues northward to subsidize industrial zones.',
        'Marco', 'Volpi-Pellegrini', 35 + floor(random() * 31)::int, 'Nationalist', v_ms_id,
        5000000, 3,
        50, 10, 10, 70, 50, 30, 50, 30
    ) ON CONFLICT (nation_id, city_type) DO UPDATE SET
        city_name        = EXCLUDED.city_name,
        description      = EXCLUDED.description,
        mayor_first_name = EXCLUDED.mayor_first_name,
        mayor_last_name  = EXCLUDED.mayor_last_name,
        mayor_age        = EXCLUDED.mayor_age,
        mayor_archetype  = EXCLUDED.mayor_archetype,
        mayor_party_id   = EXCLUDED.mayor_party_id,
        budget           = EXCLUDED.budget,
        population_pct   = EXCLUDED.population_pct,
        infrastructure   = EXCLUDED.infrastructure,
        pollution        = EXCLUDED.pollution,
        crime            = EXCLUDED.crime,
        appeal           = EXCLUDED.appeal,
        growth           = EXCLUDED.growth,
        jobs             = EXCLUDED.jobs,
        services         = EXCLUDED.services,
        affordability    = EXCLUDED.affordability;

    -- ── Monteforte (major_city_3) ────────────────────────────────
    INSERT INTO public.cities (
        nation_id, city_type, city_name, description,
        mayor_first_name, mayor_last_name, mayor_age, mayor_archetype, mayor_party_id,
        budget, population_pct,
        infrastructure, pollution, crime, appeal, growth, jobs, services, affordability
    ) VALUES (
        v_nation_id, 'major_city_3', 'Monteforte',
        'A quiet, scenic southeastern town situated where the rolling hills meet the coastline. It serves as a retreat for artists, retirees, and eco-tourists, fiercely protective of its surrounding marine habitats and coastal wetlands. Development is heavily restricted here to preserve the natural landscape.',
        'Elena', 'Ricci', 35 + floor(random() * 31)::int, 'Green', v_va_id,
        2000000, 1.5,
        30, 10, 10, 90, 30, 30, 50, 30
    ) ON CONFLICT (nation_id, city_type) DO UPDATE SET
        city_name        = EXCLUDED.city_name,
        description      = EXCLUDED.description,
        mayor_first_name = EXCLUDED.mayor_first_name,
        mayor_last_name  = EXCLUDED.mayor_last_name,
        mayor_age        = EXCLUDED.mayor_age,
        mayor_archetype  = EXCLUDED.mayor_archetype,
        mayor_party_id   = EXCLUDED.mayor_party_id,
        budget           = EXCLUDED.budget,
        population_pct   = EXCLUDED.population_pct,
        infrastructure   = EXCLUDED.infrastructure,
        pollution        = EXCLUDED.pollution,
        crime            = EXCLUDED.crime,
        appeal           = EXCLUDED.appeal,
        growth           = EXCLUDED.growth,
        jobs             = EXCLUDED.jobs,
        services         = EXCLUDED.services,
        affordability    = EXCLUDED.affordability;

    -- ── Marina Ricca (major_city_4) — PDS Independent ────────────
    -- mayor_party_id intentionally NULL — the user wrote the label
    -- "PDS Independent", which doesn't match a clean party FK. The
    -- Geography card prefers party.archetype when the FK is set, so
    -- linking to PDS would replace "Independent" with PDS's
    -- archetype on screen. NULL preserves the label via the mayor
    -- _archetype text fallback (20270708 priority order).
    INSERT INTO public.cities (
        nation_id, city_type, city_name, description,
        mayor_first_name, mayor_last_name, mayor_age, mayor_archetype, mayor_party_id,
        budget, population_pct,
        infrastructure, pollution, crime, appeal, growth, jobs, services, affordability
    ) VALUES (
        v_nation_id, 'major_city_4', 'Marina Ricca',
        'An isolated island outpost sitting off the northeastern coast of the mainland. While it boasts a historic naval harbor and an independent seafaring identity, its geographical separation has left it neglected by capital funding, resulting in a fragile economy heavily reliant on maritime trade and small-scale fishing.',
        'Father Thomas', 'Moretti', 35 + floor(random() * 31)::int, 'PDS Independent', NULL,
        1000000, 0.8,
        10, 10, 30, 50, 10, 10, 30, 70
    ) ON CONFLICT (nation_id, city_type) DO UPDATE SET
        city_name        = EXCLUDED.city_name,
        description      = EXCLUDED.description,
        mayor_first_name = EXCLUDED.mayor_first_name,
        mayor_last_name  = EXCLUDED.mayor_last_name,
        mayor_age        = EXCLUDED.mayor_age,
        mayor_archetype  = EXCLUDED.mayor_archetype,
        mayor_party_id   = EXCLUDED.mayor_party_id,
        budget           = EXCLUDED.budget,
        population_pct   = EXCLUDED.population_pct,
        infrastructure   = EXCLUDED.infrastructure,
        pollution        = EXCLUDED.pollution,
        crime            = EXCLUDED.crime,
        appeal           = EXCLUDED.appeal,
        growth           = EXCLUDED.growth,
        jobs             = EXCLUDED.jobs,
        services         = EXCLUDED.services,
        affordability    = EXCLUDED.affordability;
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
