-- ════════════════════════════════════════════════════════════════════
-- 20270773 — Retain Consultancy (corp → player offer/accept handshake)
--
-- The corp owner picks any active Entrepreneur or Politician and
-- offers them a consultancy fee from the corp treasury. The target
-- sees the offer in their Pressing Issues and accepts or declines:
--
--   • OFFER  (retain_corp_consultant): validates, ESCROWS the fee
--     (treasury debited immediately so the money is committed),
--     inserts a status='pending' row. Nothing in corporate history
--     yet — you haven't retained anyone until they say yes.
--   • ACCEPT (respond_consultancy_offer, p_accept=true): fee credits
--     the target's factions.party_funds; politician targets also
--     gain 1 politician_capital per $5,000,000 rounded down; the
--     corporate-history line lands:
--       public corp  → "{Corp} retained {Person} for a consultancy
--                       ($X,XXX,XXX)."
--       private corp → "{Corp} retained {Person} for a consultancy."
--     The amount always rides in effects_applied either way — the
--     redaction is display-only, so a future FIS subpoena can
--     surface the real figure for private corps.
--   • DECLINE: escrow refunds to the corp treasury, row closes.
--
-- One table is the single source of truth: corp_consultants rows
-- with status='pending' are the open offers; status='accepted' rows
-- are the consultant roster (the FIS investigation surface reads
-- these later).
--
-- Guards: owner-only offer; target must be an active entrepreneur
-- or politician; the owner cannot retain THEMSELVES (that's a
-- treasury withdrawal in a trench coat — and public corps can't
-- withdraw, so self-retain would dodge the use_dividend rule).
-- Retaining other factions on the same account (e.g. your own
-- politician) is deliberately allowed — that's the corruption
-- vector the FIS system exists to hunt, and it's fully logged.
--
-- Escrow edge: if the corp is disbanded while an offer is pending,
-- the row CASCADE-deletes and the escrowed fee goes down with the
-- liquidation — accepted as part of bankruptcy's blast radius.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Offers + roster table ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.corp_consultants (
    id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    corp_id               uuid NOT NULL REFERENCES entrepreneur_corps(id) ON DELETE CASCADE,
    consultant_faction_id uuid NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    amount                bigint NOT NULL CHECK (amount > 0),
    capital_granted       int    NOT NULL DEFAULT 0,
    status                text   NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','accepted','declined')),
    offered_at_tick       int    NOT NULL,
    resolved_at_tick      int,
    created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS corp_consultants_corp_idx
    ON public.corp_consultants (corp_id, status);
CREATE INDEX IF NOT EXISTS corp_consultants_pending_idx
    ON public.corp_consultants (consultant_faction_id, status)
    WHERE status = 'pending';

COMMENT ON TABLE public.corp_consultants IS
    'Consultancy offers + roster. retain_corp_consultant escrows the fee and inserts status=pending; respond_consultancy_offer pays out on accept (politicians: +1 politician_capital per $5M in capital_granted) or refunds the treasury on decline. status=accepted rows are the consultant roster the FIS surface reads. RPC-only writes. 20270773.';

ALTER TABLE public.corp_consultants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS corp_consultants_select ON public.corp_consultants;
CREATE POLICY corp_consultants_select ON public.corp_consultants
    FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS corp_consultants_service_all ON public.corp_consultants;
