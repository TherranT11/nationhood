-- ════════════════════════════════════════════════════════════════════
-- active_modifiers — CRUD policies (companion to 20270405)
-- ════════════════════════════════════════════════════════════════════
-- 20270385_active_modifiers.sql created the table without explicit
-- RLS handling. Supabase enables RLS by default on new tables, so
-- the table shipped with RLS on and zero policies — meaning:
--
--   - the politician-modifiers.html page reads zero rows even after
--     processNationalModifiers has correctly inserted them (because
--     the authenticated client can't SELECT)
--   - if the tick handler ever runs as anything other than the
--     service_role (e.g. invoked via a developer console for
--     testing), its inserts get blocked too
--
-- Mirrors 20270405's modifier-template fix and 20261130's crisis-table
-- fix: enable RLS + four permissive CRUD policies. Modifier-state
-- rows are global game data, not per-user; admin-only enforcement
-- belongs in the auth layer above the page. Idempotent via DROP IF
-- EXISTS, safe to re-run if the Dashboard ever resets policies.
-- ════════════════════════════════════════════════════════════════════

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class
         WHERE relname = 'active_modifiers' AND relnamespace = 'public'::regnamespace
    ) THEN
        RAISE NOTICE 'Table active_modifiers does not exist — skipping';
        RETURN;
    END IF;

    EXECUTE 'ALTER TABLE public.active_modifiers ENABLE ROW LEVEL SECURITY';

    DROP POLICY IF EXISTS "Allow select for all" ON public.active_modifiers;
    CREATE POLICY "Allow select for all" ON public.active_modifiers FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Allow insert for all" ON public.active_modifiers;
    CREATE POLICY "Allow insert for all" ON public.active_modifiers FOR INSERT WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow update for all" ON public.active_modifiers;
    CREATE POLICY "Allow update for all" ON public.active_modifiers FOR UPDATE USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow delete for all" ON public.active_modifiers;
    CREATE POLICY "Allow delete for all" ON public.active_modifiers FOR DELETE USING (true);

    RAISE NOTICE 'Refreshed all CRUD policies for active_modifiers';
END $$;

NOTIFY pgrst, 'reload schema';
