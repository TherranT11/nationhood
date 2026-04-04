-- ════════════════════════════════════════════════════════════════════════════════
-- Protect party leader data from unauthorized changes.
--
-- Rule: Party leaders should ONLY change via:
--   1. Player action (party-leadership.html → factions UPDATE with auth.uid())
--   2. Retirement (leader fields cleared to NULL)
--   3. Initial party creation
--
-- This migration adds an audit trigger that logs ALL changes to leader fields
-- on the factions table, so we can trace any unexpected modifications.
-- ════════════════════════════════════════════════════════════════════════════════

-- Create audit log table for leader changes
CREATE TABLE IF NOT EXISTS leader_change_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faction_id UUID NOT NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    change_type TEXT NOT NULL, -- 'appointed', 'retired', 'overwritten', 'created'
    old_first_name TEXT,
    old_last_name TEXT,
    old_age INT,
    new_first_name TEXT,
    new_last_name TEXT,
    new_age INT,
    changed_by UUID, -- auth.uid() if available
    context TEXT -- additional context
);

CREATE INDEX IF NOT EXISTS idx_leader_change_log_faction ON leader_change_log(faction_id);
CREATE INDEX IF NOT EXISTS idx_leader_change_log_changed_at ON leader_change_log(changed_at);

-- Audit trigger function
CREATE OR REPLACE FUNCTION audit_leader_change()
RETURNS TRIGGER AS $$
DECLARE
    v_change_type TEXT;
    v_context TEXT := '';
BEGIN
    -- Skip if leader fields haven't actually changed
    IF OLD.leader_first_name IS NOT DISTINCT FROM NEW.leader_first_name
       AND OLD.leader_last_name IS NOT DISTINCT FROM NEW.leader_last_name
       AND OLD.leader_age IS NOT DISTINCT FROM NEW.leader_age THEN
        RETURN NEW;
    END IF;

    -- Classify the change
    IF OLD.leader_first_name IS NOT NULL AND NEW.leader_first_name IS NULL THEN
        v_change_type := 'retired';
    ELSIF OLD.leader_first_name IS NULL AND NEW.leader_first_name IS NOT NULL THEN
        v_change_type := 'appointed';
    ELSIF OLD.leader_first_name IS NOT NULL AND NEW.leader_first_name IS NOT NULL
          AND OLD.leader_first_name != NEW.leader_first_name THEN
        v_change_type := 'overwritten';
        v_context := 'WARNING: Leader name changed from non-null to different non-null value';
    ELSE
        v_change_type := 'modified';
    END IF;

    INSERT INTO leader_change_log (
        faction_id, change_type,
        old_first_name, old_last_name, old_age,
        new_first_name, new_last_name, new_age,
        changed_by, context
    ) VALUES (
        NEW.id, v_change_type,
        OLD.leader_first_name, OLD.leader_last_name, OLD.leader_age,
        NEW.leader_first_name, NEW.leader_last_name, NEW.leader_age,
        auth.uid(), v_context
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger
DROP TRIGGER IF EXISTS trg_audit_leader_change ON factions;
CREATE TRIGGER trg_audit_leader_change
    BEFORE UPDATE ON factions
    FOR EACH ROW
    EXECUTE FUNCTION audit_leader_change();
