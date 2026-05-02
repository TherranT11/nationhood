-- ══════════════════════════════════════════════════════════════
-- Airline Corps Phase 2: hub system (cities + terminals).
--
--   airline_cities — one row per major city. Pre-seeded for
--   Calveth and Avelia (the two starting nations). Each city
--   carries a population_pct (% of the nation's population that
--   lives there — drives demand later), a terminal_count, a
--   runway_type, and an is_capital flag.
--
--   airline_terminals — one row per terminal slot at a city.
--   Pre-seeded with terminal_count rows per city, all unowned
--   (owner_airline_id NULL). Airlines claim a slot by UPDATEing
--   owner_airline_id; the only client-facing action in Phase 2
--   is the founder's free-terminal claim at corp creation.
--
--   Drops Phase 1's corp_airline_terminals (per-nation presence
--   row) — the new per-terminal model supersedes it. Existing
--   Phase 1 data is migrated where a seeded capital city exists.
-- ══════════════════════════════════════════════════════════════

-- ── 1. airline_cities ──
CREATE TABLE IF NOT EXISTS public.airline_cities (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    nation_id       UUID         NOT NULL REFERENCES public.nations(id) ON DELETE CASCADE,
    name            TEXT         NOT NULL,
    population_pct  NUMERIC(5,2) NOT NULL CHECK (population_pct >= 0 AND population_pct <= 100),
    terminal_count  INT          NOT NULL CHECK (terminal_count >= 1 AND terminal_count <= 10),
    runway_type     TEXT         NOT NULL CHECK (runway_type IN ('short', 'standard', 'international')),
    is_capital      BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (nation_id, name)
);

CREATE INDEX IF NOT EXISTS idx_airline_cities_nation ON public.airline_cities (nation_id);

-- At most one capital per nation.
CREATE UNIQUE INDEX IF NOT EXISTS idx_airline_cities_one_capital
    ON public.airline_cities (nation_id) WHERE is_capital = TRUE;

ALTER TABLE public.airline_cities ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname='public' AND tablename='airline_cities' AND policyname='Anyone can read airline_cities'
    ) THEN
        CREATE POLICY "Anyone can read airline_cities"
            ON public.airline_cities FOR SELECT USING (true);
    END IF;
END $$;

-- ── 2. airline_terminals ──
CREATE TABLE IF NOT EXISTS public.airline_terminals (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id           UUID        NOT NULL REFERENCES public.airline_cities(id) ON DELETE CASCADE,
    terminal_number   INT         NOT NULL,
    owner_airline_id  UUID        NULL REFERENCES public.factions(id) ON DELETE SET NULL,
    acquired_at_tick  INT         NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (city_id, terminal_number)
);

CREATE INDEX IF NOT EXISTS idx_airline_terminals_city  ON public.airline_terminals (city_id);
CREATE INDEX IF NOT EXISTS idx_airline_terminals_owner ON public.airline_terminals (owner_airline_id) WHERE owner_airline_id IS NOT NULL;

ALTER TABLE public.airline_terminals ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname='public' AND tablename='airline_terminals' AND policyname='Anyone can read airline_terminals'
    ) THEN
        CREATE POLICY "Anyone can read airline_terminals"
            ON public.airline_terminals FOR SELECT USING (true);
    END IF;
END $$;

-- Owner-update policy: an authenticated user can claim an unowned
-- terminal for one of their own Airline corps. USING gates which rows
-- are visible to UPDATE (only unowned ones); WITH CHECK gates the
-- final state (owner must be your Airline corp).
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname='public' AND tablename='airline_terminals' AND policyname='Owners can claim airline_terminals'
    ) THEN
        CREATE POLICY "Owners can claim airline_terminals"
            ON public.airline_terminals FOR UPDATE
            TO authenticated
            USING (owner_airline_id IS NULL)
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.factions f
                     WHERE f.id = airline_terminals.owner_airline_id
                       AND f.faction_type = 'corporation'
                       AND f.corp_sector  = 'Airline'
                       AND (f.id = auth.uid() OR f.linked_user_id = auth.uid())
                )
            );
    END IF;
END $$;

-- ── 3. Seed cities for Calveth + Avelia ──
INSERT INTO public.airline_cities (nation_id, name, population_pct, terminal_count, runway_type, is_capital)
SELECT n.id, c.name, c.population_pct, c.terminal_count, c.runway_type, c.is_capital
  FROM (VALUES
    ('Calveth', 'Kolvenstaad', 17::NUMERIC, 7, 'international', TRUE),
    ('Calveth', 'Dinsag',       5::NUMERIC, 4, 'standard',     FALSE),
    ('Calveth', 'Gosmund',      3::NUMERIC, 4, 'standard',     FALSE),
    ('Avelia',  'Oros',         9::NUMERIC, 10, 'international', TRUE),
    ('Avelia',  'Valdomar',     4::NUMERIC, 4, 'short',         FALSE),
    ('Avelia',  'Buenavera',    3::NUMERIC, 8, 'international', FALSE)
  ) AS c(nation_name, name, population_pct, terminal_count, runway_type, is_capital)
  JOIN public.nations n ON n.name = c.nation_name
ON CONFLICT (nation_id, name) DO NOTHING;

-- ── 4. Seed terminals for each newly-seeded city ──
-- Generates terminal_count empty terminal rows per city. ON CONFLICT
-- guards re-runs.
INSERT INTO public.airline_terminals (city_id, terminal_number)
SELECT c.id, gs.n
  FROM public.airline_cities c
  CROSS JOIN LATERAL generate_series(1, c.terminal_count) AS gs(n)
ON CONFLICT (city_id, terminal_number) DO NOTHING;

-- ── 5. Migrate existing corp_airline_terminals → airline_terminals ──
-- Pre-Phase-2 free terminals were tracked by (corp_id, nation_id).
-- For each row whose nation has a seeded capital city, claim
-- terminal #1 at that capital for the corp. acquired_at_tick = 0
-- because we don't know the original tick.
DO $$
DECLARE r RECORD; v_city UUID;
BEGIN
    -- Skip if Phase 1 table doesn't exist (e.g., applying on a fresh DB).
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables
                    WHERE table_schema='public' AND table_name='corp_airline_terminals') THEN
        RETURN;
    END IF;
    FOR r IN
        EXECUTE 'SELECT corp_id, nation_id FROM public.corp_airline_terminals WHERE is_free = TRUE'
    LOOP
        SELECT id INTO v_city
          FROM public.airline_cities
         WHERE nation_id = r.nation_id AND is_capital = TRUE
         LIMIT 1;
        IF v_city IS NULL THEN
            RAISE NOTICE '[Phase 2 migration] No seeded capital for nation %, skipping airline %', r.nation_id, r.corp_id;
            CONTINUE;
        END IF;
        UPDATE public.airline_terminals
           SET owner_airline_id = r.corp_id, acquired_at_tick = 0
         WHERE city_id = v_city
           AND terminal_number = 1
           AND owner_airline_id IS NULL;
    END LOOP;
END $$;

-- ── 6. Drop the Phase 1 table ──
DROP TABLE IF EXISTS public.corp_airline_terminals;

NOTIFY pgrst, 'reload schema';
