-- ══════════════════════════════════════════════════════════════
-- Revise shipping route modifier costs (Phase 8.x balance pass).
--
-- Old → New per-tick cost ($M):
--   naval_escort        :   8   →  0.3
--   premium_insurance   :   3   →  0.1
--   bribe_port          :   4   → -0.2  (negative → reduces operating cost)
--   rush_schedule       :   5   → -0.5  (negative → reduces operating cost)
-- (dangerous_waters and known unchanged at 0.)
--
-- Negative cost_m means the modifier REDUCES operating cost — bribes
-- come out of cargo skim rather than the freighter line, rush
-- schedules cut transit fuel. Net effect: corps using Bribe + Rush
-- can offer at lower $/tick prices than baseline Known Route.
--
-- Fractional cast fix:
--   Old:  (freighters * 3 + cost_m)::BIGINT * 1000000
--         → fractional cost_m (e.g. 0.3) was truncated to 0 BEFORE
--           the ×1M multiplication, losing the cents.
--   New:  ((freighters * 3 + cost_m) * 1000000)::BIGINT
--         → multiplication happens first, BIGINT cast truncates only
--           sub-dollar fractions (acceptable rounding at $M scale).
--
-- Re-CREATEs place_shipping_offer with the corrected VALUES table
-- and cast precedence. Everything else identical to migration 20260622.
-- ══════════════════════════════════════════════════════════════

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
    v_cost_add_m           NUMERIC := 0;
    v_base_energy          INT;
    v_delivered_energy     INT;
    v_operating_cost       BIGINT;
    v_markup_amount        BIGINT;
    v_total_offer          BIGINT;
    v_existing_bid_id      UUID;
    v_committed            INT;
    v_available            INT;
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
        RETURN jsonb_build_object('success', false, 'error', 'This contract is not a trade-agreement offer; use place_shipping_bid instead');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN v_tick := 0; END IF;
    IF v_contract.expires_at_tick <= v_tick THEN
        RETURN jsonb_build_object('success', false, 'error', 'Bid window has closed');
    END IF;

    IF p_freighters_allocated IS NULL OR p_freighters_allocated <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Allocate at least 1 freighter');
    END IF;

    SELECT COALESCE(SUM(b.freighters_allocated), 0)
      INTO v_committed
      FROM shipping_contract_bids b
      JOIN shipping_contracts c ON c.id = b.contract_id
     WHERE b.bidder_faction_id = p_bidder_faction_id
       AND b.status            = 'accepted'
       AND c.status            = 'awarded'
       AND b.contract_id      <> p_contract_id;

    v_available := FLOOR(COALESCE(v_corp.corp_freighters, 0))::INT - v_committed;
    IF v_available < 0 THEN v_available := 0; END IF;

    IF p_freighters_allocated > v_available THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Insufficient freighters: %s available (%s total − %s committed to active routes), offer requires %s',
                v_available,
                FLOOR(COALESCE(v_corp.corp_freighters, 0))::INT,
                v_committed,
                p_freighters_allocated));
    END IF;
    IF p_markup_pct IS NULL OR p_markup_pct NOT IN (10, 15, 20, 25, 30) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Markup must be 10, 15, 20, 25, or 30');
    END IF;

    SELECT array_agg(value) INTO v_modifier_array
      FROM jsonb_array_elements_text(COALESCE(p_modifiers, '[]'::jsonb));
    IF v_modifier_array IS NULL THEN v_modifier_array := ARRAY['known']::TEXT[]; END IF;
    IF NOT ('known' = ANY(v_modifier_array)) THEN
        v_modifier_array := array_append(v_modifier_array, 'known');
    END IF;

    -- Revised cost table: naval_escort 0.3, premium_insurance 0.1,
    -- bribe_port -0.2, rush_schedule -0.5. Energy + risk deltas
    -- unchanged from migration 20260622.
    SELECT COALESCE(SUM(t.energy), 0),
           COALESCE(SUM(t.risk), 0),
           COALESCE(SUM(t.cost_m), 0)
      INTO v_energy_delta, v_risk_delta, v_cost_add_m
      FROM unnest(v_modifier_array) AS m(key)
      LEFT JOIN (VALUES
        ('known',              0::NUMERIC,  0::NUMERIC,  0::NUMERIC),
        ('dangerous_waters',   2::NUMERIC,  1::NUMERIC,  0::NUMERIC),
        ('naval_escort',       0::NUMERIC, -2::NUMERIC,  0.3::NUMERIC),
        ('premium_insurance', -1::NUMERIC, -3::NUMERIC,  0.1::NUMERIC),
        ('bribe_port',         1::NUMERIC, -1::NUMERIC, -0.2::NUMERIC),
        ('rush_schedule',      3::NUMERIC,  2::NUMERIC, -0.5::NUMERIC)
      ) AS t(key, energy, risk, cost_m) ON t.key = m.key
      WHERE t.key IS NOT NULL;

    v_base_energy      := p_freighters_allocated * 3;
    v_delivered_energy := GREATEST(0, v_base_energy + v_energy_delta::INT);
    IF v_contract.volume_required IS NOT NULL THEN
        v_delivered_energy := LEAST(v_delivered_energy, v_contract.volume_required);
    END IF;

    -- Cast precedence fix: multiply $M to dollars BEFORE the BIGINT
    -- cast so fractional cost_m values (0.3, 0.1, -0.2, -0.5) survive.
    -- Floor at zero so negative-cost modifiers can't drive operating
    -- cost below zero (which would invert markup math).
    v_operating_cost := GREATEST(0,
        ((p_freighters_allocated * 3 + v_cost_add_m) * 1000000)::BIGINT);
    v_markup_amount  := (v_operating_cost * p_markup_pct / 100)::BIGINT;
    v_total_offer    := v_operating_cost + v_markup_amount;

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
               offered_revenue_per_tick = v_total_offer,
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
            status, applied_at_tick
        ) VALUES (
            p_contract_id, p_bidder_faction_id,
            p_freighters_allocated, to_jsonb(v_modifier_array), p_markup_pct, v_delivered_energy,
            v_risk_delta,
            v_total_offer, v_contract.term_ticks,
            COALESCE(v_corp.corp_route_risk, 0) + v_risk_delta,
            'pending', v_tick
        );
    END IF;

    RETURN jsonb_build_object(
        'success',                true,
        'replaced',               v_existing_bid_id IS NOT NULL,
        'energy_per_tick',        v_delivered_energy,
        'route_risk_delta',       v_risk_delta,
        'operating_cost_per_tick', v_operating_cost,
        'markup_amount_per_tick', v_markup_amount,
        'total_offer_per_tick',   v_total_offer,
        'freighters_available',   v_available
    );
END;
$func$;

GRANT EXECUTE ON FUNCTION place_shipping_offer(UUID, UUID, INT, JSONB, INT) TO authenticated;

NOTIFY pgrst, 'reload schema';
