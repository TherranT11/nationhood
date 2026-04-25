-- Create agitator_pool table for storing generated candidates
CREATE TABLE IF NOT EXISTS agitator_pool (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    nation_id uuid NOT NULL REFERENCES nations(id),
    first_name text NOT NULL,
    last_name text NOT NULL,
    age integer NOT NULL,
    skill integer NOT NULL,
    background text,
    hire_cost bigint NOT NULL DEFAULT 0,
    status text NOT NULL DEFAULT 'available',
    hired_by_faction_id uuid REFERENCES factions(id),
    created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agitator_pool_nation ON agitator_pool(nation_id);
CREATE INDEX IF NOT EXISTS idx_agitator_pool_status ON agitator_pool(status);

-- Create faction_agitators table for hired agitators
CREATE TABLE IF NOT EXISTS faction_agitators (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    faction_id uuid NOT NULL REFERENCES factions(id),
    first_name text NOT NULL,
    last_name text NOT NULL,
    age integer NOT NULL,
    skill integer NOT NULL,
    background text,
    status text NOT NULL DEFAULT 'active',
    hired_at_tick integer,
    created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_faction_agitators_faction ON faction_agitators(faction_id);

-- RLS policies
ALTER TABLE agitator_pool ENABLE ROW LEVEL SECURITY;
ALTER TABLE faction_agitators ENABLE ROW LEVEL SECURITY;

-- agitator_pool: players can read candidates in their nation, insert (generate), update (hire)
CREATE POLICY "Users can view agitator pool in their nation" ON agitator_pool
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert agitator pool" ON agitator_pool
    FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update agitator pool" ON agitator_pool
    FOR UPDATE TO authenticated USING (true);

-- faction_agitators: players can read/write their own faction's agitators
CREATE POLICY "Users can view faction agitators" ON faction_agitators
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert faction agitators" ON faction_agitators
    FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update faction agitators" ON faction_agitators
    FOR UPDATE TO authenticated USING (true);
