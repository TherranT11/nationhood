-- ════════════════════════════════════════════════════════════════
-- Crisis admin — ensure DELETE policies exist on every crisis table
--
-- 20260318_crisis_templates_rls_policies.sql attempted this but only
-- when RLS was already enabled at run time. If RLS was enabled in
-- the Supabase Dashboard after that migration ran, or a later
-- migration dropped the policy, deleteCrisis() in crisisadmin.html
-- silently no-ops: PostgREST returns success with 0 rows because
-- RLS hides the target row from the DELETE filter, the toast says
-- "Crisis deleted" and the row stays put.
--
-- This migration unconditionally re-creates the four CRUD policies
-- on each crisis table, gated on the table actually existing.
-- Idempotent — DROP IF EXISTS before each CREATE.
-- ════════════════════════════════════════════════════════════════

DO $$
DECLARE
    tbl TEXT;
    tables TEXT[] := ARRAY[
        'crisis_templates',
        'crisis_triggers',
        'crisis_effects',
        'crisis_end_triggers'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_class
             WHERE relname = tbl AND relnamespace = 'public'::regnamespace
        ) THEN
            RAISE NOTICE 'Table % does not exist — skipping', tbl;
            CONTINUE;
        END IF;

        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);

        EXECUTE format('DROP POLICY IF EXISTS "Allow select for all" ON public.%I', tbl);
        EXECUTE format('CREATE POLICY "Allow select for all" ON public.%I FOR SELECT USING (true)', tbl);

        EXECUTE format('DROP POLICY IF EXISTS "Allow insert for all" ON public.%I', tbl);
        EXECUTE format('CREATE POLICY "Allow insert for all" ON public.%I FOR INSERT WITH CHECK (true)', tbl);

        EXECUTE format('DROP POLICY IF EXISTS "Allow update for all" ON public.%I', tbl);
        EXECUTE format('CREATE POLICY "Allow update for all" ON public.%I FOR UPDATE USING (true) WITH CHECK (true)', tbl);

        EXECUTE format('DROP POLICY IF EXISTS "Allow delete for all" ON public.%I', tbl);
        EXECUTE format('CREATE POLICY "Allow delete for all" ON public.%I FOR DELETE USING (true)', tbl);

        RAISE NOTICE 'Refreshed all CRUD policies for %', tbl;
    END LOOP;
END $$;

-- active_crises had its mutation policies intentionally dropped in
-- 20260302_fix_rls_ownership.sql (tick processor uses service_role
-- so it bypasses RLS, and we didn't want clients writing here).
-- That means deleteCrisis()'s `.delete().eq('crisis_id', ...)` no-
-- ops on active_crises rows the user can see. Add a permissive
-- DELETE policy so crisis admin can clean orphan rows alongside
-- the template. Read access stays as-is (already permissive
-- elsewhere).
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_class
         WHERE relname = 'active_crises' AND relnamespace = 'public'::regnamespace
    ) THEN
        DROP POLICY IF EXISTS "Allow delete for crisis admin" ON public.active_crises;
        CREATE POLICY "Allow delete for crisis admin" ON public.active_crises FOR DELETE USING (true);
        RAISE NOTICE 'Created DELETE policy on active_crises';
    END IF;
END $$;

NOTIFY pgrst, 'reload schema';
