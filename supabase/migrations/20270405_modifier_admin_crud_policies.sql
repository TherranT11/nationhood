-- ════════════════════════════════════════════════════════════════════
-- Modifier admin — CRUD policies on every modifier table
-- ════════════════════════════════════════════════════════════════════
-- 20270384_modifier_tables.sql created modifier_templates +
-- modifier_triggers + modifier_end_triggers with a comment stating
-- "RLS off here is intentional" but did NOT actually disable RLS.
-- Supabase enables RLS by default on new tables, so the three tables
-- shipped with RLS enabled and zero policies — every client INSERT /
-- UPDATE / DELETE silently or loudly fails. modifieradmin.html's
-- saveModifier() surfaces the failure as:
--
--   new row violates row-level security policy for table "modifier_templates"
--
-- which is what the screenshot reported.
--
-- Mirrors 20261130_crisis_admin_delete_policies.sql exactly — enable
-- RLS + four permissive CRUD policies. Modifier definitions are
-- global game content (not per-user data), so wide-open policies are
-- correct; tightening to admin-only happens through the auth layer
-- in front of the page, not at the row level.
--
-- Idempotent via DROP IF EXISTS before each CREATE — safe to re-run
-- if Supabase Dashboard nuked policies later.
-- ════════════════════════════════════════════════════════════════════

DO $$
DECLARE
    tbl TEXT;
    tables TEXT[] := ARRAY[
        'modifier_templates',
        'modifier_triggers',
        'modifier_end_triggers'
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

NOTIFY pgrst, 'reload schema';
