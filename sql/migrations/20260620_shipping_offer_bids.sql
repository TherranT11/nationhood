-- ══════════════════════════════════════════════════════════════
-- Phase 3: Shipping corp offer bids on trade-agreement contracts.
--
-- New flavor of shipping_contract_bids row that's structured like an
-- "offer" (freighters + route modifiers + markup) instead of a SOP-style
-- price/term bid. Used only for contracts spawned from trade agreements
-- (trade_agreement_id IS NOT NULL on the parent contract).
--
-- New columns are nullable since legacy SOP bids don't carry them.
-- A single bid can technically populate either set; the auto-award
-- logic in Phase 4 picks the right path based on the parent contract's
-- delivery_priority (set ⇒ offer-style, NULL ⇒ SOP-style).
-- ══════════════════════════════════════════════════════════════

ALTER TABLE shipping_contract_bids
    ADD COLUMN IF NOT EXISTS freighters_allocated INT,
    ADD COLUMN IF NOT EXISTS modifiers            JSONB,
    ADD COLUMN IF NOT EXISTS markup_pct           INT,
    ADD COLUMN IF NOT EXISTS energy_per_tick      INT,
    ADD COLUMN IF NOT EXISTS route_risk_delta     NUMERIC(4,2);

COMMENT ON COLUMN shipping_contract_bids.freighters_allocated IS
    'Phase 3: # of freighters the corp commits to this route. Each carries 3 Energy/tick base capacity. NULL on SOP-style bids.';
COMMENT ON COLUMN shipping_contract_bids.modifiers IS
    'Phase 3: array of selected route modifier keys (e.g. ["known","naval_escort","rush_schedule"]). Server-validated against the modifier table inside place_shipping_offer.';
COMMENT ON COLUMN shipping_contract_bids.markup_pct IS
    'Phase 3: corp markup over operating cost. Allowed values: 10/15/20/25/30. Total offer = operating × (1 + markup_pct/100).';
COMMENT ON COLUMN shipping_contract_bids.energy_per_tick IS
    'Phase 3: actual energy/tick this offer commits to deliver (post modifiers, capped at the parent contract volume_required). Drives the fastest-delivery comparison in Phase 4.';
COMMENT ON COLUMN shipping_contract_bids.route_risk_delta IS
    'Phase 3: sum of route_risk effects from selected modifiers. Drives the safest-delivery comparison in Phase 4 (smaller = safer).';


-- ══════════════════════════════════════════════════════════════
-- place_shipping_offer RPC — Phase 3 offer-style bid
--
-- Validates ownership, sector gate, contract status, and that the
-- caller has enough freighters allocated. Modifier deltas are
-- defined server-side (not client-trusted) via an inline VALUES
-- table; client only passes the modifier KEYS.
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION place_shipping_offer(
    p_contract_id          UUID,
    p_bidder_faction_id    UUID,
    p_freighters_allocated INT,
    p_modifiers            JSONB,        -- array of modifier keys
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
    v_cost_add_m           NUMERIC := 0;     -- additional cost in $M
    v_base_energy          INT;
    v_delivered_energy     INT;
    v_operating_cost       BIGINT;
    v_markup_amount        BIGINT;
    v_total_offer          BIGINT;
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
    IF p_freighters_allocated > FLOOR(COALESCE(v_corp.corp_freighters, 0))::INT THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Insufficient freighters: you have %s, offer requires %s',
                FLOOR(COALESCE(v_corp.corp_freighters, 0))::INT, p_freighters_allocated));
    END IF;
    IF p_markup_pct IS NULL OR p_markup_pct NOT IN (10, 15, 20, 25, 30) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Markup must be 10, 15, 20, 25, or 30');
    END IF;

    -- Resolve modifier deltas from a trusted server-side table. Clients
    -- only pass the KEY array; the magnitudes never come from the wire.
    -- 'known' is the always-on baseline (zero deltas).
    SELECT array_agg(value) INTO v_modifier_array
      FROM jsonb_array_elements_text(COALESCE(p_modifiers, '[]'::jsonb));

    IF v_modifier_array IS NULL THEN v_modifier_array := ARRAY['known']::TEXT[]; END IF;
    -- Always force 'known' into the set so cost/risk math has a stable
    -- baseline even if the client forgets it.
    IF NOT ('known' = ANY(v_modifier_array)) THEN
        v_modifier_array := array_append(v_modifier_array, 'known');
    END IF;

    -- VALUES table is the single source of truth for modifier deltas.
    -- Aggregate across the modifier_array; LEFT JOIN drops unknown keys
    -- silently rather than rejecting the offer for a typo.
    SELECT COALESCE(SUM(t.energy), 0),
           COALESCE(SUM(t.risk), 0),
           COALESCE(SUM(t.cost_m), 0)
      INTO v_energy_delta, v_risk_delta, v_cost_add_m
      FROM unnest(v_modifier_array) AS m(key)
      LEFT JOIN (VALUES
        ('known',              0::NUMERIC,  0::NUMERIC, 0::NUMERIC),
        ('dangerous_waters',   2::NUMERIC,  1::NUMERIC, 0::NUMERIC),
        ('naval_escort',       0::NUMERIC, -2::NUMERIC, 8::NUMERIC),
        ('premium_insurance', -1::NUMERIC, -3::NUMERIC, 3::NUMERIC),
        ('bribe_port',         1::NUMERIC, -1::NUMERIC, 4::NUMERIC),
        ('rush_schedule',      3::NUMERIC,  2::NUMERIC, 5::NUMERIC)
      ) AS t(key, energy, risk, cost_m) ON t.key = m.key
      WHERE t.key IS NOT NULL;  -- silently drop unknown modifier keys

    -- Compute final offer numbers.
    v_base_energy      := p_freighters_allocated * 3;
    v_delivered_energy := GREATEST(0, v_base_energy + v_energy_delta::INT);
    -- Cap delivery at agreement volume — corps can't deliver more than
    -- the buyer asked for, even with high-energy modifiers.
    IF v_contract.volume_required IS NOT NULL THEN
        v_delivered_energy := LEAST(v_delivered_energy, v_contract.volume_required);
    END IF;

    -- Operating cost: freighters × $3M/tick + modifier additions, in dollars.
    v_operating_cost := (p_freighters_allocated * 3 + v_cost_add_m)::BIGINT * 1000000;
    v_markup_amount  := (v_operating_cost * p_markup_pct / 100)::BIGINT;
    v_total_offer    := v_operating_cost + v_markup_amount;

    -- One offer per (contract, corp). Re-submit replaces the previous
    -- offer so a corp can iterate before the bid window closes.
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
        'total_offer_per_tick',   v_total_offer
    );
END;
$func$;

GRANT EXECUTE ON FUNCTION place_shipping_offer(UUID, UUID, INT, JSONB, INT) TO authenticated;

COMMENT ON FUNCTION place_shipping_offer(UUID, UUID, INT, JSONB, INT) IS
    'Phase 3 offer-style bid on a trade-agreement-linked shipping_contracts row. Validates ownership, sector, freighter availability, and modifier allowlist (server-side magnitudes); inserts/updates one shipping_contract_bids row with the computed energy_per_tick / route_risk_delta / total_offer_per_tick. Re-submitting before the bid window closes overwrites the prior offer.';

NOTIFY pgrst, 'reload schema';
