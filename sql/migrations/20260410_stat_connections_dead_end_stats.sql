-- ============================================================================
-- Wire up dead-end stats: cost_of_living, carbon_emissions, ethnic_diversity,
-- plus missing connections for standard_of_living, pollution, trade_balance
-- ============================================================================
--
-- Several stats receive incoming effects but produce zero outgoing cascades,
-- making them dead ends in the simulation graph. This migration connects them
-- so their values actually matter to the rest of the system.
--
-- Dead-end stats fixed:
--   cost_of_living      (6 new outgoing)
--   carbon_emissions    (2 new outgoing)
--   ethnic_diversity    (2 new outgoing)
--
-- Missing connections added:
--   standard_of_living  (1 new outgoing — emigration)
--   pollution           (2 new outgoing — gdp_growth, immigration)
--   trade_balance       (1 new outgoing — manufacturing_output)
-- ============================================================================

BEGIN;

-- ══════════════════════════════════════════════════════════════════════════════
-- Cost of Living — 0 outgoing connections, rising +1.20/tick with no consequence
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO stat_connections
    (source_stat, source_dir, threshold, target_stat, target_dir, magnitude, delay_ticks, dampening, category, enabled)
VALUES
    -- High cost of living erodes quality of life
    ('cost_of_living', 'above', 60, 'standard_of_living', 'down', 0.1,  0, true, 'social', true),
    -- Expensive living makes people unhappy
    ('cost_of_living', 'above', 60, 'happiness',          'down', 0.1,  0, true, 'social', true),
    -- High costs push more people below the poverty line
    ('cost_of_living', 'above', 65, 'poverty_rate',       'up',   0.1,  0, true, 'social', true),
    -- People leave when they can't afford to live
    ('cost_of_living', 'above', 70, 'emigration',         'up',   0.1,  0, true, 'demographic', true),
    -- Expensive destinations deter newcomers
    ('cost_of_living', 'above', 70, 'immigration',        'down', 0.1,  0, true, 'demographic', true),
    -- Cost of living crises are a top real-world protest trigger
    ('cost_of_living', 'above', 75, 'civil_unrest',       'up',   0.1,  0, true, 'governance', true)
ON CONFLICT DO NOTHING;


-- ══════════════════════════════════════════════════════════════════════════════
-- Standard of Living — missing emigration push when low
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO stat_connections
    (source_stat, source_dir, threshold, target_stat, target_dir, magnitude, delay_ticks, dampening, category, enabled)
VALUES
    -- Collapsing living standards drive people out
    ('standard_of_living', 'below', 30, 'emigration', 'up', 0.15, 0, true, 'demographic', true)
ON CONFLICT DO NOTHING;


-- ══════════════════════════════════════════════════════════════════════════════
-- Pollution — missing economic and migration consequences
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO stat_connections
    (source_stat, source_dir, threshold, target_stat, target_dir, magnitude, delay_ticks, dampening, category, enabled)
VALUES
    -- Environmental degradation has economic costs (health, agriculture, productivity)
    ('pollution', 'above', 60, 'gdp_growth',   'down', 0.1, 0, true, 'economic', true),
    -- Severe pollution deters people from moving in
    ('pollution', 'above', 70, 'immigration',  'down', 0.1, 0, true, 'demographic', true)
ON CONFLICT DO NOTHING;


-- ══════════════════════════════════════════════════════════════════════════════
-- Carbon Emissions — 0 outgoing connections, fully orphaned stat
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO stat_connections
    (source_stat, source_dir, threshold, target_stat, target_dir, magnitude, delay_ticks, dampening, category, enabled)
VALUES
    -- High emissions damage international standing
    ('carbon_emissions', 'above', 60, 'international_reputation', 'down', 0.1, 0, true, 'governance', true),
    -- Emissions drive pollution
    ('carbon_emissions', 'above', 50, 'pollution',                'up',   0.1, 0, true, 'environment', true)
ON CONFLICT DO NOTHING;


-- ══════════════════════════════════════════════════════════════════════════════
-- Trade Balance — no stat-link reinforcement of productive sectors
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO stat_connections
    (source_stat, source_dir, threshold, target_stat, target_dir, magnitude, delay_ticks, dampening, category, enabled)
VALUES
    -- Strong export performance reinforces manufacturing capacity
    ('trade_balance', 'above', 70, 'manufacturing_output', 'up', 0.1, 0, true, 'economic', true)
ON CONFLICT DO NOTHING;


-- ══════════════════════════════════════════════════════════════════════════════
-- Ethnic Diversity — 0 outgoing connections
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO stat_connections
    (source_stat, source_dir, threshold, target_stat, target_dir, magnitude, delay_ticks, dampening, category, enabled)
VALUES
    -- Diverse societies face more friction without integration policies
    ('ethnic_diversity', 'above', 70, 'polarization',   'up', 0.1, 0, true, 'social', true),
    -- Diverse workforces drive innovation in services and finance
    ('ethnic_diversity', 'above', 50, 'service_output', 'up', 0.1, 0, true, 'economic', true)
ON CONFLICT DO NOTHING;

COMMIT;
