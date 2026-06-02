-- ════════════════════════════════════════════════════════════════════
-- Airline three-city + distance model — full rewrite
--
-- Per design decision: every nation has exactly 3 cities (capital + 2
-- major). Each lane has a distance 1-10. Aircraft range gate uses
-- per-design range_nm (already on ent_aircraft_designs). Demand is
-- lane-local — no nation pool, no FLOOR cliff.
--
-- ── What this migration does ────────────────────────────────────────
-- 1. Drop unused airline_cities columns (terminal_count, runway_type)
-- 2. Rename airline_city_ranges.range_units → distance (CHECK 1-10)
-- 3. Auto-cull cities to top 3 per nation (capital + top 2 by pop)
--    - Park aircraft on orphan routes (route_id → NULL)
--    - DELETE orphan routes (FK has no CASCADE; planes survive)
--    - DELETE dropped cities (CASCADE handles terminals)
--    - Redistribute dropped pop_pct proportionally to survivors
-- 4. Trigger to enforce pop_pct sum = 100 per nation going forward
-- 5. Re-seed airline_city_ranges with new distance values:
--    - Within-nation pairs = distance 2
--    - Cross-nation pairs = GREATEST(3, LEAST(10, 1 + ROUND((100-prox)/10)))
--      derived from diplomatic_relations.proximity (default to 10 if missing)
-- 6. Rewrite process_entrepreneur_airline_routes — lane-local formula:
--    demand = (origin_pop% + dest_pop%) × (SoL/100) × (capital? 1.5 : 1.0) × 0.5
--    Split among competitors by (seats × 500 / ticket_price) attractiveness
--    Result clamped at route's total seats
-- 7. Rewrite entrepreneur_open_route — per-aircraft range gate via
--    design.range_nm >= distance, instead of class-tier caps
-- 8. Update admin_create_hub / admin_update_hub — drop terminal_count
--    + runway_type params
--
-- ── Existing-data handling ──────────────────────────────────────────
-- The cull may drop player-owned terminals (CASCADE). Routes touching
-- dropped cities get DELETEd (no history kept) — but their aircraft
-- are parked in the corp hangar (route_id=NULL), still owned. Player
-- can reassign them to a surviving route.
--
-- existing airline_city_ranges.range_units values are incoherent
-- relative to the new 1-10 scale (regional class-cap was 20 in the
-- old model). TRUNCATE and reseed with the new derivation.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Drop unused airline_cities columns ───────────────────────────
ALTER TABLE airline_cities DROP COLUMN IF EXISTS terminal_count;
ALTER TABLE airline_cities DROP COLUMN IF EXISTS runway_type;

-- ── 2. airline_city_ranges → distance ───────────────────────────────
-- Drop the old range_units_check (old class-tier model went up to 20)
-- and rename the column. The new distance_check (1-10) is added AFTER
-- step 5's TRUNCATE+reseed so it doesn't trip on legacy rows that
-- still hold the old range_units values.
ALTER TABLE airline_city_ranges
    RENAME COLUMN range_units TO distance;
ALTER TABLE airline_city_ranges
    DROP CONSTRAINT IF EXISTS airline_city_ranges_range_units_check;
ALTER TABLE airline_city_ranges
    DROP CONSTRAINT IF EXISTS airline_city_ranges_distance_check;

COMMENT ON COLUMN airline_city_ranges.distance IS
    'Lane distance 1-10. Within-nation pairs default to 2; cross-nation pairs derived from diplomatic_relations.proximity (20270465). Aircraft range gate: ent_aircraft_designs.range_nm >= distance.';

-- ── 3. Cull cities to top 3 per nation ──────────────────────────────
-- Identify droppers
CREATE TEMP TABLE _city_droppers ON COMMIT DROP AS
SELECT id, nation_id, population_pct
  FROM (
    SELECT id, nation_id, population_pct,
           ROW_NUMBER() OVER (
               PARTITION BY nation_id
               ORDER BY is_capital DESC, population_pct DESC, created_at ASC
           ) AS rk
      FROM airline_cities
  ) ranked
 WHERE rk > 3;

-- Park aircraft assigned to routes touching dropped cities
UPDATE corp_aircraft
   SET route_id = NULL
 WHERE route_id IN (
     SELECT id FROM airline_routes
      WHERE origin_city_id IN (SELECT id FROM _city_droppers)
         OR dest_city_id   IN (SELECT id FROM _city_droppers)
 );

