-- ─────────────────────────────────────────────────────────────────────────────
-- ent_cancel_construction_request — issuer pulls an open private contract.
--
-- request_building_construction posts the contract in 'open' status; bidders
-- queue up via ent_place_construction_bid; if nobody bids by the close tick,
-- process_ent_construction_contracts auto-cancels (20270225:561). Between
-- post and that auto-cancel the issuer had no manual exit — even when zero
-- bids ever arrived. This RPC closes that gap.
--
-- No money refunded because none was charged: request_building_construction
-- doesn't debit a post fee (the comment at 20270225:395-399 calls out that
-- the floor only needs to be affordable at completion). A bid that's been
-- rejected stays rejected — those builders are still locked out per the
-- lockout check in ent_place_construction_bid (20270245:134-137).
--
-- Hard precondition: zero PENDING bids. Rejected bids don't block the
-- cancel — they wouldn't have been awarded anyway. If a bid lands between
-- the UI render and this RPC call, the FOR UPDATE on the contract row
-- serialises against the place-bid path so the second runner sees the
-- updated state and we can return has_bids cleanly.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.ent_cancel_construction_request(
    p_contract_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid      uuid := auth.uid();
    v_fac      factions%ROWTYPE;
    v_corp     entrepreneur_corps%ROWTYPE;
    v_contract ent_construction_contracts%ROWTYPE;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    -- Lock the contract first — same order as accept/reject + the tick
    -- auto-award (20270245), so a bid landing concurrently serialises against
    -- this cancel and we see its row when we re-check has_bids.
    SELECT * INTO v_contract FROM ent_construction_contracts
     WHERE id = p_contract_id FOR UPDATE;
    IF v_contract.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'contract_not_found');
    END IF;
    IF v_contract.contract_type <> 'private' OR v_contract.issuer_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_private');
    END IF;
    IF v_contract.status <> 'open' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_open');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = v_contract.issuer_corp_id;
    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur' AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1;
    IF v_fac.id IS NULL OR v_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    IF EXISTS (SELECT 1 FROM ent_construction_bids
                WHERE contract_id = p_contract_id AND status = 'pending') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'has_bids');
    END IF;

    UPDATE ent_construction_contracts
       SET status = 'cancelled'
     WHERE id = p_contract_id;

    RETURN jsonb_build_object('success', true);
END;
$$;
GRANT EXECUTE ON FUNCTION public.ent_cancel_construction_request(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
