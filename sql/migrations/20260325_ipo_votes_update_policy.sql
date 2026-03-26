-- Allow active org members to update votes (for client-side resolution)
CREATE POLICY "ipo_votes_update" ON ipo_votes
    FOR UPDATE TO authenticated
    USING (
        org_id IN (
            SELECT org_id FROM ipo_members
            WHERE faction_id = auth.uid() AND is_active = true AND role = 'member'
        )
    );
