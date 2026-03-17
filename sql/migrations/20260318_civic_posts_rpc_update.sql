-- Replace the permissive UPDATE policy with a restrictive one + an RPC function
-- that only allows updating liked_by/shared_by/likes/shares columns.

-- 1. Drop the overly permissive UPDATE policy
DROP POLICY IF EXISTS civic_posts_update ON civic_posts;

-- 2. Create a restrictive UPDATE policy: only allow updates via the RPC function
--    (service_role bypasses RLS, so no direct client UPDATE is possible)
CREATE POLICY civic_posts_update ON civic_posts FOR UPDATE
    USING (false);

-- 3. Create an RPC function that only updates like/share fields
CREATE OR REPLACE FUNCTION civic_toggle_reaction(
    p_post_id uuid,
    p_liked_by uuid[],
    p_shared_by uuid[],
    p_likes int,
    p_shares int
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE civic_posts
    SET liked_by  = p_liked_by,
        shared_by = p_shared_by,
        likes     = GREATEST(0, p_likes),
        shares    = GREATEST(0, p_shares)
    WHERE id = p_post_id;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION civic_toggle_reaction(uuid, uuid[], uuid[], int, int) TO authenticated;
