-- ══════════════════════════════════════════════════════════════
-- Phase 6 fixes (critical):
--   (1) Spawn trigger fires on UPDATE OF status as well as INSERT,
--       so trade_agreements that flip from non-active to active via
--       UPDATE also get their shipping contracts spawned.
--   (2) place_shipping_offer subtracts already-committed freighters
--       (winning bids on awarded contracts) from corp_freighters
--       before validating the new offer's allocation. Without this,
--       a corp with 3 freighters could win 3 separate contracts that
--       each ask for 3 freighters and end up over-committed.
--
-- Phase 6 fix (3) — auto-renewal on contract maturity — lives in
-- advance-corp-tick/index.ts (TypeScript), not here.
-- ══════════════════════════════════════════════════════════════


-- ══════════════════════════════════════════════════════════════
-- 1. Spawn trigger now fires on activation via UPDATE too.
--
-- Phase 2's trigger only fired on INSERT. If a trade_agreements row
-- gets created in 'pending' or any non-active state and later flips
-- to 'active' through an UPDATE, the spawn logic was silently
-- skipped — buyer sees an active agreement but no shipping contract
-- ever spawns. Fix: replace the trigger function so it gates on
-- TG_OP and the OLD/NEW status pair, then bind it to both INSERT
-- and UPDATE OF status events.
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION spawn_shipping_contracts_for_agreement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $func$
DECLARE
    v_article       JSONB;
    v_buyer_id      UUID;
    v_seller_id     UUID;
    v_buyer_name    TEXT;
    v_seller_name   TEXT;
    v_buyer_port    TEXT;
    v_seller_port   TEXT;
    v_volume        INT;
    v_priority      TEXT;
    v_freighters    INT;
    v_tick          INT;
    v_term          INT;
    v_bid_window    INT := 1;
    v_author_id     UUID;
BEGIN
    -- Don't double-spawn. On UPDATE, only fire when transitioning
    -- INTO 'active'; if the row was already active, the INSERT
    -- trigger (or a previous activation) already spawned.
    IF TG_OP = 'UPDATE' THEN
        IF OLD.status = 'active' THEN
            RETURN NEW;
        END IF;
    END IF;
    IF NEW.status IS DISTINCT FROM 'active' THEN
        RETURN NEW;
    END IF;

    SELECT current_tick INTO v_tick
      FROM shard
     WHERE name = 'Alpha Shard'
     LIMIT 1;
    IF v_tick IS NULL THEN v_tick := 0; END IF;

    FOR v_article IN SELECT * FROM jsonb_array_elements(COALESCE(NEW.articles, '[]'::jsonb))
    LOOP
        IF (v_article->>'article_type') IS DISTINCT FROM 'trade_flow' THEN CONTINUE; END IF;
        IF (v_article->'data'->>'commodity') IS DISTINCT FROM 'energy'  THEN CONTINUE; END IF;

        v_volume := COALESCE((v_article->'data'->>'volume')::INT, 0);
        IF v_volume <= 0 THEN CONTINUE; END IF;

        v_priority := COALESCE(v_article->'data'->>'delivery_priority', 'cheapest');
        IF v_priority NOT IN ('fastest', 'safest', 'cheapest') THEN
            v_priority := 'cheapest';
        END IF;

        v_author_id := NULLIF(v_article->>'author_nation_id', '')::UUID;
        IF v_author_id IS NULL THEN v_author_id := NEW.nation_a_id; END IF;
        IF (v_article->'data'->>'direction') = 'a_buys_b' THEN
            v_buyer_id  := v_author_id;
            v_seller_id := CASE WHEN v_author_id = NEW.nation_a_id
                               THEN NEW.nation_b_id ELSE NEW.nation_a_id END;
        ELSE
            v_seller_id := v_author_id;
            v_buyer_id  := CASE WHEN v_author_id = NEW.nation_a_id
                               THEN NEW.nation_b_id ELSE NEW.nation_a_id END;
        END IF;

        SELECT name INTO v_buyer_name  FROM nations WHERE id = v_buyer_id;
        SELECT name INTO v_seller_name FROM nations WHERE id = v_seller_id;
        SELECT port_name INTO v_buyer_port  FROM nation_ports WHERE nation_id = v_buyer_id;
        SELECT port_name INTO v_seller_port FROM nation_ports WHERE nation_id = v_seller_id;

        IF v_buyer_port  IS NULL THEN v_buyer_port  := 'Port of ' || COALESCE(v_buyer_name,  'Buyer'); END IF;
        IF v_seller_port IS NULL THEN v_seller_port := 'Port of ' || COALESCE(v_seller_name, 'Seller'); END IF;

        v_freighters := GREATEST(1, CEIL(v_volume::numeric / 3.0)::INT);

        v_term := COALESCE(NULLIF((v_article->'data'->>'duration')::INT, 0), NEW.duration_ticks, 999);
        IF v_term <= 0 THEN v_term := 999; END IF;

        INSERT INTO shipping_contracts (
            nation_id, issuer_faction_id, issuer_name, contract_type,
            name, description,
            origin_port, destination_port, destination_nation_id,
            revenue_per_tick, term_ticks, freighters_required,
            min_fleet_health, max_route_risk,
            status, expires_at_tick, created_at_tick,
            trade_agreement_id, commodity, volume_required, delivery_priority,
            award_criterion
        ) VALUES (
            v_buyer_id, NULL,
            'Ministry of Trade — ' || COALESCE(v_buyer_name, 'Unknown'),
            'foreign',
            'Energy Supply: ' || COALESCE(v_seller_name, '?') || ' → ' || COALESCE(v_buyer_name, '?'),
            v_volume::TEXT || ' Energy/tick ◊ ' || v_priority || ' delivery preference',
            v_seller_port, v_buyer_port, v_buyer_id,
            1, v_term, v_freighters, 0, 10,
            'open', v_tick + v_bid_window, v_tick,
            NEW.id, 'energy', v_volume, v_priority,
            CASE v_priority
                WHEN 'fastest' THEN 'fastest_delivery'
                WHEN 'safest'  THEN 'lowest_risk'
                ELSE                'lowest_price'
            END
        );
    END LOOP;

    RETURN NEW;
