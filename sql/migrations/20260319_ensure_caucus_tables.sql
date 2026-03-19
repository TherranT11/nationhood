-- Ensure caucus system tables exist.
-- The full schema is in 20260316_caucus_system.sql — this migration is
-- a safe re-run for databases where that migration wasn't applied.

-- 1. Caucus factions (internal wings within a dominant party)
CREATE TABLE IF NOT EXISTS caucus_factions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    party_id UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    nation_id UUID NOT NULL REFERENCES nations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    dominant_axis TEXT NOT NULL CHECK (dominant_axis IN (
        'liberty_equality',
        'tradition_progress',
        'security_freedom',
        'globalism_nationalism',
        'individualism_collectivism'
    )),
    wing_end TEXT NOT NULL CHECK (wing_end IN ('left', 'right')),
    seat_share NUMERIC(4,3) NOT NULL DEFAULT 0.100 CHECK (seat_share >= 0 AND seat_share <= 1),
    relationship_score INTEGER NOT NULL DEFAULT 65 CHECK (relationship_score >= 0 AND relationship_score <= 100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_caucus_factions_party ON caucus_factions(party_id);
CREATE INDEX IF NOT EXISTS idx_caucus_factions_nation ON caucus_factions(nation_id);
CREATE INDEX IF NOT EXISTS idx_caucus_factions_active ON caucus_factions(party_id, is_active) WHERE is_active = true;

-- 2. Per-bill caucus dispositions
CREATE TABLE IF NOT EXISTS caucus_dispositions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caucus_faction_id UUID NOT NULL REFERENCES caucus_factions(id) ON DELETE CASCADE,
    bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    disposition TEXT NOT NULL DEFAULT 'not_triggered' CHECK (disposition IN (
        'aligned', 'nervous', 'opposed', 'not_triggered'
    )),
    votes_affected INTEGER NOT NULL DEFAULT 0,
    whipped BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(caucus_faction_id, bill_id)
);

CREATE INDEX IF NOT EXISTS idx_caucus_dispositions_bill ON caucus_dispositions(bill_id);
CREATE INDEX IF NOT EXISTS idx_caucus_dispositions_faction ON caucus_dispositions(caucus_faction_id);

-- 3. Withheld votes column on bills
ALTER TABLE bills ADD COLUMN IF NOT EXISTS caucus_votes_withheld INTEGER NOT NULL DEFAULT 0;

-- 4. RLS
ALTER TABLE caucus_factions ENABLE ROW LEVEL SECURITY;
ALTER TABLE caucus_dispositions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'caucus_factions_select') THEN
        CREATE POLICY caucus_factions_select ON caucus_factions FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'caucus_dispositions_select') THEN
        CREATE POLICY caucus_dispositions_select ON caucus_dispositions FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'caucus_factions_service_all') THEN
        CREATE POLICY caucus_factions_service_all ON caucus_factions FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'caucus_dispositions_service_all') THEN
        CREATE POLICY caucus_dispositions_service_all ON caucus_dispositions FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'caucus_factions_update') THEN
        CREATE POLICY caucus_factions_update ON caucus_factions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'caucus_dispositions_update') THEN
        CREATE POLICY caucus_dispositions_update ON caucus_dispositions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;
