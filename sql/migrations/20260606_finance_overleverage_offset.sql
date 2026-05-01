-- ══════════════════════════════════════════════════════════════
-- Finance Strategic Actions FSA1: corp_overleverage_offset column
--
-- Strategic Actions need somewhere to write that survives the
-- portfolio-derived recompute. 20260605 added corp_lending_capital_max
-- so action-driven lending-capital changes wouldn't get clobbered
-- on the next loan event. Same problem applies to overleverage —
-- the recompute derives it from cash/(cash+outstanding), and any
-- action that pushes overleverage directly would lose its effect
-- the moment a loan flows.
--
-- Fix: split overleverage into two layers, mirroring the lending
-- pattern.
--
--   corp_overleverage         (displayed) = derived_from_portfolio
--                                          + corp_overleverage_offset
--                                            (clamped to [0, 10])
--   corp_overleverage_offset  (action-controlled, default 0)
--
-- Action handlers add Δ to _offset; recompute_finance_stats reads
-- _offset and folds it into the derived value. Range allowed for
-- _offset is [-10, 10] so an action stack can both push the dial
-- well past 0 (high-yield + foreign capital combo) or pull it down
-- below the natural floor (heavy reserve building).
-- ══════════════════════════════════════════════════════════════

-- ── 1. Add the offset column ──
ALTER TABLE factions
  ADD COLUMN IF NOT EXISTS corp_overleverage_offset NUMERIC(4,2) NOT NULL DEFAULT 0;

DO $$ BEGIN
  ALTER TABLE factions
    ADD CONSTRAINT corp_overleverage_offset_range
        CHECK (corp_overleverage_offset BETWEEN -10 AND 10);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMENT ON COLUMN factions.corp_overleverage_offset IS
  'Strategic-Action-controlled offset folded into corp_overleverage on recompute. Default 0; range [-10, 10]. The displayed corp_overleverage = clamp(0, 10, derived_from_portfolio + offset). Allows actions to push the dial without getting clobbered by the next loan event.';

-- Backfill is implicit: ADD COLUMN ... NOT NULL DEFAULT 0 above
-- already populates every existing row with 0. An explicit UPDATE
-- here was originally written but stripped in audit because it was
-- a no-op on first apply (every row already 0) and destructive on
-- re-apply (would reset any player-accrued offsets).

-- ══════════════════════════════════════════════════════════════
-- 2. Replace recompute_finance_stats to fold _offset into overleverage
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
    v_offset          NUMERIC;
    v_lending_capital NUMERIC;
    v_overleverage    NUMERIC;
    v_total_pool      NUMERIC;
    v_reserve_ratio   NUMERIC;
    v_derived_over    NUMERIC;
BEGIN
    SELECT * INTO v_faction FROM factions WHERE id = p_faction_id;
    IF v_faction.id IS NULL
       OR v_faction.faction_type <> 'corporation'
       OR v_faction.corp_sector  <> 'Finance' THEN
        RETURN;
    END IF;

    v_cash := COALESCE(v_faction.corp_cash_reserves, 0);

    SELECT COALESCE(SUM(outstanding), 0) INTO v_outstanding
      FROM bank_loans
     WHERE lender_faction_id = p_faction_id
       AND status IN ('pending_payout', 'active');

    -- ── Lending Capital ──
    -- Remaining-headroom model (unchanged from 20260605):
    --   max - outstanding/$50M, clamped to [0, 10].
    v_max := COALESCE(v_faction.corp_lending_capital_max, 5);
    v_lending_capital := GREATEST(0, LEAST(10,
        v_max - (v_outstanding / 50000000.0)
    ));

    -- ── Overleverage ──
    -- Derived from portfolio + Strategic-Action offset.
    -- derived = (1 - cash/(cash+outstanding)) × 10
    --   50% reserves = 5, 20% = 8 (Stressed), 0% = 10 (Bank Run).
    -- offset is the action-controlled additive layer. Folded in,
    -- then clamped to [0, 10] so the visible range stays bounded.
    v_total_pool := v_cash + v_outstanding;
    IF v_total_pool <= 0 THEN
        v_derived_over := 0;
    ELSE
        v_reserve_ratio := v_cash / v_total_pool;
        v_derived_over := (1 - v_reserve_ratio) * 10;
    END IF;
    v_offset := COALESCE(v_faction.corp_overleverage_offset, 0);
    v_overleverage := GREATEST(0, LEAST(10, v_derived_over + v_offset));

    UPDATE factions
       SET corp_lending_capital = ROUND(v_lending_capital::numeric, 2),
           corp_overleverage    = ROUND(v_overleverage::numeric,    2)
     WHERE id = p_faction_id;
END;
$func$;

GRANT EXECUTE ON FUNCTION recompute_finance_stats(UUID) TO authenticated;

COMMENT ON FUNCTION recompute_finance_stats(UUID) IS
    'Recompute corp_lending_capital + corp_overleverage from the bank''s portfolio + Strategic-Action layers. lending_capital = corp_lending_capital_max − outstanding/$50M (clamped). overleverage = derived_reserve_ratio + corp_overleverage_offset (clamped). Called from accept_loan_offer + pay_out_loan + fire_finance_action.';

-- ══════════════════════════════════════════════════════════════
-- 3. Re-run the backfill so the new offset (default 0) is picked
--    up by every existing Finance corp's stats.
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
