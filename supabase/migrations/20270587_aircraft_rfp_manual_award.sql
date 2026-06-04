-- ════════════════════════════════════════════════════════════════════
-- 20270587 — Aircraft RFPs: drop budget cap, switch to manual airline award
--
-- Design change: airlines post an RFP with class + quantity + bidding
-- window only; manufacturers bid a design + a price of their choosing
-- (no cap to respect); the airline manually picks one bid as the
-- winner (or cancels the RFP). The auto-award-lowest-bid path that
-- ran inside process_ent_aircraft_rfps at bidding_closes_tick is
-- removed entirely — it was the only consumer of budget_per_unit and
-- it took the choice away from the airline.
--
-- Mechanism:
--   1. ent_aircraft_rfps.budget_per_unit is made NULLABLE so new
--      RFPs (and the request RPC) can store NULL. Existing rows
--      keep their value harmlessly; it just stops being read.
--   2. request_aircraft_build drops p_budget_per_unit from its
--      signature. DROP FUNCTION before CREATE OR REPLACE because the
--      parameter list changes. Inserts budget_per_unit = NULL.
--   3. bid_aircraft_rfp drops the over_budget check. The
--      cost-floor check (manufacturer can't bid below their design's
--      production cost) stays. So does the bidding-window-closed check.
--   4. process_ent_aircraft_rfps drops section (A) — the auto-award
--      loop. Section (B) (advance + complete active builds) is
--      unchanged. Without an automatic close, RFPs sit at status='open'
--      until the airline accepts a bid or cancels — bid_aircraft_rfp
--      rejects new bids after bidding_closes_tick by itself.
--   5. NEW: accept_aircraft_rfp_bid(p_bid_id) — airline picks a winner
--      by bid id. Mirrors the award logic that used to live in section
--      (A) of the processor, just airline-triggered instead of
--      bidding-window-close-triggered. Other pending bids on the RFP
--      flip to 'lost'. RFP transitions to 'active' and production
--      begins exactly as before.
--
-- Notes:
--   • Single source of truth: the award logic now lives only in
--     accept_aircraft_rfp_bid (replaced the processor's copy of the
--     same block).
--   • Old RFPs queued before this migration with a non-NULL
--     budget_per_unit are unaffected — bid_aircraft_rfp no longer
--     checks it, accept_aircraft_rfp_bid doesn't need it. The column
--     stays for backwards-compat / audit; can be dropped later if
--     no surface ends up reading it.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Make budget_per_unit nullable ───────────────────────────────
ALTER TABLE public.ent_aircraft_rfps
    ALTER COLUMN budget_per_unit DROP NOT NULL;

COMMENT ON COLUMN public.ent_aircraft_rfps.budget_per_unit IS
    'Per-unit budget cap (legacy from the auto-award era — 20270587 dropped the cap entirely, so this is NULL on all new RFPs and informational-only on old ones). Manufacturers now bid any price ≥ their design''s production cost; the airline picks a winner manually via accept_aircraft_rfp_bid.';

-- ── 2. request_aircraft_build — drop p_budget_per_unit ─────────────
DROP FUNCTION IF EXISTS public.request_aircraft_build(uuid, text, int, bigint, int);

