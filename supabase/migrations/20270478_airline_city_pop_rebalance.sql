-- Rebalance airline_cities.population_pct to the canonical
-- capital-weighted shape.
--
-- Target distribution (per nation, sums to 100):
--   Capital (rank 1): 60
--   Major 1 (rank 2): 25
--   Major 2 (rank 3): 15
--
-- The 20270465 cull left every nation with ≤3 cities, but the
-- inherited weights were the proportional rescale of whatever was
-- seeded before — many ended up flat (e.g. 33/33/33), starving the
-- per-tick demand formula:
--   demand = (origin_pop% + dest_pop%) × (avg SoL/100) × capital_bonus × 0.5
-- Post-rebalance a capital-touching lane in a mid-SoL nation produces
-- ~30 pax/tick instead of ~12, enough for 3-way competition without
-- everyone rounding to 0-1 pax.
--
-- Tiebreak: rank within nation is is_capital DESC, then current
-- population_pct DESC, then created_at ASC — matches the 20270465
-- cull ordering so "major 1" stays the same city it was before.
--
-- The DEFERRABLE INITIALLY DEFERRED sum=100 trigger from 20270465
-- fires at commit; all rows for a nation are updated in one statement
-- so the trigger sees the final consistent state.

BEGIN;

WITH ranked AS (
    SELECT id,
           ROW_NUMBER() OVER (
               PARTITION BY nation_id
               ORDER BY is_capital DESC, population_pct DESC, created_at ASC
           ) AS rk,
           COUNT(*) OVER (PARTITION BY nation_id) AS n
      FROM airline_cities
)
UPDATE airline_cities ac
   SET population_pct = CASE
       WHEN r.n = 1                  THEN 100.00
       WHEN r.n = 2 AND r.rk = 1     THEN  75.00
       WHEN r.n = 2 AND r.rk = 2     THEN  25.00
       WHEN r.n >= 3 AND r.rk = 1    THEN  60.00
       WHEN r.n >= 3 AND r.rk = 2    THEN  25.00
       WHEN r.n >= 3 AND r.rk = 3    THEN  15.00
       ELSE ac.population_pct
   END
  FROM ranked r
 WHERE ac.id = r.id
   AND r.rk <= 3;

COMMIT;
