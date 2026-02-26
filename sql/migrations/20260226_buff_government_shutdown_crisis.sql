-- Buff Government Shutdown crisis effects to make it devastating
-- Previous values were too mild: civil_unrest +2.7, corruption +1.7
-- New values add more stats and increase the per-tick damage.
--
-- These rows are for DISPLAY on nation.html (the actual deltas are applied
-- programmatically in processGovernmentShutdown inside advance-tick).

-- Update the template description to reflect new severity
UPDATE crisis_templates
SET description = 'The government has shut down due to failure to pass a budget. All ministry institutions are operating at collapsed capacity. Coalition parties suffer massive momentum losses. All ministers take direct approval penalties. Multiple nation stats deteriorate rapidly. Pass a budget to end the shutdown.'
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Update existing effects to new values
UPDATE crisis_effects
SET change_per_tick = 3.5
WHERE crisis_id = '00000000-0000-0000-0000-000000000001'
  AND stat_key = 'civil_unrest';

UPDATE crisis_effects
SET change_per_tick = 2.5
WHERE crisis_id = '00000000-0000-0000-0000-000000000001'
  AND stat_key = 'corruption';

-- Add new stat effects (display rows)
INSERT INTO crisis_effects (crisis_id, target, stat_key, change_per_tick)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'nation', 'stability', -3.0),
    ('00000000-0000-0000-0000-000000000001', 'nation', 'happiness', -2.0),
    ('00000000-0000-0000-0000-000000000001', 'nation', 'standard_of_living', -1.5),
    ('00000000-0000-0000-0000-000000000001', 'nation', 'unemployment', 1.5)
ON CONFLICT DO NOTHING;
