-- ════════════════════════════════════════════════════════════════════
-- FIX — corp_buildings ⇄ entrepreneur_corps broker relationship
-- ════════════════════════════════════════════════════════════════════
-- Bug: the Markets → Properties tab errors with "Could not find a
-- relationship between 'corp_buildings' and 'entrepreneur_corps' in
-- the schema cache" when embedding broker:entrepreneur_corps!broker_corp_id.
--
-- The broker_corp_id column + FK were added together in 20270184
-- (ADD COLUMN ... REFERENCES). The plain-column select of broker_corp_id
-- does NOT error, so the column exists — meaning the FK almost certainly
-- exists too and PostgREST's schema cache is simply stale. The most
-- reliable cure is a dashboard "Reload schema cache"; this migration is
-- belt-and-suspenders: it re-asserts the FK if it somehow went missing,
-- then issues the reload NOTIFY.
--
-- Idempotent: adds the constraint only if the column exists and no FK
-- from corp_buildings.broker_corp_id → entrepreneur_corps is present.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'corp_buildings'
           AND column_name = 'broker_corp_id'
    ) AND NOT EXISTS (
        SELECT 1 FROM pg_constraint
         WHERE conrelid  = 'public.corp_buildings'::regclass
           AND confrelid = 'public.entrepreneur_corps'::regclass
           AND conname   = 'corp_buildings_broker_corp_id_fkey'
    ) THEN
        ALTER TABLE public.corp_buildings
            ADD CONSTRAINT corp_buildings_broker_corp_id_fkey
            FOREIGN KEY (broker_corp_id)
            REFERENCES public.entrepreneur_corps(id) ON DELETE SET NULL;
    END IF;
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
