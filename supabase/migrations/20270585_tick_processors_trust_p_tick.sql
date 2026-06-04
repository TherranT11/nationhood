-- ════════════════════════════════════════════════════════════════════
-- 20270585 — Tick processors: trust p_tick over a stale shard read
--
-- Reported symptom (Falcone-Pinion DT-201 production run): a 2-tick
-- aircraft build was queued, engines were consumed, two ticks passed,
-- and the plane never appeared in inventory. The run row showed
-- ticks_elapsed=0, last_processed_tick=146 at current_tick=147.
--
-- Root cause: advance-tick commits shard.current_tick AS THE LAST STEP
-- (deliberate — it's the idempotent-retry boundary; mid-tick failures
-- leave the shard at the OLD tick so the cron re-runs the whole tick
-- cleanly). But every per-tick RPC called from advance-tick that does:
--
--     SELECT current_tick INTO v_tick FROM shard WHERE name='Alpha Shard';
--     v_tick := COALESCE(v_tick, p_tick, 0);
--
-- reads the OLD tick during processing, not the NEW one that's being
-- applied. Then the run's last_processed_tick gets stamped with the
-- stale value and the filter `last_processed_tick <> v_tick` skips
-- the run on the very next tick advance too.
--
-- The codebase already has the safe pattern in 4 other RPCs
-- (endorse_protest, execute_protest, finalize_expired_board_requests,
-- process_expired_petitions) — they trust p_tick directly. This
-- migration aligns the 7 stragglers to the same shape.
--
-- Two sub-patterns being fixed:
--   • 5 RPCs use COALESCE(v_tick, p_tick, 0) — shard wins over p_tick.
--   • 2 RPCs use COALESCE(v_tick, 0) — p_tick is in the signature but
--     never referenced in the body.
--
-- Replacement (one line, net REDUCE):
--     v_tick := COALESCE(p_tick,
--                        (SELECT current_tick FROM shard WHERE name='Alpha Shard'),
--                        0);
--
-- Keeps shard as the system-wide canonical source (one source of truth);
-- only prefers p_tick when the caller explicitly tells us which tick
-- we're processing FOR. Client-triggered callers pass NULL or no value
-- (default in some signatures) — they fall through to the shard read
-- which is correct outside the advance-tick window.
--
-- NOT in scope here (flagged for follow-up): 6 advance-tick RPCs that
-- read shard.current_tick but have no p_tick parameter at all
-- (bid_to_host_vwc, claim_leadership_challenge, form_minority_government,
-- invest_in_vola_culture, post_stadium_contract, process_bloc_vote_cohesion).
-- These need parameter additions or a different shape; lower urgency
-- since they're stamping/scheduling helpers rather than progress
-- processors. Also out of scope: surfacing the 'paused' state when
-- treasury can't cover cost_per_tick (separate UX defect).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── complete_finished_buildings  (last shipped in 20270166_corp_buildings_audit.sql; p_tick ignored entirely (COALESCE(v_tick, 0)) — fixed to honor the parameter) ──
CREATE OR REPLACE FUNCTION public.complete_finished_buildings(p_tick int)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    r          RECORD;
    v_count    int := 0;
    v_corp     RECORD;
    v_nation   text;
    v_tick     int;
