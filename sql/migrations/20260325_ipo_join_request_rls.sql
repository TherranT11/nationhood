-- ============================================================
-- RLS policy updates for "Request to Join" feature
-- ============================================================

-- 1. ipo_votes INSERT: allow non-members to propose membership votes (join requests)
--    Previously required active membership, which blocks the join-request flow.
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

-- 2. ipo_votes SELECT: allow non-members to see their OWN proposed votes
--    Needed so the "Request Pending" state and duplicate guard work correctly.
DROP POLICY IF EXISTS "ipo_votes_select" ON ipo_votes;

CREATE POLICY "ipo_votes_select" ON ipo_votes
    FOR SELECT TO authenticated
    USING (
        -- Members can see all votes in their org
        org_id IN (SELECT org_id FROM ipo_members WHERE faction_id = auth.uid() AND is_active = true)
        -- Non-members can see their own proposed votes (join requests)
        OR proposed_by = auth.uid()
    );

-- 3. ipo_chat INSERT: allow system messages from non-members (join notifications)
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

-- 4. ipo_members INSERT: allow members to admit other factions via vote resolution
--    Previously only allowed faction_id = auth.uid(), which blocks frontend vote
--    resolution when admitting another party. The resolver must be a member of the org.
DROP POLICY IF EXISTS "ipo_members_insert" ON ipo_members;

CREATE POLICY "ipo_members_insert" ON ipo_members
    FOR INSERT TO authenticated
    WITH CHECK (
        -- Self-join (original policy): you can insert yourself
        faction_id = auth.uid()
        -- Member-admits-other: active member of the org can insert another faction
        -- (needed for frontend vote resolution when admitting join-request applicants)
        OR org_id IN (
            SELECT org_id FROM ipo_members
            WHERE faction_id = auth.uid() AND is_active = true AND role = 'member'
        )
    );
