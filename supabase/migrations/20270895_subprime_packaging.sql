-- ════════════════════════════════════════════════════════════════════
-- 20270895 — Banking executive action #4: Subprime Packaging
--
-- The lucrative, systemic one. The bank bundles junk paper and sells
-- it for an immediate cash payout — but every package feeds a
-- per-nation MARKET HEAT gauge shared by every bank, and rolls
-- against it. The doom clock:
--
--   • Heat: +12 per package (cap 100), cooling 2/tick LAZILY — the
--     live value is max(0, stored - 2 × ticks_elapsed), re-stamped
--     whenever anything touches it. No timers, ever.
--   • Payout: ($1.5M + $50K × heat) × (1 + 10% per Trading Desk
--     level), booked as revenue_finance — taxable income, unlike
--     loan principal. The frenzy pays best right at the cliff.
--   • The roll: 1d100 ≤ heat lights one of the five MARKET CRASH
--     lamps, in order: TOXIC PAPER, OVERLEVERAGE, BLIND RATINGS,
--     CREDIT FREEZE, MARGIN CALL. Lamps are PERMANENT (user ruling:
--     "once a lamp is lit, it's there") — only the crash clears them.
--   • The fifth lamp: THE CRASH. Every bank in the nation takes a
--     30% treasury writedown; the bank that lit it takes 50% — each
--     softened 3%/Vault level past I. Then the run: half the deposit
--     base flees, less 10%/Vault level (floor 10%), and half of all
--     fled money lands at the nation's Vault-V banks (flight to
--     quality; never the trigger bank). The nation takes +10 Unrest; the
--     event log gets its headline; heat resets to 10, lamps to 0.
--     Profits already extracted are untouched — getting out one
--     pull early is the whole game.
--
-- The writedown is a pure treasury loss — deliberately NOT pushed
-- through _corp_log_expense. The payouts were taxed as income on the
-- way in; the crash is not a tax shelter on the way out.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.nations
    ADD COLUMN IF NOT EXISTS market_heat              int NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS market_heat_updated_tick int NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS crash_lamps              int NOT NULL DEFAULT 0
        CHECK (crash_lamps BETWEEN 0 AND 5);

COMMENT ON COLUMN public.nations.market_heat IS
    'Subprime frenzy gauge 0-100 (20270895). Shared by every bank in the nation: +12 per package, -2/tick lazy decay against market_heat_updated_tick. Read live as GREATEST(0, market_heat - 2*(tick - stamp)).';
COMMENT ON COLUMN public.nations.crash_lamps IS
    'Market Crash indicators lit, 0-5 (20270895). Permanent until the fifth lights and the market crashes. Names (client display, in order): Toxic Paper, Overleverage, Blind Ratings, Credit Freeze, Margin Call.';

