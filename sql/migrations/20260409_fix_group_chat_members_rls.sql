-- Fix group_chat_members INSERT RLS policy.
-- The old policy checked faction_id = auth.uid() which fails for linked factions
-- (corporations, secondary parties). New policy allows insert if the faction
-- belongs to the authenticated user (either directly or via linked_user_id).

DROP POLICY IF EXISTS "GC members joinable" ON group_chat_members;
CREATE POLICY "GC members joinable"
    ON group_chat_members FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM factions f
            WHERE f.id = faction_id
            AND (f.id = auth.uid() OR f.linked_user_id = auth.uid())
        )
    );
