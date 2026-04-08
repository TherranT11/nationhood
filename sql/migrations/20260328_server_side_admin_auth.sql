-- Server-side admin authentication.
-- Replaces the client-side password hash with a proper role-based system.
-- Only users in user_roles with role='admin' can access admin operations.

-- 1. Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'player' CHECK (role IN ('player', 'admin', 'moderator')),
    granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    granted_by UUID,
    UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Only admins can read user_roles; no one can write directly (use RPC)
CREATE POLICY "Admins can read roles" ON user_roles
    FOR SELECT TO authenticated
    USING (
        EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
        OR user_id = auth.uid()
    );

-- No direct INSERT/UPDATE/DELETE — must use service_role or RPC
CREATE POLICY "No direct writes" ON user_roles
    FOR ALL TO authenticated
    USING (false)
    WITH CHECK (false);

-- 2. Server-side is_admin() function — called by RLS policies and RPCs
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    );
END;
$$;

-- 3. RPC to verify admin status (called by admin.html on load)
CREATE OR REPLACE FUNCTION verify_admin_access()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('authorized', false, 'reason', 'Not authenticated');
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM user_roles WHERE user_id = v_user_id AND role = 'admin'
    ) INTO v_is_admin;

    IF v_is_admin THEN
        RETURN jsonb_build_object('authorized', true, 'user_id', v_user_id);
    ELSE
        RETURN jsonb_build_object('authorized', false, 'reason', 'Not an admin');
    END IF;
END;
$$;

-- 4. Restrict shard writes to admins only
DROP POLICY IF EXISTS "Allow update for all" ON shard;
CREATE POLICY "Admins can update shard" ON shard
    FOR UPDATE TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- 5. Restrict nation writes to admins and service_role
DROP POLICY IF EXISTS "Allow update for all" ON nations;
CREATE POLICY "Admins can update nations" ON nations
    FOR UPDATE TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- Keep SELECT open for all authenticated users (game needs to read nations)
-- INSERT/DELETE on nations should only be admin
DROP POLICY IF EXISTS "Allow insert for all" ON nations;
DROP POLICY IF EXISTS "Allow delete for all" ON nations;
CREATE POLICY "Admins can insert nations" ON nations
    FOR INSERT TO authenticated
    WITH CHECK (is_admin());
CREATE POLICY "Admins can delete nations" ON nations
    FOR DELETE TO authenticated
    USING (is_admin());
