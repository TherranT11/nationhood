-- RPC for admin panel to fetch player emails from auth.users.
-- Maps faction IDs to their owner's email (primary: factions.id = auth.users.id,
-- secondary: factions.linked_user_id = auth.users.id).

CREATE OR REPLACE FUNCTION admin_get_player_emails(p_faction_ids UUID[])
RETURNS TABLE(faction_id UUID, email TEXT, display_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    RETURN QUERY
    SELECT f.id AS faction_id,
           u.email::TEXT,
           COALESCE(u.raw_user_meta_data->>'display_name', u.raw_user_meta_data->>'username', '')::TEXT AS display_name
    FROM factions f
    JOIN auth.users u ON u.id = f.id OR u.id = f.linked_user_id
    WHERE f.id = ANY(p_faction_ids);
END;
$$;
