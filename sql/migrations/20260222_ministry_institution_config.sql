-- Ministry institution configuration (admin-editable)
-- Stores base cost per capita and stat mappings for each institution.
CREATE TABLE IF NOT EXISTS ministry_institution_config (
    id TEXT PRIMARY KEY,                      -- matches hardcoded institution id e.g. 'hospitals'
    ministry_key TEXT NOT NULL,               -- e.g. 'healthcare', 'defense'
    institution_name TEXT NOT NULL,            -- display name
    base_cost_per_capita DECIMAL NOT NULL DEFAULT 0,
    cost_share DECIMAL NOT NULL DEFAULT 0,    -- fraction of ministry budget (0-1)
    scaling_type TEXT NOT NULL DEFAULT 'population',  -- 'population' or 'gdp'
    primary_stat TEXT,                        -- nation stat key this institution maintains
    secondary_stat TEXT,                      -- secondary stat key
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed with current hardcoded defaults
INSERT INTO ministry_institution_config (id, ministry_key, institution_name, base_cost_per_capita, cost_share, primary_stat, secondary_stat) VALUES
    -- Healthcare
    ('hospitals',          'healthcare',      'Public Hospital Network',              0.8,  0.38, 'healthcare_accessibility', 'happiness'),
    ('workforce',          'healthcare',      'Medical Workforce',                    1.0,  0.47, 'healthcare_quality',       'happiness'),
    ('prevention',         'healthcare',      'Public Health & Disease Prevention',   0.3,  0.15, 'healthcare_quality',       'stability'),
    -- Education
    ('primary_schools',    'education',       'Primary & Secondary Schools',          1.2,  0.50, 'primary_education',        'happiness'),
    ('universities',       'education',       'Universities & Research',              0.8,  0.35, 'higher_education',         'digital_infrastructure'),
    ('vocational',         'education',       'Vocational Training',                  0.3,  0.15, 'primary_education',        'unemployment'),
    -- Defense
    ('military',           'defense',         'Armed Forces',                         1.5,  0.60, 'military',                 'stability'),
    ('intelligence',       'defense',         'Intelligence & Cybersecurity',         0.4,  0.25, 'digital_infrastructure',   'stability'),
    ('veterans',           'defense',         'Veterans Affairs',                     0.2,  0.15, 'happiness',                'stability'),
    -- Labor
    ('employment_services','labor',           'Employment Services',                  0.6,  0.45, 'unemployment',             'happiness'),
    ('worker_safety',      'labor',           'Worker Safety & Standards',            0.3,  0.30, 'stability',                'happiness'),
    ('social_security',    'labor',           'Social Security & Pensions',           0.4,  0.25, 'happiness',                'stability'),
    -- Justice
    ('courts',             'justice',         'Courts & Legal System',                0.5,  0.40, 'rule_of_law',              'stability'),
    ('corrections',        'justice',         'Corrections & Prisons',                0.4,  0.35, 'stability',                'rule_of_law'),
    ('law_enforcement',    'justice',         'Law Enforcement',                      0.4,  0.25, 'stability',                'happiness'),
    -- Energy
    ('power_grid',         'energy',          'Power Grid & Distribution',            0.7,  0.50, 'physical_infrastructure',  'digital_infrastructure'),
    ('generation',         'energy',          'Power Generation',                     0.5,  0.35, 'physical_infrastructure',  'environment'),
    ('regulation',         'energy',          'Energy Regulation',                    0.1,  0.15, 'environment',              'stability'),
    -- Transportation
    ('roads',              'transportation',  'Roads & Highways',                     1.0,  0.50, 'physical_infrastructure',  'happiness'),
    ('public_transit',     'transportation',  'Public Transit',                       0.6,  0.35, 'physical_infrastructure',  'environment'),
    ('aviation',           'transportation',  'Ports & Aviation',                     0.3,  0.15, 'physical_infrastructure',  'credit'),
    -- Finance
    ('tax_admin',          'finance',         'Tax Administration',                   0.4,  0.40, 'credit',                   'rule_of_law'),
    ('central_bank',       'finance',         'Central Bank & Monetary Policy',       0.3,  0.35, 'inflation',                'credit'),
    ('development_bank',   'finance',         'Development & Investment',             0.2,  0.25, 'gdp_growth',               'unemployment'),
    -- Foreign Affairs
    ('embassies',          'foreign',         'Embassies & Consulates',               0.3,  0.45, 'diplomacy',                'stability'),
    ('foreign_aid',        'foreign',         'Foreign Aid Programs',                 0.2,  0.30, 'diplomacy',                'happiness'),
    ('trade_missions',     'foreign',         'Trade Missions',                       0.1,  0.25, 'credit',                   'gdp_growth'),
    -- Interior
    ('civil_service',      'interior',        'Civil Service',                        0.5,  0.40, 'government_capacity',      'rule_of_law'),
    ('emergency_services', 'interior',        'Emergency Services',                   0.4,  0.35, 'stability',                'happiness'),
    ('census',             'interior',        'Census & Statistics',                  0.1,  0.25, 'government_capacity',      'credit'),
    -- Trade
    ('customs',            'trade',           'Customs & Border Trade',               0.3,  0.40, 'credit',                   'rule_of_law'),
    ('export_promotion',   'trade',           'Export Promotion Agency',              0.2,  0.35, 'gdp_growth',               'credit'),
    ('competition',        'trade',           'Competition & Consumer Protection',    0.1,  0.25, 'rule_of_law',              'happiness')
ON CONFLICT (id) DO NOTHING;

-- Allow public read, admin write
ALTER TABLE ministry_institution_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read ministry_institution_config" ON ministry_institution_config FOR SELECT USING (true);
CREATE POLICY "Anyone can update ministry_institution_config" ON ministry_institution_config FOR UPDATE USING (true);
CREATE POLICY "Anyone can insert ministry_institution_config" ON ministry_institution_config FOR INSERT WITH CHECK (true);
