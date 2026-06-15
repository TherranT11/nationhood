-- ════════════════════════════════════════════════════════════════════
-- 20270944 — Inflation & Unemployment as real nation stat columns
--
-- The Politicianverse policy menu (policyadmin.html) wants Inflation and
-- Unemployment as targetable stats. Both had been folded away in the alpha
-- refactor: `inflation` was deleted (cost_of_living absorbed its signal) and
-- `unemployment` survived only as an inverted alias onto `unskilled_workers`.
-- This restores them as their own 0–100 columns so target-based policies can
-- drive them.
--
-- Like civil_liberties / population_growth (20270393) these are PURE STATE:
-- nothing in the tick processor moves them on its own yet. Target-based
-- policies write them via the standard convergence path the moment an admin
-- authors a target; events / ministry dynamics are a later wiring decision.
-- The stat list in js/game/stats.js (NATION_STAT_COLUMNS) gains both keys and
-- drops the `inflation`/`unemployment` aliases in the same change, so legacy
-- stat_effect JSON keyed 'unemployment' now hits this column directly instead
-- of the inverted unskilled_workers mapping (intended).
--
-- The electorate's "Unemployment" issue still proxies salience off
-- unskilled_workers/standard_of_living/wages (electorate.js ISSUE_DEFS) — it
-- does not read this column, so no second source of truth is introduced.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.nations
    ADD COLUMN IF NOT EXISTS inflation    NUMERIC NOT NULL DEFAULT 50,
    ADD COLUMN IF NOT EXISTS unemployment NUMERIC NOT NULL DEFAULT 50;

COMMENT ON COLUMN public.nations.inflation IS
    'Inflation, 0–100 (lower is better). Pure state: only target-based policies move it (20270944). Distinct from the cost_of_living signal the electorate reads.';
COMMENT ON COLUMN public.nations.unemployment IS
    'Unemployment, 0–100 (lower is better). Pure state: only target-based policies move it (20270944). The electorate''s Unemployment issue proxies off unskilled_workers, not this column.';

NOTIFY pgrst, 'reload schema';

COMMIT;