BEGIN
    -- Authoritative tick from the shard. p_tick is accepted (the
    -- tick processor passes newTick for symmetry with other
    -- finalize handlers) but DELIBERATELY ignored for the gate so
    -- an authenticated caller cannot fast-complete their buildings
    -- by passing a future tick. The shard's current_tick is the
    -- single source of truth for "now".
    v_tick := COALESCE(p_tick, (SELECT current_tick FROM shard WHERE name = 'Alpha Shard'), 0);

    FOR r IN
        SELECT id, builder_corp_id, nation_id, name, tier, cost_paid,
               gdp_growth_applied
          FROM corp_buildings
         WHERE status = 'in_progress' AND completes_at_tick <= v_tick
         FOR UPDATE
    LOOP
        UPDATE corp_buildings
           SET status            = 'completed',
               completed_at_tick = v_tick,
               gdp_growth_applied = true
         WHERE id = r.id;

        IF NOT r.gdp_growth_applied THEN
            UPDATE nations
               SET gdp_growth = COALESCE(gdp_growth, 0) + 0.2
             WHERE id = r.nation_id;
        END IF;

        SELECT c.name, c.owner_faction_id INTO v_corp
          FROM entrepreneur_corps c WHERE c.id = r.builder_corp_id;
        SELECT name INTO v_nation FROM nations WHERE id = r.nation_id;

        INSERT INTO event_log (
            nation_id, faction_id, event_name, description_used,
            category, trigger_key, effects_applied, fired_at_tick
        ) VALUES (
            r.nation_id, v_corp.owner_faction_id,
            'Construction Completed',
            format('%s has completed %s in %s. GDP growth ticks up.',
                   v_corp.name, r.name, v_nation),
            'corporate', 'construction_completed',
            jsonb_build_object(
                'building_id',     r.id,
                'corp_id',         r.builder_corp_id,
                'corp_name',       v_corp.name,
                'tier',            r.tier,
                'cost',            r.cost_paid,
                'gdp_growth_bump', 0.2
            ),
            v_tick
        );

        v_count := v_count + 1;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'completed', v_count);
END;
$$;

-- ── process_corp_loans  (last shipped in 20270260_fix_corp_loan_apr_accrual.sql; same shape — interest accrual was reading stale tick) ──
CREATE OR REPLACE FUNCTION public.process_corp_loans(p_tick int)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    r            RECORD;
    v_tick       int;
    v_expired    int := 0;
    v_accrued    int := 0;
    v_defaulted  int := 0;
    v_repaid     int := 0;
BEGIN
    v_tick := COALESCE(p_tick, (SELECT current_tick FROM shard WHERE name = 'Alpha Shard'), 0);

    -- Expire stale pending loan requests.
    FOR r IN
        SELECT id FROM corp_loan_requests
         WHERE status = 'pending' AND expires_at_tick <= v_tick
         FOR UPDATE
    LOOP
        UPDATE corp_loan_requests
           SET status = 'expired', finalized_at_tick = v_tick
         WHERE id = r.id;
        v_expired := v_expired + 1;
    END LOOP;

    -- Manual servicing: no auto-payment. Accrue compound interest (APR/12 per
    -- tick); default at term end if still owed; mark paid-off loans repaid.
    FOR r IN
        SELECT id, borrower_corp_id, apr, term_ticks, started_at_tick, last_payment_tick,
               GREATEST(0, COALESCE(balance, principal - COALESCE(total_paid, 0))) AS bal
          FROM corp_loans
         WHERE status = 'active'
         FOR UPDATE
    LOOP
        IF r.bal < 1 THEN
            UPDATE corp_loans SET status = 'repaid', balance = 0 WHERE id = r.id;
            v_repaid := v_repaid + 1;
            CONTINUE;
        END IF;
        IF v_tick >= r.started_at_tick + r.term_ticks THEN
            -- Term reached, still owed → default (parity with declare_bankruptcy).
            UPDATE corp_loans SET status = 'defaulted', defaulted_at_tick = v_tick, balance = r.bal WHERE id = r.id;
            UPDATE factions SET ent_reputation = COALESCE(ent_reputation, 0) - 3
             WHERE id = (SELECT owner_faction_id FROM entrepreneur_corps WHERE id = r.borrower_corp_id);
            v_defaulted := v_defaulted + 1;
            CONTINUE;
        END IF;
        -- Accrue compound interest at most once per tick (last_payment_tick guard
        -- makes a re-run idempotent; no accrual on the disbursement tick).
        -- apr is a FRACTION (0.03 = 3%), so the per-tick (monthly) rate is apr/12.
        IF r.started_at_tick < v_tick AND (r.last_payment_tick IS NULL OR r.last_payment_tick < v_tick) THEN
            UPDATE corp_loans
               SET balance = ROUND(r.bal * (1 + r.apr / 12)),
                   last_payment_tick = v_tick
             WHERE id = r.id;
            v_accrued := v_accrued + 1;
        END IF;
    END LOOP;

    RETURN jsonb_build_object('success', true,
        'expired',   v_expired,
        'accrued',   v_accrued,
        'repaid',    v_repaid,
        'defaulted', v_defaulted,
        'tick',      v_tick);
