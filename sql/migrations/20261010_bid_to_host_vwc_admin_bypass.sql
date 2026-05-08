-- ════════════════════════════════════════════════════════════════
-- bid_to_host_vwc: admin-override bypass on the auth gate.
--
-- Reported: clicking "Bid on Vola World Cup" from the admin panel's
-- per-faction override raised "Only the Sports Minister can submit
-- host bids." The override sets the client's _state.faction /
-- _state.nation to the inspected pair, but the RPC's auth.uid()
-- stays the admin's own UUID. Existing check —
--     f.id = auth.uid() OR f.linked_user_id = auth.uid()
-- — fails on factions that have no linked user (admin-spawned, AI,
-- placeholder), so the override couldn't drive the action.
--
-- Fix: short-circuit the faction-ownership EXISTS with is_admin().
-- An admin caller authenticates as themselves but is allowed to
-- act on the active Sports ministry of any p_nation_id. The
-- ministry lookup still has to land on a real, active sports
-- ministry of the requested nation — admins can't bid for a
-- nation that doesn't have one. Everything downstream
-- (discretionary balance check, atomic debit, sequential gate,
-- bid INSERT) is unchanged.
--
-- Idempotent (CREATE OR REPLACE).
-- ════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION bid_to_host_vwc(
    p_cup_number INT,
    p_nation_id  UUID
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_caller         UUID := auth.uid();
    v_cost           BIGINT := 10000000;
    v_ministry       ministries%ROWTYPE;
    v_nation_id      UUID;
    v_tick           INT;
    v_cup_start      INT;
    v_resolution     INT;
    v_prev_start     INT;
    v_existing_host  UUID;
    v_balance        NUMERIC;
    v_year           INT;
    v_ordinal        TEXT;
    v_nation_name    TEXT;
BEGIN
    IF p_cup_number IS NULL OR p_cup_number <= 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_cup');
    END IF;
    IF p_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_nation');
    END IF;

    -- Auth gate: caller must be the active Sports Minister of the
    -- requested nation, OR an admin acting through the override.
    -- is_admin() reads user_roles for auth.uid() = admin; admins still
    -- have to land on a real active sports ministry for p_nation_id.
    SELECT * INTO v_ministry FROM ministries
        WHERE ministry_key = 'sports'
          AND is_active = true
          AND nation_id = p_nation_id
          AND (
              is_admin()
              OR EXISTS (
                  SELECT 1 FROM factions f
                  WHERE f.id = ministries.party_id
                    AND (f.id = v_caller OR f.linked_user_id = v_caller)
              )
          )
        LIMIT 1;
    IF v_ministry.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_minister');
    END IF;
    v_nation_id := v_ministry.nation_id;
    v_balance := COALESCE(v_ministry.discretionary_balance, 0);

    IF v_balance < v_cost THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_balance',
            'balance', v_balance, 'cost', v_cost);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;

    v_cup_start  := 84 + 24 * (p_cup_number - 1);
    v_resolution := v_cup_start - 12;

    -- Sequential gate: Cup N+1 only opens 1 tick after cupStart(N).
    IF p_cup_number > 1 THEN
        v_prev_start := 84 + 24 * (p_cup_number - 2);
        IF v_tick <= v_prev_start THEN
            RETURN jsonb_build_object('success', false, 'reason', 'cup_not_open_yet',
                'prev_cup_start', v_prev_start, 'opens_at_tick', v_prev_start + 1);
        END IF;
    END IF;

    IF v_tick >= v_resolution THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bidding_closed');
    END IF;

    SELECT host_nation_id INTO v_existing_host FROM vola_cup_hosts
        WHERE cup_number = p_cup_number;
    IF v_existing_host IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_hosted');
    END IF;

    -- Atomic discretionary debit. The conditional UPDATE returns
    -- zero rows if the balance dropped below the cost between the
    -- earlier read and now (concurrent action against the same
    -- ministry); in that case we treat it as insufficient_balance
    -- and skip the bid INSERT entirely.
    UPDATE ministries
       SET discretionary_balance = discretionary_balance - v_cost
     WHERE id = v_ministry.id
       AND discretionary_balance >= v_cost;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_balance',
            'balance', v_balance, 'cost', v_cost);
    END IF;

    -- Insert the bid AFTER the debit committed. UNIQUE catches the
    -- "same nation already bid this cup" case; if it fires, refund
    -- the discretionary draw so the player isn't charged for a
    -- failed insert.
    BEGIN
        INSERT INTO vola_host_bids (
            nation_id, cup_number, cup_start_tick, bid_at_tick
        ) VALUES (
            v_nation_id, p_cup_number, v_cup_start, v_tick
        );
    EXCEPTION WHEN unique_violation THEN
        UPDATE ministries
           SET discretionary_balance = discretionary_balance + v_cost
         WHERE id = v_ministry.id;
        RETURN jsonb_build_object('success', false, 'reason', 'already_bid');
    END;

    SELECT name INTO v_nation_name FROM nations WHERE id = v_nation_id;
    v_year := 2000 + (v_cup_start / 12);
    v_ordinal := CASE
        WHEN p_cup_number % 100 BETWEEN 11 AND 13 THEN p_cup_number::TEXT || 'th'
        WHEN p_cup_number % 10 = 1 THEN p_cup_number::TEXT || 'st'
        WHEN p_cup_number % 10 = 2 THEN p_cup_number::TEXT || 'nd'
        WHEN p_cup_number % 10 = 3 THEN p_cup_number::TEXT || 'rd'
        ELSE p_cup_number::TEXT || 'th'
    END;

    INSERT INTO event_log (
        nation_id, event_name, category, trigger_key, description_chosen, fired_at_tick
    ) VALUES (
        v_nation_id, 'VWC Host Bid Submitted', 'political', 'vwc_host_bid_submitted',
        format('The nation of %s has submitted a bid to host the %s Vola World Cup in %s',
               COALESCE(v_nation_name, 'Unknown'), v_ordinal, v_year),
        v_tick
    );

    RETURN jsonb_build_object(
        'success',          true,
        'cup_number',       p_cup_number,
        'cup_start_tick',   v_cup_start,
        'resolution_tick',  v_resolution,
        'cost',             v_cost
    );
END;
$$;

GRANT EXECUTE ON FUNCTION bid_to_host_vwc(INT, UUID) TO authenticated;

COMMENT ON FUNCTION bid_to_host_vwc(INT, UUID) IS
    'Sports Minister submits a host bid for the given cup. Auth gate accepts (a) the active Sports Minister of p_nation_id, or (b) an admin acting through the override. Atomic discretionary debit + unique_violation refund. Sequential gate: Cup N+1 only opens 1 tick after cupStart(N).';

NOTIFY pgrst, 'reload schema';

COMMIT;
