-- =========================================================================
-- Permissive RLS for bills / bill_articles / bill_support so the bill-draft
-- modal can submit a new bill.
--
-- Symptom: submitting a multi-option policy change in laws.html returns
-- 403 Forbidden with code 42501 ("new row violates row-level security
-- policy for table 'bills'"). RLS is enabled on the table but no
-- INSERT policy permits the anon-key write.
--
-- This migration adds the missing "Allow insert for all" + "Allow update
-- for all" policies for the three bill-related tables. SELECT and DELETE
-- are also covered (idempotent — already-existing policies are skipped).
--
-- Idempotent: re-runs no-op when policies are already in place.
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
    FOREACH tbl IN ARRAY ARRAY['bills', 'bill_articles', 'bill_support'] LOOP
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

-- ── Verify: list every policy on the three bill tables ────────────────
SELECT
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE tablename IN ('bills', 'bill_articles', 'bill_support')
ORDER BY tablename, cmd;
