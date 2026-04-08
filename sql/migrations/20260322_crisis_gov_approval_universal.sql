-- Add government_approval effect (-0.5/tick) to every crisis template
-- that doesn't already have one. All crises should drag down approval.
INSERT INTO crisis_effects (crisis_id, target, stat_key, change_per_tick, stat_floor)
SELECT ct.id, 'government_approval', NULL, -0.5, NULL
FROM crisis_templates ct
WHERE NOT EXISTS (
    SELECT 1 FROM crisis_effects ce
    WHERE ce.crisis_id = ct.id
    AND ce.target = 'government_approval'
)
ON CONFLICT DO NOTHING;
