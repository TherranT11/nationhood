-- ════════════════════════════════════════════════════════════════════
-- ENTREPRENEUR CONSTRUCTION — issuer manual Accept / Reject
-- ════════════════════════════════════════════════════════════════════
-- Until now the issuer of a private building request could only watch the
-- bid count; the cheapest qualifying bid auto-won when the bidding window
-- closed. This lets the issuer see each bid and Accept or Reject it early:
--   • Accept → that bidder wins immediately (contract goes 'active', build
--     starts next tick). Other pending bids are marked 'lost'.
--   • Reject → that bid is marked 'rejected' and the builder is LOCKED OUT
--     of this contract (ent_place_construction_bid refuses a re-bid).
--   • Safety net: if the issuer accepts nothing by bidding_closes_tick, the
--     existing tick auto-award (lowest qualifying pending bid) still fires.
--     Rejected bids are excluded automatically (they are not 'pending').
--
-- Award state-transition (contract → active + won/lost flips) is factored
-- into _ent_award_construction_contract so the tick auto-award and the
-- manual accept use ONE code path. The capacity gate for commercial
-- building types mirrors the tick exactly.
--
-- Manual control is PRIVATE-only (a human issuer owns the corp). Government
-- public-works contracts have no human issuer and keep pure auto-award.
--
-- Idempotent. Additive.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Allow the new 'rejected' bid status ──
ALTER TABLE ent_construction_bids DROP CONSTRAINT IF EXISTS ent_construction_bids_status_check;
ALTER TABLE ent_construction_bids ADD  CONSTRAINT ent_construction_bids_status_check
    CHECK (status IN ('pending', 'won', 'lost', 'withdrawn', 'rejected'));

