-- ═══════════════════════════════════════════════════════════════════════════════
-- POLITICIAN PRODUCTION STATS — food / consumer goods / luxury goods + generation
-- ═══════════════════════════════════════════════════════════════════════════════
-- Adds the seven missing production/economy columns the modifier admin needs
-- to fire triggers on the politician canonical stat list. Two columns the
-- canonical list calls out (energy_generation, population_growth) already
-- exist on nations (energy_generation via the legacy energy tick logic
-- in js/game/energy.js; population_growth used by issues.js + electorate.js),
-- so this migration only adds the new ones.
--
-- All columns are NUMERIC NOT NULL DEFAULT 50 — matching the existing
-- energy_generation pattern. 50 is the midpoint that lets modifier triggers
-- read "above/below baseline" out of the box without per-nation seeding.
--
-- Convention follows the existing legacy column shape (no politician_*
-- prefix): the politician system shares the same nations row that legacy
-- mechanics read from for non-headline stats. Only the six headline stats
-- (gdp/budget/debt/stability/civil_freedoms/gdp_growth) are forked.
--
-- Pairs added:
--   food / food_generation                    — stock + production rate
--   consumer_goods / consumer_goods_generation
--   luxury_goods   / luxury_goods_generation
--   mineral_generation                        — pairs with existing 'minerals' stock
--
-- No tick-processor wiring is added here. The columns exist so the modifier
-- system can trigger on them; production/consumption math is a separate
-- design pass.
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE nations
    ADD COLUMN IF NOT EXISTS food                      NUMERIC NOT NULL DEFAULT 50,
    ADD COLUMN IF NOT EXISTS food_generation           NUMERIC NOT NULL DEFAULT 50,
    ADD COLUMN IF NOT EXISTS mineral_generation        NUMERIC NOT NULL DEFAULT 50,
    ADD COLUMN IF NOT EXISTS consumer_goods            NUMERIC NOT NULL DEFAULT 50,
    ADD COLUMN IF NOT EXISTS consumer_goods_generation NUMERIC NOT NULL DEFAULT 50,
    ADD COLUMN IF NOT EXISTS luxury_goods              NUMERIC NOT NULL DEFAULT 50,
    ADD COLUMN IF NOT EXISTS luxury_goods_generation   NUMERIC NOT NULL DEFAULT 50;

COMMENT ON COLUMN nations.food                      IS '0-100 food stock score for the politician system. Modifier triggers read this. No tick-processor consumption/production yet — held at the seeded value until the production economy is wired.';
COMMENT ON COLUMN nations.food_generation           IS '0-100 food production rate for the politician system. Modifier triggers read this. No tick-processor wiring yet.';
COMMENT ON COLUMN nations.mineral_generation        IS '0-100 mineral production rate (pairs with the existing minerals stock column). Modifier triggers read this.';
COMMENT ON COLUMN nations.consumer_goods            IS '0-100 consumer-goods stock score. Modifier triggers read this.';
COMMENT ON COLUMN nations.consumer_goods_generation IS '0-100 consumer-goods production rate. Modifier triggers read this.';
COMMENT ON COLUMN nations.luxury_goods              IS '0-100 luxury-goods stock score. Modifier triggers read this.';
COMMENT ON COLUMN nations.luxury_goods_generation   IS '0-100 luxury-goods production rate. Modifier triggers read this.';

COMMIT;
