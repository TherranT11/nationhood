-- Fix: Drop orphaned ministry welcome-email triggers and function on ministries.
-- The insert_ministry_welcome_email() function references the dropped
-- ministry_events table, causing "relation ministry_events does not exist"
-- when forming a government (form_government RPC inserts into ministries,
-- which fires the orphaned trigger).

-- 1. Drop the two triggers on ministries
DROP TRIGGER IF EXISTS trg_ministry_welcome_email ON ministries;
DROP TRIGGER IF EXISTS trg_ministry_welcome_email_insert ON ministries;

-- 2. Drop the trigger function (CASCADE catches any remaining references)
DROP FUNCTION IF EXISTS insert_ministry_welcome_email() CASCADE;

-- 3. Defensive: also drop the template-validation trigger/function
--    in case the earlier drop migration (20260226) was only partially applied.
DROP TRIGGER IF EXISTS trg_ministry_event_templates_validate_gov_types ON ministry_event_templates;
DROP FUNCTION IF EXISTS normalize_and_validate_ministry_event_template_gov_types() CASCADE;

-- 4. Defensive: re-drop the tables in case the earlier migration was not applied.
DROP TABLE IF EXISTS ministry_events;
DROP TABLE IF EXISTS ministry_event_templates;
