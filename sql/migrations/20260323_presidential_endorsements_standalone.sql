-- Recreate presidential_endorsements without voter_blocs FK dependency.
-- The Three Pillars election system no longer uses per-bloc endorsements
-- for vote calculation, but run_presidential_election still updates
-- the status column for audit tracking.

CREATE TABLE IF NOT EXISTS presidential_endorsements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    election_id UUID NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
    nation_id UUID NOT NULL REFERENCES nations(id) ON DELETE CASCADE,
    faction_id UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    bloc_id UUID,  -- nullable, no FK (voter_blocs dropped)
    preference_score NUMERIC NOT NULL DEFAULT 40,
    compatibility_snapshot JSONB NOT NULL DEFAULT '{}'::JSONB,
    status TEXT NOT NULL DEFAULT 'snapshotted' CHECK (status IN ('snapshotted', 'consumed', 'archived', 'superseded')),
    snapshotted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    consumed_at TIMESTAMPTZ,
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pres_endorsements_election ON presidential_endorsements(election_id);
CREATE INDEX IF NOT EXISTS idx_pres_endorsements_nation_status ON presidential_endorsements(nation_id, status);

-- No-op snapshot function — Three Pillars reads faction_electoral_standing directly
CREATE OR REPLACE FUNCTION snapshot_presidential_endorsements(
    p_nation_id UUID,
    p_election_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    NULL;
END;
$$;
