-- ═══════════════════════════════════════════════════════════════════════════════
-- IPO CASH CONVERSION + WIPE
-- ═══════════════════════════════════════════════════════════════════════════════
-- Purpose:
--   1. Delete all existing International Party Organizations and related data
--      so the feature can be re-launched with a cash-based economy.
--   2. Widen `solidarity_fund_balance` to BIGINT — the fund now stores DOLLARS
--      (was AP units). 1 AP = $50,000.
--
-- After this migration the IPO feature uses faction.party_funds (cash) for all
-- costs, contributions, and fund draws — no AP anywhere.
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- 1. Wipe all IPO data. Order matters because of foreign keys; using TRUNCATE
--    CASCADE is the cleanest path and resets any sequences too.
TRUNCATE TABLE
    ipo_invitations,
    ipo_fund_transactions,
    ipo_action_log,
    ipo_ballots,
    ipo_votes,
    ipo_chat,
    ipo_members,
    international_orgs
RESTART IDENTITY CASCADE;

-- 2. Widen the fund balance column. Dollar amounts can grow well past INT4
--    (e.g. quarterly $250K contributions × many members × many ticks).
ALTER TABLE international_orgs
    ALTER COLUMN solidarity_fund_balance TYPE BIGINT;

COMMENT ON COLUMN international_orgs.solidarity_fund_balance
    IS 'Solidarity fund balance in dollars (party_funds units). 1 unit = $1.';

-- 3. Widen the per-transaction amount column for the same reason.
ALTER TABLE ipo_fund_transactions
    ALTER COLUMN amount TYPE BIGINT;

COMMENT ON COLUMN ipo_fund_transactions.amount
    IS 'Transaction amount in dollars. Positive = inflow, negative = outflow.';

-- 4. Document the (now misleadingly named) ap_cost column on the action log.
--    The column still holds cost paid by the executing faction, but it's now
--    in dollars (cash) rather than action points.
COMMENT ON COLUMN ipo_action_log.ap_cost
    IS 'Cost paid by the executing faction, in dollars. Column is named ap_cost for legacy reasons.';

COMMIT;
