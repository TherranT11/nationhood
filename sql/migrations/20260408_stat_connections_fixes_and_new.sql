-- ============================================================================
-- Fix broken stat connectors + add missing connections — Alpha 1.9.8
-- ============================================================================
--
-- 6 existing connectors reference stat keys that don't exist in the nations
-- table, so the tick processor silently skips them:
--   - 'terrorism_threat' should be 'terrorism'
--   - 'credit_rating' should be 'credit'
--   - 'primary_education' should be 'education_accessibility'
--
-- Strategy: delete the broken rows, then insert correct versions along with
-- all new connections. ON CONFLICT DO NOTHING prevents duplicates.
-- ============================================================================

BEGIN;

-- ══════════════════════════════════════════════════════════════════════════════
-- PHASE 1: Fix 6 broken connectors
-- ══════════════════════════════════════════════════════════════════════════════

-- Delete rows with invalid stat keys (these silently fail in the tick processor)
DELETE FROM stat_connections WHERE target_stat = 'terrorism_threat';
DELETE FROM stat_connections WHERE target_stat = 'credit_rating';
DELETE FROM stat_connections WHERE source_stat = 'primary_education';

-- Re-insert with correct stat keys
INSERT INTO stat_connections
    (source_stat, source_dir, threshold, target_stat, target_dir, magnitude, delay_ticks, dampening, category, enabled)
VALUES
    -- Polarization > 75 → Terrorism up (was targeting 'terrorism_threat')
    ('polarization',       'above', 75, 'terrorism',                'up',   0.1,  0, true, 'governance', true),
    -- Legitimacy < 40 → Terrorism up (was targeting 'terrorism_threat')
    ('legitimacy',         'below', 40, 'terrorism',                'up',   0.1,  0, true, 'governance', true),
    -- Political Violence > 60 → Terrorism up (was targeting 'terrorism_threat')
    ('political_violence', 'above', 60, 'terrorism',                'up',   0.15, 0, true, 'governance', true),
    -- Debt Growth > 80 → Credit down (was targeting 'credit_rating')
    ('debt_growth',        'above', 80, 'credit',                   'down', 0.15, 0, true, 'economic',   true),
    -- Education Accessibility < 30 → Literacy down (was sourcing 'primary_education')
    ('education_accessibility', 'below', 30, 'literacy',            'down', 0.15, 0, true, 'social',     true),
    -- Education Accessibility < 30 → Labor Force Participation down (was sourcing 'primary_education')
    ('education_accessibility', 'below', 30, 'labor_force_participation', 'down', 0.1, 0, true, 'social', true)
ON CONFLICT DO NOTHING;


-- ══════════════════════════════════════════════════════════════════════════════
-- PHASE 2: Benefits — almost completely disconnected (0 outgoing connections)
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO stat_connections
    (source_stat, source_dir, threshold, target_stat, target_dir, magnitude, delay_ticks, dampening, category, enabled)
VALUES
    ('benefits', 'above', 50, 'poverty_rate',              'down', 0.15, 0, true, 'social', true),
    ('benefits', 'above', 60, 'happiness',                 'up',   0.1,  0, true, 'social', true),
    ('benefits', 'above', 50, 'civil_unrest',              'down', 0.1,  0, true, 'social', true),
    ('benefits', 'above', 60, 'standard_of_living',        'up',   0.1,  0, true, 'social', true),
    ('benefits', 'above', 70, 'income_inequality',         'down', 0.1,  0, true, 'social', true),
    ('benefits', 'above', 80, 'labor_force_participation', 'down', 0.1,  0, true, 'labor',  true),
    ('benefits', 'above', 60, 'debt_growth',               'up',   0.1,  0, true, 'economic', true)
ON CONFLICT DO NOTHING;


-- ══════════════════════════════════════════════════════════════════════════════
-- PHASE 3: Incarceration Rate — maxed at 100, barely connected
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO stat_connections
    (source_stat, source_dir, threshold, target_stat, target_dir, magnitude, delay_ticks, dampening, category, enabled)
VALUES
    ('incarceration_rate', 'above', 70, 'freedom_index', 'down', 0.15, 0, true, 'governance', true),
    ('incarceration_rate', 'above', 70, 'happiness',     'down', 0.1,  0, true, 'social',     true),
    ('incarceration_rate', 'above', 80, 'legitimacy',    'down', 0.15, 0, true, 'governance', true),
    ('incarceration_rate', 'above', 70, 'debt_growth',   'up',   0.1,  0, true, 'economic',   true),
    ('incarceration_rate', 'above', 80, 'emigration',    'up',   0.1,  0, true, 'demographic', true),
    ('incarceration_rate', 'above', 80, 'civil_unrest',  'up',   0.1,  0, true, 'governance', true)
ON CONFLICT DO NOTHING;


-- ══════════════════════════════════════════════════════════════════════════════
-- PHASE 4: Credit Rating — no outgoing connections
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO stat_connections
    (source_stat, source_dir, threshold, target_stat, target_dir, magnitude, delay_ticks, dampening, category, enabled)
