-- ════════════════════════════════════════════════════════════════════════════════
-- RPC: resolve_construction_event
-- Date: 2026-04-02
--
-- Called by the client when a player chooses a response to a project event.
-- Validates ownership, applies effects (cost, delay, quality), marks resolved.
-- ════════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION resolve_construction_event(
    p_event_id UUID,
    p_response_key TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_event RECORD;
    v_response JSONB;
    v_cost BIGINT := 0;
    v_delay INT := 0;
    v_quality INT := 0;
    v_detail TEXT := '';
    v_tag TEXT := '';
    v_faction_id UUID;
    v_contract_id UUID;
    v_current_cash BIGINT;
    v_current_timeline INT;
    v_current_quality INT;
    v_bid_id UUID;
BEGIN
    -- 1. Load the event and validate it's ACTIVE
    SELECT * INTO v_event
    FROM construction_events
    WHERE id = p_event_id AND status = 'ACTIVE';

    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'Event not found or not active');
    END IF;

    -- 2. Validate the caller owns this event's faction
    IF NOT EXISTS (
        SELECT 1 FROM factions
        WHERE id = v_event.faction_id AND linked_user_id = auth.uid()
    ) THEN
        RETURN jsonb_build_object('error', 'Not authorized');
    END IF;

    v_faction_id := v_event.faction_id;
    v_contract_id := v_event.contract_id;

    -- 3. Find the chosen response in the responses array
    SELECT elem INTO v_response
    FROM jsonb_array_elements(v_event.responses) AS elem
    WHERE elem->>'key' = p_response_key;

    IF v_response IS NULL THEN
        RETURN jsonb_build_object('error', 'Invalid response key');
    END IF;

    v_cost := COALESCE((v_response->>'cost')::BIGINT, 0);
    v_delay := COALESCE((v_response->>'delay')::INT, 0);
    v_quality := COALESCE((v_response->>'qualityImpact')::INT, 0);
    v_detail := COALESCE(v_response->>'detail', '');
    v_tag := COALESCE(v_response->>'tag', '');

    -- 4. Apply cost — deduct from corp cash reserves
    IF v_cost > 0 THEN
        SELECT corp_cash_reserves INTO v_current_cash
        FROM factions WHERE id = v_faction_id;

        UPDATE factions
        SET corp_cash_reserves = GREATEST(0, COALESCE(v_current_cash, 0) - v_cost)
        WHERE id = v_faction_id;
    END IF;

    -- 5. Apply delay — extend contract timeline_ticks
    IF v_delay > 0 THEN
        SELECT timeline_ticks INTO v_current_timeline
        FROM construction_contracts WHERE id = v_contract_id;

        UPDATE construction_contracts
        SET timeline_ticks = COALESCE(v_current_timeline, 8) + v_delay
        WHERE id = v_contract_id;
    END IF;

    -- 6. Apply quality impact — modify the winning bid's estimated_quality
    IF v_quality <> 0 THEN
        SELECT id, estimated_quality INTO v_bid_id, v_current_quality
        FROM contract_bids
        WHERE contract_id = v_contract_id AND status = 'won'
        LIMIT 1;

        IF v_bid_id IS NOT NULL THEN
            UPDATE contract_bids
            SET estimated_quality = GREATEST(0, LEAST(100, COALESCE(v_current_quality, 65) + v_quality))
            WHERE id = v_bid_id;
        END IF;
    END IF;

    -- 7. Mark event as resolved
    UPDATE construction_events SET
        status = 'RESOLVED',
        chosen_response = p_response_key,
        resolution = v_detail,
        resolved_at_tick = (SELECT current_tick FROM shard WHERE name = 'Alpha Shard'),
        cost_applied = v_cost,
        delay_applied = v_delay,
        quality_applied = v_quality
    WHERE id = p_event_id;

    -- 8. Return summary
    RETURN jsonb_build_object(
        'success', true,
        'response', p_response_key,
        'tag', v_tag,
        'cost_applied', v_cost,
        'delay_applied', v_delay,
        'quality_applied', v_quality
    );
END;
$$;

-- Grant to authenticated users (the function checks ownership internally)
GRANT EXECUTE ON FUNCTION resolve_construction_event(UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION resolve_construction_event IS 'Resolves a construction event by applying the chosen response effects (cost, delay, quality) and marking it resolved.';
