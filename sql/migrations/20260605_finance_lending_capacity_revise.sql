-- ══════════════════════════════════════════════════════════════
-- Finance lending capacity: revise to "remaining headroom" model
--
-- 20260603 shipped recompute_finance_stats with the wrong reading
-- of the spec — the formula was additive (lending_capital rises
-- with outstanding) when the user's intent was the inverse:
-- lending_capital is REMAINING capacity to lend, and outstanding
-- loans CONSUME it.
--
-- New model:
--   * Each Finance corp has a max lending capacity tracked on a
--     new factions.corp_lending_capital_max column. Default = 5
--     (representing $250M of headroom at the $50M-per-stat-point
--     conversion). Strategic Actions raise this; the recompute
--     never touches it.
--   * The displayed lending_capital is computed as:
--         max − outstanding / $50M
--     clamped to [0, 10]. Outstanding loans subtract from the
--     headroom; closing loans returns it.
--
-- Why a new column instead of overloading lending_capital? The
-- recompute fires on every loan event and would clobber any
-- Strategic Action boost otherwise. Splitting "max" (action-
-- controlled, persistent) from "current" (portfolio-derived,
-- recomputed) keeps both axes alive.
--
-- Carry-over note (out of scope here): the existing Strategic
-- Action handlers for Finance corps still write to
-- corp_lending_capital directly. Until they're updated to write to
-- corp_lending_capital_max, action boosts won't survive the next
-- loan event. Tracked for a follow-up Strategic Actions wiring
-- pass; functionally not a regression because actions on
-- pre-revise builds were already getting clobbered the moment a
-- loan flowed.
-- ══════════════════════════════════════════════════════════════

-- ── 1. Add max column ──
ALTER TABLE factions
  ADD COLUMN IF NOT EXISTS corp_lending_capital_max NUMERIC(4,2) NOT NULL DEFAULT 5;

DO $$ BEGIN
  ALTER TABLE factions
    ADD CONSTRAINT corp_lending_capital_max_range
        CHECK (corp_lending_capital_max BETWEEN 0 AND 10);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMENT ON COLUMN factions.corp_lending_capital_max IS
  'Max value of corp_lending_capital before outstanding loans are subtracted. Default 5 (= $250M of headroom). Strategic Actions raise this above 5 to extend lending capacity; recompute_finance_stats never touches it.';

-- Backfill: every existing Finance corp gets the new default. Idempotent —
-- re-running just re-anchors to 5. If a future migration introduces
-- per-corp max overrides, a simple WHERE clause additions here keeps
-- backfill scoped to corps that still hold the default.
UPDATE factions
   SET corp_lending_capital_max = 5
 WHERE faction_type = 'corporation'
   AND corp_sector  = 'Finance';

-- ══════════════════════════════════════════════════════════════
-- 2. Replace recompute_finance_stats with the corrected formula.
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION recompute_finance_stats(p_faction_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
    v_faction         factions%ROWTYPE;
    v_cash            NUMERIC;
    v_outstanding     NUMERIC;
    v_max             NUMERIC;
    v_lending_capital NUMERIC;
    v_overleverage    NUMERIC;
    v_total_pool      NUMERIC;
    v_reserve_ratio   NUMERIC;
BEGIN
    SELECT * INTO v_faction FROM factions WHERE id = p_faction_id;
    IF v_faction.id IS NULL
       OR v_faction.faction_type <> 'corporation'
       OR v_faction.corp_sector  <> 'Finance' THEN
        RETURN;
    END IF;

    v_cash := COALESCE(v_faction.corp_cash_reserves, 0);

    -- Outstanding = sum of unpaid principal across loans this faction
    -- is the lender on. Includes pending_payout because the bank is
    -- already committed at accept time, even though cash hasn't
    -- physically moved yet.
    SELECT COALESCE(SUM(outstanding), 0) INTO v_outstanding
      FROM bank_loans
     WHERE lender_faction_id = p_faction_id
       AND status IN ('pending_payout', 'active');

    -- ── Lending Capital ──
    -- Remaining-headroom model. max_capacity_max defaults to 5
    -- (= $250M at $50M-per-stat); Strategic Actions raise it. Each
    -- $5M outstanding subtracts 0.1 from that max. Clamp to [0, 10]
    -- so neither over-deploy nor an Action push can leave the visible
    -- range.
    v_max := COALESCE(v_faction.corp_lending_capital_max, 5);
    v_lending_capital := GREATEST(0, LEAST(10,
        v_max - (v_outstanding / 50000000.0)
    ));

    -- ── Overleverage ──
    -- Inverted reserve ratio (unchanged from 20260603). 50% reserves
    -- = 5, 20% = 8 (Stressed gate), 0% = 10 (Bank Run threshold).
    v_total_pool := v_cash + v_outstanding;
    IF v_total_pool <= 0 THEN
        v_overleverage := 0;
    ELSE
        v_reserve_ratio := v_cash / v_total_pool;
        v_overleverage := GREATEST(0, LEAST(10,
            (1 - v_reserve_ratio) * 10
        ));
    END IF;

    UPDATE factions
       SET corp_lending_capital = ROUND(v_lending_capital::numeric, 2),
           corp_overleverage    = ROUND(v_overleverage::numeric,    2)
     WHERE id = p_faction_id;
END;
$func$;

GRANT EXECUTE ON FUNCTION recompute_finance_stats(UUID) TO authenticated;

COMMENT ON FUNCTION recompute_finance_stats(UUID) IS
    'Recompute corp_lending_capital + corp_overleverage from the bank''s portfolio. lending_capital = corp_lending_capital_max − outstanding/$50M, clamped to [0, 10]. overleverage = (1 − cash/(cash+outstanding)) × 10. Called from accept_loan_offer + pay_out_loan; Strategic Actions update _max independently.';

-- ══════════════════════════════════════════════════════════════
-- 3. Re-run the one-time backfill so existing Finance corps reflect
--    the corrected formula immediately.
-- ══════════════════════════════════════════════════════════════
DO $$
DECLARE
    v_id UUID;
BEGIN
    FOR v_id IN
        SELECT id FROM factions
         WHERE faction_type = 'corporation'
           AND corp_sector = 'Finance'
    LOOP
        PERFORM recompute_finance_stats(v_id);
    END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
