-- ═══════════════════════════════════════════════════════════════════════════════
-- CONSTRUCTION CONTRACTS — open marketplace + per-bidder distance modifier
-- ═══════════════════════════════════════════════════════════════════════════════
-- Design change: every construction corp sees and can bid on every open
-- building-delivery contract. The Construction-Yard-in-nation visibility
-- filter goes away (UI side); the no-floor / no-CY-gate behavior on the
-- bid RPC is already in place from 20270245. What's NEW here:
--
--   1. Per-bidder cost. The flat build_cost stops being the universal
--      builder cost. Each construction corp's cost to deliver scales with
--      the diplomatic-relations proximity from the corp's HQ nation to the
--      contract's nation. Local work is cheapest; distant work eats
--      logistics overhead.
--
--   2. Loss-bidding is real. Bids can already be below build_cost (no
--      floor), but the previous settlement still deducted the flat
--      build_cost from the winner. Now settlement deducts the per-bidder
--      adjusted cost, so a low bid actually loses the winner money.
--
-- Single source of truth for the formula:
--   construction_distance_multiplier(proximity int) → numeric
--     · 0   (local / same nation)     → 1.00×
--     · 50  (mid-range)               → 1.375×
--     · 100 (opposite end of the map) → 1.75×
--   Linear: 1 + clamp(prox, 0, 100) / 100 * 0.75. The entrepreneur-corp.html
--   UI mirrors this formula in JS for display so per-row cost can render
--   without an extra RPC; the SQL function is the canonical version used
--   at settlement. Keep the two in sync.
--
-- Body of ent_place_construction_bid and process_ent_construction_contracts
-- is otherwise identical to 20270245 — same auth / owner / industry /
-- own-contract / over-budget / rejected-lockout gates on the bid RPC, same
-- _ent_bid_capacity_ok + _ent_award_construction_contract flow in the
-- per-tick processor. Only the cost lookup at building-delivery completion
-- changes.
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Distance-modifier helper (canonical formula) ─────────────────────
CREATE OR REPLACE FUNCTION public.construction_distance_multiplier(p_proximity int)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT 1.0 + GREATEST(0, LEAST(100, COALESCE(p_proximity, 100)))::numeric / 100.0 * 0.75;
$$;

COMMENT ON FUNCTION public.construction_distance_multiplier(int) IS
    'Per-bidder cost multiplier for construction contracts. Linear: 1.00× at proximity 0 (local), 1.75× at proximity 100 (opposite end of the map). The entrepreneur-corp.html UI mirrors this formula in JS for display; this function is the canonical version used at settlement.';

GRANT EXECUTE ON FUNCTION public.construction_distance_multiplier(int) TO authenticated;

-- ── 2. process_ent_construction_contracts — winner-specific cost at completion ──
-- Body of 20270245 with one change at the building-delivery completion
-- (v_cost): instead of the flat build_cost, the winner pays build_cost
-- scaled by their HQ→contract-nation proximity. Same-nation = 1.00×.
-- Bid - cost may be negative; treasury is debited the shortfall (the loss).
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
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, p_tick, 0);

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
REVOKE EXECUTE ON FUNCTION public.process_ent_construction_contracts(int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.process_ent_construction_contracts(int) TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
