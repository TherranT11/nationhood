-- ═══════════════════════════════════════════════════════════════════════════════
-- IPO MEMBERSHIP RESTRICTED TO PARTY FACTIONS
-- ═══════════════════════════════════════════════════════════════════════════════
-- IPOs are International PARTY Organisations. Corporations and any other
-- non-party faction types must not be admittable. UI / page-redirect logic
-- already steers corps away from the diplomacy page, but those are display-
-- layer protections — this trigger is the schema-level guarantee that no
-- code path can insert a non-party faction into ipo_members / ipo_invitations.
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION assert_ipo_target_is_party()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    v_target_id UUID;
    v_type      TEXT;
BEGIN
    -- Same trigger fires for both ipo_members (faction_id) and
    -- ipo_invitations (target_faction_id); pick whichever is present.
    v_target_id := COALESCE(NEW.faction_id, NEW.target_faction_id);
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

DROP TRIGGER IF EXISTS ipo_members_party_only ON ipo_members;
CREATE TRIGGER ipo_members_party_only
    BEFORE INSERT OR UPDATE OF faction_id ON ipo_members
    FOR EACH ROW EXECUTE FUNCTION assert_ipo_target_is_party();

DROP TRIGGER IF EXISTS ipo_invitations_party_only ON ipo_invitations;
CREATE TRIGGER ipo_invitations_party_only
    BEFORE INSERT OR UPDATE OF target_faction_id ON ipo_invitations
    FOR EACH ROW EXECUTE FUNCTION assert_ipo_target_is_party();

COMMIT;
