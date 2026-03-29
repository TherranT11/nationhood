-- ══════════════════════════════════════════════════════════════════════
-- Stat Connections — Comprehensive Cascades
-- All connections use dampening by default (effect weakens at extremes)
-- ══════════════════════════════════════════════════════════════════════

INSERT INTO stat_connections
    (source_stat, source_dir, threshold, target_stat, target_dir, magnitude, delay_ticks, dampening, category, enabled)
VALUES
    -- ══ Civil Unrest cascades ══
    ('civil_unrest', 'above', 8,  'crime_rate',         'up',   0.5,  0, true, 'social', true),
    ('civil_unrest', 'above', 15, 'stability',          'down', 0.1,  0, true, 'social', true),
    ('civil_unrest', 'above', 20, 'foreign_investment',  'down', 0.3,  0, true, 'economic', true),
    ('civil_unrest', 'above', 25, 'tourism',            'down', 0.5,  0, true, 'economic', true),

    -- ══ Inflation cascades ══
    ('inflation', 'above', 65, 'happiness',        'down', 0.3,  0, true, 'economic', true),
    ('inflation', 'above', 70, 'civil_unrest',     'up',   0.2,  0, true, 'economic', true),
    ('inflation', 'above', 60, 'poverty_rate',     'up',   0.2,  0, true, 'economic', true),
    ('inflation', 'below', 5,  'gdp_growth',       'down', 0.1,  0, true, 'economic', true),
    ('inflation', 'below', 15, 'foreign_investment','up',  0.15, 0, true, 'economic', true),

    -- ══ Crime cascades ══
    ('crime_rate', 'above', 40, 'tourism',            'down', 0.3, 0, true, 'social', true),
    ('crime_rate', 'above', 50, 'foreign_investment',  'down', 0.2, 0, true, 'social', true),
    ('crime_rate', 'above', 60, 'happiness',          'down', 0.3, 0, true, 'social', true),
    ('crime_rate', 'below', 15, 'standard_of_living', 'up',  0.1, 0, true, 'social', true),

    -- ══ Education cascades ══
    ('higher_education', 'below', 20, 'corruption',       'up',   0.15, 0, true, 'social', true),
    ('literacy',         'below', 40, 'poverty_rate',     'up',   0.2,  0, true, 'social', true),
    ('literacy',         'above', 80, 'social_mobility',  'up',   0.1,  0, true, 'social', true),

    -- ══ Healthcare cascades ══
    ('healthcare_quality', 'below', 25, 'lifespan',           'down', 0.2, 0, true, 'social', true),
    ('healthcare_quality', 'above', 70, 'happiness',          'up',   0.1, 0, true, 'social', true),
    ('drug_use',           'above', 50, 'crime_rate',         'up',   0.3, 0, true, 'social', true),
    ('drug_use',           'above', 40, 'healthcare_quality', 'down', 0.1, 0, true, 'social', true),

    -- ══ Corruption cascades ══
    ('corruption', 'above', 50, 'foreign_investment', 'down', 0.2,  0, true, 'governance', true),
    ('corruption', 'above', 60, 'poverty_rate',       'up',   0.15, 0, true, 'governance', true),
    ('corruption', 'above', 40, 'efficiency',         'down', 0.2,  0, true, 'governance', true),
    ('corruption', 'below', 15, 'foreign_investment', 'up',   0.1,  0, true, 'governance', true),

    -- ══ Unemployment cascades ══
    ('unemployment', 'above', 40, 'crime_rate',    'up',   0.3, 0, true, 'economic', true),
    ('unemployment', 'above', 50, 'civil_unrest',  'up',   0.3, 0, true, 'economic', true),
    ('unemployment', 'above', 30, 'poverty_rate',  'up',   0.2, 0, true, 'economic', true),
    ('unemployment', 'below', 10, 'happiness',     'up',   0.1, 0, true, 'economic', true),

    -- ══ Stability / Freedom cascades ══
    ('stability',     'below', 20, 'foreign_investment', 'down', 0.3,  0, true, 'governance', true),
    ('press_freedom', 'below', 20, 'corruption',         'up',   0.2,  0, true, 'governance', true),
    ('press_freedom', 'above', 70, 'corruption',         'down', 0.1,  0, true, 'governance', true),
    ('freedom_index', 'below', 20, 'civil_unrest',       'up',   0.15, 0, true, 'governance', true);
