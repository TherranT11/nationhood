-- 20260801_commercial_lawsuits_phase3.sql
--
-- Phase 3 of the commercial lawsuit system: Ministry of Justice
-- ruling.
--
-- Cases that reach status='awaiting_trial' (defendant chose Refute
-- in Phase 2) now sit on the Judicial docket for the Justice
-- Minister to rule on. Per design, jurisdiction stays with the
-- plaintiff's nation throughout — no cross-border routing.
--
-- Ruling kinds (each terminal):
--   plaintiff_wins  → loan voided, defendant refunds plaintiff's
--                     payments-to-date (principal − outstanding),
--                     plaintiff's corp_debt cleared. status='upheld'.
--   defendant_wins  → loan unchanged, plaintiff pays defendant
--                     $5M legal fees. status='dismissed'.
--   dismiss         → no money moves; loan unchanged.
--                     status='dismissed'.
--   settlement      → custom builder. Two clauses ship in Phase 3:
--                     • Relief    — cash transfer (recipient + amount)
--                     • Contract  — disposition (continue/modify-APR/void)
--                     status='settled'.
--   auto_dismiss    → MoJ missed the 4-tick ruling deadline; case
--                     auto-dismissed by the deadline sweeper.
--                     status='dismissed', no money moves.
--
-- Halt-Operations clause and evidence file uploads are deferred to
-- Phase 4. Every other clause-builder option that doesn't hook into
-- existing systems is intentionally absent.
--
-- Execution is immediate at ruling time — single transaction. All
-- cash flows go through emit_corp_cash_event so the dashboards
-- reflect the ruling on the next render.

BEGIN;


-- ── 1. Schema extension: ruling_deadline_tick ────────────────────
ALTER TABLE public.commercial_lawsuits
    ADD COLUMN IF NOT EXISTS ruling_deadline_tick INT;


