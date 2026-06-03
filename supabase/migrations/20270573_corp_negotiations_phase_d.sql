-- ════════════════════════════════════════════════════════════════════
-- 20270573 — Corporate Negotiations Phase D: signatures + binding
--
-- The final step in the drafting → binding pipeline.
--
-- Once all articles are locked, the contract sits at status=
-- 'awaiting_signatures'. Either CEO sets the expiry (a tick value
-- chosen via the corp-contract UI's month picker; conversion lives
-- client-side in tickToMonthString / monthStringToTick). Then each
-- CEO signs in turn. When both signatures land, _recalc_corp
-- _negotiation_status flips status to 'binding' and stamps
-- signed_at_tick.
--
-- Withdrawal of a signature is allowed (slides 'binding' back to
-- 'awaiting_signatures' if the second party walks; just clears the
-- signature otherwise). Once binding, articles + signatures are
-- frozen except via withdraw_signature. Cancellation is still
-- permitted in 'awaiting_signatures' but rejected in 'binding'
-- (Phase E will add a terminate path for binding contracts).
--
-- Article-editing freeze: once ANY signature exists, the five
-- article mutators (add / update / delete / agree / withdraw_
-- agreement) reject with 'negotiation_signed'. Encoded inside
-- _corp_negotiation_validate_caller so all five inherit it. The
-- sign + withdraw_signature RPCs validate independently.
--
-- New schema:
--   corp_negotiations.expires_at_tick INT  (chosen at signing time)
--   corp_negotiations.signed_at_tick   INT  (set when 2nd sig lands)
--   corp_negotiations.status CHECK widens to include 'binding'.
--   corp_negotiation_signatures table — composite PK on
--                                       (contract_id, corp_id).
--
-- New RPCs:
--   set_corp_negotiation_expires      — either CEO, before any sig
--   sign_corp_negotiation             — CEO of p_corp_id
--   withdraw_corp_negotiation_signature
--                                     — CEO of p_corp_id
--
-- Updated:
--   _recalc_corp_negotiation_status   — now also flips to 'binding'
--                                       and back
--   _corp_negotiation_validate_caller — freezes article edits once
--                                       signatures exist
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Schema additions ──────────────────────────────────────────
ALTER TABLE public.corp_negotiations
    DROP CONSTRAINT IF EXISTS corp_negotiations_status_check;
ALTER TABLE public.corp_negotiations
    ADD CONSTRAINT corp_negotiations_status_check
    CHECK (status IN ('drafting', 'awaiting_signatures', 'binding', 'cancelled'));

ALTER TABLE public.corp_negotiations
    ADD COLUMN IF NOT EXISTS expires_at_tick INT,
    ADD COLUMN IF NOT EXISTS signed_at_tick  INT;

CREATE TABLE IF NOT EXISTS public.corp_negotiation_signatures (
    contract_id          UUID NOT NULL REFERENCES public.corp_negotiations(id) ON DELETE CASCADE,
    corp_id              UUID NOT NULL REFERENCES public.entrepreneur_corps(id) ON DELETE CASCADE,
    signed_by_faction_id UUID REFERENCES public.factions(id) ON DELETE SET NULL,
    signed_at_tick       INT NOT NULL,
    PRIMARY KEY (contract_id, corp_id)
);

COMMENT ON TABLE public.corp_negotiation_signatures IS
    'One row per (contract, signing party). Composite PK enforces a single signature per party. Both rows present → contract status flips to binding. RPC-only.';

REVOKE ALL ON public.corp_negotiation_signatures FROM PUBLIC, anon, authenticated;

-- ── 2. _corp_negotiation_validate_caller — gain signature freeze ─
-- Same body as 20270571 plus an EXISTS check that rejects article
-- mutations once any signature row exists. The sign / withdraw_
-- signature RPCs don't go through this validator.
CREATE OR REPLACE FUNCTION public._corp_negotiation_validate_caller(
    p_negotiation_id UUID,
    p_corp_id        UUID
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_caller_faction_id UUID := public._corp_negotiation_caller_faction();
    v_neg               public.corp_negotiations%ROWTYPE;
BEGIN
    IF v_caller_faction_id IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'no_entrepreneur');
    END IF;
    SELECT * INTO v_neg FROM public.corp_negotiations
     WHERE id = p_negotiation_id;
    IF v_neg.id IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'negotiation_not_found');
    END IF;
    IF v_neg.status = 'cancelled' THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'negotiation_cancelled');
    END IF;
    -- Freeze article-level mutations once anyone has signed. Either
    -- CEO can call withdraw_signature to unfreeze.
    IF EXISTS (SELECT 1 FROM public.corp_negotiation_signatures
                WHERE contract_id = p_negotiation_id) THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'negotiation_signed');
    END IF;
    IF p_corp_id IS NULL OR p_corp_id NOT IN (v_neg.initiating_corp_id, v_neg.counterparty_corp_id) THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'corp_not_party');
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM public.entrepreneur_corps
         WHERE id = p_corp_id AND owner_faction_id = v_caller_faction_id
    ) THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'not_ceo');
    END IF;
    RETURN jsonb_build_object(
        'ok', true,
        'caller_faction_id', v_caller_faction_id,
        'negotiation_id',    v_neg.id
    );
