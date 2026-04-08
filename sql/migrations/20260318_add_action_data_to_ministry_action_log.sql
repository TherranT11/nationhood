-- Add missing action_data column to ministry_action_log.
-- The execute_ministry_action RPC writes to this column but it was never added to the table.

ALTER TABLE ministry_action_log
ADD COLUMN IF NOT EXISTS action_data JSONB DEFAULT '{}'::jsonb;
