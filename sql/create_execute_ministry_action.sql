-- RPC: execute_ministry_action
-- Atomically deducts AP and inserts a ministry action log entry.
-- SECURITY DEFINER bypasses RLS (ministry_action_log is system-write-only).
-- Returns the new action ID on success, or raises an exception on failure.

CREATE OR REPLACE FUNCTION execute_ministry_action(
    p_nation_id        UUID,
    p_faction_id       UUID,
    p_ministry_key     TEXT,
    p_action_key       TEXT,
    p_ap_cost          INT,
    p_applied_at_tick  INT,
    p_stat_effects     JSONB,
    p_action_data      JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_new_ap INT;
    v_action_id UUID;
BEGIN
    -- 0. Verify the caller owns this faction (auth.uid() = faction PK)
    IF p_faction_id != auth.uid() THEN
        RAISE EXCEPTION 'Faction ID does not match authenticated user';
    END IF;

    -- 1. Reject if this action is already active (prevents double stat application)
    IF EXISTS (
        SELECT 1 FROM ministry_action_log
        WHERE nation_id   = p_nation_id
          AND ministry_key = p_ministry_key
          AND action_key   = p_action_key
          AND processed    = false
    ) THEN
        RAISE EXCEPTION 'Action already active: %.%', p_ministry_key, p_action_key;
    END IF;

    -- 2. Deduct AP atomically (fails if insufficient)
    UPDATE factions
    SET action_points = action_points - p_ap_cost
    WHERE id = p_faction_id
      AND action_points >= p_ap_cost
    RETURNING action_points INTO v_new_ap;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Insufficient AP: need %, have less', p_ap_cost;
    END IF;

    -- 3. Insert the action log entry
    INSERT INTO ministry_action_log (
        nation_id, faction_id, ministry_key, action_key,
        ap_cost, applied_at_tick, stat_effects, action_data,
        processed, effects_applied_through_tick
    ) VALUES (
        p_nation_id, p_faction_id, p_ministry_key, p_action_key,
        p_ap_cost, p_applied_at_tick, p_stat_effects, p_action_data,
        false, p_applied_at_tick
    )
    RETURNING id INTO v_action_id;

    RETURN v_action_id;
END;
$$;
