-- ============================================================
-- Migration: Starting values for new economy stats
-- Nations: San Estrella, Palvera, Sangreza, Avelia, Montequilla
-- Stats:   manufacturing_output, service_output,
--          cost_of_living, housing_affordability
-- ============================================================
-- Global stat connectors were already inserted by
-- 20260315_melizea_new_stats_and_connectors.sql — this file
-- only sets per-nation starting values.
-- ============================================================

BEGIN;

-- ============================================================
-- 1. SAN ESTRELLA
-- ============================================================
-- Rationale:
--   manufacturing_output = 35  Island nation with limited heavy industry.
--                              Very high debt-to-GDP (94%) constrains
--                              capital investment. Hurricane exposure
--                              disrupts supply chains. Some light
--                              manufacturing (food processing, textiles).
--   service_output       = 40  Caribbean island leans toward services and
--                              tourism. Functional institutions (presidential
--                              republic since 1978) but fiscal stress from
--                              debt burden limits financial sector depth.
--   cost_of_living       = 55  Island geography inflates import costs.
--                              Near-crippling debt load squeezes public
--                              services. Some local food production offsets
--                              worst effects. Hurricane rebuilding adds
--                              persistent cost pressure.
--   housing_affordability = 32 Limited buildable land on an archipelago.
--                              Government too indebted to subsidize
--                              housing programs. Hurricane damage requires
--                              constant rebuilding, raising construction
--                              costs for everyone.

UPDATE nations
SET manufacturing_output    = 35,
    service_output          = 40,
    cost_of_living          = 55,
    housing_affordability   = 32
WHERE name = 'San Estrella';

-- ============================================================
-- 2. PALVERA
-- ============================================================
-- Rationale:
--   manufacturing_output = 38  Physical infrastructure 45 and higher
--                              education 55 provide a decent foundation.
--                              Low corruption (20) and civil unrest (22)
--                              help. But energy generation only 35, foreign
--                              investment 30, and negligible resources
--                              (oil 8, minerals 12) limit output.
--   service_output       = 42  Higher education 55 and credit 45 support
--                              service growth. Digital infrastructure 40
--                              and stability 68 are adequate. Low corruption
--                              (20) builds trust. Currency weakness (38)
--                              limits international financial activity.
--   cost_of_living       = 55  Low inflation (28) helps but currency
--                              weakness (38) makes imports expensive.
--                              Fuel prices high (62) with almost no
--                              domestic oil (8). Poor energy generation
--                              (35) adds overhead.
--   housing_affordability = 45 Low income inequality (28) is a major
--                              positive. Moderate urbanization (55) and
--                              physical infrastructure (45) adequate.
--                              GDP growth 40 (modest) and emigration 58
--                              (high) offset each other.

UPDATE nations
SET manufacturing_output    = 38,
    service_output          = 42,
    cost_of_living          = 55,
    housing_affordability   = 45
WHERE name = 'Palvera';

-- ============================================================
-- 3. SANGREZA
-- ============================================================
-- Rationale:
--   manufacturing_output = 48  Largest economy in the shard ($528B GDP,
--                              12.5M pop). Moderate stability (65) and
--                              low corruption (25) support industry.
--                              Literacy 82 provides skilled labor. GDP
--                              growth 48 indicates expanding output.
--                              Unemployment 32 suggests some slack.
--   service_output       = 45  Large, diversified economy supports a
--                              substantial service sector. Freedom index
--                              70 and press freedom 72 signal open markets.
--                              Corruption 25 is manageable. Moderate
--                              polarization (48) creates some drag.
--   cost_of_living       = 48  Inflation 38 (moderate) is the main driver.
--                              Largest economy provides scale advantages
--                              and domestic production. GDP growth 48
--                              keeps pace with prices. Moderate but not
--                              severe cost pressure.
--   housing_affordability = 40 Unemployment 32 strains household budgets.
--                              Large population (12.5M) creates urban
--                              housing demand. Moderate governance (efficiency
--                              55) and some polarization (48) limit housing
--                              policy effectiveness.

UPDATE nations
SET manufacturing_output    = 48,
    service_output          = 45,
    cost_of_living          = 48,
    housing_affordability   = 40
WHERE name = 'Sangreza';

-- ============================================================
-- 4. AVELIA
-- ============================================================
-- Rationale:
--   manufacturing_output = 60  Best fundamentals in the shard: lowest
--                              corruption (10), highest literacy (95),
--                              strong GDP growth (55), high efficiency (70).
--                              Very low civil unrest (8) and high stability
--                              (75) mean uninterrupted production.
--   service_output       = 62  Top-tier education (95 literacy), strongest
--                              institutions (freedom 90, press 92, efficiency
--                              70). Very low corruption (10) fosters
--                              financial trust. Low unemployment (18)
--                              indicates a productive knowledge economy.
--   cost_of_living       = 40  Low inflation (25) is the key factor.
--                              Efficient governance (70) keeps overheads
--                              down. Strong domestic output cushions
--                              import dependence. High standard of living
--                              without runaway prices.
--   housing_affordability = 58 Strong GDP growth (55) funds construction.
--                              High efficiency (70) and low corruption (10)
--                              mean policies work. Low polarization (25)
--                              enables housing consensus. Not perfect —
--                              urbanization and growth create some price
--                              pressure.

UPDATE nations
SET manufacturing_output    = 60,
    service_output          = 62,
    cost_of_living          = 40,
    housing_affordability   = 58
WHERE name = 'Avelia';

-- ============================================================
-- 5. MONTEQUILLA
-- ============================================================
-- Rationale:
--   manufacturing_output = 18  Economy in freefall: GDP growth 18
--                              (near-zero), efficiency 28, corruption 45.
--                              Civil unrest 62 shuts down factories.
--                              Stability 32 scares off investors.
--                              High inflation (58) erodes margins.
--   service_output       = 20  Capital flight from stability 32.
--                              Corruption 45 undermines financial trust.
--                              Crime rate 52 and civil unrest 62 make
--                              commerce dangerous. Brain drain likely
--                              with happiness at 28.
--   cost_of_living       = 68  Inflation 58 is the dominant driver.
--                              Supply chains disrupted by civil unrest (62)
--                              and crime (52). Efficiency 28 means
--                              bureaucratic overhead on everything.
--                              Crisis premium on all goods and services.
--   housing_affordability = 20 Extreme civil unrest (62) and instability
--                              (32) halt construction. Unemployment 55
--                              means most cannot afford housing. High
--                              polarization (72) blocks any housing
--                              reform. Government legitimacy (35) too
--                              low to execute programs.

UPDATE nations
SET manufacturing_output    = 18,
    service_output          = 20,
    cost_of_living          = 68,
    housing_affordability   = 20
WHERE name = 'Montequilla';

COMMIT;
