-- ══════════════════════════════════════════════════════════════
-- Path 1 Phase 1D: acknowledge_corp_contract_event RPC
--
-- Lets a player resolve a Pressing Issue early instead of waiting
-- for resolveExpiredCorpContractEvents to auto-resolve at
-- expires_at_tick. Same effect application either way:
--   - Apply response[0].cost  → deduct from corp_cash_reserves
--   - Apply response[0].delay → bump corp_contracts.expected_finish_tick
--   - Flip event status to RESOLVED with resolved_at_tick + key
--
-- Multi-choice events (response array length > 1) aren't a thing in
-- the current catalog — every event has a single 'acknowledge'
-- response per generateCorpContractProjectEvents. p_response_key is
-- accepted so the API doesn't have to change when multi-choice
-- events land later; for now, omitted/missing-key falls back to
-- response[0].
--
-- Ownership check: caller must be the corp the event is attached to
-- (event.faction_id matches auth.uid() or the corp's linked_user_id).
-- corp_contract_events has no client-write RLS policy, so writes
-- only ever go through this RPC + the tick processor.
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION acknowledge_corp_contract_event(
    p_event_id      UUID,
    p_response_key  TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
    v_user            UUID := auth.uid();
    v_event           corp_contract_events%ROWTYPE;
    v_corp            factions%ROWTYPE;
    v_tick            INT;
    v_response        JSONB;
    v_resp_arr        JSONB;
    v_resp_count      INT;
    v_picked_key      TEXT;
    v_cost            BIGINT;
    v_delay           INT;
    v_updated_count   INT;
BEGIN
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    SELECT * INTO v_event FROM corp_contract_events WHERE id = p_event_id;
    IF v_event.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Event not found');
    END IF;
    IF v_event.status <> 'ACTIVE' THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Event is %s; cannot acknowledge', v_event.status));
    END IF;

    -- Ownership: caller must own the corp this event belongs to.
    SELECT * INTO v_corp FROM factions WHERE id = v_event.faction_id;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Event corp not found');
    END IF;
    IF v_corp.id <> v_user AND v_corp.linked_user_id IS DISTINCT FROM v_user THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not own this corporation');
    END IF;

    -- Pick the response. If p_response_key was provided, look it up;
    -- otherwise (and on miss) fall back to responses[0].
    v_resp_arr := COALESCE(v_event.responses, '[]'::JSONB);
    v_resp_count := jsonb_array_length(v_resp_arr);
    IF v_resp_count = 0 THEN
        -- No responses defined — apply zero effect, just flip the status.
        v_response := jsonb_build_object('key', 'auto', 'cost', 0, 'delay', 0);
    ELSIF p_response_key IS NOT NULL THEN
        v_response := NULL;
        FOR i IN 0 .. v_resp_count - 1 LOOP
            IF (v_resp_arr -> i) ->> 'key' = p_response_key THEN
                v_response := v_resp_arr -> i;
                EXIT;
            END IF;
        END LOOP;
        IF v_response IS NULL THEN
            v_response := v_resp_arr -> 0;
        END IF;
    ELSE
        v_response := v_resp_arr -> 0;
    END IF;

    v_picked_key := COALESCE(v_response ->> 'key', 'auto');
    v_cost  := COALESCE((v_response ->> 'cost')::BIGINT, 0);
    v_delay := COALESCE((v_response ->> 'delay')::INT, 0);

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;

    -- Optimistic flip on status='ACTIVE' so a double-click can't apply
    -- the effect twice. If 0 rows match, someone (player or auto-resolve)
    -- already acted.
    UPDATE corp_contract_events
       SET status            = 'RESOLVED',
           resolved_at_tick  = v_tick,
           resolution_choice = v_picked_key,
           updated_at        = now()
     WHERE id     = p_event_id
       AND status = 'ACTIVE';
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    IF v_updated_count = 0 THEN
        RETURN jsonb_build_object('success', false,
            'error', 'Event already resolved or expired');
    END IF;

    -- Apply cost: atomic conditional debit so a low-cash corp doesn't
    -- go negative. If insufficient cash, deduct what's available and
    -- continue — the event still resolves, the corp just paid less
    -- than the full sticker. (Acknowledge mode is "I'll deal with it"
    -- — the player shouldn't be blocked by cash.)
    IF v_cost > 0 AND v_event.faction_id IS NOT NULL THEN
        UPDATE factions
           SET corp_cash_reserves = GREATEST(0, COALESCE(corp_cash_reserves, 0) - v_cost)
         WHERE id = v_event.faction_id;
    END IF;

    -- Apply delay: slip the contract's expected_finish_tick.
    IF v_delay > 0 THEN
        UPDATE corp_contracts
           SET expected_finish_tick = COALESCE(expected_finish_tick, 0) + v_delay
         WHERE id = v_event.contract_id;
    END IF;

    RETURN jsonb_build_object(
        'success',          true,
        'event_id',         p_event_id,
        'resolution_choice',v_picked_key,
        'cost_applied',     v_cost,
        'delay_applied',    v_delay
    );
END;
$func$;

GRANT EXECUTE ON FUNCTION acknowledge_corp_contract_event(UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION acknowledge_corp_contract_event(UUID, TEXT) IS
    'Player-triggered early-resolve of a corp_contract_events row. Validates corp ownership, applies the picked response''s cost + delay, flips status to RESOLVED. Idempotent via optimistic lock on status=ACTIVE.';
