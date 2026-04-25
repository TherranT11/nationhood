-- ══════════════════════════════════════════════════════════════════════
-- Governance stat connections — gov_approval cascades
--
-- High approval rewards good governance with stability/legitimacy/
-- happiness gains. Low approval cascades damage via political_violence,
-- civil_unrest, foreign_investment loss, and emigration.
--
-- Schema (canonical, per supabase/migrations/20260222_stat_connections.sql):
--   source_stat, source_dir, threshold, target_stat, target_dir,
--   magnitude, delay_ticks, dampening, category, enabled
--
-- gov_approval is a composite computed each tick from
-- institutional(0.45) + outcomes(0.35) + events(0.20). It must be
-- registered in NATION_STAT_COLUMNS for the connector runtime to accept
-- it as a source — see js/game/stats.js.
--
-- Idempotent — relies on uq_stat_connections_key from
-- 20260330_stat_connections_full.sql. Safe to re-run.
-- ══════════════════════════════════════════════════════════════════════

INSERT INTO stat_connections
    (source_stat, source_dir, threshold, target_stat, target_dir, magnitude, delay_ticks, dampening, category, enabled)
VALUES
    -- High approval rewards (above 25 — even modest governance earns stability)
    ('gov_approval', 'above', 25, 'legitimacy',          'up',   0.15, 0, true, 'governance', true),
    ('gov_approval', 'above', 25, 'stability',           'up',   0.1,  0, true, 'governance', true),
    ('gov_approval', 'above', 25, 'happiness',           'up',   0.1,  0, true, 'governance', true),

    -- Low approval penalties (below 10 — government is deeply unpopular)
    ('gov_approval', 'below', 10, 'political_violence',  'up',   0.15, 0, true, 'governance', true),
    ('gov_approval', 'below', 10, 'civil_unrest',        'up',   0.1,  0, true, 'governance', true),
    ('gov_approval', 'below', 10, 'foreign_investment',  'down', 0.1,  0, true, 'governance', true),

    -- Total collapse (approval pinned at 0 — government has lost the country)
    ('gov_approval', 'below', 1,  'emigration',          'up',   0.1,  0, true, 'governance', true)

ON CONFLICT (source_stat, source_dir, threshold, target_stat, target_dir) DO NOTHING;
