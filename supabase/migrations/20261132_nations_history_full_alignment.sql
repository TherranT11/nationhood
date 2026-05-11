-- ════════════════════════════════════════════════════════════════
-- Align nations_history with the live NATION_STAT_COLUMNS set
--
-- snapshotNationHistory (advance-tick/index.ts:22219) upserts every
-- key in HISTORY_SNAPSHOT_COLUMNS — NATION_STAT_COLUMNS plus
-- gov_approval and population — into nations_history each tick.
-- Whenever a new stat is added to nations and the corresponding
-- nations_history column isn't created in lockstep, the upsert
-- fails for ALL stats on that tick with:
--
--   Could not find the '<column>' column of 'nations_history' in
--   the schema cache
--
-- We've already chased this column-by-column (20261115 gdp,
-- 20261116 state_apparatus, etc.). 'crime' is the latest casualty.
-- This migration does a single defensive pass for every column the
-- snapshot writes, so future stat additions only need to update
-- the JS column list — the DB side already has room.
--
-- Strategy: (1) handle the historical renames that touched nations
-- but not nations_history (authority → public_approval, goods →
-- service_sector, crime_rate → crime). (2) ADD COLUMN IF NOT EXISTS
-- for every snapshot key. NUMERIC type matches the precedent set by
-- 20261115_nations_history_gdp_column.sql. Idempotent.
-- ════════════════════════════════════════════════════════════════

BEGIN;

-- ── Phase 1: handle drifted renames (idempotent guards) ───────────
DO $$
BEGIN
    -- crime_rate → crime (from 20260430_alpha_stats_phase8_5_1)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'nations_history'
           AND column_name = 'crime_rate'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'nations_history'
           AND column_name = 'crime'
    ) THEN
        ALTER TABLE public.nations_history RENAME COLUMN crime_rate TO crime;
        RAISE NOTICE 'Renamed nations_history.crime_rate → crime';
    END IF;

    -- authority → public_approval
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'nations_history'
           AND column_name = 'authority'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'nations_history'
           AND column_name = 'public_approval'
    ) THEN
        ALTER TABLE public.nations_history RENAME COLUMN authority TO public_approval;
        RAISE NOTICE 'Renamed nations_history.authority → public_approval';
    END IF;

    -- goods → service_sector
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'nations_history'
           AND column_name = 'goods'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'nations_history'
           AND column_name = 'service_sector'
    ) THEN
        ALTER TABLE public.nations_history RENAME COLUMN goods TO service_sector;
        RAISE NOTICE 'Renamed nations_history.goods → service_sector';
    END IF;
END $$;

-- ── Phase 2: ensure every HISTORY_SNAPSHOT_COLUMN exists ──────────
ALTER TABLE public.nations_history
    ADD COLUMN IF NOT EXISTS gdp                NUMERIC,
    ADD COLUMN IF NOT EXISTS gdp_growth         NUMERIC,
    ADD COLUMN IF NOT EXISTS debt               NUMERIC,
    ADD COLUMN IF NOT EXISTS immigration        NUMERIC,
    ADD COLUMN IF NOT EXISTS standard_of_living NUMERIC,
    ADD COLUMN IF NOT EXISTS cost_of_living     NUMERIC,
    ADD COLUMN IF NOT EXISTS budget             NUMERIC,
    ADD COLUMN IF NOT EXISTS state_apparatus    NUMERIC,
    ADD COLUMN IF NOT EXISTS unrest             NUMERIC,
    ADD COLUMN IF NOT EXISTS public_approval    NUMERIC,
    ADD COLUMN IF NOT EXISTS crown_authority    NUMERIC,
    ADD COLUMN IF NOT EXISTS energy             NUMERIC,
    ADD COLUMN IF NOT EXISTS health             NUMERIC,
    ADD COLUMN IF NOT EXISTS education          NUMERIC,
    ADD COLUMN IF NOT EXISTS global_image       NUMERIC,
    ADD COLUMN IF NOT EXISTS infrastructure     NUMERIC,
    ADD COLUMN IF NOT EXISTS industry           NUMERIC,
    ADD COLUMN IF NOT EXISTS farmland           NUMERIC,
    ADD COLUMN IF NOT EXISTS service_sector     NUMERIC,
    ADD COLUMN IF NOT EXISTS unskilled_workers  NUMERIC,
    ADD COLUMN IF NOT EXISTS skilled_workers    NUMERIC,
    ADD COLUMN IF NOT EXISTS wages              NUMERIC,
    ADD COLUMN IF NOT EXISTS income_tax         NUMERIC,
    ADD COLUMN IF NOT EXISTS corporate_tax      NUMERIC,
    ADD COLUMN IF NOT EXISTS crime              NUMERIC,
    ADD COLUMN IF NOT EXISTS corruption         NUMERIC,
    ADD COLUMN IF NOT EXISTS inequality         NUMERIC,
    ADD COLUMN IF NOT EXISTS gov_approval       NUMERIC,
    ADD COLUMN IF NOT EXISTS population         NUMERIC;

COMMIT;

NOTIFY pgrst, 'reload schema';
