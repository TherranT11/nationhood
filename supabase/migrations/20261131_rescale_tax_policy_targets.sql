-- ════════════════════════════════════════════════════════════════
-- Policy options — rescale tax targets onto the column's 0–10 range
--
-- Every active policy_option authored against income_tax /
-- corporate_tax used a 0–100 percentage-style scale ("Standard Rate
-- = 50", "Heavy Taxation = 90"), but the underlying columns are
-- constrained to 0–10 (nations_tax_rates_range). The mismatch
-- caused processTargetBasedPolicies to attempt out-of-range
-- writes that aborted the entire per-nation stat update.
--
-- Divide every income_tax / corporate_tax target by 10 so the
-- existing policy design intent maps cleanly onto the real column
-- scale:
--     Pro-Business Low Tax   30 →  3
--     Standard Rate          50 →  5
--     Progressive            70 →  7
--     Tax Haven              10 →  1
--     Heavy Taxation         90 →  9
--     No Income Tax           0 →  0
--
-- Idempotent: the WHERE clause filters on the raw text shape so
-- re-running won't re-divide. Other stat keys in the same
-- stat_targets array are left untouched (gdp_growth, inequality,
-- etc. are already on the 0–100 scale they're authored for).
-- ════════════════════════════════════════════════════════════════

BEGIN;

UPDATE public.policy_options
   SET stat_targets = (
       SELECT jsonb_agg(
           CASE
               WHEN elem->>'stat_key' IN ('income_tax', 'corporate_tax')
                    AND (elem->>'target')::numeric > 10
               THEN jsonb_set(elem, '{target}', to_jsonb(ROUND((elem->>'target')::numeric / 10)::int))
               ELSE elem
           END
       )
       FROM jsonb_array_elements(stat_targets) elem
   )
 WHERE stat_targets IS NOT NULL
   AND jsonb_typeof(stat_targets) = 'array'
   AND EXISTS (
       SELECT 1 FROM jsonb_array_elements(stat_targets) e
        WHERE e->>'stat_key' IN ('income_tax', 'corporate_tax')
          AND (e->>'target')::numeric > 10
   );

COMMIT;
