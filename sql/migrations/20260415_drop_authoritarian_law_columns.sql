-- Remove deprecated authoritarian-only nation/bill fields introduced on 2026-03-23.

ALTER TABLE nations DROP COLUMN IF EXISTS term_limits_abolished;
ALTER TABLE nations DROP COLUMN IF EXISTS state_media_control;
ALTER TABLE nations DROP COLUMN IF EXISTS emergency_powers_act;
ALTER TABLE nations DROP COLUMN IF EXISTS seize_power_rejected;
ALTER TABLE nations DROP COLUMN IF EXISTS authoritarianism_seize_available_tick;

ALTER TABLE bills DROP COLUMN IF EXISTS proposed_abolish_term_limits;
ALTER TABLE bills DROP COLUMN IF EXISTS proposed_state_media_control;
ALTER TABLE bills DROP COLUMN IF EXISTS proposed_emergency_powers_act;