-- ── 2. Shared award commit (one source: tick auto-award + manual accept) ──
CREATE OR REPLACE FUNCTION public._ent_award_construction_contract(
    p_contract_id uuid,
    p_bid_id      uuid,
    p_tick        int
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_winner uuid;
    v_amount bigint;
BEGIN
    SELECT bidder_corp_id, bid_amount INTO v_winner, v_amount
      FROM ent_construction_bids WHERE id = p_bid_id;

    UPDATE ent_construction_contracts
       SET status = 'active', winner_corp_id = v_winner, winning_bid = v_amount,
           started_at_tick = p_tick, progress_ticks = 0
     WHERE id = p_contract_id;
    UPDATE ent_construction_bids SET status = 'won'  WHERE id = p_bid_id;
    UPDATE ent_construction_bids SET status = 'lost'
     WHERE contract_id = p_contract_id AND id <> p_bid_id AND status = 'pending';
END;
$$;
REVOKE EXECUTE ON FUNCTION public._ent_award_construction_contract(uuid,uuid,int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public._ent_award_construction_contract(uuid,uuid,int) TO authenticated, service_role;

-- Capacity eligibility for a bidder on a build (one source: tick + accept).
-- Non-building / non-commercial types have no construction-yard capacity gate;
-- commercial types cap concurrent builds at 2× the bidder's completed CYs in
-- the nation. Mirrors the rule the tick auto-award uses to skip over-capacity
-- bidders so manual Accept can't bypass it.
CREATE OR REPLACE FUNCTION public._ent_bid_capacity_ok(
    p_bidder        uuid,
    p_nation        uuid,
    p_building_type text
) RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT CASE
        WHEN p_building_type IS NULL
          OR p_building_type NOT IN ('port','banking_office','real_estate_office',
                                     'engine_assembly_plant','light_assembly_plant')
            THEN true
        ELSE corp_commercial_build_load(p_bidder, p_nation) <
             (SELECT COUNT(*) FROM corp_buildings
               WHERE owner_corp_id = p_bidder AND nation_id = p_nation
                 AND building_type = 'construction_yard' AND status = 'completed') * 2
    END;
$$;
REVOKE EXECUTE ON FUNCTION public._ent_bid_capacity_ok(uuid,uuid,text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public._ent_bid_capacity_ok(uuid,uuid,text) TO authenticated, service_role;

-- ── 3. Bid RPC — same as 20270216 + rejected-builder lockout ──
CREATE OR REPLACE FUNCTION public.ent_place_construction_bid(
    p_corp_id     uuid,
    p_contract_id uuid,
    p_bid_amount  bigint
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid      uuid := auth.uid();
    v_fac      factions%ROWTYPE;
    v_corp     entrepreneur_corps%ROWTYPE;
    v_contract ent_construction_contracts%ROWTYPE;
    v_tick     int;
BEGIN
    IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated'); END IF;
    IF p_bid_amount IS NULL OR p_bid_amount <= 0 THEN RETURN jsonb_build_object('success', false, 'reason', 'invalid_amount'); END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id;
    IF v_corp.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found'); END IF;
    IF v_corp.industry <> 'construction' THEN RETURN jsonb_build_object('success', false, 'reason', 'not_construction'); END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur' AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1;
    IF v_fac.id IS NULL OR v_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    SELECT * INTO v_contract FROM ent_construction_contracts WHERE id = p_contract_id FOR UPDATE;
    IF v_contract.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'contract_not_found'); END IF;
    IF v_contract.status <> 'open' THEN RETURN jsonb_build_object('success', false, 'reason', 'not_open'); END IF;
    -- Can't bid on your own private contract.
    IF v_contract.issuer_corp_id IS NOT NULL AND v_contract.issuer_corp_id = p_corp_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'own_contract');
    END IF;
    IF p_bid_amount > v_contract.budget THEN
        RETURN jsonb_build_object('success', false, 'reason', 'over_budget', 'budget', v_contract.budget);
    END IF;
    -- Rejected by the issuer on this contract → permanently locked out.
    IF EXISTS (SELECT 1 FROM ent_construction_bids
                WHERE contract_id = p_contract_id AND bidder_corp_id = p_corp_id AND status = 'rejected') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'rejected');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    INSERT INTO ent_construction_bids (contract_id, bidder_corp_id, bid_amount, created_tick)
    VALUES (p_contract_id, p_corp_id, p_bid_amount, v_tick)
    ON CONFLICT (contract_id, bidder_corp_id)
        DO UPDATE SET bid_amount = EXCLUDED.bid_amount, status = 'pending', created_tick = EXCLUDED.created_tick;

    RETURN jsonb_build_object('success', true, 'bid_amount', p_bid_amount);
END;
$$;
GRANT EXECUTE ON FUNCTION public.ent_place_construction_bid(uuid,uuid,bigint) TO authenticated;

-- ── 4. Issuer accepts a specific bid (private contracts only) ──
CREATE OR REPLACE FUNCTION public.ent_accept_construction_bid(
    p_corp_id uuid,
    p_bid_id  uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid        uuid := auth.uid();
    v_fac        factions%ROWTYPE;
    v_corp       entrepreneur_corps%ROWTYPE;
    v_contract   ent_construction_contracts%ROWTYPE;
    v_bid        ent_construction_bids%ROWTYPE;
    v_tick       int;
BEGIN
    IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated'); END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id;
    IF v_corp.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found'); END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur' AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1;
    IF v_fac.id IS NULL OR v_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    -- Existence + the contract it belongs to (status re-read under the lock below).
    SELECT * INTO v_bid FROM ent_construction_bids WHERE id = p_bid_id;
    IF v_bid.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'bid_not_found'); END IF;

    -- Lock the contract FIRST — the single serialization point shared by the
    -- tick auto-award, accept, and reject (same lock order → no race, no deadlock).
    SELECT * INTO v_contract FROM ent_construction_contracts WHERE id = v_bid.contract_id FOR UPDATE;
    IF v_contract.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'contract_not_found'); END IF;
    IF v_contract.issuer_corp_id IS NULL OR v_contract.issuer_corp_id <> p_corp_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_issuer');
    END IF;
    IF v_contract.status <> 'open' THEN RETURN jsonb_build_object('success', false, 'reason', 'not_open'); END IF;

    -- Re-read the bid now that we hold the contract lock: no other writer can
    -- have changed its status without that lock, so this is authoritative.
    SELECT * INTO v_bid FROM ent_construction_bids WHERE id = p_bid_id;
    IF v_bid.contract_id <> v_contract.id THEN RETURN jsonb_build_object('success', false, 'reason', 'bid_not_found'); END IF;
    IF v_bid.status <> 'pending' THEN RETURN jsonb_build_object('success', false, 'reason', 'bid_not_pending'); END IF;

    IF NOT _ent_bid_capacity_ok(v_bid.bidder_corp_id, v_contract.nation_id, v_contract.building_type) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bidder_at_capacity');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    PERFORM _ent_award_construction_contract(v_contract.id, p_bid_id, v_tick);

    RETURN jsonb_build_object('success', true, 'contract_id', v_contract.id, 'winning_bid', v_bid.bid_amount);
END;
$$;
GRANT EXECUTE ON FUNCTION public.ent_accept_construction_bid(uuid,uuid) TO authenticated;

