-- =========================================================================
-- Permissive RLS for crisis_templates so PostgREST embeds resolve.
--
-- active_crises queries on the frontend embed crisis_templates via
-- `crisis_templates!inner(name, description)`. If RLS is enabled on
-- crisis_templates with no SELECT policy, the inner-join returns 0 rows
-- and the Administrative subtab's Nation card silently shows
-- "No active crises" even when active_crises has rows.
--
-- This migration grants read access to crisis_templates for everyone
-- (matching the pattern in fix_rls_policies_all_tables.sql for the
-- other game tables — they're public game data). Write access stays
-- locked down at the engine layer.
--
-- Idempotent: skips work if RLS isn't enabled or the policy already
-- exists.
-- =========================================================================

DO $$
DECLARE
    has_rls BOOLEAN;
    pol_exists BOOLEAN;
BEGIN
    SELECT relrowsecurity INTO has_rls
    FROM pg_class
    WHERE relname = 'crisis_templates' AND relnamespace = 'public'::regnamespace;

    IF has_rls IS NULL THEN
        RAISE NOTICE 'crisis_templates does not exist — nothing to do';
        RETURN;
    END IF;

    IF NOT has_rls THEN
        -- Table exists but RLS isn't enforced. Reads already work, so
        -- we don't need a policy. (Don't enable RLS here — that's a
        -- separate decision.)
        RAISE NOTICE 'crisis_templates has RLS disabled — no policy needed';
        RETURN;
    END IF;

    -- SELECT policy
    SELECT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'crisis_templates' AND policyname = 'Allow select for all'
    ) INTO pol_exists;
    IF NOT pol_exists THEN
        EXECUTE 'CREATE POLICY "Allow select for all" ON crisis_templates FOR SELECT USING (true)';
        RAISE NOTICE 'Created SELECT policy for crisis_templates';
    END IF;
END $$;
