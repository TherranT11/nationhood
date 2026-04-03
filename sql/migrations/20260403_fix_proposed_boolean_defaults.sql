-- Normalize DEFAULT values for authoritarian proposed_* boolean columns.
--
-- The original three columns (from 20260323_authoritarian_foundational_laws.sql)
-- were created with DEFAULT NULL while all later columns use DEFAULT FALSE.
-- Both are functionally equivalent in JS (both falsy), but the inconsistency
-- causes confusion when debugging bill rows. Standardize to DEFAULT FALSE.
ALTER TABLE bills ALTER COLUMN proposed_abolish_term_limits SET DEFAULT FALSE;
ALTER TABLE bills ALTER COLUMN proposed_state_media_control SET DEFAULT FALSE;
ALTER TABLE bills ALTER COLUMN proposed_emergency_powers_act SET DEFAULT FALSE;

-- Back-fill existing NULL rows to FALSE for consistency.
UPDATE bills
SET
    proposed_abolish_term_limits = FALSE
WHERE proposed_abolish_term_limits IS NULL;

UPDATE bills
SET
    proposed_state_media_control = FALSE
WHERE proposed_state_media_control IS NULL;

UPDATE bills
SET
    proposed_emergency_powers_act = FALSE
WHERE proposed_emergency_powers_act IS NULL;
