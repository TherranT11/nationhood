-- ════════════════════════════════════════════════════════════════
-- Fix: place_shipping_offer was missing expires_at_tick +
-- created_at_tick from the INSERT, both NOT NULL on
-- shipping_contract_bids. The bug has been present since
-- 20260620_shipping_offer_bids and was carried forward unchanged
-- through every subsequent revision (20260622, 20260625, 20260940).
-- It only surfaces when a corp tries to submit a fresh offer (the
-- UPDATE-existing-bid branch never touches these fields). Hit
-- today by Calder Group bidding on a Hajjara-Danwei trade-agreement
-- contract.
--
-- Fix shape: re-issue place_shipping_offer with both fields supplied:
--   * expires_at_tick = v_contract.expires_at_tick — mirrors the
--     parent contract. For trade-agreement contracts this is
--     INT_MAX (sentinel from 20261018); for SOP contracts it's the
--     bid window close.
--   * created_at_tick = v_tick — current tick at submission.
--
-- Body is otherwise identical to 20260940. CREATE OR REPLACE so
-- existing GRANT and signature are preserved.
-- ════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION place_shipping_offer(
    p_contract_id          UUID,
    p_bidder_faction_id    UUID,
    p_freighters_allocated INT,
    p_modifiers            JSONB,
    p_markup_pct           INT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $func$
DECLARE
    v_user                 UUID := auth.uid();
    v_corp                 factions%ROWTYPE;
    v_contract             shipping_contracts%ROWTYPE;
    v_tick                 INT;
    v_modifier_array       TEXT[];
    v_energy_delta         NUMERIC := 0;
    v_risk_delta           NUMERIC := 0;
    v_base_energy          INT;
    v_delivered_energy     INT;
    v_trip_price           BIGINT;
    v_transit_ticks        INT;
    v_revenue_per_tick     BIGINT;
    v_existing_bid_id      UUID;
BEGIN
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    SELECT * INTO v_corp FROM factions WHERE id = p_bidder_faction_id;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Corporation not found');
    END IF;
    IF v_corp.id <> v_user AND v_corp.linked_user_id IS DISTINCT FROM v_user THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not own this corporation');
    END IF;
    IF v_corp.faction_type <> 'corporation' OR v_corp.corp_sector IS DISTINCT FROM 'Shipping' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Only Shipping corporations can place offers');
    END IF;

    SELECT * INTO v_contract FROM shipping_contracts WHERE id = p_contract_id;
    IF v_contract.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Contract not found');
    END IF;
    IF v_contract.status <> 'open' THEN
        RETURN jsonb_build_object('success', false, 'error', format('Contract is %s; cannot bid', v_contract.status));
    END IF;
    IF v_contract.trade_agreement_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'This contract is not a trade-agreement offer');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN v_tick := 0; END IF;
    IF v_contract.expires_at_tick <= v_tick THEN
        RETURN jsonb_build_object('success', false, 'error', 'Bid window has closed');
    END IF;

    IF p_freighters_allocated IS NULL OR p_freighters_allocated <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Allocate at least 1 freighter');
    END IF;
    IF p_freighters_allocated > FLOOR(COALESCE(v_corp.corp_freighters, 0))::INT THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Insufficient freighters: you have %s, offer requires %s',
                FLOOR(COALESCE(v_corp.corp_freighters, 0))::INT, p_freighters_allocated));
    END IF;

    IF p_markup_pct NOT IN (10, 20, 30, 40) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Markup must be 10, 20, 30, or 40');
    END IF;

    SELECT array_agg(value) INTO v_modifier_array
      FROM jsonb_array_elements_text(COALESCE(p_modifiers, '[]'::jsonb));
    IF v_modifier_array IS NULL THEN v_modifier_array := ARRAY['known']::TEXT[]; END IF;
    IF NOT ('known' = ANY(v_modifier_array)) THEN
        v_modifier_array := array_append(v_modifier_array, 'known');
    END IF;

    SELECT COALESCE(SUM(t.energy), 0),
           COALESCE(SUM(t.risk), 0)
      INTO v_energy_delta, v_risk_delta
      FROM unnest(v_modifier_array) AS m(key)
      LEFT JOIN (VALUES
        ('known',              0::NUMERIC,  0::NUMERIC),
        ('dangerous_waters',   2::NUMERIC,  1::NUMERIC),
        ('naval_escort',       0::NUMERIC, -2::NUMERIC),
        ('premium_insurance', -1::NUMERIC, -3::NUMERIC),
        ('bribe_port',         1::NUMERIC, -1::NUMERIC),
        ('rush_schedule',      3::NUMERIC,  2::NUMERIC)
      ) AS t(key, energy, risk) ON t.key = m.key
     WHERE t.key IS NOT NULL;

    v_base_energy      := p_freighters_allocated * 3;
    v_delivered_energy := GREATEST(0, v_base_energy + v_energy_delta::INT);
    IF v_contract.volume_required IS NOT NULL THEN
        v_delivered_energy := LEAST(v_delivered_energy, v_contract.volume_required);
    END IF;

    v_trip_price := CASE p_markup_pct
        WHEN 10 THEN 100000
        WHEN 20 THEN 200000
        WHEN 30 THEN 400000
        WHEN 40 THEN 600000
    END;

    v_transit_ticks    := GREATEST(1, COALESCE(v_contract.transit_ticks, 1));
    v_revenue_per_tick := (p_freighters_allocated::BIGINT * v_trip_price) / v_transit_ticks;

    SELECT id INTO v_existing_bid_id
      FROM shipping_contract_bids
     WHERE contract_id = p_contract_id AND bidder_faction_id = p_bidder_faction_id
     LIMIT 1;

    IF v_existing_bid_id IS NOT NULL THEN
        UPDATE shipping_contract_bids
           SET freighters_allocated     = p_freighters_allocated,
               modifiers                = to_jsonb(v_modifier_array),
               markup_pct               = p_markup_pct,
               energy_per_tick          = v_delivered_energy,
               route_risk_delta         = v_risk_delta,
               offered_revenue_per_tick = v_revenue_per_tick,
               offered_term_ticks       = v_contract.term_ticks,
               bidder_route_risk_snapshot = COALESCE(v_corp.corp_route_risk, 0) + v_risk_delta,
               status                   = 'pending',
               applied_at_tick          = v_tick
         WHERE id = v_existing_bid_id;
    ELSE
        INSERT INTO shipping_contract_bids (
            contract_id, bidder_faction_id,
            freighters_allocated, modifiers, markup_pct, energy_per_tick,
            route_risk_delta,
            offered_revenue_per_tick, offered_term_ticks,
            bidder_route_risk_snapshot,
            status, applied_at_tick,
            expires_at_tick, created_at_tick
        ) VALUES (
            p_contract_id, p_bidder_faction_id,
            p_freighters_allocated, to_jsonb(v_modifier_array), p_markup_pct, v_delivered_energy,
            v_risk_delta,
            v_revenue_per_tick, v_contract.term_ticks,
            COALESCE(v_corp.corp_route_risk, 0) + v_risk_delta,
            'pending', v_tick,
            v_contract.expires_at_tick, v_tick
        );
    END IF;

    RETURN jsonb_build_object(
        'success',                true,
        'replaced',               v_existing_bid_id IS NOT NULL,
        'energy_per_tick',        v_delivered_energy,
        'route_risk_delta',       v_risk_delta,
        'trip_price_per_freighter', v_trip_price,
        'transit_ticks',          v_transit_ticks,
        'revenue_per_tick',       v_revenue_per_tick
    );
END;
$func$;

GRANT EXECUTE ON FUNCTION place_shipping_offer(UUID, UUID, INT, JSONB, INT) TO authenticated;

COMMENT ON FUNCTION place_shipping_offer(UUID, UUID, INT, JSONB, INT) IS
    'Trade-agreement shipping bid. markup_pct {10,20,30,40} selects a per-trip-per-freighter price tier {$100k,$200k,$400k,$600k}. revenue_per_tick = freighters × tier / transit_ticks. Modifiers shift route_risk_delta + energy_per_tick; they do not change buyer-paid price. Auto-award by processTradeAgreementShipping.';

NOTIFY pgrst, 'reload schema';

COMMIT;
