-- ════════════════════════════════════════════════════════════════════
-- 20270834 — AUTOMOTIVE Executive Action #2: Production Run
--
-- Assign an available assembly line to a Model and run the factories:
-- the line produces 1 vehicle per tick for the chosen amount, and the
-- full cost leaves the corp treasury up front.
--
--   · Unit cost = the design's stored XP complexity × $5,000 — a
--     2-XP economy motorcycle builds for $10k, a 19-XP ultra-luxury
--     V12 sports car for $95k. One source: vehicle_blueprints.xp_cost.
--   · Lines: every automotive corp runs its Assembly Plant at
--     Level I — 1 line — so one run at a time. The constant moves to
--     a per-level helper when the plant tier column lands (Superior /
--     Automated line efficiencies arrive then too).
--   · Output accrues into vehicle_blueprints.units_in_stock via the
--     per-tick sweep (advance_vehicle_production, service_role —
--     called by the advance-corp-tick edge function).
--   · Starting a run is an executive action (one per tick, corp row
--     lock), like every other action on the desk.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.vehicle_blueprints
    ADD COLUMN IF NOT EXISTS units_in_stock int NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.vehicle_blueprints.units_in_stock IS
    'Finished vehicles of this Model in corp inventory — produced by Production Runs (20270834), awaiting sale mechanics.';

CREATE TABLE IF NOT EXISTS public.vehicle_production_runs (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    corp_id           uuid NOT NULL REFERENCES public.entrepreneur_corps(id) ON DELETE CASCADE,
    blueprint_id      uuid NOT NULL REFERENCES public.vehicle_blueprints(id) ON DELETE CASCADE,
    quantity          int  NOT NULL CHECK (quantity >= 1),
    produced          int  NOT NULL DEFAULT 0,
    unit_cost         bigint NOT NULL,
    total_cost        bigint NOT NULL,
    started_tick      int  NOT NULL,
    completes_at_tick int  NOT NULL,
    status            text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'complete')),
    created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS vehicle_production_runs_corp_idx
    ON public.vehicle_production_runs (corp_id);

ALTER TABLE public.vehicle_production_runs ENABLE ROW LEVEL SECURITY;

-- Public game data like the rest of the corp registry; writes only
-- through the RPCs.
DROP POLICY IF EXISTS "Allow select for all" ON public.vehicle_production_runs;
CREATE POLICY "Allow select for all" ON public.vehicle_production_runs
    FOR SELECT USING (true);

-- ── start_production_run ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.start_production_run(
    p_corp_id      uuid,
    p_blueprint_id uuid,
    p_quantity     int
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid   uuid := auth.uid();
    v_fac   factions%ROWTYPE;
    v_corp  entrepreneur_corps%ROWTYPE;
    v_bp    vehicle_blueprints%ROWTYPE;
    v_tick  int;
    v_unit  bigint;
    v_total bigint;
    v_id    uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL OR p_blueprint_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    -- 1 vehicle per tick: the amount IS the ticks the line is
    -- assigned. 60 (five game-years) bounds runaway assignments.
    IF p_quantity IS NULL OR p_quantity < 1 OR p_quantity > 60 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_quantity');
    END IF;

    -- Lock the corp row: the allowance, the line check, and the
    -- treasury debit below must serialize against concurrent runs.
    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.industry <> 'automotive' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'industry_not_chartered');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE id = v_corp.owner_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'businessman'
       AND abandoned_at IS NULL;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;
    IF lower(COALESCE(v_fac.status, '')) = 'arrested' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'arrested');
    END IF;

    SELECT * INTO v_bp FROM vehicle_blueprints
     WHERE id = p_blueprint_id AND corp_id = p_corp_id;
    IF v_bp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'blueprint_not_found');
    END IF;

    -- The Assembly Plant runs at Level I: 1 line, one run at a time.
    -- The constant moves to a per-level helper with the plant column.
    IF EXISTS (SELECT 1 FROM vehicle_production_runs
                WHERE corp_id = p_corp_id AND status = 'running') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_line_available');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_corp.exec_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    v_unit  := GREATEST(1, COALESCE(v_bp.xp_cost, 1)) * 5000;
    v_total := v_unit * p_quantity;
    IF floor(COALESCE(v_corp.treasury_cash, 0))::bigint < v_total THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_treasury',
            'need', v_total, 'have', floor(COALESCE(v_corp.treasury_cash, 0))::bigint);
    END IF;

    INSERT INTO vehicle_production_runs (
        corp_id, blueprint_id, quantity, unit_cost, total_cost,
        started_tick, completes_at_tick
    ) VALUES (
        p_corp_id, p_blueprint_id, p_quantity, v_unit, v_total,
        v_tick, v_tick + p_quantity
    ) RETURNING id INTO v_id;

    UPDATE entrepreneur_corps
       SET treasury_cash = COALESCE(treasury_cash, 0) - v_total,
           exec_action_tick = v_tick
     WHERE id = p_corp_id;

    RETURN jsonb_build_object('success', true, 'run_id', v_id,
        'quantity', p_quantity, 'unit_cost', v_unit, 'total_cost', v_total,
        'completes_at_tick', v_tick + p_quantity);
END $$;

REVOKE EXECUTE ON FUNCTION public.start_production_run(uuid, uuid, int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.start_production_run(uuid, uuid, int) TO authenticated;

-- ── advance_vehicle_production — the per-tick sweep ───────────────
CREATE OR REPLACE FUNCTION public.advance_vehicle_production(p_tick int)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    r          RECORD;
    v_done     int;
    v_delta    int;
    v_produced int := 0;
    v_finished int := 0;
BEGIN
    IF p_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    -- 1 vehicle per line per tick; idempotent — produced derives from
    -- elapsed ticks, so a re-run of the same tick adds nothing.
    FOR r IN SELECT * FROM vehicle_production_runs
              WHERE status = 'running'
              ORDER BY created_at
              FOR UPDATE
    LOOP
        v_done  := LEAST(r.quantity, GREATEST(0, p_tick - r.started_tick));
        v_delta := v_done - r.produced;
        IF v_delta > 0 THEN
            UPDATE vehicle_blueprints
               SET units_in_stock = units_in_stock + v_delta
             WHERE id = r.blueprint_id;
            v_produced := v_produced + v_delta;
        END IF;
        UPDATE vehicle_production_runs
           SET produced = v_done,
               status   = CASE WHEN v_done >= r.quantity THEN 'complete' ELSE 'running' END
         WHERE id = r.id;
        IF v_done >= r.quantity THEN
            v_finished := v_finished + 1;
        END IF;
    END LOOP;

    RETURN jsonb_build_object('success', true,
        'vehicles_produced', v_produced, 'runs_completed', v_finished);
END $$;

REVOKE EXECUTE ON FUNCTION public.advance_vehicle_production(int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.advance_vehicle_production(int) TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