END $$;

REVOKE EXECUTE ON FUNCTION public._corp_negotiation_validate_caller(uuid, uuid)
    FROM PUBLIC;

-- ── 3. _recalc_corp_negotiation_status — handle 'binding' ────────
-- Now considers signature count alongside article lock state.
-- Target shape:
--   articles=0 OR any unlocked          → 'drafting'
--   all locked, signatures <  2         → 'awaiting_signatures'
--   all locked, signatures >= 2         → 'binding'
-- Stamps signed_at_tick on the drafting→binding transition; clears
-- it on the binding→awaiting reversal so withdraw_signature really
-- does undo the binding state.
-- No-op on 'cancelled'.
CREATE OR REPLACE FUNCTION public._recalc_corp_negotiation_status(
    p_negotiation_id UUID
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_status     TEXT;
    v_total      INT;
    v_unlocked   INT;
    v_sig_count  INT;
    v_target     TEXT;
    v_tick       INT;
BEGIN
    SELECT status INTO v_status FROM public.corp_negotiations
     WHERE id = p_negotiation_id FOR UPDATE;
    IF v_status IS NULL OR v_status = 'cancelled' THEN
        RETURN;
    END IF;

    SELECT COUNT(*), COUNT(*) FILTER (WHERE NOT locked)
      INTO v_total, v_unlocked
      FROM public.corp_negotiation_articles
     WHERE negotiation_id = p_negotiation_id;

    SELECT COUNT(*) INTO v_sig_count
      FROM public.corp_negotiation_signatures
     WHERE contract_id = p_negotiation_id;

    v_target := CASE
        WHEN v_total = 0 OR v_unlocked > 0 THEN 'drafting'
        WHEN v_sig_count >= 2               THEN 'binding'
        ELSE                                     'awaiting_signatures'
    END;

    IF v_target = v_status THEN
        RETURN;
    END IF;

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;

    UPDATE public.corp_negotiations
       SET status         = v_target,
           signed_at_tick = CASE WHEN v_target = 'binding'
                                 THEN COALESCE(v_tick, 0) ELSE NULL END,
           updated_at     = now()
     WHERE id = p_negotiation_id;
END $$;

REVOKE EXECUTE ON FUNCTION public._recalc_corp_negotiation_status(uuid) FROM PUBLIC;

-- ── 4. set_corp_negotiation_expires ──────────────────────────────
-- Either CEO can set the expiry. Allowed only while in 'awaiting
-- _signatures' AND before any signature lands — once someone signs
-- the expiry locks (they're signing against a specific term).
CREATE OR REPLACE FUNCTION public.set_corp_negotiation_expires(
    p_contract_id    UUID,
    p_corp_id        UUID,
    p_expires_at_tick INT
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid                UUID := auth.uid();
    v_caller_faction_id  UUID;
    v_neg                public.corp_negotiations%ROWTYPE;
    v_tick               INT;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_contract_id IS NULL OR p_corp_id IS NULL OR p_expires_at_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    v_caller_faction_id := public._corp_negotiation_caller_faction();
    IF v_caller_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;

    SELECT * INTO v_neg FROM public.corp_negotiations
     WHERE id = p_contract_id FOR UPDATE;
    IF v_neg.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'negotiation_not_found');
    END IF;
    IF v_neg.status <> 'awaiting_signatures' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'wrong_status');
    END IF;

    -- Party + CEO check.
    IF p_corp_id NOT IN (v_neg.initiating_corp_id, v_neg.counterparty_corp_id) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_party');
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM public.entrepreneur_corps
         WHERE id = p_corp_id AND owner_faction_id = v_caller_faction_id
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_ceo');
    END IF;

    IF EXISTS (SELECT 1 FROM public.corp_negotiation_signatures
                WHERE contract_id = p_contract_id) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_signed');
    END IF;

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF p_expires_at_tick <= COALESCE(v_tick, 0) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'expiry_in_past');
    END IF;

    UPDATE public.corp_negotiations
       SET expires_at_tick = p_expires_at_tick,
           updated_at      = now()
     WHERE id = p_contract_id;

    RETURN jsonb_build_object('success', true, 'expires_at_tick', p_expires_at_tick);
END $$;

