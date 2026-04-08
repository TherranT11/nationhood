-- Add corp_last_processed_tick to shard table for persistent idempotency
-- Prevents corp-tick from re-applying income on Deno cold starts
ALTER TABLE shard ADD COLUMN IF NOT EXISTS corp_last_processed_tick INT DEFAULT -1;
