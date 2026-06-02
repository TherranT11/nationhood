-- ════════════════════════════════════════════════════════════════════
-- 20270513 — Counsel offer: nation gate + advocate-side resolution
--
-- Design constraint: only corporations headquartered in an advocate's
-- bar nation may offer to retain them. Accepting an offer pays the
-- advocate +1 Reputation. No cap on how many corps an advocate may
-- represent at once.
--
-- This migration ships:
--   • list_available_advocates re-authored to filter by
--     bar_admitted_nation_id = corp.hq_nation_id (was: any
--     bar-admitted politician).
--   • list_counsel_offers_for_advocate(p_faction_id) — the advocate's
--     side of the queue. Pending offers from corps in the advocate's
--     bar nation, with corp name + CEO display name.
--   • accept_counsel_offer(p_offer_id) — flips status to 'accepted',
--     awards +1 politician_reputation. Idempotent via the
--     FOR UPDATE → status check; a replay returns 'already_resolved'
--     without re-crediting.
--   • reject_counsel_offer(p_offer_id) — flips status to 'declined',
--     no stat change. Same idempotency gate.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── list_available_advocates (re-author with nation gate) ───────────
CREATE OR REPLACE FUNCTION public.list_available_advocates(p_corp_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid           uuid := auth.uid();
    v_corp          entrepreneur_corps%ROWTYPE;
    v_owner_user_id uuid;
    v_advocates     jsonb;
    v_pending_count int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    SELECT * INTO v_corp FROM public.entrepreneur_corps WHERE id = p_corp_id;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.hq_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_no_nation');
    END IF;

    SELECT COALESCE(linked_user_id, id) INTO v_owner_user_id
      FROM public.factions WHERE id = v_corp.owner_faction_id;
    IF v_owner_user_id IS DISTINCT FROM v_uid THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    SELECT count(*) INTO v_pending_count
      FROM public.corp_advocate_offers
     WHERE corp_id = p_corp_id AND status = 'pending';

    -- Only advocates admitted to THIS corp's HQ nation. Excludes
    -- politicians already accepted/declined for this corp; pending
    -- stay so the OFFER SENT pill renders.
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id',           p.id,
        'name',         btrim(COALESCE(p.leader_first_name, '') || ' ' || COALESCE(p.leader_last_name, '')),
        'nation_id',    p.bar_admitted_nation_id,
        'nation_name',  n.name,
        'standing',     p.politician_standing,
        'credibility',  p.politician_credibility,
        'reputation',   p.politician_reputation,
        'offer_status', o.status
    ) ORDER BY p.politician_standing DESC NULLS LAST), '[]'::jsonb)
      INTO v_advocates
      FROM public.factions p
      LEFT JOIN public.nations n ON n.id = p.bar_admitted_nation_id
      LEFT JOIN public.corp_advocate_offers o
             ON o.corp_id = p_corp_id AND o.politician_id = p.id
     WHERE p.faction_type = 'politician'
       AND p.bar_admitted_nation_id = v_corp.hq_nation_id
       AND p.abandoned_at IS NULL
       AND (o.status IS NULL OR o.status = 'pending');

    RETURN jsonb_build_object(
        'success',        true,
        'corp_id',        p_corp_id,
        'corp_name',      v_corp.name,
        'pending_offers', v_pending_count,
        'max_offers',     3,
        'advocates',      v_advocates
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.list_available_advocates(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.list_available_advocates(uuid) TO authenticated;

-- ── list_counsel_offers_for_advocate ────────────────────────────────
-- p_faction_id pins to the active politician (multi-politician
-- pattern). Returns pending offers from corps HQ'd in this advocate's
-- bar nation, joined with corp name and the CEO's display name for
-- the Pressing Issues card.
CREATE OR REPLACE FUNCTION public.list_counsel_offers_for_advocate(p_faction_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid    uuid := auth.uid();
    v_pol    factions%ROWTYPE;
    v_offers jsonb;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    SELECT * INTO v_pol FROM public.factions
     WHERE id = p_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;

    -- Non-advocates simply have no offers. Return empty rather than
    -- an error so the Pressing Issues fetch is robust for everyone.
    IF v_pol.bar_admitted_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', true, 'offers', '[]'::jsonb);
    END IF;

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'offer_id',   o.id,
        'corp_id',    c.id,
        'corp_name',  c.name,
        'ceo_name',   btrim(COALESCE(owner.leader_first_name, '') || ' ' || COALESCE(owner.leader_last_name, '')),
        'offered_at', o.offered_at
    ) ORDER BY o.offered_at DESC), '[]'::jsonb)
      INTO v_offers
      FROM public.corp_advocate_offers o
      JOIN public.entrepreneur_corps c ON c.id = o.corp_id
      LEFT JOIN public.factions owner   ON owner.id = c.owner_faction_id
     WHERE o.politician_id   = v_pol.id
       AND o.status          = 'pending'
       AND c.hq_nation_id    = v_pol.bar_admitted_nation_id;

    RETURN jsonb_build_object('success', true, 'offers', v_offers);
