-- ════════════════════════════════════════════════════════════════════
-- Real Estate Phase 2 — Apartment rent economics
--
-- Owned apartments now generate net rent per tick. The formula (single
-- source — every consumer reads this RPC, no inline copy of the math):
--
--   gross_rent  = base_rent × (standard_of_living + infrastructure) / 100
--   occupancy   = clamp(0.4, 1.0, stability / 100)
--   maintenance = base_rent × (100 - infrastructure) / 200
--   net_rent    = round(gross_rent × occupancy - maintenance)
--
-- Per-tier base rents:
--   apartment_basic    $40k/tick
--   apartment_modest   $90k/tick
--   apartment_luxury   $250k/tick
--
-- Net rent can go negative — in low-SoL / low-infrastructure /
-- low-stability nations you bleed cash holding the property. That's
-- the risk lever the design called for: flipping captures forward
-- value, holding is a bet on the nation's trajectory.
--
-- Process model mirrors the airline route allocator (20270431):
--   * Per-building last_processed_tick column for idempotency
--     (cron runs every minute but processes each apartment once per
--     game tick — no double payment if the cron retries).
--   * Direct UPDATE entrepreneur_corps.treasury_cash. No
--     emit_corp_cash_event call — the cash_events ledger was removed
--     from the entrepreneur tick path in the corp cull (advance-corp-tick
--     comments). If a per-tick history surface is needed in Phase 3
--     we'll wire one then; for v1 the dashboard will recompute live.
--
-- The corp_buildings.last_processed_tick column is generic (not
-- apartment_*-prefixed) on purpose — future per-tick-processed
-- building types reuse it. Apartments are the only consumers today.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Tick-stamp column ────────────────────────────────────────────
ALTER TABLE corp_buildings
    ADD COLUMN IF NOT EXISTS last_processed_tick int;

COMMENT ON COLUMN corp_buildings.last_processed_tick IS
    'Game tick at which this building''s per-tick economics last ran. Apartment rent processor (20270438) uses this for idempotency — same pattern as airline_routes.last_processed_tick. NULL = never processed; apartments newly built get their first rent tick after completion.';

-- Same security posture as next_mp_action_tick / next_general_election_tick:
-- the tick processor (service_role) writes; nobody else needs to.
REVOKE UPDATE (last_processed_tick) ON corp_buildings FROM PUBLIC, anon, authenticated;

-- ── 2. Apartment rent processor ─────────────────────────────────────
-- Iterates every completed apartment whose last_processed_tick != p_tick,
-- computes net_rent against the current nation stats, applies it to the
-- owner's treasury, and stamps the tick. FOR UPDATE on the building row
-- serialises concurrent processor runs; the WHERE filter ensures no
-- double-payment within a single tick.
CREATE OR REPLACE FUNCTION public.process_apartment_rents(p_tick int)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_b           RECORD;
    v_base_rent   bigint;
    v_sol         numeric;
    v_inf         numeric;
    v_stab        numeric;
    v_gross       numeric;
    v_occ         numeric;
    v_maint       numeric;
    v_net         bigint;
    v_count       int    := 0;
    v_total_net   bigint := 0;
BEGIN
    FOR v_b IN
        SELECT b.id, b.owner_corp_id, b.building_type, b.nation_id,
               n.standard_of_living, n.infrastructure, n.stability
          FROM corp_buildings b
          JOIN nations n ON n.id = b.nation_id
         WHERE b.building_type IN ('apartment_basic', 'apartment_modest', 'apartment_luxury')
           AND b.status = 'completed'
           AND b.owner_corp_id IS NOT NULL
           AND (b.last_processed_tick IS NULL OR b.last_processed_tick <> p_tick)
         FOR UPDATE
    LOOP
        v_base_rent := CASE v_b.building_type
            WHEN 'apartment_basic'  THEN 40000
            WHEN 'apartment_modest' THEN 90000
            WHEN 'apartment_luxury' THEN 250000
        END;

        v_sol  := COALESCE(v_b.standard_of_living, 50);
        v_inf  := COALESCE(v_b.infrastructure,    50);
        v_stab := COALESCE(v_b.stability,         50);

        v_gross := v_base_rent::numeric * (v_sol + v_inf) / 100.0;
        v_occ   := GREATEST(0.4, LEAST(1.0, v_stab / 100.0));
        v_maint := v_base_rent::numeric * (100.0 - v_inf) / 200.0;
        v_net   := ROUND(v_gross * v_occ - v_maint)::bigint;

        UPDATE entrepreneur_corps
           SET treasury_cash = COALESCE(treasury_cash, 0) + v_net
         WHERE id = v_b.owner_corp_id;

        UPDATE corp_buildings
           SET last_processed_tick = p_tick
         WHERE id = v_b.id;

        v_count     := v_count + 1;
        v_total_net := v_total_net + v_net;
    END LOOP;

    RETURN jsonb_build_object(
        'success',         true,
        'tick',            p_tick,
        'apartments_run',  v_count,
        'total_net_rent',  v_total_net
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.process_apartment_rents(int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.process_apartment_rents(int) TO service_role;

COMMENT ON FUNCTION public.process_apartment_rents(int) IS
    'Per-tick rent allocator for owned Apartment Complexes. For each completed apartment whose last_processed_tick != p_tick: computes net_rent = round(base × (SoL+inf)/100 × clamp(0.4, 1, stab/100) - base × (100-inf)/200), credits the owner corp''s treasury_cash, stamps last_processed_tick. Idempotent within a tick. Base rents: basic $40k, modest $90k, luxury $250k. Service-role only; called from advance-corp-tick.';

NOTIFY pgrst, 'reload schema';

COMMIT;
