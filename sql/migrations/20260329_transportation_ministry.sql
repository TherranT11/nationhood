-- Add Transportation Ministry event templates to fire_system_event function.
-- These map trigger keys to event names for the event log.
-- Run in Supabase SQL editor (safe to re-run — uses CREATE OR REPLACE).

-- Note: The fire_system_event function uses a CASE statement for trigger_key → event_name mapping.
-- Transportation events need to be added to that CASE statement.
-- Since the function is large, we add the mappings via a separate approach:
-- The ministry action system fires events via direct event_log inserts in government.html,
-- not through fire_system_event. The trigger_key is stored for categorization only.

-- This migration documents the trigger keys for reference:
-- ministry_public_transit          → Public Transit Investment Activated
-- ministry_public_transit_expired  → Public Transit Investment Concluded
-- ministry_road_maintenance        → Road & Highway Maintenance Activated
-- ministry_road_maintenance_expired → Road & Highway Maintenance Concluded
-- ministry_expand_infrastructure   → Expand Infrastructure (Coming Soon)

-- Event templates for direct insertion (used by government.html action flow):
COMMENT ON TABLE ministry_action_log IS 'Ministry action log. Transportation actions: publicTransit (delay 2, duration 10, permanent Physical Infra residue +0.1), roadMaintenance (delay 1, duration 8, no residue).';
