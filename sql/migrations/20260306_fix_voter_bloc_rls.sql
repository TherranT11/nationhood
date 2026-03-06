-- =====================================================
-- Migration: Fix missing RLS policies for voter_blocs,
-- faction_bloc_approval, and momentum_log tables.
-- Date: 2026-03-06
-- =====================================================
-- These tables are queried by client-side code (parties.html,
-- dashboard.html, economy.html, election-simulation.js, etc.)
-- but were never given SELECT policies when RLS was enabled.
--
-- Supabase enables RLS by default on new tables. Without a
-- SELECT policy, client queries return empty results (no error),
-- causing the Voter Bloc Approval grid to appear empty.
--
-- Edge functions and SQL functions (SECURITY DEFINER) bypass RLS,
-- which is why elections and tick processing were unaffected.
-- =====================================================

-- voter_blocs: enable RLS if not already, add permissive SELECT
ALTER TABLE voter_blocs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'voter_blocs' AND policyname = 'Allow select for all'
    ) THEN
        CREATE POLICY "Allow select for all" ON voter_blocs
            FOR SELECT USING (true);
    END IF;
END $$;

-- faction_bloc_approval: enable RLS if not already, add permissive SELECT
ALTER TABLE faction_bloc_approval ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'faction_bloc_approval' AND policyname = 'Allow select for all'
    ) THEN
        CREATE POLICY "Allow select for all" ON faction_bloc_approval
            FOR SELECT USING (true);
    END IF;
END $$;

-- momentum_log: enable RLS if not already, add permissive SELECT
ALTER TABLE momentum_log ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'momentum_log' AND policyname = 'Allow select for all'
    ) THEN
        CREATE POLICY "Allow select for all" ON momentum_log
            FOR SELECT USING (true);
    END IF;
END $$;

-- voter_blocs and faction_bloc_approval are only written by the
-- tick processor (service_role), so no INSERT/UPDATE/DELETE policies
-- are needed for authenticated users.
-- momentum_log is also system-written only.
