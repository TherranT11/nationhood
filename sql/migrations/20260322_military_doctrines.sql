-- Military Doctrines table
-- Stores active, renouncing, and pending doctrine state per nation.
-- Each row represents a doctrine that has been announced (or is in cooldown).
-- Inactive doctrines are deleted after cooldown expires.

CREATE TABLE IF NOT EXISTS military_doctrines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nation_id UUID NOT NULL REFERENCES nations(id) ON DELETE CASCADE,
    doctrine_id TEXT NOT NULL,
    sector TEXT NOT NULL CHECK (sector IN ('army', 'navy', 'air_force', 'intelligence', 'nuclear')),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    cohesion INTEGER NOT NULL DEFAULT 0,
    activated_on_tick INTEGER NOT NULL DEFAULT 0,
    renouncing BOOLEAN NOT NULL DEFAULT FALSE,
    renounce_cooldown_remaining INTEGER,
    permanent BOOLEAN NOT NULL DEFAULT FALSE,
    autocracy_only BOOLEAN NOT NULL DEFAULT FALSE,
    hidden BOOLEAN NOT NULL DEFAULT FALSE,
    -- Nuclear single-select transition fields
    pending_doctrine_id TEXT,
    pending_activates_tick INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(nation_id, doctrine_id)
);

-- Index for fast lookups by nation
CREATE INDEX IF NOT EXISTS idx_military_doctrines_nation ON military_doctrines(nation_id);

-- Index for tick processing (active doctrines needing cohesion increment, renouncing needing cooldown decrement)
CREATE INDEX IF NOT EXISTS idx_military_doctrines_active ON military_doctrines(active, renouncing);

-- RLS: match existing permissive pattern (to be tightened later)
ALTER TABLE military_doctrines ENABLE ROW LEVEL SECURITY;

CREATE POLICY military_doctrines_select ON military_doctrines
    FOR SELECT TO authenticated USING (true);

CREATE POLICY military_doctrines_insert ON military_doctrines
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY military_doctrines_update ON military_doctrines
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY military_doctrines_delete ON military_doctrines
    FOR DELETE TO authenticated USING (true);

-- Seed starting doctrine for all existing nations: Non-Nuclear Power
-- New nations should have this inserted at creation time.
INSERT INTO military_doctrines (nation_id, doctrine_id, sector, active, cohesion, activated_on_tick, permanent, autocracy_only, hidden)
SELECT
    id,
    'non_nuclear_power',
    'nuclear',
    true,
    0,
    0,
    false,
    false,
    false
FROM nations
ON CONFLICT (nation_id, doctrine_id) DO NOTHING;

-- Seed Praetorian Doctrine for autocracy nations
INSERT INTO military_doctrines (nation_id, doctrine_id, sector, active, cohesion, activated_on_tick, permanent, autocracy_only, hidden)
SELECT
    id,
    'praetorian_doctrine',
    'army',
    true,
    0,
    0,
    true,
    true,
    true
FROM nations
WHERE government_type ILIKE '%autocra%'
   OR government_type ILIKE '%authoritarian%'
   OR government_type ILIKE '%dictat%'
   OR government_type ILIKE '%junta%'
ON CONFLICT (nation_id, doctrine_id) DO NOTHING;
