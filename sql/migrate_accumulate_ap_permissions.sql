-- Idempotent AP RPC migration.
-- Ensures public.accumulate_ap has the correct signature, owner, security,
-- and runtime grants used by client + edge-function tick processing.

CREATE OR REPLACE FUNCTION public.accumulate_ap(
    p_faction_id UUID,
    p_gain INT,
    p_max_ap INT DEFAULT 10
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_new_ap INT;
BEGIN
    UPDATE factions
    SET action_points = LEAST(COALESCE(action_points, 0) + p_gain, p_max_ap)
    WHERE id = p_faction_id
    RETURNING action_points INTO v_new_ap;

    IF NOT FOUND THEN
        RETURN -1;
    END IF;

    RETURN v_new_ap;
END;
$$;

ALTER FUNCTION public.accumulate_ap(UUID, INT, INT) OWNER TO postgres;

-- Explicit runtime grants (idempotent):
GRANT EXECUTE ON FUNCTION public.accumulate_ap(UUID, INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accumulate_ap(UUID, INT, INT) TO service_role;
GRANT EXECUTE ON FUNCTION public.deduct_ap(UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.deduct_ap(UUID, INT) TO service_role;

