-- ══════════════════════════════════════════════════════════════
-- Phase 5: Airline Route Setup — Domestic Only
--
-- Three artifacts:
--   1. airline_routes table — one row per (corp, lane). Lanes are
--      shared (multiple corps can fly the same pair); demand on a
--      lane is split via the per-corp price multiplier and the
--      sum of competitor seats. Canonical pair order
--      (origin_city_id < dest_city_id) keeps each undirected lane
--      addressable as a single edge.
--
--   2. corp_aircraft.route_id — nullable FK so a plane is either
--      idle (route_id NULL) or assigned to one route. ON DELETE
--      SET NULL so closing a route releases the planes.
--
--   3. set_up_route RPC — atomic: validates ownership of both
--      terminals, idle aircraft availability, sector/price/tier
--      bounds; INSERTs the route; UPDATEs the chosen aircraft to
--      point at it.
--
-- Plus a one-shot backfill that catches founding terminals (the
-- airline_terminals row claimed at corp creation) which never had
-- a corp_properties row, so they didn't show up on Expansion or
-- in the maintenance/valuation pipelines.
--
-- Idempotent: IF NOT EXISTS guards, CREATE OR REPLACE on the RPC.
-- ══════════════════════════════════════════════════════════════


-- ══════════════════════════════════════════════════════════════
-- 1. airline_routes
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.airline_routes (
    id                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    airline_faction_id   UUID         NOT NULL REFERENCES public.factions(id) ON DELETE CASCADE,
    origin_city_id       UUID         NOT NULL REFERENCES public.airline_cities(id),
    dest_city_id         UUID         NOT NULL REFERENCES public.airline_cities(id),
    ticket_price         INT          NOT NULL CHECK (ticket_price >= 0 AND ticket_price <= 500),
    maintenance_tier     TEXT         NOT NULL CHECK (maintenance_tier IN ('basic', 'standard', 'premium')),
    aircraft_regional    INT          NOT NULL DEFAULT 0 CHECK (aircraft_regional   >= 0),
    aircraft_narrowbody  INT          NOT NULL DEFAULT 0 CHECK (aircraft_narrowbody >= 0),
    aircraft_widebody    INT          NOT NULL DEFAULT 0 CHECK (aircraft_widebody   >= 0),
    route_type           TEXT         NOT NULL CHECK (route_type IN ('domestic', 'international')),
    status               TEXT         NOT NULL DEFAULT 'active'
                              CHECK (status IN ('active', 'suspended', 'closed')),
    opened_at_tick       INT          NOT NULL,
    closed_at_tick       INT,
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT now(),
    -- Canonical pair order so the same undirected lane is one edge.
    CONSTRAINT airline_routes_canonical_pair CHECK (origin_city_id < dest_city_id),
    -- One active route per (corp, lane). Closed/suspended rows linger
    -- for history, so the partial unique index keys on status.
    CONSTRAINT airline_routes_distinct_endpoints CHECK (origin_city_id <> dest_city_id)
);

CREATE INDEX IF NOT EXISTS idx_airline_routes_corp ON public.airline_routes (airline_faction_id);
CREATE INDEX IF NOT EXISTS idx_airline_routes_pair ON public.airline_routes (origin_city_id, dest_city_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_airline_routes_one_active_per_corp_lane
    ON public.airline_routes (airline_faction_id, origin_city_id, dest_city_id)
    WHERE status = 'active';

ALTER TABLE public.airline_routes ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
         WHERE schemaname = 'public'
           AND tablename  = 'airline_routes'
           AND policyname = 'airline_routes_read_all'
    ) THEN
        CREATE POLICY "airline_routes_read_all" ON public.airline_routes
            FOR SELECT TO authenticated USING (true);
    END IF;
END $$;

COMMENT ON TABLE public.airline_routes IS
    'Phase 5: per-corp route on a city pair. Lanes are shared — multiple corps can fly the same (origin, dest) pair. Demand allocation runs in advance-corp-tick (Phase 6+); this table just records the contract.';


-- ══════════════════════════════════════════════════════════════
-- 2. corp_aircraft.route_id
-- ══════════════════════════════════════════════════════════════
-- Nullable FK so an aircraft is either idle (NULL) or assigned to
-- one active route. ON DELETE SET NULL releases the planes if a
-- route is hard-deleted; the normal path is status='closed' which
-- doesn't fire the cascade.
ALTER TABLE public.corp_aircraft
    ADD COLUMN IF NOT EXISTS route_id UUID
        REFERENCES public.airline_routes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_corp_aircraft_route
    ON public.corp_aircraft (route_id) WHERE route_id IS NOT NULL;


