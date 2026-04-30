-- =========================================================================
-- Restore permissive RLS policies for the presidents table.
--
-- ROOT CAUSE
-- ----------
-- 20260302_fix_rls_ownership.sql:186-188 dropped the
--   "Allow insert for all", "Allow update for all", "Allow delete for all"
-- policies for `presidents` (writes correctly moved to the tick processor
-- with service-role privileges). It did NOT explicitly define a SELECT
-- policy. The companion script sql/fix_rls_policies_all_tables.sql adds
-- "Allow select for all" but lives outside sql/migrations/ and was never
-- run as part of the migration sequence on this DB.
--
-- SYMPTOM
-- -------
-- bill.html line 364 SELECTs the active president from the browser to
-- decide whether to render Sign Into Law / Veto buttons. With RLS enabled
-- and no SELECT policy, PostgREST returns an empty result silently — no
-- error, just `data: null`. presidentFactionId stays null, isPresidentParty
-- evaluates to null, gate fails, buttons never render. Confirmed via
-- runtime debug: activePresident: null on a row that the SQL editor
-- (service role) can read fine.
--
-- FIX
-- ---
-- Add the four "Allow {select,insert,update,delete} for all" policies
-- idempotently. SELECT is the strict requirement for the user-facing bug;
-- the others are added in the same shape so the table matches the
-- canonical permissive-RLS pattern used by every other table in
-- fix_rls_policies_all_tables.sql.
--
-- Mirrors 20260429_active_laws_nation_policies_rls.sql shape for
-- consistency. Re-runs no-op when policies already exist.
-- =========================================================================

DO $$
DECLARE
    has_rls BOOLEAN;
    pol_exists BOOLEAN;
    actions TEXT[] := ARRAY['select', 'insert', 'update', 'delete'];
    action TEXT;
    policy_name TEXT;
    sql_clause TEXT;
BEGIN
    SELECT relrowsecurity INTO has_rls
    FROM pg_class
    WHERE relname = 'presidents' AND relnamespace = 'public'::regnamespace;

    IF has_rls IS NULL THEN
        RAISE NOTICE 'Table presidents does not exist — skipping';
        RETURN;
    END IF;

    IF NOT has_rls THEN
        RAISE NOTICE 'Table presidents has RLS disabled — no policies needed';
        RETURN;
    END IF;

    FOREACH action IN ARRAY actions LOOP
        policy_name := 'Allow ' || action || ' for all';
        SELECT EXISTS (
            SELECT 1 FROM pg_policies
            WHERE tablename = 'presidents' AND policyname = policy_name
        ) INTO pol_exists;

        IF NOT pol_exists THEN
            IF action = 'select' THEN
                sql_clause := format('CREATE POLICY %I ON presidents FOR SELECT USING (true)', policy_name);
            ELSIF action = 'insert' THEN
                sql_clause := format('CREATE POLICY %I ON presidents FOR INSERT WITH CHECK (true)', policy_name);
            ELSIF action = 'update' THEN
                sql_clause := format('CREATE POLICY %I ON presidents FOR UPDATE USING (true) WITH CHECK (true)', policy_name);
            ELSIF action = 'delete' THEN
                sql_clause := format('CREATE POLICY %I ON presidents FOR DELETE USING (true)', policy_name);
            END IF;
            EXECUTE sql_clause;
            RAISE NOTICE 'Created % policy on presidents', upper(action);
        END IF;
    END LOOP;
END $$;

-- Verify: list every policy on presidents. Expect four "Allow X for all"
-- entries after this migration runs.
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'presidents'
ORDER BY cmd;
