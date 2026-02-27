-- Drop ministry inbox events feature (templates + fired events)
-- This feature was never fully implemented (outcome resolution handler was missing).

-- Drop trigger first
DROP TRIGGER IF EXISTS trg_ministry_event_templates_validate_gov_types ON ministry_event_templates;
DROP FUNCTION IF EXISTS normalize_and_validate_ministry_event_template_gov_types();

-- Drop tables (ministry_events references ministry_event_templates via template_id)
DROP TABLE IF EXISTS ministry_events;
DROP TABLE IF EXISTS ministry_event_templates;