-- ══════════════════════════════════════════════════════════════
-- 3. set_up_route RPC
-- ══════════════════════════════════════════════════════════════
-- Atomic route creation:
--   * Auth + Airline-sector check.
--   * Verifies caller owns terminals at BOTH endpoints.
--   * Domestic-only gate (Phase 5 scope) — both cities must share
--     a nation_id.
--   * Validates aircraft counts against the corp's idle pool.
--   * INSERTs the airline_routes row.
--   * UPDATEs the chosen aircraft to point at the new route.
--   * Sets opened_at_tick.
--
-- Concurrency: SELECT ... FOR UPDATE on the corp's idle aircraft
-- per class. Two concurrent set-ups can't both grab the same
-- idle aircraft.
CREATE OR REPLACE FUNCTION set_up_route(
    p_corp_id              UUID,
    p_origin_city_id       UUID,
    p_dest_city_id         UUID,
    p_ticket_price         INT,
    p_maintenance_tier     TEXT,
    p_aircraft_regional    INT,
    p_aircraft_narrowbody  INT,
    p_aircraft_widebody    INT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user        UUID := auth.uid();
    v_corp        factions%ROWTYPE;
    v_origin      airline_cities%ROWTYPE;
    v_dest        airline_cities%ROWTYPE;
    v_canon_a     UUID;
    v_canon_b     UUID;
    v_tick        INT;
    v_route_id    UUID;
    v_route_type  TEXT;
    v_idle_ids    UUID[];
    v_assigned    INT;
    v_iter        RECORD;
BEGIN
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    -- Lock the corp row to serialize concurrent set-ups (so two
    -- routes can't both claim the same idle aircraft).
    SELECT * INTO v_corp FROM factions WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Corporation not found');
    END IF;
    IF v_corp.id <> v_user AND v_corp.linked_user_id IS DISTINCT FROM v_user THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not own this corporation');
    END IF;
    IF v_corp.faction_type <> 'corporation' OR v_corp.corp_sector <> 'Airline' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Only Airline corporations can set up routes');
    END IF;

    -- Endpoint validation.
    IF p_origin_city_id IS NULL OR p_dest_city_id IS NULL OR p_origin_city_id = p_dest_city_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Origin and destination must be two different cities');
    END IF;

    SELECT * INTO v_origin FROM airline_cities WHERE id = p_origin_city_id;
    SELECT * INTO v_dest   FROM airline_cities WHERE id = p_dest_city_id;
    IF v_origin.id IS NULL OR v_dest.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'City lookup failed');
    END IF;

    -- Phase 5 scope gate: domestic only.
    IF v_origin.nation_id <> v_dest.nation_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'International routes are not yet available (Phase 5: domestic only)');
    END IF;
    v_route_type := 'domestic';

    -- Caller must own a terminal at BOTH endpoints.
    IF NOT EXISTS (
        SELECT 1 FROM airline_terminals t
         WHERE t.city_id = p_origin_city_id
           AND t.owner_airline_id = p_corp_id
        LIMIT 1
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', format('You do not own a terminal at %s', v_origin.name));
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM airline_terminals t
         WHERE t.city_id = p_dest_city_id
           AND t.owner_airline_id = p_corp_id
        LIMIT 1
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', format('You do not own a terminal at %s', v_dest.name));
    END IF;

    -- Price + tier bounds (CHECK constraints catch these too, but
    -- the early return gives a clean error message).
    IF p_ticket_price < 0 OR p_ticket_price > 500 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Ticket price must be between $0 and $500');
    END IF;
    IF p_maintenance_tier NOT IN ('basic', 'standard', 'premium') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Maintenance tier must be basic, standard, or premium');
    END IF;

    -- At least one aircraft.
    IF COALESCE(p_aircraft_regional, 0) + COALESCE(p_aircraft_narrowbody, 0) + COALESCE(p_aircraft_widebody, 0) <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Assign at least one aircraft to the route');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard';
    v_tick := COALESCE(v_tick, 0);

    -- Canonicalize the pair so the (origin, dest) ordering matches
    -- the canonical CHECK on airline_routes.
    v_canon_a := LEAST(p_origin_city_id, p_dest_city_id);
    v_canon_b := GREATEST(p_origin_city_id, p_dest_city_id);

    -- Reject duplicate active route on the same lane.
    IF EXISTS (
        SELECT 1 FROM airline_routes
         WHERE airline_faction_id = p_corp_id
           AND origin_city_id = v_canon_a
           AND dest_city_id   = v_canon_b
           AND status = 'active'
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'You already operate this route');
    END IF;

    -- Insert the route.
    INSERT INTO airline_routes (
        airline_faction_id, origin_city_id, dest_city_id,
        ticket_price, maintenance_tier,
        aircraft_regional, aircraft_narrowbody, aircraft_widebody,
        route_type, status, opened_at_tick
    ) VALUES (
        p_corp_id, v_canon_a, v_canon_b,
        p_ticket_price, p_maintenance_tier,
        COALESCE(p_aircraft_regional, 0),
        COALESCE(p_aircraft_narrowbody, 0),
        COALESCE(p_aircraft_widebody, 0),
        v_route_type, 'active', v_tick
    ) RETURNING id INTO v_route_id;

    -- Assign idle aircraft. Loop per class so we get a clean
    -- per-class sufficient-fleet error if the corp doesn't have
    -- enough idle planes.
    FOR v_iter IN
        SELECT class, need FROM (VALUES
            ('regional'::TEXT,   COALESCE(p_aircraft_regional,   0)),
            ('narrowbody'::TEXT, COALESCE(p_aircraft_narrowbody, 0)),
            ('widebody'::TEXT,   COALESCE(p_aircraft_widebody,   0))
        ) AS t(class, need)
    LOOP
        IF v_iter.need <= 0 THEN CONTINUE; END IF;

        -- Pick N idle aircraft of this class. FOR UPDATE locks them
        -- so a concurrent set-up can't grab the same rows.
        SELECT array_agg(id) INTO v_idle_ids FROM (
            SELECT id FROM corp_aircraft
             WHERE corp_id = p_corp_id
               AND aircraft_class = v_iter.class
               AND route_id IS NULL
             ORDER BY created_at ASC
             LIMIT v_iter.need
             FOR UPDATE
        ) AS picks;

        v_assigned := COALESCE(array_length(v_idle_ids, 1), 0);
        IF v_assigned < v_iter.need THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', format('Need %s idle %s aircraft, have %s', v_iter.need, v_iter.class, v_assigned)
            );
        END IF;

        UPDATE corp_aircraft
           SET route_id = v_route_id
         WHERE id = ANY(v_idle_ids);
    END LOOP;

    RETURN jsonb_build_object(
        'success',  true,
        'route_id', v_route_id,
        'route_type', v_route_type,
        'opened_at_tick', v_tick
    );
