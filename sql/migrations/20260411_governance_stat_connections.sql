-- Governance stat connections: make gov_approval affect nation stats.
-- High approval rewards good governance; low approval cascades damage.

INSERT INTO stat_connections (source_stat, direction, threshold, target_stat, effect_direction, rate, delay_ticks, is_permanent, category, is_active)
VALUES
    -- High approval rewards (above 25 — even modest governance earns stability)
    ('gov_approval', 'above', 25, 'legitimacy',          'up',   0.15, 0, true, 'governance', true),
    ('gov_approval', 'above', 25, 'stability',           'up',   0.1,  0, true, 'governance', true),
    ('gov_approval', 'above', 25, 'happiness',           'up',   0.1,  0, true, 'governance', true),

    -- Low approval penalties (below 10 — government is deeply unpopular)
    ('gov_approval', 'below', 10, 'political_violence',  'up',   0.15, 0, true, 'governance', true),
    ('gov_approval', 'below', 10, 'civil_unrest',        'up',   0.1,  0, true, 'governance', true),
    ('gov_approval', 'below', 10, 'foreign_investment',  'down', 0.1,  0, true, 'governance', true),

    -- Very low approval (below 0 — approval can't actually go below 0, but this
    -- triggers when approval IS 0, which means complete government failure)
    ('gov_approval', 'below', 1, 'emigration',           'up',   0.1,  0, true, 'governance', true);