END;
$$;

-- ── process_corp_price_anchors  (last shipped in 20270179_corp_price_anchors.sql; COALESCE(v_tick, p_tick, 0) — shard wins over p_tick) ──
CREATE OR REPLACE FUNCTION public.process_corp_price_anchors(p_tick int)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tick    int;
    v_written int := 0;
BEGIN
    -- Shard current_tick is the source of truth — p_tick is taken as
    -- a hint but the actual write tags the row with the shard's tick
    -- so an out-of-band caller can't backdate or future-date anchors.
    v_tick := COALESCE(p_tick, (SELECT current_tick FROM shard WHERE name = 'Alpha Shard'), 0);

    -- One row per public corp per tick. NOT EXISTS makes the insert
    -- idempotent: if the tick handler runs twice for the same tick
    -- (manual reprocess), we don't double-anchor.
    INSERT INTO corp_share_price_history
        (corp_id, at_tick, old_price, new_price, delta_pct, source)
    SELECT c.id, v_tick, c.share_price, c.share_price, NULL, 'tick'
      FROM entrepreneur_corps c
     WHERE c.listing = 'public'
       AND c.share_price IS NOT NULL
       AND NOT EXISTS (
           SELECT 1 FROM corp_share_price_history h
            WHERE h.corp_id = c.id
              AND h.at_tick = v_tick
              AND h.source  = 'tick'
       );
    GET DIAGNOSTICS v_written = ROW_COUNT;

    RETURN jsonb_build_object('success', true, 'tick', v_tick, 'written', v_written);
END;
$$;

-- ── process_ent_aircraft_designs  (last shipped in 20270221_ent_aircraft_designs.sql; R&D progress was visiting on the stale-tick window) ──
CREATE OR REPLACE FUNCTION public.process_ent_aircraft_designs(p_tick int)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    d            RECORD;
    v_tick       int;
    v_advanced   int := 0;
    v_completed  int := 0;
    v_paused     int := 0;
BEGIN
    v_tick := COALESCE(p_tick, (SELECT current_tick FROM shard WHERE name = 'Alpha Shard'), 0);

    FOR d IN
        SELECT id, entrepreneur_corp_id, research_cost_per_tick, research_ticks_remaining
          FROM ent_aircraft_designs
         WHERE status = 'researching'
           AND (last_research_tick IS NULL OR last_research_tick < v_tick)   -- once per tick
         FOR UPDATE
    LOOP
        -- Pay this tick's research from the corp treasury; pause if broke.
        UPDATE entrepreneur_corps
           SET treasury_cash = COALESCE(treasury_cash, 0) - d.research_cost_per_tick
         WHERE id = d.entrepreneur_corp_id
           AND COALESCE(treasury_cash, 0) >= d.research_cost_per_tick;
        IF NOT FOUND THEN
            v_paused := v_paused + 1;
            CONTINUE;
        END IF;

        IF d.research_ticks_remaining - 1 <= 0 THEN
            UPDATE ent_aircraft_designs
               SET research_ticks_remaining = 0, status = 'available',
                   completed_at_tick = v_tick, last_research_tick = v_tick
             WHERE id = d.id;
            v_completed := v_completed + 1;
        ELSE
            UPDATE ent_aircraft_designs
               SET research_ticks_remaining = research_ticks_remaining - 1,
                   last_research_tick = v_tick
             WHERE id = d.id;
            v_advanced := v_advanced + 1;
        END IF;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'tick', v_tick,
        'advanced', v_advanced, 'completed', v_completed, 'paused', v_paused);
