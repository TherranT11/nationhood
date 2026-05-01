-- ══════════════════════════════════════════════════════════════
-- Corp baseline seed: 5 in stats / 100% ownership / 2 Assets / 1 Market Share
--
-- Sets every existing corporation to a uniform baseline. Robust
-- against partial migration history — each column group is gated by
-- an information_schema EXISTS check so the seed silently skips
-- columns whose creator migration hasn't been applied yet.
--
-- Group → creator migration:
--   universal stats              → 20260430_corp_simplify_v2
--   Construction sector stats    → 20260502 (corp_construction stats)
--   Finance sector stats         → 20260514_finance_operations
--   Finance lending_capital_max  → 20260605
--   Finance overleverage_offset  → 20260606
--   Shipping sector stats        → 20260609_shipping_operations_seed
--
-- Universal stats apply to every corp:
--   corp_reputation = corp_innovation = corp_productivity = 5
--   corp_assets      = 2
--   corp_market_share = 1
--
-- Sector stats apply to every corp regardless of sector (test
-- baseline; shared faction schema means columns exist for all corps
-- even when they default to 0 for sectors the corp doesn't operate
-- in). All 0-10 stats land on 5 across the board.
--
-- Plus corp_ownership reset to one 100% player-held row per corp.
-- ══════════════════════════════════════════════════════════════


-- ══════════════════════════════════════════════════════════════
-- 1. Universal stats (always exist after 20260430).
-- ══════════════════════════════════════════════════════════════
UPDATE factions
   SET corp_reputation   = 5,
       corp_innovation   = 5,
       corp_productivity = 5,
       corp_assets       = 2,
       corp_market_share = 1
 WHERE faction_type = 'corporation';


-- ══════════════════════════════════════════════════════════════
-- 2. Construction sector stats — gated by corp_work_crews.
-- ══════════════════════════════════════════════════════════════
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = 'factions'
           AND column_name = 'corp_work_crews'
    ) THEN
        UPDATE factions
           SET corp_work_crews          = 5,
               corp_regulatory_standing = 5,
               corp_supply_chain        = 5
         WHERE faction_type = 'corporation';
    END IF;
END $$;


-- ══════════════════════════════════════════════════════════════
-- 3. Finance sector stats (displayed values) — gated by corp_lending_capital.
-- ══════════════════════════════════════════════════════════════
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = 'factions'
           AND column_name = 'corp_lending_capital'
    ) THEN
        UPDATE factions
           SET corp_lending_capital = 5,
               corp_interest_rates  = 5,
               corp_overleverage    = 5
         WHERE faction_type = 'corporation';
    END IF;
END $$;


-- ══════════════════════════════════════════════════════════════
-- 4. Finance lending_capital_max — gated separately (added 20260605).
-- ══════════════════════════════════════════════════════════════
-- Set so the recompute reproduces displayed lending_capital = 5
-- when outstanding = 0 (formula: max - outstanding/$50M, clamped).
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = 'factions'
           AND column_name = 'corp_lending_capital_max'
    ) THEN
        UPDATE factions
           SET corp_lending_capital_max = 5
         WHERE faction_type = 'corporation';
    END IF;
END $$;


-- ══════════════════════════════════════════════════════════════
-- 5. Finance overleverage_offset — gated separately (added 20260606).
-- ══════════════════════════════════════════════════════════════
-- Set so the recompute reproduces displayed overleverage = 5 when
-- the portfolio-derived value is 0 (formula: derived + offset, clamped).
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = 'factions'
           AND column_name = 'corp_overleverage_offset'
    ) THEN
        UPDATE factions
           SET corp_overleverage_offset = 5
         WHERE faction_type = 'corporation';
    END IF;
END $$;


-- ══════════════════════════════════════════════════════════════
-- 6. Shipping sector stats — gated by corp_freighters.
-- ══════════════════════════════════════════════════════════════
-- Overrides the 3 / 5 / 0 founding seed from 20260609 in favor of
-- the uniform 5-across-the-board baseline.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = 'factions'
           AND column_name = 'corp_freighters'
    ) THEN
        UPDATE factions
           SET corp_freighters   = 5,
               corp_fleet_health = 5,
               corp_route_risk   = 5
         WHERE faction_type = 'corporation';
    END IF;
END $$;


-- ══════════════════════════════════════════════════════════════
-- 7. Ownership reset to 100% player-held
-- ══════════════════════════════════════════════════════════════
-- Single transaction so the corp_ownership_sum_check trigger sees
-- 100 at commit. The trigger has an explicit zero-rows escape
-- ("corp dissolved; ownership cleared deliberately") so the DELETE
-- step doesn't trip the sum-to-100 enforcement.
BEGIN;

DELETE FROM corp_ownership
 WHERE corp_id IN (
    SELECT id FROM factions WHERE faction_type = 'corporation'
 );

INSERT INTO corp_ownership (corp_id, holder_type, holder_id, pct)
SELECT id,
       'player',
       COALESCE(linked_user_id, id),
       100
  FROM factions
 WHERE faction_type = 'corporation';

COMMIT;

NOTIFY pgrst, 'reload schema';