-- DELETE orphan routes (FK has no CASCADE; airline_routes blocks the
-- city DELETE otherwise). History lost — the cities are gone, the
-- routes don't make sense anymore.
DELETE FROM airline_routes
 WHERE origin_city_id IN (SELECT id FROM _city_droppers)
    OR dest_city_id   IN (SELECT id FROM _city_droppers);

-- Redistribute dropped pop_pct proportionally to surviving cities in
-- the same nation. Each survivor's new pct = old_pct × (100 / sum_keep).
WITH sums AS (
    SELECT nation_id,
           SUM(population_pct) FILTER (
             WHERE id IN (SELECT id FROM _city_droppers)
           ) AS sum_drop,
           SUM(population_pct) FILTER (
             WHERE id NOT IN (SELECT id FROM _city_droppers)
           ) AS sum_keep
      FROM airline_cities
     GROUP BY nation_id
)
UPDATE airline_cities ac
   SET population_pct = ROUND(
         (ac.population_pct * 100.0 / NULLIF(s.sum_keep, 0))::numeric,
         2)
  FROM sums s
 WHERE ac.nation_id = s.nation_id
   AND ac.id NOT IN (SELECT id FROM _city_droppers)
   AND s.sum_keep > 0;

-- Actually drop the dropped cities. CASCADE on airline_terminals (and
-- now-empty airline_city_ranges) handles cleanup.
DELETE FROM airline_cities WHERE id IN (SELECT id FROM _city_droppers);

-- Normalize: rounding may leave sum ≠ 100. Adjust the largest city in
-- each nation by the delta.
WITH sums AS (
    SELECT nation_id, SUM(population_pct) AS s
      FROM airline_cities GROUP BY nation_id
),
targets AS (
    SELECT DISTINCT ON (ac.nation_id)
           ac.id, (100.0 - s.s) AS delta
      FROM airline_cities ac
      JOIN sums s ON s.nation_id = ac.nation_id
     WHERE ABS(s.s - 100) > 0.001
     ORDER BY ac.nation_id, ac.population_pct DESC, ac.id
)
UPDATE airline_cities ac
   SET population_pct = population_pct + t.delta
  FROM targets t
 WHERE ac.id = t.id;

-- ── 4. Trigger to enforce pop_pct sum = 100 per nation ──────────────
CREATE OR REPLACE FUNCTION public._trg_airline_cities_pop_sum()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_sum numeric;
    v_nation uuid;
BEGIN
    v_nation := COALESCE(NEW.nation_id, OLD.nation_id);
    SELECT SUM(population_pct) INTO v_sum
      FROM airline_cities
     WHERE nation_id = v_nation;
    -- Nation with zero cities is fine (sum is NULL).
    IF v_sum IS NOT NULL AND ABS(v_sum - 100) > 0.01 THEN
        RAISE EXCEPTION 'airline_cities.population_pct must sum to 100 per nation (nation %, got %)',
            v_nation, v_sum;
    END IF;
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_airline_cities_pop_sum ON airline_cities;
CREATE CONSTRAINT TRIGGER trg_airline_cities_pop_sum
    AFTER INSERT OR UPDATE OR DELETE ON airline_cities
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION public._trg_airline_cities_pop_sum();

-- ── 5. Re-seed airline_city_ranges with distance values ─────────────
TRUNCATE airline_city_ranges;

INSERT INTO airline_city_ranges (city_a_id, city_b_id, distance)
SELECT DISTINCT
       a.id AS city_a_id,
       b.id AS city_b_id,
       CASE
           WHEN a.nation_id = b.nation_id THEN 2
           ELSE GREATEST(3, LEAST(10,
                  1 + ROUND((100 - COALESCE(dr.proximity, 0))::numeric / 10)))
       END::int AS distance
  FROM airline_cities a
  JOIN airline_cities b ON a.id < b.id
  LEFT JOIN diplomatic_relations dr
    ON (dr.nation_a_id = a.nation_id AND dr.nation_b_id = b.nation_id)
    OR (dr.nation_b_id = a.nation_id AND dr.nation_a_id = b.nation_id);

-- Now that the reseed clamped every distance into [1,10], it's safe
-- to install the CHECK constraint. Moved here from step 2 to avoid
-- the workflow-failure pattern where the bare ADD CONSTRAINT trips
-- on legacy range_units values still in the table at that point.
ALTER TABLE airline_city_ranges
    ADD CONSTRAINT airline_city_ranges_distance_check
    CHECK (distance >= 1 AND distance <= 10);

