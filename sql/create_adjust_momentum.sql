-- Atomic momentum adjustment: reads, clamps, writes, and logs in a single statement.
-- Returns the new momentum value (0-100), or -1 if faction not found.
-- This prevents race conditions when multiple momentum changes happen concurrently.
-- Run this in Supabase SQL editor.

-- Drop the old 2-param overload so the new 4-param version is the sole match
DROP FUNCTION IF EXISTS adjust_momentum(UUID, NUMERIC);

CREATE OR REPLACE FUNCTION adjust_momentum(
    p_faction_id UUID,
    p_delta NUMERIC,
    p_label TEXT DEFAULT NULL,
    p_tick INT DEFAULT NULL
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_new_momentum NUMERIC;
    v_log JSONB;
BEGIN
    -- Atomic read-modify-write for momentum scalar
    UPDATE factions
    SET momentum = LEAST(100, GREATEST(0, ROUND(COALESCE(momentum, 0) + p_delta, 2)))
    WHERE id = p_faction_id
    RETURNING momentum INTO v_new_momentum;

    IF NOT FOUND THEN
        RETURN -1;
    END IF;

    -- Append to momentum_log if label provided and delta is nonzero (cap at 50 entries)
    IF p_label IS NOT NULL AND p_delta != 0 THEN
        SELECT COALESCE(momentum_log, '[]'::jsonb) INTO v_log FROM factions WHERE id = p_faction_id;
        v_log := jsonb_build_object('label', p_label, 'delta', p_delta, 'tick', COALESCE(p_tick, 0)) || v_log;
        IF jsonb_array_length(v_log) > 50 THEN
            v_log := (SELECT jsonb_agg(elem) FROM (SELECT elem FROM jsonb_array_elements(v_log) WITH ORDINALITY AS t(elem, ord) ORDER BY ord LIMIT 50) sub);
        END IF;
        UPDATE factions SET momentum_log = v_log WHERE id = p_faction_id;
    END IF;

    RETURN v_new_momentum;
END;
$$;

ALTER FUNCTION public.adjust_momentum(UUID, NUMERIC, TEXT, INT) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.adjust_momentum(UUID, NUMERIC, TEXT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.adjust_momentum(UUID, NUMERIC, TEXT, INT) TO service_role;
