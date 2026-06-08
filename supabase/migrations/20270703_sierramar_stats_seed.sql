-- ════════════════════════════════════════════════════════════════════
-- 20270703 — Sierramar national stats seed
--
-- Backfills the 17 stat columns the user spec'd. Mix of the
-- politician-system INT columns (read by politician-nation card
-- hero bars) and the canonical-stats NUMERIC columns (read by the
-- cabinet office / economy / modifier-trigger surfaces).
--
-- Spec → column mapping:
--   Stability           45 → politician_stability        (INT, 20270361)
--   GDP_Growth          21 → politician_gdp_growth       (INT, 20270364)
--   Civil Liberties     38 → politician_civil_freedoms   (INT, 20270361 —
--                                                         hero bar)
--                          + civil_liberties             (numeric, 20270393 —
--                                                         New System surface;
--                                                         kept in sync so
--                                                         the two readers
--                                                         agree)
--   Health              78 → health                      (numeric, 20260430)
--   Education           81 → education                   (numeric, 20260430)
--   Infrastructure      21 → infrastructure              (numeric, 20260430)
--   Manufacturing Sector 9 → industry                    (numeric, 20260430;
--                                                         display label
--                                                         varies per surface)
--   Skilled Worker      68 → skilled_workers             (numeric, 20260822)
--   Service Sector      33 → service_sector              (numeric, was 'goods'
--                                                         pre-20260430:phase8)
--   Income Tax          22 → income_tax                  (numeric, legacy)
--   Corporate Tax       10 → corporate_tax               (numeric, legacy)
--   Wages               22 → wages                       (numeric, 20260822)
--   Crime               34 → crime                       (numeric, was
--                                                         'crime_rate' pre-
--                                                         20260430:phase8)
--   Corruption          67 → corruption                  (numeric, legacy)
--   Standard of Living  61 → standard_of_living          (numeric, legacy)
--   Cost of Living      81 → cost_of_living              (numeric, 20260430)
--   Population Growth   45 → population_growth           (numeric, 20270393)
--
-- All targets are valid columns; all values fit the 0-100 range.
-- Idempotent: re-running writes the same numbers.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

UPDATE public.nations SET
    politician_stability       = 45,
    politician_gdp_growth      = 21,
    politician_civil_freedoms  = 38,
    civil_liberties            = 38,
    health                     = 78,
    education                  = 81,
    infrastructure             = 21,
    industry                   = 9,
    skilled_workers            = 68,
    service_sector             = 33,
    income_tax                 = 22,
    corporate_tax              = 10,
    wages                      = 22,
    crime                      = 34,
    corruption                 = 67,
    standard_of_living         = 61,
    cost_of_living             = 81,
    population_growth          = 45
 WHERE name = 'Sierramar';

COMMIT;
