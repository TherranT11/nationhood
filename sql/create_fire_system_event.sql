-- RPC: fire_system_event
-- Inserts a system event into event_log with a trigger_key and placeholders.
-- Called from the tick processor, ministry actions, elections, bills, etc.
-- SECURITY DEFINER so client-side callers can write to event_log.

-- Ensure trigger_key column exists (may already be present)
ALTER TABLE event_log
ADD COLUMN IF NOT EXISTS trigger_key TEXT DEFAULT NULL;

CREATE OR REPLACE FUNCTION fire_system_event(
    p_nation_id    UUID,
    p_trigger_key  TEXT,
    p_tick         INT,
    p_placeholders JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_event_id UUID;
BEGIN
    INSERT INTO event_log (
        nation_id,
        event_name,
        trigger_key,
        category,
        effects_applied,
        fired_at_tick
    ) VALUES (
        p_nation_id,
        p_trigger_key,
        p_trigger_key,
        'system',
        p_placeholders,
        p_tick
    )
    RETURNING id INTO v_event_id;

    RETURN v_event_id;
END;
$$;
