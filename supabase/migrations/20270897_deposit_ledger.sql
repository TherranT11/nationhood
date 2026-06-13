-- ════════════════════════════════════════════════════════════════════
-- 20270897 — The deposit ledger: Branch Network goes live
--
-- User-confirmed design: deposits are an ENGINE, not an action. The
-- bank never spends a day gathering them — it builds branches (the
-- ceiling) and posts a deposit rate (the aim), and the base drifts
-- toward equilibrium whenever the bank is touched. Lazy throughout:
-- one stamp (bank_deposits_updated_tick), no timers, the same
-- pattern as Market Heat cooling and loan-interest accrual.
--
-- The math, all of it in ONE place (_bank_settle_deposits — the
-- client renders the RPC's response, no display mirror):
--   • Pool: nation population × (SoL/50) × $2 per capita.
--   • Ceiling by Branch Network level: 4/8/15/25/40% of the pool.
--   • Aim by posted deposit rate: 1% ×0.5 · 2% ×1.0 · 3% ×1.3 ·
--     4% ×1.5. No rate sheet → equilibrium 0 (savers need a number).
--   • Drift: the gap to equilibrium closes 3/5/7/10/14% per tick by
--     branch level, compounded over the elapsed window — in BOTH
--     directions. Cut the rate and the same drift walks deposits
--     back out the door.
--   • Cost: deposit interest accrues on the WINDOW'S STARTING base
--     (rate/12 per tick) and is paid from the treasury at settlement
--     — a deliberate approximation; windows stay short because every
--     banking action and page load settles — a deductible
--     expense (_corp_log_expense), the mirror of loan interest being
--     taxable income. A treasury too dry to pay capitalizes the
--     shortfall INTO the base: unpaid interest is money you now owe
--     your depositors.
--   • Deposits arriving add real treasury cash (lendable); deposits
--     leaving take it back, clamped to what the vault holds — a
--     fully-lent bank can't pay the outflow, and the unpaid claim
--     stays on the book.
--
-- Settlement fires inside every banking executive action (the
-- unmerged 20270893-20270896 emissions gain the call) and via the
-- public bank_settle_deposits wrapper the corp page fires on load —
-- the lazy-resolver pattern, callable by any authenticated player
-- because it only moves state toward the truth.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.entrepreneur_corps
    ADD COLUMN IF NOT EXISTS bank_deposits              numeric NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS bank_deposits_updated_tick int     NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.entrepreneur_corps.bank_deposits IS
    'Household deposit base (20270897) — a liability; the cash itself sits inside treasury_cash. Drifts toward pool × branch share × rate factor, settled lazily by _bank_settle_deposits.';

-- ── The one source of deposit math ────────────────────────────────
-- Caller must hold the corp row lock (every banking action does).
CREATE OR REPLACE FUNCTION public._bank_settle_deposits(p_corp_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_corp     entrepreneur_corps%ROWTYPE;
    v_nation   nations%ROWTYPE;
    v_tick     int;
    v_ticks    int;
    v_share    numeric;
    v_speed    numeric;
    v_factor   numeric;
    v_pool     numeric;
    v_eq       numeric;
    v_deposits numeric;
    v_treasury numeric;
    v_cost     numeric := 0;
    v_paid     numeric := 0;
    v_delta    numeric := 0;
    v_moved    numeric := 0;
BEGIN
    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id;
    IF v_corp.id IS NULL OR v_corp.industry <> 'banking' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_a_bank');
    END IF;
    SELECT * INTO v_nation FROM nations WHERE id = v_corp.hq_nation_id;
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    v_deposits := COALESCE(v_corp.bank_deposits, 0);
    v_treasury := COALESCE(v_corp.treasury_cash, 0);
    -- Stamp 0 means the ledger has never been touched (the column
    -- default — banks founded before their first settlement). Start
    -- the clock now instead of back-filling a thousand-tick window.
    IF COALESCE(v_corp.bank_deposits_updated_tick, 0) = 0 THEN
        UPDATE entrepreneur_corps SET bank_deposits_updated_tick = v_tick
         WHERE id = p_corp_id;
        v_ticks := 0;
    ELSE
        v_ticks := GREATEST(0, v_tick - v_corp.bank_deposits_updated_tick);
    END IF;

    -- The ceiling and the aim (computed even when no time elapsed,
    -- so the snapshot below is always current for the UI).
    v_share := CASE LEAST(5, GREATEST(0, COALESCE(v_corp.bank_branch_tier, 1)))
                   WHEN 1 THEN 0.04 WHEN 2 THEN 0.08 WHEN 3 THEN 0.15
                   WHEN 4 THEN 0.25 WHEN 5 THEN 0.40 ELSE 0 END;
    v_speed := CASE LEAST(5, GREATEST(0, COALESCE(v_corp.bank_branch_tier, 1)))
                   WHEN 1 THEN 0.03 WHEN 2 THEN 0.05 WHEN 3 THEN 0.07
                   WHEN 4 THEN 0.10 WHEN 5 THEN 0.14 ELSE 0 END;
    v_factor := CASE v_corp.bank_deposit_rate_bps
                   WHEN 100 THEN 0.5 WHEN 200 THEN 1.0
                   WHEN 300 THEN 1.3 WHEN 400 THEN 1.5 ELSE 0 END;
    v_pool := GREATEST(0, COALESCE(v_nation.population, 0))
              * GREATEST(1, COALESCE(v_nation.standard_of_living, 50)) / 50.0
              * 2;
    v_eq := ROUND(v_pool * v_share * v_factor);

    IF v_ticks > 0 THEN
        -- 1. Interest on the base over the window — deductible, paid
        --    from the vault; a dry vault capitalizes the shortfall.
        IF v_corp.bank_deposit_rate_bps IS NOT NULL AND v_deposits > 0 THEN
            v_cost := ROUND(v_deposits * v_corp.bank_deposit_rate_bps / 10000.0 / 12.0 * v_ticks);
            v_paid := LEAST(v_cost, GREATEST(0, v_treasury));
            v_treasury := v_treasury - v_paid;
            v_deposits := v_deposits + (v_cost - v_paid);
            IF v_cost > 0 THEN
                PERFORM _corp_log_expense(p_corp_id, ROUND(v_cost)::bigint);
            END IF;
        END IF;

        -- 2. Drift toward equilibrium, compounded over the window.
        v_delta := ROUND(v_eq + (v_deposits - v_eq) * power(1 - v_speed, v_ticks)) - v_deposits;
        IF v_delta > 0 THEN
            v_moved    := v_delta;
            v_treasury := v_treasury + v_delta;
            v_deposits := v_deposits + v_delta;
        ELSIF v_delta < 0 THEN
            -- Withdrawals pay out only what the vault holds; the
            -- unpaid claim stays on the book.
            v_moved    := -LEAST(-v_delta, GREATEST(0, v_treasury));
            v_treasury := v_treasury + v_moved;
            v_deposits := v_deposits + v_moved;
        END IF;

        UPDATE entrepreneur_corps
           SET bank_deposits              = v_deposits,
               treasury_cash              = v_treasury,
               bank_deposits_updated_tick = v_tick
         WHERE id = p_corp_id;
    END IF;

    RETURN jsonb_build_object(
        'success',       true,
        'deposits',      ROUND(v_deposits),
        'equilibrium',   v_eq,
        'pool',          ROUND(v_pool),
        'interest_cost', ROUND(v_cost),
        'flow',          ROUND(v_moved),
        'per_tick_cost', CASE WHEN v_corp.bank_deposit_rate_bps IS NULL THEN 0
                              ELSE ROUND(v_deposits * v_corp.bank_deposit_rate_bps / 10000.0 / 12.0) END
    );
END $$;

REVOKE EXECUTE ON FUNCTION public._bank_settle_deposits(uuid) FROM PUBLIC;

-- ── The public lazy resolver (corp page fires it on load) ─────────
CREATE OR REPLACE FUNCTION public.bank_settle_deposits(p_corp_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_id uuid;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    -- Take the lock here; the internal assumes the caller holds it.
    SELECT id INTO v_id FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    RETURN _bank_settle_deposits(p_corp_id);
END $$;

REVOKE EXECUTE ON FUNCTION public.bank_settle_deposits(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.bank_settle_deposits(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
