-- Energy Dispatch card system: adds deck/card state columns to ministries table.
-- Only used by the energy ministry — other ministries ignore these columns.

ALTER TABLE ministries ADD COLUMN IF NOT EXISTS energy_deck_order JSONB DEFAULT NULL;
ALTER TABLE ministries ADD COLUMN IF NOT EXISTS energy_deck_index INT DEFAULT 0;
ALTER TABLE ministries ADD COLUMN IF NOT EXISTS energy_pending_card_id INT DEFAULT NULL;
ALTER TABLE ministries ADD COLUMN IF NOT EXISTS energy_pending_since_tick INT DEFAULT NULL;
ALTER TABLE ministries ADD COLUMN IF NOT EXISTS energy_last_result JSONB DEFAULT NULL;
