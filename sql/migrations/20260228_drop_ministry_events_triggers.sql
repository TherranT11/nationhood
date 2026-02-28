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

-- 3. Defensive: drop the template-validation function if it still exists.
--    (The trigger is not dropped here because the target table may already be gone;
--     CASCADE on the function handles any remaining trigger references.)
DROP FUNCTION IF EXISTS normalize_and_validate_ministry_event_template_gov_types() CASCADE;

-- 4. Defensive: re-drop the tables in case the earlier migration was not applied.
DROP TABLE IF EXISTS ministry_events;
DROP TABLE IF EXISTS ministry_event_templates;