-- ── 2. respond_to_lawsuit: stamp ruling_deadline_tick on Refute ──
-- Phase 3 update to Phase 2's RPC. When a defendant chooses Refute
-- and the case advances to awaiting_trial, the MoJ has 4 ticks to
-- rule before the auto-dismiss sweeper closes the case.
CREATE OR REPLACE FUNCTION respond_to_lawsuit(
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
    v_defendant factions%ROWTYPE;
    v_tick      INT;
    v_legal_fee BIGINT := 0;
    v_new_status TEXT;
    v_ruling_window CONSTANT INT := 4;
    v_ruling_deadline INT;
BEGIN
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    IF p_response_kind NOT IN ('refute','settle','concede') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid response kind');
    END IF;

    SELECT * INTO v_lawsuit FROM commercial_lawsuits WHERE id = p_lawsuit_id FOR UPDATE;
    IF v_lawsuit.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Lawsuit not found');
    END IF;
    IF v_lawsuit.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Lawsuit is %s; defendant response only valid while pending', v_lawsuit.status));
    END IF;

    SELECT * INTO v_defendant FROM factions WHERE id = v_lawsuit.defendant_faction_id FOR UPDATE;
    IF v_defendant.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Defendant no longer exists');
    END IF;
    IF v_defendant.id <> v_user
       AND COALESCE(v_defendant.linked_user_id, '00000000-0000-0000-0000-000000000000'::uuid) <> v_user THEN
        RETURN jsonb_build_object('success', false, 'error', 'You are not the defendant');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    IF v_lawsuit.response_deadline_tick IS NOT NULL
       AND v_tick > v_lawsuit.response_deadline_tick THEN
        RETURN jsonb_build_object('success', false,
            'error', 'Response deadline has passed; case auto-conceded');
    END IF;

    IF p_response_kind = 'refute' THEN
        v_legal_fee := 5000000;
        v_new_status := 'awaiting_trial';
        v_ruling_deadline := v_tick + v_ruling_window;
        IF p_defense_text IS NULL OR length(trim(p_defense_text)) < 50 THEN
            RETURN jsonb_build_object('success', false,
                'error', 'A refutation requires at least 50 characters of defense text');
        END IF;
        IF COALESCE(v_defendant.corp_cash_reserves, 0) < v_legal_fee THEN
            RETURN jsonb_build_object('success', false,
                'error', format('Insufficient cash for $%s legal fees', to_char(v_legal_fee, 'FM999,999,999')));
        END IF;
        PERFORM emit_corp_cash_event(
            v_defendant.id, 'capital_out', 'Lawsuit legal fees (refute)', -v_legal_fee, v_tick
        );
    ELSIF p_response_kind = 'settle' THEN
        IF p_settle_offer_amount IS NULL OR p_settle_offer_amount <= 0 THEN
            RETURN jsonb_build_object('success', false, 'error', 'Settlement offer must be positive');
        END IF;
        IF COALESCE(v_defendant.corp_cash_reserves, 0) < p_settle_offer_amount THEN
            RETURN jsonb_build_object('success', false,
                'error', 'Insufficient cash to back the settlement offer');
        END IF;
        v_new_status := 'settle_offered';
    ELSE
        v_new_status := 'upheld';
    END IF;

    UPDATE commercial_lawsuits
       SET status              = v_new_status,
           defendant_response  = p_response_kind,
           responded_at_tick   = v_tick,
           defense_text        = CASE WHEN p_response_kind = 'refute'  THEN p_defense_text        ELSE NULL END,
           settle_offer_amount = CASE WHEN p_response_kind = 'settle'  THEN p_settle_offer_amount ELSE NULL END,
           closed_at_tick      = CASE WHEN p_response_kind = 'concede' THEN v_tick ELSE closed_at_tick END,
           ruling_deadline_tick = CASE WHEN p_response_kind = 'refute' THEN v_ruling_deadline ELSE ruling_deadline_tick END,
           updated_at          = now()
     WHERE id = p_lawsuit_id;

    INSERT INTO event_log (
        nation_id, faction_id,
        event_name, description_used,
        category, trigger_key,
        effects_applied, fired_at_tick
    ) VALUES (
        v_lawsuit.nation_id, v_defendant.id,
        'Lawsuit Response: ' || p_response_kind,
        COALESCE(v_defendant.faction_name, 'Defendant') || ' has '
            || CASE p_response_kind
                 WHEN 'refute'  THEN 'filed a refutation'
                 WHEN 'settle'  THEN 'offered a settlement of $' || to_char(p_settle_offer_amount, 'FM999,999,999,999')
                 WHEN 'concede' THEN 'conceded the claim'
               END
            || '.',
        'legal',
        'lawsuit_response',
        jsonb_build_object(
            'lawsuit_id',          p_lawsuit_id,
            'response_kind',       p_response_kind,
            'legal_fee',           v_legal_fee,
            'settle_offer',        p_settle_offer_amount,
            'ruling_deadline_tick', v_ruling_deadline
        ),
        v_tick
    );

    RETURN jsonb_build_object(
        'success',              true,
        'lawsuit_id',           p_lawsuit_id,
        'new_status',           v_new_status,
        'legal_fee',            v_legal_fee,
        'ruling_deadline_tick', v_ruling_deadline
    );
END;
$$;

GRANT EXECUTE ON FUNCTION respond_to_lawsuit(UUID, TEXT, TEXT, BIGINT) TO authenticated;


-- ── 3. issue_ruling: the MoJ verdict + atomic execution ──────────
-- Validates that the caller's faction holds the Justice ministry in
-- the plaintiff's nation (active government_formations), then runs
-- the ruling logic in one transaction. Cash flows route through
-- emit_corp_cash_event; loan changes UPDATE bank_loans directly.
--
-- Settlement clauses (Phase 3 ships two; Halt Operations is Phase 4):
--   p_settlement_relief    JSONB   { recipient: 'plaintiff'|'defendant', amount: <bigint> }   nullable
--   p_settlement_contract  JSONB   { disposition: 'continue'|'modify'|'void', new_apr: <numeric> }   nullable
CREATE OR REPLACE FUNCTION issue_ruling(
    p_lawsuit_id           UUID,
    p_ruling_kind          TEXT,        -- 'plaintiff_wins' | 'defendant_wins' | 'dismiss' | 'settlement'
    p_settlement_relief    JSONB,
    p_settlement_contract  JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user      UUID := auth.uid();
    v_lawsuit   commercial_lawsuits%ROWTYPE;
    v_plaintiff factions%ROWTYPE;
    v_defendant factions%ROWTYPE;
    v_tick      INT;
    v_judge_party_id UUID;
    v_judge_faction  factions%ROWTYPE;
    v_loan_id   UUID;
    v_loan      bank_loans%ROWTYPE;
    v_pl_paid_to_date BIGINT := 0;
    v_relief_amount   BIGINT := 0;
    v_relief_recipient TEXT;
    v_relief_payer    UUID;
    v_relief_payee    UUID;
    v_contract_disp   TEXT;
    v_new_apr         NUMERIC;
    v_def_legal_fee   CONSTANT BIGINT := 5000000;
    v_new_status      TEXT;
    v_ruling          JSONB;
    v_executed        JSONB := '{}'::jsonb;
    v_description     TEXT;
BEGIN
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;
    IF p_ruling_kind NOT IN ('plaintiff_wins','defendant_wins','dismiss','settlement') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid ruling kind');
    END IF;

    SELECT * INTO v_lawsuit FROM commercial_lawsuits WHERE id = p_lawsuit_id FOR UPDATE;
    IF v_lawsuit.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Lawsuit not found');
    END IF;
    IF v_lawsuit.status <> 'awaiting_trial' THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Lawsuit is %s; only awaiting_trial cases can be ruled on', v_lawsuit.status));
    END IF;

    -- ── MoJ jurisdiction check ──
    -- Caller's faction must hold ministry_assignments->>'justice'
    -- in the plaintiff's nation's active formation. We accept either
    -- 'formed' or 'active' status (matches existing pattern).
    SELECT (ministry_assignments->>'justice')::uuid
      INTO v_judge_party_id
      FROM government_formations
     WHERE nation_id = v_lawsuit.nation_id
       AND status IN ('formed','active')
     ORDER BY created_at DESC NULLS LAST
     LIMIT 1;

    IF v_judge_party_id IS NULL THEN
        RETURN jsonb_build_object('success', false,
            'error', 'Justice ministry is vacant; ruling cannot be issued');
    END IF;

    SELECT * INTO v_judge_faction FROM factions WHERE id = v_judge_party_id;
    IF v_judge_faction.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Justice party no longer exists');
    END IF;
    IF v_judge_faction.id <> v_user
       AND COALESCE(v_judge_faction.linked_user_id, '00000000-0000-0000-0000-000000000000'::uuid) <> v_user THEN
        RETURN jsonb_build_object('success', false, 'error', 'Only the Justice Minister may rule on this case');
    END IF;

    SELECT * INTO v_plaintiff FROM factions WHERE id = v_lawsuit.plaintiff_faction_id FOR UPDATE;
    SELECT * INTO v_defendant FROM factions WHERE id = v_lawsuit.defendant_faction_id FOR UPDATE;
    IF v_plaintiff.id IS NULL OR v_defendant.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Plaintiff or defendant no longer exists');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- Look up the underlying bank_loans row (Phase 1/2 only supports
    -- loan-based suits, so the relationship_ref kind is always 'loan').
    BEGIN
        v_loan_id := (v_lawsuit.relationship_ref->>'id')::uuid;
    EXCEPTION WHEN others THEN
        v_loan_id := NULL;
    END;
    IF v_loan_id IS NOT NULL THEN
        SELECT * INTO v_loan FROM bank_loans WHERE id = v_loan_id FOR UPDATE;
    END IF;

    -- ── Branch on ruling kind ──
    IF p_ruling_kind = 'plaintiff_wins' THEN
        v_new_status := 'upheld';
        IF v_loan.id IS NOT NULL THEN
            -- Refund the plaintiff's payments-to-date (principal − outstanding),
            -- void the loan, and clear the plaintiff's corp_debt.
            v_pl_paid_to_date := GREATEST(0, COALESCE(v_loan.principal, 0) - COALESCE(v_loan.outstanding, 0));
            IF v_pl_paid_to_date > 0 THEN
                PERFORM emit_corp_cash_event(v_defendant.id, 'capital_out', 'Lawsuit ruling — plaintiff awarded', -v_pl_paid_to_date, v_tick);
                PERFORM emit_corp_cash_event(v_plaintiff.id, 'capital_in',  'Lawsuit ruling — payments refunded',  v_pl_paid_to_date, v_tick);
            END IF;
            UPDATE factions
               SET corp_debt = GREATEST(0, COALESCE(corp_debt, 0) - COALESCE(v_loan.outstanding, 0))
             WHERE id = v_plaintiff.id;
            UPDATE bank_loans
               SET status         = 'paid',
                   outstanding    = 0,
                   closed_at_tick = v_tick,
                   updated_at     = now()
             WHERE id = v_loan.id;
            PERFORM recompute_finance_stats(v_defendant.id);
            v_executed := jsonb_build_object(
                'loan_id',           v_loan.id,
                'loan_voided',       true,
                'cash_to_plaintiff', v_pl_paid_to_date
            );
        ELSE
            v_executed := jsonb_build_object('note', 'No underlying loan found; ruling recorded without execution.');
        END IF;

    ELSIF p_ruling_kind = 'defendant_wins' THEN
        v_new_status := 'dismissed';
        IF COALESCE(v_plaintiff.corp_cash_reserves, 0) < v_def_legal_fee THEN
            -- Plaintiff insolvent for the legal fee; ruling still
            -- stands but the cash transfer caps at what's available.
            v_def_legal_fee := COALESCE(v_plaintiff.corp_cash_reserves, 0);
        END IF;
        IF v_def_legal_fee > 0 THEN
            PERFORM emit_corp_cash_event(v_plaintiff.id, 'capital_out', 'Lawsuit ruling — legal fees', -v_def_legal_fee, v_tick);
            PERFORM emit_corp_cash_event(v_defendant.id, 'capital_in',  'Lawsuit ruling — legal fees recovered',  v_def_legal_fee, v_tick);
        END IF;
        v_executed := jsonb_build_object('plaintiff_pays_legal_fees', v_def_legal_fee);

    ELSIF p_ruling_kind = 'dismiss' THEN
        v_new_status := 'dismissed';
        v_executed := jsonb_build_object('note', 'Case dismissed; no money moves');

    ELSE  -- settlement
        v_new_status := 'settled';

        -- Clause 1: Relief (optional)
        IF p_settlement_relief IS NOT NULL THEN
            v_relief_recipient := p_settlement_relief->>'recipient';
            BEGIN
                v_relief_amount := COALESCE((p_settlement_relief->>'amount')::bigint, 0);
            EXCEPTION WHEN others THEN
                v_relief_amount := 0;
            END;
            IF v_relief_recipient NOT IN ('plaintiff','defendant') THEN
                RETURN jsonb_build_object('success', false, 'error', 'Invalid relief recipient');
            END IF;
            IF v_relief_amount < 0 THEN
                RETURN jsonb_build_object('success', false, 'error', 'Relief amount cannot be negative');
            END IF;
            IF v_relief_amount > 0 THEN
                -- Resolve payer/payee + cap at payer's cash in one branch.
                -- Any shortfall is recorded in the executed JSON via the
                -- post-cap v_relief_amount.
                IF v_relief_recipient = 'plaintiff' THEN
                    v_relief_payer := v_defendant.id;
                    v_relief_payee := v_plaintiff.id;
                    IF COALESCE(v_defendant.corp_cash_reserves, 0) < v_relief_amount THEN
                        v_relief_amount := COALESCE(v_defendant.corp_cash_reserves, 0);
                    END IF;
                ELSE
                    v_relief_payer := v_plaintiff.id;
                    v_relief_payee := v_defendant.id;
                    IF COALESCE(v_plaintiff.corp_cash_reserves, 0) < v_relief_amount THEN
                        v_relief_amount := COALESCE(v_plaintiff.corp_cash_reserves, 0);
                    END IF;
                END IF;
                IF v_relief_amount > 0 THEN
                    PERFORM emit_corp_cash_event(v_relief_payer, 'capital_out', 'Settlement ruling — relief paid',     -v_relief_amount, v_tick);
                    PERFORM emit_corp_cash_event(v_relief_payee, 'capital_in',  'Settlement ruling — relief received',  v_relief_amount, v_tick);
                END IF;
            END IF;
            v_executed := v_executed || jsonb_build_object(
                'relief_recipient', v_relief_recipient,
                'relief_amount',    v_relief_amount
            );
        END IF;

        -- Clause 3: Contract Disposition (optional)
        IF p_settlement_contract IS NOT NULL AND v_loan.id IS NOT NULL THEN
            v_contract_disp := p_settlement_contract->>'disposition';
            IF v_contract_disp NOT IN ('continue','modify','void') THEN
                RETURN jsonb_build_object('success', false, 'error', 'Invalid contract disposition');
            END IF;

            IF v_contract_disp = 'modify' THEN
                BEGIN
                    v_new_apr := (p_settlement_contract->>'new_apr')::numeric;
                EXCEPTION WHEN others THEN
                    v_new_apr := NULL;
                END;
                IF v_new_apr IS NULL OR v_new_apr < 0 OR v_new_apr > 100 THEN
                    RETURN jsonb_build_object('success', false, 'error', 'modify requires new_apr between 0 and 100');
                END IF;
                UPDATE bank_loans
                   SET apr        = v_new_apr,
                       updated_at = now()
                 WHERE id = v_loan.id;
                PERFORM recompute_finance_stats(v_defendant.id);
                v_executed := v_executed || jsonb_build_object(
                    'contract_disposition', 'modify',
                    'old_apr',              v_loan.apr,
                    'new_apr',              v_new_apr
                );
            ELSIF v_contract_disp = 'void' THEN
                UPDATE factions
                   SET corp_debt = GREATEST(0, COALESCE(corp_debt, 0) - COALESCE(v_loan.outstanding, 0))
                 WHERE id = v_plaintiff.id;
                UPDATE bank_loans
                   SET status         = 'paid',
                       outstanding    = 0,
                       closed_at_tick = v_tick,
                       updated_at     = now()
                 WHERE id = v_loan.id;
                PERFORM recompute_finance_stats(v_defendant.id);
                v_executed := v_executed || jsonb_build_object(
                    'contract_disposition', 'void',
                    'loan_id',              v_loan.id,
                    'voided_outstanding',   v_loan.outstanding
                );
            ELSE
                v_executed := v_executed || jsonb_build_object('contract_disposition', 'continue');
            END IF;
        END IF;
    END IF;

    -- Build the canonical ruling JSONB.
    v_ruling := jsonb_build_object(
        'kind',                p_ruling_kind,
        'ruled_at_tick',       v_tick,
        'ruled_by_faction_id', v_judge_faction.id,
        'settlement_relief',   p_settlement_relief,
        'settlement_contract', p_settlement_contract,
        'executed',            v_executed
    );

    UPDATE commercial_lawsuits
       SET status         = v_new_status,
           ruling         = v_ruling,
           closed_at_tick = v_tick,
           updated_at     = now()
     WHERE id = p_lawsuit_id;

    v_description := COALESCE(v_judge_faction.faction_name, 'The court')
                  || ' has issued a ruling: '
                  || CASE p_ruling_kind
                       WHEN 'plaintiff_wins' THEN 'in favor of ' || COALESCE(v_plaintiff.faction_name, 'plaintiff')
                       WHEN 'defendant_wins' THEN 'in favor of ' || COALESCE(v_defendant.faction_name, 'defendant')
                       WHEN 'dismiss'        THEN 'case dismissed'
                       ELSE                       'agreed settlement entered'
                     END
                  || '.';

    INSERT INTO event_log (
        nation_id, faction_id,
        event_name, description_used,
        category, trigger_key,
        effects_applied, fired_at_tick
    ) VALUES (
        v_lawsuit.nation_id, v_judge_faction.id,
        'Lawsuit Ruling: ' || p_ruling_kind,
        v_description,
        'legal',
        'lawsuit_ruling',
        jsonb_build_object(
            'lawsuit_id', p_lawsuit_id,
            'kind',       p_ruling_kind,
            'executed',   v_executed
        ),
        v_tick
    );

    RETURN jsonb_build_object(
        'success',     true,
        'lawsuit_id',  p_lawsuit_id,
        'new_status',  v_new_status,
        'ruling',      v_ruling,
        'description', v_description
    );
END;
$$;

GRANT EXECUTE ON FUNCTION issue_ruling(UUID, TEXT, JSONB, JSONB) TO authenticated;


-- ── 4. process_lawsuit_deadlines: extend with auto-dismiss ───────
-- Was Phase 2's auto-concede sweeper for pending suits. Phase 3
-- adds an awaiting_trial sweeper that auto-dismisses cases past
-- ruling_deadline_tick. No money moves on auto-dismiss — matches
-- "if the court can't rule, no judgment stands."
CREATE OR REPLACE FUNCTION process_lawsuit_deadlines() RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tick INT;
    v_concede_count INT;
    v_dismiss_count INT;
BEGIN
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- Auto-concede: pending past response_deadline.
    WITH expired AS (
        UPDATE commercial_lawsuits
           SET status             = 'upheld',
               defendant_response = 'auto_concede',
               responded_at_tick  = v_tick,
               closed_at_tick     = v_tick,
               updated_at         = now()
         WHERE status = 'pending'
           AND response_deadline_tick IS NOT NULL
           AND v_tick > response_deadline_tick
        RETURNING id, nation_id, defendant_faction_id
    )
    INSERT INTO event_log (nation_id, faction_id, event_name, description_used,
                           category, trigger_key, effects_applied, fired_at_tick)
    SELECT e.nation_id,
           e.defendant_faction_id,
           'Lawsuit Auto-Conceded',
           'Defendant did not respond within the 3-tick response window; the case is conceded by default.',
           'legal',
           'lawsuit_auto_concede',
           jsonb_build_object('lawsuit_id', e.id),
           v_tick
      FROM expired e;
    GET DIAGNOSTICS v_concede_count = ROW_COUNT;

    -- Auto-dismiss: awaiting_trial past ruling_deadline.
    WITH unrulled AS (
        UPDATE commercial_lawsuits
           SET status         = 'dismissed',
               ruling         = jsonb_build_object(
                   'kind',          'auto_dismiss',
                   'ruled_at_tick', v_tick,
                   'reason',        'Ministry of Justice did not rule within the 4-tick window'
               ),
               closed_at_tick = v_tick,
               updated_at     = now()
         WHERE status = 'awaiting_trial'
           AND ruling_deadline_tick IS NOT NULL
           AND v_tick > ruling_deadline_tick
        RETURNING id, nation_id, plaintiff_faction_id
    )
    INSERT INTO event_log (nation_id, faction_id, event_name, description_used,
                           category, trigger_key, effects_applied, fired_at_tick)
    SELECT u.nation_id,
           u.plaintiff_faction_id,
           'Lawsuit Auto-Dismissed',
           'The Ministry of Justice did not issue a ruling within the 4-tick deadline; the case is dismissed without judgment.',
           'legal',
           'lawsuit_auto_dismiss',
           jsonb_build_object('lawsuit_id', u.id),
           v_tick
      FROM unrulled u;
    GET DIAGNOSTICS v_dismiss_count = ROW_COUNT;

    RETURN v_concede_count + v_dismiss_count;
END;
$$;


COMMIT;

NOTIFY pgrst, 'reload schema';
