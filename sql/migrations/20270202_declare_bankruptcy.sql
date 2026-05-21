-- ════════════════════════════════════════════════════════════════════
-- DECLARE BANKRUPTCY (2.6.8.6) — owner shuts a corp down
-- ════════════════════════════════════════════════════════════════════
-- The owner/CEO closes their corporation:
--   1. Outstanding debts (this corp as BORROWER) are paid off from the
--      treasury — corp-to-corp loans repay the lender's treasury; Central
--      Bank loans are cleared (capacity freed as the loan leaves 'active').
--   2. If the treasury can't cover every debt, the shortfall is written off
--      (loan → 'defaulted') and the CEO's ent_reputation takes −3.
--   3. Whatever cash remains is distributed to equity holders proportionally
--      (corp_shareholdings); a private corp has no shareholdings, so the
--      founder receives all of it (into party_funds).
--   4. The corp is dissolved. Buildings revert to unowned (owner_corp_id is
--      ON DELETE SET NULL); shareholdings + the now-closed loan rows cascade.
--
-- Lives beside Withdraw / Put Up for Sale as an owner-only header action.
-- SECURITY DEFINER — treasury_cash / party_funds / ent_reputation are
-- client-write-revoked.
--
-- v1 simplifications (documented, not silent): only 'active' loans are
-- real debts ('approved' = accepted-not-disbursed, no money owed — they
-- cascade away with the corp). Loans where this corp is the LENDER cascade-
-- delete on dissolution (those borrowers are freed); liquidating the
-- receivable book is out of scope here.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.declare_bankruptcy(p_corp_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_uid          UUID := auth.uid();
    v_fac          factions%ROWTYPE;
    v_corp         entrepreneur_corps%ROWTYPE;
    v_treasury     BIGINT;
    v_owed         BIGINT;
    v_pay          BIGINT;
    v_any_unpaid   BOOLEAN := false;
    v_total_shares BIGINT;
    v_remaining    BIGINT;
    v_tick         INT;
    r              RECORD;
BEGIN
    IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated'); END IF;
    IF p_corp_id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found'); END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found'); END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur' AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1 FOR UPDATE;
    IF v_fac.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur'); END IF;
    IF v_corp.owner_faction_id <> v_fac.id THEN RETURN jsonb_build_object('success', false, 'reason', 'not_owner'); END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    v_treasury := floor(COALESCE(v_corp.treasury_cash, 0))::bigint;

    -- 1) Repay corp-to-corp loans (this corp as borrower) from treasury.
    --    Each increment UPDATE is row-atomic, so crediting the lender is
    --    race-safe without an explicit lock.
    FOR r IN SELECT id, lender_corp_id, GREATEST(0, principal - total_paid)::bigint AS owed
               FROM corp_loans
              WHERE borrower_corp_id = p_corp_id AND status = 'active'
              ORDER BY created_at ASC NULLS FIRST
              FOR UPDATE
    LOOP
        v_owed := r.owed;
        IF v_owed <= 0 THEN UPDATE corp_loans SET status = 'repaid', payments_remaining = 0 WHERE id = r.id; CONTINUE; END IF;
        v_pay := LEAST(v_treasury, v_owed);
        IF v_pay > 0 THEN
            UPDATE entrepreneur_corps SET treasury_cash = COALESCE(treasury_cash, 0) + v_pay WHERE id = r.lender_corp_id;
            UPDATE corp_loans SET total_paid = total_paid + v_pay WHERE id = r.id;
            v_treasury := v_treasury - v_pay;
        END IF;
        IF v_pay >= v_owed THEN UPDATE corp_loans SET status = 'repaid', payments_remaining = 0 WHERE id = r.id;
        ELSE                    UPDATE corp_loans SET status = 'defaulted' WHERE id = r.id; v_any_unpaid := true; END IF;
    END LOOP;

    -- 2) Clear Central Bank loans (this corp as borrower). Principal frees CB
    --    capacity by leaving 'active'; cash leaves treasury (no party credit).
    FOR r IN SELECT id, GREATEST(0, outstanding)::bigint AS owed
               FROM central_bank_loans
              WHERE borrower_corp_id = p_corp_id AND status = 'active'
              ORDER BY created_at ASC
              FOR UPDATE
    LOOP
        v_owed := r.owed;
        v_pay := LEAST(v_treasury, v_owed);
        v_treasury := v_treasury - v_pay;
        IF v_pay >= v_owed THEN UPDATE central_bank_loans SET status = 'repaid', outstanding = 0 WHERE id = r.id;
        ELSE                    UPDATE central_bank_loans SET status = 'defaulted', outstanding = v_owed - v_pay WHERE id = r.id; v_any_unpaid := true; END IF;
    END LOOP;

    -- 3) CEO reputation hit if any debt was left unpaid.
    IF v_any_unpaid THEN
        UPDATE factions SET ent_reputation = COALESCE(ent_reputation, 0) - 3 WHERE id = v_fac.id;
    END IF;

    -- 4) Distribute remaining cash to equity holders. Public corps split it
    --    proportionally by shareholding (founder included); private corps have
    --    no shareholdings, so the founder receives all of it.
    v_remaining := GREATEST(0, v_treasury);
    SELECT COALESCE(SUM(shares), 0) INTO v_total_shares FROM corp_shareholdings WHERE corp_id = p_corp_id AND shares > 0;
    IF v_remaining > 0 THEN
        IF v_total_shares > 0 THEN
            UPDATE factions f
               SET party_funds = COALESCE(f.party_funds, 0) + (v_remaining * cs.shares / v_total_shares)
              FROM corp_shareholdings cs
             WHERE cs.corp_id = p_corp_id AND cs.shares > 0 AND f.id = cs.holder_faction_id;
        ELSE
            UPDATE factions SET party_funds = COALESCE(party_funds, 0) + v_remaining WHERE id = v_fac.id;
        END IF;
    END IF;

    -- 5) Audit + dissolve. Buildings → unowned (ON DELETE SET NULL);
    --    shareholdings + closed loan rows cascade.
    INSERT INTO event_log (nation_id, faction_id, event_name, description_used, category, trigger_key, effects_applied, fired_at_tick)
    VALUES (v_corp.hq_nation_id, v_fac.id, 'Corporation Bankrupt',
            format('%s declared bankruptcy.%s $%s distributed to equity holders.',
                   v_corp.name,
                   CASE WHEN v_any_unpaid THEN ' Debts went unpaid — CEO reputation −3.' ELSE '' END,
                   v_remaining),
            'corporate', 'corp_bankruptcy',
            jsonb_build_object('corp_id', p_corp_id, 'corp_name', v_corp.name,
                               'remaining_distributed', v_remaining, 'debts_unpaid', v_any_unpaid),
            v_tick);

    DELETE FROM entrepreneur_corps WHERE id = p_corp_id;

    RETURN jsonb_build_object('success', true,
                              'remaining_distributed', v_remaining,
                              'debts_unpaid', v_any_unpaid,
                              'reputation_penalty', CASE WHEN v_any_unpaid THEN -3 ELSE 0 END);
END; $$;

GRANT EXECUTE ON FUNCTION public.declare_bankruptcy(UUID) TO authenticated;

COMMENT ON FUNCTION public.declare_bankruptcy(UUID) IS
    'Owner-only: shut a corp down. Repays active borrower-side debts from treasury (corp loans → lender treasury; CB loans cleared); unpaid shortfall → loan defaulted + CEO ent_reputation −3. Remaining cash distributed to equity holders proportionally (founder gets all if private). Dissolves the corp. SECURITY DEFINER.';

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK ──
-- DROP FUNCTION IF EXISTS public.declare_bankruptcy(UUID);
