-- Add missing unique constraint on faction_ideology.faction_id
-- Required for ON CONFLICT (faction_id) to work in backfill/seed scripts.
-- Without this, all upsert/ON CONFLICT operations fail silently,
-- leaving parties without ideology rows → preference_score stuck at 50.

ALTER TABLE faction_ideology
    ADD CONSTRAINT faction_ideology_faction_id_key UNIQUE (faction_id);