END;
$$;

GRANT EXECUTE ON FUNCTION set_up_route(UUID, UUID, UUID, INT, TEXT, INT, INT, INT) TO authenticated;

COMMENT ON FUNCTION set_up_route(UUID, UUID, UUID, INT, TEXT, INT, INT, INT) IS
    'Phase 5: airline corp opens a domestic route between two owned-terminal cities. Validates auth, sector, terminal ownership, idle-aircraft availability; INSERTs airline_routes row; UPDATEs corp_aircraft.route_id for the assigned planes. Atomic via FOR UPDATE on the corp + idle aircraft.';


-- ══════════════════════════════════════════════════════════════
-- 4. Founding-terminal corp_properties backfill
-- ══════════════════════════════════════════════════════════════
-- Pre-this-migration, the corp founding flow set
-- airline_terminals.owner_airline_id but never inserted a
-- corp_properties row, so the founding terminal didn't show up on
-- Expansion or in the valuation/maintenance pipelines.
--
-- One-shot pass: for every owned airline_terminal that doesn't
-- have a matching corp_properties row, insert one. purchase_price
-- = $0, monthly_maintenance = $0 — founding terminals are
-- freebies. The maintenance loop's `if (totalMaintenance > 0)`
-- guard means $0 entries are no-ops at corp tick.
--
-- Idempotent via the NOT EXISTS check on the matching property
-- row keyed on (faction_id, city, terminal_number).
INSERT INTO corp_properties (
    faction_id, nation_id, name, type, role, style,
    capacity, purchase_price, monthly_maintenance, condition,
    city, purchased_at_tick, is_active
)
SELECT
    t.owner_airline_id,
    c.nation_id,
    c.name || ' Terminal #' || t.terminal_number,
    'airline_terminal',
    'airline_terminal',
    'Hub',
    0,
    0,                                            -- founding freebie
    0,                                            -- founding freebie
    100,
    c.name,
    COALESCE(t.acquired_at_tick, 0),
    true
  FROM airline_terminals t
  JOIN airline_cities c ON c.id = t.city_id
 WHERE t.owner_airline_id IS NOT NULL
   AND NOT EXISTS (
        SELECT 1 FROM corp_properties cp
         WHERE cp.faction_id = t.owner_airline_id
           AND cp.role       = 'airline_terminal'
           AND cp.city       = c.name
           AND cp.name       = c.name || ' Terminal #' || t.terminal_number
   );


-- ══════════════════════════════════════════════════════════════
-- 5. Sanity check
-- ══════════════════════════════════════════════════════════════
SELECT
    'airline_routes'         AS table_name, COUNT(*) AS rows FROM airline_routes
UNION ALL SELECT
    'corp_aircraft.route_id_set', COUNT(*) FROM corp_aircraft WHERE route_id IS NOT NULL
UNION ALL SELECT
    'corp_properties.airline_terminal', COUNT(*) FROM corp_properties WHERE role = 'airline_terminal' AND is_active;

NOTIFY pgrst, 'reload schema';
