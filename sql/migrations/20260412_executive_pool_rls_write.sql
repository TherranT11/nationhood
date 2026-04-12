-- Allow authenticated users to insert into executive_pool (auto-generation on first search)
-- and update status when hiring candidates
CREATE POLICY executive_pool_insert ON executive_pool
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY executive_pool_update ON executive_pool
    FOR UPDATE TO authenticated USING (true);
