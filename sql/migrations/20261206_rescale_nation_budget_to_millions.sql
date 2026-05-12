-- Rescale nations.budget from raw-dollar storage to the unified $1M abstract
-- scale every other budget-panel column already uses.
--
-- Background: nation.budget was seeded with raw-dollar values (e.g. Sangreza
-- at 967,326,608) but the per-tick tax math in computeIncomeTaxRevenue /
-- computeCorporateTaxRevenue produces small abstract numbers like 78 per
-- tick. The two scales never reconciled, so the Budget card on the budget
-- panel renders an enormous "$967,326,608" next to per-month figures like
-- "$78". Players expect the four budget-panel currencies (Budget, Revenue,
-- Expenditures, Balance) to live on the same scale.
--
-- Effect:
--   - Every nation.budget value > 100,000 is divided by 1,000,000 and rounded.
--     The 100K threshold safely separates raw-dollar values (hundreds of
--     millions and up) from already-abstract values (typically a few hundred
--     to a few thousand) so a row that's already in the new scale isn't
--     rescaled twice.
--   - After this runs, Sangreza's budget goes from 967,326,608 to 967.
--
-- KNOWN FOLLOW-UP — corp_tax_rpcs.sql (20261017):
--   The credit_corp_tax_bill / pay_corp_tax_bill RPCs divide v_paid by 1e9
--   before crediting nation.budget. Under the new scale they should divide
--   by 1e6 instead. Until that's patched, corp tax credits will be 1000x
--   smaller than intended (in practice: invisible, since they'd be sub-$1).
--   Patch that migration in a follow-up.

UPDATE nations
   SET budget = ROUND(budget::numeric / 1000000.0)
 WHERE COALESCE(budget, 0) > 100000;

NOTIFY pgrst, 'reload schema';
