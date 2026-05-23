-- ════════════════════════════════════════════════════════════════════
-- ENTREPRENEUR AIRCRAFT PRODUCTION — build available designs into stock,
-- then fulfil airline RFPs from that stock (instant) instead of to-order
-- ════════════════════════════════════════════════════════════════════
-- Brings legacy [Produce Aircraft] (corp_production_runs, 20261030) to the
-- entrepreneur side, simplified to one plant per run:
--
--   • ent_queue_production_run: an aviation_manufacturing corp queues a run
--     for one of its OWN available AIRCRAFT designs at a compatible, idle,
--     completed assembly plant, qty 1–100. Cost basis = design.cost_per_unit
--     (which already bundles airframe + engines×count + modules — see
--     ent_design_aircraft, 20270221), so no separate engine inventory is
--     consumed. Nothing is pre-paid; the run burns cost_per_tick from the
--     treasury each tick (cash-broke pauses, mirroring design research).
--
--   • process_ent_production_runs (per-tick, wired into advanceTick BEFORE
--     process_ent_aircraft_rfps so fresh stock is usable the same tick):
--     charges cost_per_tick, advances ticks_elapsed, and delivers units into
--     ent_aircraft_designs.inventory_on_hand as each ticks_per_unit boundary
--     passes. On the final tick the run completes.
--
--   • process_ent_aircraft_rfps (20270229) now FULFILS FROM STOCK: if the
--     winning design has inventory_on_hand >= the RFP quantity, the award
--     fast-tracks (timeline 1 tick) and on delivery the units are drawn from
--     inventory — the manufacturer keeps the full sale (production cost was
--     already sunk during the run) instead of paying build cost again. If
--     stock isn't there at delivery it falls back to build-to-order exactly
--     as before. This is the consumer that keeps inventory_on_hand from
--     being dead state.
--
-- Plant compatibility (mirrors legacy queue_production_run):
--   business    → light_assembly_plant
--   regional    → light_assembly_plant | aircraft_assembly_facility
--   narrowbody  → aircraft_assembly_facility
--   widebody    → heavy_manufacturing_plant
--
-- One active run per plant (capacity 1). No cancellation in v1; a run rides
-- to completion. Idempotent (CREATE OR REPLACE / IF NOT EXISTS).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── Production runs ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ent_production_runs (
    id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    entrepreneur_corp_id uuid NOT NULL REFERENCES entrepreneur_corps(id) ON DELETE CASCADE,
    design_id            uuid NOT NULL REFERENCES ent_aircraft_designs(id) ON DELETE CASCADE,
    plant_building_id    uuid NOT NULL REFERENCES corp_buildings(id) ON DELETE RESTRICT,

    quantity             int    NOT NULL CHECK (quantity > 0),
    units_delivered      int    NOT NULL DEFAULT 0 CHECK (units_delivered >= 0),

    cost_per_tick        bigint NOT NULL CHECK (cost_per_tick >= 0),
    ticks_per_unit       int    NOT NULL CHECK (ticks_per_unit > 0),
    total_ticks          int    NOT NULL CHECK (total_ticks > 0),
    ticks_elapsed        int    NOT NULL DEFAULT 0 CHECK (ticks_elapsed >= 0),

    status               text   NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active', 'completed')),
    last_processed_tick  int,
    created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ent_production_runs_corp_active
    ON public.ent_production_runs (entrepreneur_corp_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_ent_production_runs_active
    ON public.ent_production_runs (status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_ent_production_runs_plant
    ON public.ent_production_runs (plant_building_id) WHERE status = 'active';

ALTER TABLE public.ent_production_runs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ent_production_runs_read_all" ON public.ent_production_runs;
CREATE POLICY "ent_production_runs_read_all"
    ON public.ent_production_runs FOR SELECT USING (true);
-- No write policy: RPC-only (SECURITY DEFINER), mirroring the rest of the set.

COMMENT ON TABLE public.ent_production_runs IS
    'Entrepreneur aircraft production runs. Queued via ent_queue_production_run; advanced per-tick by process_ent_production_runs, which delivers units into ent_aircraft_designs.inventory_on_hand. One active run per plant. RPC-write-only.';

-- ── ent_queue_production_run ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.ent_queue_production_run(
    p_corp_id  uuid,
    p_design_id uuid,
    p_plant_building_id uuid,
    p_quantity int
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_fac          factions%ROWTYPE;
    v_corp         entrepreneur_corps%ROWTYPE;
    v_design       ent_aircraft_designs%ROWTYPE;
    v_plant        corp_buildings%ROWTYPE;
    v_compat       text[];
    v_tpu          int;
    v_per_unit     bigint;
    v_total_cost   bigint;
    v_total_ticks  int;
    v_cost_tick    bigint;
    v_tick         int;
    v_run_id       uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_quantity IS NULL OR p_quantity < 1 OR p_quantity > 100 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_quantity');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur' AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1;
    IF v_fac.id IS NULL OR v_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;
    IF v_corp.industry <> 'aviation_manufacturing' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_manufacturer');
    END IF;

    -- Design: this corp's own, available, aircraft.
    SELECT * INTO v_design FROM ent_aircraft_designs WHERE id = p_design_id;
    IF v_design.id IS NULL OR v_design.entrepreneur_corp_id <> p_corp_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'design_not_found');
    END IF;
    IF v_design.design_type <> 'aircraft' OR v_design.status <> 'available' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'design_not_available');
    END IF;

    -- Plant compatibility for the airframe class.
    v_compat := CASE v_design.airframe_class
        WHEN 'business'   THEN ARRAY['light_assembly_plant']
        WHEN 'regional'   THEN ARRAY['light_assembly_plant', 'aircraft_assembly_facility']
        WHEN 'narrowbody' THEN ARRAY['aircraft_assembly_facility']
        WHEN 'widebody'   THEN ARRAY['heavy_manufacturing_plant']
        ELSE ARRAY[]::text[]
    END;

    SELECT * INTO v_plant FROM corp_buildings WHERE id = p_plant_building_id;
    IF v_plant.id IS NULL OR v_plant.owner_corp_id <> p_corp_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'plant_not_found');
    END IF;
    IF v_plant.status <> 'completed' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'plant_not_ready');
    END IF;
    IF NOT (v_plant.building_type = ANY (v_compat)) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'plant_incompatible',
            'allowed', v_compat);
    END IF;
    -- One active run per plant.
    IF EXISTS (SELECT 1 FROM ent_production_runs
                WHERE plant_building_id = p_plant_building_id AND status = 'active') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'plant_busy');
    END IF;

    -- Cost + timeline. cost_per_unit already bundles engines + modules.
    v_per_unit   := GREATEST(0, COALESCE(v_design.cost_per_unit, 0));
    v_tpu        := CASE v_design.airframe_class
                        WHEN 'business' THEN 1 WHEN 'regional' THEN 2
                        WHEN 'narrowbody' THEN 3 WHEN 'widebody' THEN 4 ELSE 2 END;
    v_total_ticks := v_tpu * p_quantity;
    v_total_cost  := v_per_unit * p_quantity;
    v_cost_tick   := GREATEST(1, (v_total_cost / v_total_ticks))::bigint;

    -- Need at least one tick of funding to start.
    IF COALESCE(v_corp.treasury_cash, 0) < v_cost_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_cash',
            'have', floor(COALESCE(v_corp.treasury_cash, 0))::bigint, 'need', v_cost_tick);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- last_processed_tick = current tick → first charge lands next tick
    -- (one tick of grace, mirrors RFP started_at_tick < v_tick).
    INSERT INTO ent_production_runs (
        entrepreneur_corp_id, design_id, plant_building_id, quantity,
        cost_per_tick, ticks_per_unit, total_ticks,
        status, last_processed_tick
    ) VALUES (
        p_corp_id, p_design_id, p_plant_building_id, p_quantity,
        v_cost_tick, v_tpu, v_total_ticks,
        'active', v_tick
    ) RETURNING id INTO v_run_id;

    RETURN jsonb_build_object('success', true, 'run_id', v_run_id,
        'quantity', p_quantity, 'per_unit_cost', v_per_unit,
        'total_cost', v_total_cost, 'cost_per_tick', v_cost_tick,
        'total_ticks', v_total_ticks);
