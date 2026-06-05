-- ════════════════════════════════════════════════════════════════════
-- 20270631 — politician_reputation: int → numeric (fractional rep)
--
-- Audit on 20270630 caught the +0.3 Reputation reward writing into an
-- int column. Postgres evaluates `int + 0.3` as numeric (5 + 0.3 →
-- 5.3) and then rounds on assignment back to int — 5.3 → 5. So each
-- individual flag-correct call rounds to no change. No matter how
-- many successful flags a civil servant makes, the int column stays
-- where it started. Same defect that 20270461 fixed for the
-- credibility (→ skill) column when local-tier actions started
-- writing 0.5 deltas.
--
-- Convert politician_reputation to numeric so fractional deltas
-- actually accumulate. Existing writers (MP actions 20270433 /
-- 20270460, local actions 20270461 / 20270458, etc.) all pass int
-- deltas (+1, -1); numeric arithmetic on those still produces an
-- integral result. The change is backwards-compatible for them and
-- newly correct for 20270630.
--
-- USING cast preserves all existing data — 5 (int) becomes 5
-- (numeric); no value loss. Stat-card displays in politician-home /
-- party.html etc. show the raw value, so a politician who's accrued
-- e.g. 5.6 rep from paperwork flags will see "5.6" — matches the
-- existing politician_skill fractional-display behaviour that
-- shipped with 20270461.
--
-- Apply after 20270630.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.factions
    ALTER COLUMN politician_reputation TYPE numeric
    USING politician_reputation::numeric;

-- Keep the same DEFAULT 1 / NOT NULL posture the 20270356 declaration
-- shipped with — ALTER COLUMN TYPE preserves NOT NULL but recreates
-- the default on the new type, which postgres handles automatically
-- with no value change for existing rows.

COMMENT ON COLUMN public.factions.politician_reputation IS
    'Politician reputation stat. Was int (20270356); widened to numeric (20270631) so fractional deltas — currently the +0.3 from submit_paperwork_routing — actually accumulate instead of rounding to zero on assignment back to int. Integer-delta writers (MP / local actions) keep working unchanged.';

NOTIFY pgrst, 'reload schema';

COMMIT;
