-- 20270114_bill_amendment_requests_rls.sql
--
-- Bug fix: "new row violates row-level security policy for table
-- bill_amendment_requests" when requesting an article be struck from
-- a bill in committee (bill.html → INSERT into
-- bill_amendment_requests).
--
-- Identical gap to 20270113 (bill_comments): the table has RLS
-- enabled on the live database but was never added to
-- sql/fix_rls_policies_all_tables.sql, so it has no passing policy
-- and every client INSERT/UPDATE/DELETE is rejected (the strike /
-- amendment / option-swap request flows all fail). Every other
-- gameplay table in this alpha uses the same permissive
-- "Allow <op> for all" policy set (that file is the single source of
-- truth for how this game does RLS); this brings the table into line
-- with that one pattern rather than inventing a bespoke model for it.
--
-- ENABLE ROW LEVEL SECURITY is idempotent; each policy is created
-- only if absent (re-running is safe).

BEGIN;

ALTER TABLE public.bill_amendment_requests ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
    wanted CONSTANT TEXT[][] := ARRAY[
        ARRAY['Allow select for all', 'FOR SELECT USING (true)'],
        ARRAY['Allow insert for all', 'FOR INSERT WITH CHECK (true)'],
        ARRAY['Allow update for all', 'FOR UPDATE USING (true) WITH CHECK (true)'],
        ARRAY['Allow delete for all', 'FOR DELETE USING (true)']
    ];
    i INT;
BEGIN
    FOR i IN 1 .. array_length(wanted, 1) LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename  = 'bill_amendment_requests'
              AND policyname = wanted[i][1]
        ) THEN
            EXECUTE format(
                'CREATE POLICY %I ON public.bill_amendment_requests %s',
                wanted[i][1], wanted[i][2]
            );
            RAISE NOTICE 'Created policy % on bill_amendment_requests', wanted[i][1];
        END IF;
    END LOOP;
END $$;

COMMIT;

NOTIFY pgrst, 'reload schema';
