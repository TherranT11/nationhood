-- Allow org members to update ipo_votes (for resolving votes)
CREATE POLICY "ipo_votes_update" ON ipo_votes
    FOR UPDATE TO authenticated
    USING (
        org_id IN (
            SELECT org_id FROM ipo_members
            WHERE faction_id = auth.uid() AND is_active = true AND role = 'member'
        )
    );
