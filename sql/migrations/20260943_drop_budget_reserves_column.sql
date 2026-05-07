-- ════════════════════════════════════════════════════════════════
-- Kill nation.budget_reserves.
--
-- The column was a holdover from the pre-Phase-8.5.4 budget-bill
-- system. Migration 20260310_final_budget_bill_purge dropped it
-- alongside last_budget_tick when the budget-bill machinery was
-- removed; subsequent migrations + runtime code (trade-transfer
-- execution, chargePolicyUpfrontCost, gov_bailout enactment, the
-- corp-tick buyer payment) re-introduced reads/writes against it
-- as if it still existed. In practice the column was either
-- recreated implicitly via PostgREST schema-cache drift or the
-- 20260310 drop didn't apply to every environment — either way
-- the column was always 0, never populated, and the "draw from
-- reserves first, overflow to debt" pattern silently routed every
-- transfer through the overflow branch (debt grew by the full
-- transfer amount).
--
-- All runtime callers now drain from nation.budget (the abstract
-- treasury, 1 unit = $1B raw) and only overflow to debt when the
-- treasury hits zero — matching the player-facing "Treasury Cash
-- Balance" stat. The reserves column is dead state. Drop it.
--
-- IF EXISTS so this is a no-op against any environment where the
-- 20260310 drop already stuck.
-- ════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE nations DROP COLUMN IF EXISTS budget_reserves;

NOTIFY pgrst, 'reload schema';

COMMIT;
