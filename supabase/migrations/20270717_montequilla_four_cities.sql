-- ════════════════════════════════════════════════════════════════════
-- 20270717 — Montequilla: full four-city build-out per user spec
--
-- The 20270660 seed gave Montequilla three placeholder cities
-- (Vallarriba / Andesa / Plata Verde) with random NPC mayors and
-- middle-of-the-road stats. User spec'd four — capital + three
-- majors — which fits the 20270711 city_type cap at major_city_3.
-- No schema widening needed.
--
-- Cities + bands (user-facing 1..10 stored at user × 10):
--
--   Puerto Esperanza (capital,      11% pop, $9M budget)
--   ────────────────────────────────────────────────────
--   Mayor: Lauten Sanchez · LB
--   Infrastructure 70 · Pollution 50 · Crime 30 · Appeal 70
--   Growth 50 · Jobs 50 · Services 70 · Affordability 30
--
--   Kuelapán         (major_city_1,  4% pop, $5M budget)
--   ────────────────────────────────────────────────────
--   Mayor: Joaquín Carrasco · MD
--   Infrastructure 30 · Pollution 70 · Crime 50 · Appeal 50
--   Growth 50 · Jobs 50 · Services 30 · Affordability 50
--
--   Yanacocha        (major_city_2,  3% pop, $6M budget)
--   ────────────────────────────────────────────────────
--   Mayor: Valeria Vilca · LB
--   Infrastructure 50 · Pollution 70 · Crime 50 · Appeal 10
--   Growth 70 · Jobs 70 · Services 30 · Affordability 30
--
--   Chinchasuyo      (major_city_3,  1% pop, $2M budget)
--   ────────────────────────────────────────────────────
--   Mayor: Tomas Quispe · MD
--   Infrastructure 10 · Pollution 10 · Crime 10 · Appeal 70
--   Growth 10 · Jobs 30 · Services 10 · Affordability 70
--
-- Party lookups: LB (Liberal Democrats) and MD (Montequillan Dawn)
-- are admin-created on the running DB — same pattern as Sierramar's
-- ACD/MAB, Melizea's MCN/PPR/UD, Avelia's PDS/AP/MS/VA. Name-matched
-- lookups, NOTICE on miss, fall back to mayor_archetype text per
-- the 20270708 display priority.
--
-- UPSERT throughout per the 20270715 audit lesson.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

DO $$
DECLARE
    v_nation_id uuid;
    v_lb_id     uuid;
    v_md_id     uuid;
BEGIN
    SELECT id INTO v_nation_id
      FROM public.nations
     WHERE name = 'Montequilla'
     LIMIT 1;

    IF v_nation_id IS NULL THEN
        RAISE NOTICE 'Montequilla nation not found; four-city build-out skipped.';
        RETURN;
    END IF;

    SELECT id INTO v_lb_id
      FROM public.factions
     WHERE nation_id    = v_nation_id
       AND faction_type = 'movement_party'
       AND abandoned_at IS NULL
       AND faction_name = 'Liberal Democrats'
     LIMIT 1;
    IF v_lb_id IS NULL THEN
        RAISE NOTICE 'LB (Liberal Democrats) not found in Montequilla; Puerto Esperanza + Yanacocha will fall back to archetype display.';
    END IF;

    SELECT id INTO v_md_id
      FROM public.factions
     WHERE nation_id    = v_nation_id
       AND faction_type = 'movement_party'
       AND abandoned_at IS NULL
       AND faction_name = 'Montequillan Dawn'
     LIMIT 1;
    IF v_md_id IS NULL THEN
        RAISE NOTICE 'MD (Montequillan Dawn) not found in Montequilla; Kuelapán + Chinchasuyo will fall back to archetype display.';
    END IF;

    -- ── Puerto Esperanza (capital) ───────────────────────────────
    INSERT INTO public.cities (
        nation_id, city_type, city_name, description,
        mayor_first_name, mayor_last_name, mayor_age, mayor_archetype, mayor_party_id,
        budget, population_pct,
        infrastructure, pollution, crime, appeal, growth, jobs, services, affordability
    ) VALUES (
        v_nation_id, 'capital', 'Puerto Esperanza',
        'Perched on the shores of a massive, high-altitude alpine lake, this "port" city is the landlocked nation''s primary transport hub. Grand colonial stone architecture and imposing government ministries overlook cold, misty waters filled with commercial barges. It is the core of the state''s political power, where elite corporate interests and government bureaucrats constantly clash.',
        'Lauten', 'Sanchez', 35 + floor(random() * 31)::int, 'Liberal', v_lb_id,
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

    -- ── Kuelapán (major_city_1) ──────────────────────────────────
    INSERT INTO public.cities (
        nation_id, city_type, city_name, description,
        mayor_first_name, mayor_last_name, mayor_age, mayor_archetype, mayor_party_id,
        budget, population_pct,
        infrastructure, pollution, crime, appeal, growth, jobs, services, affordability
    ) VALUES (
        v_nation_id, 'major_city_1', 'Kuelapán',
        'Built directly into the steep terraces of a dramatic river canyon, this ancient mountain city has deep indigenous roots. It is surrounded by high-altitude mining operations extracting precious metals, but the local population sees very little of that wealth, leading to fierce anti-corporate sentiment and a heavily militarized nationalist presence.',
        'Joaquín', 'Carrasco', 35 + floor(random() * 31)::int, 'Nationalist', v_md_id,
        5000000, 4,
        30, 70, 50, 50, 50, 50, 30, 50
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

    -- ── Yanacocha (major_city_2) ─────────────────────────────────
    INSERT INTO public.cities (
        nation_id, city_type, city_name, description,
        mayor_first_name, mayor_last_name, mayor_age, mayor_archetype, mayor_party_id,
        budget, population_pct,
        infrastructure, pollution, crime, appeal, growth, jobs, services, affordability
    ) VALUES (
        v_nation_id, 'major_city_2', 'Yanacocha',
        'Located in a cold, wind-swept valley high above the treeline, Yanacocha is a gritty, utilitarian frontier town centered around a massive open-pit mining complex. The city is a sprawling grid of corrugated metal roofs and heavy machinery transit routes, completely dominated by foreign corporate concessions and subcontracted laborers.',
        'Valeria', 'Vilca', 35 + floor(random() * 31)::int, 'Liberal', v_lb_id,
        6000000, 3,
        50, 70, 50, 10, 70, 70, 30, 30
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

    -- ── Chinchasuyo (major_city_3) ───────────────────────────────
    INSERT INTO public.cities (
        nation_id, city_type, city_name, description,
        mayor_first_name, mayor_last_name, mayor_age, mayor_archetype, mayor_party_id,
        budget, population_pct,
        infrastructure, pollution, crime, appeal, growth, jobs, services, affordability
    ) VALUES (
        v_nation_id, 'major_city_3', 'Chinchasuyo',
        'A peaceful, isolated agricultural enclave nestled in a lower, fertile mountain valley. Its residents primarily rely on traditional terrace farming, alpaca herding, and small-scale textile trade. The community is fiercely traditional, insular, and highly supportive of protectionist policies to keep foreign industry from encroaching on their valleys.',
        'Tomas', 'Quispe', 35 + floor(random() * 31)::int, 'Nationalist', v_md_id,
        2000000, 1,
        10, 10, 10, 70, 10, 30, 10, 70
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
