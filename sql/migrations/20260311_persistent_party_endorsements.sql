-- Persistent party endorsement preferences for presidential elections.
-- Stores each party's standing endorsement choice in a nation,
-- with optional lock-in snapshot fields captured when an election locks.

CREATE TABLE IF NOT EXISTS party_endorsement_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nation_id UUID NOT NULL REFERENCES nations(id) ON DELETE CASCADE,
    endorsing_party_id UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    endorsed_party_id UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    declared_at_tick INT NOT NULL,
    updated_at_tick INT NOT NULL,
    target_election_id UUID REFERENCES elections(id) ON DELETE SET NULL,

    -- Optional lock-in snapshot data.
    -- These fields are intended to be written when an election locks in,
    -- not at every endorsement change.
    compatibility_score_snapshot NUMERIC(6,3),
    compatibility_details_snapshot JSONB,
    locked_in_at_tick INT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_party_endorsement_per_party
        UNIQUE (nation_id, endorsing_party_id)
);

CREATE INDEX IF NOT EXISTS idx_party_endorsement_nation
    ON party_endorsement_preferences (nation_id);

CREATE INDEX IF NOT EXISTS idx_party_endorsement_target_election
    ON party_endorsement_preferences (target_election_id)
    WHERE target_election_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_party_endorsement_endorsed_party
    ON party_endorsement_preferences (endorsed_party_id);

ALTER TABLE party_endorsement_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "party_endorsement_select" ON party_endorsement_preferences;
DROP POLICY IF EXISTS "party_endorsement_insert_own" ON party_endorsement_preferences;
DROP POLICY IF EXISTS "party_endorsement_update_own" ON party_endorsement_preferences;
DROP POLICY IF EXISTS "party_endorsement_delete_own" ON party_endorsement_preferences;

CREATE POLICY "party_endorsement_select"
    ON party_endorsement_preferences FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "party_endorsement_insert_own"
    ON party_endorsement_preferences FOR INSERT TO authenticated
    WITH CHECK (endorsing_party_id = auth.uid());

CREATE POLICY "party_endorsement_update_own"
    ON party_endorsement_preferences FOR UPDATE TO authenticated
    USING (endorsing_party_id = auth.uid())
    WITH CHECK (endorsing_party_id = auth.uid());

CREATE POLICY "party_endorsement_delete_own"
    ON party_endorsement_preferences FOR DELETE TO authenticated
    USING (endorsing_party_id = auth.uid());
