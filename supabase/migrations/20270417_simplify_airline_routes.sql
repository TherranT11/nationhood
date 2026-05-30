-- ════════════════════════════════════════════════════════════════════
-- Simplify the entrepreneur airline routes system:
--
--   (1) ONE CLASS PER ROUTE. Drop the per-class denorm counts
--       (aircraft_regional/narrowbody/widebody) from airline_routes
--       and replace with a single aircraft_class column. The
--       entrepreneur_open_route signature becomes (corp, origin, dest,
--       ticket, class, count) — one class dropdown + one quantity
--       instead of three count fields. Mixed-class routes were a depth
--       lever for under-capacity supplementation, but the UX cost (3
--       inputs per route + per-class range gating spread across two
--       error paths) wasn't paying for itself.
--
--   (2) NEW PRICE-SHARE FORMULA. Replace the opaque
--           weight = seats × max(0, 2 × (1 − ticket/500))
--       with
--           weight = seats × (lane_avg_ticket / ticket).
--       Algebraically equivalent to `seats / ticket` for the
--       proportional split (lane_avg cancels), so the rule players
--       hold in their heads is "cheaper-per-seat carrier wins more
--       share." The magic $500 ceiling goes away — and with it the
--       behaviour where a uniformly-overpriced lane allocates zero
--       passengers. Lanes always fully fill in proportion to weights;
--       overpricing only hurts the overpricer (small share, low
--       capacity utilisation). The allocator computes seats / ticket
--       directly (lane_avg drops out as a common factor).
--
-- Also drops airline_routes.maintenance_tier. It's been pinned to
-- 'basic' since v1 (20270204) — no player knob, vestigial column.
-- airline_condition_decay('basic') = 6.0/tick stays as the in-function
-- constant.
--
-- ticket_price upper bound (was 0-500) is dropped on the new
-- entrepreneur_open_route — the magic-500 was a side effect of the
-- old multiplier's zero-crossing, no longer relevant.
--
-- Idempotent: re-running adds the column only if missing, backfills
-- only NULL rows, recreates the functions byte-for-byte, drops the
-- old denorm columns only if they still exist.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Add single-class column ──────────────────────────────────────
ALTER TABLE airline_routes
    ADD COLUMN IF NOT EXISTS aircraft_class text;

-- Backfill from existing denorm counts (only matters for active
-- entrepreneur routes — legacy faction routes were deleted in
-- 20270416). Tiebreak widebody > narrowbody > regional so cross-nation
-- routes inherit the only class that could fly them.
UPDATE airline_routes
   SET aircraft_class = CASE
       WHEN COALESCE(aircraft_widebody, 0)   > 0
            AND COALESCE(aircraft_widebody, 0) >= COALESCE(aircraft_narrowbody, 0)
            AND COALESCE(aircraft_widebody, 0) >= COALESCE(aircraft_regional, 0)   THEN 'widebody'
       WHEN COALESCE(aircraft_narrowbody, 0) > 0
            AND COALESCE(aircraft_narrowbody, 0) >= COALESCE(aircraft_regional, 0) THEN 'narrowbody'
       ELSE 'regional'
   END
 WHERE aircraft_class IS NULL;

-- Any in-service aircraft whose class no longer matches the route's
-- chosen single class gets returned to the idle pool. After backfill
-- this is rare-to-empty (most routes were single-class in practice).
UPDATE corp_aircraft ca
   SET route_id       = NULL,
       is_overhauling = FALSE
  FROM airline_routes ar
 WHERE ca.route_id = ar.id
   AND ar.aircraft_class IS NOT NULL
   AND ca.aircraft_class <> ar.aircraft_class;

ALTER TABLE airline_routes
    ALTER COLUMN aircraft_class SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
         WHERE table_name = 'airline_routes'
           AND constraint_name = 'airline_routes_aircraft_class_chk'
    ) THEN
        ALTER TABLE airline_routes
            ADD CONSTRAINT airline_routes_aircraft_class_chk
            CHECK (aircraft_class IN ('regional', 'narrowbody', 'widebody'));
    END IF;
END $$;

