-- ══════════════════════════════════════════════════════════════
-- ELECTION SCHEDULING GUARD
-- Prevents duplicate scheduled elections and provides a safe
-- scheduling function that all code paths should use.
-- ══════════════════════════════════════════════════════════════

-- Partial unique index: only one scheduled parliamentary election per nation
-- (allows multiple completed/cancelled rows)
CREATE UNIQUE INDEX IF NOT EXISTS idx_elections_one_scheduled_parl
    ON elections (nation_id, election_type)
    WHERE status = 'scheduled';

-- Safe scheduling function: checks for existing before inserting.
-- Returns the election row (existing or newly created).
CREATE OR REPLACE FUNCTION schedule_election_safe(
    p_nation_id UUID,
    p_election_tick INT,
    p_election_type TEXT DEFAULT 'parliamentary'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_existing_id UUID;
    v_new_id UUID;
BEGIN
    -- Check for existing scheduled election of this type
    SELECT id INTO v_existing_id
    FROM elections
    WHERE nation_id = p_nation_id
      AND election_type = p_election_type
      AND status = 'scheduled';

    IF v_existing_id IS NOT NULL THEN
        -- Already scheduled — update tick if the new one is sooner
        UPDATE elections
        SET election_tick = LEAST(election_tick, p_election_tick)
        WHERE id = v_existing_id;
        RETURN v_existing_id;
    END IF;

    -- No existing — insert new
    INSERT INTO elections (nation_id, election_tick, election_type, status)
    VALUES (p_nation_id, p_election_tick, p_election_type, 'scheduled')
    RETURNING id INTO v_new_id;

    RETURN v_new_id;
END;
$$;

ALTER FUNCTION public.schedule_election_safe(UUID, INT, TEXT) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.schedule_election_safe(UUID, INT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.schedule_election_safe(UUID, INT, TEXT) TO service_role;
