-- Restore creator override for group_chat_members INSERT policy while retaining
-- linked-faction support for self-membership inserts.
--
-- This supersedes 20260409_fix_group_chat_members_rls.sql by allowing:
--   1) inserting your own membership row (direct or linked faction), OR
--   2) inserting any member row when you are the chat creator (direct or linked).
--
-- The creator check follows the non-recursive pattern from
-- 20260329_messaging_system.sql.

DROP POLICY IF EXISTS "GC members joinable" ON group_chat_members;

CREATE POLICY "GC members joinable"
    ON group_chat_members FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM factions f
            WHERE f.id = faction_id
              AND (
                    f.id = auth.uid()
                 OR f.linked_user_id = auth.uid()
              )
        )
        OR EXISTS (
            SELECT 1
            FROM group_chats gc
            WHERE gc.id = chat_id
              AND (
                    gc.created_by = auth.uid()
                 OR EXISTS (
                        SELECT 1
                        FROM factions f_creator
                        WHERE f_creator.id = gc.created_by
                          AND f_creator.linked_user_id = auth.uid()
                 )
              )
        )
    );
