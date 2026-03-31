-- Atomic momentum adjustment: reads, clamps, and writes in a single statement.
-- Returns the new momentum value (0-100), or -1 if faction not found.
-- This prevents race conditions when multiple momentum changes happen concurrently.
-- Run this in Supabase SQL editor.

CREATE OR REPLACE FUNCTION adjust_momentum(
    p_faction_id UUID,
    p_delta NUMERIC
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
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
