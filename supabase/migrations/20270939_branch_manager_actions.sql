-- ════════════════════════════════════════════════════════════════════
-- 20270939 — Branch Manager career actions (banking management, rung 1)
--
-- The banking management track (20270898) shipped ladder-only. This is
-- its first action kit — the rung-1 Branch Manager's three field moves,
-- mirroring the automotive engineer kits (20270845): one action per tick
-- (factions.biz_action_tick), gated on the live hire row, free of the
-- owner's executive action.
--
--   1. deposit_drive — the next deposit settlement pulls in an extra 10%
--      of the gap to equilibrium per pending charge (savers walk in
--      faster). Buff on the corp, consumed by _bank_settle_deposits.
--   2. trim_carry    — the next settlement's deposit-interest cost drops
--      10% per pending charge. Same buff-then-settle shape.
--   3. work_branch   — a 1.5x-pay tick: the bank pays the manager a
--      half-tick salary bonus from the vault (on top of normal payroll),
--      booked as a deductible wage expense. No buff — pays immediately.
--
-- Each charge caps at the bank's branch tier (1..5), so a wider network
-- absorbs more manager effort. Every action writes a Corporate History
-- line on the bank.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Deposit buffs the Branch Manager queues onto the bank ──────────
ALTER TABLE public.entrepreneur_corps
    ADD COLUMN IF NOT EXISTS bank_deposit_drive int NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS bank_carry_trim    int NOT NULL DEFAULT 0;

-- ── 2. Settlement consumes the buffs ─────────────────────────────────
-- Re-emits _bank_settle_deposits (20270897) byte-for-byte EXCEPT three
-- seams: Trim scales the window's interest cost, Drive adds to the drift
-- toward equilibrium (never overshooting it), and both reset to 0 — but
-- only inside the v_ticks > 0 block, so a buff rides the next REAL
-- settlement and a no-op call (same tick) never burns it.
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
    v_demand   numeric;
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
    v_share := _bank_pool_share(v_corp.bank_branch_tier);
    v_speed := CASE LEAST(5, GREATEST(0, COALESCE(v_corp.bank_branch_tier, 1)))
                   WHEN 1 THEN 0.03 WHEN 2 THEN 0.05 WHEN 3 THEN 0.07
                   WHEN 4 THEN 0.10 WHEN 5 THEN 0.14 ELSE 0 END;
    v_factor := _bank_rate_factor(v_corp.bank_deposit_rate_bps);
    v_pool := GREATEST(0, COALESCE(v_nation.population, 0))
              * GREATEST(1, COALESCE(v_nation.standard_of_living, 50)) / 50.0
              * 2;
    -- THE COMMONS: the nation's banks together can't aim past the
    -- pool. When total demand (Σ share×factor) exceeds 1, every
    -- bank's equilibrium scales by 1/total — read at THIS bank's
    -- settle, so the landscape is as current as the last actor.
    SELECT COALESCE(SUM(_bank_pool_share(bank_branch_tier)
                        * _bank_rate_factor(bank_deposit_rate_bps)), 0)
      INTO v_demand
      FROM entrepreneur_corps
     WHERE hq_nation_id = v_corp.hq_nation_id AND industry = 'banking';
    v_eq := ROUND(v_pool * v_share * v_factor
                  * CASE WHEN v_demand > 1 THEN 1 / v_demand ELSE 1 END);

    IF v_ticks > 0 THEN
        -- 1. Interest over the window — PATH-EXACT: the base drifts
        --    geometrically toward eq, so the per-tick sum has a
        --    closed form. Deductible, paid from the vault; a dry
        --    vault capitalizes the shortfall.
        IF v_corp.bank_deposit_rate_bps IS NOT NULL AND v_deposits > 0 THEN
            v_cost := ROUND(v_corp.bank_deposit_rate_bps / 10000.0 / 12.0
                * CASE WHEN v_speed = 0 THEN v_deposits * v_ticks
                       ELSE v_eq * v_ticks
                            + (v_deposits - v_eq) * (1 - power(1 - v_speed, v_ticks)) / v_speed
                  END);
            -- TRIM THE CARRY (20270939): each pending charge shaves 10%
            -- off this window's interest before it's paid/logged.
            IF COALESCE(v_corp.bank_carry_trim, 0) > 0 THEN
                v_cost := ROUND(v_cost * GREATEST(0, 1 - 0.10 * v_corp.bank_carry_trim));
            END IF;
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
            -- DEPOSIT DRIVE (20270939): each pending charge closes an
            -- extra 10% of the gap, clamped so the book can't overshoot
            -- equilibrium on the inflow.
            IF COALESCE(v_corp.bank_deposit_drive, 0) > 0 THEN
                v_delta := v_delta + LEAST(
                    ROUND((v_eq - v_deposits) * 0.10 * v_corp.bank_deposit_drive),
                    (v_eq - v_deposits) - v_delta);
            END IF;
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
               bank_deposits_updated_tick = v_tick,
               bank_deposit_drive         = 0,   -- buffs consumed by this settle
               bank_carry_trim            = 0
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

