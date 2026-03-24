-- ============================================================
-- Add columns to administrations table for live event tracking.
--
-- These JSONB arrays are populated every tick by the tick processor
-- so the current administration card always shows up-to-date data.
-- Previously they were only populated at close time.
--
-- Also adds minister_actions and diplomatic_actions columns
-- for tracking cabinet changes and diplomatic activity.
-- ============================================================

ALTER TABLE administrations
    ADD COLUMN IF NOT EXISTS bills_failed          JSONB,
    ADD COLUMN IF NOT EXISTS no_confidence_votes   JSONB,
    ADD COLUMN IF NOT EXISTS impeachments          JSONB,
    ADD COLUMN IF NOT EXISTS executive_orders      JSONB,
    ADD COLUMN IF NOT EXISTS snap_elections        JSONB,
    ADD COLUMN IF NOT EXISTS minority_governments  JSONB,
    ADD COLUMN IF NOT EXISTS minister_actions      JSONB,
    ADD COLUMN IF NOT EXISTS diplomatic_actions    JSONB;
