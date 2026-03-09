-- ============================================================
-- DB-level constraints for government formation
-- Prevents race conditions that were previously only guarded client-side
-- ============================================================

-- 1. Unique index: one active proposal per proposer per election
-- The client already checks this but a race condition could bypass it
CREATE UNIQUE INDEX IF NOT EXISTS uq_formation_one_active_per_proposer
ON government_formations (election_id, proposed_by)
WHERE status = 'active';

-- 2. Trigger: exclusive formation support
-- When a faction supports a coalition, automatically withdraw support
-- from all other coalitions for the same election.
-- Replaces the client-side loop in toggleSupport().

CREATE OR REPLACE FUNCTION enforce_exclusive_formation_support()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.supports = true THEN
    UPDATE government_formation_support gfs
    SET supports = false
    FROM government_formations gf
    WHERE gfs.formation_id = gf.id
      AND gfs.faction_id = NEW.faction_id
      AND gfs.formation_id != NEW.formation_id
      AND gf.election_id = (
        SELECT election_id FROM government_formations WHERE id = NEW.formation_id
      )
      AND gf.status = 'active';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop if exists to make migration idempotent
DROP TRIGGER IF EXISTS trg_exclusive_formation_support ON government_formation_support;

CREATE TRIGGER trg_exclusive_formation_support
BEFORE INSERT OR UPDATE ON government_formation_support
FOR EACH ROW EXECUTE FUNCTION enforce_exclusive_formation_support();
