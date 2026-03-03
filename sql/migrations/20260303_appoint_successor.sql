-- Appoint Successor + Dynasty: new columns for succession mechanic

-- Steward-level: track chosen successor status and dynasty progress
ALTER TABLE stewards ADD COLUMN IF NOT EXISTS is_chosen_successor BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE stewards ADD COLUMN IF NOT EXISTS succession_strength INTEGER NOT NULL DEFAULT 0;
ALTER TABLE stewards ADD COLUMN IF NOT EXISTS successor_appointed_tick INTEGER;

-- Nation-level: track cooldown for successor appointment
ALTER TABLE nations ADD COLUMN IF NOT EXISTS successor_cooldown_end_tick INTEGER;
