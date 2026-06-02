-- ════════════════════════════════════════════════════════════════════
-- 20270512 — Corporate legal-counsel retainer offers
--
-- The RETAIN COUNSEL card on entrepreneur-corp.html opens a modal
-- listing every bar-admitted advocate in the world. The CEO (corp
-- owner) can offer to retain up to three advocates at a time; each
-- offer is pending until the advocate accepts or declines (advocate-
-- side resolution UI lands later).
--
-- This migration ships:
--   • corp_advocate_offers table (corp × politician, status, audit).
--   • list_available_advocates(p_corp_id) — owner-gated; returns
--     bar-admitted politicians who haven't already resolved this
--     corp's offer (accepted/declined excluded), their three core
--     stats, and the corp's pending-offer count.
--   • offer_corp_retainer(p_corp_id, p_politician_id) — owner-gated;
--     creates a pending offer, capped at 3 pending per corp; idempotent
--     via UNIQUE(corp_id, politician_id).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE TABLE IF NOT EXISTS public.corp_advocate_offers (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    corp_id             uuid NOT NULL REFERENCES public.entrepreneur_corps(id) ON DELETE CASCADE,
    politician_id       uuid NOT NULL REFERENCES public.factions(id) ON DELETE CASCADE,
    offered_by_user_id  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    status              text NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'accepted', 'declined', 'withdrawn')),
    offered_at          timestamptz NOT NULL DEFAULT now(),
    resolved_at         timestamptz,
    UNIQUE (corp_id, politician_id)
);

CREATE INDEX IF NOT EXISTS idx_corp_advocate_offers_corp
    ON public.corp_advocate_offers (corp_id, status);
CREATE INDEX IF NOT EXISTS idx_corp_advocate_offers_politician
    ON public.corp_advocate_offers (politician_id, status);

-- All access through SECURITY DEFINER RPCs.
ALTER TABLE public.corp_advocate_offers ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.corp_advocate_offers IS
    'Corp-to-advocate retainer offers. status pending = awaiting advocate decision. UNIQUE(corp_id, politician_id) means a corp can offer to a given advocate at most once; re-offer after decline requires a future migration to relax this.';

-- ── list_available_advocates ────────────────────────────────────────
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

    -- Owner-gated: only the CEO (corp owner) can see the retain list.
    SELECT COALESCE(linked_user_id, id) INTO v_owner_user_id
      FROM public.factions WHERE id = v_corp.owner_faction_id;
    IF v_owner_user_id IS DISTINCT FROM v_uid THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    SELECT count(*) INTO v_pending_count
      FROM public.corp_advocate_offers
     WHERE corp_id = p_corp_id AND status = 'pending';

    -- All bar-admitted politicians who haven't ACCEPTED or DECLINED
    -- this corp's offer. Pending offers stay in the list (with the
    -- 'pending' status flag) so the OFFER SENT pill renders.
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
       AND p.bar_admitted_nation_id IS NOT NULL
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

-- ── offer_corp_retainer ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.offer_corp_retainer(
    p_corp_id       uuid,
    p_politician_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid           uuid := auth.uid();
    v_corp          entrepreneur_corps%ROWTYPE;
    v_owner_user_id uuid;
    v_pol           factions%ROWTYPE;
    v_pending_count int;
    v_offer_id      uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL OR p_politician_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    SELECT * INTO v_corp FROM public.entrepreneur_corps
     WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;

    SELECT COALESCE(linked_user_id, id) INTO v_owner_user_id
      FROM public.factions WHERE id = v_corp.owner_faction_id;
    IF v_owner_user_id IS DISTINCT FROM v_uid THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    SELECT * INTO v_pol FROM public.factions WHERE id = p_politician_id;
    IF v_pol.id IS NULL OR v_pol.faction_type <> 'politician' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_a_politician');
    END IF;
    IF v_pol.bar_admitted_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_advocate');
    END IF;
    IF v_pol.abandoned_at IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'advocate_inactive');
    END IF;

    -- 3-offer cap on pending. Resolved offers (accepted/declined) don't
    -- count, but a re-offer to a declined advocate is blocked by the
    -- UNIQUE constraint anyway (future relaxation lands separately).
    SELECT count(*) INTO v_pending_count
      FROM public.corp_advocate_offers
     WHERE corp_id = p_corp_id AND status = 'pending';
    IF v_pending_count >= 3 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'offer_limit_reached');
    END IF;

    INSERT INTO public.corp_advocate_offers (corp_id, politician_id, offered_by_user_id)
    VALUES (p_corp_id, p_politician_id, v_uid)
    ON CONFLICT (corp_id, politician_id) DO NOTHING
    RETURNING id INTO v_offer_id;

    IF v_offer_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_offered_or_resolved');
    END IF;

    RETURN jsonb_build_object(
        'success',       true,
        'offer_id',      v_offer_id,
        'corp_id',       p_corp_id,
        'politician_id', p_politician_id,
        'pending_count', v_pending_count + 1
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.offer_corp_retainer(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.offer_corp_retainer(uuid, uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
