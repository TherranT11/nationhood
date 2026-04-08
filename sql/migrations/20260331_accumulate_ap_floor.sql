-- Fix: accumulate_ap could push AP below zero when called with negative p_gain.
-- Two campaign actions (press_conference, outreach) used accumulate_ap with
-- negative values as a hacky deduction path, bypassing deduct_ap's floor check.
-- This migration adds GREATEST(0, ...) to prevent negative AP regardless of caller.

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
    SET action_points = GREATEST(0, LEAST(COALESCE(action_points, 0) + p_gain, p_max_ap))
    WHERE id = p_faction_id
    RETURNING action_points INTO v_new_ap;

    IF NOT FOUND THEN
        RETURN -1;
    END IF;

    RETURN v_new_ap;
END;
$$;

-- Also fix any factions currently stuck with negative AP
UPDATE factions SET action_points = 0 WHERE action_points < 0;
