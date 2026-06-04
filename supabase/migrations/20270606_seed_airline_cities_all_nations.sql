-- ════════════════════════════════════════════════════════════════════
-- 20270606 — Seed airline cities for every nation + auto-range trigger
--
-- Bug: only Calveth and Avelia have rows in airline_cities (seeded by
-- 20260706 phase 2). Eleven other nations sit at zero — Danwei, Dravka,
-- Flandis, Hajjara, Melizea, Montequilla, Palvera, San Estrella,
-- Sangreza, Sierramar, Vostia — so any airline founded in those nations
-- hits "No cities available — build a Regional HQ to expand beyond your
-- HQ nation" in the Open Route form (entrepreneur-corp.html:5430). The
-- pop_pct trigger from 20270465 explicitly tolerates zero-city nations
-- ("Nation with zero cities is fine"), so the gap is silent.
--
-- admin_create_nation (20270349 / 20270362 / 20270367) doesn't seed
-- airline_cities, and admin_create_hub (20270205 / 20270465) doesn't
-- backfill airline_city_ranges for the city it just inserted — so
-- even hand-seeded cities are range-orphaned and unusable for routes
-- (the route open RPC range-gates on
-- ent_aircraft_designs.range_nm >= distance).
--
-- Fix:
--   1. Add an AFTER-INSERT-FOR-EACH-ROW trigger on airline_cities that
--      fans out airline_city_ranges to every existing city using the
--      same formula 20270465's bulk seed used (within-nation = 2,
--      cross-nation derived from diplomatic_relations.proximity).
--      ON CONFLICT DO NOTHING so re-inserts can't trip the unique pair.
--      Same trigger covers future admin_create_hub calls.
--
--   2. Seed three cities per zero-city nation, placeholder names:
--        "{Nation} Capital" — population_pct = 50, is_capital = TRUE
--        "{Nation} North"   — population_pct = 30, is_capital = FALSE
--        "{Nation} South"   — population_pct = 20, is_capital = FALSE
--      Rename via admin_update_hub afterward when the worldbuilding
--      lands. Weights sum to 100 so the deferred pop_pct constraint
--      trigger (20270465) is satisfied at COMMIT.
--
-- Apply after 20270605. Idempotent: partial re-runs only fill the
-- gaps (the three INSERTs are gated on per-nation city counts).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Fan-out trigger ───────────────────────────────────────────
-- Fires once per inserted airline_cities row. Computes the distance
-- to every OTHER existing city using the 20270465 formula:
--   same nation → 2
--   cross nation → GREATEST(3, LEAST(10,
--                    1 + ROUND((100 - COALESCE(proximity, 0)) / 10)))
-- LEAST/GREATEST canonicalize the pair so the
-- airline_city_ranges_canonical CHECK (city_a_id < city_b_id) holds
-- regardless of insertion order. ON CONFLICT DO NOTHING means a
-- duplicate range (re-insert after a manual range row exists) is a
-- no-op rather than a fatal error.
CREATE OR REPLACE FUNCTION public._trg_airline_cities_fanout_ranges()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO airline_city_ranges (city_a_id, city_b_id, distance)
    SELECT LEAST(e.id, NEW.id),
           GREATEST(e.id, NEW.id),
           CASE
               WHEN e.nation_id = NEW.nation_id THEN 2
               ELSE GREATEST(3, LEAST(10,
                      1 + ROUND((100 - COALESCE(dr.proximity, 0))::numeric / 10)))::int
           END
      FROM airline_cities e
      LEFT JOIN diplomatic_relations dr
        ON (dr.nation_a_id = e.nation_id AND dr.nation_b_id = NEW.nation_id)
        OR (dr.nation_a_id = NEW.nation_id AND dr.nation_b_id = e.nation_id)
     WHERE e.id <> NEW.id
    ON CONFLICT (city_a_id, city_b_id) DO NOTHING;
    RETURN NULL;
END;
$$;

COMMENT ON FUNCTION public._trg_airline_cities_fanout_ranges() IS
    'AFTER INSERT trigger on airline_cities. For each new city, inserts an airline_city_ranges row against every existing city (within-nation = 2; cross-nation derived from diplomatic_relations.proximity per the 20270465 formula). Canonicalises pairs with LEAST/GREATEST to satisfy the city_a_id < city_b_id CHECK. ON CONFLICT DO NOTHING so duplicate inserts are no-ops.';

DROP TRIGGER IF EXISTS trg_airline_cities_fanout_ranges ON airline_cities;
CREATE TRIGGER trg_airline_cities_fanout_ranges
    AFTER INSERT ON airline_cities
    FOR EACH ROW EXECUTE FUNCTION public._trg_airline_cities_fanout_ranges();

-- ── 2. Seed three cities per zero-city nation ────────────────────
-- All three INSERTs gate on COUNT(*) so a partial-state re-run only
-- fills the gaps. The deferred pop_pct CONSTRAINT TRIGGER from
-- 20270465 fires at COMMIT and validates each nation sums to 100.

-- Capital (50%, is_capital = TRUE).
INSERT INTO airline_cities (nation_id, name, population_pct, is_capital)
SELECT n.id, n.name || ' Capital', 50, TRUE
  FROM nations n
 WHERE NOT EXISTS (SELECT 1 FROM airline_cities WHERE nation_id = n.id);

-- North (30%, is_capital = FALSE). Only fills nations that now have
-- exactly the Capital we just inserted.
INSERT INTO airline_cities (nation_id, name, population_pct, is_capital)
SELECT n.id, n.name || ' North', 30, FALSE
  FROM nations n
 WHERE (SELECT COUNT(*) FROM airline_cities WHERE nation_id = n.id) = 1
   AND EXISTS (SELECT 1 FROM airline_cities ac
                WHERE ac.nation_id = n.id
                  AND ac.name = n.name || ' Capital');

-- South (20%, is_capital = FALSE). Only nations now sitting at 2.
INSERT INTO airline_cities (nation_id, name, population_pct, is_capital)
SELECT n.id, n.name || ' South', 20, FALSE
  FROM nations n
 WHERE (SELECT COUNT(*) FROM airline_cities WHERE nation_id = n.id) = 2
   AND EXISTS (SELECT 1 FROM airline_cities ac
                WHERE ac.nation_id = n.id
                  AND ac.name = n.name || ' Capital');

NOTIFY pgrst, 'reload schema';

COMMIT;
