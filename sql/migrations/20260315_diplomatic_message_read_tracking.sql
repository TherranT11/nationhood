-- Track which factions have read each diplomatic message.
-- Used to show unread-message badges on the Diplomacy nav tab
-- and [Incoming Message] indicators on nation cards.

ALTER TABLE diplomatic_messages
    ADD COLUMN IF NOT EXISTS read_by_factions JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Mark all pre-existing messages as read so the feature doesn't
-- generate a storm of false-positive badges on first deployment.
UPDATE diplomatic_messages dm
SET read_by_factions = (
    SELECT COALESCE(jsonb_agg(f.id::text), '[]'::jsonb)
    FROM factions f
    WHERE f.nation_id = dm.to_nation_id
)
WHERE read_by_factions = '[]'::jsonb;

-- Index for efficient unread-message queries:
-- "give me messages TO my nation that my faction hasn't read yet"
CREATE INDEX IF NOT EXISTS idx_diplomatic_messages_to_nation
    ON diplomatic_messages(to_nation_id);

-- Atomic append: adds a faction ID to read_by_factions if not already present.
-- Prevents lost-update race when two factions mark the same message read concurrently.
-- NOTE: No caller validation — relies on app-level auth (same as other RPCs).
-- When RLS is tightened project-wide, this should restrict to the caller's own faction.
CREATE OR REPLACE FUNCTION append_read_faction(p_message_id UUID, p_faction_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE diplomatic_messages
    SET read_by_factions = read_by_factions || to_jsonb(p_faction_id::text)
    WHERE id = p_message_id
      AND NOT (read_by_factions @> to_jsonb(p_faction_id::text));
END;
$$;
