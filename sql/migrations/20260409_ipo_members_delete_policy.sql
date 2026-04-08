-- Fix: ipo_members had no DELETE policy for authenticated users.
-- The disbandParty() client-side cleanup silently failed because RLS
-- blocked the DELETE, leaving disbanded parties in IPOs as ghost members.

CREATE POLICY "ipo_members_delete" ON ipo_members
    FOR DELETE TO authenticated
    USING (true);

-- Also add DELETE policy for ipo_ballots (same issue — cleanup blocked)
CREATE POLICY "ipo_ballots_delete" ON ipo_ballots
    FOR DELETE TO authenticated
    USING (true);

-- And ipo_invitations
DO $$ BEGIN
    CREATE POLICY "ipo_invitations_delete" ON ipo_invitations
        FOR DELETE TO authenticated
        USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
