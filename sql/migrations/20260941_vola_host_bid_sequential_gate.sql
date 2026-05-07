-- ════════════════════════════════════════════════════════════════
-- VWC host-bid sequencing.
--
-- Per design clarification: Cup N+1's bid window only opens 1 tick
-- after Cup N's start tick — so the modal can't show a cup as
-- "AVAILABLE" if the previous cup hasn't started yet. Adds a
-- server-side gate to bid_to_host_vwc so the RPC mirrors the UI
-- rule (defense in depth: even if a future client refresh slips
-- past, the DB still rejects).
--
-- Cup_number → cup_start_tick: 84 + 24 × (cup_number - 1).
-- So prev cup (N-1) starts at: 84 + 24 × (cup_number - 2).
-- ════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION bid_to_host_vwc(p_cup_number INT)
RETURNS JSONB
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

    SELECT * INTO v_ministry FROM ministries
        WHERE ministry_key = 'sports' AND is_active = true
          AND EXISTS (
              SELECT 1 FROM factions f
              WHERE f.id = ministries.party_id
                AND (f.id = v_caller OR f.linked_user_id = v_caller)
          )
        ORDER BY created_at DESC LIMIT 1;
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
    -- Cup #1 has no predecessor and is unrestricted within its window.
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

    BEGIN
        INSERT INTO vola_host_bids (
            nation_id, cup_number, cup_start_tick, bid_at_tick
        ) VALUES (
            v_nation_id, p_cup_number, v_cup_start, v_tick
        );
    EXCEPTION WHEN unique_violation THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_bid');
    END;

    UPDATE ministries SET discretionary_balance = v_balance - v_cost
        WHERE id = v_ministry.id;

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

GRANT EXECUTE ON FUNCTION bid_to_host_vwc(INT) TO authenticated;

COMMENT ON FUNCTION bid_to_host_vwc(INT) IS
    'Sports Minister submits a host bid for the given cup number. Sequential gate: Cup N+1 only opens 1 tick after cupStart(N). UNIQUE on (nation_id, cup_number) enforces once-per-cycle. Resolution runs JS-side at cup_start_tick - 12.';

NOTIFY pgrst, 'reload schema';

COMMIT;
