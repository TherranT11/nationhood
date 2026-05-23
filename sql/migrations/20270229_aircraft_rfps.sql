-- ════════════════════════════════════════════════════════════════════
-- AIRCRAFT RFPs — airline commissions designed aircraft, built to order
-- ════════════════════════════════════════════════════════════════════
-- Closes the design→airline loop on the entrepreneur side (Option B,
-- produce-to-order — no manufacturer inventory). Mirrors the Request
-- Construction commission flow (20270225):
--   1. An AIRLINE posts an RFP: aircraft class + quantity + per-unit budget
--      cap + bidding window.
--   2. AVIATION-MANUFACTURING corps bid one of their own 'available' aircraft
--      designs of that class + a price_per_unit (floor = the design's
--      cost_per_unit, cap = the RFP's budget).
--   3. Lowest price_per_unit auto-wins at the deadline; the winner builds the
--      qty to order over a few ticks.
--   4. On completion: qty corp_aircraft rows (carrying the design) are
--      delivered to the airline; the airline pays winning_price × qty and the
--      manufacturer pays the production cost (design.cost_per_unit × qty, a
--      sink) — settled atomically. Airline can't pay → fail, nothing charged,
--      no delivery (manufacturer loses only time; it never pre-pays).
--
-- No escrow, settle-at-completion, builder-pays-cost, floor = cost — same
-- locked model as Request Construction. process_ent_aircraft_rfps is wired
-- into advance-tick in the same commit (handler template + regen).
--
-- Note: the generic entrepreneur_buy_aircraft path is RETIRED in the UI
-- commit (RFP replaces it), so this becomes the only way airlines acquire
-- aircraft beyond the 2-plane founding seed.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Provenance: which design a corp_aircraft was built from ────
ALTER TABLE public.corp_aircraft
    ADD COLUMN IF NOT EXISTS ent_design_id uuid REFERENCES public.ent_aircraft_designs(id) ON DELETE SET NULL;

-- ── 2. RFP + bid tables ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ent_aircraft_rfps (
    id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    airline_corp_id       uuid NOT NULL REFERENCES public.entrepreneur_corps(id) ON DELETE CASCADE,
    aircraft_class        text NOT NULL CHECK (aircraft_class IN ('regional','narrowbody','widebody')),
    quantity              int  NOT NULL CHECK (quantity BETWEEN 1 AND 20),
    budget_per_unit       bigint NOT NULL CHECK (budget_per_unit > 0),
    bidding_closes_tick   int  NOT NULL,
    status                text NOT NULL DEFAULT 'open'
                              CHECK (status IN ('open','active','completed','failed','cancelled')),
    winner_corp_id        uuid REFERENCES public.entrepreneur_corps(id) ON DELETE SET NULL,
    winning_design_id     uuid REFERENCES public.ent_aircraft_designs(id) ON DELETE SET NULL,
    winning_price_per_unit bigint,
    build_cost_per_unit   bigint,                   -- design.cost_per_unit snapshot at award (sink basis)
    timeline_ticks        int,
    progress_ticks        int  NOT NULL DEFAULT 0,
    started_at_tick       int,
    created_at_tick       int  NOT NULL,
    created_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ent_acft_rfp_status ON public.ent_aircraft_rfps (status, bidding_closes_tick);
CREATE INDEX IF NOT EXISTS idx_ent_acft_rfp_airline ON public.ent_aircraft_rfps (airline_corp_id);

CREATE TABLE IF NOT EXISTS public.ent_aircraft_rfp_bids (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    rfp_id          uuid NOT NULL REFERENCES public.ent_aircraft_rfps(id) ON DELETE CASCADE,
    bidder_corp_id  uuid NOT NULL REFERENCES public.entrepreneur_corps(id) ON DELETE CASCADE,
    design_id       uuid NOT NULL REFERENCES public.ent_aircraft_designs(id) ON DELETE CASCADE,
    price_per_unit  bigint NOT NULL CHECK (price_per_unit > 0),
    status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','won','lost','withdrawn')),
    created_tick    int NOT NULL,
    created_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE (rfp_id, bidder_corp_id)
);
CREATE INDEX IF NOT EXISTS idx_ent_acft_bid_rfp ON public.ent_aircraft_rfp_bids (rfp_id, status);

ALTER TABLE public.ent_aircraft_rfps     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ent_aircraft_rfp_bids ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ent_acft_rfp_read ON public.ent_aircraft_rfps;
CREATE POLICY ent_acft_rfp_read ON public.ent_aircraft_rfps FOR SELECT USING (true);
DROP POLICY IF EXISTS ent_acft_bid_read ON public.ent_aircraft_rfp_bids;
CREATE POLICY ent_acft_bid_read ON public.ent_aircraft_rfp_bids FOR SELECT USING (true);
-- RPC-only writes (SECURITY DEFINER).

COMMENT ON TABLE public.ent_aircraft_rfps IS
    'Airline aircraft purchase RFPs (produce-to-order). Airline posts class+qty+budget; aviation_manufacturing corps bid a design+price; lowest wins, builds to order, delivers corp_aircraft. process_ent_aircraft_rfps runs per-tick. RPC-write-only.';

-- ── 3. request_aircraft_build — airline posts an RFP ──────────────
CREATE OR REPLACE FUNCTION public.request_aircraft_build(
    p_airline_corp_id uuid,
    p_class           text,
    p_quantity        int,
    p_budget_per_unit bigint,
    p_bidding_ticks   int
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid  uuid := auth.uid();
    v_fac  factions%ROWTYPE;
    v_corp entrepreneur_corps%ROWTYPE;
    v_tick int;
    v_id   uuid;
BEGIN
    IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated'); END IF;
    IF p_class NOT IN ('regional','narrowbody','widebody') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_class'); END IF;
    IF p_quantity IS NULL OR p_quantity < 1 OR p_quantity > 20 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_quantity'); END IF;
    IF p_budget_per_unit IS NULL OR p_budget_per_unit < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_budget'); END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_airline_corp_id;
    IF v_corp.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found'); END IF;
    IF v_corp.industry <> 'airline' THEN RETURN jsonb_build_object('success', false, 'reason', 'not_airline'); END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur' AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1;
    IF v_fac.id IS NULL OR v_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner'); END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    INSERT INTO ent_aircraft_rfps
        (airline_corp_id, aircraft_class, quantity, budget_per_unit, bidding_closes_tick, created_at_tick)
    VALUES (p_airline_corp_id, p_class, p_quantity, p_budget_per_unit,
            v_tick + GREATEST(1, COALESCE(p_bidding_ticks, 6)), v_tick)
    RETURNING id INTO v_id;

    RETURN jsonb_build_object('success', true, 'rfp_id', v_id,
        'bidding_closes_tick', v_tick + GREATEST(1, COALESCE(p_bidding_ticks, 6)));
END;
$$;
GRANT EXECUTE ON FUNCTION public.request_aircraft_build(uuid, text, int, bigint, int) TO authenticated;

-- ── 4. bid_aircraft_rfp — manufacturer bids a design + price ──────
CREATE OR REPLACE FUNCTION public.bid_aircraft_rfp(
    p_corp_id        uuid,
    p_rfp_id         uuid,
    p_design_id      uuid,
    p_price_per_unit bigint
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid    uuid := auth.uid();
    v_fac    factions%ROWTYPE;
    v_corp   entrepreneur_corps%ROWTYPE;
    v_rfp    ent_aircraft_rfps%ROWTYPE;
    v_design ent_aircraft_designs%ROWTYPE;
    v_tick   int;
BEGIN
    IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated'); END IF;
    IF p_price_per_unit IS NULL OR p_price_per_unit < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_amount'); END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id;
    IF v_corp.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found'); END IF;
    IF v_corp.industry <> 'aviation_manufacturing' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_manufacturer'); END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur' AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1;
    IF v_fac.id IS NULL OR v_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner'); END IF;

    SELECT * INTO v_rfp FROM ent_aircraft_rfps WHERE id = p_rfp_id FOR UPDATE;
    IF v_rfp.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'rfp_not_found'); END IF;
    IF v_rfp.status <> 'open' THEN RETURN jsonb_build_object('success', false, 'reason', 'not_open'); END IF;
    IF v_rfp.airline_corp_id = p_corp_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'own_rfp'); END IF;

    -- Design must be the bidder's own, an available aircraft, matching class.
    SELECT * INTO v_design FROM ent_aircraft_designs WHERE id = p_design_id;
    IF v_design.id IS NULL OR v_design.entrepreneur_corp_id <> p_corp_id
       OR v_design.design_type <> 'aircraft' OR v_design.status <> 'available' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'design_unavailable'); END IF;
    IF v_design.airframe_class <> v_rfp.aircraft_class THEN
        RETURN jsonb_build_object('success', false, 'reason', 'class_mismatch',
            'design_class', v_design.airframe_class, 'rfp_class', v_rfp.aircraft_class); END IF;

    -- Floor = the design's production cost; cap = the RFP budget.
    IF p_price_per_unit < COALESCE(v_design.cost_per_unit, 0) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bid_below_cost',
            'floor', COALESCE(v_design.cost_per_unit, 0)); END IF;
    IF p_price_per_unit > v_rfp.budget_per_unit THEN
        RETURN jsonb_build_object('success', false, 'reason', 'over_budget', 'budget', v_rfp.budget_per_unit); END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    INSERT INTO ent_aircraft_rfp_bids (rfp_id, bidder_corp_id, design_id, price_per_unit, created_tick)
    VALUES (p_rfp_id, p_corp_id, p_design_id, p_price_per_unit, v_tick)
    ON CONFLICT (rfp_id, bidder_corp_id)
        DO UPDATE SET design_id = EXCLUDED.design_id, price_per_unit = EXCLUDED.price_per_unit,
                      status = 'pending', created_tick = EXCLUDED.created_tick;

    RETURN jsonb_build_object('success', true, 'price_per_unit', p_price_per_unit);
