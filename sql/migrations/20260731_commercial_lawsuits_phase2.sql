-- 20260731_commercial_lawsuits_phase2.sql
--
-- Phase 2 of the commercial lawsuit system: defendant response.
--
-- Filed cases now carry a 3-tick response_deadline. The defendant
-- gets a Pressing Issue on corp-operations.html with three live
-- options (Refute / Settle / Concede) plus a grayed-out Counter-Sue
-- placeholder. A per-lawsuit chat thread (group_chats row,
-- chat_type='lawsuit') is created at filing time so plaintiff +
-- defendant can discuss settlement.
--
-- Status lifecycle this phase introduces:
--   pending          → defendant has not responded yet (Phase 1 default)
--   awaiting_trial   → defendant chose Refute; case sits on MoJ docket
--   settle_offered   → defendant offered $X; plaintiff must accept/reject
--   settled          → plaintiff accepted; cash transferred
--   upheld           → defendant conceded (or auto-conceded past deadline)
--   dismissed/withdrawn → reserved for Phase 3
--
-- Auto-concede: process_lawsuit_deadlines flips any pending case
-- past response_deadline_tick to status='upheld' with
-- defendant_response='auto_concede'. Runs each tick from
-- advance-corp-tick.
--
-- Phase 2 explicitly does NOT execute the relief on concede/upheld.
-- The status flip is the admission; Phase 3 (MoJ ruling + sentencing)
-- wires actual cash/contract changes from upheld → executed.
--
-- Idempotent: ALTER TABLE … ADD COLUMN IF NOT EXISTS, CREATE OR REPLACE.

BEGIN;


-- ── 1. Schema extensions on commercial_lawsuits ─────────────────
ALTER TABLE public.commercial_lawsuits
    ADD COLUMN IF NOT EXISTS response_deadline_tick INT,
    ADD COLUMN IF NOT EXISTS defendant_response     TEXT
        CHECK (defendant_response IS NULL OR defendant_response IN ('refute','settle','concede','auto_concede')),
    ADD COLUMN IF NOT EXISTS responded_at_tick      INT,
    ADD COLUMN IF NOT EXISTS defense_text           TEXT,
    ADD COLUMN IF NOT EXISTS settle_offer_amount    BIGINT,
    ADD COLUMN IF NOT EXISTS chat_id                UUID REFERENCES public.group_chats(id) ON DELETE SET NULL;

-- Widen the status enum to cover the response-flow states. Drop +
-- re-add since the original CHECK was named in 20260730.
ALTER TABLE public.commercial_lawsuits DROP CONSTRAINT IF EXISTS commercial_lawsuits_status_check;
ALTER TABLE public.commercial_lawsuits
    ADD CONSTRAINT commercial_lawsuits_status_check
    CHECK (status IN ('pending','reviewing','awaiting_trial','settle_offered',
                      'upheld','settled','dismissed','withdrawn'));


-- ── 2. group_chats: chat_type='lawsuit' + lawsuit_id ─────────────
ALTER TABLE public.group_chats DROP CONSTRAINT IF EXISTS group_chats_chat_type_check;
ALTER TABLE public.group_chats
    ADD CONSTRAINT group_chats_chat_type_check
    CHECK (chat_type IN ('custom','ipo','nation','global','lawsuit'));

ALTER TABLE public.group_chats
    ADD COLUMN IF NOT EXISTS lawsuit_id UUID REFERENCES public.commercial_lawsuits(id) ON DELETE CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS uq_group_chats_lawsuit ON public.group_chats(lawsuit_id) WHERE lawsuit_id IS NOT NULL;


