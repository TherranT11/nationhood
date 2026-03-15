-- ============================================================
-- Migration: Melizea starting values for new economy stats
-- + Global stat connectors for manufacturing_output, service_output,
--   cost_of_living, housing_affordability
-- ============================================================

BEGIN;

-- ============================================================
-- 1. Set Melizea starting values for the 4 new stats
-- ============================================================
-- Rationale:
--   manufacturing_output = 35  Resource-rich (oil 92, minerals 74) but poor
--                              infrastructure (42), zero foreign investment,
--                              high instability. Derived trade score ~40.5
--                              but actual output hampered by turmoil.
--   service_output       = 32  Digital infra 38, higher ed 39, credit 56.
--                              Weak currency (20), no FDI, low stability
--                              undercut financial & service sectors.
--   cost_of_living       = 58  Low inflation (2.1%) and cheap fuel (33) but
--                              near-worthless currency (20) makes imports
--                              expensive. Poor logistics raise consumer costs.
--   housing_affordability = 25 Extreme poverty (90), inequality (82),
--                              urbanization (67), and low standard of living
--                              (20) make housing inaccessible for most.

UPDATE nations
SET manufacturing_output    = 35,
    service_output          = 32,
    cost_of_living          = 58,
    housing_affordability   = 25
WHERE name = 'Melizea';

-- ============================================================
-- 2. Global stat connectors for the 4 new economy stats
-- ============================================================
-- These are global (apply to all nations).
-- Pattern: source above/below threshold → target nudged per tick.
-- Dampening ON: effect weakens as target approaches its limit.
-- Magnitudes match existing connector scale (0.1–0.4).

INSERT INTO stat_connections
    (source_stat, source_dir, threshold, target_stat, target_dir, magnitude, delay_ticks, dampening, category, enabled)
VALUES
    -- ── MANUFACTURING OUTPUT connectors ──
    -- Physical infrastructure enables manufacturing (roads, ports, power)
    ('physical_infrastructure', 'above', 30, 'manufacturing_output', 'up', 0.15, 0, true, 'economic', true),
    -- Energy generation powers factories
    ('energy_generation', 'above', 30, 'manufacturing_output', 'up', 0.1, 0, true, 'economic', true),
    -- Higher education provides skilled workers
    ('higher_education', 'above', 40, 'manufacturing_output', 'up', 0.1, 0, true, 'economic', true),
    -- Civil unrest disrupts production
    ('civil_unrest', 'above', 50, 'manufacturing_output', 'down', 0.15, 0, true, 'economic', true),
    -- Foreign investment brings capital and technology
    ('foreign_investment', 'above', 30, 'manufacturing_output', 'up', 0.1, 0, true, 'economic', true),
    -- High corruption increases costs and scares investors
    ('corruption', 'above', 60, 'manufacturing_output', 'down', 0.1, 0, true, 'economic', true),

    -- ── SERVICE OUTPUT connectors ──
    -- Digital infrastructure enables service/finance sectors
    ('digital_infrastructure', 'above', 30, 'service_output', 'up', 0.15, 0, true, 'economic', true),
    -- Higher education provides knowledge workers
    ('higher_education', 'above', 35, 'service_output', 'up', 0.15, 0, true, 'economic', true),
    -- Credit rating attracts financial activity
    ('credit', 'above', 40, 'service_output', 'up', 0.1, 0, true, 'economic', true),
    -- Political instability drives capital flight
    ('stability', 'below', 30, 'service_output', 'down', 0.15, 0, true, 'economic', true),
    -- Corruption undermines trust in financial institutions
    ('corruption', 'above', 60, 'service_output', 'down', 0.1, 0, true, 'economic', true),

    -- ── COST OF LIVING connectors ──
    -- (Lower is better: 0 = very cheap, 100 = extremely expensive)
    -- Inflation directly raises prices (threshold 45 ≈ +3% inflation rate)
    ('inflation', 'above', 45, 'cost_of_living', 'up', 0.2, 0, true, 'economic', true),
    -- Weak currency makes imports expensive
    ('currency_strength', 'below', 40, 'cost_of_living', 'up', 0.15, 0, true, 'economic', true),
    -- High fuel prices raise transport/energy costs across the economy
    ('fuel_prices', 'above', 50, 'cost_of_living', 'up', 0.15, 0, true, 'economic', true),
    -- Strong manufacturing output provides cheaper domestic goods
    ('manufacturing_output', 'above', 40, 'cost_of_living', 'down', 0.1, 0, true, 'economic', true),
    -- High housing costs are a major cost-of-living driver
    ('housing_affordability', 'below', 40, 'cost_of_living', 'up', 0.1, 0, true, 'economic', true),
    -- Cost of living feeds into happiness (expensive = unhappy)
    ('cost_of_living', 'above', 55, 'happiness', 'down', 0.15, 0, true, 'social', true),
    -- Cost of living feeds into poverty
    ('cost_of_living', 'above', 60, 'poverty_rate', 'up', 0.15, 0, true, 'social', true),

    -- ── HOUSING AFFORDABILITY connectors ──
    -- (Higher is better: 100 = very affordable, 0 = unaffordable)
    -- High urbanization strains housing supply
    ('urbanization', 'above', 60, 'housing_affordability', 'down', 0.1, 0, true, 'economic', true),
    -- Income inequality concentrates housing among the wealthy
    ('income_inequality', 'above', 60, 'housing_affordability', 'down', 0.15, 0, true, 'economic', true),
    -- Physical infrastructure enables new housing construction
    ('physical_infrastructure', 'above', 40, 'housing_affordability', 'up', 0.1, 0, true, 'economic', true),
    -- Positive GDP growth stimulates construction (threshold 55 ≈ +0.3% growth)
    ('gdp_growth', 'above', 55, 'housing_affordability', 'up', 0.1, 0, true, 'economic', true),
    -- Low housing affordability drives emigration
    ('housing_affordability', 'below', 30, 'emigration', 'up', 0.1, 0, true, 'social', true),
    -- Low housing affordability feeds civil unrest
    ('housing_affordability', 'below', 25, 'civil_unrest', 'up', 0.15, 0, true, 'social', true),

    -- ── CROSS-CONNECTIONS: new stats affecting GDP growth ──
    -- Manufacturing and services are key GDP drivers
    ('manufacturing_output', 'above', 40, 'gdp_growth', 'up', 0.1, 0, true, 'economic', true),
    ('service_output', 'above', 40, 'gdp_growth', 'up', 0.1, 0, true, 'economic', true),
    -- Collapsed manufacturing/services drag GDP down
    ('manufacturing_output', 'below', 20, 'gdp_growth', 'down', 0.15, 0, true, 'economic', true),
    ('service_output', 'below', 20, 'gdp_growth', 'down', 0.15, 0, true, 'economic', true),

    -- ── CROSS-CONNECTIONS: new stats affecting employment ──
    -- Manufacturing creates jobs
    ('manufacturing_output', 'above', 35, 'unemployment', 'down', 0.15, 0, true, 'economic', true),
    -- Service sector creates jobs
    ('service_output', 'above', 35, 'unemployment', 'down', 0.1, 0, true, 'economic', true);

COMMIT;
