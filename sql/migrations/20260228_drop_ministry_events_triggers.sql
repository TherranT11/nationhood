-- Fix: Drop any lingering triggers on ministries / government_formations that
-- reference the dropped ministry_events or ministry_event_templates tables.
-- The tables were removed in 20260226_drop_ministry_inbox_events.sql but triggers
-- on other tables that INSERT INTO / SELECT FROM ministry_events were not cleaned up,
-- causing "relation ministry_events does not exist" when forming a government.

-- 1. Drop known trigger names (safe even if they don't exist)
DROP TRIGGER IF EXISTS trg_spawn_ministry_events ON ministries;
DROP TRIGGER IF EXISTS trg_ministry_events_on_insert ON ministries;
DROP TRIGGER IF EXISTS trg_ministry_events_on_delete ON ministries;
DROP TRIGGER IF EXISTS trg_ministry_events_on_update ON ministries;
DROP TRIGGER IF EXISTS trg_fire_ministry_events ON ministries;
DROP TRIGGER IF EXISTS trg_ministry_inbox_event ON ministries;
DROP TRIGGER IF EXISTS trg_ministry_event ON ministries;

DROP TRIGGER IF EXISTS trg_spawn_ministry_events ON government_formations;
DROP TRIGGER IF EXISTS trg_ministry_events_on_insert ON government_formations;
DROP TRIGGER IF EXISTS trg_ministry_events_on_update ON government_formations;
DROP TRIGGER IF EXISTS trg_fire_ministry_events ON government_formations;
DROP TRIGGER IF EXISTS trg_ministry_inbox_event ON government_formations;
DROP TRIGGER IF EXISTS trg_ministry_event ON government_formations;

-- 2. Drop any trigger functions that reference the dropped tables.
--    These are the plausible function names that would have been created alongside
--    the ministry_events feature.
DROP FUNCTION IF EXISTS spawn_ministry_events() CASCADE;
DROP FUNCTION IF EXISTS fire_ministry_events() CASCADE;
DROP FUNCTION IF EXISTS trigger_ministry_events() CASCADE;
DROP FUNCTION IF EXISTS create_ministry_events() CASCADE;
DROP FUNCTION IF EXISTS notify_ministry_events() CASCADE;
DROP FUNCTION IF EXISTS insert_ministry_events() CASCADE;
DROP FUNCTION IF EXISTS handle_ministry_events() CASCADE;
DROP FUNCTION IF EXISTS ministry_event_on_formation() CASCADE;
DROP FUNCTION IF EXISTS ministry_inbox_event() CASCADE;

-- 3. Defensive: also drop the original template-validation trigger/function
--    in case the earlier migration was only partially applied.
DROP TRIGGER IF EXISTS trg_ministry_event_templates_validate_gov_types ON ministry_event_templates;
DROP FUNCTION IF EXISTS normalize_and_validate_ministry_event_template_gov_types() CASCADE;

-- 4. Defensive: re-drop the tables in case the earlier migration was not applied.
DROP TABLE IF EXISTS ministry_events;
DROP TABLE IF EXISTS ministry_event_templates;
