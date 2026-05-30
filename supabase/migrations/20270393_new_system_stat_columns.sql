-- ════════════════════════════════════════════════════════════════════
-- New System stats — 10 net-new columns on nations
-- ════════════════════════════════════════════════════════════════════
-- User's New System list adds stats the alpha-28 schema didn't track.
-- This migration adds them as raw columns so the modifier admin can
-- attach triggers to them. NO tick mechanics here — these are pure
-- state. How each stat moves (decay, generation cascades, what feeds
-- what) is intentionally deferred; whoever wires policies / events /
-- ministry actions decides their dynamics. The modifier evaluator
-- reads nation[key] directly, so the moment any future system writes
-- to one of these columns, modifier triggers anchored on it begin
-- evaluating.
--
-- Columns added (10):
--
--   civil_liberties        — 0-100 score    default 50
--   energy_generation      — 0-100 score    default 50
--   food                   — 0-100 on-hand  default 50
--   food_generation        — 0-100 score    default 50
--   minerals_generation    — 0-100 score    default 50
--                            (plural to match the existing `minerals`
--                             on-hand column)
--   consumer_goods         — 0-100 on-hand  default 50
--   goods_generation       — 0-100 score    default 50
--                            (paired with consumer_goods; user's
--                             New System list dropped the "consumer"
--                             prefix from the rate side)
--   luxury_goods           — 0-100 on-hand  default 50
--   luxury_generation      — 0-100 score    default 50
--   population_growth      — % per year     default 0
--                            (neutral — population frozen until
--                             something moves it; can be negative)
--
-- LEGACY STAT_KEY_ALIASES IMPACT
-- ─────────────────────────────
-- js/game/stats.js previously had:
--
--     energy_generation:    null,
--     population_growth:    null,
--
-- meaning the apply pipeline silently skipped any legacy policy /
-- event / crisis effect targeting these keys. With the columns now
-- live, those aliases are being dropped (separate commit, same
-- session) — effects targeting energy_generation or population_growth
-- will START applying. If you have legacy stat_effects JSON for
-- either key on rows you don't want to fire, delete or update those
-- rows before applying this migration. To audit:
--
--   SELECT id, name FROM policy_options
--    WHERE stat_effects::text ~ '"energy_generation"|"population_growth"';
--   SELECT id, event_name FROM events
--    WHERE stat_effects::text ~ '"energy_generation"|"population_growth"';
--
-- `freedom_index` (the old civil-liberties name) keeps its null
-- alias on purpose: it's a distinct legacy concept from the new
-- `civil_liberties` column. Old policies referencing freedom_index
-- continue to skip; new ones target civil_liberties directly.
--
-- nations_history is NOT updated here. Snapshots will simply not
-- carry the new columns until sync_nations_history_columns (or
-- equivalent) runs against this schema — adding history is its own
-- concern and not required for the modifier admin path.
--
-- Idempotent: ADD COLUMN IF NOT EXISTS for every column. Re-running
-- on a schema that already has them is a no-op.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.nations
    ADD COLUMN IF NOT EXISTS civil_liberties      NUMERIC NOT NULL DEFAULT 50,
    ADD COLUMN IF NOT EXISTS energy_generation    NUMERIC NOT NULL DEFAULT 50,
    ADD COLUMN IF NOT EXISTS food                 NUMERIC NOT NULL DEFAULT 50,
    ADD COLUMN IF NOT EXISTS food_generation      NUMERIC NOT NULL DEFAULT 50,
    ADD COLUMN IF NOT EXISTS minerals_generation  NUMERIC NOT NULL DEFAULT 50,
    ADD COLUMN IF NOT EXISTS consumer_goods       NUMERIC NOT NULL DEFAULT 50,
    ADD COLUMN IF NOT EXISTS goods_generation     NUMERIC NOT NULL DEFAULT 50,
    ADD COLUMN IF NOT EXISTS luxury_goods         NUMERIC NOT NULL DEFAULT 50,
    ADD COLUMN IF NOT EXISTS luxury_generation    NUMERIC NOT NULL DEFAULT 50,
    ADD COLUMN IF NOT EXISTS population_growth    NUMERIC NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.nations.civil_liberties     IS 'New System stat (20270393). 0-100 score for civic / individual liberties. Default 50.';
COMMENT ON COLUMN public.nations.energy_generation   IS 'New System stat (20270393). 0-100 score for current rate of energy production. Default 50.';
COMMENT ON COLUMN public.nations.food                IS 'New System stat (20270393). 0-100 stock level of food on hand. Default 50.';
COMMENT ON COLUMN public.nations.food_generation     IS 'New System stat (20270393). 0-100 score for current rate of food production. Default 50.';
COMMENT ON COLUMN public.nations.minerals_generation IS 'New System stat (20270393). 0-100 score for current rate of mineral extraction. Default 50. Paired with the existing minerals on-hand column.';
COMMENT ON COLUMN public.nations.consumer_goods      IS 'New System stat (20270393). 0-100 stock level of consumer goods on hand. Default 50.';
COMMENT ON COLUMN public.nations.goods_generation    IS 'New System stat (20270393). 0-100 score for current rate of consumer goods production. Default 50.';
COMMENT ON COLUMN public.nations.luxury_goods        IS 'New System stat (20270393). 0-100 stock level of luxury goods on hand. Default 50.';
COMMENT ON COLUMN public.nations.luxury_generation   IS 'New System stat (20270393). 0-100 score for current rate of luxury goods production. Default 50.';
COMMENT ON COLUMN public.nations.population_growth   IS 'New System stat (20270393). Percentage rate of population change per year; can be negative. Default 0 (population frozen until something moves it).';

NOTIFY pgrst, 'reload schema';

COMMIT;