-- ── 6. process_entrepreneur_airline_routes — lane-local formula ─────
-- demand = (origin_pop% + dest_pop%) × (SoL/100) × (capital? 1.5 : 1.0) × 0.5
-- One constant (×0.5). No nation pool. No FLOOR cliff. Failure modes
-- are visible: 0 pax means SoL=0 OR seats=0 OR you priced yourself out.
CREATE OR REPLACE FUNCTION public.process_entrepreneur_airline_routes(p_tick int)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_route       RECORD;
    v_pax         int;
    v_ac_count    int;
    v_revenue     bigint;
    v_ops_cost    bigint;
    v_net         bigint;
    v_routes_run  int    := 0;
    v_total_pax   bigint := 0;
    v_total_rev   bigint := 0;
    v_total_ops   bigint := 0;
BEGIN
    CREATE TEMP TABLE IF NOT EXISTS _route_pax_alloc (
        route_id      uuid PRIMARY KEY,
        allocated_pax int
    ) ON COMMIT DROP;
    TRUNCATE _route_pax_alloc;

    INSERT INTO _route_pax_alloc (route_id, allocated_pax)
    WITH due_routes AS (
        SELECT ar.id, ar.origin_city_id, ar.dest_city_id, ar.ticket_price
          FROM airline_routes ar
         WHERE ar.status = 'active'
           AND ar.airline_corp_id IS NOT NULL
           AND (ar.last_processed_tick IS NULL OR ar.last_processed_tick <> p_tick)
    ),
    route_seats AS (
        SELECT dr.id AS route_id, dr.origin_city_id, dr.dest_city_id, dr.ticket_price,
               COALESCE(SUM(COALESCE(d.passengers,
                              ent_airline_seats((ca.aircraft_class = 'regional')::int,
                                                (ca.aircraft_class = 'narrowbody')::int,
                                                (ca.aircraft_class = 'widebody')::int))), 0)::int AS seats
          FROM due_routes dr
          LEFT JOIN corp_aircraft ca ON ca.route_id = dr.id
          LEFT JOIN ent_aircraft_designs d ON d.id = ca.ent_design_id
         GROUP BY dr.id, dr.origin_city_id, dr.dest_city_id, dr.ticket_price
    ),
    lane_demand AS (
        -- Per-lane demand. International routes: average the two nations'
        -- standard_of_living (both endpoints contribute).
        SELECT DISTINCT rs.origin_city_id, rs.dest_city_id,
               (oc.population_pct + dc.population_pct)
               * ((COALESCE(no.standard_of_living, 0) + COALESCE(nd.standard_of_living, 0)) / 200.0)
               * CASE WHEN oc.is_capital OR dc.is_capital THEN 1.5 ELSE 1.0 END
               * 0.5 AS demand
          FROM route_seats rs
          JOIN airline_cities oc ON oc.id = rs.origin_city_id
          JOIN airline_cities dc ON dc.id = rs.dest_city_id
          JOIN nations no ON no.id = oc.nation_id
          JOIN nations nd ON nd.id = dc.nation_id
    ),
    lane_total_attr AS (
        -- Attractiveness: cheaper ticket + more seats = larger share.
        -- 500 is the ticket_price ceiling; scaling by it keeps attr
        -- bounded so the math doesn't blow up with $1 tickets.
        SELECT origin_city_id, dest_city_id,
               SUM(seats * 500.0 / GREATEST(COALESCE(ticket_price, 0), 1)::numeric) AS total_attr
          FROM route_seats
         GROUP BY origin_city_id, dest_city_id
    ),
    shares AS (
        SELECT rs.route_id, rs.seats,
               CASE WHEN lt.total_attr > 0 AND ld.demand > 0
                    THEN ld.demand
                       * (rs.seats * 500.0 / GREATEST(COALESCE(rs.ticket_price, 0), 1)::numeric)
                       / lt.total_attr
                    ELSE 0
               END AS share
          FROM route_seats rs
          JOIN lane_demand ld   USING (origin_city_id, dest_city_id)
          JOIN lane_total_attr lt USING (origin_city_id, dest_city_id)
    )
    SELECT route_id, LEAST(seats, ROUND(share)::int)::int FROM shares;

    FOR v_route IN
        SELECT * FROM airline_routes
         WHERE status = 'active'
           AND airline_corp_id IS NOT NULL
           AND (last_processed_tick IS NULL OR last_processed_tick <> p_tick)
         FOR UPDATE
    LOOP
        SELECT allocated_pax INTO v_pax FROM _route_pax_alloc WHERE route_id = v_route.id;
        v_pax     := COALESCE(v_pax, 0);
        v_revenue := (v_pax * COALESCE(v_route.ticket_price, 0))::bigint;

        SELECT COUNT(*) INTO v_ac_count
          FROM corp_aircraft WHERE route_id = v_route.id;

        v_ops_cost := (v_ac_count * CASE v_route.aircraft_class
                                        WHEN 'regional'   THEN 500
                                        WHEN 'narrowbody' THEN 1200
                                        WHEN 'widebody'   THEN 2500
                                        ELSE 0
                                    END)::bigint;

        v_net := v_revenue - v_ops_cost;

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