-- ── 3. The Branch Manager kit ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.branch_manager_action(p_action text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_fac     factions%ROWTYPE;
    v_corp    entrepreneur_corps%ROWTYPE;
    v_tick    int;
    v_cap     int;
    v_have    int;
    v_pending int;
    v_name    text;
    v_bonus   bigint;
    v_note    text;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_action NOT IN ('deposit_drive', 'trim_carry', 'work_branch') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'businessman'
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_businessman');
    END IF;
    IF lower(COALESCE(v_fac.status, '')) = 'arrested' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'arrested');
    END IF;
    IF v_fac.biz_employer_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_employed');
    END IF;

    -- The kit belongs to the rung-1 Branch Manager — verified on the
    -- live hire row (management track, rung 1).
    IF NOT EXISTS (
        SELECT 1 FROM job_applicants a
          JOIN job_openings o ON o.id = a.opening_id
         WHERE a.applicant_faction_id = v_fac.id
           AND a.status = 'hired'
           AND o.corp_id = v_fac.biz_employer_corp_id
           AND o.track = 'management'
           AND o.rung = 1
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_branch_manager');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_fac.biz_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps
     WHERE id = v_fac.biz_employer_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.industry <> 'banking' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_a_bank');
    END IF;

    v_name := NULLIF(TRIM(COALESCE(v_fac.leader_first_name, '') || ' '
                          || COALESCE(v_fac.leader_last_name, '')), '');

    -- ── deposit_drive / trim_carry: queue a buff onto the bank ──
    IF p_action IN ('deposit_drive', 'trim_carry') THEN
        v_cap  := GREATEST(1, LEAST(5, COALESCE(v_corp.bank_branch_tier, 1)));
        v_have := COALESCE(CASE p_action WHEN 'deposit_drive' THEN v_corp.bank_deposit_drive
                                         ELSE v_corp.bank_carry_trim END, 0);
        IF v_have >= v_cap THEN
            RETURN jsonb_build_object('success', false, 'reason', 'already_maxed',
                'pending', v_have, 'cap', v_cap);
        END IF;

        UPDATE entrepreneur_corps SET
            bank_deposit_drive = bank_deposit_drive + CASE WHEN p_action = 'deposit_drive' THEN 1 ELSE 0 END,
            bank_carry_trim    = bank_carry_trim    + CASE WHEN p_action = 'trim_carry'    THEN 1 ELSE 0 END
         WHERE id = v_corp.id;
        UPDATE factions SET biz_action_tick = v_tick WHERE id = v_fac.id;
        v_pending := v_have + 1;

        IF p_action = 'deposit_drive' THEN
            v_note := format('Deposit Drive queued (%s/%s) — the next settlement pulls in an extra 10%% of the gap. Back next tick.',
                             v_pending, v_cap);
            PERFORM _log_corp_history(v_corp.id, v_tick,
                format('Branch Manager %s ran a Deposit Drive — the next settlement closes an extra 10%% of the deposit gap.',
                       COALESCE(v_name, 'A branch manager')));
        ELSE
            v_note := format('Carry trim queued (%s/%s) — the next settlement''s deposit interest drops 10%%. Back next tick.',
                             v_pending, v_cap);
            PERFORM _log_corp_history(v_corp.id, v_tick,
                format('Branch Manager %s trimmed the carry — the next settlement''s deposit interest drops 10%%.',
                       COALESCE(v_name, 'A branch manager')));
        END IF;

        RETURN jsonb_build_object('success', true, 'action', p_action,
            'pending', v_pending, 'cap', v_cap, 'note', v_note);
    END IF;

    -- ── work_branch: a 1.5x-pay tick (a half-tick bonus from the vault) ──
    PERFORM _bank_settle_deposits(v_corp.id);
    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = v_fac.biz_employer_corp_id FOR UPDATE;

    v_bonus := FLOOR(GREATEST(0, COALESCE(v_fac.biz_salary_yearly, 0)) / 12.0 * 0.5)::bigint;
    IF v_bonus <= 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_salary');
    END IF;
    IF FLOOR(COALESCE(v_corp.treasury_cash, 0))::bigint < v_bonus THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_treasury',
            'need', v_bonus, 'have', FLOOR(COALESCE(v_corp.treasury_cash, 0))::bigint);
    END IF;

    UPDATE entrepreneur_corps SET treasury_cash = COALESCE(treasury_cash, 0) - v_bonus
     WHERE id = v_corp.id;
    UPDATE factions SET party_funds = COALESCE(party_funds, 0) + v_bonus,
                        biz_action_tick = v_tick
     WHERE id = v_fac.id;
    -- Wages are a deductible expense, same seam payroll uses.
    PERFORM _corp_log_expense(v_corp.id, v_bonus);
    PERFORM _log_corp_history(v_corp.id, v_tick,
        format('Branch Manager %s worked the branch — drew a $%s bonus (1.5x pay).',
               COALESCE(v_name, 'A branch manager'), v_bonus));

    RETURN jsonb_build_object('success', true, 'action', 'work_branch', 'bonus', v_bonus,
        'note', format('You worked the branch — a $%s bonus (1.5x pay) hit your Cash on Hand. Back next tick.', v_bonus));
END $$;

REVOKE EXECUTE ON FUNCTION public.branch_manager_action(text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.branch_manager_action(text) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
