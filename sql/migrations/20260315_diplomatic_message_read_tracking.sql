-- Track which factions have read each diplomatic message.
-- Used to show unread-message badges on the Diplomacy nav tab
-- and [Incoming Message] indicators on nation cards.

ALTER TABLE diplomatic_messages
    ADD COLUMN IF NOT EXISTS read_by_factions JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Index for efficient unread-message queries:
-- "give me messages TO my nation that my faction hasn't read yet"
CREATE INDEX IF NOT EXISTS idx_diplomatic_messages_to_nation
    ON diplomatic_messages(to_nation_id);
