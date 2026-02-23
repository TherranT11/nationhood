-- Government Shutdown Crisis template
-- This crisis is activated/deactivated programmatically by processGovernmentShutdown()
-- in advance-tick, NOT by the normal stat-trigger system. We set is_active = false
-- so processCrises() won't try to auto-activate/deactivate it via stat triggers.
--
-- The crisis displays on nation.html when an active_crises row exists.
-- Effects and end_triggers rows are for DISPLAY ONLY (Rising/Recovery labels).

-- Insert the crisis template with a stable UUID so we can reference it from code
INSERT INTO crisis_templates (id, name, description, is_active, crisis_type)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Government Shutdown',
    'The government has shut down due to failure to pass a budget. All ministry institutions are operating at collapsed capacity. Coalition parties lose -2 Momentum and -2 Approval per tick. PM and President approval dropping. Pass a budget to end the shutdown.',
    false,
    'stat'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description;

-- Crisis effects (for display on nation.html "Rising" section)
-- nation.html shows stats where change_per_tick > 0 as "Rising"
-- Civil unrest and corruption rise during a shutdown
INSERT INTO crisis_effects (crisis_id, target, stat_key, change_per_tick)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'nation', 'civil_unrest', 2.7),
    ('00000000-0000-0000-0000-000000000001', 'nation', 'corruption', 1.7)
ON CONFLICT DO NOTHING;
