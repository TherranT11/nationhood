-- Add missing columns to active_laws table.
-- Uses ADD COLUMN IF NOT EXISTS so it's safe to re-run.
-- Run this in Supabase SQL editor.

-- Tick tracking: which ticks have already had effects applied
ALTER TABLE active_laws ADD COLUMN IF NOT EXISTS effects_applied_through_tick INT DEFAULT 0;

-- Bill reference (for logging/debugging)
ALTER TABLE active_laws ADD COLUMN IF NOT EXISTS bill_id UUID;

-- Policy reversal tracking
ALTER TABLE active_laws ADD COLUMN IF NOT EXISTS is_reversal BOOLEAN DEFAULT false;
ALTER TABLE active_laws ADD COLUMN IF NOT EXISTS reversal_effects JSONB;

-- Ongoing cost accumulation
ALTER TABLE active_laws ADD COLUMN IF NOT EXISTS ongoing_accumulated NUMERIC DEFAULT 0;
