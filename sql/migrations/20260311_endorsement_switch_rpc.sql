BEGIN;

CREATE OR REPLACE FUNCTION switch_party_endorsement(
    endorsing_party_id UUID,
    new_endorsed_party_id UUID,
    current_tick INT
)
RETURNS TABLE(updated_ap INT, endorsed_party_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_existing_target UUID;
    v_new_ap INT;
    v_has_tick_column BOOLEAN;
BEGIN
    IF endorsing_party_id IS NULL OR new_endorsed_party_id IS NULL THEN
        RAISE EXCEPTION 'endorsing_party_id and new_endorsed_party_id are required';
    END IF;

    -- Ownership check for authenticated clients. service_role bypasses with auth.uid() IS NULL.
    IF auth.uid() IS NOT NULL AND endorsing_party_id != auth.uid() THEN
        RAISE EXCEPTION 'permission denied for endorsement switch';
    END IF;

    SELECT pep.endorsed_party_id
    INTO v_existing_target
    FROM party_endorsement_preferences pep
    WHERE pep.endorsing_party_id = switch_party_endorsement.endorsing_party_id
    FOR UPDATE;

    -- Deduct AP only when switching away from an existing different target.
    IF v_existing_target IS NOT NULL
       AND v_existing_target IS DISTINCT FROM new_endorsed_party_id THEN
        UPDATE factions f
        SET action_points = f.action_points - 1
        WHERE f.id = endorsing_party_id
          AND f.action_points >= 1
        RETURNING f.action_points INTO v_new_ap;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'insufficient AP for endorsement switch';
        END IF;
    ELSE
        SELECT COALESCE(f.action_points, 0)
        INTO v_new_ap
        FROM factions f
        WHERE f.id = endorsing_party_id;

        IF v_new_ap IS NULL THEN
            RAISE EXCEPTION 'endorsing party not found';
        END IF;
    END IF;

    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns c
        WHERE c.table_schema = 'public'
          AND c.table_name = 'party_endorsement_preferences'
          AND c.column_name = 'updated_at_tick'
    ) INTO v_has_tick_column;

    IF v_has_tick_column THEN
        INSERT INTO party_endorsement_preferences (endorsing_party_id, endorsed_party_id, updated_at_tick)
        VALUES (endorsing_party_id, new_endorsed_party_id, current_tick)
        ON CONFLICT (endorsing_party_id)
        DO UPDATE SET
            endorsed_party_id = EXCLUDED.endorsed_party_id,
            updated_at_tick = EXCLUDED.updated_at_tick;
    ELSE
        INSERT INTO party_endorsement_preferences (endorsing_party_id, endorsed_party_id)
        VALUES (endorsing_party_id, new_endorsed_party_id)
        ON CONFLICT (endorsing_party_id)
        DO UPDATE SET
            endorsed_party_id = EXCLUDED.endorsed_party_id;
    END IF;

    RETURN QUERY SELECT v_new_ap, new_endorsed_party_id;
END;
$$;

ALTER FUNCTION switch_party_endorsement(UUID, UUID, INT) OWNER TO postgres;

GRANT EXECUTE ON FUNCTION switch_party_endorsement(UUID, UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION switch_party_endorsement(UUID, UUID, INT) TO service_role;

COMMIT;