VALUES
    ('credit', 'above', 60, 'interest_rates',    'down', 0.1,  0, true, 'economic', true),
    ('credit', 'below', 30, 'interest_rates',    'up',   0.15, 0, true, 'economic', true),
    ('credit', 'above', 60, 'foreign_investment','up',   0.1,  0, true, 'economic', true),
    ('credit', 'below', 30, 'currency_strength', 'down', 0.15, 0, true, 'economic', true),
    ('credit', 'below', 30, 'debt_growth',       'up',   0.1,  0, true, 'economic', true)
ON CONFLICT DO NOTHING;


-- ══════════════════════════════════════════════════════════════════════════════
-- PHASE 5: Corruption — missing key downstream effects
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO stat_connections
    (source_stat, source_dir, threshold, target_stat, target_dir, magnitude, delay_ticks, dampening, category, enabled)
VALUES
    ('corruption', 'above', 50, 'crime_rate',             'up',   0.1, 0, true, 'governance', true),
    ('corruption', 'above', 60, 'freedom_index',          'down', 0.1, 0, true, 'governance', true),
    ('corruption', 'above', 60, 'income_inequality',      'up',   0.1, 0, true, 'governance', true),
    ('corruption', 'above', 50, 'happiness',              'down', 0.1, 0, true, 'governance', true),
    ('corruption', 'above', 60, 'judicial_independence',  'down', 0.1, 0, true, 'governance', true)
ON CONFLICT DO NOTHING;


-- ══════════════════════════════════════════════════════════════════════════════
-- PHASE 6: Higher Education — barely impacts the economy
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO stat_connections
    (source_stat, source_dir, threshold, target_stat, target_dir, magnitude, delay_ticks, dampening, category, enabled)
VALUES
    ('higher_education', 'above', 60, 'gdp_growth',           'up',   0.1, 0, true, 'economic', true),
    ('higher_education', 'above', 60, 'service_output',       'up',   0.1, 0, true, 'economic', true),
    ('higher_education', 'above', 70, 'manufacturing_output', 'up',   0.1, 0, true, 'economic', true),
    ('higher_education', 'above', 70, 'corruption',           'down', 0.1, 0, true, 'governance', true)
ON CONFLICT DO NOTHING;


-- ══════════════════════════════════════════════════════════════════════════════
-- PHASE 7: Terrorism — almost entirely disconnected outward
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO stat_connections
    (source_stat, source_dir, threshold, target_stat, target_dir, magnitude, delay_ticks, dampening, category, enabled)
VALUES
    ('terrorism', 'above', 40, 'immigration',    'down', 0.1, 0, true, 'governance', true),
    ('terrorism', 'above', 40, 'happiness',      'down', 0.1, 0, true, 'governance', true),
    ('terrorism', 'above', 50, 'emigration',     'up',   0.1, 0, true, 'governance', true),
    ('terrorism', 'above', 50, 'gdp_growth',     'down', 0.1, 0, true, 'governance', true),
    ('terrorism', 'above', 30, 'freedom_index',  'down', 0.1, 0, true, 'governance', true)
ON CONFLICT DO NOTHING;


-- ══════════════════════════════════════════════════════════════════════════════
-- PHASE 8: Religiosity — only drives Polarization currently
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO stat_connections
    (source_stat, source_dir, threshold, target_stat, target_dir, magnitude, delay_ticks, dampening, category, enabled)
VALUES
    ('religiosity', 'above', 75, 'freedom_index', 'down', 0.1, 0, true, 'governance', true),
    ('religiosity', 'above', 60, 'drug_use',      'down', 0.1, 0, true, 'social',     true),
    ('religiosity', 'above', 60, 'crime_rate',    'down', 0.1, 0, true, 'social',     true)
ON CONFLICT DO NOTHING;


-- ══════════════════════════════════════════════════════════════════════════════
-- PHASE 9: Other notable gaps
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO stat_connections
    (source_stat, source_dir, threshold, target_stat, target_dir, magnitude, delay_ticks, dampening, category, enabled)
VALUES
    -- Fuel Prices → Renewable Energy (incentivizes alternatives)
    ('fuel_prices',       'above', 65, 'renewable_energy_percentage', 'up',   0.1, 0, true, 'economic',    true),
    -- Population Growth → Unemployment (labor surplus)
    ('population_growth', 'above', 70, 'unemployment',               'up',   0.1, 0, true, 'demographic', true),
    -- Population Growth → GDP Growth (more consumers/workers)
    ('population_growth', 'above', 60, 'gdp_growth',                 'up',   0.1, 0, true, 'demographic', true),
    -- Lifespan → Median Age (people living longer = aging population)
    ('lifespan',          'above', 75, 'median_age',                 'up',   0.1, 0, true, 'demographic', true),
    -- Standard of Living LOW → Drug Use (desperation)
    ('standard_of_living','below', 30, 'drug_use',                   'up',   0.1, 0, true, 'social',      true),
    -- Tariffs → Manufacturing (protectionism upside)
    ('tariffs',           'above', 50, 'manufacturing_output',       'up',   0.1, 0, true, 'economic',    true)
ON CONFLICT DO NOTHING;

COMMIT;
