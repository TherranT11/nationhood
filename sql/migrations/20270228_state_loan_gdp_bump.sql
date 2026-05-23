-- ════════════════════════════════════════════════════════════════════
-- STATE LOAN GDP BUMP — ≥ $30M central-bank loan → +0.1 GDP_Growth (once)
-- ════════════════════════════════════════════════════════════════════
-- Design: any state (Central Bank) loan of at least $30M gives the lending
-- nation a one-time +0.1 GDP_Growth at issue (capital injection stimulates
-- the economy). Applied via award_construction_gdp_bonus — the canonical
-- clamped [0,100] gdp_growth helper — so it stays a single source.
--
-- Body identical to 20270200 plus one IF block after the loan is recorded.
-- Same signature → CREATE OR REPLACE. Idempotent.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.request_central_bank_loan(
    p_corp_id UUID, p_principal BIGINT, p_term_ticks INT
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_uid         UUID := auth.uid();
    v_fac         factions%ROWTYPE;
    v_corp        entrepreneur_corps%ROWTYPE;
    v_nation      nations%ROWTYPE;
    v_capacity    BIGINT;
    v_outstanding BIGINT;
    v_available   BIGINT;
    v_tick        INT;
    v_id          UUID;
BEGIN
    IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated'); END IF;
    IF p_corp_id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found'); END IF;
    IF p_principal IS NULL OR p_principal < 1 THEN RETURN jsonb_build_object('success', false, 'reason', 'invalid_amount'); END IF;
    IF p_term_ticks IS NULL OR p_term_ticks < 12 OR p_term_ticks > 240 THEN RETURN jsonb_build_object('success', false, 'reason', 'invalid_term'); END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found'); END IF;

    -- Caller must own the borrowing corp (VERBATIM the entrepreneur prelude).
    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur' AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1 FOR UPDATE;
    IF v_fac.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur'); END IF;
    IF v_corp.owner_faction_id <> v_fac.id THEN RETURN jsonb_build_object('success', false, 'reason', 'not_owner'); END IF;

    -- The corp's home-nation Central Bank.
    SELECT * INTO v_nation FROM nations WHERE id = v_corp.hq_nation_id FOR UPDATE;
    IF v_nation.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'no_nation'); END IF;
    IF v_nation.central_bank_interest_rate IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_central_bank');
    END IF;

    -- Capacity = discretionary × 100 (raw $); active outstanding draws it down.
    v_capacity := COALESCE(v_nation.central_bank_discretionary, 0) * 100;
    SELECT COALESCE(SUM(outstanding), 0) INTO v_outstanding
      FROM central_bank_loans WHERE nation_id = v_nation.id AND status = 'active';
    v_available := v_capacity - v_outstanding;
    IF p_principal > v_available THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_capacity',
            'available', GREATEST(v_available, 0), 'requested', p_principal);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- Disburse to the corp treasury; record the loan (outstanding = principal).
    UPDATE entrepreneur_corps SET treasury_cash = COALESCE(treasury_cash, 0) + p_principal
     WHERE id = v_corp.id;

    INSERT INTO central_bank_loans
        (nation_id, borrower_corp_id, principal, outstanding, interest_rate, term_ticks, status, started_tick)
    VALUES (v_nation.id, v_corp.id, p_principal, p_principal, v_nation.central_bank_interest_rate, p_term_ticks, 'active', v_tick)
    RETURNING id INTO v_id;

    -- Stimulus: a state loan ≥ $30M gives the lending nation a one-time
    -- +0.1 GDP_Growth (clamped via the shared construction-GDP helper).
    IF p_principal >= 30000000 THEN
        PERFORM award_construction_gdp_bonus(v_nation.id, 0.1);
    END IF;

    INSERT INTO event_log (nation_id, faction_id, event_name, description_used, category, trigger_key, effects_applied, fired_at_tick)
    VALUES (v_nation.id, v_fac.id, 'Central Bank Loan Issued',
            format('%s borrowed $%s from the Central Bank at %s%% over %s ticks.',
                   v_corp.name, p_principal, to_char(v_nation.central_bank_interest_rate, 'FM999990.00'), p_term_ticks),
            'corporate', 'central_bank_loan_issued',
            jsonb_build_object('loan_id', v_id, 'corp_id', v_corp.id, 'principal', p_principal,
                               'rate', v_nation.central_bank_interest_rate, 'term_ticks', p_term_ticks,
                               'gdp_bump', CASE WHEN p_principal >= 30000000 THEN 0.1 ELSE 0 END),
            v_tick);

    RETURN jsonb_build_object('success', true, 'loan_id', v_id, 'principal', p_principal,
                              'rate', v_nation.central_bank_interest_rate, 'term_ticks', p_term_ticks,
                              'available_after', v_available - p_principal,
                              'gdp_bump', CASE WHEN p_principal >= 30000000 THEN 0.1 ELSE 0 END);
END; $$;

GRANT EXECUTE ON FUNCTION public.request_central_bank_loan(UUID, BIGINT, INT) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
