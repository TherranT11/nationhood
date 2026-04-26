-- ═══════════════════════════════════════════════════════════════════════════════
-- STAT DEBUG LOG — per-tick contributor accounting for one-off investigations
-- ═══════════════════════════════════════════════════════════════════════════════
-- Purpose:
--   When `nations.debug_stat_logging = true`, the three stat processors
--   (processStatEffects / processStatDecay / processStatConnections) write one
--   row per contributor per affected stat per tick. This gives an exact ledger
--   of what moved each stat — so you can SUM(effective_delta) and verify it
--   matches the actual stat delta from the nations_history snapshot.
--
-- Usage:
--   1. UPDATE nations SET debug_stat_logging = true WHERE name = 'Avelia';
--   2. Wait for one tick.
--   3. SELECT contributor_type, contributor_name, raw_rate, multiplier,
--             effective_delta, notes
--      FROM stat_debug_log
--      WHERE nation_id = (SELECT id FROM nations WHERE name='Avelia')
--        AND stat_key = 'gdp_growth'
--        AND tick = (SELECT current_tick FROM shard ORDER BY id DESC LIMIT 1)
--      ORDER BY id;
--   4. Disable when done: UPDATE nations SET debug_stat_logging = false WHERE …
--
-- Removable: DROP TABLE stat_debug_log; ALTER TABLE nations DROP COLUMN debug_stat_logging;
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

CREATE TABLE IF NOT EXISTS stat_debug_log (
    id               BIGSERIAL PRIMARY KEY,
    nation_id        UUID        NOT NULL,
    tick             INTEGER     NOT NULL,
    stat_key         TEXT        NOT NULL,
    contributor_type TEXT        NOT NULL,  -- 'policy' | 'decay' | 'stat_link'
    contributor_name TEXT,
    raw_rate         NUMERIC,
    multiplier       NUMERIC,                -- e.g. dampening or spending-effectiveness; null if not applicable
    effective_delta  NUMERIC,                -- the actual amount the contributor added/subtracted on this tick
    notes            TEXT,
    created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stat_debug_log_lookup
    ON stat_debug_log (nation_id, tick, stat_key);

ALTER TABLE nations
    ADD COLUMN IF NOT EXISTS debug_stat_logging BOOLEAN NOT NULL DEFAULT false;

COMMENT ON TABLE stat_debug_log IS
    'Per-tick contributor ledger for stat changes; written only when nations.debug_stat_logging = true.';

COMMIT;