-- ── 7. entrepreneur_open_route — per-aircraft range gate ────────────
-- Range gate now reads design.range_nm per aircraft, not class-tier
-- caps. Selects only idle aircraft of the requested class whose design
-- meets the route distance. If insufficient, errors with the actual
-- count of range-eligible idle planes.
CREATE OR REPLACE FUNCTION public.entrepreneur_open_route(
    p_corp_id        uuid,
    p_origin_city_id uuid,
    p_dest_city_id   uuid,
    p_ticket_price   int,
    p_class          text,
    p_count          int
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid               uuid := auth.uid();
    v_corp              entrepreneur_corps%ROWTYPE;
    v_fac               factions%ROWTYPE;
    v_origin            airline_cities%ROWTYPE;
    v_dest              airline_cities%ROWTYPE;
    v_a                 uuid;
    v_b                 uuid;
    v_distance          int;
    v_route_type        text;
    v_tick              int;
    v_idle_with_range   int;
    v_route_id          uuid;
    v_ids               uuid[];
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

    SELECT distance INTO v_distance FROM airline_city_ranges
     WHERE city_a_id = v_a AND city_b_id = v_b;
    IF v_distance IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_distance_data');
    END IF;

    -- Idle aircraft of class WHERE design range >= distance. Per-design
    -- gate replaces the class-tier caps from 20270417.
    SELECT COUNT(*) INTO v_idle_with_range
      FROM corp_aircraft ca
      LEFT JOIN ent_aircraft_designs d ON d.id = ca.ent_design_id
     WHERE ca.entrepreneur_corp_id = p_corp_id
       AND ca.aircraft_class = p_class
       AND ca.route_id IS NULL
       AND COALESCE(d.range_nm, 0) >= v_distance;
    IF p_count > v_idle_with_range THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_range_aircraft',
            'class', p_class, 'route_distance', v_distance,
            'available_with_range', v_idle_with_range, 'requested', p_count);
    END IF;

    v_route_type := CASE WHEN v_origin.nation_id = v_dest.nation_id THEN 'domestic' ELSE 'international' END;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    INSERT INTO airline_routes (
        airline_corp_id, airline_faction_id,
        origin_city_id, dest_city_id, ticket_price,
        aircraft_class, route_type, status, opened_at_tick
    ) VALUES (
        p_corp_id, NULL,
        v_a, v_b, p_ticket_price,
        p_class, v_route_type, 'active', v_tick
    ) RETURNING id INTO v_route_id;

    -- Pick range-eligible idle aircraft (oldest first).
    SELECT array_agg(id) INTO v_ids FROM (
        SELECT ca.id FROM corp_aircraft ca
          LEFT JOIN ent_aircraft_designs d ON d.id = ca.ent_design_id
         WHERE ca.entrepreneur_corp_id = p_corp_id
           AND ca.aircraft_class = p_class
           AND ca.route_id IS NULL
           AND COALESCE(d.range_nm, 0) >= v_distance
         ORDER BY ca.created_at ASC
         LIMIT p_count
         FOR UPDATE OF ca
    ) picks;
    UPDATE corp_aircraft SET route_id = v_route_id WHERE id = ANY(v_ids);

    RETURN jsonb_build_object(
        'success', true, 'route_id', v_route_id,
        'distance', v_distance, 'route_type', v_route_type,
        'aircraft_assigned', array_length(v_ids, 1)
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.entrepreneur_open_route(uuid, uuid, uuid, int, text, int) TO authenticated;

-- ── 8. admin_create_hub + admin_update_hub — drop unused params ─────
-- Player-facing admin UI also updated to remove the terminal/runway
-- inputs in lockstep.
DROP FUNCTION IF EXISTS public.admin_create_hub(uuid, text, numeric, text, int, boolean);
DROP FUNCTION IF EXISTS public.admin_update_hub(uuid, text, numeric, text, int, boolean);

CREATE OR REPLACE FUNCTION public.admin_create_hub(
    p_nation_id uuid,
    p_name      text,
    p_weight    numeric,
    p_is_capital boolean
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid uuid := auth.uid();
    v_role text;
    v_id uuid;
    v_city_count int;
BEGIN
    IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated'); END IF;
    SELECT role INTO v_role FROM user_roles WHERE user_id = v_uid;
    IF v_role IS DISTINCT FROM 'admin' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_admin');
    END IF;
    IF p_nation_id IS NULL OR p_name IS NULL OR char_length(btrim(p_name)) < 2 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_weight IS NULL OR p_weight < 0 OR p_weight > 100 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_weight');
    END IF;

    SELECT COUNT(*) INTO v_city_count FROM airline_cities WHERE nation_id = p_nation_id;
    IF v_city_count >= 3 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'three_city_cap',
            'have', v_city_count);
    END IF;
    IF EXISTS (SELECT 1 FROM airline_cities WHERE nation_id = p_nation_id AND name = btrim(p_name)) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'name_exists');
    END IF;
    IF p_is_capital AND EXISTS (SELECT 1 FROM airline_cities WHERE nation_id = p_nation_id AND is_capital) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'capital_exists');
    END IF;

    INSERT INTO airline_cities (nation_id, name, population_pct, is_capital)
    VALUES (p_nation_id, btrim(p_name), p_weight, COALESCE(p_is_capital, false))
    RETURNING id INTO v_id;

    RETURN jsonb_build_object('success', true, 'id', v_id);
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_create_hub(uuid, text, numeric, boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_update_hub(
    p_hub_id uuid,
    p_name   text,
    p_weight numeric,
    p_is_capital boolean
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid uuid := auth.uid();
    v_role text;
    v_hub airline_cities%ROWTYPE;
BEGIN
    IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated'); END IF;
    SELECT role INTO v_role FROM user_roles WHERE user_id = v_uid;
    IF v_role IS DISTINCT FROM 'admin' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_admin');
    END IF;

    SELECT * INTO v_hub FROM airline_cities WHERE id = p_hub_id FOR UPDATE;
    IF v_hub.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'hub_not_found');
    END IF;
    IF p_name IS NULL OR char_length(btrim(p_name)) < 2 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_weight IS NULL OR p_weight < 0 OR p_weight > 100 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_weight');
    END IF;
    IF EXISTS (SELECT 1 FROM airline_cities
                WHERE nation_id = v_hub.nation_id
                  AND id <> p_hub_id
                  AND name = btrim(p_name)) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'name_exists');
    END IF;
    IF p_is_capital AND NOT v_hub.is_capital
       AND EXISTS (SELECT 1 FROM airline_cities
                    WHERE nation_id = v_hub.nation_id AND id <> p_hub_id AND is_capital) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'capital_exists');
    END IF;

    UPDATE airline_cities SET
        name = btrim(p_name),
        population_pct = p_weight,
        is_capital = COALESCE(p_is_capital, is_capital)
     WHERE id = p_hub_id;

    RETURN jsonb_build_object('success', true);
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_update_hub(uuid, text, numeric, boolean) TO authenticated;

