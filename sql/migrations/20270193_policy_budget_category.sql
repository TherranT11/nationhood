-- ════════════════════════════════════════════════════════════════════
-- POLICY → explicit budget cost-category
-- ════════════════════════════════════════════════════════════════════
-- Adds policies.budget_category so a policy author can pick which COSTS
-- row the policy's ongoing cost rolls up under, instead of relying on
-- the freeform law_category → regex match (which dumped most policies
-- into "Other Programs").
--
-- Value is a COSTS-panel row key (see _gbBuildCostRows in
-- government.html). NULL = unset → the budget panel falls back to the
-- existing regex match, then "Other Programs" — so every existing
-- policy is unchanged until explicitly recategorised.
--
-- Selectable set is the policy-relevant spending rows only; the rows
-- computed from non-policy sources (public_sector_wages, debt_interest,
-- trade_obligations) are intentionally excluded from the CHECK.
--
-- Display-only: re-bucketing a policy changes which COSTS row shows its
-- cost, not the expenditure total — the server sums all active laws
-- regardless of category, so debt math is unaffected.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE policies ADD COLUMN IF NOT EXISTS budget_category text;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'policies_budget_category_check'
    ) THEN
        ALTER TABLE policies
            ADD CONSTRAINT policies_budget_category_check
            CHECK (budget_category IS NULL OR budget_category IN (
                'welfare_benefits','pension','procurement_capital','subsidies_industry',
                'defense_security','national_infra','sports_culture','foreign_aid',
                'discretionary','regulatory_agencies','other_programs'));
    END IF;
END $$;

COMMENT ON COLUMN policies.budget_category IS
    'Explicit COSTS-panel row key the policy''s ongoing cost rolls up under (welfare_benefits / pension / subsidies_industry / defense_security / national_infra / sports_culture / foreign_aid / procurement_capital / discretionary / regulatory_agencies / other_programs). NULL = fall back to the law_category regex, then Other Programs. Display routing only — does not change the expenditure total.';

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK ──
-- BEGIN;
-- ALTER TABLE policies DROP CONSTRAINT IF EXISTS policies_budget_category_check;
-- ALTER TABLE policies DROP COLUMN IF EXISTS budget_category;
-- COMMIT;