REVOKE EXECUTE ON FUNCTION public.set_corp_negotiation_expires(uuid, uuid, int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.set_corp_negotiation_expires(uuid, uuid, int) TO authenticated;

-- ── 5. sign_corp_negotiation ─────────────────────────────────────
-- CEO of p_corp_id signs. Requires status='awaiting_signatures' and
-- expires_at_tick already set. Second signature triggers _recalc
-- which flips status to 'binding'.
CREATE OR REPLACE FUNCTION public.sign_corp_negotiation(
    p_contract_id UUID,
    p_corp_id     UUID
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid                UUID := auth.uid();
    v_caller_faction_id  UUID;
    v_neg                public.corp_negotiations%ROWTYPE;
    v_tick               INT;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_contract_id IS NULL OR p_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    v_caller_faction_id := public._corp_negotiation_caller_faction();
    IF v_caller_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;

    SELECT * INTO v_neg FROM public.corp_negotiations
     WHERE id = p_contract_id FOR UPDATE;
    IF v_neg.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'negotiation_not_found');
    END IF;
    IF v_neg.status <> 'awaiting_signatures' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'wrong_status');
    END IF;
    IF v_neg.expires_at_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'expiry_not_set');
    END IF;

    IF p_corp_id NOT IN (v_neg.initiating_corp_id, v_neg.counterparty_corp_id) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_party');
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM public.entrepreneur_corps
         WHERE id = p_corp_id AND owner_faction_id = v_caller_faction_id
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_ceo');
    END IF;

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;

    -- ON CONFLICT DO NOTHING so re-clicking sign as the same corp is
    -- idempotent (counts as one signature).
    INSERT INTO public.corp_negotiation_signatures (
        contract_id, corp_id, signed_by_faction_id, signed_at_tick
    ) VALUES (
        p_contract_id, p_corp_id,
        v_caller_faction_id, COALESCE(v_tick, 0)
    ) ON CONFLICT (contract_id, corp_id) DO NOTHING;

    PERFORM public._recalc_corp_negotiation_status(p_contract_id);

    RETURN jsonb_build_object('success', true, 'contract_id', p_contract_id);
END $$;

REVOKE EXECUTE ON FUNCTION public.sign_corp_negotiation(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.sign_corp_negotiation(uuid, uuid) TO authenticated;

-- ── 6. withdraw_corp_negotiation_signature ───────────────────────
-- CEO of p_corp_id pulls their signature. Works from both
-- 'awaiting_signatures' (one party signed but not yet binding) and
-- 'binding' (slides back to awaiting_signatures via _recalc).
CREATE OR REPLACE FUNCTION public.withdraw_corp_negotiation_signature(
    p_contract_id UUID,
    p_corp_id     UUID
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid                UUID := auth.uid();
    v_caller_faction_id  UUID;
    v_neg                public.corp_negotiations%ROWTYPE;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_contract_id IS NULL OR p_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    v_caller_faction_id := public._corp_negotiation_caller_faction();
    IF v_caller_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;

    SELECT * INTO v_neg FROM public.corp_negotiations
     WHERE id = p_contract_id FOR UPDATE;
    IF v_neg.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'negotiation_not_found');
    END IF;
    IF v_neg.status NOT IN ('awaiting_signatures', 'binding') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'wrong_status');
    END IF;

    IF p_corp_id NOT IN (v_neg.initiating_corp_id, v_neg.counterparty_corp_id) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_party');
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM public.entrepreneur_corps
         WHERE id = p_corp_id AND owner_faction_id = v_caller_faction_id
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_ceo');
    END IF;

    DELETE FROM public.corp_negotiation_signatures
     WHERE contract_id = p_contract_id AND corp_id = p_corp_id;

    PERFORM public._recalc_corp_negotiation_status(p_contract_id);

    RETURN jsonb_build_object('success', true, 'contract_id', p_contract_id);
END $$;

