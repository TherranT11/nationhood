-- Unify tax scale on 0-100.
--
-- THE BUG: three layers disagreed on the income_tax / corporate_tax scale.
--   - policyadmin.html slider: 0-100 (admin enters "Progressive Taxation = 50")
--   - nations.income_tax CHECK constraint: 0-10 (set by 20260430)
--   - tax revenue formula in budget.js: divides by 100 (treats column as %)
-- Migration 20261131 patched (1)↔(2) by squashing every entered target
-- by /10 so it fit the column. But that left the revenue formula reading
-- 5% where the admin meant 50%, so "Progressive Taxation" was producing
-- 90% less revenue than intended.
--
-- THE FIX: expand the column to 0-100 so the admin slider, the storage,
-- the cap, and the revenue formula all agree.
--   a) Widen nations_tax_rates_range to 0-100
--   b) Multiply current nations.income_tax / corporate_tax by 10 so
--      effective rates stay where they are (Hajjara 2 → 20)
--   c) Multiply every policy_options.stat_targets entry for these two
--      keys by 10 — undoes the squash from 20261131
--   d) (JS) NATION_STAT_CAP for these keys raised to 100 in
--      diplomacy-constants.js (separate edit, included in this push)
--
-- After this, admin slider 40 → column 40 → 40% effective tax rate.

BEGIN;

-- ── a) Widen the column constraint ─────────────────────────────────
ALTER TABLE nations DROP CONSTRAINT IF EXISTS nations_tax_rates_range;
ALTER TABLE nations ADD CONSTRAINT nations_tax_rates_range CHECK (
    (income_tax    IS NULL OR income_tax    BETWEEN 0 AND 100) AND
    (corporate_tax IS NULL OR corporate_tax BETWEEN 0 AND 100)
);

-- ── b) Rescale current tax rates ×10 so live nations don't lose 90%
--       of their intended tax rate overnight ──────────────────────
UPDATE nations
   SET income_tax    = LEAST(100, COALESCE(income_tax,    0) * 10),
       corporate_tax = LEAST(100, COALESCE(corporate_tax, 0) * 10);

-- ── c) Undo 20261131's squash of policy_options.stat_targets ───────
-- Multiply every entry for income_tax / corporate_tax by 10 so the
-- target values match the admin's intended 0-100 scale. Clamp to 100
-- so the new values stay within the new column range.
UPDATE policy_options
   SET stat_targets = (
       SELECT jsonb_agg(
           CASE
               WHEN elem->>'stat_key' IN ('income_tax', 'corporate_tax')
               THEN jsonb_set(elem, '{target}',
                    to_jsonb(LEAST(100, ROUND((elem->>'target')::numeric * 10))::int))
               ELSE elem
           END
       )
       FROM jsonb_array_elements(stat_targets) elem
   )
 WHERE stat_targets IS NOT NULL
   AND jsonb_typeof(stat_targets) = 'array'
   AND EXISTS (
       SELECT 1 FROM jsonb_array_elements(stat_targets) elem
       WHERE elem->>'stat_key' IN ('income_tax', 'corporate_tax')
   );

COMMIT;

NOTIFY pgrst, 'reload schema';
