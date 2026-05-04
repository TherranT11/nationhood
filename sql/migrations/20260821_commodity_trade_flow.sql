-- 20260821_commodity_trade_flow.sql
--
-- Wire all five commodities (Energy, Minerals, Food, Consumer Goods,
-- Luxury Goods) into trade-flow delivery. Until now the spawn trigger
-- skipped any article whose commodity wasn't 'energy', so non-Energy
-- trade_flow articles ratified into trade_agreements but no shipping
-- contracts were created — the buyer's supply never updated and no
-- shipping corp could bid the lane.
--
-- Re-issues spawn_shipping_contracts_for_agreement() with the
-- commodity gate widened to the full set the trade-flow form now
-- offers. Same freighter math (1 freighter = 3 units/tick) regardless
-- of commodity — gameplay-balance per-commodity capacities can be
-- tuned later without re-doing this wiring.
--
-- Idempotent: CREATE OR REPLACE on the function, no schema changes.
-- Existing trade_agreements rows that pre-date this migration won't
-- retroactively spawn contracts — the trigger only fires AFTER
-- INSERT, so historical agreements stay as-is. Future ratifications
-- (and any agreement re-inserted by an admin tool) will spawn cleanly.

BEGIN;

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
    v_bid_window    INT := 1;   -- 1-tick window for offers to accumulate
    v_author_id     UUID;
    v_commodity_label TEXT;
BEGIN
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
        IF (v_article->>'article_type') IS DISTINCT FROM 'trade_flow' THEN
            CONTINUE;
        END IF;

        -- Accept any of the five canonical trade-flow commodities. The
        -- trade-flow form offers exactly this set; anything else on a
        -- legacy article (e.g. fuel_energy / manufactured_goods) is
        -- ignored so we don't double-spawn against the same lane.
        v_commodity := v_article->'data'->>'commodity';
        IF v_commodity IS NULL OR v_commodity NOT IN
            ('energy', 'minerals', 'food', 'consumer_goods', 'luxury_goods')
        THEN
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

        -- Same freighter math regardless of commodity (1 freighter
        -- carries 3 units/tick). Per-commodity cargo capacities can
        -- be introduced later without changing this wiring.
        v_freighters := GREATEST(1, CEIL(v_volume::numeric / 3.0)::INT);

        v_term := COALESCE(NULLIF((v_article->'data'->>'duration')::INT, 0), NEW.duration_ticks, 999);
        IF v_term <= 0 THEN v_term := 999; END IF;

        -- Display label for the contract name. Title-case the snake-
        -- case commodity key so 'consumer_goods' renders 'Consumer
        -- Goods' on the corp Available Routes view.
        v_commodity_label := initcap(replace(v_commodity, '_', ' '));

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
            v_buyer_id,
            NULL,
            'Ministry of Trade — ' || COALESCE(v_buyer_name, 'Unknown'),
            'foreign',
            v_commodity_label || ' Supply: ' || COALESCE(v_seller_name, '?') || ' → ' || COALESCE(v_buyer_name, '?'),
            v_volume::TEXT || ' ' || v_commodity_label || '/tick ◊ ' || v_priority || ' delivery preference',
            v_seller_port,
            v_buyer_port,
            v_buyer_id,
            1,
            v_term,
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
    'AFTER INSERT trigger on trade_agreements. Emits one shipping_contracts row per trade_flow article on a newly-active agreement, for any of the five canonical commodities (energy / minerals / food / consumer_goods / luxury_goods). Generalised from the Energy-only Phase 2 implementation.';

COMMIT;

NOTIFY pgrst, 'reload schema';
