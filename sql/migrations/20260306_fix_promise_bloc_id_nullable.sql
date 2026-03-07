-- Fix: Allow bloc_id to be NULL on fundraiser_promises.
-- Stat promises may not match any bloc's priority issues, so bloc_id can legitimately be NULL.
ALTER TABLE fundraiser_promises ALTER COLUMN bloc_id DROP NOT NULL;
