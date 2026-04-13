-- ══════════════════════════════════════════════════════════════
-- AGITATOR SYSTEM + FILE LAWSUIT
-- Tables: agitator_pool, faction_agitators, lawsuits, lawsuit_events
-- ══════════════════════════════════════════════════════════════

-- ──────────── AGITATOR POOL ────────────
-- Available agitators for hire. Generated on first search per nation.

CREATE TABLE IF NOT EXISTS agitator_pool (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nation_id       UUID NOT NULL REFERENCES public.nations(id) ON DELETE CASCADE,
    first_name      TEXT NOT NULL,
    last_name       TEXT NOT NULL,
    age             INT NOT NULL CHECK (age >= 25 AND age <= 60),
    skill           INT NOT NULL CHECK (skill >= 20 AND skill <= 85),
    background      TEXT,               -- flavor: "Former union organizer", "Disbarred attorney", etc.
    hire_cost       BIGINT NOT NULL,     -- one-time cost based on skill
    status          TEXT NOT NULL DEFAULT 'available'
                    CHECK (status IN ('available', 'hired', 'retired')),
    hired_by_faction_id UUID REFERENCES public.factions(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agitator_pool_nation ON agitator_pool(nation_id);
CREATE INDEX IF NOT EXISTS idx_agitator_pool_status ON agitator_pool(status);

ALTER TABLE agitator_pool ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone can read agitator_pool" ON agitator_pool
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated can insert agitator_pool" ON agitator_pool
    FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated can update agitator_pool" ON agitator_pool
    FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ──────────── FACTION AGITATORS ────────────
-- Hired agitator for a faction. One per faction.

CREATE TABLE IF NOT EXISTS faction_agitators (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faction_id      UUID NOT NULL REFERENCES public.factions(id) ON DELETE CASCADE,
    first_name      TEXT NOT NULL,
    last_name       TEXT NOT NULL,
    age             INT NOT NULL,
    skill           INT NOT NULL CHECK (skill >= 0 AND skill <= 100),
    background      TEXT,
    status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'fired', 'retired')),
    hired_at_tick   INT,
    created_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE(faction_id, status)  -- one active agitator per faction
);

CREATE INDEX IF NOT EXISTS idx_faction_agitators_faction ON faction_agitators(faction_id);

ALTER TABLE faction_agitators ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone can read faction_agitators" ON faction_agitators
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated can insert faction_agitators" ON faction_agitators
    FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated can update faction_agitators" ON faction_agitators
    FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ──────────── LAWSUITS ────────────
-- Active and resolved lawsuits filed by opposition parties.

CREATE TABLE IF NOT EXISTS lawsuits (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faction_id          UUID NOT NULL REFERENCES public.factions(id) ON DELETE CASCADE,
    nation_id           UUID NOT NULL REFERENCES public.nations(id) ON DELETE CASCADE,
    agitator_id         UUID REFERENCES public.faction_agitators(id) ON DELETE SET NULL,
    target_ministry     TEXT NOT NULL,           -- e.g. 'finance', 'defense'
    basis               TEXT NOT NULL,           -- e.g. 'misuse_of_funds', 'corruption'
    filed_at_tick       INT NOT NULL,
    resolves_at_tick    INT NOT NULL,            -- filed_at_tick + 8
    corruption_at_start NUMERIC,                 -- corruption stat when govt inaugurated
    corruption_at_filing NUMERIC,                -- corruption stat when lawsuit filed
    corruption_growth   NUMERIC,                 -- delta (filing - start)
    tier                INT,                     -- 1-4, computed from corruption_growth
    status              TEXT NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'resolved')),
    resolution          TEXT,                    -- 'frivolous', 'partial_win', 'major_win', 'devastating_win'
    momentum_effect     INT DEFAULT 0,           -- net momentum change for filing party
    governance_effect   INT DEFAULT 0,           -- net governance change for filing party
    gov_momentum_effect INT DEFAULT 0,           -- net momentum change for government
    gov_governance_effect INT DEFAULT 0,         -- net governance change for government
    created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lawsuits_faction ON lawsuits(faction_id);
CREATE INDEX IF NOT EXISTS idx_lawsuits_nation ON lawsuits(nation_id);
CREATE INDEX IF NOT EXISTS idx_lawsuits_status ON lawsuits(status);

ALTER TABLE lawsuits ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone can read lawsuits" ON lawsuits
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated can insert lawsuits" ON lawsuits
    FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated can update lawsuits" ON lawsuits
    FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ──────────── LAWSUIT EVENTS ────────────
-- Pre-generated milestone events for active lawsuits.
-- Created at filing time, displayed in the events feed as they come due.

CREATE TABLE IF NOT EXISTS lawsuit_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lawsuit_id      UUID NOT NULL REFERENCES public.lawsuits(id) ON DELETE CASCADE,
    nation_id       UUID NOT NULL REFERENCES public.nations(id) ON DELETE CASCADE,
    event_tick      INT NOT NULL,               -- tick this event fires
    event_type      TEXT NOT NULL,               -- 'filing', 'discovery', 'evidence', 'pre_trial', 'resolution'
    headline        TEXT NOT NULL,
    body            TEXT,
    is_fired        BOOLEAN DEFAULT false,       -- has this event been shown/processed
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lawsuit_events_lawsuit ON lawsuit_events(lawsuit_id);
CREATE INDEX IF NOT EXISTS idx_lawsuit_events_tick ON lawsuit_events(event_tick);
CREATE INDEX IF NOT EXISTS idx_lawsuit_events_nation ON lawsuit_events(nation_id);

ALTER TABLE lawsuit_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone can read lawsuit_events" ON lawsuit_events
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated can insert lawsuit_events" ON lawsuit_events
    FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated can update lawsuit_events" ON lawsuit_events
    FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
