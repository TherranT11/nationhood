-- =========================================================================
-- Allow admin-tool writes to the policies table.
--
-- policyadmin.html gates the UI behind a password hash but doesn't actually
-- authenticate against Supabase auth — it uses the anon key. The policies
-- table currently has RLS enabled with only restrictive policies, so the
-- anon-key insert produced "42501: new row violates row-level security".
--
-- This patch follows the same "Allow X for all" naming convention as
-- fix_rls_policies_all_tables.sql so it slots into the existing scheme. It
-- creates the four CRUD policies on `policies` only if they don't already
-- exist, so it's safe to re-run.
-- =========================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'policies'
          AND policyname = 'Allow select for all'
    ) THEN
        CREATE POLICY "Allow select for all" ON policies FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'policies'
          AND policyname = 'Allow insert for all'
    ) THEN
        CREATE POLICY "Allow insert for all" ON policies FOR INSERT WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'policies'
          AND policyname = 'Allow update for all'
    ) THEN
        CREATE POLICY "Allow update for all" ON policies FOR UPDATE USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'policies'
          AND policyname = 'Allow delete for all'
    ) THEN
        CREATE POLICY "Allow delete for all" ON policies FOR DELETE USING (true);
    END IF;
END $$;
