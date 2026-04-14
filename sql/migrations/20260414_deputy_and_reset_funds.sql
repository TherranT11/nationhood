-- Create faction_deputies table
CREATE TABLE IF NOT EXISTS faction_deputies (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    faction_id uuid NOT NULL REFERENCES factions(id),
    first_name text NOT NULL,
    last_name text NOT NULL,
    age integer NOT NULL,
    skill integer NOT NULL,
    status text NOT NULL DEFAULT 'active',
    hired_at_tick integer,
    created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_faction_deputies_faction ON faction_deputies(faction_id);

ALTER TABLE faction_deputies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view faction deputies" ON faction_deputies
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert faction deputies" ON faction_deputies
    FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update faction deputies" ON faction_deputies
    FOR UPDATE TO authenticated USING (true);

-- Set all party funds to 0 (fresh start for fund-based economy)
UPDATE factions SET party_funds = 0 WHERE faction_type = 'party';