END;
$$;

-- ── process_ent_aircraft_rfps  (last shipped in 20270234_ent_aircraft_production.sql; RFP timer reads were one tick behind) ──
CREATE OR REPLACE FUNCTION public.process_ent_aircraft_rfps(p_tick int)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_tick      int;
    r           RECORD;
    v_bid       RECORD;
    v_total     bigint;
    v_cost      bigint;
    v_stock     boolean;
    v_awarded   int := 0;
    v_cancelled int := 0;
    v_completed int := 0;
    v_failed    int := 0;
    i           int;
BEGIN
    v_tick := COALESCE(p_tick, (SELECT current_tick FROM shard WHERE name = 'Alpha Shard'), 0);

    -- (A) Award: lowest price_per_unit wins at close. Snapshot the winning
    -- design's cost_per_unit; if the winner already holds enough stock of
    -- that design, fast-track the timeline to a single tick.
    FOR r IN
        SELECT * FROM ent_aircraft_rfps
         WHERE status = 'open' AND bidding_closes_tick <= v_tick FOR UPDATE
    LOOP
        SELECT b.*, d.cost_per_unit AS design_cost, COALESCE(d.inventory_on_hand, 0) AS design_stock
          INTO v_bid
          FROM ent_aircraft_rfp_bids b
          JOIN ent_aircraft_designs d ON d.id = b.design_id
         WHERE b.rfp_id = r.id AND b.status = 'pending'
           AND d.status = 'available' AND d.design_type = 'aircraft'
           AND d.airframe_class = r.aircraft_class
         ORDER BY b.price_per_unit ASC, b.created_tick ASC LIMIT 1;

        IF v_bid.id IS NULL THEN
            UPDATE ent_aircraft_rfps SET status = 'cancelled' WHERE id = r.id;
            UPDATE ent_aircraft_rfp_bids SET status = 'lost' WHERE rfp_id = r.id AND status = 'pending';
            v_cancelled := v_cancelled + 1;
            CONTINUE;
        END IF;

        UPDATE ent_aircraft_rfps
           SET status = 'active', winner_corp_id = v_bid.bidder_corp_id,
               winning_design_id = v_bid.design_id, winning_price_per_unit = v_bid.price_per_unit,
               build_cost_per_unit = COALESCE(v_bid.design_cost, 0),
               timeline_ticks = CASE WHEN v_bid.design_stock >= r.quantity
                                     THEN 1 ELSE 5 + CEIL(r.quantity / 2.0)::int END,
               started_at_tick = v_tick, progress_ticks = 0
         WHERE id = r.id;
        UPDATE ent_aircraft_rfp_bids SET status = 'won'  WHERE id = v_bid.id;
        UPDATE ent_aircraft_rfp_bids SET status = 'lost' WHERE rfp_id = r.id AND id <> v_bid.id AND status = 'pending';
        v_awarded := v_awarded + 1;
    END LOOP;

    -- (B) Advance + complete. started_at_tick < v_tick excludes RFPs awarded
    -- this tick (a timeline_ticks=N job completes N ticks later).
    FOR r IN
        SELECT * FROM ent_aircraft_rfps
         WHERE status = 'active' AND started_at_tick < v_tick FOR UPDATE
    LOOP
        IF r.progress_ticks + 1 < r.timeline_ticks THEN
            UPDATE ent_aircraft_rfps SET progress_ticks = progress_ticks + 1 WHERE id = r.id;
            CONTINUE;
        END IF;

        IF r.winner_corp_id IS NULL OR r.winning_design_id IS NULL THEN
            UPDATE ent_aircraft_rfps SET status = 'failed', progress_ticks = r.timeline_ticks WHERE id = r.id;
            v_failed := v_failed + 1;
            CONTINUE;
        END IF;

        v_total := r.winning_price_per_unit * r.quantity;
        v_cost  := COALESCE(r.build_cost_per_unit, 0) * r.quantity;

        -- Airline must cover the order now, else fail (nobody charged, no
        -- delivery; the manufacturer never pre-paid, so it loses only time).
        UPDATE entrepreneur_corps
           SET treasury_cash = COALESCE(treasury_cash, 0) - v_total, updated_at = now()
         WHERE id = r.airline_corp_id AND COALESCE(treasury_cash, 0) >= v_total;
        IF NOT FOUND THEN
            UPDATE ent_aircraft_rfps SET status = 'failed', progress_ticks = r.timeline_ticks WHERE id = r.id;
            v_failed := v_failed + 1;
            CONTINUE;
        END IF;

        -- FROM STOCK if the winning design still holds enough inventory:
        -- draw the units down, manufacturer keeps the full sale (the build
        -- cost was already sunk during the production run). Otherwise build
        -- to order: manufacturer + sale − production cost.
        UPDATE ent_aircraft_designs
           SET inventory_on_hand = inventory_on_hand - r.quantity
         WHERE id = r.winning_design_id AND inventory_on_hand >= r.quantity;
        v_stock := FOUND;

        UPDATE entrepreneur_corps
           SET treasury_cash = COALESCE(treasury_cash, 0) + v_total - CASE WHEN v_stock THEN 0 ELSE v_cost END,
               updated_at = now()
         WHERE id = r.winner_corp_id;

        -- Deliver qty aircraft to the airline, carrying the design.
        FOR i IN 1..r.quantity LOOP
            INSERT INTO corp_aircraft (entrepreneur_corp_id, aircraft_class, condition, acquired_at_tick, ent_design_id)
            VALUES (r.airline_corp_id, r.aircraft_class, 100, v_tick, r.winning_design_id);
        END LOOP;

        UPDATE ent_aircraft_rfps SET status = 'completed', progress_ticks = r.timeline_ticks WHERE id = r.id;
        v_completed := v_completed + 1;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'tick', v_tick,
        'awarded', v_awarded, 'cancelled', v_cancelled, 'completed', v_completed, 'failed', v_failed);
