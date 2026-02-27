-- Update Government Shutdown crisis to new spec:
--   Trigger: Open budget bill sitting for 2+ ticks
--   Effects: -1 Stability/tick, -2 PM/President approval/tick, -1 all ministry approval/tick
--   Unfunded ministries suffer collapsing effect
--   Ends when: Budget bill is passed
--
-- These rows are for DISPLAY on nation.html (actual deltas applied
-- programmatically in processGovernmentShutdown inside advance-tick).

-- Update template description (upsert to ensure template exists)
INSERT INTO crisis_templates (id, name, description, is_active, crisis_type)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Government Shutdown',
    'The government has shut down because the Budget Bill has not been passed. Stability drops each tick, PM/President approval falls, all ministers take approval penalties, and unfunded ministries operate at collapsed capacity. Pass the Budget Bill to end the shutdown.',
    false,
    'stat'
)
ON CONFLICT (id) DO UPDATE SET
    description = EXCLUDED.description;

-- Remove all old display effects
DELETE FROM crisis_effects
WHERE crisis_id = '00000000-0000-0000-0000-000000000001';

-- Insert new display effects matching the updated spec
INSERT INTO crisis_effects (crisis_id, target, stat_key, change_per_tick)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'nation', 'stability', -1.0),
    ('00000000-0000-0000-0000-000000000001', 'pm_approval', 'approval', -2.0),
    ('00000000-0000-0000-0000-000000000001', 'minister_approval', 'approval', -1.0);