CREATE OR REPLACE FUNCTION public.bank_package_subprime(
    p_corp_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid      uuid := auth.uid();
    v_bank     entrepreneur_corps%ROWTYPE;
    v_fac      factions%ROWTYPE;
    v_nation   nations%ROWTYPE;
    v_tick     int;
    v_heat     int;
    v_payout   bigint;
    v_roll     int;
    v_lamp_lit boolean := false;
    v_lamps    int;
    v_crashed  boolean := false;
    v_burned   record;
    v_keep     numeric;
    v_flee     numeric;
    v_fled_i   numeric;
    v_fled     numeric := 0;
    v_refuge_ids uuid[];
    v_refuge_id  uuid;
    v_inflow     numeric;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    -- Unlocked read for the cheap gates; the authoritative re-read
    -- happens under lock below.
    SELECT * INTO v_bank FROM entrepreneur_corps WHERE id = p_corp_id;
    IF v_bank.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_bank.industry <> 'banking' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'industry_not_chartered');
    END IF;
    v_fac := _corp_owner_faction(v_bank.owner_faction_id, v_uid);
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;
    IF lower(COALESCE(v_fac.status, '')) = 'arrested' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'arrested');
    END IF;

    -- LOCK ORDER: nation FIRST, then the own corp row. The crash
    -- branch locks every bank in the nation while holding the nation
    -- lock; if packagers took their corp lock before queueing on the
    -- nation, a crash and a concurrent package would deadlock
    -- (A holds nation + wants B's corp; B holds its corp + wants
    -- nation). Nation-first means every packager queues here holding
    -- nothing, and no other banking action ever takes a nation lock.
    SELECT * INTO v_nation FROM nations WHERE id = v_bank.hq_nation_id FOR UPDATE;
    IF v_nation.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_nation');
    END IF;

    -- Now the authoritative corp row, re-checked under lock.
    SELECT * INTO v_bank FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_bank.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    -- Bring the deposit ledger current (20270897) before the frenzy.
    PERFORM _bank_settle_deposits(p_corp_id);

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_bank.exec_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    -- Bring the gauge current (lazy cool), then feed the frenzy.
    v_heat := GREATEST(0, COALESCE(v_nation.market_heat, 0)
                  - 2 * GREATEST(0, v_tick - COALESCE(v_nation.market_heat_updated_tick, v_tick)));
    v_heat := LEAST(100, v_heat + 12);

    -- The payout — richest right at the cliff. Taxable income.
    -- The Trading Desk (20270896 wiring) sweetens every tranche:
    -- +10% per level, The Black Box (V) paying ×1.5. No desk still
    -- packages at base — the desk is appetite, not admission.
    v_payout := ROUND((1500000 + v_heat * 50000)
        * (1 + 0.10 * LEAST(5, GREATEST(0, COALESCE(v_bank.bank_trading_tier, 0)))));

    -- The roll: 1d100 ≤ heat lights the next lamp. Permanent.
    v_roll  := 1 + floor(random() * 100)::int;
    v_lamps := COALESCE(v_nation.crash_lamps, 0);
    IF v_roll <= v_heat THEN
        v_lamp_lit := true;
        v_lamps := v_lamps + 1;
    END IF;
    v_crashed := v_lamps >= 5;

    UPDATE entrepreneur_corps
       SET treasury_cash    = COALESCE(treasury_cash, 0) + v_payout,
           exec_action_tick = v_tick
     WHERE id = p_corp_id;
    INSERT INTO corp_cash_events (corp_id, tick, category, label, delta, nation_id)
    VALUES (p_corp_id, v_tick, 'revenue_finance',
            'Subprime tranches sold', v_payout, v_bank.hq_nation_id);

    IF NOT v_crashed THEN
        UPDATE nations
           SET market_heat              = v_heat,
               market_heat_updated_tick = v_tick,
               crash_lamps              = v_lamps
         WHERE id = v_nation.id;

        PERFORM _log_corp_history(p_corp_id, v_tick,
            format('Packaged subprime tranches — $%s sold. Market Heat %s%s.',
                   v_payout, v_heat,
                   CASE WHEN v_lamp_lit
                        THEN format(', crash indicator %s of 5 lit', v_lamps)
                        ELSE '' END));
    ELSE
        -- ── THE CRASH ─────────────────────────────────────────────
        -- Every bank in the nation holds the paper. The base
        -- writedown is 50% for the bank that lit MARGIN CALL, 30%
        -- for bystanders — each bank's VAULT keeps +3% per level
        -- past I (20270896 wiring). Then the RUN: half the deposit
        -- base flees, less 10% per Vault level past I (floor 10%) —
        -- the claim leaves regardless, the cash only as far as the
        -- post-writedown vault can pay. Fled money is tallied for
        -- the flight to quality below. Pure treasury losses — no
        -- expense deduction (the payouts were taxed as income; the
        -- crash is not a shelter).
        FOR v_burned IN
            SELECT id, bank_vault_tier, bank_deposits FROM entrepreneur_corps
             WHERE hq_nation_id = v_nation.id AND industry = 'banking'
             FOR UPDATE
        LOOP
            v_keep := LEAST(1.0,
                CASE WHEN v_burned.id = p_corp_id THEN 0.50 ELSE 0.70 END
                + 0.03 * GREATEST(0, COALESCE(v_burned.bank_vault_tier, 1) - 1));
            v_flee := GREATEST(0.10,
                0.50 - 0.10 * GREATEST(0, COALESCE(v_burned.bank_vault_tier, 1) - 1));
            v_fled_i := ROUND(COALESCE(v_burned.bank_deposits, 0) * v_flee);
            v_fled   := v_fled + v_fled_i;
            UPDATE entrepreneur_corps
               SET treasury_cash = GREATEST(0,
                       ROUND(COALESCE(treasury_cash, 0) * v_keep) - v_fled_i),
                   bank_deposits = COALESCE(bank_deposits, 0) - v_fled_i,
                   bank_deposits_updated_tick = v_tick
             WHERE id = v_burned.id;
            PERFORM _log_corp_history(v_burned.id, v_tick,
                CASE WHEN v_burned.id = p_corp_id
                     THEN format('MARKET CRASH — your tranches lit the MARGIN CALL. %s%% of the treasury written down; %s%% of depositors besiege the branches.',
                                 ROUND((1 - v_keep) * 100), ROUND(v_flee * 100))
                     ELSE format('MARKET CRASH — the paper went to zero. %s%% of the treasury written down; %s%% of depositors besiege the branches.',
                                 ROUND((1 - v_keep) * 100), ROUND(v_flee * 100)) END);
        END LOOP;

        -- ── FLIGHT TO QUALITY (Vault Level V capstone) ────────────
        -- Panicked money doesn't vanish — half of everything that
        -- fled runs TO the nation's National Depository banks
        -- (Vault V), split among them. The trigger bank is never
        -- the refuge from its own panic. No Depository: the money
        -- stays under mattresses. One query defines who qualifies.
        SELECT array_agg(id) INTO v_refuge_ids FROM entrepreneur_corps
         WHERE hq_nation_id = v_nation.id AND industry = 'banking'
           AND COALESCE(bank_vault_tier, 1) >= 5 AND id <> p_corp_id;
        IF v_refuge_ids IS NOT NULL AND v_fled > 0 THEN
            v_inflow := ROUND(v_fled * 0.5 / array_length(v_refuge_ids, 1));
            FOREACH v_refuge_id IN ARRAY v_refuge_ids LOOP
                UPDATE entrepreneur_corps
                   SET bank_deposits = COALESCE(bank_deposits, 0) + v_inflow,
                       treasury_cash = COALESCE(treasury_cash, 0) + v_inflow,
                       bank_deposits_updated_tick = v_tick
                 WHERE id = v_refuge_id;
                PERFORM _log_corp_history(v_refuge_id, v_tick,
                    format('FLIGHT TO QUALITY — $%s of panicked deposits ran to the National Depository.', v_inflow));
            END LOOP;
        END IF;

        UPDATE nations
           SET market_heat              = 10,
               market_heat_updated_tick = v_tick,
               crash_lamps              = 0,
               unrest                   = LEAST(100, COALESCE(unrest, 0) + 10)
         WHERE id = v_nation.id;

        INSERT INTO event_log (
            nation_id, faction_id, event_name, description_used,
            category, trigger_key, fired_at_tick
        ) VALUES (
            v_nation.id, v_fac.id,
            'Market Crash',
            format('MARKET CRASH IN %s — the subprime market collapses. Depositors besiege the branches; every bank writes down its book. %s packaged the tranche that broke it.',
                   upper(v_nation.name), v_bank.name),
            'economy', 'bank_market_crash', v_tick
        );
    END IF;

    RETURN jsonb_build_object(
        'success',   true,
        'payout',    v_payout,
        'roll',      v_roll,
        'heat',      CASE WHEN v_crashed THEN 10 ELSE v_heat END,
        'lamp_lit',  v_lamp_lit,
        'lamps',     CASE WHEN v_crashed THEN 0 ELSE v_lamps END,
        'crashed',   v_crashed
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.bank_package_subprime(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.bank_package_subprime(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
