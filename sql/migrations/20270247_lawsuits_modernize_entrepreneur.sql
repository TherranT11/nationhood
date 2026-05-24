-- ════════════════════════════════════════════════════════════════════
-- Commercial lawsuits — modernize to the entrepreneur ecosystem
-- ════════════════════════════════════════════════════════════════════
-- The lawsuit feature (Minister-of-Justice docket on government.html) was
-- hard-wired to the now-culled legacy faction-corporation system: it
-- required faction_type='corporation' parties and adjudicated bank_loans
-- disputes via corp_cash_reserves/corp_debt. With legacy corps frozen it
-- could not be filed at all. This re-points it at the LIVE entrepreneur
-- system: entrepreneur_corps litigate corp_loans disputes, money moves
-- through entrepreneur_corps.treasury_cash.
--
-- Scope (decided): LOAN disputes only —
--   • non_payout      — lender corp sues a borrower corp (didn't pay).
--   • predatory_terms — borrower corp sues a lender corp (unfair loan).
-- Full lifecycle kept: file → defendant refute/settle/concede → plaintiff
-- accepts/rejects settle → Minister of Justice rules.
--
-- Deadline handling: NO per-tick sweep (process_lawsuit_deadlines is
-- dropped). The response deadline is enforced at action time (a defendant
-- can't respond past it), and the Justice Minister may rule an overdue
-- unanswered case as a default judgment. Nothing changes state on a timer.
--
-- Relief is computed in ONE place (_lawsuit_apply_plaintiff_relief), shared
-- by a defendant concede and a plaintiff_wins ruling.
--
-- Idempotent. The faction-keyed columns are kept (nullable) for the dead
-- legacy rows; new suits use plaintiff_corp_id / defendant_corp_id.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Schema: entrepreneur-corp parties ──
ALTER TABLE public.commercial_lawsuits
    ADD COLUMN IF NOT EXISTS plaintiff_corp_id UUID REFERENCES public.entrepreneur_corps(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS defendant_corp_id UUID REFERENCES public.entrepreneur_corps(id) ON DELETE CASCADE;
ALTER TABLE public.commercial_lawsuits ALTER COLUMN plaintiff_faction_id DROP NOT NULL;
ALTER TABLE public.commercial_lawsuits ALTER COLUMN defendant_faction_id DROP NOT NULL;
CREATE INDEX IF NOT EXISTS idx_commercial_lawsuits_corp_parties
    ON public.commercial_lawsuits (defendant_corp_id, status);

-- ── 2. Shared plaintiff relief (one source: concede + plaintiff_wins) ──
-- non_payout      → borrower (defendant) pays the lender (plaintiff) the
--                   amount still owed (capped at the borrower's treasury);
--                   loan closed as repaid.
-- predatory_terms → the loan is voided (borrower stops owing); no cash moves
--                   (the cancelled debt IS the relief).
-- Money direction reads from the loan's borrower/lender, so it is correct
-- regardless of which side is plaintiff.
CREATE OR REPLACE FUNCTION public._lawsuit_apply_plaintiff_relief(p_lawsuit_id UUID, p_tick INT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_lawsuit commercial_lawsuits%ROWTYPE;
    v_loan    corp_loans%ROWTYPE;
    v_owed    BIGINT := 0;
    v_pay     BIGINT := 0;
    v_borrower_cash BIGINT := 0;
BEGIN
    SELECT * INTO v_lawsuit FROM commercial_lawsuits WHERE id = p_lawsuit_id;
    SELECT * INTO v_loan FROM corp_loans
     WHERE id = NULLIF(v_lawsuit.relationship_ref->>'id','')::uuid FOR UPDATE;
    IF v_loan.id IS NULL THEN
        RETURN jsonb_build_object('note', 'Underlying corp_loan no longer exists; ruling recorded without execution.');
    END IF;

    IF v_lawsuit.grievance_type = 'non_payout' THEN
        v_owed := GREATEST(0, COALESCE(v_loan.payments_remaining, 0) * COALESCE(v_loan.per_tick_payment, 0));
        SELECT COALESCE(treasury_cash, 0) INTO v_borrower_cash FROM entrepreneur_corps WHERE id = v_loan.borrower_corp_id;
        v_pay := LEAST(v_owed, v_borrower_cash);
        IF v_pay > 0 THEN
            UPDATE entrepreneur_corps SET treasury_cash = COALESCE(treasury_cash,0) - v_pay, updated_at = now()
             WHERE id = v_loan.borrower_corp_id;
            UPDATE entrepreneur_corps SET treasury_cash = COALESCE(treasury_cash,0) + v_pay, updated_at = now()
             WHERE id = v_loan.lender_corp_id;
        END IF;
        UPDATE corp_loans SET status = 'repaid', payments_remaining = 0, last_payment_tick = p_tick
         WHERE id = v_loan.id;
        RETURN jsonb_build_object('grievance', 'non_payout', 'loan_id', v_loan.id,
            'amount_owed', v_owed, 'amount_recovered', v_pay, 'loan_closed', true);
    ELSE  -- predatory_terms
        UPDATE corp_loans SET status = 'repaid', payments_remaining = 0, last_payment_tick = p_tick
         WHERE id = v_loan.id;
        RETURN jsonb_build_object('grievance', 'predatory_terms', 'loan_id', v_loan.id, 'loan_voided', true);
    END IF;
END;
$$;
REVOKE EXECUTE ON FUNCTION public._lawsuit_apply_plaintiff_relief(UUID, INT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public._lawsuit_apply_plaintiff_relief(UUID, INT) TO authenticated, service_role;

-- ── 3. file_commercial_lawsuit (entrepreneur corps + corp_loans) ──
-- Replaces the legacy faction signature.
DROP FUNCTION IF EXISTS public.file_commercial_lawsuit(UUID, UUID, TEXT, TEXT, TEXT, JSONB);
CREATE OR REPLACE FUNCTION public.file_commercial_lawsuit(
    p_plaintiff_corp_id UUID,
    p_defendant_corp_id UUID,
    p_grievance_type    TEXT,        -- 'non_payout' | 'predatory_terms'
    p_relief_sought     TEXT,
    p_loan_id           UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user        UUID := auth.uid();
    v_plaintiff   entrepreneur_corps%ROWTYPE;
    v_defendant   entrepreneur_corps%ROWTYPE;
    v_owner       factions%ROWTYPE;
    v_loan        corp_loans%ROWTYPE;
    v_filing_fee  CONSTANT BIGINT := 2000000;
    v_resp_window CONSTANT INT := 3;
    v_tick        INT;
    v_lawsuit_id  UUID;
    v_chat_id     UUID;
    v_label       TEXT;
    v_desc        TEXT;
BEGIN
    IF v_user IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Not authenticated'); END IF;
    IF p_plaintiff_corp_id = p_defendant_corp_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cannot sue yourself');
    END IF;
    IF p_grievance_type NOT IN ('non_payout','predatory_terms') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Only loan disputes are supported');
    END IF;

    SELECT * INTO v_plaintiff FROM entrepreneur_corps WHERE id = p_plaintiff_corp_id FOR UPDATE;
    IF v_plaintiff.id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Plaintiff corp not found'); END IF;
    SELECT * INTO v_owner FROM factions WHERE id = v_plaintiff.owner_faction_id;
    IF v_owner.id IS NULL
       OR (v_owner.id <> v_user AND COALESCE(v_owner.linked_user_id,'00000000-0000-0000-0000-000000000000'::uuid) <> v_user) THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not own the plaintiff corp');
    END IF;

    SELECT * INTO v_defendant FROM entrepreneur_corps WHERE id = p_defendant_corp_id;
    IF v_defendant.id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Defendant corp not found'); END IF;

    SELECT * INTO v_loan FROM corp_loans WHERE id = p_loan_id;
    IF v_loan.id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Loan not found'); END IF;
    -- non_payout: lender (plaintiff) sues borrower (defendant).
    -- predatory_terms: borrower (plaintiff) sues lender (defendant).
    IF p_grievance_type = 'non_payout' THEN
        IF NOT (v_loan.lender_corp_id = p_plaintiff_corp_id AND v_loan.borrower_corp_id = p_defendant_corp_id) THEN
            RETURN jsonb_build_object('success', false, 'error', 'Non-payout: you must be the lender suing the borrower on this loan');
        END IF;
    ELSE
        IF NOT (v_loan.borrower_corp_id = p_plaintiff_corp_id AND v_loan.lender_corp_id = p_defendant_corp_id) THEN
            RETURN jsonb_build_object('success', false, 'error', 'Predatory terms: you must be the borrower suing the lender on this loan');
        END IF;
    END IF;

    IF COALESCE(v_plaintiff.treasury_cash, 0) < v_filing_fee THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Insufficient treasury for $%s filing fee', to_char(v_filing_fee, 'FM999,999,999')));
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE entrepreneur_corps SET treasury_cash = COALESCE(treasury_cash,0) - v_filing_fee, updated_at = now()
     WHERE id = p_plaintiff_corp_id;

    INSERT INTO commercial_lawsuits (
        plaintiff_corp_id, defendant_corp_id, nation_id,
        grievance_type, grievance_sector, relief_sought,
        relationship_ref, filing_fee, filed_at_tick, response_deadline_tick
    ) VALUES (
        p_plaintiff_corp_id, p_defendant_corp_id, v_plaintiff.hq_nation_id,
        p_grievance_type, 'banking', p_relief_sought,
        jsonb_build_object('kind', 'corp_loan', 'id', p_loan_id),
        v_filing_fee, v_tick, v_tick + v_resp_window
    ) RETURNING id INTO v_lawsuit_id;

    -- Per-lawsuit chat thread (reuses group_chats infra). Members are the
    -- two corp owners; the Justice Minister can post via existing RLS.
    INSERT INTO group_chats (name, chat_type, lawsuit_id, created_by, created_at)
    VALUES ('Lawsuit: ' || COALESCE(v_plaintiff.name,'Plaintiff') || ' v ' || COALESCE(v_defendant.name,'Defendant'),
            'lawsuit', v_lawsuit_id, v_plaintiff.owner_faction_id, now())
    RETURNING id INTO v_chat_id;
    INSERT INTO group_chat_members (chat_id, faction_id) VALUES
        (v_chat_id, v_plaintiff.owner_faction_id),
        (v_chat_id, v_defendant.owner_faction_id)
    ON CONFLICT DO NOTHING;
    UPDATE commercial_lawsuits SET chat_id = v_chat_id WHERE id = v_lawsuit_id;

    v_label := CASE p_grievance_type WHEN 'non_payout' THEN 'Non-Payout' ELSE 'Predatory Terms' END;
    v_desc  := COALESCE(v_plaintiff.name,'A corporation') || ' has filed a lawsuit for ' || v_label
             || ' against ' || COALESCE(v_defendant.name,'another corporation')
             || '. Ministry of Justice reviewing the case now.';

    INSERT INTO event_log (nation_id, event_name, description_chosen, category, trigger_key, effects_applied, fired_at_tick)
    VALUES (v_plaintiff.hq_nation_id, 'Lawsuit Filed: ' || v_label, v_desc, 'corporate', 'lawsuit_filed',
            jsonb_build_object('lawsuit_id', v_lawsuit_id, 'plaintiff_corp_id', p_plaintiff_corp_id,
                'defendant_corp_id', p_defendant_corp_id, 'grievance_type', p_grievance_type,
                'relief_sought', p_relief_sought, 'filing_fee', v_filing_fee), v_tick);

    RETURN jsonb_build_object('success', true, 'lawsuit_id', v_lawsuit_id, 'chat_id', v_chat_id,
        'filing_fee', v_filing_fee, 'response_deadline_tick', v_tick + v_resp_window, 'description', v_desc);
END;
$$;
GRANT EXECUTE ON FUNCTION public.file_commercial_lawsuit(UUID, UUID, TEXT, TEXT, UUID) TO authenticated;

-- ── 4. respond_to_lawsuit (defendant: refute / settle / concede) ──
CREATE OR REPLACE FUNCTION public.respond_to_lawsuit(
    p_lawsuit_id          UUID,
    p_response_kind       TEXT,
    p_defense_text        TEXT,
    p_settle_offer_amount BIGINT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user      UUID := auth.uid();
    v_lawsuit   commercial_lawsuits%ROWTYPE;
    v_defendant entrepreneur_corps%ROWTYPE;
    v_owner     factions%ROWTYPE;
    v_tick      INT;
    v_legal_fee BIGINT := 0;
    v_new_status TEXT;
    v_ruling_window CONSTANT INT := 4;
    v_ruling_deadline INT;
    v_relief    JSONB := '{}'::jsonb;
BEGIN
    IF v_user IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Not authenticated'); END IF;
    IF p_response_kind NOT IN ('refute','settle','concede') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid response kind');
    END IF;

    SELECT * INTO v_lawsuit FROM commercial_lawsuits WHERE id = p_lawsuit_id FOR UPDATE;
    IF v_lawsuit.id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Lawsuit not found'); END IF;
    IF v_lawsuit.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Lawsuit is %s; defendant response only valid while pending', v_lawsuit.status));
    END IF;

    SELECT * INTO v_defendant FROM entrepreneur_corps WHERE id = v_lawsuit.defendant_corp_id FOR UPDATE;
    IF v_defendant.id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Defendant corp no longer exists'); END IF;
    SELECT * INTO v_owner FROM factions WHERE id = v_defendant.owner_faction_id;
    IF v_owner.id IS NULL
       OR (v_owner.id <> v_user AND COALESCE(v_owner.linked_user_id,'00000000-0000-0000-0000-000000000000'::uuid) <> v_user) THEN
        RETURN jsonb_build_object('success', false, 'error', 'You are not the defendant');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    IF v_lawsuit.response_deadline_tick IS NOT NULL AND v_tick > v_lawsuit.response_deadline_tick THEN
        RETURN jsonb_build_object('success', false, 'error', 'Response deadline has passed');
    END IF;

    IF p_response_kind = 'refute' THEN
        v_legal_fee := 5000000;
        v_new_status := 'awaiting_trial';
        v_ruling_deadline := v_tick + v_ruling_window;
        IF p_defense_text IS NULL OR length(trim(p_defense_text)) < 50 THEN
            RETURN jsonb_build_object('success', false, 'error', 'A refutation requires at least 50 characters of defense text');
        END IF;
        IF COALESCE(v_defendant.treasury_cash, 0) < v_legal_fee THEN
            RETURN jsonb_build_object('success', false, 'error', 'Insufficient treasury for $5,000,000 legal fees');
        END IF;
        UPDATE entrepreneur_corps SET treasury_cash = COALESCE(treasury_cash,0) - v_legal_fee, updated_at = now()
         WHERE id = v_defendant.id;
    ELSIF p_response_kind = 'settle' THEN
        IF p_settle_offer_amount IS NULL OR p_settle_offer_amount <= 0 THEN
            RETURN jsonb_build_object('success', false, 'error', 'Settlement offer must be positive');
        END IF;
        IF COALESCE(v_defendant.treasury_cash, 0) < p_settle_offer_amount THEN
            RETURN jsonb_build_object('success', false, 'error', 'Insufficient treasury to back the settlement offer');
        END IF;
        v_new_status := 'settle_offered';
    ELSE  -- concede: defendant admits → apply plaintiff relief immediately
        v_new_status := 'upheld';
        v_relief := _lawsuit_apply_plaintiff_relief(p_lawsuit_id, v_tick);
    END IF;

    UPDATE commercial_lawsuits
       SET status               = v_new_status,
           defendant_response   = p_response_kind,
           responded_at_tick    = v_tick,
           defense_text         = CASE WHEN p_response_kind = 'refute' THEN p_defense_text ELSE NULL END,
           settle_offer_amount  = CASE WHEN p_response_kind = 'settle' THEN p_settle_offer_amount ELSE NULL END,
           closed_at_tick       = CASE WHEN p_response_kind = 'concede' THEN v_tick ELSE closed_at_tick END,
           ruling               = CASE WHEN p_response_kind = 'concede'
                                       THEN jsonb_build_object('kind','concede','ruled_at_tick',v_tick,'executed',v_relief)
                                       ELSE ruling END,
           ruling_deadline_tick = CASE WHEN p_response_kind = 'refute' THEN v_ruling_deadline ELSE ruling_deadline_tick END,
           updated_at           = now()
     WHERE id = p_lawsuit_id;

    RETURN jsonb_build_object('success', true, 'lawsuit_id', p_lawsuit_id, 'new_status', v_new_status,
        'legal_fee', v_legal_fee, 'ruling_deadline_tick', v_ruling_deadline, 'executed', v_relief);
END;
$$;
GRANT EXECUTE ON FUNCTION public.respond_to_lawsuit(UUID, TEXT, TEXT, BIGINT) TO authenticated;

-- ── 5. respond_to_settle_offer (plaintiff: accept / reject) ──
CREATE OR REPLACE FUNCTION public.respond_to_settle_offer(
    p_lawsuit_id UUID,
    p_decision   TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user      UUID := auth.uid();
    v_lawsuit   commercial_lawsuits%ROWTYPE;
    v_plaintiff entrepreneur_corps%ROWTYPE;
    v_defendant entrepreneur_corps%ROWTYPE;
    v_owner     factions%ROWTYPE;
    v_tick      INT;
    v_amount    BIGINT;
BEGIN
    IF v_user IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Not authenticated'); END IF;
    IF p_decision NOT IN ('accept','reject') THEN RETURN jsonb_build_object('success', false, 'error', 'Invalid decision'); END IF;

    SELECT * INTO v_lawsuit FROM commercial_lawsuits WHERE id = p_lawsuit_id FOR UPDATE;
    IF v_lawsuit.id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Lawsuit not found'); END IF;
    IF v_lawsuit.status <> 'settle_offered' THEN
        RETURN jsonb_build_object('success', false, 'error', format('Lawsuit is %s; no settlement offer pending', v_lawsuit.status));
    END IF;

    SELECT * INTO v_plaintiff FROM entrepreneur_corps WHERE id = v_lawsuit.plaintiff_corp_id FOR UPDATE;
    IF v_plaintiff.id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Plaintiff corp no longer exists'); END IF;
    SELECT * INTO v_owner FROM factions WHERE id = v_plaintiff.owner_faction_id;
    IF v_owner.id IS NULL
       OR (v_owner.id <> v_user AND COALESCE(v_owner.linked_user_id,'00000000-0000-0000-0000-000000000000'::uuid) <> v_user) THEN
        RETURN jsonb_build_object('success', false, 'error', 'You are not the plaintiff');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    v_amount := COALESCE(v_lawsuit.settle_offer_amount, 0);

    IF p_decision = 'accept' THEN
        SELECT * INTO v_defendant FROM entrepreneur_corps WHERE id = v_lawsuit.defendant_corp_id FOR UPDATE;
        IF v_defendant.id IS NULL OR COALESCE(v_defendant.treasury_cash, 0) < v_amount THEN
            -- Defendant can no longer back the offer → case proceeds to trial.
            UPDATE commercial_lawsuits SET status = 'awaiting_trial', updated_at = now() WHERE id = p_lawsuit_id;
            RETURN jsonb_build_object('success', false, 'error', 'Defendant no longer has the treasury to settle; case proceeds to trial');
        END IF;
        UPDATE entrepreneur_corps SET treasury_cash = COALESCE(treasury_cash,0) - v_amount, updated_at = now() WHERE id = v_defendant.id;
        UPDATE entrepreneur_corps SET treasury_cash = COALESCE(treasury_cash,0) + v_amount, updated_at = now() WHERE id = v_plaintiff.id;
        UPDATE commercial_lawsuits
           SET status = 'settled', closed_at_tick = v_tick,
               ruling = jsonb_build_object('settled_amount', v_amount, 'method', 'private_settlement'),
               updated_at = now()
         WHERE id = p_lawsuit_id;
    ELSE
        UPDATE commercial_lawsuits SET status = 'awaiting_trial', updated_at = now() WHERE id = p_lawsuit_id;
    END IF;

    RETURN jsonb_build_object('success', true, 'lawsuit_id', p_lawsuit_id, 'decision', p_decision, 'amount', v_amount);
END;
$$;
GRANT EXECUTE ON FUNCTION public.respond_to_settle_offer(UUID, TEXT) TO authenticated;

-- ── 6. issue_ruling (Minister of Justice verdict) ──
-- Rules an awaiting_trial case, OR a still-pending case whose response
-- deadline has passed (default judgment — the defendant ignored it).
CREATE OR REPLACE FUNCTION public.issue_ruling(
    p_lawsuit_id          UUID,
    p_ruling_kind         TEXT,        -- 'plaintiff_wins'|'defendant_wins'|'dismiss'|'settlement'
    p_settlement_relief   JSONB,
    p_settlement_contract JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user      UUID := auth.uid();
    v_lawsuit   commercial_lawsuits%ROWTYPE;
    v_plaintiff entrepreneur_corps%ROWTYPE;
    v_defendant entrepreneur_corps%ROWTYPE;
    v_tick      INT;
    v_judge_party_id UUID;
    v_judge_faction  factions%ROWTYPE;
    v_loan      corp_loans%ROWTYPE;
    v_def_legal_fee BIGINT := 5000000;
    v_relief_amount BIGINT := 0;
    v_relief_recipient TEXT;
    v_relief_payer UUID;
    v_relief_payee UUID;
    v_payer_cash BIGINT := 0;
    v_contract_disp TEXT;
    v_new_status TEXT;
    v_ruling JSONB;
    v_executed JSONB := '{}'::jsonb;
    v_overdue BOOLEAN := false;
    v_desc TEXT;
BEGIN
    IF v_user IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Not authenticated'); END IF;
    IF p_ruling_kind NOT IN ('plaintiff_wins','defendant_wins','dismiss','settlement') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid ruling kind');
    END IF;

    SELECT * INTO v_lawsuit FROM commercial_lawsuits WHERE id = p_lawsuit_id FOR UPDATE;
    IF v_lawsuit.id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Lawsuit not found'); END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    v_overdue := (v_lawsuit.status = 'pending'
                  AND v_lawsuit.response_deadline_tick IS NOT NULL
                  AND v_tick > v_lawsuit.response_deadline_tick);
    IF v_lawsuit.status <> 'awaiting_trial' AND NOT v_overdue THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Lawsuit is %s; only awaiting_trial or overdue-unanswered cases can be ruled on', v_lawsuit.status));
    END IF;

    -- Justice ministry jurisdiction: caller holds 'justice' in the suit's nation.
    SELECT (ministry_assignments->>'justice')::uuid INTO v_judge_party_id
      FROM government_formations
     WHERE nation_id = v_lawsuit.nation_id AND status IN ('formed','active')
     ORDER BY created_at DESC NULLS LAST LIMIT 1;
    IF v_judge_party_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Justice ministry is vacant; ruling cannot be issued');
    END IF;
    SELECT * INTO v_judge_faction FROM factions WHERE id = v_judge_party_id;
    IF v_judge_faction.id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Justice party no longer exists'); END IF;
    IF v_judge_faction.id <> v_user
       AND COALESCE(v_judge_faction.linked_user_id,'00000000-0000-0000-0000-000000000000'::uuid) <> v_user THEN
        RETURN jsonb_build_object('success', false, 'error', 'Only the Justice Minister may rule on this case');
    END IF;

    SELECT * INTO v_plaintiff FROM entrepreneur_corps WHERE id = v_lawsuit.plaintiff_corp_id FOR UPDATE;
    SELECT * INTO v_defendant FROM entrepreneur_corps WHERE id = v_lawsuit.defendant_corp_id FOR UPDATE;
    IF v_plaintiff.id IS NULL OR v_defendant.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Plaintiff or defendant no longer exists');
    END IF;
    SELECT * INTO v_loan FROM corp_loans WHERE id = NULLIF(v_lawsuit.relationship_ref->>'id','')::uuid FOR UPDATE;

    IF p_ruling_kind = 'plaintiff_wins' THEN
        v_new_status := 'upheld';
        v_executed := _lawsuit_apply_plaintiff_relief(p_lawsuit_id, v_tick);

    ELSIF p_ruling_kind = 'defendant_wins' THEN
        v_new_status := 'dismissed';
        v_def_legal_fee := LEAST(v_def_legal_fee, COALESCE(v_plaintiff.treasury_cash, 0));
        IF v_def_legal_fee > 0 THEN
            UPDATE entrepreneur_corps SET treasury_cash = COALESCE(treasury_cash,0) - v_def_legal_fee, updated_at = now() WHERE id = v_plaintiff.id;
            UPDATE entrepreneur_corps SET treasury_cash = COALESCE(treasury_cash,0) + v_def_legal_fee, updated_at = now() WHERE id = v_defendant.id;
        END IF;
        v_executed := jsonb_build_object('plaintiff_pays_legal_fees', v_def_legal_fee);

    ELSIF p_ruling_kind = 'dismiss' THEN
        v_new_status := 'dismissed';
        v_executed := jsonb_build_object('note', 'Case dismissed; no money moves');

    ELSE  -- settlement
        v_new_status := 'settled';
        IF p_settlement_relief IS NOT NULL THEN
            v_relief_recipient := p_settlement_relief->>'recipient';
            BEGIN v_relief_amount := COALESCE((p_settlement_relief->>'amount')::bigint, 0); EXCEPTION WHEN others THEN v_relief_amount := 0; END;
            IF v_relief_recipient NOT IN ('plaintiff','defendant') THEN RETURN jsonb_build_object('success', false, 'error', 'Invalid relief recipient'); END IF;
            IF v_relief_amount < 0 THEN RETURN jsonb_build_object('success', false, 'error', 'Relief amount cannot be negative'); END IF;
            IF v_relief_amount > 0 THEN
                IF v_relief_recipient = 'plaintiff' THEN
                    v_relief_payer := v_defendant.id; v_relief_payee := v_plaintiff.id; v_payer_cash := COALESCE(v_defendant.treasury_cash,0);
                ELSE
                    v_relief_payer := v_plaintiff.id; v_relief_payee := v_defendant.id; v_payer_cash := COALESCE(v_plaintiff.treasury_cash,0);
                END IF;
                v_relief_amount := LEAST(v_relief_amount, v_payer_cash);
                IF v_relief_amount > 0 THEN
                    UPDATE entrepreneur_corps SET treasury_cash = COALESCE(treasury_cash,0) - v_relief_amount, updated_at = now() WHERE id = v_relief_payer;
                    UPDATE entrepreneur_corps SET treasury_cash = COALESCE(treasury_cash,0) + v_relief_amount, updated_at = now() WHERE id = v_relief_payee;
                END IF;
            END IF;
            v_executed := v_executed || jsonb_build_object('relief_recipient', v_relief_recipient, 'relief_amount', v_relief_amount);
        END IF;
        -- Contract disposition: continue | void (modify-APR omitted — corp_loans
        -- precomputes per_tick_payment, so an APR edit can't be applied cleanly).
        IF p_settlement_contract IS NOT NULL AND v_loan.id IS NOT NULL THEN
            v_contract_disp := p_settlement_contract->>'disposition';
            IF v_contract_disp NOT IN ('continue','void') THEN RETURN jsonb_build_object('success', false, 'error', 'Invalid contract disposition (continue|void)'); END IF;
            IF v_contract_disp = 'void' THEN
                UPDATE corp_loans SET status = 'repaid', payments_remaining = 0, last_payment_tick = v_tick WHERE id = v_loan.id;
                v_executed := v_executed || jsonb_build_object('contract_disposition', 'void', 'loan_id', v_loan.id);
            ELSE
                v_executed := v_executed || jsonb_build_object('contract_disposition', 'continue');
            END IF;
        END IF;
    END IF;

    v_ruling := jsonb_build_object('kind', p_ruling_kind, 'ruled_at_tick', v_tick,
        'ruled_by_faction_id', v_judge_faction.id, 'default_judgment', v_overdue,
        'settlement_relief', p_settlement_relief, 'settlement_contract', p_settlement_contract, 'executed', v_executed);

    UPDATE commercial_lawsuits SET status = v_new_status, ruling = v_ruling, closed_at_tick = v_tick, updated_at = now()
     WHERE id = p_lawsuit_id;

    v_desc := COALESCE(v_judge_faction.faction_name,'The court') || ' has issued a ruling: '
            || CASE p_ruling_kind
                 WHEN 'plaintiff_wins' THEN 'in favor of ' || COALESCE(v_plaintiff.name,'plaintiff')
                 WHEN 'defendant_wins' THEN 'in favor of ' || COALESCE(v_defendant.name,'defendant')
                 WHEN 'dismiss'        THEN 'case dismissed'
                 ELSE                       'agreed settlement entered' END || '.';

    INSERT INTO event_log (nation_id, faction_id, event_name, description_chosen, category, trigger_key, effects_applied, fired_at_tick)
    VALUES (v_lawsuit.nation_id, v_judge_faction.id, 'Lawsuit Ruling: ' || p_ruling_kind, v_desc, 'corporate', 'lawsuit_ruling',
            jsonb_build_object('lawsuit_id', p_lawsuit_id, 'kind', p_ruling_kind, 'executed', v_executed), v_tick);

    RETURN jsonb_build_object('success', true, 'lawsuit_id', p_lawsuit_id, 'new_status', v_new_status, 'ruling', v_ruling, 'description', v_desc);
END;
$$;
GRANT EXECUTE ON FUNCTION public.issue_ruling(UUID, TEXT, JSONB, JSONB) TO authenticated;

-- ── 7. Drop the per-tick deadline sweeper (no automation; deadlines are
--        enforced at action time and the MoJ rules overdue cases). ──
DROP FUNCTION IF EXISTS public.process_lawsuit_deadlines();

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK ── Re-apply 20260730/20260731/20260801/20260808 from git history
-- to restore the legacy faction/bank_loans lawsuit RPCs, and remove the
-- plaintiff_corp_id/defendant_corp_id columns.
