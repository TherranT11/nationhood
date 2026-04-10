-- Admin inspector RLS bypass.
-- Several tables have SELECT policies that scope reads to the user's own nation
-- via `nation_id IN (SELECT nation_id FROM factions WHERE id = auth.uid())`.
-- This blocks the admin inspector from viewing other nations' data.
-- Fix: replace those policies with versions that allow admins to read all rows.

-- elections: admins can read all, players scoped to own nation
DROP POLICY IF EXISTS "Users can view elections in their nation" ON elections;
CREATE POLICY "Users can view elections in their nation" ON elections
    FOR SELECT TO authenticated
    USING (
        is_admin()
        OR nation_id IN (
            SELECT nation_id FROM factions
            WHERE id = auth.uid() OR linked_user_id = auth.uid()
        )
    );

-- coalition_proposals: admins can read all, players scoped to own nation
DROP POLICY IF EXISTS "Users can view coalition proposals in their nation" ON coalition_proposals;
CREATE POLICY "Users can view coalition proposals in their nation" ON coalition_proposals
    FOR SELECT TO authenticated
    USING (
        is_admin()
        OR nation_id IN (
            SELECT nation_id FROM factions
            WHERE id = auth.uid() OR linked_user_id = auth.uid()
        )
    );

-- npc_party_actions: admins can read all, players scoped to own nation
DROP POLICY IF EXISTS "Users can view NPC actions in their nation" ON npc_party_actions;
CREATE POLICY "Users can view NPC actions in their nation" ON npc_party_actions
    FOR SELECT TO authenticated
    USING (
        is_admin()
        OR nation_id IN (
            SELECT nation_id FROM factions
            WHERE id = auth.uid() OR linked_user_id = auth.uid()
        )
    );
