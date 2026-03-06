-- Atomic AP accumulation: adds AP gain capped at maximum.
-- Returns the new AP balance, or -1 if faction not found.
-- Run this in Supabase SQL editor.

CREATE OR REPLACE FUNCTION accumulate_ap(
    p_faction_id UUID,
    p_gain INT,
    p_max_ap INT DEFAULT 10
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
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
