-- ════════════════════════════════════════════════════════════════════
-- Industry base strength per nation
-- ════════════════════════════════════════════════════════════════════
-- politician-economy.html renders each industry's strength as
-- base + floor(corps / 2), capped at 10. The base was hard-zeroed
-- on the frontend pending per-nation values; this migration adds the
-- backing table and seeds Melizea's 20 values per the petrostate
-- design (oil + extractive natural strengths high; manufacturing /
-- finance hollowed; transit / textile floors).
--
-- Schema: one row per (nation, industry_key). Industry keys match the
-- SECTORS taxonomy in politician-economy.html — adding a new key on
-- the frontend and an INSERT here in the same migration keeps the
-- two in sync. Missing rows fall back to base 0 on the page, so a
-- nation that hasn't been authored yet still renders cleanly.
--
-- RLS: authenticated read. There's no client-write path today — the
-- table is admin-seeded via SQL; a future editor would go through a
-- SECURITY DEFINER RPC so admin auth lives at the function layer.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE TABLE IF NOT EXISTS nation_industry_bases (
    id           uuid     PRIMARY KEY DEFAULT gen_random_uuid(),
    nation_id    uuid     NOT NULL REFERENCES nations(id) ON DELETE CASCADE,
    industry_key text     NOT NULL,
    base         smallint NOT NULL CHECK (base >= 0 AND base <= 10),
    created_at   timestamptz NOT NULL DEFAULT now(),
    UNIQUE (nation_id, industry_key)
);

CREATE INDEX IF NOT EXISTS idx_nation_industry_bases_nation
    ON nation_industry_bases(nation_id);

ALTER TABLE nation_industry_bases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read" ON nation_industry_bases;
CREATE POLICY "Authenticated read" ON nation_industry_bases
    FOR SELECT TO authenticated USING (true);

COMMENT ON TABLE nation_industry_bases IS
    'Natural-base strength per (nation, industry) on a 0..10 scale, '
    'used by politician-economy.html. Industry keys mirror the SECTORS '
    'taxonomy on that page. Missing rows fall back to 0 on the client.';

-- ── Melizea seed ────────────────────────────────────────────────────
-- Reasoning per industry kept short; rationale fits the petrostate-
-- in-managed-decline character spelled out across earlier design
-- passes (oil-rich, manufacturing hollowed, finance throttled by
-- capital controls, transit neglected, brain drain biting).
INSERT INTO nation_industry_bases (nation_id, industry_key, base)
SELECT n.id, x.industry_key, x.base
  FROM nations n
  CROSS JOIN (VALUES
      -- Extractive
      ('oil_gas',            8),  -- the country's defining industry
      ('mining',             5),  -- bauxite + gold, mid-tier
      ('timber',             4),  -- Amazon-basin interior logging
      ('fisheries',          6),  -- coastal industrial fleet
      -- Finance
      ('commercial_banking', 4),  -- state + private mix, constrained
      ('insurance',          3),  -- small but stable
      ('capital_markets',    2),  -- thin domestic equity market
      ('currency_exchange',  3),  -- capped by capital controls
      -- Transportation & Logistics
      ('shipping',           6),  -- oil-export backbone
      ('aviation',           4),  -- petro-currency holds it up
      ('trucking',           4),  -- fragmented, mostly informal
      ('rail_transit',       2),  -- state-operated, neglected
      -- Industrial & Construction
      ('construction',       4),  -- state infrastructure contracts
      ('heavy_mfg',          2),  -- deindustrialized skeleton crew
      ('petrochem',          4),  -- downstream from oil
      ('textiles',           1),  -- imports flooded the market
      -- Consumer & Service
      ('real_estate',        4),  -- wealth-class currency hedge
      ('retail',             5),  -- chains + black-market parallel
      ('hospitality',        3),  -- recovering slowly
      ('media_telecom',      3)   -- state media dominant
  ) AS x(industry_key, base)
 WHERE n.name = 'Melizea'
ON CONFLICT (nation_id, industry_key) DO UPDATE SET base = EXCLUDED.base;

COMMIT;
