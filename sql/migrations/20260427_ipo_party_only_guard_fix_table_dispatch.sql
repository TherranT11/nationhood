-- ══════════════════════════════════════════════════════════════════════════
-- Fix: assert_ipo_target_is_party() crashes on ipo_members INSERTs.
--
-- Original function (20260426_ipo_party_only_guard.sql) used
--    v_target_id := COALESCE(NEW.faction_id, NEW.target_faction_id);
-- to handle two tables with one function. plpgsql does NOT lazily
-- evaluate COALESCE: every record-field reference is resolved against
-- the row's structure at runtime, and `NEW.target_faction_id` does not
-- exist on an `ipo_members` row, so the trigger raised
--    "record 'new' has no field 'target_faction_id'"
-- on every membership INSERT.
--
-- Effect: silent for invitations (where target_faction_id exists),
-- catastrophic for ipo_members — every admit + invite-accept failed
-- with a 400. The fix branches on TG_TABLE_NAME so each table only
-- references its own column.
-- ══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION assert_ipo_target_is_party()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    v_target_id UUID;
    v_type      TEXT;
BEGIN
    IF TG_TABLE_NAME = 'ipo_members' THEN
        v_target_id := NEW.faction_id;
    ELSIF TG_TABLE_NAME = 'ipo_invitations' THEN
        v_target_id := NEW.target_faction_id;
    ELSE
        RETURN NEW;  -- defensive: unknown table
    END IF;

    IF v_target_id IS NULL THEN
        RETURN NEW;  -- nothing to validate
    END IF;

    SELECT faction_type INTO v_type
    FROM factions
    WHERE id = v_target_id;

    IF v_type IS DISTINCT FROM 'party' THEN
        RAISE EXCEPTION
            'IPO membership requires faction_type = ''party'' (faction % has type %)',
            v_target_id, COALESCE(v_type, 'NULL');
    END IF;

    RETURN NEW;
END;
$$;
