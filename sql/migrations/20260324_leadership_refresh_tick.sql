-- Track when leadership candidates were last manually refreshed (per-tick limit).
ALTER TABLE leadership_candidates
    ADD COLUMN IF NOT EXISTS last_refresh_tick INTEGER DEFAULT NULL;
