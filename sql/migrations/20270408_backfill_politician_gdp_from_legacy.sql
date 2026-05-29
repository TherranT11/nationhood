-- ════════════════════════════════════════════════════════════════════
-- Backfill politician_gdp from legacy nations.gdp ($B → $)
-- ════════════════════════════════════════════════════════════════════
-- The politician-system nation list (first-steps.html, select-nation.html)
-- now reads nations.politician_gdp instead of nations.gdp so its GDP
-- column matches the politician-nation hero card on the Melizea page
-- — the user-visible "single source of truth" fix.
--
-- politician_gdp was added in 20270361 with NOT NULL DEFAULT 0, and
-- only nations created through admin_create_nation after 20270363 (or
-- explicitly seeded — Melizea via 20270404) actually carry a non-zero
-- value. Without this backfill, every other nation (Avelia,
-- Montequilla, Palvera, Sangreza, etc.) would regress from showing
-- e.g. "$420.8" to showing "$0.00" on the politician list.
--
-- Unit conversion: legacy nations.gdp is stored in $B abstract units
-- (e.g. 420.8 = $420.8B per 20261117_seed_nation_gdp_values.sql),
-- while politician_gdp is raw dollars (e.g. 117_300_000_000 =
-- $117.3B per 20270404). Multiplying gdp by 1e9 produces the
-- equivalent dollar amount.
--
-- Scope: only rows where politician_gdp is still at the schema
-- default of 0 — any nation that's been deliberately set (admin form,
-- 20270404 Melizea seed, future per-nation passes) is left alone.
-- Idempotent — re-running is a no-op on rows already backfilled
-- because their politician_gdp will be non-zero.
--
-- ── Note on the underlying architecture ─────────────────────────────
-- This backfill snapshots gdp at the moment of migration. The legacy
-- gdp column continues to drift per tick via applyGdpGrowthDrift
-- (js/game/budget.js); politician_gdp does NOT. The two columns will
-- therefore diverge over time. Resolving that — pick one column as
-- the source and migrate every consumer — is out of scope here. This
-- migration solves the immediate user-visible inconsistency only.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

UPDATE nations
   SET politician_gdp = ROUND(gdp * 1000000000)
 WHERE politician_gdp = 0
   AND gdp IS NOT NULL
   AND gdp > 0;

COMMIT;