END;
$$;

GRANT EXECUTE ON FUNCTION public.ent_queue_production_run(uuid, uuid, uuid, int) TO authenticated;

-- ── process_ent_production_runs — per-tick advance + deliver ────────
CREATE OR REPLACE FUNCTION public.process_ent_production_runs(p_tick int)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tick      int;
    r           RECORD;
    v_new       int;
    v_target    int;
    v_delta     int;
    v_advanced  int := 0;
    v_delivered int := 0;
    v_completed int := 0;
    v_paused    int := 0;
BEGIN
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, p_tick, 0);

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

        v_new    := r.ticks_elapsed + 1;
        -- Units that should be delivered once v_new ticks have elapsed.
        v_target := LEAST(r.quantity, v_new / r.ticks_per_unit);
        v_delta  := v_target - r.units_delivered;

        IF v_new >= r.total_ticks THEN
            -- Final tick: deliver every remaining unit.
            v_delta := r.quantity - r.units_delivered;
            IF v_delta > 0 THEN
                UPDATE ent_aircraft_designs
                   SET inventory_on_hand = inventory_on_hand + v_delta WHERE id = r.design_id;
                v_delivered := v_delivered + v_delta;
            END IF;
            UPDATE ent_production_runs
               SET ticks_elapsed = v_new, units_delivered = r.quantity,
                   status = 'completed', last_processed_tick = v_tick
             WHERE id = r.id;
            v_completed := v_completed + 1;
        ELSE
            IF v_delta > 0 THEN
                UPDATE ent_aircraft_designs
                   SET inventory_on_hand = inventory_on_hand + v_delta WHERE id = r.design_id;
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

REVOKE EXECUTE ON FUNCTION public.process_ent_production_runs(int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.process_ent_production_runs(int) TO service_role;

-- ════════════════════════════════════════════════════════════════════
-- process_ent_aircraft_rfps — now fulfils from manufacturer stock
-- (body of 20270229 with: fast-track award when stock covers the order,
--  and a from-stock delivery branch). Everything else is verbatim.
-- ════════════════════════════════════════════════════════════════════
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
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, p_tick, 0);

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
REVOKE EXECUTE ON FUNCTION public.process_ent_aircraft_rfps(int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.process_ent_aircraft_rfps(int) TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK ──
-- BEGIN;
-- Re-apply 20270229 to restore the build-to-order-only process_ent_aircraft_rfps.
-- DROP FUNCTION IF EXISTS public.process_ent_production_runs(int);
-- DROP FUNCTION IF EXISTS public.ent_queue_production_run(uuid, uuid, uuid, int);
-- DROP TABLE IF EXISTS public.ent_production_runs;
-- COMMIT;