END $$;

REVOKE EXECUTE ON FUNCTION public.list_counsel_offers_for_advocate(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.list_counsel_offers_for_advocate(uuid) TO authenticated;

-- ── accept_counsel_offer ────────────────────────────────────────────
-- Flips status pending → accepted and pays +1 politician_reputation.
-- FOR UPDATE on the offer row + status check serialises a replay so
-- a double-fire returns 'already_resolved' instead of double-crediting.
CREATE OR REPLACE FUNCTION public.accept_counsel_offer(p_offer_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid        uuid := auth.uid();
    v_offer      corp_advocate_offers%ROWTYPE;
    v_pol        factions%ROWTYPE;
    v_corp       entrepreneur_corps%ROWTYPE;
    v_reputation int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_offer_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    SELECT * INTO v_offer FROM public.corp_advocate_offers
     WHERE id = p_offer_id FOR UPDATE;
    IF v_offer.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'offer_not_found');
    END IF;
    IF v_offer.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_resolved',
            'status', v_offer.status);
    END IF;

    SELECT * INTO v_pol FROM public.factions
     WHERE id = v_offer.politician_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_offered_politician');
    END IF;

    -- Defense in depth: re-verify nation match in case
    -- bar_admitted_nation_id or hq_nation_id changed since the offer.
    SELECT * INTO v_corp FROM public.entrepreneur_corps
     WHERE id = v_offer.corp_id;
    IF v_corp.id IS NULL
       OR v_corp.hq_nation_id IS DISTINCT FROM v_pol.bar_admitted_nation_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_mismatch');
    END IF;

    UPDATE public.corp_advocate_offers
       SET status = 'accepted', resolved_at = now()
     WHERE id = p_offer_id;

    UPDATE public.factions
       SET politician_reputation = COALESCE(politician_reputation, 0) + 1
     WHERE id = v_pol.id
    RETURNING politician_reputation INTO v_reputation;

    RETURN jsonb_build_object(
        'success',          true,
        'offer_id',         p_offer_id,
        'corp_id',          v_offer.corp_id,
        'reputation_delta', 1,
        'new_reputation',   v_reputation
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.accept_counsel_offer(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.accept_counsel_offer(uuid) TO authenticated;

-- ── reject_counsel_offer ────────────────────────────────────────────
-- Flips status pending → declined. No stat change. Same FOR UPDATE
-- idempotency gate as accept.
CREATE OR REPLACE FUNCTION public.reject_counsel_offer(p_offer_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid   uuid := auth.uid();
    v_offer corp_advocate_offers%ROWTYPE;
    v_pol   factions%ROWTYPE;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_offer_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    SELECT * INTO v_offer FROM public.corp_advocate_offers
     WHERE id = p_offer_id FOR UPDATE;
    IF v_offer.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'offer_not_found');
    END IF;
    IF v_offer.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_resolved',
            'status', v_offer.status);
    END IF;

    SELECT * INTO v_pol FROM public.factions
     WHERE id = v_offer.politician_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_offered_politician');
    END IF;

    UPDATE public.corp_advocate_offers
       SET status = 'declined', resolved_at = now()
     WHERE id = p_offer_id;

    RETURN jsonb_build_object(
        'success',  true,
        'offer_id', p_offer_id,
        'corp_id',  v_offer.corp_id
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.reject_counsel_offer(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.reject_counsel_offer(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
