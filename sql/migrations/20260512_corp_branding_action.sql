-- ══════════════════════════════════════════════════════════════
-- Branding action (CMO) — persistent 12-tick cooldown.
--
-- Mirrors the existing last_donation_tick pattern: a single integer
-- column on factions, NULL default so the first use isn't gated. The
-- client gates on (current_tick - last_branding_tick) >= 12 and the
-- write uses an optimistic-lock match (.eq('last_branding_tick',
-- prev)) so two simultaneous submits can't both succeed.
-- ══════════════════════════════════════════════════════════════

ALTER TABLE factions
  ADD COLUMN IF NOT EXISTS last_branding_tick INT;

COMMENT ON COLUMN factions.last_branding_tick IS
  'Tick number of the last successful CMO Branding action. NULL = never used. Cooldown is 12 ticks; client compares (current_tick - last_branding_tick) >= 12.';
