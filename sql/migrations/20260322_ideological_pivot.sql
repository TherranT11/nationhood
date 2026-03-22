-- Track ideological pivot usage for escalating costs and conviction bonus.

ALTER TABLE factions ADD COLUMN IF NOT EXISTS pivot_count INTEGER DEFAULT 0;
ALTER TABLE factions ADD COLUMN IF NOT EXISTS pivot_last_tick INTEGER DEFAULT NULL;
ALTER TABLE factions ADD COLUMN IF NOT EXISTS pivot_cycle_start_tick INTEGER DEFAULT NULL;
