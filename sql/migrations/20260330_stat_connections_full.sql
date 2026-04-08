-- ══════════════════════════════════════════════════════════════════════
-- Stat Connections — Full Cascade System
-- Adds all missing connections from the comprehensive design spec.
-- Uses ON CONFLICT to skip any that already exist.
-- All use dampening=true (effect weakens at extremes).
-- ══════════════════════════════════════════════════════════════════════

-- Add unique constraint if not exists (needed for ON CONFLICT)
CREATE UNIQUE INDEX IF NOT EXISTS uq_stat_connections_key
    ON stat_connections (source_stat, source_dir, threshold, target_stat, target_dir);

INSERT INTO stat_connections
    (source_stat, source_dir, threshold, target_stat, target_dir, magnitude, delay_ticks, dampening, category, enabled)
VALUES
    -- ══ 💸 Inflation cascades ══
    ('inflation', 'above', 30, 'cost_of_living',     'up',   0.15, 0, true, 'economic', true),
    ('inflation', 'above', 30, 'standard_of_living', 'down', 0.1,  0, true, 'economic', true),
    ('inflation', 'above', 30, 'happiness',          'down', 0.1,  0, true, 'economic', true),
    ('inflation', 'above', 25, 'poverty_rate',       'up',   0.1,  0, true, 'economic', true),
    ('inflation', 'above', 40, 'interest_rates',     'up',   0.2,  0, true, 'economic', true),
    ('inflation', 'above', 40, 'currency_strength',  'down', 0.15, 0, true, 'economic', true),
    ('fuel_prices', 'above', 60, 'inflation',        'up',   0.1,  0, true, 'economic', true),
    ('oil_and_gas', 'below', 20, 'inflation',        'up',   0.1,  0, true, 'economic', true),

    -- ══ 📈 Interest Rates cascades ══
    ('interest_rates', 'above', 50, 'gdp_growth',           'down', 0.15, 0, true, 'economic', true),
    ('interest_rates', 'above', 50, 'unemployment',          'up',   0.1,  0, true, 'economic', true),
    ('interest_rates', 'above', 40, 'housing_affordability', 'down', 0.15, 0, true, 'economic', true),
    ('interest_rates', 'above', 40, 'credit',               'down', 0.15, 0, true, 'economic', true),
    ('interest_rates', 'above', 55, 'foreign_investment',    'up',   0.1,  0, true, 'economic', true),
    ('credit', 'above', 70, 'interest_rates',                'up',   0.1,  0, true, 'economic', true),

    -- ══ 💱 Currency Strength cascades ══
    ('currency_strength', 'above', 60, 'foreign_investment',    'up',   0.1,  0, true, 'economic', true),
    ('currency_strength', 'below', 40, 'manufacturing_output',  'up',   0.1,  0, true, 'economic', true),
    ('currency_strength', 'below', 40, 'standard_of_living',   'down', 0.1,  0, true, 'economic', true),
    ('currency_strength', 'below', 30, 'inflation',            'up',   0.15, 0, true, 'economic', true),

    -- ══ 🧾 Tax cascades ══
    ('corporate_tax', 'above', 40, 'foreign_investment',        'down', 0.15, 0, true, 'economic', true),
    ('corporate_tax', 'above', 50, 'gdp_growth',               'down', 0.1,  0, true, 'economic', true),
    ('corporate_tax', 'above', 50, 'manufacturing_output',     'down', 0.1,  0, true, 'economic', true),
    ('income_tax', 'above', 60, 'labor_force_participation',   'down', 0.1,  0, true, 'economic', true),
    ('income_tax', 'above', 50, 'income_inequality',           'down', 0.1,  0, true, 'economic', true),
    ('sales_tax', 'above', 40, 'cost_of_living',               'up',   0.1,  0, true, 'economic', true),
    ('sales_tax', 'above', 50, 'poverty_rate',                 'up',   0.1,  0, true, 'economic', true),

    -- ══ 👷 Labor Market cascades ══
    ('minimum_wage', 'above', 40, 'poverty_rate',               'down', 0.15, 0, true, 'labor', true),
    ('minimum_wage', 'above', 40, 'income_inequality',          'down', 0.1,  0, true, 'labor', true),
    ('minimum_wage', 'above', 70, 'unemployment',               'up',   0.1,  0, true, 'labor', true),
    ('union_strength', 'above', 60, 'minimum_wage',             'up',   0.1,  0, true, 'labor', true),
    ('union_strength', 'above', 60, 'income_inequality',        'down', 0.1,  0, true, 'labor', true),
    ('union_strength', 'above', 50, 'labor_force_participation','up',   0.1,  0, true, 'labor', true),
    ('labor_force_participation', 'above', 65, 'gdp_growth',   'up',   0.1,  0, true, 'labor', true),
    ('labor_force_participation', 'below', 40, 'unemployment',  'up',   0.1,  0, true, 'labor', true),
    ('drug_use', 'above', 40, 'labor_force_participation',     'down', 0.1,  0, true, 'social', true),

    -- ══ ⚡ Energy & Environment cascades ══
    ('energy_generation', 'above', 60, 'manufacturing_output',  'up',  0.1,  0, true, 'economic', true),
    ('energy_generation', 'above', 60, 'gdp_growth',            'up',  0.1,  0, true, 'economic', true),
    ('oil_and_gas', 'above', 50, 'energy_generation',           'up',  0.1,  0, true, 'economic', true),
    ('renewable_energy_percentage', 'above', 50, 'pollution',   'down', 0.1,  0, true, 'environment', true),
    ('renewable_energy_percentage', 'above', 65, 'energy_generation', 'up', 0.1, 0, true, 'environment', true),
    ('rare_minerals', 'above', 50, 'manufacturing_output',     'up',   0.15, 0, true, 'economic', true),
    ('arable_land', 'above', 50, 'gdp_growth',                 'up',   0.1,  0, true, 'economic', true),
    ('pollution', 'above', 50, 'healthcare_accessibility',     'down', 0.1,  0, true, 'environment', true),
    ('pollution', 'above', 50, 'lifespan',                     'down', 0.1,  0, true, 'environment', true),
    ('pollution', 'above', 60, 'happiness',                    'down', 0.1,  0, true, 'environment', true),

    -- ══ 👥 Demographics cascades ══
    ('median_age', 'above', 45, 'labor_force_participation',   'down', 0.1,  0, true, 'demographic', true),
    ('median_age', 'above', 45, 'healthcare_accessibility',    'down', 0.15, 0, true, 'demographic', true),
    ('median_age', 'above', 45, 'beds_per_100k',              'down', 0.1,  0, true, 'demographic', true),
    ('median_age', 'above', 50, 'gdp_growth',                 'down', 0.1,  0, true, 'demographic', true),
    ('population_growth', 'above', 60, 'housing_affordability','down', 0.1,  0, true, 'demographic', true),
    ('population_growth', 'above', 60, 'urbanization',         'up',   0.1,  0, true, 'demographic', true),
    ('urbanization', 'above', 70, 'crime_rate',                'up',   0.1,  0, true, 'demographic', true),
    ('urbanization', 'above', 70, 'housing_affordability',     'down', 0.15, 0, true, 'demographic', true),
    ('urbanization', 'above', 60, 'service_output',            'up',   0.1,  0, true, 'demographic', true),
    ('immigration', 'above', 50, 'labor_force_participation',  'up',   0.1,  0, true, 'demographic', true),
    ('emigration', 'above', 50, 'labor_force_participation',   'down', 0.1,  0, true, 'demographic', true),
    ('academic_immigration', 'above', 50, 'higher_education',  'up',   0.1,  0, true, 'demographic', true),
    ('lifespan', 'above', 70, 'labor_force_participation',     'up',   0.1,  0, true, 'demographic', true),

    -- ══ 🏛️ Institutions & Politics cascades ══
    ('press_freedom', 'above', 60, 'corruption',               'down', 0.15, 0, true, 'governance', true),
    ('judicial_independence', 'above', 60, 'corruption',        'down', 0.15, 0, true, 'governance', true),
    ('judicial_independence', 'above', 60, 'foreign_investment','up',   0.15, 0, true, 'governance', true),
    ('legitimacy', 'above', 60, 'stability',                   'up',   0.15, 0, true, 'governance', true),
    ('legitimacy', 'below', 30, 'civil_unrest',                'up',   0.2,  0, true, 'governance', true),
    ('polarization', 'above', 60, 'legitimacy',                'down', 0.15, 0, true, 'governance', true),
    ('polarization', 'above', 60, 'efficiency',                'down', 0.1,  0, true, 'governance', true),
    ('income_inequality', 'above', 60, 'polarization',         'up',   0.15, 0, true, 'governance', true),
    ('income_inequality', 'above', 60, 'civil_unrest',         'up',   0.15, 0, true, 'governance', true),
    ('income_inequality', 'above', 60, 'crime_rate',           'up',   0.1,  0, true, 'governance', true),
    ('social_mobility', 'above', 60, 'income_inequality',      'down', 0.1,  0, true, 'governance', true),
    ('social_mobility', 'above', 60, 'happiness',              'up',   0.1,  0, true, 'governance', true),
    ('freedom_index', 'above', 65, 'immigration',              'up',   0.1,  0, true, 'governance', true),
    ('incarceration_rate', 'above', 60, 'crime_rate',          'down', 0.1,  0, true, 'governance', true),
    ('religiosity', 'above', 70, 'polarization',               'up',   0.1,  0, true, 'governance', true),

    -- ══ 📚 Education & Social cascades ══
    ('education_accessibility', 'above', 60, 'literacy',       'up',   0.1,  0, true, 'social', true),
    ('beds_per_100k', 'above', 50, 'healthcare_accessibility', 'up',   0.15, 0, true, 'social', true),
    ('literacy', 'above', 65, 'labor_force_participation',     'up',   0.1,  0, true, 'social', true),
    ('higher_education', 'above', 60, 'social_mobility',       'up',   0.1,  0, true, 'social', true),
    ('higher_education', 'above', 60, 'income_inequality',     'down', 0.1,  0, true, 'social', true),

    -- ══ 🏗️ Infrastructure & Credit cascades ══
    ('rail_network', 'above', 60, 'manufacturing_output',      'up',   0.1,  0, true, 'infrastructure', true),
    ('rail_network', 'above', 60, 'urbanization',              'up',   0.1,  0, true, 'infrastructure', true),
    ('credit', 'above', 60, 'manufacturing_output',            'up',   0.1,  0, true, 'economic', true),
    ('credit', 'above', 60, 'gdp_growth',                     'up',   0.1,  0, true, 'economic', true),
    ('housing_affordability', 'below', 30, 'immigration',      'down', 0.1,  0, true, 'demographic', true)

ON CONFLICT (source_stat, source_dir, threshold, target_stat, target_dir) DO NOTHING;
