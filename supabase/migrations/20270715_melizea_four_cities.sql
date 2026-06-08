-- ════════════════════════════════════════════════════════════════════
-- 20270715 — Melizea: full four-city build-out per user spec
--
-- The 20270660 seed gave Melizea three placeholder cities (Tepequa /
-- Carlita / Sangréz) with random NPC mayors and middle-of-the-road
-- stats. User has now spec'd identities + stats + mayors for the
-- capital and three majors, including a brand-new major_city_3 slot
-- (20270711 widened the city_type CHECK to allow it). Pattern mirrors
-- 20270711's Sierramar build-out — UPDATE the existing rows by
-- (nation_id, city_type) so we don't depend on the placeholder names,
-- INSERT the new major_city_3 with ON CONFLICT DO NOTHING.
--
-- Cities + bands (user-facing 1..10 stored at user × 10):
--
--   San Maria       (capital,       11% pop, $9M budget)
--   ────────────────────────────────────────────────────
--   Mayor: Hernán Castellanos-Vega · MCN
--   Infrastructure 30 · Pollution 50 · Crime 70 · Appeal 30
--   Growth 30 · Jobs 50 · Services 30 · Affordability 30
--
--   Monteserrano    (major_city_1,   5% pop, $5M budget)
--   ────────────────────────────────────────────────────
--   Mayor: Comandante Tomás Berrio · PPR
--   Infrastructure 30 · Pollution 70 · Crime 50 · Appeal 10
--   Growth 50 · Jobs 50 · Services 30 · Affordability 50
--
--   Castillo Nuevo  (major_city_2,   2% pop, $3M budget)
--   ────────────────────────────────────────────────────
--   Mayor: Andrés Espinoza · UD
--   Infrastructure 30 · Pollution 30 · Crime 50 · Appeal 50
--   Growth 30 · Jobs 30 · Services 10 · Affordability 30
--
--   Senera          (major_city_3,   1% pop, $1M budget)
--   ────────────────────────────────────────────────────
--   Mayor: Rodolfo Tovar · MCN
--   Infrastructure 10 · Pollution 10 · Crime 30 · Appeal 50
--   Growth 10 · Jobs 30 · Services 10 · Affordability 70
--
-- Party lookups: MCN / PPR / UD are admin-created on the running DB
-- (same pattern as Sierramar's ACD/MAB), so we look them up by
-- faction_name and fall back to NULL on miss with a RAISE NOTICE.
-- The Geography card displays party.archetype when mayor_party_id
-- is set (20270708) and mayor_archetype text otherwise (20270711).
-- mayor_archetype on every row is set to a per-party flavor label so
-- the card has something readable even if the party lookup misses.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

DO $$
DECLARE
    v_nation_id uuid;
    v_mcn_id    uuid;
    v_ppr_id    uuid;
    v_ud_id     uuid;
    v_city_id   uuid;
BEGIN
    SELECT id INTO v_nation_id
      FROM public.nations
     WHERE name = 'Melizea'
     LIMIT 1;

    IF v_nation_id IS NULL THEN
        RAISE NOTICE 'Melizea nation not found; four-city build-out skipped.';
        RETURN;
    END IF;

    -- Party lookups. Best-effort: skip linking on miss, fall back to
    -- mayor_archetype display.
    SELECT id INTO v_mcn_id
      FROM public.factions
     WHERE nation_id    = v_nation_id
       AND faction_type = 'movement_party'
       AND abandoned_at IS NULL
       AND faction_name = 'Movimento Cruceran Nacional'
     LIMIT 1;
    IF v_mcn_id IS NULL THEN
        RAISE NOTICE 'MCN (Movimento Cruceran Nacional) not found in Melizea; San Maria + Senera will fall back to archetype display.';
    END IF;

    SELECT id INTO v_ppr_id
      FROM public.factions
     WHERE nation_id    = v_nation_id
       AND faction_type = 'movement_party'
       AND abandoned_at IS NULL
       AND faction_name = 'Partido Patria Roja'
     LIMIT 1;
    IF v_ppr_id IS NULL THEN
        RAISE NOTICE 'PPR (Partido Patria Roja) not found in Melizea; Monteserrano will fall back to archetype display.';
    END IF;

    SELECT id INTO v_ud_id
      FROM public.factions
     WHERE nation_id    = v_nation_id
       AND faction_type = 'movement_party'
       AND abandoned_at IS NULL
       AND faction_name = 'Unión Democrática'
     LIMIT 1;
    IF v_ud_id IS NULL THEN
        RAISE NOTICE 'UD (Unión Democrática) not found in Melizea; Castillo Nuevo will fall back to archetype display.';
    END IF;

    -- ── San Maria (capital) ──────────────────────────────────────
    UPDATE public.cities
       SET city_name        = 'San Maria',
           description      = 'The sprawling, coastal capital of Melizea, ringed by steep mountain ridges packed with dense informal settlements. Once a glittering, modernist showcase of petroleum wealth, the city''s grand brutalist ministries, concrete highways, and historic plazas now stand as weathered monuments to a stalled revolution, deeply divided between the fortified bureaucratic core and the defiant slums overlooking it.',
           mayor_first_name = 'Hernán',
           mayor_last_name  = 'Castellanos-Vega',
           mayor_age        = 35 + floor(random() * 31)::int,
           mayor_archetype  = 'Nationalist',
           mayor_party_id   = v_mcn_id,
           budget           = 9000000,
           population_pct   = 11,
           infrastructure   = 30,
           pollution        = 50,
           crime            = 70,
           appeal           = 30,
           growth           = 30,
           jobs             = 50,
           services         = 30,
           affordability    = 30
     WHERE nation_id = v_nation_id
       AND city_type = 'capital';

    -- ── Monteserrano (major_city_1) ──────────────────────────────
    UPDATE public.cities
       SET city_name        = 'Monteserrano',
           description      = 'Nestled deep in the rugged, oil-rich Eastern basin, this heavy industrial hub was built on black gold. The air is permanently hazy with the flare-stacks of sprawling state refineries, and the local docks are clogged with tankers; it is a city of high-stakes syndicates, gritty mechanical labor, and a population that bears the brunt of the nation''s economic desperation.',
           mayor_first_name = 'Comandante Tomás',
           mayor_last_name  = 'Berrio',
           mayor_age        = 35 + floor(random() * 31)::int,
           mayor_archetype  = 'Communist / Leftist',
           mayor_party_id   = v_ppr_id,
           budget           = 5000000,
           population_pct   = 5,
           infrastructure   = 30,
           pollution        = 70,
           crime            = 50,
           appeal           = 10,
           growth           = 50,
           jobs             = 50,
           services         = 30,
           affordability    = 50
     WHERE nation_id = v_nation_id
       AND city_type = 'major_city_1';

    -- ── Castillo Nuevo (major_city_2) ────────────────────────────
    UPDATE public.cities
       SET city_name        = 'Castillo Nuevo',
           description      = 'A historical fortress town deep in the Melizean jungle.',
           mayor_first_name = 'Andrés',
           mayor_last_name  = 'Espinoza',
           mayor_age        = 35 + floor(random() * 31)::int,
           mayor_archetype  = 'Liberal',
           mayor_party_id   = v_ud_id,
           budget           = 3000000,
           population_pct   = 2,
           infrastructure   = 30,
           pollution        = 30,
           crime            = 50,
           appeal           = 50,
           growth           = 30,
           jobs             = 30,
           services         = 10,
           affordability    = 30
     WHERE nation_id = v_nation_id
       AND city_type = 'major_city_2';

    -- ── Senera (major_city_3) — new row ─────────────────────────
    INSERT INTO public.cities (
        nation_id, city_type, city_name, description,
        mayor_first_name, mayor_last_name, mayor_age, mayor_archetype, mayor_party_id,
        budget, population_pct,
        infrastructure, pollution, crime, appeal,
        growth, jobs, services, affordability
    ) VALUES (
        v_nation_id, 'major_city_3', 'Senera',
        'Located in the vast, sun-scorched southern plains (los llanos), this cattle-ranching and agricultural outpost is a rugged frontier town. Life here moves slowly, dictated by the seasons and horse-drawn transport, remaining largely isolated from the capital''s political chaos except for severe fuel shortages that threaten the harvest.',
        'Rodolfo', 'Tovar', 35 + floor(random() * 31)::int, 'Nationalist', v_mcn_id,
        1000000, 1,
        10, 10, 30, 50,
        10, 30, 10, 70
    ) ON CONFLICT (nation_id, city_type) DO NOTHING;
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
