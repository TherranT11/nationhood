-- Add refurbishment tracking columns to corp_properties
-- refurbish_until_tick: tick when refurbishment completes (null = not refurbishing)
-- refurbish_condition: the condition value to set when refurbishment completes

ALTER TABLE corp_properties
    ADD COLUMN IF NOT EXISTS refurbish_until_tick INT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS refurbish_condition INT DEFAULT NULL;
