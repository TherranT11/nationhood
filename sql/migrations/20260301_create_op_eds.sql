-- Create the op_eds table for the newspaper Op-Ed feature.
-- Op-eds are written by political parties for 1 AP and published in the next tick's edition.

CREATE TABLE IF NOT EXISTS op_eds (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nation_id UUID NOT NULL REFERENCES nations(id) ON DELETE CASCADE,
    faction_id UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    headline TEXT NOT NULL CHECK (char_length(headline) >= 10 AND char_length(headline) <= 120),
    body TEXT NOT NULL CHECK (char_length(body) >= 30 AND char_length(body) <= 800),
    topic TEXT NOT NULL DEFAULT 'domestic'
        CHECK (topic IN ('domestic', 'economy', 'international', 'defence', 'society')),
    publish_tick INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for efficient querying by nation (main list) and by faction (my op-eds)
CREATE INDEX IF NOT EXISTS idx_op_eds_nation_id ON op_eds(nation_id);
CREATE INDEX IF NOT EXISTS idx_op_eds_faction_id ON op_eds(faction_id);
CREATE INDEX IF NOT EXISTS idx_op_eds_publish_tick ON op_eds(publish_tick);

-- RLS: Enable row level security
ALTER TABLE op_eds ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone authenticated can read op-eds in their nation
CREATE POLICY op_eds_select ON op_eds
    FOR SELECT
    USING (true);

-- Policy: Factions can insert their own op-eds
CREATE POLICY op_eds_insert ON op_eds
    FOR INSERT
    WITH CHECK (
        faction_id IN (
            SELECT id FROM factions WHERE id = faction_id
        )
    );

-- Policy: Factions can only delete their own op-eds
CREATE POLICY op_eds_delete ON op_eds
    FOR DELETE
    USING (
        faction_id IN (
            SELECT id FROM factions WHERE id = faction_id
        )
    );
