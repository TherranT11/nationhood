-- Add 'activeCrisis' as a valid grievance_type for the protest system.
-- Replaces the old 'activePolicy' option with 'activeCrisis'.

ALTER TABLE protest_log
    DROP CONSTRAINT IF EXISTS protest_log_grievance_type_check;

ALTER TABLE protest_log
    ADD CONSTRAINT protest_log_grievance_type_check
    CHECK (grievance_type IN ('minister', 'activePolicy', 'activeCrisis', 'statFailure'));
