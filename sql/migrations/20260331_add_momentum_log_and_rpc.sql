-- Add momentum_log JSONB column and atomic adjust_momentum RPC.
-- momentum_log: array of { label, delta, tick } entries, capped at 50 most recent.
-- adjust_momentum: atomic read-modify-write to prevent race conditions.

-- ── 1. Add momentum_log column ──
ALTER TABLE factions
ADD COLUMN IF NOT EXISTS momentum_log JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN factions.momentum_log IS 'Recent momentum events: array of { label: string, delta: number, tick: number }. Capped at 50 entries.';

-- ── 2. Create atomic adjust_momentum RPC ──
CREATE OR REPLACE FUNCTION adjust_momentum(
    p_faction_id UUID,
    p_delta NUMERIC
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_new_momentum NUMERIC;
BEGIN
    UPDATE factions
    SET momentum = LEAST(100, GREATEST(0, ROUND(COALESCE(momentum, 0) + p_delta, 2)))
    WHERE id = p_faction_id
    RETURNING momentum INTO v_new_momentum;

    IF NOT FOUND THEN
        RETURN -1;
    END IF;

    RETURN v_new_momentum;
END;
$$;

ALTER FUNCTION public.adjust_momentum(UUID, NUMERIC) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.adjust_momentum(UUID, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.adjust_momentum(UUID, NUMERIC) TO service_role;
