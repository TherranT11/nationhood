-- Governance stat connections: make gov_approval affect nation stats.
-- High approval rewards good governance; low approval cascades damage.

INSERT INTO stat_connections
    (source_stat, source_dir, threshold, target_stat, target_dir, magnitude, delay_ticks, dampening, category, enabled)
VALUES
    -- High approval rewards (above 25 — even modest governance earns stability)
    ('gov_approval', 'above', 25, 'legitimacy',          'up',   0.15, 0, true, 'governance', true),
    ('gov_approval', 'above', 25, 'stability',           'up',   0.1,  0, true, 'governance', true),
    ('gov_approval', 'above', 25, 'happiness',           'up',   0.1,  0, true, 'governance', true),

    -- Low approval penalties (below 10 — government is deeply unpopular)
    ('gov_approval', 'below', 10, 'political_violence',  'up',   0.15, 0, true, 'governance', true),
    ('gov_approval', 'below', 10, 'civil_unrest',        'up',   0.1,  0, true, 'governance', true),
    ('gov_approval', 'below', 10, 'foreign_investment',  'down', 0.1,  0, true, 'governance', true),

    -- Very low approval (below 1 — complete government failure)
    ('gov_approval', 'below', 1,  'emigration',          'up',   0.1,  0, true, 'governance', true)
ON CONFLICT DO NOTHING;
