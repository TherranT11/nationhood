-- 20260926_recreate_is_active_sports_minister.sql
--
-- Re-create the _is_active_sports_minister helper.
--
-- This function was added by 20260914 but is missing on at least
-- one live DB ("function _is_active_sports_minister(uuid, uuid)
-- does not exist" surfaced when canceling a stadium bid). Cancel,
-- award, and reject RPCs for stadium contracts all gate on it,
-- so without it the Sports Ministry modal is unusable.

BEGIN;

CREATE OR REPLACE FUNCTION _is_active_sports_minister(p_nation_id UUID, p_user UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT EXISTS (
        SELECT 1
        FROM ministries m
        JOIN factions  f ON f.id = m.party_id
        WHERE m.nation_id    = p_nation_id
          AND m.ministry_key = 'sports'
          AND m.is_active    = true
          AND (f.id = p_user OR f.linked_user_id = p_user)
    );
$$;

GRANT EXECUTE ON FUNCTION _is_active_sports_minister(UUID, UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
