-- ══════════════════════════════════════════════════════════════
-- Airline Corporations — Phase 1 schema.
--
--   factions hero stats (mirrors how Shipping / Finance store
--   their per-corp scalars on the faction row):
--     corp_fleet      INT — total Fleet slots used by this corp's
--                           aircraft. Derived (via trigger / app
--                           code) from corp_aircraft, but stored
--                           here so the dashboard reads one column
--                           instead of doing an aggregate query.
--     corp_routes     INT — count of active routes. 0 at Phase 1
--                           (route creation lands later).
--     corp_op_safety  NUMERIC — 0-10 cleanliness score. Starts
--                               at 8 for new airlines.
--
--   corp_aircraft — one row per aircraft owned by an airline corp.
--     Three classes: regional / narrowbody / widebody.
--     fleet_slots is GENERATED from class so the slot mapping
--     lives in one place (1 / 2 / 3).
--
--   corp_airline_terminals — one row per (airline corp, nation)
--     terminal access. Phase 1 seeds one is_free=TRUE row for the
--     founder's home nation. Later phases add paid terminals.
-- ══════════════════════════════════════════════════════════════

ALTER TABLE factions
    ADD COLUMN IF NOT EXISTS corp_fleet      INT     NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS corp_routes     INT     NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS corp_op_safety  NUMERIC NOT NULL DEFAULT 0;

COMMENT ON COLUMN factions.corp_fleet     IS 'Airline corps: total Fleet slots used by owned aircraft (Regional=1, Narrowbody=2, Widebody=3).';
COMMENT ON COLUMN factions.corp_routes    IS 'Airline corps: count of active routes. 0 until route creation lands.';
COMMENT ON COLUMN factions.corp_op_safety IS 'Airline corps: 0-10 operational safety score. New airlines start at 8.';

-- ── corp_aircraft ──
CREATE TABLE IF NOT EXISTS public.corp_aircraft (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    corp_id         UUID        NOT NULL REFERENCES public.factions(id) ON DELETE CASCADE,
    aircraft_class  TEXT        NOT NULL CHECK (aircraft_class IN ('regional', 'narrowbody', 'widebody')),
    fleet_slots     INT         NOT NULL GENERATED ALWAYS AS (
        CASE aircraft_class
            WHEN 'regional'   THEN 1
            WHEN 'narrowbody' THEN 2
            WHEN 'widebody'   THEN 3
        END
    ) STORED,
    condition       NUMERIC     NOT NULL DEFAULT 100,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_corp_aircraft_corp ON public.corp_aircraft (corp_id);

ALTER TABLE public.corp_aircraft ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname='public' AND tablename='corp_aircraft' AND policyname='Anyone can read corp_aircraft'
    ) THEN
        CREATE POLICY "Anyone can read corp_aircraft"
            ON public.corp_aircraft FOR SELECT USING (true);
    END IF;
END $$;

-- ── corp_airline_terminals ──
CREATE TABLE IF NOT EXISTS public.corp_airline_terminals (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    corp_id     UUID        NOT NULL REFERENCES public.factions(id) ON DELETE CASCADE,
    nation_id   UUID        NOT NULL REFERENCES public.nations(id) ON DELETE CASCADE,
    is_free     BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (corp_id, nation_id)
);

CREATE INDEX IF NOT EXISTS idx_corp_airline_terminals_corp ON public.corp_airline_terminals (corp_id);

ALTER TABLE public.corp_airline_terminals ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname='public' AND tablename='corp_airline_terminals' AND policyname='Anyone can read corp_airline_terminals'
    ) THEN
        CREATE POLICY "Anyone can read corp_airline_terminals"
            ON public.corp_airline_terminals FOR SELECT USING (true);
    END IF;
END $$;

NOTIFY pgrst, 'reload schema';
