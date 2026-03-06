-- Add permissive RLS policies for all tables used by the game engine.
-- Only targets tables where RLS is enabled but policies are missing.
-- Safe to re-run (uses IF NOT EXISTS via DO blocks).
-- Run this in Supabase SQL editor.

-- Helper: creates SELECT/INSERT/UPDATE/DELETE policies for a table
-- only if RLS is enabled and the specific policy doesn't already exist.
DO $$
DECLARE
    tbl TEXT;
    tables TEXT[] := ARRAY[
        'shard',
        'factions',
        'event_log',
        'voter_blocs',
        'faction_bloc_approval',
        'momentum_log',
        'ideology_history',
        'bills',
        'ambassadors',
        'ministries',
        'active_laws',
        'nations',
        'elections',
        'campaign_actions',
        'pm_candidates',
        'presidents',
        'faction_ideology',
        'administrations',
        'government_formations',
        'active_coalitions',
        'head_of_government',
        'nations_history',
        'active_crises',
        'ministry_action_log',
        'ministry_requests'
    ];
    has_rls BOOLEAN;
    pol_exists BOOLEAN;
BEGIN
    FOREACH tbl IN ARRAY tables
    LOOP
        -- Check if the table exists and has RLS enabled
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

        -- SELECT policy
        SELECT EXISTS (
            SELECT 1 FROM pg_policies
            WHERE tablename = tbl AND policyname = 'Allow select for all'
        ) INTO pol_exists;
        IF NOT pol_exists THEN
            EXECUTE format('CREATE POLICY "Allow select for all" ON %I FOR SELECT USING (true)', tbl);
            RAISE NOTICE 'Created SELECT policy for %', tbl;
        END IF;

        -- INSERT policy
        SELECT EXISTS (
            SELECT 1 FROM pg_policies
            WHERE tablename = tbl AND policyname = 'Allow insert for all'
        ) INTO pol_exists;
        IF NOT pol_exists THEN
            EXECUTE format('CREATE POLICY "Allow insert for all" ON %I FOR INSERT WITH CHECK (true)', tbl);
            RAISE NOTICE 'Created INSERT policy for %', tbl;
        END IF;

        -- UPDATE policy
        SELECT EXISTS (
            SELECT 1 FROM pg_policies
            WHERE tablename = tbl AND policyname = 'Allow update for all'
        ) INTO pol_exists;
        IF NOT pol_exists THEN
            EXECUTE format('CREATE POLICY "Allow update for all" ON %I FOR UPDATE USING (true) WITH CHECK (true)', tbl);
            RAISE NOTICE 'Created UPDATE policy for %', tbl;
        END IF;

        -- DELETE policy
        SELECT EXISTS (
            SELECT 1 FROM pg_policies
            WHERE tablename = tbl AND policyname = 'Allow delete for all'
        ) INTO pol_exists;
        IF NOT pol_exists THEN
            EXECUTE format('CREATE POLICY "Allow delete for all" ON %I FOR DELETE USING (true)', tbl);
            RAISE NOTICE 'Created DELETE policy for %', tbl;
        END IF;

        RAISE NOTICE 'Done: % — all policies in place', tbl;
    END LOOP;
END $$;
