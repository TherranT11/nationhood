-- Add trigger_key column to event_log if missing, then create the fire_system_event RPC.
-- This RPC is called from ~35+ locations across the codebase but was never created.

ALTER TABLE event_log
ADD COLUMN IF NOT EXISTS trigger_key TEXT DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_event_log_trigger_key
ON event_log (trigger_key)
WHERE trigger_key IS NOT NULL;

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
