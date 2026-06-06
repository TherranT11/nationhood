-- ════════════════════════════════════════════════════════════════════
-- 20270648 — Avelia industry-base seed
--
-- Same shape as 20270410's Melizea seed: one row per (nation, industry)
-- in nation_industry_bases. Values come from the design pass for Avelia.
-- Where the design pinned a flat number, it lands as-is. Where it pinned
-- a corp-count formula, the value is computed from entrepreneur_corps
-- (current HQ'd-in-Avelia counts) at apply time and rounded to smallint.
--
-- Formulas:
--   shipping     = 4 + shipping corps in nation
--   construction = round(2 + 0.5 × construction corps in nation)
-- Both clamp to the 0..10 CHECK on nation_industry_bases.base.
--
-- Re-runnable: ON CONFLICT (nation_id, industry_key) DO UPDATE.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── Flat values ─────────────────────────────────────────────────────
INSERT INTO nation_industry_bases (nation_id, industry_key, base)
SELECT n.id, x.industry_key,
       LEAST(10, GREATEST(0, x.base))::smallint
  FROM nations n
  CROSS JOIN (VALUES
      -- Extractive
      ('oil_gas',            1),
      ('mining',             1),
      ('agriculture',        1),
      ('fisheries',          2),
      -- Finance
      ('commercial_banking', 4),  -- 3 + 0.5 × banking corps (2 corps → 4)
      ('insurance',          4),
      ('capital_markets',    7),
      ('currency_exchange',  4),
      -- Transportation & Logistics
      ('aviation',           3),
      ('trucking',           3),
      ('rail_transit',       1),
      -- Industrial & Construction
      ('heavy_mfg',          0),
      ('petrochem',          0),
      ('textiles',           0),
      -- Consumer & Service
      ('real_estate',        4),  -- 2 + real_estate corps (2 corps → 4)
      ('retail',             4),
      ('hospitality',        4),
      ('media_telecom',      3)
  ) AS x(industry_key, base)
 WHERE n.name = 'Avelia'
ON CONFLICT (nation_id, industry_key) DO UPDATE SET base = EXCLUDED.base;

-- ── Formula values — read corp counts from entrepreneur_corps ────────
-- shipping = 4 + shipping corps
INSERT INTO nation_industry_bases (nation_id, industry_key, base)
SELECT n.id, 'shipping',
       LEAST(10, GREATEST(0,
           4 + (SELECT COUNT(*) FROM entrepreneur_corps
                  WHERE hq_nation_id = n.id AND industry = 'shipping')
       ))::smallint
  FROM nations n
 WHERE n.name = 'Avelia'
ON CONFLICT (nation_id, industry_key) DO UPDATE SET base = EXCLUDED.base;

-- construction = round(2 + 0.5 × construction corps)
INSERT INTO nation_industry_bases (nation_id, industry_key, base)
SELECT n.id, 'construction',
       LEAST(10, GREATEST(0,
           ROUND(2 + 0.5 * (SELECT COUNT(*) FROM entrepreneur_corps
                              WHERE hq_nation_id = n.id AND industry = 'construction'))
       ))::smallint
  FROM nations n
 WHERE n.name = 'Avelia'
ON CONFLICT (nation_id, industry_key) DO UPDATE SET base = EXCLUDED.base;

COMMIT;
