-- 20260818_joint_equity_runtime.sql
--
-- Strategic Alliances — Push E: Joint Equity Ventures runtime.
--
-- Article spec: "Any equity stake purchased by a member corp is
-- automatically split across every alliance member for proportional
-- ownership and lending capital. Member corps may resell their equity
-- slices only to other alliance members."
--
-- Pieces:
--   1. New nullable column equity_positions.alliance_split (JSONB)
--      Carries the per-alliance ownership split when the article is
--      active for the investor at accept time. Shape:
--        { "alliance_id": <uuid>,
--          "members": [ { "faction_id": <uuid>, "share_pct": <num> }, ... ] }
--      NULL = no split (normal solo position). Future per-tick equity
--      payouts (E5, not yet built) will read this JSONB to distribute
--      proportionally; future resale RPC will gate on alliance membership
--      via _alliance_member_has_article.
--
--   2. Helper RPC _apply_joint_equity_split(position_id, investor_id) —
--      gates on article membership, computes equal split across all
--      active members (including the investor per design call: a
--      4-member alliance gives investor 25% + each peer 25%), stamps
--      alliance_split JSONB, deducts 0.5 corp_lending_capital_max from
--      each PEER (excluding investor), recomputes peer stats. Same
--      0.5 LC value as Syndicated Lending Portfolio (Push D) for
--      consistency across Banking pushes. Returns peer count.
--
--   3. accept_equity_offer re-issued from the 20260604 body with one
--      PERFORM call after the position is minted. Same minimal-diff
--      pattern as the _fire_negotiation hook (Push B) and the
--      declare_corp_bankruptcy hook (Push C).
--
-- DEFERRED:
--   * Sale/resale gate ("members may resell only to other alliance
--     members") — no transfer/sale RPC exists in the equity system
--     today (status enum is pending_payout/active/closed; no transfer
--     state). When a resale RPC is built it'll check
--     alliance_split IS NOT NULL and reject non-member buyers via
--     _alliance_member_has_article. Hook is documented here so the
--     gate gets added when the system arrives.
--   * Per-tick payout distribution — pay_out_equity exists but the
--     ongoing per-tick profit-share processor (E5 in the equity
--     pipeline plan) hasn't shipped. The alliance_split JSONB is
--     ready for E5 to consume when it lands.
--   * Ownership-cascade on member leave — when a member leaves a JEV
--     alliance, their slices on existing positions just orphan. A
--     follow-up could redistribute or close. Out of scope for v1.

BEGIN;

-- ── 1. Schema column ─────────────────────────────────────────────
ALTER TABLE equity_positions
    ADD COLUMN IF NOT EXISTS alliance_split JSONB;

COMMENT ON COLUMN equity_positions.alliance_split IS
    'Per-alliance ownership split when Joint Equity Ventures was active for the investor at accept time. Shape: {alliance_id, members: [{faction_id, share_pct}]}. NULL = no split (normal solo position). Future per-tick payouts (E5) read this to distribute proportionally; future resale RPC checks for non-NULL to gate sales to alliance peers only.';


-- ── 2. Per-position split helper ─────────────────────────────────
CREATE OR REPLACE FUNCTION _apply_joint_equity_split(
    p_position_id           UUID,
    p_investor_faction_id   UUID
) RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_lc_per_peer  CONSTANT NUMERIC := 0.5;
    v_alliance_id  UUID;
    v_member_ids   UUID[];
    v_member_n     INT;
    v_share_pct    NUMERIC;
    v_split_json   JSONB;
    v_peer_count   INT := 0;
    v_peer_id      UUID;
BEGIN
    -- Fast no-op: investor isn't in a JEV alliance.
    v_alliance_id := _alliance_member_has_article(p_investor_faction_id, 'joint_equity');
    IF v_alliance_id IS NULL THEN RETURN 0; END IF;

    -- Gather every active member (investor included).
    SELECT array_agg(faction_id)
    INTO v_member_ids
    FROM alliance_members
    WHERE alliance_id = v_alliance_id AND left_at_tick IS NULL;

    v_member_n := COALESCE(array_length(v_member_ids, 1), 0);
    -- Solo alliance (only the investor, peers all left): nothing to
    -- split with. Position stays solo, no LC penalty fires.
    IF v_member_n <= 1 THEN RETURN 0; END IF;

    -- Equal split across every member (including investor).
    -- 4 members → 25% each. Round to 4 dp; rounding drift on the
    -- last member is acceptable for accounting since payouts will
    -- normalize on read.
    v_share_pct := ROUND(100.0 / v_member_n, 4);

    -- Build the JSONB record.
    SELECT jsonb_build_object(
        'alliance_id', v_alliance_id,
        'members',     jsonb_agg(jsonb_build_object(
                            'faction_id', mid,
                            'share_pct',  v_share_pct
                       ))
    )
    INTO v_split_json
    FROM unnest(v_member_ids) AS mid;

    UPDATE equity_positions
    SET alliance_split = v_split_json,
        updated_at     = now()
    WHERE id = p_position_id;

    -- Deduct 0.5 LC max from each PEER (investor excluded — they put
    -- up the cash via pay_out_equity; peers contribute lending capacity).
    FOREACH v_peer_id IN ARRAY v_member_ids LOOP
        IF v_peer_id = p_investor_faction_id THEN CONTINUE; END IF;
        UPDATE factions
        SET corp_lending_capital_max = GREATEST(
            0::numeric,
            COALESCE(corp_lending_capital_max, 5) - v_lc_per_peer
        )
        WHERE id = v_peer_id;
        PERFORM recompute_finance_stats(v_peer_id);
        v_peer_count := v_peer_count + 1;
    END LOOP;

    RETURN v_peer_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION _apply_joint_equity_split(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION _apply_joint_equity_split(UUID, UUID) TO service_role;

COMMENT ON FUNCTION _apply_joint_equity_split(UUID, UUID) IS
    'Joint Equity Ventures runtime. If the investor is in an alliance with the article ratified and at least one peer is active, stamps an alliance_split JSONB onto the equity_positions row (equal share across every member including investor) and deducts 0.5 corp_lending_capital_max from each peer (investor excluded). Returns peer count.';


-- ── 3. accept_equity_offer — call helper after minting position ──
-- Re-issue from the 20260604 body with one PERFORM line after the
-- INSERT INTO equity_positions ... RETURNING id INTO v_position_id.
-- Function body otherwise unchanged.
CREATE OR REPLACE FUNCTION accept_equity_offer(
    p_offer_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
    v_user           UUID := auth.uid();
    v_offer          equity_offers%ROWTYPE;
    v_raise          equity_raises%ROWTYPE;
    v_borrower       factions%ROWTYPE;
    v_tick           INT;
    v_position_id    UUID;
    v_updated_count  INT;
    v_split_peers    INT := 0;
BEGIN
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    SELECT * INTO v_offer FROM equity_offers WHERE id = p_offer_id;
    IF v_offer.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Offer not found');
    END IF;
    IF v_offer.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Offer is %s; cannot accept', v_offer.status));
    END IF;

    SELECT * INTO v_raise FROM equity_raises WHERE id = v_offer.raise_id;
    IF v_raise.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Equity raise not found');
    END IF;
    IF v_raise.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Raise is %s; cannot accept offers', v_raise.status));
    END IF;

    SELECT * INTO v_borrower FROM factions WHERE id = v_raise.requesting_faction_id;
    IF v_borrower.id IS NULL OR
       (v_borrower.id <> v_user AND v_borrower.linked_user_id IS DISTINCT FROM v_user) THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not own this faction');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;

    UPDATE equity_offers
       SET status            = 'accepted',
           resolved_at_tick  = v_tick,
           updated_at        = now()
     WHERE id     = p_offer_id
       AND status = 'pending';
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    IF v_updated_count = 0 THEN
        RETURN jsonb_build_object('success', false,
            'error', 'Offer changed state before accept (accepted or expired by another path)');
    END IF;

    UPDATE equity_offers
       SET status            = 'auto_rejected',
           resolved_at_tick  = v_tick,
           updated_at        = now()
     WHERE raise_id = v_offer.raise_id
       AND id      <> p_offer_id
       AND status   = 'pending';

    UPDATE equity_raises
       SET status             = 'accepted',
           winning_finance_id = v_offer.finance_faction_id,
           resolved_at_tick   = v_tick,
           updated_at         = now()
     WHERE id     = v_offer.raise_id
       AND status = 'pending';
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    IF v_updated_count = 0 THEN
        RAISE EXCEPTION 'Raise resolved by another action just now; try refresh';
    END IF;

    INSERT INTO equity_positions (
        raise_id, offer_id, investor_faction_id, borrower_faction_id, nation_id,
        principal, equity_pct, series, status, issued_at_tick
    ) VALUES (
        v_offer.raise_id,
        p_offer_id,
        v_offer.finance_faction_id,
        v_raise.requesting_faction_id,
        v_raise.requesting_nation_id,
        v_offer.offered_amount,
        v_offer.offered_equity_pct,
        v_raise.series,
        'pending_payout',
        v_tick
    ) RETURNING id INTO v_position_id;

    -- ── Joint Equity Ventures (added in 20260818) ──
    -- No-op when the investor isn't in a JEV alliance with peers.
    v_split_peers := _apply_joint_equity_split(v_position_id, v_offer.finance_faction_id);

    RETURN jsonb_build_object(
        'success',          true,
        'position_id',      v_position_id,
        'status',           'pending_payout',
        'message',          'Offer accepted. Investor uses Pay Out Equity to disburse.',
        'jev_split_peers',  v_split_peers
    );
END;
$func$;

GRANT EXECUTE ON FUNCTION accept_equity_offer(UUID) TO authenticated;

COMMIT;

NOTIFY pgrst, 'reload schema';