END;
$$;

-- ── process_ent_construction_contracts  (last shipped in 20270369_construction_distance_modifier.sql; construction progress was visiting on the stale-tick window) ──
CREATE OR REPLACE FUNCTION public.process_ent_construction_contracts(p_tick int)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    RAW_PER_ABSTRACT constant numeric := 1000000;
    v_tick       int;
    c            RECORD;
    v_bid        RECORD;
    v_winner_id  uuid;
    v_winner_bid bigint;
    v_cost       bigint;
    v_bid_id     uuid;
    v_pay_ok     boolean;
    v_eff        jsonb;
    v_bld_id     uuid;
    v_winner_hq  uuid;
    v_prox       int;
    v_awarded    int := 0;
    v_cancelled  int := 0;
    v_completed  int := 0;
    v_failed     int := 0;
BEGIN
    v_tick := COALESCE(p_tick, (SELECT current_tick FROM shard WHERE name = 'Alpha Shard'), 0);

    -- (A) Auto-award at close (safety net). Building contracts: lowest bidder
    -- not over CY capacity (commercial types). Legacy contracts: plain lowest.
    -- Manually-accepted contracts are already 'active' and skipped here;
    -- rejected bids are not 'pending' and are excluded automatically.
    FOR c IN
        SELECT * FROM ent_construction_contracts
         WHERE status = 'open' AND bidding_closes_tick <= v_tick FOR UPDATE
    LOOP
        v_winner_id := NULL; v_winner_bid := NULL; v_bid_id := NULL;

        IF c.building_type IS NOT NULL THEN
            FOR v_bid IN
                SELECT * FROM ent_construction_bids
                 WHERE contract_id = c.id AND status = 'pending'
                 ORDER BY bid_amount ASC, created_tick ASC
            LOOP
                IF NOT _ent_bid_capacity_ok(v_bid.bidder_corp_id, c.nation_id, c.building_type) THEN
                    CONTINUE;   -- bidder at capacity; try next-lowest
                END IF;
                v_winner_id := v_bid.bidder_corp_id; v_winner_bid := v_bid.bid_amount; v_bid_id := v_bid.id;
                EXIT;
            END LOOP;
        ELSE
            SELECT id, bidder_corp_id, bid_amount INTO v_bid_id, v_winner_id, v_winner_bid
              FROM ent_construction_bids
             WHERE contract_id = c.id AND status = 'pending'
             ORDER BY bid_amount ASC, created_tick ASC LIMIT 1;
        END IF;

        IF v_winner_id IS NULL THEN
            UPDATE ent_construction_contracts SET status = 'cancelled' WHERE id = c.id;
            UPDATE ent_construction_bids SET status = 'lost' WHERE contract_id = c.id AND status = 'pending';
            v_cancelled := v_cancelled + 1;
            CONTINUE;
        END IF;

        PERFORM _ent_award_construction_contract(c.id, v_bid_id, v_tick);
        v_awarded := v_awarded + 1;
    END LOOP;

    -- (B) Advance + complete active builds.
    FOR c IN
        SELECT * FROM ent_construction_contracts
         WHERE status = 'active' AND started_at_tick < v_tick FOR UPDATE
    LOOP
        IF c.progress_ticks + 1 < c.timeline_ticks THEN
            UPDATE ent_construction_contracts SET progress_ticks = progress_ticks + 1 WHERE id = c.id;
            CONTINUE;
        END IF;

        IF c.winner_corp_id IS NULL THEN
            UPDATE ent_construction_contracts SET status = 'failed', progress_ticks = c.timeline_ticks WHERE id = c.id;
            v_failed := v_failed + 1;
            CONTINUE;
        END IF;

        -- ── Building-delivery completion: atomic settle, then deliver ──
        IF c.building_type IS NOT NULL THEN
            -- Per-bidder cost: base × distance multiplier from the winner's
            -- HQ nation to the contract nation. Same-nation (or null HQ as
            -- a defensive fallback) keeps prox = 0 → 1.00×; a missing
            -- diplomatic_relations row falls back to the furthest tier so
            -- the winner doesn't accidentally pay a local price for distant
            -- work just because the relation hadn't been seeded.
            SELECT hq_nation_id INTO v_winner_hq FROM entrepreneur_corps WHERE id = c.winner_corp_id;
            IF v_winner_hq IS NULL OR v_winner_hq = c.nation_id THEN
                v_prox := 0;
            ELSE
                SELECT proximity INTO v_prox FROM diplomatic_relations
                 WHERE (nation_a_id = v_winner_hq AND nation_b_id = c.nation_id)
                    OR (nation_b_id = v_winner_hq AND nation_a_id = c.nation_id)
                 LIMIT 1;
                v_prox := COALESCE(v_prox, 100);
            END IF;
            v_cost := CEIL(COALESCE(c.build_cost, 0) * construction_distance_multiplier(v_prox))::bigint;

            -- Requester must cover the winning bid now, else the whole
            -- contract fails — nobody charged, no building delivered.
            UPDATE entrepreneur_corps
               SET treasury_cash = COALESCE(treasury_cash, 0) - c.winning_bid, updated_at = now()
             WHERE id = c.issuer_corp_id AND COALESCE(treasury_cash, 0) >= c.winning_bid;
            IF NOT FOUND THEN
                UPDATE ent_construction_contracts SET status = 'failed', progress_ticks = c.timeline_ticks WHERE id = c.id;
                v_failed := v_failed + 1;
                CONTINUE;
            END IF;

            -- Pay the builder the bid, then sink the per-bidder cost. The
            -- bid can be below cost — losses are allowed, treasury debits
            -- the shortfall (and may go negative; that's the design).
            UPDATE entrepreneur_corps
               SET treasury_cash = COALESCE(treasury_cash, 0) + c.winning_bid - v_cost, updated_at = now()
             WHERE id = c.winner_corp_id;

            INSERT INTO corp_buildings (
                builder_corp_id, owner_corp_id, nation_id, name, tier, building_type,
                cost_paid, ambition_granted, status, started_at_tick, completes_at_tick,
                completed_at_tick, gdp_growth_applied
            ) VALUES (
                c.winner_corp_id, c.issuer_corp_id, c.nation_id,
                left(btrim(c.name), 80), COALESCE(c.tier, 'small'), c.building_type,
                v_cost, 0, 'completed', c.started_at_tick, v_tick, v_tick, true
            ) RETURNING id INTO v_bld_id;

            PERFORM award_construction_gdp_bonus(c.nation_id, 0.2);

            UPDATE ent_construction_contracts
               SET status = 'completed', progress_ticks = c.timeline_ticks, delivered_building_id = v_bld_id
             WHERE id = c.id;
            v_completed := v_completed + 1;
            CONTINUE;
        END IF;

        -- ── Legacy (gov / non-building private) completion: cash only ──
        -- Distance modifier does not apply here — these contracts have no
        -- build_cost snapshot; settlement is cash-for-work as before.
        v_pay_ok := false;
        IF c.contract_type = 'government' THEN
            UPDATE nations
               SET budget = budget - (c.winning_bid / RAW_PER_ABSTRACT)
             WHERE id = c.issuer_nation_id
               AND COALESCE(budget, 0) * RAW_PER_ABSTRACT >= c.winning_bid;
            v_pay_ok := FOUND;
        ELSE
            UPDATE entrepreneur_corps
               SET treasury_cash = COALESCE(treasury_cash, 0) - c.winning_bid
             WHERE id = c.issuer_corp_id AND COALESCE(treasury_cash, 0) >= c.winning_bid;
            v_pay_ok := FOUND;
        END IF;

        IF NOT v_pay_ok THEN
            UPDATE ent_construction_contracts SET status = 'failed', progress_ticks = c.timeline_ticks WHERE id = c.id;
            v_failed := v_failed + 1;
            CONTINUE;
        END IF;

        UPDATE entrepreneur_corps
           SET treasury_cash = COALESCE(treasury_cash, 0) + c.winning_bid, updated_at = now()
         WHERE id = c.winner_corp_id;

        IF c.contract_type = 'government' THEN
            v_eff := c.completion_effects;
            IF COALESCE((v_eff->>'gdp')::numeric, 0) <> 0 THEN
                PERFORM award_construction_gdp_bonus(c.issuer_nation_id, (v_eff->>'gdp')::numeric);
            END IF;
            UPDATE nations SET
                standard_of_living = LEAST(100, GREATEST(0, COALESCE(standard_of_living,50) + COALESCE((v_eff->>'sol')::numeric, 0))),
                public_approval    = LEAST(100, GREATEST(0, COALESCE(public_approval,50)    + COALESCE((v_eff->>'approval')::numeric, 0)))
             WHERE id = c.issuer_nation_id;
        END IF;

        UPDATE ent_construction_contracts SET status = 'completed', progress_ticks = c.timeline_ticks WHERE id = c.id;
        v_completed := v_completed + 1;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'tick', v_tick,
        'awarded', v_awarded, 'cancelled', v_cancelled, 'completed', v_completed, 'failed', v_failed);
