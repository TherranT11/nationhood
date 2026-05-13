-- Commit E2: fold ambassadors out of the game.
--
-- Removes the ambassador system in preparation for the diplomacy "gesture"
-- redesign. The audit found:
--   - 0 active player paths to create or recall ambassadors (UI removed in A/B/C)
--   - bills.js no longer dispatches 'confirmation' bills to an ambassador
--     resolver, processes retirements, or syncs failed confirmations
--   - political-actions.js no longer applies the missing-ambassador
--     approval penalty on the Foreign Minister
--   - government.html, diplomacy.html, bill.html, select-candidate.html,
--     js/common.js no longer read the ambassadors table or expose
--     ambassador-role UI
--
-- Drops in order: dependent FK column first, then the RPC, then the table.
-- Migration is idempotent — uses IF EXISTS so re-runs are safe.

-- 1. Drop the create-nomination RPC (no callers remain).
DROP FUNCTION IF EXISTS public.create_ambassador_nomination_with_bill(
    uuid, uuid, uuid, uuid, text, text, int, int, text, text, int
);

-- 2. Drop the FK + column from bills (bill_type='confirmation' is gone).
ALTER TABLE public.bills
    DROP COLUMN IF EXISTS ambassador_id;

-- 3. Drop the ambassadors table and its indexes.
DROP TABLE IF EXISTS public.ambassadors;