END;
$$;
GRANT EXECUTE ON FUNCTION public.bid_aircraft_rfp(uuid, uuid, uuid, bigint) TO authenticated;

-- ── 5. process_ent_aircraft_rfps — award, build, deliver ──────────
CREATE OR REPLACE FUNCTION public.process_ent_aircraft_rfps(p_tick int)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_tick      int;
    r           RECORD;
    v_bid       RECORD;
    v_design    ent_aircraft_designs%ROWTYPE;
    v_total     bigint;
    v_cost      bigint;
    v_awarded   int := 0;
    v_cancelled int := 0;
    v_completed int := 0;
    v_failed    int := 0;
    i           int;
BEGIN
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, p_tick, 0);

    -- (A) Award: lowest price_per_unit wins at close. Snapshot the winning
    -- design's cost_per_unit as the production-cost basis; derive timeline.
    FOR r IN
        SELECT * FROM ent_aircraft_rfps
         WHERE status = 'open' AND bidding_closes_tick <= v_tick FOR UPDATE
    LOOP
        SELECT b.*, d.cost_per_unit AS design_cost
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
               timeline_ticks = 5 + CEIL(r.quantity / 2.0)::int,
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

        -- Manufacturer: + sale, − production cost (sink). price ≥ cost (floor).
        UPDATE entrepreneur_corps
           SET treasury_cash = COALESCE(treasury_cash, 0) + v_total - v_cost, updated_at = now()
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
REVOKE EXECUTE ON FUNCTION public.process_ent_aircraft_rfps(int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.process_ent_aircraft_rfps(int) TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