CREATE OR REPLACE FUNCTION public.request_aircraft_build(
    p_airline_corp_id  uuid,
    p_class            text,
    p_quantity         int,
    p_bidding_ticks    int
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_fac       factions%ROWTYPE;
    v_airline   entrepreneur_corps%ROWTYPE;
    v_tick      int;
    v_close     int;
    v_id        uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_class NOT IN ('regional', 'narrowbody', 'widebody') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_class');
    END IF;
    IF p_quantity IS NULL OR p_quantity < 1 OR p_quantity > 20 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_quantity');
    END IF;
    IF p_bidding_ticks IS NULL OR p_bidding_ticks < 1 OR p_bidding_ticks > 48 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_window');
    END IF;

    SELECT * INTO v_airline FROM entrepreneur_corps WHERE id = p_airline_corp_id;
    IF v_airline.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_airline.industry <> 'airline' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_airline');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur' AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1;
    IF v_fac.id IS NULL OR v_airline.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    v_close := v_tick + p_bidding_ticks;

    INSERT INTO ent_aircraft_rfps
        (airline_corp_id, aircraft_class, quantity, budget_per_unit, bidding_closes_tick, created_at_tick)
    VALUES (p_airline_corp_id, p_class, p_quantity, NULL, v_close, v_tick)
    RETURNING id INTO v_id;

    RETURN jsonb_build_object('success', true, 'rfp_id', v_id, 'closes_tick', v_close);
END;
$$;

GRANT EXECUTE ON FUNCTION public.request_aircraft_build(uuid, text, int, int) TO authenticated;

-- ── 3. bid_aircraft_rfp — drop over_budget check ───────────────────
CREATE OR REPLACE FUNCTION public.bid_aircraft_rfp(
    p_corp_id        uuid,
    p_rfp_id         uuid,
    p_design_id      uuid,
    p_price_per_unit bigint
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_fac     factions%ROWTYPE;
    v_corp    entrepreneur_corps%ROWTYPE;
    v_rfp     ent_aircraft_rfps%ROWTYPE;
    v_design  ent_aircraft_designs%ROWTYPE;
    v_tick    int;
    v_id      uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_price_per_unit IS NULL OR p_price_per_unit < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_price');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.industry <> 'aviation_manufacturing' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_manufacturer');
    END IF;
    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur' AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1;
    IF v_fac.id IS NULL OR v_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    SELECT * INTO v_rfp FROM ent_aircraft_rfps WHERE id = p_rfp_id FOR UPDATE;
    IF v_rfp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'rfp_not_found');
    END IF;
    IF v_rfp.status <> 'open' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_open');
    END IF;
    IF v_rfp.airline_corp_id = p_corp_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'own_rfp');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF v_tick >= v_rfp.bidding_closes_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_open');
    END IF;

    SELECT * INTO v_design FROM ent_aircraft_designs WHERE id = p_design_id;
    IF v_design.id IS NULL OR v_design.entrepreneur_corp_id <> p_corp_id
       OR v_design.design_type <> 'aircraft' OR v_design.status <> 'available' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'design_unavailable');
    END IF;
    IF v_design.airframe_class IS DISTINCT FROM v_rfp.aircraft_class THEN
        RETURN jsonb_build_object('success', false, 'reason', 'class_mismatch');
    END IF;
    -- Manufacturer cost floor (selling below cost would be a freebie to the airline).
    IF p_price_per_unit < COALESCE(v_design.cost_per_unit, 0) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bid_below_cost',
            'floor', COALESCE(v_design.cost_per_unit, 0));
    END IF;

    INSERT INTO ent_aircraft_rfp_bids
        (rfp_id, bidder_corp_id, design_id, price_per_unit, created_tick)
    VALUES (p_rfp_id, p_corp_id, p_design_id, p_price_per_unit, v_tick)
    RETURNING id INTO v_id;

    RETURN jsonb_build_object('success', true, 'bid_id', v_id, 'price_per_unit', p_price_per_unit);
END;
$$;

GRANT EXECUTE ON FUNCTION public.bid_aircraft_rfp(uuid, uuid, uuid, bigint) TO authenticated;

-- ── 4. process_ent_aircraft_rfps — drop the auto-award section ─────
-- Same body as 20270586's version with section (A) (auto-award at close)
-- deleted. Section (B) (advance + complete active builds) is unchanged.
-- v_tick still uses the 20270585 stale-read fix.
CREATE OR REPLACE FUNCTION public.process_ent_aircraft_rfps(p_tick int)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_tick      int;
    r           RECORD;
    v_total     bigint;
    v_cost      bigint;
    v_stock     boolean;
    v_completed int := 0;
    v_failed    int := 0;
    i           int;
