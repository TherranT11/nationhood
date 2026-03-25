-- Allow non-members to create membership votes (join requests).
-- The existing ipo_votes_insert policy requires the proposer to be an active member,
-- which blocks the "Request to Join" flow where the requester is NOT yet a member.

-- Drop and recreate the insert policy to allow membership vote proposals from non-members
DROP POLICY IF EXISTS "ipo_votes_insert" ON ipo_votes;

CREATE POLICY "ipo_votes_insert" ON ipo_votes
    FOR INSERT TO authenticated
    WITH CHECK (
        proposed_by = auth.uid()
        AND (
            -- Existing members can propose any vote type
            org_id IN (
                SELECT org_id FROM ipo_members
                WHERE faction_id = auth.uid() AND is_active = true AND role = 'member'
            )
            -- Non-members can only propose membership votes (join requests)
            OR vote_type = 'membership'
        )
    );

-- Allow system messages (is_system = true, faction_id = null) to be inserted by anyone.
-- This is needed for join-request notifications posted to org chat by non-members.
DROP POLICY IF EXISTS "ipo_chat_insert" ON ipo_chat;

CREATE POLICY "ipo_chat_insert" ON ipo_chat
    FOR INSERT TO authenticated
    WITH CHECK (
        (
            -- Regular member messages: must be active member
            faction_id = auth.uid()
            AND org_id IN (
                SELECT org_id FROM ipo_members
                WHERE faction_id = auth.uid() AND is_active = true AND role = 'member'
            )
        )
        OR (
            -- System messages from join requests: allow non-members
            is_system = true AND faction_id IS NULL
        )
    );
