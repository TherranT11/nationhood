-- RPC: fire_system_event
-- Inserts a system event into event_log with a trigger_key and placeholders.
-- Called from the tick processor, ministry actions, elections, bills, etc.
-- SECURITY DEFINER so client-side callers can write to event_log.

-- Ensure trigger_key column exists (may already be present)
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
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Guard: caller must belong to this nation (skip check for service_role / tick processor)
    IF auth.role() = 'authenticated' THEN
        IF NOT EXISTS (
            SELECT 1 FROM factions
            WHERE id = auth.uid() AND nation_id = p_nation_id
        ) THEN
            RAISE EXCEPTION 'Not authorized to fire events for this nation';
        END IF;
    END IF;

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
    );
END;
$$;
