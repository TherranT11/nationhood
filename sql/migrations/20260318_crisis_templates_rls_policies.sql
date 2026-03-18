-- Fix: crisis_templates, crisis_triggers, crisis_effects, and crisis_end_triggers
-- may have RLS enabled (via Supabase Dashboard) but no policies, causing silent
-- update failures in crisisadmin.html. Ensure permissive policies exist.

DO $$
DECLARE
    tbl TEXT;
    tables TEXT[] := ARRAY[
        'crisis_templates',
        'crisis_triggers',
        'crisis_effects',
        'crisis_end_triggers'
    ];
    has_rls BOOLEAN;
    pol_exists BOOLEAN;
BEGIN
    FOREACH tbl IN ARRAY tables
    LOOP
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

        -- SELECT
        SELECT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = tbl AND policyname = 'Allow select for all'
        ) INTO pol_exists;
        IF NOT pol_exists THEN
            EXECUTE format('CREATE POLICY "Allow select for all" ON %I FOR SELECT USING (true)', tbl);
            RAISE NOTICE 'Created SELECT policy for %', tbl;
        END IF;

        -- INSERT
        SELECT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = tbl AND policyname = 'Allow insert for all'
        ) INTO pol_exists;
        IF NOT pol_exists THEN
            EXECUTE format('CREATE POLICY "Allow insert for all" ON %I FOR INSERT WITH CHECK (true)', tbl);
            RAISE NOTICE 'Created INSERT policy for %', tbl;
        END IF;

        -- UPDATE
        SELECT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = tbl AND policyname = 'Allow update for all'
        ) INTO pol_exists;
        IF NOT pol_exists THEN
            EXECUTE format('CREATE POLICY "Allow update for all" ON %I FOR UPDATE USING (true) WITH CHECK (true)', tbl);
            RAISE NOTICE 'Created UPDATE policy for %', tbl;
        END IF;

        -- DELETE
        SELECT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = tbl AND policyname = 'Allow delete for all'
        ) INTO pol_exists;
        IF NOT pol_exists THEN
            EXECUTE format('CREATE POLICY "Allow delete for all" ON %I FOR DELETE USING (true)', tbl);
            RAISE NOTICE 'Created DELETE policy for %', tbl;
        END IF;

        RAISE NOTICE 'Done: % — all policies in place', tbl;
    END LOOP;
END $$;