REVOKE EXECUTE ON FUNCTION public.withdraw_corp_negotiation_signature(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.withdraw_corp_negotiation_signature(uuid, uuid) TO authenticated;

-- ── 7. cancel_corp_negotiation — block once binding ──────────────
-- Status guard widens cancellable set to include 'awaiting_signatures'
-- (already done in 20270571) but excludes 'binding'. Binding
-- contracts can be terminated in Phase E; cancellation is for
-- pre-binding only.
CREATE OR REPLACE FUNCTION public.cancel_corp_negotiation(
    p_contract_id UUID
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid                UUID := auth.uid();
    v_contract           public.corp_negotiations%ROWTYPE;
    v_caller_faction_id  UUID;
    v_tick               INT;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_contract_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    SELECT * INTO v_contract FROM public.corp_negotiations
     WHERE id = p_contract_id FOR UPDATE;
    IF v_contract.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'contract_not_found');
    END IF;
    IF v_contract.status NOT IN ('drafting', 'awaiting_signatures') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_cancellable');
    END IF;

    v_caller_faction_id := public._corp_negotiation_caller_faction();
    IF v_caller_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.entrepreneur_corps
         WHERE owner_faction_id = v_caller_faction_id
           AND id IN (v_contract.initiating_corp_id, v_contract.counterparty_corp_id)
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_party_ceo');
    END IF;

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;

    UPDATE public.corp_negotiations
       SET status                  = 'cancelled',
           cancelled_at_tick       = COALESCE(v_tick, 0),
           cancelled_by_faction_id = v_caller_faction_id,
           updated_at              = now()
     WHERE id = p_contract_id;

    RETURN jsonb_build_object('success', true, 'contract_id', p_contract_id);
END $$;

-- ── 8. get_corp_contract — payload includes signatures + expiry ──
CREATE OR REPLACE FUNCTION public.get_corp_contract(
    p_contract_id UUID
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid                  UUID := auth.uid();
    v_caller_faction_id    UUID;
    v_contract             public.corp_negotiations%ROWTYPE;
    v_initiating_name      TEXT;
    v_initiating_nation    TEXT;
    v_counterparty_name    TEXT;
    v_counterparty_nation  TEXT;
    v_articles             jsonb;
    v_signatures           jsonb;
    v_caller_corp_ids      jsonb;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_contract_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    SELECT * INTO v_contract FROM public.corp_negotiations WHERE id = p_contract_id;
    IF v_contract.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'contract_not_found');
    END IF;

    v_caller_faction_id := public._corp_negotiation_caller_faction();
    IF v_caller_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.entrepreneur_corps
         WHERE owner_faction_id = v_caller_faction_id
           AND id IN (v_contract.initiating_corp_id, v_contract.counterparty_corp_id)
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_party_ceo');
    END IF;

    SELECT ec.name, n.name INTO v_initiating_name, v_initiating_nation
      FROM public.entrepreneur_corps ec
      LEFT JOIN public.nations n ON n.id = ec.hq_nation_id
     WHERE ec.id = v_contract.initiating_corp_id;

    SELECT ec.name, n.name INTO v_counterparty_name, v_counterparty_nation
      FROM public.entrepreneur_corps ec
      LEFT JOIN public.nations n ON n.id = ec.hq_nation_id
     WHERE ec.id = v_contract.counterparty_corp_id;

    SELECT COALESCE(jsonb_agg(id), '[]'::jsonb)
      INTO v_caller_corp_ids
      FROM public.entrepreneur_corps
     WHERE owner_faction_id = v_caller_faction_id
       AND id IN (v_contract.initiating_corp_id, v_contract.counterparty_corp_id);

    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'id',              a.id,
                'title',           a.title,
                'body',            a.body,
                'locked',          a.locked,
                'created_at_tick', a.created_at_tick,
                'updated_at_tick', a.updated_at_tick,
                'parties_agreed',  COALESCE(ag.agreements, '[]'::jsonb)
            ) ORDER BY a.created_at ASC, a.id ASC
        ),
        '[]'::jsonb
    )
      INTO v_articles
      FROM public.corp_negotiation_articles a
      LEFT JOIN LATERAL (
        SELECT jsonb_agg(jsonb_build_object(
            'corp_id',        agr.corp_id,
            'corp_name',      ec.name,
            'agreed_at_tick', agr.agreed_at_tick
        )) AS agreements
          FROM public.corp_negotiation_article_agreements agr
          LEFT JOIN public.entrepreneur_corps ec ON ec.id = agr.corp_id
         WHERE agr.article_id = a.id
      ) ag ON TRUE
     WHERE a.negotiation_id = p_contract_id;

    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'corp_id',        s.corp_id,
                'corp_name',      ec.name,
                'signed_at_tick', s.signed_at_tick
            )
        ),
        '[]'::jsonb
    )
      INTO v_signatures
      FROM public.corp_negotiation_signatures s
      LEFT JOIN public.entrepreneur_corps ec ON ec.id = s.corp_id
     WHERE s.contract_id = p_contract_id;

    RETURN jsonb_build_object(
        'success', true,
        'contract', jsonb_build_object(
            'id',                       v_contract.id,
            'status',                   v_contract.status,
            'created_at_tick',          v_contract.created_at_tick,
            'cancelled_at_tick',        v_contract.cancelled_at_tick,
            'expires_at_tick',          v_contract.expires_at_tick,
            'signed_at_tick',           v_contract.signed_at_tick,
            'initiating_corp_id',       v_contract.initiating_corp_id,
            'initiating_corp_name',     v_initiating_name,
            'initiating_corp_nation',   v_initiating_nation,
            'counterparty_corp_id',     v_contract.counterparty_corp_id,
            'counterparty_corp_name',   v_counterparty_name,
            'counterparty_corp_nation', v_counterparty_nation,
            'caller_corp_ids',          v_caller_corp_ids,
            'articles',                 v_articles,
            'signatures',               v_signatures
        )
    );
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
