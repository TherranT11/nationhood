-- =========================================================================
-- Permissive RLS for active_laws, nation_policies, and the rest of the
-- tables policyadmin.html writes to during a policy save.
--
-- Symptom: creating a new policy in policyadmin returns
-- "new row violates row-level security policy for table 'active_laws'".
-- Same shape as the bills RLS bug — the table has RLS enabled but no
-- INSERT policy, so anon-key writes are denied.
--
-- Tables touched by savePolicy in policyadmin.html:
--   - policies              (already permissive)
--   - policy_options        (already permissive)
--   - nation_policies       (covered here)
--   - active_laws           (covered here)
--
-- This migration adds "Allow {select,insert,update,delete} for all"
-- policies for both tables. Idempotent: re-runs no-op when policies
-- are already in place. Mirrors fix_rls_policies_all_tables.sql in
-- shape so the codebase has one canonical permissive-RLS pattern.
-- =========================================================================

DO $$
DECLARE
    tbl TEXT;
    has_rls BOOLEAN;
    pol_exists BOOLEAN;
    actions TEXT[] := ARRAY['select', 'insert', 'update', 'delete'];
    action TEXT;
    policy_name TEXT;
    sql_clause TEXT;
BEGIN
    FOREACH tbl IN ARRAY ARRAY['active_laws', 'nation_policies'] LOOP
        SELECT relrowsecurity INTO has_rls
        FROM pg_class
        WHERE relname = tbl AND relnamespace = 'public'::regnamespace;

        IF has_rls IS NULL THEN
            RAISE NOTICE 'Table % does not exist — skipping', tbl;
            CONTINUE;
        END IF;

        IF NOT has_rls THEN
            RAISE NOTICE 'Table % has RLS disabled — no policies needed', tbl;
            CONTINUE;
        END IF;

        FOREACH action IN ARRAY actions LOOP
            policy_name := 'Allow ' || action || ' for all';
            SELECT EXISTS (
                SELECT 1 FROM pg_policies
                WHERE tablename = tbl AND policyname = policy_name
            ) INTO pol_exists;

            IF NOT pol_exists THEN
                IF action = 'select' THEN
                    sql_clause := format('CREATE POLICY %I ON %I FOR SELECT USING (true)', policy_name, tbl);
                ELSIF action = 'insert' THEN
                    sql_clause := format('CREATE POLICY %I ON %I FOR INSERT WITH CHECK (true)', policy_name, tbl);
                ELSIF action = 'update' THEN
                    sql_clause := format('CREATE POLICY %I ON %I FOR UPDATE USING (true) WITH CHECK (true)', policy_name, tbl);
                ELSIF action = 'delete' THEN
                    sql_clause := format('CREATE POLICY %I ON %I FOR DELETE USING (true)', policy_name, tbl);
                END IF;
                EXECUTE sql_clause;
                RAISE NOTICE 'Created % policy on %', upper(action), tbl;
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- ── Verify: list every policy on the two tables ──────────────────────
SELECT
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE tablename IN ('active_laws', 'nation_policies')
ORDER BY tablename, cmd;