END;
$func$;

DROP TRIGGER IF EXISTS trg_spawn_shipping_contracts            ON trade_agreements;
DROP TRIGGER IF EXISTS trg_spawn_shipping_contracts_on_activation ON trade_agreements;

CREATE TRIGGER trg_spawn_shipping_contracts
    AFTER INSERT ON trade_agreements
    FOR EACH ROW
    EXECUTE FUNCTION spawn_shipping_contracts_for_agreement();

CREATE TRIGGER trg_spawn_shipping_contracts_on_activation
    AFTER UPDATE OF status ON trade_agreements
    FOR EACH ROW
    EXECUTE FUNCTION spawn_shipping_contracts_for_agreement();


-- ══════════════════════════════════════════════════════════════
-- 2. place_shipping_offer subtracts active commitments.
--
-- Available freighters for a new bid =
--    corp_freighters − Σ(freighters_allocated on accepted bids
--                        whose parent contract is still 'awarded').
-- Pending bids are NOT subtracted: the corp is just shopping; multiple
-- pending bids on different contracts is normal. The Phase 6 auto-award
-- skip (in advance-corp-tick) catches the case where a corp wins more
-- contracts than they can physically cover.
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

    -- Phase 6: subtract committed freighters (winning bids on awarded
    -- contracts). Available = total − committed. The corp's *current*
    -- bid on THIS contract is excluded so re-submitting an offer
    -- doesn't fight itself for capacity.
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

    -- ── Modifier deltas (server-validated, identical to Phase 3) ──
    SELECT array_agg(value) INTO v_modifier_array
      FROM jsonb_array_elements_text(COALESCE(p_modifiers, '[]'::jsonb));
    IF v_modifier_array IS NULL THEN v_modifier_array := ARRAY['known']::TEXT[]; END IF;
    IF NOT ('known' = ANY(v_modifier_array)) THEN
        v_modifier_array := array_append(v_modifier_array, 'known');
    END IF;

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
      WHERE t.key IS NOT NULL;

    v_base_energy      := p_freighters_allocated * 3;
    v_delivered_energy := GREATEST(0, v_base_energy + v_energy_delta::INT);
    IF v_contract.volume_required IS NOT NULL THEN
        v_delivered_energy := LEAST(v_delivered_energy, v_contract.volume_required);
    END IF;

    v_operating_cost := (p_freighters_allocated * 3 + v_cost_add_m)::BIGINT * 1000000;
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