-- ── 2. Rewrite the allocator with the new weight formula ────────────
-- Done BEFORE dropping the denorm/tier columns so the new body lands
-- in the same transaction as the column-drop (function bodies are
-- parsed at execution, not at CREATE — so technically Postgres would
-- let us do this in either order, but doing the rewrite first means
-- the body never references columns about to disappear).
CREATE OR REPLACE FUNCTION public.process_entrepreneur_airline_routes(p_tick int)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_route        RECORD;
    v_origin       airline_cities%ROWTYPE;
    v_dest         airline_cities%ROWTYPE;
    v_nation       nations%ROWTYPE;
    v_col_factor   numeric;
    v_demand_pool  numeric;
    v_total_weight numeric;
    v_my_weight    numeric;
    v_lane_share   numeric;
    v_my_seats     int;
    v_my_attr      numeric;
    v_total_attr   numeric;
    v_my_demand    numeric;
    v_pax          int;
    v_ac_count     int;
    v_revenue      bigint;
    v_ops_cost     bigint;
    v_net          bigint;
    v_routes_run   int    := 0;
    v_total_pax    bigint := 0;
    v_total_rev    bigint := 0;
    v_total_ops    bigint := 0;
BEGIN
    FOR v_route IN
        SELECT * FROM airline_routes
         WHERE status = 'active'
           AND airline_corp_id IS NOT NULL
           AND (last_processed_tick IS NULL OR last_processed_tick <> p_tick)
         FOR UPDATE
    LOOP
        SELECT * INTO v_origin FROM airline_cities WHERE id = v_route.origin_city_id;
        SELECT * INTO v_dest   FROM airline_cities WHERE id = v_route.dest_city_id;
        IF v_origin.id IS NULL OR v_dest.id IS NULL THEN CONTINUE; END IF;

        SELECT * INTO v_nation FROM nations WHERE id = v_origin.nation_id;
        IF v_nation.id IS NULL THEN CONTINUE; END IF;

        -- Demand pool — SoL up, CoL down.
        v_col_factor := GREATEST(0, LEAST(1,
            (100 - COALESCE(v_nation.cost_of_living, 50)) / 100.0));
        v_demand_pool := (COALESCE(v_nation.standard_of_living, 0) / 100.0)
                       * v_col_factor
                       * (COALESCE(v_nation.population, 0) / 1000000.0)
                       * 20.0;

        -- Lane weight within the origin nation.
        SELECT COALESCE(SUM(
                 (a.population_pct + b.population_pct)
                 * CASE WHEN a.is_capital OR b.is_capital THEN 2 ELSE 1 END), 0)
          INTO v_total_weight
          FROM airline_cities a
          JOIN airline_cities b
            ON a.nation_id = b.nation_id AND a.id < b.id
         WHERE a.nation_id = v_nation.id;

        v_my_weight := (v_origin.population_pct + v_dest.population_pct)
                     * CASE WHEN v_origin.is_capital OR v_dest.is_capital THEN 2 ELSE 1 END;

        v_lane_share := CASE WHEN v_total_weight > 0
                             THEN v_demand_pool * (v_my_weight / v_total_weight)
                             ELSE 0 END;

        -- Capacity = Σ each assigned aircraft's design passengers (class
        -- default via ent_airline_seats when the plane has no design).
        SELECT COALESCE(SUM(
                 COALESCE(d.passengers,
                          ent_airline_seats((ca.aircraft_class = 'regional')::int,
                                            (ca.aircraft_class = 'narrowbody')::int,
                                            (ca.aircraft_class = 'widebody')::int))), 0)::int
          INTO v_my_seats
          FROM corp_aircraft ca
          LEFT JOIN ent_aircraft_designs d ON d.id = ca.ent_design_id
         WHERE ca.route_id = v_route.id;

        -- Lane attractiveness Σ — share ∝ seats / ticket per lane route
        -- ("cheaper-per-seat wins more"). Equivalent to seats × (lane_avg
        -- / ticket); lane_avg factors out of the proportional split, so
        -- it isn't computed. GREATEST(ticket, 1) guards the free-ticket
        -- edge case (would otherwise divide by zero); a $1 fare still
        -- carries enormous weight and captures the lane, which is the
        -- intended behaviour ("free seats win everything").
        SELECT COALESCE(SUM(
                 rs.seats / GREATEST(COALESCE(ar.ticket_price, 0), 1)::numeric), 0)
          INTO v_total_attr
          FROM airline_routes ar
          JOIN (
              SELECT ca.route_id,
                     SUM(COALESCE(d.passengers,
                                  ent_airline_seats((ca.aircraft_class = 'regional')::int,
                                                    (ca.aircraft_class = 'narrowbody')::int,
                                                    (ca.aircraft_class = 'widebody')::int)))::numeric AS seats
                FROM corp_aircraft ca
                LEFT JOIN ent_aircraft_designs d ON d.id = ca.ent_design_id
               GROUP BY ca.route_id
          ) rs ON rs.route_id = ar.id
         WHERE ar.status = 'active'
           AND ar.origin_city_id = v_route.origin_city_id
           AND ar.dest_city_id   = v_route.dest_city_id;

        v_my_attr   := v_my_seats / GREATEST(COALESCE(v_route.ticket_price, 0), 1)::numeric;
        v_my_demand := CASE WHEN v_total_attr > 0
                            THEN v_lane_share * (v_my_attr / v_total_attr)
                            ELSE 0 END;
        v_pax       := LEAST(GREATEST(0, FLOOR(v_my_demand))::int, v_my_seats);
        v_revenue   := (v_pax * COALESCE(v_route.ticket_price, 0))::bigint;

        -- Ops cost — class-flat $/tick × assigned-aircraft count. The
        -- denorm count columns are gone; count from corp_aircraft.
        SELECT COUNT(*) INTO v_ac_count
          FROM corp_aircraft WHERE route_id = v_route.id;

        v_ops_cost := (v_ac_count * CASE v_route.aircraft_class
                                        WHEN 'regional'   THEN 500
                                        WHEN 'narrowbody' THEN 1200
                                        WHEN 'widebody'   THEN 2500
                                        ELSE 0
                                    END)::bigint;

        v_net := v_revenue - v_ops_cost;

        -- Net to corp treasury (may go negative — see header).
        UPDATE entrepreneur_corps
           SET treasury_cash = COALESCE(treasury_cash, 0) + v_net
         WHERE id = v_route.airline_corp_id;

        UPDATE airline_routes
           SET lifetime_pax        = lifetime_pax     + v_pax,
               lifetime_revenue    = lifetime_revenue + v_revenue,
               lifetime_spend      = lifetime_spend   + v_ops_cost,
               last_tick_pax       = v_pax,
               last_tick_revenue   = v_revenue,
               last_tick_spend     = v_ops_cost,
               last_processed_tick = p_tick
         WHERE id = v_route.id;

        -- Condition decay — maintenance_tier is gone; pin to 'basic'
        -- (the only tier v1 ever used), keeping airline_condition_decay
        -- as the single source of truth for the decay rate.
        UPDATE corp_aircraft
           SET condition = GREATEST(0, condition - airline_condition_decay('basic'))
         WHERE route_id = v_route.id
           AND COALESCE(is_overhauling, FALSE) = FALSE;

        UPDATE corp_aircraft
           SET is_overhauling = FALSE
         WHERE route_id = v_route.id
           AND is_overhauling = TRUE;

        v_routes_run := v_routes_run + 1;
        v_total_pax  := v_total_pax + v_pax;
        v_total_rev  := v_total_rev + v_revenue;
        v_total_ops  := v_total_ops + v_ops_cost;
    END LOOP;

    RETURN jsonb_build_object(
        'success',       true,
        'tick',          p_tick,
        'routes_run',    v_routes_run,
        'total_pax',     v_total_pax,
        'total_revenue', v_total_rev,
        'total_ops',     v_total_ops
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.process_entrepreneur_airline_routes(int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.process_entrepreneur_airline_routes(int) TO service_role;

-- ── 3. New entrepreneur_open_route: single class + count ────────────
DROP FUNCTION IF EXISTS public.entrepreneur_open_route(uuid, uuid, uuid, int, int, int, int);

CREATE OR REPLACE FUNCTION public.entrepreneur_open_route(
    p_corp_id        uuid,
    p_origin_city_id uuid,
    p_dest_city_id   uuid,
    p_ticket_price   int,
    p_class          text,
    p_count          int
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_corp         entrepreneur_corps%ROWTYPE;
    v_fac          factions%ROWTYPE;
    v_origin       airline_cities%ROWTYPE;
    v_dest         airline_cities%ROWTYPE;
    v_a            uuid;
    v_b            uuid;
    v_range        int;
    v_route_type   text;
    v_tick         int;
    v_idle         int;
    v_route_id     uuid;
    v_ids          uuid[];
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL OR p_origin_city_id IS NULL OR p_dest_city_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_origin_city_id = p_dest_city_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'same_city');
    END IF;
    IF p_ticket_price IS NULL OR p_ticket_price < 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_ticket_price');
    END IF;
    IF p_class NOT IN ('regional', 'narrowbody', 'widebody') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_class');
    END IF;
    IF p_count IS NULL OR p_count < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_aircraft_assigned');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.industry <> 'airline' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_airline_corp');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;
    IF v_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    SELECT * INTO v_origin FROM airline_cities WHERE id = p_origin_city_id;
    SELECT * INTO v_dest   FROM airline_cities WHERE id = p_dest_city_id;
    IF v_origin.id IS NULL OR v_dest.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'city_not_found');
    END IF;

    -- Terminal at BOTH endpoints (entrepreneur ownership).
    IF NOT EXISTS (SELECT 1 FROM airline_terminals
                    WHERE city_id = p_origin_city_id AND owner_corp_id = p_corp_id) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_terminal_origin');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM airline_terminals
                    WHERE city_id = p_dest_city_id AND owner_corp_id = p_corp_id) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_terminal_dest');
    END IF;

    -- Canonical pair order (table CHECK requires origin < dest).
    IF p_origin_city_id < p_dest_city_id THEN
        v_a := p_origin_city_id; v_b := p_dest_city_id;
    ELSE
        v_a := p_dest_city_id;   v_b := p_origin_city_id;
    END IF;

    IF EXISTS (SELECT 1 FROM airline_routes
                WHERE airline_corp_id = p_corp_id
                  AND origin_city_id = v_a AND dest_city_id = v_b
                  AND status = 'active') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'route_exists');
    END IF;

    SELECT range_units INTO v_range FROM airline_city_ranges
     WHERE city_a_id = v_a AND city_b_id = v_b;
    IF v_range IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_range_data');
    END IF;
    IF v_range > 20 AND p_class = 'regional' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'regional_out_of_range',
            'range', v_range, 'class_max', 20);
    END IF;
    IF v_range > 60 AND p_class = 'narrowbody' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'narrowbody_out_of_range',
            'range', v_range, 'class_max', 60);
    END IF;

    SELECT COUNT(*) INTO v_idle
      FROM corp_aircraft
     WHERE entrepreneur_corp_id = p_corp_id
       AND aircraft_class = p_class
       AND route_id IS NULL;
    IF p_count > v_idle THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_idle_aircraft',
            'class', p_class, 'idle', v_idle, 'requested', p_count);
    END IF;

    v_route_type := CASE WHEN v_origin.nation_id = v_dest.nation_id THEN 'domestic' ELSE 'international' END;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    INSERT INTO airline_routes (
        airline_corp_id, airline_faction_id,
        origin_city_id, dest_city_id, ticket_price,
        aircraft_class,
        route_type, status, opened_at_tick
    ) VALUES (
        p_corp_id, NULL,
        v_a, v_b, p_ticket_price,
        p_class,
        v_route_type, 'active', v_tick
    ) RETURNING id INTO v_route_id;

    -- Assign p_count idle aircraft of the chosen class (oldest first,
    -- mirroring the prior selection rule).
    SELECT array_agg(id) INTO v_ids FROM (
        SELECT id FROM corp_aircraft
         WHERE entrepreneur_corp_id = p_corp_id
           AND aircraft_class = p_class
           AND route_id IS NULL
         ORDER BY created_at ASC
         LIMIT p_count
         FOR UPDATE
    ) picks;
    UPDATE corp_aircraft SET route_id = v_route_id WHERE id = ANY(v_ids);

    RETURN jsonb_build_object(
        'success', true,
        'route_id', v_route_id,
        'corp_id', p_corp_id,
        'origin_city_id', v_a,
        'dest_city_id', v_b,
        'ticket_price', p_ticket_price,
        'route_type', v_route_type,
        'range_units', v_range,
        'aircraft_class', p_class,
        'aircraft_count', p_count
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.entrepreneur_open_route(uuid, uuid, uuid, int, text, int) TO authenticated;

COMMENT ON FUNCTION public.entrepreneur_open_route(uuid, uuid, uuid, int, text, int) IS
    'Open a single-class route. Requires a terminal at both endpoints + p_count idle aircraft of p_class. Range gates: regional ≤ 20, narrowbody ≤ 60, widebody any. ticket_price ≥ 0 (no upper cap — share allocator handles relative pricing).';

-- ── 4. Drop the legacy denorm count + tier columns ──────────────────
ALTER TABLE airline_routes
    DROP COLUMN IF EXISTS aircraft_regional,
    DROP COLUMN IF EXISTS aircraft_narrowbody,
    DROP COLUMN IF EXISTS aircraft_widebody,
    DROP COLUMN IF EXISTS maintenance_tier;

NOTIFY pgrst, 'reload schema';

COMMIT;