-- ── 3. file_commercial_lawsuit: now seeds deadline + chat ────────
-- Phase 2 update: stamp response_deadline_tick = filed_at_tick + 3,
-- create the per-lawsuit group_chat row, and add both parties as
-- members so they can DM about settlement. Everything else is the
-- Phase 1 behavior — sector derivation, fee charge, event_log row.
CREATE OR REPLACE FUNCTION file_commercial_lawsuit(
    p_plaintiff_id     UUID,
    p_defendant_id     UUID,
    p_grievance_type   TEXT,
    p_grievance_sector TEXT,                -- accepted but not trusted; sector is derived server-side
    p_relief_sought    TEXT,
    p_relationship_ref JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user             UUID := auth.uid();
    v_plaintiff        factions%ROWTYPE;
    v_defendant        factions%ROWTYPE;
    v_filing_fee       CONSTANT BIGINT := 2000000;
    v_response_window  CONSTANT INT    := 3;
    v_tick             INT;
    v_lawsuit_id       UUID;
    v_chat_id          UUID;
    v_rel_kind         TEXT;
    v_rel_id           UUID;
    v_rel_ok           BOOLEAN := false;
    v_canonical_sector TEXT;
    v_grievance_label  TEXT;
    v_description      TEXT;
BEGIN
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    IF p_plaintiff_id = p_defendant_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cannot sue yourself');
    END IF;

    SELECT * INTO v_plaintiff FROM factions WHERE id = p_plaintiff_id FOR UPDATE;
    IF v_plaintiff.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Plaintiff not found');
    END IF;
    IF v_plaintiff.faction_type <> 'corporation' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Plaintiff must be a corporation');
    END IF;
    IF v_plaintiff.id <> v_user
       AND COALESCE(v_plaintiff.linked_user_id, '00000000-0000-0000-0000-000000000000'::uuid) <> v_user THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not own this corporation');
    END IF;

    SELECT * INTO v_defendant FROM factions WHERE id = p_defendant_id;
    IF v_defendant.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Defendant not found');
    END IF;
    IF v_defendant.faction_type <> 'corporation' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Defendant must be a corporation');
    END IF;

    v_canonical_sector := CASE p_grievance_type
        WHEN 'breach_of_contract' THEN 'universal'
        WHEN 'fraud'              THEN 'universal'
        WHEN 'defamation'         THEN 'universal'
        WHEN 'predatory_terms'    THEN 'banking'
        WHEN 'non_payout'         THEN 'banking'
        WHEN 'defective_work'     THEN 'construction'
        WHEN 'cargo_loss'         THEN 'shipping'
        ELSE NULL
    END;
    IF v_canonical_sector IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', format('Unknown grievance: %s', p_grievance_type));
    END IF;

    IF v_canonical_sector = 'banking'      AND v_defendant.corp_sector <> 'Finance'      THEN
        RETURN jsonb_build_object('success', false, 'error', 'Banking grievances require a Finance defendant');
    END IF;
    IF v_canonical_sector = 'construction' AND v_defendant.corp_sector <> 'Construction' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Construction grievances require a Construction defendant');
    END IF;
    IF v_canonical_sector = 'shipping'     AND v_defendant.corp_sector <> 'Shipping'     THEN
        RETURN jsonb_build_object('success', false, 'error', 'Shipping grievances require a Shipping defendant');
    END IF;

    v_rel_kind := p_relationship_ref->>'kind';
    BEGIN
        v_rel_id := (p_relationship_ref->>'id')::uuid;
    EXCEPTION WHEN others THEN
        v_rel_id := NULL;
    END;

    IF v_rel_kind IS NULL OR v_rel_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Missing relationship reference');
    END IF;

    IF v_rel_kind = 'loan' THEN
        SELECT TRUE INTO v_rel_ok FROM bank_loans
         WHERE id = v_rel_id
           AND ((borrower_faction_id = p_plaintiff_id AND lender_faction_id   = p_defendant_id)
             OR (lender_faction_id   = p_plaintiff_id AND borrower_faction_id = p_defendant_id));
    ELSE
        RETURN jsonb_build_object('success', false,
            'error', format('Phase 1 only supports loan-based suits (got: %s)', v_rel_kind));
    END IF;

    IF NOT COALESCE(v_rel_ok, false) THEN
        RETURN jsonb_build_object('success', false, 'error', 'No active relationship found between the parties');
    END IF;

    IF COALESCE(v_plaintiff.corp_cash_reserves, 0) < v_filing_fee THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Insufficient cash for $%s filing fee', to_char(v_filing_fee, 'FM999,999,999')));
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    PERFORM emit_corp_cash_event(
        p_plaintiff_id, 'capital_out', 'Lawsuit filing fee', -v_filing_fee, v_tick
    );

    INSERT INTO commercial_lawsuits (
        plaintiff_faction_id, defendant_faction_id, nation_id,
        grievance_type, grievance_sector, relief_sought,
        relationship_ref, filing_fee, filed_at_tick,
        response_deadline_tick
    ) VALUES (
        p_plaintiff_id, p_defendant_id, v_plaintiff.nation_id,
        p_grievance_type, v_canonical_sector, p_relief_sought,
        p_relationship_ref, v_filing_fee, v_tick,
        v_tick + v_response_window
    ) RETURNING id INTO v_lawsuit_id;

    -- Per-lawsuit chat thread. Reuses group_chats infra so the existing
    -- messaging tables (group_chat_messages) carry the conversation
    -- without a parallel storage layer. The chat is only surfaced inside
    -- the lawsuit modals — not in the main Messages panel — but its
    -- storage shape is canonical.
    INSERT INTO group_chats (name, chat_type, lawsuit_id, created_by, created_at)
    VALUES (
        'Lawsuit: ' || COALESCE(v_plaintiff.faction_name, 'Plaintiff') || ' v ' || COALESCE(v_defendant.faction_name, 'Defendant'),
        'lawsuit',
        v_lawsuit_id,
        p_plaintiff_id,
        now()
    ) RETURNING id INTO v_chat_id;

    INSERT INTO group_chat_members (chat_id, faction_id) VALUES
        (v_chat_id, p_plaintiff_id),
        (v_chat_id, p_defendant_id);

    UPDATE commercial_lawsuits SET chat_id = v_chat_id WHERE id = v_lawsuit_id;

    v_grievance_label := CASE p_grievance_type
        WHEN 'breach_of_contract' THEN 'Breach of Contract'
        WHEN 'fraud'              THEN 'Fraud'
        WHEN 'defamation'         THEN 'Defamation'
        WHEN 'predatory_terms'    THEN 'Predatory Terms'
        WHEN 'non_payout'         THEN 'Non-Payout'
        WHEN 'defective_work'     THEN 'Defective Work'
        WHEN 'cargo_loss'         THEN 'Cargo Loss'
        ELSE p_grievance_type
    END;

    v_description := COALESCE(v_plaintiff.faction_name, 'A corporation')
                  || ' has filed a lawsuit for ' || v_grievance_label
                  || ' against ' || COALESCE(v_defendant.faction_name, 'another corporation')
                  || '. Ministry of Justice reviewing the case now.';

    INSERT INTO event_log (
        nation_id, faction_id,
        event_name, description_used,
        category, trigger_key,
        effects_applied, fired_at_tick
    ) VALUES (
        v_plaintiff.nation_id, p_plaintiff_id,
        'Lawsuit Filed: ' || v_grievance_label,
        v_description,
        'legal',
        'lawsuit_filed',
        jsonb_build_object(
            'lawsuit_id',           v_lawsuit_id,
            'plaintiff_faction_id', p_plaintiff_id,
            'defendant_faction_id', p_defendant_id,
            'grievance_type',       p_grievance_type,
            'relief_sought',        p_relief_sought,
            'filing_fee',           v_filing_fee,
            'response_deadline_tick', v_tick + v_response_window
        ),
        v_tick
    );

    RETURN jsonb_build_object(
        'success',                true,
        'lawsuit_id',             v_lawsuit_id,
        'chat_id',                v_chat_id,
        'filing_fee',             v_filing_fee,
        'response_deadline_tick', v_tick + v_response_window,
        'description',            v_description
    );
END;
$$;

GRANT EXECUTE ON FUNCTION file_commercial_lawsuit(UUID, UUID, TEXT, TEXT, TEXT, JSONB) TO authenticated;


-- ── 4. respond_to_lawsuit RPC ────────────────────────────────────
-- Defendant submits their chosen response. Validates ownership +
-- status='pending' + deadline not passed. Charges legal fees for
-- refute. Status flips depend on the response_kind:
--   refute  → awaiting_trial  (case waits for MoJ ruling, Phase 3)
--   settle  → settle_offered  (plaintiff gets a Pressing Issue)
--   concede → upheld          (admission of liability; sentence is Phase 3)
CREATE OR REPLACE FUNCTION respond_to_lawsuit(
    p_lawsuit_id          UUID,
    p_response_kind       TEXT,        -- 'refute' | 'settle' | 'concede'
    p_defense_text        TEXT,
    p_settle_offer_amount BIGINT       -- only used when response_kind='settle'
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

    -- Deadline check. Past-deadline cases will have been swept by
    -- process_lawsuit_deadlines before reaching this RPC; this guard
    -- catches the rare race where the sweeper hasn't run yet.
    IF v_lawsuit.response_deadline_tick IS NOT NULL
       AND v_tick > v_lawsuit.response_deadline_tick THEN
        RETURN jsonb_build_object('success', false,
            'error', 'Response deadline has passed; case auto-conceded');
    END IF;

    IF p_response_kind = 'refute' THEN
        v_legal_fee := 5000000;
        v_new_status := 'awaiting_trial';
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
    ELSE  -- concede
        v_new_status := 'upheld';
    END IF;

    UPDATE commercial_lawsuits
       SET status              = v_new_status,
           defendant_response  = p_response_kind,
           responded_at_tick   = v_tick,
           defense_text        = CASE WHEN p_response_kind = 'refute'  THEN p_defense_text        ELSE NULL END,
           settle_offer_amount = CASE WHEN p_response_kind = 'settle'  THEN p_settle_offer_amount ELSE NULL END,
           closed_at_tick      = CASE WHEN p_response_kind = 'concede' THEN v_tick ELSE closed_at_tick END,
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
            'lawsuit_id',     p_lawsuit_id,
            'response_kind',  p_response_kind,
            'legal_fee',      v_legal_fee,
            'settle_offer',   p_settle_offer_amount
        ),
        v_tick
    );

    RETURN jsonb_build_object(
        'success',     true,
        'lawsuit_id',  p_lawsuit_id,
        'new_status',  v_new_status,
        'legal_fee',   v_legal_fee
    );