CREATE POLICY corp_consultants_service_all ON public.corp_consultants
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── 2. retain_corp_consultant — make the offer (escrow) ──────────
CREATE OR REPLACE FUNCTION public.retain_corp_consultant(
    p_corp_id           uuid,
    p_target_faction_id uuid,
    p_amount            bigint
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid    uuid := auth.uid();
    v_fac    factions%ROWTYPE;
    v_corp   entrepreneur_corps%ROWTYPE;
    v_target factions%ROWTYPE;
    v_tick   int;
    v_id     uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL OR p_target_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_amount IS NULL OR p_amount < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_amount');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;

    -- Caller must own the corp. Same oldest-active resolution the
    -- other corp RPCs use (ent_design_engine et al).
    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur' AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1;
    IF v_fac.id IS NULL OR v_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    -- The owner can't retain themselves — that's a treasury
    -- withdrawal in a trench coat (and would dodge the public-corp
    -- use_dividend rule).
    IF p_target_faction_id = v_corp.owner_faction_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cannot_retain_self');
    END IF;

    SELECT * INTO v_target FROM factions
     WHERE id = p_target_faction_id
       AND faction_type IN ('entrepreneur', 'politician')
       AND abandoned_at IS NULL;
    IF v_target.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'target_not_found');
    END IF;

    -- One pending offer per (corp, target) at a time keeps the
    -- Pressing Issues surface tidy and blocks escrow stacking.
    IF EXISTS (SELECT 1 FROM corp_consultants
                WHERE corp_id = v_corp.id
                  AND consultant_faction_id = v_target.id
                  AND status = 'pending') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'offer_already_pending');
    END IF;

    IF COALESCE(v_corp.treasury_cash, 0) < p_amount THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_treasury',
            'have', COALESCE(v_corp.treasury_cash, 0), 'need', p_amount);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- Escrow: the fee leaves the treasury now, pays out (or refunds)
    -- when the target responds.
    UPDATE entrepreneur_corps
       SET treasury_cash = treasury_cash - p_amount
     WHERE id = v_corp.id;

    INSERT INTO corp_consultants (
        corp_id, consultant_faction_id, amount, offered_at_tick
    ) VALUES (
        v_corp.id, v_target.id, p_amount, v_tick
    ) RETURNING id INTO v_id;

    RETURN jsonb_build_object(
        'success',  true,
        'offer_id', v_id,
        'amount',   p_amount
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.retain_corp_consultant(uuid, uuid, bigint) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.retain_corp_consultant(uuid, uuid, bigint) TO authenticated;

-- ── 3. respond_consultancy_offer — accept / decline ──────────────
CREATE OR REPLACE FUNCTION public.respond_consultancy_offer(
    p_offer_id   uuid,
    p_faction_id uuid,
    p_accept     boolean
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid           uuid := auth.uid();
    v_target        factions%ROWTYPE;
    v_offer         corp_consultants%ROWTYPE;
    v_corp          entrepreneur_corps%ROWTYPE;
    v_tick          int;
    v_capital_grant int := 0;
    v_person_name   text;
    v_desc          text;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_offer_id IS NULL OR p_faction_id IS NULL OR p_accept IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    -- The responder must own the TARGET faction. Either faction type.
    SELECT * INTO v_target FROM factions
     WHERE id = p_faction_id
       AND faction_type IN ('entrepreneur', 'politician')
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     FOR UPDATE;
    IF v_target.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_faction');
    END IF;

    SELECT * INTO v_offer FROM corp_consultants
     WHERE id = p_offer_id
     FOR UPDATE;
    IF v_offer.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'offer_not_found');
    END IF;
    IF v_offer.consultant_faction_id <> v_target.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_your_offer');
    END IF;
    IF v_offer.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_resolved',
            'status', v_offer.status);
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps
     WHERE id = v_offer.corp_id
     FOR UPDATE;
    IF v_corp.id IS NULL THEN
        -- Corp vanished between offer and response (CASCADE should
        -- have taken the offer with it, but defend anyway).
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    IF NOT p_accept THEN
        -- Decline: refund the escrowed fee to the corp treasury.
        UPDATE entrepreneur_corps
           SET treasury_cash = COALESCE(treasury_cash, 0) + v_offer.amount
         WHERE id = v_corp.id;
        UPDATE corp_consultants
           SET status = 'declined', resolved_at_tick = v_tick
         WHERE id = v_offer.id;
        RETURN jsonb_build_object('success', true, 'accepted', false);
    END IF;

    -- Accept: pay out the escrow.
    UPDATE factions
       SET party_funds = COALESCE(party_funds, 0) + v_offer.amount
     WHERE id = v_target.id;

    -- Politician kicker: 1 Capital per $5M, rounded down.
    IF v_target.faction_type = 'politician' THEN
        v_capital_grant := floor(v_offer.amount / 5000000)::int;
        IF v_capital_grant > 0 THEN
            UPDATE factions
               SET politician_capital = COALESCE(politician_capital, 0) + v_capital_grant
             WHERE id = v_target.id;
        END IF;
    END IF;

    UPDATE corp_consultants
       SET status = 'accepted', resolved_at_tick = v_tick,
           capital_granted = v_capital_grant
     WHERE id = v_offer.id;

    v_person_name := btrim(COALESCE(v_target.leader_first_name, '') || ' ' || COALESCE(v_target.leader_last_name, ''));
    IF length(v_person_name) = 0 THEN
        v_person_name := COALESCE(v_target.faction_name, 'a consultant');
    END IF;

    -- Corporate history line — lands at ACCEPT. Amount shown only
    -- for public corps; the true figure always rides in
    -- effects_applied so a future FIS subpoena can surface it.
    IF v_corp.listing = 'public' THEN
        v_desc := v_corp.name || ' retained ' || v_person_name
               || ' for a consultancy ($' || to_char(v_offer.amount, 'FM999,999,999,999') || ').';
    ELSE
        v_desc := v_corp.name || ' retained ' || v_person_name || ' for a consultancy.';
    END IF;

    INSERT INTO event_log (
        nation_id, faction_id,
        event_name, description_used,
        category, trigger_key, effects_applied, fired_at_tick
    ) VALUES (
        v_corp.hq_nation_id, v_corp.owner_faction_id,
        'Consultancy Retained',
        v_desc,
        'business', 'corp_retained_consultant',
        jsonb_build_object(
            'corp_id',         v_corp.id,
            'consultant_id',   v_target.id,
            'consultant_type', v_target.faction_type,
            'amount',          v_offer.amount,
            'capital_granted', v_capital_grant,
            'offer_id',        v_offer.id
        ),
        v_tick
    );

    -- Politician recipients get a career-timeline row so the Capital
    -- bump is traceable on their side.
    IF v_target.faction_type = 'politician' THEN
        INSERT INTO politician_career_events (faction_id, event_tick, event_type, target_name, metadata)
        VALUES (
            v_target.id, v_tick, 'retained_as_consultant', v_corp.name,
            jsonb_build_object(
                'corp_id',         v_corp.id,
                'amount',          v_offer.amount,
                'capital_granted', v_capital_grant
            )
        );
    END IF;

    RETURN jsonb_build_object(
        'success',         true,
        'accepted',        true,
        'amount',          v_offer.amount,
        'capital_granted', v_capital_grant
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.respond_consultancy_offer(uuid, uuid, boolean) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.respond_consultancy_offer(uuid, uuid, boolean) TO authenticated;

-- ── 4. list_pending_consultancy_offers_for_faction ───────────────
-- Pressing Issues source for BOTH dashboards (entrepreneur +
-- politician targets).
CREATE OR REPLACE FUNCTION public.list_pending_consultancy_offers_for_faction(p_faction_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid    uuid := auth.uid();
    v_target factions%ROWTYPE;
    v_result jsonb;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_target FROM factions
     WHERE id = p_faction_id
       AND faction_type IN ('entrepreneur', 'politician')
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid);
    IF v_target.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_faction');
    END IF;

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'offer_id',        cc.id,
                'corp_id',         cc.corp_id,
                'corp_name',       ec.name,
                'amount',          cc.amount,
                'offered_at_tick', cc.offered_at_tick,
                'capital_preview', CASE WHEN v_target.faction_type = 'politician'
                                        THEN floor(cc.amount / 5000000)::int
                                        ELSE 0 END
           ) ORDER BY cc.offered_at_tick DESC), '[]'::jsonb)
      INTO v_result
      FROM corp_consultants cc
      JOIN entrepreneur_corps ec ON ec.id = cc.corp_id
     WHERE cc.consultant_faction_id = v_target.id
       AND cc.status = 'pending';

    RETURN jsonb_build_object('success', true, 'offers', v_result);
END $$;

REVOKE EXECUTE ON FUNCTION public.list_pending_consultancy_offers_for_faction(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.list_pending_consultancy_offers_for_faction(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
