-- ════════════════════════════════════════════════════════════════════════════
-- New stat connections — Apr 26, 2026
--
-- Adds five missing connections that close gaps in existing cascades:
--
--   • Three "low benefits" penalties — the existing rules only reward HIGH
--     benefits (above 50/60/70/80). Without these, having no welfare costs
--     a player nothing on the relevant downstream stats.
--   • A debt-growth → inflation link so runaway borrowing has an inflation
--     consequence (separate from interest_rates, which is already tracked).
--   • An income-inequality → social-mobility link rounding out the existing
--     inequality cascade (which already targets polarization, civil_unrest,
--     crime_rate, housing_affordability — but not mobility itself).
--
-- Read by the tick processor's parseStatConnectionEffects via
-- supabase/functions/advance-tick/index.ts.
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO stat_connections
    (source_stat, source_dir, threshold, target_stat, target_dir, magnitude, delay_ticks, dampening, category, enabled)
VALUES
    ('benefits',          'below', 20, 'poverty_rate',    'up',   0.1,  0, true, 'social',   true),
    ('benefits',          'below', 20, 'civil_unrest',    'up',   0.1,  0, true, 'social',   true),
    ('benefits',          'below', 15, 'happiness',       'down', 0.1,  0, true, 'social',   true),
    ('debt_growth',       'above', 60, 'inflation',       'up',   0.05, 0, true, 'economic', true),
    ('income_inequality', 'above', 60, 'social_mobility', 'down', 0.1,  0, true, 'economic', true);
