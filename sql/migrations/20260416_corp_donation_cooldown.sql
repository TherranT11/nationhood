-- Add per-corp donation cooldown tracker.
-- Replaces the event_log-based cooldown check (which failed silently when
-- the log insert errored, allowing double-donations on page refresh).

ALTER TABLE factions
    ADD COLUMN IF NOT EXISTS last_donation_tick INT DEFAULT 0;

COMMENT ON COLUMN factions.last_donation_tick IS
    'Tick when this corporation last made a political donation. Used by the Lobbyist Political Donation action to enforce a once-per-tick cooldown atomically (via optimistic locking on UPDATE).';
