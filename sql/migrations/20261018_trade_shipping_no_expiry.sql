-- ════════════════════════════════════════════════════════════════
-- Trade-agreement shipping contracts: drop the bid-window expiry.
--
-- Reported: trade-agreement contracts shouldn't expire while sitting
-- as Available Routes. The original design used a 3-tick bid window
-- with auto-extend (when zero bids arrive, advance-corp-tick bumps
-- expires_at_tick by +1 each tick). That works most of the time but
-- is fragile — any cron-tick failure leaves the contract stuck at a
-- past expires_at_tick, the UI's `.gt(expires_at_tick, current_tick)`
-- filter hides it, and the player thinks the route vanished. We
-- already saw exactly this for Hajjara-Danwei (contract cc24cecd…
-- stuck at 67 while current_tick was 69 — the auto-extend silently
-- failed because of a missing applied_at_tick column).
--
-- Fix shape: stop pretending trade-agreement contracts have a bid
-- window. Set expires_at_tick to MAX_INT (2147483647) at spawn so
-- the UI filter always passes; processTradeAgreementShipping (edit
-- in supabase/functions/advance-corp-tick/index.ts) drops the
-- expires_at_tick filter and auto-awards whenever bids exist.
-- Effect: contracts sit open indefinitely until a corp bids, then
-- award on the next corp-tick.
--
-- SOP-issued contracts (trade_agreement_id IS NULL) are NOT
-- affected — they keep their bid-window expiry semantics.
--
-- Idempotent (CREATE OR REPLACE on the trigger function, narrow
-- one-shot UPDATE on existing rows).
-- ════════════════════════════════════════════════════════════════

BEGIN;

-- ── Trigger update: sentinel expires_at_tick for trade-agreement contracts ──
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
    v_author_id     UUID;
    v_proximity     NUMERIC;
    v_transit       INT;
    -- Sentinel: trade-agreement contracts never expire by time —
    -- they sit as Available Routes until a corp bids. Award is
    -- triggered by bid presence in advance-corp-tick, not by tick
    -- comparison. INT max keeps the UI's existing
    -- `.gt(expires_at_tick, current_tick)` filter passing forever.
    v_no_expiry     CONSTANT INT := 2147483647;
BEGIN
    IF NEW.status IS DISTINCT FROM 'active' THEN
        RETURN NEW;
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN v_tick := 0; END IF;

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

        SELECT proximity INTO v_proximity
          FROM diplomatic_relations
         WHERE (nation_a_id = v_buyer_id  AND nation_b_id = v_seller_id)
            OR (nation_a_id = v_seller_id AND nation_b_id = v_buyer_id)
         LIMIT 1;
        v_transit := CASE WHEN COALESCE(v_proximity, 0) >= 71 THEN 1 ELSE 2 END;

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
            1,
            v_term,
            v_transit,
            v_freighters,
            0,
            10,
            'open',
            v_no_expiry,   -- sentinel: never expires by time
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
    'AFTER INSERT trigger on trade_agreements. Spawns one shipping_contracts row per trade_flow article (any commodity) on newly-active agreements, populating transit_ticks from diplomatic proximity. Sentinel expires_at_tick = INT_MAX so trade-agreement contracts never time out — award is driven by bid presence in processTradeAgreementShipping, not by window close.';

DROP TRIGGER IF EXISTS trg_spawn_shipping_contracts ON trade_agreements;
CREATE TRIGGER trg_spawn_shipping_contracts
    AFTER INSERT ON trade_agreements
    FOR EACH ROW
    EXECUTE FUNCTION spawn_shipping_contracts_for_agreement();

-- ── One-shot: lift the expiry on existing open trade-agreement contracts ──
-- Narrow filter so SOP contracts (no trade_agreement_id) aren't touched.
UPDATE shipping_contracts
   SET expires_at_tick = 2147483647,
       updated_at      = now()
 WHERE status              = 'open'
   AND trade_agreement_id IS NOT NULL
   AND expires_at_tick    < 2147483647;

NOTIFY pgrst, 'reload schema';

COMMIT;