-- ── 9. admin_set_hub_ranges — update for distance column + 1-10 ─────
CREATE OR REPLACE FUNCTION public.admin_set_hub_ranges(p_ranges jsonb)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_e     jsonb;
    v_a     uuid;
    v_b     uuid;
    v_r     int;
    v_tmp   uuid;
    v_count int := 0;
BEGIN
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;
    IF p_ranges IS NULL OR jsonb_typeof(p_ranges) <> 'array' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_payload');
    END IF;

    FOR v_e IN SELECT value FROM jsonb_array_elements(p_ranges) AS x(value)
    LOOP
        v_a := NULLIF(v_e->>'a', '')::uuid;
        v_b := NULLIF(v_e->>'b', '')::uuid;
        v_r := NULLIF(v_e->>'r', '')::int;

        -- New 1-10 bound; reject anything outside.
        CONTINUE WHEN v_a IS NULL OR v_b IS NULL OR v_a = v_b
                   OR v_r IS NULL OR v_r < 1 OR v_r > 10;

        IF v_a > v_b THEN v_tmp := v_a; v_a := v_b; v_b := v_tmp; END IF;

        INSERT INTO airline_city_ranges (city_a_id, city_b_id, distance)
        VALUES (v_a, v_b, v_r)
        ON CONFLICT (city_a_id, city_b_id) DO UPDATE SET distance = EXCLUDED.distance;

        v_count := v_count + 1;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'pairs_saved', v_count);
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_set_hub_ranges(jsonb) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