BEGIN
    v_tick := COALESCE(p_tick, (SELECT current_tick FROM shard WHERE name = 'Alpha Shard'), 0);

    -- (B) Advance + complete active builds. Awards now come from
    -- accept_aircraft_rfp_bid (airline-triggered, manual), not from
    -- a tick processor. started_at_tick < v_tick excludes RFPs that
    -- were just accepted this tick.
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

        UPDATE ent_aircraft_designs
           SET inventory_on_hand = inventory_on_hand - r.quantity
         WHERE id = r.winning_design_id AND inventory_on_hand >= r.quantity;
        v_stock := FOUND;

        UPDATE entrepreneur_corps
           SET treasury_cash = COALESCE(treasury_cash, 0) + v_total - CASE WHEN v_stock THEN 0 ELSE v_cost END,
               updated_at = now()
         WHERE id = r.winner_corp_id;

        FOR i IN 1..r.quantity LOOP
            INSERT INTO corp_aircraft (entrepreneur_corp_id, aircraft_class, condition, acquired_at_tick, ent_design_id)
            VALUES (r.airline_corp_id, r.aircraft_class, 100, v_tick, r.winning_design_id);
        END LOOP;

        UPDATE ent_aircraft_rfps SET status = 'completed', progress_ticks = r.timeline_ticks WHERE id = r.id;
        v_completed := v_completed + 1;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'tick', v_tick,
        'completed', v_completed, 'failed', v_failed);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.process_ent_aircraft_rfps(int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.process_ent_aircraft_rfps(int) TO service_role;

-- ── 5. accept_aircraft_rfp_bid — airline picks a winner ────────────
CREATE OR REPLACE FUNCTION public.accept_aircraft_rfp_bid(
    p_bid_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_fac          factions%ROWTYPE;
    v_airline      entrepreneur_corps%ROWTYPE;
    v_bid          ent_aircraft_rfp_bids%ROWTYPE;
    v_rfp          ent_aircraft_rfps%ROWTYPE;
    v_design       ent_aircraft_designs%ROWTYPE;
    v_design_stock int;
    v_tick         int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    SELECT * INTO v_bid FROM ent_aircraft_rfp_bids WHERE id = p_bid_id FOR UPDATE;
    IF v_bid.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bid_not_found');
    END IF;
    IF v_bid.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bid_not_pending');
    END IF;

    SELECT * INTO v_rfp FROM ent_aircraft_rfps WHERE id = v_bid.rfp_id FOR UPDATE;
    IF v_rfp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'rfp_not_found');
    END IF;
    IF v_rfp.status <> 'open' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'rfp_not_open');
    END IF;

    SELECT * INTO v_airline FROM entrepreneur_corps WHERE id = v_rfp.airline_corp_id;
    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur' AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1;
    IF v_fac.id IS NULL OR v_airline.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_airline_owner');
    END IF;

    SELECT * INTO v_design FROM ent_aircraft_designs WHERE id = v_bid.design_id;
    IF v_design.id IS NULL OR v_design.design_type <> 'aircraft'
       OR v_design.status <> 'available'
       OR v_design.airframe_class IS DISTINCT FROM v_rfp.aircraft_class THEN
        RETURN jsonb_build_object('success', false, 'reason', 'design_unavailable');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    v_design_stock := COALESCE(v_design.inventory_on_hand, 0);

    -- Move RFP to active and snapshot the winning bid's particulars.
    -- Timeline mirrors the 20270586 auto-award rule: 1 tick if the
    -- manufacturer already holds enough stock of the winning design;
    -- otherwise 5 + ceil(quantity / 2) ticks of build-to-order.
    UPDATE ent_aircraft_rfps
       SET status                 = 'active',
           winner_corp_id         = v_bid.bidder_corp_id,
           winning_design_id      = v_bid.design_id,
           winning_price_per_unit = v_bid.price_per_unit,
           build_cost_per_unit    = COALESCE(v_design.cost_per_unit, 0),
           timeline_ticks         = CASE WHEN v_design_stock >= v_rfp.quantity
                                         THEN 1 ELSE 5 + CEIL(v_rfp.quantity / 2.0)::int END,
           started_at_tick        = v_tick,
           progress_ticks         = 0
     WHERE id = v_rfp.id;

    UPDATE ent_aircraft_rfp_bids SET status = 'won'  WHERE id = v_bid.id;
    UPDATE ent_aircraft_rfp_bids SET status = 'lost'
     WHERE rfp_id = v_rfp.id AND id <> v_bid.id AND status = 'pending';

    RETURN jsonb_build_object('success', true,
        'rfp_id', v_rfp.id, 'winner_corp_id', v_bid.bidder_corp_id,
        'price_per_unit', v_bid.price_per_unit,
        'timeline_ticks', CASE WHEN v_design_stock >= v_rfp.quantity
                               THEN 1 ELSE 5 + CEIL(v_rfp.quantity / 2.0)::int END);
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_aircraft_rfp_bid(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
