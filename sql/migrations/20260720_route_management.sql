-- 20260720_route_management.sql
--
-- Phase 5 follow-up: route management UI.
--
-- Adds the data + RPCs the expandable-route-card needs:
--   1. corp_aircraft.tail_number — optional player-assigned flair
--   2. trigger that keeps factions.corp_routes derived from
--      airline_routes (no more drift between the hero stat and reality)
--   3. close_airline_route(route_id)        — cancel a route, release fleet
--   4. change_route_ticket_price(route, $)  — repricing in flight
--   5. set_aircraft_tail_number(ac_id, txt) — rename a plane
--
-- All RPCs are SECURITY DEFINER + ownership-gated. The trigger is the
-- single writer of corp_routes — set_up_route / close_airline_route /
-- any future direct mutation all go through airline_routes and the
-- trigger reconciles the count automatically.

BEGIN;

-- ── 1. Tail number column ──
ALTER TABLE public.corp_aircraft
  ADD COLUMN IF NOT EXISTS tail_number TEXT;

COMMENT ON COLUMN public.corp_aircraft.tail_number IS
  'Optional player-assigned identifier (e.g. "AVE-001"). Length-capped at 12 by set_aircraft_tail_number; otherwise free-form.';


-- ── 2. corp_routes-count trigger (SSoT) ──
-- AFTER INSERT/UPDATE OF status/DELETE on airline_routes recomputes
-- factions.corp_routes for the affected corp. Means set_up_route and
-- close_airline_route don't need to know about the counter; they just
-- mutate airline_routes and the trigger keeps the hero stat honest.
CREATE OR REPLACE FUNCTION refresh_corp_routes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_corp_id UUID;
BEGIN
    v_corp_id := COALESCE(NEW.airline_faction_id, OLD.airline_faction_id);
    IF v_corp_id IS NOT NULL THEN
        UPDATE public.factions
           SET corp_routes = (
                SELECT COUNT(*)
                  FROM public.airline_routes
                 WHERE airline_faction_id = v_corp_id
                   AND status = 'active'
           )
         WHERE id = v_corp_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_airline_routes_count ON public.airline_routes;
CREATE TRIGGER trg_airline_routes_count
    AFTER INSERT OR UPDATE OF status OR DELETE
    ON public.airline_routes
    FOR EACH ROW
    EXECUTE FUNCTION refresh_corp_routes_count();

-- Backfill: existing corp_routes values were never bumped by the
-- original set_up_route, so most are 0. Recompute from reality.
UPDATE public.factions f
   SET corp_routes = COALESCE((
        SELECT COUNT(*)
          FROM public.airline_routes
         WHERE airline_faction_id = f.id
           AND status = 'active'
   ), 0)
 WHERE faction_type = 'corporation'
   AND corp_sector  = 'Airline';


-- ── 3. close_airline_route ──
-- Cancel an active route. Sets status='closed', stamps closed_at_tick,
-- releases every aircraft on the route back to idle. No refund — a
-- canceled route forfeits any future revenue and any maintenance
-- already prepaid (currently none in Phase 5; Phase 6 maint-lump
-- handling will need to decide whether to prorate). corp_routes
-- recomputes via the trigger.
CREATE OR REPLACE FUNCTION close_airline_route(p_route_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user  UUID := auth.uid();
    v_route airline_routes%ROWTYPE;
    v_corp  factions%ROWTYPE;
    v_tick  INTEGER;
BEGIN
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    SELECT * INTO v_route FROM airline_routes
     WHERE id = p_route_id
     FOR UPDATE;
    IF v_route.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Route not found');
    END IF;
    IF v_route.status <> 'active' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Route is not active');
    END IF;

    SELECT * INTO v_corp FROM factions WHERE id = v_route.airline_faction_id;
    IF v_corp.id <> v_user
       AND COALESCE(v_corp.linked_user_id, '00000000-0000-0000-0000-000000000000'::uuid) <> v_user THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not own this airline');
    END IF;

    SELECT COALESCE(current_tick, 0) INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;

    UPDATE airline_routes
       SET status         = 'closed',
           closed_at_tick = v_tick
     WHERE id = p_route_id;

    -- Release aircraft. ON DELETE SET NULL handles route-row-gone cases;
    -- this clears them on a pure status flip too.
    UPDATE corp_aircraft
       SET route_id = NULL
     WHERE route_id = p_route_id;

    RETURN jsonb_build_object('success', true, 'route_id', p_route_id);
END;
$$;

GRANT EXECUTE ON FUNCTION close_airline_route(UUID) TO authenticated;


-- ── 4. change_route_ticket_price ──
-- Reprice an active route. Phase 6 tick processor reads ticket_price
-- live, so the new price is in effect from the next pax-flow tick.
CREATE OR REPLACE FUNCTION change_route_ticket_price(p_route_id UUID, p_new_price INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user  UUID := auth.uid();
    v_route airline_routes%ROWTYPE;
    v_corp  factions%ROWTYPE;
BEGIN
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;
    -- Match the airline_routes CHECK constraint from 20260717.
    IF p_new_price < 0 OR p_new_price > 500 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Ticket price must be between $0 and $500');
    END IF;

    SELECT * INTO v_route FROM airline_routes
     WHERE id = p_route_id
     FOR UPDATE;
    IF v_route.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Route not found');
    END IF;
    IF v_route.status <> 'active' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Route is not active');
    END IF;

    SELECT * INTO v_corp FROM factions WHERE id = v_route.airline_faction_id;
    IF v_corp.id <> v_user
       AND COALESCE(v_corp.linked_user_id, '00000000-0000-0000-0000-000000000000'::uuid) <> v_user THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not own this airline');
    END IF;

    UPDATE airline_routes SET ticket_price = p_new_price WHERE id = p_route_id;

    RETURN jsonb_build_object('success', true, 'route_id', p_route_id, 'ticket_price', p_new_price);
END;
$$;

GRANT EXECUTE ON FUNCTION change_route_ticket_price(UUID, INTEGER) TO authenticated;


-- ── 5. set_aircraft_tail_number ──
-- Player-assigned flair. Trims + caps at 12 chars; empty string clears.
CREATE OR REPLACE FUNCTION set_aircraft_tail_number(p_aircraft_id UUID, p_tail_number TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user  UUID := auth.uid();
    v_ac    corp_aircraft%ROWTYPE;
    v_corp  factions%ROWTYPE;
    v_clean TEXT;
BEGIN
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    SELECT * INTO v_ac FROM corp_aircraft WHERE id = p_aircraft_id;
    IF v_ac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Aircraft not found');
    END IF;

    SELECT * INTO v_corp FROM factions WHERE id = v_ac.corp_id;
    IF v_corp.id <> v_user
       AND COALESCE(v_corp.linked_user_id, '00000000-0000-0000-0000-000000000000'::uuid) <> v_user THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not own this aircraft');
    END IF;

    v_clean := NULLIF(TRIM(SUBSTRING(COALESCE(p_tail_number, ''), 1, 12)), '');

    UPDATE corp_aircraft SET tail_number = v_clean WHERE id = p_aircraft_id;

    RETURN jsonb_build_object('success', true, 'aircraft_id', p_aircraft_id, 'tail_number', v_clean);
END;
$$;

GRANT EXECUTE ON FUNCTION set_aircraft_tail_number(UUID, TEXT) TO authenticated;


COMMIT;

NOTIFY pgrst, 'reload schema';
