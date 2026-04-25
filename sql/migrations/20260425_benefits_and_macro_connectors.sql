-- ══════════════════════════════════════════════════════════════════════
-- Stat Connections — benefits cascade + macro additions
--
-- Five new threshold connectors (player-requested canon):
--   1. Underfunded benefits drive poverty (mild).
--   2. Underfunded benefits drive civil unrest (mild).
--   3. Severely underfunded benefits drive unhappiness (kicks in lower).
--   4. Runaway debt growth feeds inflation.
--   5. Entrenched income inequality suppresses social mobility
--      (Great-Gatsby-curve effect; pairs with the existing reverse
--      connector at seed line 97 to form a balancing 2-hop loop when both
--      stats are above 60).
--
-- Schema (canonical, per supabase/migrations/20260222_stat_connections.sql):
--   source_stat, source_dir, threshold, target_stat, target_dir,
--   magnitude, delay_ticks, dampening, category, enabled
--
-- Idempotent — relies on uq_stat_connections_key from
-- 20260330_stat_connections_full.sql. Safe to re-run.
-- ══════════════════════════════════════════════════════════════════════

INSERT INTO stat_connections
    (source_stat, source_dir, threshold, target_stat, target_dir, magnitude, delay_ticks, dampening, category, enabled)
VALUES
    -- ══ 🤝 Benefits / welfare cascades ══
    ('benefits', 'below', 20, 'poverty_rate', 'up',   0.1, 0, true, 'social', true),
    ('benefits', 'below', 20, 'civil_unrest', 'up',   0.1, 0, true, 'social', true),
    ('benefits', 'below', 15, 'happiness',    'down', 0.1, 0, true, 'social', true),

    -- ══ 💸 Macro economy ══
    ('debt_growth', 'above', 60, 'inflation', 'up', 0.05, 0, true, 'economic', true),

    -- ══ 🏛️ Inequality → mobility ══
    ('income_inequality', 'above', 60, 'social_mobility', 'down', 0.1, 0, true, 'governance', true)

ON CONFLICT (source_stat, source_dir, threshold, target_stat, target_dir) DO NOTHING;

-- Verify (manual): expect 5 rows added (or 0 if re-running).
-- SELECT source_stat, source_dir, threshold, target_stat, target_dir,
--        magnitude, category, enabled
-- FROM stat_connections
-- WHERE (source_stat = 'benefits' AND source_dir = 'below')
--    OR (source_stat = 'debt_growth' AND threshold = 60 AND target_stat = 'inflation')
--    OR (source_stat = 'income_inequality' AND threshold = 60 AND target_stat = 'social_mobility')
-- ORDER BY source_stat, threshold;
