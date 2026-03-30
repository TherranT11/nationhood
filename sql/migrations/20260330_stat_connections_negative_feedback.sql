-- ══════════════════════════════════════════════════════════════════════
-- Stat Connections — Negative Feedback Loops
-- Adds missing connections where bad stats should make other stats worse.
-- Without these, nations can have catastrophic political violence/polarization
-- while the economy keeps growing unaffected.
-- Uses ON CONFLICT to skip any that already exist.
-- ══════════════════════════════════════════════════════════════════════

INSERT INTO stat_connections
    (source_stat, source_dir, threshold, target_stat, target_dir, magnitude, delay_ticks, dampening, category, enabled)
VALUES
    -- ══ 🔥 Polarization cascades (was only → legitimacy, efficiency) ══
    -- Max polarization should directly fuel unrest and unhappiness
    ('polarization', 'above', 70, 'civil_unrest',       'up',   0.15, 0, true, 'governance', true),
    ('polarization', 'above', 80, 'happiness',           'down', 0.1,  0, true, 'governance', true),
    ('polarization', 'above', 80, 'stability',           'down', 0.1,  0, true, 'governance', true),
    ('polarization', 'above', 70, 'foreign_investment',  'down', 0.1,  0, true, 'governance', true),

    -- ══ 💀 Political Violence cascades (had ZERO outgoing connections) ══
    -- This is the biggest gap — PV at 75 with no consequences
    ('political_violence', 'above', 40, 'stability',          'down', 0.15, 0, true, 'governance', true),
    ('political_violence', 'above', 40, 'foreign_investment', 'down', 0.15, 0, true, 'governance', true),
    ('political_violence', 'above', 40, 'emigration',         'up',   0.1,  0, true, 'governance', true),
    ('political_violence', 'above', 50, 'legitimacy',         'down', 0.15, 0, true, 'governance', true),
    ('political_violence', 'above', 50, 'happiness',          'down', 0.15, 0, true, 'governance', true),
    ('political_violence', 'above', 60, 'gdp_growth',         'down', 0.1,  0, true, 'governance', true),
    ('political_violence', 'above', 60, 'immigration',        'down', 0.1,  0, true, 'governance', true),

    -- ══ 🪧 Civil Unrest cascades (had no outgoing connections) ══
    -- High unrest should destabilize the nation and hurt the economy
    ('civil_unrest', 'above', 50, 'stability',          'down', 0.15, 0, true, 'governance', true),
    ('civil_unrest', 'above', 50, 'foreign_investment', 'down', 0.1,  0, true, 'governance', true),
    ('civil_unrest', 'above', 60, 'gdp_growth',         'down', 0.1,  0, true, 'governance', true),
    ('civil_unrest', 'above', 60, 'happiness',           'down', 0.1,  0, true, 'governance', true),
    ('civil_unrest', 'above', 70, 'emigration',          'up',   0.1,  0, true, 'governance', true),
    ('civil_unrest', 'above', 70, 'legitimacy',          'down', 0.1,  0, true, 'governance', true),

    -- ══ 🔓 Freedom Index LOW cascades (only had HIGH→immigration boost) ══
    -- Collapsing freedom should drive people out and erode legitimacy
    ('freedom_index', 'below', 40, 'emigration',         'up',   0.15, 0, true, 'governance', true),
    ('freedom_index', 'below', 30, 'legitimacy',         'down', 0.15, 0, true, 'governance', true),
    ('freedom_index', 'below', 30, 'foreign_investment', 'down', 0.15, 0, true, 'governance', true),
    ('freedom_index', 'below', 40, 'happiness',          'down', 0.1,  0, true, 'governance', true),
    ('freedom_index', 'below', 30, 'immigration',        'down', 0.1,  0, true, 'governance', true),

    -- ══ 📰 Press Freedom LOW cascades (only had HIGH→corruption reduction) ══
    -- Without press oversight, corruption and abuse grow unchecked
    ('press_freedom', 'below', 30, 'corruption',         'up',   0.15, 0, true, 'governance', true),
    ('press_freedom', 'below', 30, 'legitimacy',         'down', 0.1,  0, true, 'governance', true),
    ('press_freedom', 'below', 20, 'freedom_index',      'down', 0.1,  0, true, 'governance', true),

    -- ══ 🏦 Corruption HIGH cascades (had no outgoing connections) ══
    ('corruption', 'above', 50, 'foreign_investment',    'down', 0.15, 0, true, 'governance', true),
    ('corruption', 'above', 50, 'efficiency',            'down', 0.15, 0, true, 'governance', true),
    ('corruption', 'above', 60, 'legitimacy',            'down', 0.1,  0, true, 'governance', true),
    ('corruption', 'above', 60, 'gdp_growth',            'down', 0.1,  0, true, 'governance', true),
    ('corruption', 'above', 70, 'stability',             'down', 0.1,  0, true, 'governance', true),

    -- ══ 📉 Stability LOW cascades (stability has inbound but no crisis outbound) ══
    ('stability', 'below', 30, 'foreign_investment',     'down', 0.2,  0, true, 'governance', true),
    ('stability', 'below', 30, 'gdp_growth',             'down', 0.15, 0, true, 'governance', true),
    ('stability', 'below', 30, 'emigration',             'up',   0.15, 0, true, 'governance', true),
    ('stability', 'below', 20, 'civil_unrest',           'up',   0.2,  0, true, 'governance', true),

    -- ══ 🏚️ Crime Rate HIGH cascades (had incarceration link only) ══
    ('crime_rate', 'above', 50, 'happiness',             'down', 0.1,  0, true, 'social', true),
    ('crime_rate', 'above', 50, 'foreign_investment',    'down', 0.1,  0, true, 'social', true),
    ('crime_rate', 'above', 60, 'emigration',            'up',   0.1,  0, true, 'social', true),
    ('crime_rate', 'above', 60, 'stability',             'down', 0.1,  0, true, 'social', true),

    -- ══ 💊 Drug Use cascades (only had → labor_force_participation) ══
    ('drug_use', 'above', 50, 'crime_rate',              'up',   0.1,  0, true, 'social', true),
    ('drug_use', 'above', 50, 'happiness',               'down', 0.1,  0, true, 'social', true),
    ('drug_use', 'above', 60, 'healthcare_accessibility','down', 0.1,  0, true, 'social', true),

    -- ══ 💱 Currency Strength LOW cascades (had some but missing key ones) ══
    ('currency_strength', 'below', 25, 'foreign_investment', 'down', 0.15, 0, true, 'economic', true),
    ('currency_strength', 'below', 20, 'emigration',         'up',   0.1,  0, true, 'economic', true),

    -- ══ 🔻 Legitimacy LOW cascades (only had → civil_unrest below 30) ══
    ('legitimacy', 'below', 30, 'stability',              'down', 0.15, 0, true, 'governance', true),
    ('legitimacy', 'below', 30, 'emigration',             'up',   0.1,  0, true, 'governance', true),
    ('legitimacy', 'below', 20, 'political_violence',     'up',   0.15, 0, true, 'governance', true),

    -- ══ 🏥 Healthcare cascades ══
    ('healthcare_accessibility', 'below', 30, 'happiness',    'down', 0.15, 0, true, 'social', true),
    ('healthcare_accessibility', 'below', 30, 'lifespan',     'down', 0.1,  0, true, 'social', true),
    ('healthcare_accessibility', 'below', 20, 'civil_unrest', 'up',   0.1,  0, true, 'social', true),

    -- ══ 📚 Education LOW cascades ══
    ('primary_education', 'below', 30, 'literacy',            'down', 0.15, 0, true, 'social', true),
    ('primary_education', 'below', 30, 'labor_force_participation', 'down', 0.1, 0, true, 'social', true),
    ('literacy', 'below', 40, 'efficiency',                   'down', 0.1,  0, true, 'social', true),

    -- ══ 🏠 Poverty cascades (had no outgoing) ══
    ('poverty_rate', 'above', 50, 'crime_rate',           'up',   0.1,  0, true, 'social', true),
    ('poverty_rate', 'above', 50, 'civil_unrest',         'up',   0.1,  0, true, 'social', true),
    ('poverty_rate', 'above', 60, 'happiness',            'down', 0.15, 0, true, 'social', true),
    ('poverty_rate', 'above', 60, 'political_violence',   'up',   0.1,  0, true, 'social', true),

    -- ══ 📈 Unemployment HIGH cascades ══
    ('unemployment', 'above', 40, 'crime_rate',           'up',   0.1,  0, true, 'labor', true),
    ('unemployment', 'above', 40, 'happiness',            'down', 0.1,  0, true, 'labor', true),
    ('unemployment', 'above', 50, 'civil_unrest',         'up',   0.1,  0, true, 'labor', true),
    ('unemployment', 'above', 50, 'poverty_rate',         'up',   0.1,  0, true, 'labor', true),
    ('unemployment', 'above', 60, 'political_violence',   'up',   0.1,  0, true, 'labor', true)

ON CONFLICT (source_stat, source_dir, threshold, target_stat, target_dir) DO NOTHING;
