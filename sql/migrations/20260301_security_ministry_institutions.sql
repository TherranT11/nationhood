-- Security Ministry institution configuration
-- Adds 3 institutions for the security ministry so it participates in the
-- institution funding / stat decay system and the minister approval pipeline.
-- The security ministry remains inactive in the cabinet UI for now.

INSERT INTO ministry_institution_config (id, ministry_key, institution_name, base_cost_per_capita, cost_share, primary_stat, secondary_stat) VALUES
    ('internal_security',  'security', 'Internal Security Forces',     1.2, 0.50, 'civil_unrest',        'stability'),
    ('surveillance',       'security', 'Surveillance & Intelligence',  0.5, 0.35, 'political_violence',  'digital_infrastructure'),
    ('border_security',    'security', 'Border Security',              0.4, 0.15, 'illegal_immigration', 'stability')
ON CONFLICT (id) DO NOTHING;