-- ── 5. Issuer rejects a specific bid (locks the builder out) ──
CREATE OR REPLACE FUNCTION public.ent_reject_construction_bid(
    p_corp_id uuid,
    p_bid_id  uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid      uuid := auth.uid();
    v_fac      factions%ROWTYPE;
    v_corp     entrepreneur_corps%ROWTYPE;
    v_contract ent_construction_contracts%ROWTYPE;
    v_bid      ent_construction_bids%ROWTYPE;
BEGIN
    IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated'); END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id;
    IF v_corp.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found'); END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur' AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1;
    IF v_fac.id IS NULL OR v_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    -- Existence + owning contract (status re-read under the lock below).
    SELECT * INTO v_bid FROM ent_construction_bids WHERE id = p_bid_id;
    IF v_bid.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'bid_not_found'); END IF;

    -- Lock the contract FIRST (same order as accept + the tick auto-award).
    SELECT * INTO v_contract FROM ent_construction_contracts WHERE id = v_bid.contract_id FOR UPDATE;
    IF v_contract.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'contract_not_found'); END IF;
    IF v_contract.issuer_corp_id IS NULL OR v_contract.issuer_corp_id <> p_corp_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_issuer');
    END IF;
    IF v_contract.status <> 'open' THEN RETURN jsonb_build_object('success', false, 'reason', 'not_open'); END IF;

    -- Authoritative status now that we hold the contract lock.
    SELECT * INTO v_bid FROM ent_construction_bids WHERE id = p_bid_id;
    IF v_bid.contract_id <> v_contract.id THEN RETURN jsonb_build_object('success', false, 'reason', 'bid_not_found'); END IF;
    IF v_bid.status <> 'pending' THEN RETURN jsonb_build_object('success', false, 'reason', 'bid_not_pending'); END IF;

    UPDATE ent_construction_bids SET status = 'rejected' WHERE id = p_bid_id;
    RETURN jsonb_build_object('success', true);
END;
$$;
GRANT EXECUTE ON FUNCTION public.ent_reject_construction_bid(uuid,uuid) TO authenticated;

-- ── 6. Enriched, issuer-only bid list for the Accept/Reject UI ──
-- Returns every pending bid on the issuer's OPEN building requests with the
-- display fields the card needs. Valuation mirrors computeEntrepreneurValuation
-- (public → market cap; private → entrepreneur_corp_book_value) so the number
-- matches the corp page exactly. CEO/HQ/reputation read their single sources.
CREATE OR REPLACE FUNCTION public.get_my_construction_bids(p_corp_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid uuid := auth.uid();
    v_fac factions%ROWTYPE;
    v_corp entrepreneur_corps%ROWTYPE;
    v_out jsonb;
BEGIN
    IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated'); END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id;
    IF v_corp.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found'); END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur' AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1;
    IF v_fac.id IS NULL OR v_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    SELECT COALESCE(jsonb_agg(bid_obj ORDER BY (bid_obj->>'bid_amount')::bigint ASC), '[]'::jsonb)
      INTO v_out
      FROM (
        SELECT jsonb_build_object(
            'contract_id',    b.contract_id,
            'bid_id',         b.id,
            'bid_amount',     b.bid_amount,
            'corp_id',        ec.id,
            'corp_name',      ec.name,
            'hq',             COALESCE(n.name, '—'),
            'ceo',            COALESCE(NULLIF(btrim(concat_ws(' ', f.leader_first_name, f.leader_last_name)), ''),
                                       f.faction_name, '—'),
            'ceo_reputation', COALESCE(f.ent_reputation, 0),
            'valuation',      CASE
                WHEN ec.listing = 'public' AND ec.share_price IS NOT NULL AND ec.shares_outstanding IS NOT NULL
                    THEN ROUND(ec.share_price * ec.shares_outstanding)::bigint
                ELSE entrepreneur_corp_book_value(ec.id)::bigint
            END
        ) AS bid_obj
        FROM ent_construction_bids b
        JOIN ent_construction_contracts cc ON cc.id = b.contract_id
        JOIN entrepreneur_corps ec ON ec.id = b.bidder_corp_id
        JOIN factions f ON f.id = ec.owner_faction_id
        LEFT JOIN nations n ON n.id = ec.hq_nation_id
        WHERE cc.issuer_corp_id = p_corp_id AND cc.status = 'open' AND b.status = 'pending'
      ) s;

    RETURN jsonb_build_object('success', true, 'bids', v_out);
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_my_construction_bids(uuid) TO authenticated;

-- ── 7. Tick processor — award via the shared helper (loop A), else unchanged ──
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

    -- (B) Advance + complete active builds (started_at_tick < v_tick excludes
    -- contracts awarded this tick → a timeline_ticks=N job completes N ticks later).
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
            v_cost := COALESCE(c.build_cost, 0);

            UPDATE entrepreneur_corps
               SET treasury_cash = COALESCE(treasury_cash, 0) - c.winning_bid, updated_at = now()
             WHERE id = c.issuer_corp_id AND COALESCE(treasury_cash, 0) >= c.winning_bid;
            IF NOT FOUND THEN
                UPDATE ent_construction_contracts SET status = 'failed', progress_ticks = c.timeline_ticks WHERE id = c.id;
                v_failed := v_failed + 1;
                CONTINUE;
            END IF;

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
