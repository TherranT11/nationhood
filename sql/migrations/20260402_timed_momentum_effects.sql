-- Add timed_momentum_effects JSONB column to nations table
-- Used for per-tick momentum boosts that expire after N ticks
-- Format: [{ "party_ids": [...], "delta_per_tick": 2, "remaining_ticks": 10, "source": "state_media_control" }]

ALTER TABLE nations ADD COLUMN IF NOT EXISTS timed_momentum_effects JSONB DEFAULT '[]'::jsonb;
