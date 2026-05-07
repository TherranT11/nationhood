-- ════════════════════════════════════════════════════════════════
-- Trade-agreement shipping rework, part 1 of 2.
--
-- Two changes in one transaction so the system never observes a
-- mid-state where the new spawn trigger is live but legacy organic
-- routes are still being generated:
--
--   1. Widen `spawn_shipping_contracts_for_agreement` to spawn a
--      shipping_contracts row for EVERY trade_flow article on a
--      ratified agreement, not just energy. Uniform freighter math
--      (3 units / freighter / tick) across all commodities. Bid
--      window bumped 1 → 3 ticks so corps have a real shot at
--      bidding before the auto-award fires.
--
--   2. Retire organic routes (the System A pipeline). Active
--      shipping_routes get marked expired; pending
--      shipping_applications get auto_rejected. Tables stay so
--      historic awarded shipping_claims keep delivering revenue
--      to completion — the tick handler stops generating new
--      organic rows separately (advance-corp-tick code change).
--
-- Schema note:
--   Adds shipping_contracts.transit_ticks so place_shipping_offer
--   can convert per-trip pricing into per-tick revenue without
--   re-resolving the diplomatic_relations row at bid time.
-- ════════════════════════════════════════════════════════════════

BEGIN;

-- ── Schema: transit_ticks on shipping_contracts ──────────────
ALTER TABLE shipping_contracts
    ADD COLUMN IF NOT EXISTS transit_ticks INT;

COMMENT ON COLUMN shipping_contracts.transit_ticks IS
    'Trip latency in ticks for the buyer→seller leg. Set on spawn from diplomatic_relations.proximity (≥71 → 1, else 2). Drives per-tick revenue math in place_shipping_offer.';


-- ── Trigger: widen to all trade_flow commodities ─────────────
CREATE OR REPLACE FUNCTION spawn_shipping_contracts_for_agreement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $func$
DECLARE
    v_article       JSONB;
    v_commodity     TEXT;
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
    v_bid_window    INT := 3;   -- 3-tick window so corps can actually bid before auto-award
    v_author_id     UUID;
    v_proximity     NUMERIC;
    v_transit       INT;
BEGIN
    -- Only fire for active agreements. Withdrawn/expired/etc. don't
    -- spawn shipping contracts; if a re-activation flow ever exists,
    -- it can call this function explicitly.
    IF NEW.status IS DISTINCT FROM 'active' THEN
        RETURN NEW;
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN v_tick := 0; END IF;

    -- Loop articles. Skip non-trade_flow entries; every commodity
    -- (energy, minerals, grains, etc.) spawns its own contract.
    FOR v_article IN SELECT * FROM jsonb_array_elements(COALESCE(NEW.articles, '[]'::jsonb))
    LOOP
        IF (v_article->>'article_type') IS DISTINCT FROM 'trade_flow' THEN
            CONTINUE;
        END IF;

        v_commodity := COALESCE(v_article->'data'->>'commodity', '');
        IF v_commodity = '' THEN
            CONTINUE;
        END IF;

        v_volume := COALESCE((v_article->'data'->>'volume')::INT, 0);
        IF v_volume <= 0 THEN
            CONTINUE;
        END IF;

        v_priority := COALESCE(v_article->'data'->>'delivery_priority', 'cheapest');
        IF v_priority NOT IN ('fastest', 'safest', 'cheapest') THEN
            v_priority := 'cheapest';
        END IF;

        -- Resolve buyer/seller from author_nation_id + direction.
        -- direction is author-relative: 'a_buys_b' means author buys.
        v_author_id := NULLIF(v_article->>'author_nation_id', '')::UUID;
        IF v_author_id IS NULL THEN
            v_author_id := NEW.nation_a_id;
        END IF;
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

        -- Transit ticks from diplomatic proximity. Mirrors the
        -- _shipTransitTicks rule in advance-corp-tick: prox ≥71 → 1,
        -- else 2. Order-independent lookup since the relations row
        -- can be stored either way.
        SELECT proximity INTO v_proximity
          FROM diplomatic_relations
         WHERE (nation_a_id = v_buyer_id  AND nation_b_id = v_seller_id)
            OR (nation_a_id = v_seller_id AND nation_b_id = v_buyer_id)
         LIMIT 1;
        v_transit := CASE WHEN COALESCE(v_proximity, 0) >= 71 THEN 1 ELSE 2 END;

        -- Uniform freighter math: 3 units / freighter / tick across
        -- every commodity for now. Different commodities can carry
        -- different conversion factors later by widening this column
        -- into a lookup, but the design check landed on uniform.
        v_freighters := GREATEST(1, CEIL(v_volume::numeric / 3.0)::INT);

        v_term := COALESCE(NULLIF((v_article->'data'->>'duration')::INT, 0), NEW.duration_ticks, 999);
        IF v_term <= 0 THEN v_term := 999; END IF;

        INSERT INTO shipping_contracts (
            nation_id, issuer_faction_id, issuer_name, contract_type,
            name, description,
            origin_port, destination_port, destination_nation_id,
            revenue_per_tick, term_ticks, transit_ticks, freighters_required,
            min_fleet_health, max_route_risk,
            status, expires_at_tick, created_at_tick,
            trade_agreement_id, commodity, volume_required, delivery_priority,
            award_criterion
        ) VALUES (
            v_buyer_id,
            NULL,
            'Ministry of Trade — ' || COALESCE(v_buyer_name, 'Unknown'),
            'foreign',
            INITCAP(REPLACE(v_commodity, '_', ' ')) || ' Supply: '
                || COALESCE(v_seller_name, '?') || ' → ' || COALESCE(v_buyer_name, '?'),
            v_volume::TEXT || ' ' || v_commodity || '/tick ◊ ' || v_priority || ' delivery preference',
            v_seller_port,
            v_buyer_port,
            v_buyer_id,
            -- Sentinel: real revenue lands when place_shipping_offer
            -- writes the winning bid's per-tick number on award.
            1,
            v_term,
            v_transit,
            v_freighters,
            0,
            10,
            'open',
            v_tick + v_bid_window,
            v_tick,
            NEW.id,
            v_commodity,
            v_volume,
            v_priority,
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

COMMENT ON FUNCTION spawn_shipping_contracts_for_agreement() IS
    'AFTER INSERT trigger on trade_agreements. Spawns one shipping_contracts row per trade_flow article (any commodity) on newly-active agreements, populating transit_ticks from diplomatic proximity. 3-tick bid window. Award handled by processTradeAgreementShipping at window close.';

DROP TRIGGER IF EXISTS trg_spawn_shipping_contracts ON trade_agreements;
CREATE TRIGGER trg_spawn_shipping_contracts
    AFTER INSERT ON trade_agreements
    FOR EACH ROW
    EXECUTE FUNCTION spawn_shipping_contracts_for_agreement();


-- ── Retire organic routes ────────────────────────────────────
-- Active shipping_routes → expired so corps can no longer bid.
-- Pending shipping_applications → auto_rejected so they don't
-- linger in the MoT review queue (which is also being removed).
-- Active shipping_claims are LEFT ALONE — corps that already won
-- routes finish out their contracts and earn revenue normally;
-- processShippingRoutes in advance-corp-tick keeps draining them.

UPDATE shipping_routes
   SET status = 'expired'
 WHERE status = 'active';

UPDATE shipping_applications
   SET status = 'auto_rejected',
       reviewed_at_tick = (SELECT current_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1)
 WHERE status = 'pending';


NOTIFY pgrst, 'reload schema';

COMMIT;
