-- ══════════════════════════════════════════════════════════════
-- Phase 2: Auto-spawn shipping_contracts when a trade agreement
-- ratifies with Energy trade_flow articles.
--
-- Design:
--   AFTER INSERT trigger on trade_agreements. When a row lands with
--   status='active', loop the JSONB articles array and emit one
--   shipping_contracts row per trade_flow article whose commodity is
--   'energy'. The new row is open-status with a 1-tick bid window —
--   every shipping corp can offer (Phase 3 modal). Phase 4
--   auto-awards by delivery_priority on the next tick after at least
--   one bid lands.
--
-- Direction resolution:
--   trade_flow articles store direction author-relative (a_buys_b
--   means partyA = the article author buys from partyB). We look up
--   author_nation_id on the article, treat author as A, the other
--   nation as B, and resolve buyer/seller from there. The buyer's
--   nation owns the spawned shipping_contracts row (they want the
--   Energy delivered, so they're the contract issuer in the SOP
--   sense). contract_type = 'foreign' since the buyer's nation is
--   issuing a tender open to all corps regardless of home nation.
--
-- Sentinel values:
--   revenue_per_tick is NOT NULL > 0 in the original SOP schema.
--   Trade-agreement contracts don't have a buyer-side cap — pricing
--   comes from the corp's offer modal. We store sentinel = 1 to
--   satisfy the CHECK; Phase 4's auto-award reads price from the
--   winning bid, not this column. min_fleet_health / max_route_risk
--   are wide-open (0 / 10) so any corp can bid.
--
-- award_criterion mapping:
--   'fastest'  → 'fastest_delivery'
--   'safest'   → 'lowest_risk'
--   'cheapest' → 'lowest_price'
-- The existing award_criterion column drives the SOP-side auction
-- logic. We mirror delivery_priority into it so the same Phase 4
-- code path handles both flavors. delivery_priority stays as the
-- buyer-facing label; award_criterion is the corp-facing label.
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
    v_bid_window    INT := 1;   -- 1-tick window for offers to accumulate
    v_author_id     UUID;
BEGIN
    -- Only fire for active agreements. Withdrawn/expired/etc. don't
    -- spawn shipping contracts; if a re-activation flow ever exists,
    -- it can call this function explicitly.
    IF NEW.status IS DISTINCT FROM 'active' THEN
        RETURN NEW;
    END IF;

    -- Current tick anchor for bid window + creation timestamp.
    SELECT current_tick INTO v_tick
      FROM shard
     WHERE name = 'Alpha Shard'
     LIMIT 1;
    IF v_tick IS NULL THEN v_tick := 0; END IF;

    -- Loop articles. Skip non-trade_flow and non-energy entries.
    FOR v_article IN SELECT * FROM jsonb_array_elements(COALESCE(NEW.articles, '[]'::jsonb))
    LOOP
        IF (v_article->>'article_type') IS DISTINCT FROM 'trade_flow' THEN
            CONTINUE;
        END IF;
        IF (v_article->'data'->>'commodity') IS DISTINCT FROM 'energy' THEN
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
            v_author_id := NEW.nation_a_id;  -- fallback
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

        -- Lookup display names + ports. Fallback when nation_ports
        -- has no row (landlocked / unseeded) — we still need a
        -- non-null port string for the existing schema.
        SELECT name INTO v_buyer_name  FROM nations WHERE id = v_buyer_id;
        SELECT name INTO v_seller_name FROM nations WHERE id = v_seller_id;
        SELECT port_name INTO v_buyer_port  FROM nation_ports WHERE nation_id = v_buyer_id;
        SELECT port_name INTO v_seller_port FROM nation_ports WHERE nation_id = v_seller_id;

        IF v_buyer_port  IS NULL THEN v_buyer_port  := 'Port of ' || COALESCE(v_buyer_name,  'Buyer'); END IF;
        IF v_seller_port IS NULL THEN v_seller_port := 'Port of ' || COALESCE(v_seller_name, 'Seller'); END IF;

        -- Freighters required = ceil(volume / 3) since each freighter
        -- carries 3 Energy/tick. Phase 3's offer modal can over-allocate
        -- (capped at agreement volume) or under-allocate (delivers less).
        v_freighters := GREATEST(1, CEIL(v_volume::numeric / 3.0)::INT);

        -- Term ticks: prefer the article's own duration (if set), else
        -- the agreement's duration_ticks, else a long default.
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
            v_buyer_id,
            NULL,
            'Ministry of Trade — ' || COALESCE(v_buyer_name, 'Unknown'),
            'foreign',
            'Energy Supply: ' || COALESCE(v_seller_name, '?') || ' → ' || COALESCE(v_buyer_name, '?'),
            v_volume::TEXT || ' Energy/tick ◊ ' || v_priority || ' delivery preference',
            v_seller_port,
            v_buyer_port,
            v_buyer_id,
            -- Sentinel: Phase 4 reads price from the winning bid, not
            -- this column. = 1 to satisfy CHECK > 0 on the existing schema.
            1,
            v_term,
            v_freighters,
            0,    -- min_fleet_health: open to any corp
            10,   -- max_route_risk: open to any corp
            'open',
            v_tick + v_bid_window,
            v_tick,
            NEW.id,
            'energy',
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
    'Phase 2: AFTER INSERT trigger on trade_agreements. For each Energy trade_flow article on a newly-active agreement, emits one shipping_contracts row open to bids by every shipping corp. Maps delivery_priority → award_criterion so Phase 4 auto-award reuses the existing SOP code path.';

DROP TRIGGER IF EXISTS trg_spawn_shipping_contracts ON trade_agreements;
CREATE TRIGGER trg_spawn_shipping_contracts
    AFTER INSERT ON trade_agreements
    FOR EACH ROW
    EXECUTE FUNCTION spawn_shipping_contracts_for_agreement();

NOTIFY pgrst, 'reload schema';