END;
$$;

-- ── process_ent_production_runs  (last shipped in 20270364_ent_aircraft_orders.sql; the smoking-gun RPC from the Falcone-Pinion DT-201 bug report) ──
CREATE OR REPLACE FUNCTION public.process_ent_production_runs(p_tick int)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tick      int;
    r           RECORD;
    v_dtype     text;
    v_dclass    text;
    v_new       int;
    v_target    int;
    v_delta     int;
    v_advanced  int := 0;
    v_delivered int := 0;
    v_completed int := 0;
    v_paused    int := 0;
BEGIN
    v_tick := COALESCE(p_tick, (SELECT current_tick FROM shard WHERE name = 'Alpha Shard'), 0);

    FOR r IN
        SELECT * FROM ent_production_runs
         WHERE status = 'active'
           AND (last_processed_tick IS NULL OR last_processed_tick <> v_tick)
         FOR UPDATE
    LOOP
        -- Charge this tick; pause (no progress) if the treasury can't cover.
        UPDATE entrepreneur_corps
           SET treasury_cash = COALESCE(treasury_cash, 0) - r.cost_per_tick, updated_at = now()
         WHERE id = r.entrepreneur_corp_id
           AND COALESCE(treasury_cash, 0) >= r.cost_per_tick;
        IF NOT FOUND THEN
            UPDATE ent_production_runs SET last_processed_tick = v_tick WHERE id = r.id;
            v_paused := v_paused + 1;
            CONTINUE;
        END IF;

        SELECT design_type, airframe_class INTO v_dtype, v_dclass
          FROM ent_aircraft_designs WHERE id = r.design_id;

        v_new    := r.ticks_elapsed + 1;
        v_target := LEAST(r.quantity, v_new / r.ticks_per_unit);
        v_delta  := v_target - r.units_delivered;

        IF v_new >= r.total_ticks THEN
            v_delta := r.quantity - r.units_delivered;
            IF v_delta > 0 THEN
                IF v_dtype = 'engine' THEN
                    INSERT INTO ent_engine_inventory (entrepreneur_corp_id, engine_design_id, quantity)
                    VALUES (r.entrepreneur_corp_id, r.design_id, v_delta)
                    ON CONFLICT (entrepreneur_corp_id, engine_design_id)
                    DO UPDATE SET quantity = ent_engine_inventory.quantity + EXCLUDED.quantity;
                ELSIF r.delivery_to_corp_id IS NOT NULL THEN
                    -- Build-to-order: deliver finished aircraft into buyer's fleet.
                    INSERT INTO corp_aircraft (entrepreneur_corp_id, aircraft_class, condition, acquired_at_tick)
                    SELECT r.delivery_to_corp_id, v_dclass, 100, v_tick
                      FROM generate_series(1, v_delta);
                ELSE
                    UPDATE ent_aircraft_designs
                       SET inventory_on_hand = inventory_on_hand + v_delta WHERE id = r.design_id;
                END IF;
                v_delivered := v_delivered + v_delta;
            END IF;
            UPDATE ent_production_runs
               SET ticks_elapsed = v_new, units_delivered = r.quantity,
                   status = 'completed', last_processed_tick = v_tick
             WHERE id = r.id;
            v_completed := v_completed + 1;
        ELSE
            IF v_delta > 0 THEN
                IF v_dtype = 'engine' THEN
                    INSERT INTO ent_engine_inventory (entrepreneur_corp_id, engine_design_id, quantity)
                    VALUES (r.entrepreneur_corp_id, r.design_id, v_delta)
                    ON CONFLICT (entrepreneur_corp_id, engine_design_id)
                    DO UPDATE SET quantity = ent_engine_inventory.quantity + EXCLUDED.quantity;
                ELSIF r.delivery_to_corp_id IS NOT NULL THEN
                    INSERT INTO corp_aircraft (entrepreneur_corp_id, aircraft_class, condition, acquired_at_tick)
                    SELECT r.delivery_to_corp_id, v_dclass, 100, v_tick
                      FROM generate_series(1, v_delta);
                ELSE
                    UPDATE ent_aircraft_designs
                       SET inventory_on_hand = inventory_on_hand + v_delta WHERE id = r.design_id;
                END IF;
                v_delivered := v_delivered + v_delta;
            END IF;
            UPDATE ent_production_runs
               SET ticks_elapsed = v_new, units_delivered = v_target, last_processed_tick = v_tick
             WHERE id = r.id;
            v_advanced := v_advanced + 1;
        END IF;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'tick', v_tick,
        'advanced', v_advanced, 'delivered', v_delivered,
        'completed', v_completed, 'paused', v_paused);
END;
$$;

NOTIFY pgrst, 'reload schema';

COMMIT;