END;
$$;

GRANT EXECUTE ON FUNCTION respond_to_lawsuit(UUID, TEXT, TEXT, BIGINT) TO authenticated;


-- ── 5. respond_to_settle_offer RPC ───────────────────────────────
-- Plaintiff accepts or rejects the defendant's settlement offer.
--   accept → defendant cash → plaintiff via emit_corp_cash_event,
--            status='settled', case closed.
--   reject → status='awaiting_trial', case proceeds to MoJ docket.
CREATE OR REPLACE FUNCTION respond_to_settle_offer(
    p_lawsuit_id UUID,
    p_decision   TEXT             -- 'accept' | 'reject'
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
    v_amount    BIGINT;
BEGIN
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;
    IF p_decision NOT IN ('accept','reject') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid decision');
    END IF;

    SELECT * INTO v_lawsuit FROM commercial_lawsuits WHERE id = p_lawsuit_id FOR UPDATE;
    IF v_lawsuit.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Lawsuit not found');
    END IF;
    IF v_lawsuit.status <> 'settle_offered' THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Lawsuit is %s; no settlement offer pending', v_lawsuit.status));
    END IF;

    SELECT * INTO v_plaintiff FROM factions WHERE id = v_lawsuit.plaintiff_faction_id FOR UPDATE;
    IF v_plaintiff.id <> v_user
       AND COALESCE(v_plaintiff.linked_user_id, '00000000-0000-0000-0000-000000000000'::uuid) <> v_user THEN
        RETURN jsonb_build_object('success', false, 'error', 'You are not the plaintiff');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    v_amount := COALESCE(v_lawsuit.settle_offer_amount, 0);

    IF p_decision = 'accept' THEN
        -- Defendant pays plaintiff. Pre-check defendant still has the
        -- cash; if not, settlement collapses and plaintiff returns to
        -- awaiting_trial (defendant's broken commitment isn't the
        -- plaintiff's loss).
        SELECT * INTO v_defendant FROM factions WHERE id = v_lawsuit.defendant_faction_id FOR UPDATE;
        IF COALESCE(v_defendant.corp_cash_reserves, 0) < v_amount THEN
            UPDATE commercial_lawsuits
               SET status = 'awaiting_trial', updated_at = now()
             WHERE id = p_lawsuit_id;
            RETURN jsonb_build_object('success', false,
                'error', 'Defendant no longer has the cash to settle; case proceeds to trial');
        END IF;

        PERFORM emit_corp_cash_event(v_defendant.id, 'capital_out', 'Lawsuit settlement paid',     -v_amount, v_tick);
        PERFORM emit_corp_cash_event(v_plaintiff.id, 'capital_in',  'Lawsuit settlement received',  v_amount, v_tick);

        UPDATE commercial_lawsuits
           SET status         = 'settled',
               closed_at_tick = v_tick,
               ruling         = jsonb_build_object('settled_amount', v_amount, 'method', 'private_settlement'),
               updated_at     = now()
         WHERE id = p_lawsuit_id;
    ELSE  -- reject
        UPDATE commercial_lawsuits
           SET status = 'awaiting_trial', updated_at = now()
         WHERE id = p_lawsuit_id;
    END IF;

    INSERT INTO event_log (
        nation_id, faction_id,
        event_name, description_used,
        category, trigger_key,
        effects_applied, fired_at_tick
    ) VALUES (
        v_lawsuit.nation_id, v_plaintiff.id,
        'Settlement ' || (CASE p_decision WHEN 'accept' THEN 'Accepted' ELSE 'Rejected' END),
        COALESCE(v_plaintiff.faction_name, 'Plaintiff') || ' '
            || CASE p_decision
                 WHEN 'accept' THEN 'accepted a $' || to_char(v_amount, 'FM999,999,999,999') || ' settlement.'
                 ELSE              'rejected the settlement offer; case proceeds to trial.'
               END,
        'legal',
        'lawsuit_settlement_decision',
        jsonb_build_object(
            'lawsuit_id', p_lawsuit_id,
            'decision',   p_decision,
            'amount',     v_amount
        ),
        v_tick
    );

    RETURN jsonb_build_object(
        'success',     true,
        'lawsuit_id',  p_lawsuit_id,
        'decision',    p_decision,
        'amount',      v_amount
    );
END;
$$;

GRANT EXECUTE ON FUNCTION respond_to_settle_offer(UUID, TEXT) TO authenticated;


-- ── 6. process_lawsuit_deadlines: auto-concede sweeper ───────────
-- Called once per tick from advance-corp-tick. Flips any pending
-- lawsuit past response_deadline_tick to auto_concede. Service-role
-- only — no GRANT to authenticated.
CREATE OR REPLACE FUNCTION process_lawsuit_deadlines() RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tick INT;
    v_count INT;
BEGIN
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

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
        RETURNING id, nation_id, defendant_faction_id, plaintiff_faction_id
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

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;


COMMIT;

NOTIFY pgrst, 'reload schema';
