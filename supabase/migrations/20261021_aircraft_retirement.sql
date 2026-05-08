-- ════════════════════════════════════════════════════════════════
-- Aircraft retirement RPC.
--
-- Player-facing companion to overhaul_aircraft. After enough overhaul
-- cycles the cap drops to a floor that makes a plane uneconomic; the
-- player needs a way to remove it from the fleet entirely. Without
-- retirement, dead aircraft pile up in corp_aircraft and consume
-- fleet slots forever.
--
-- Behavior:
--   * Auto-release from route — if the aircraft has route_id set,
--     decrement the route's class-count denorm so the UI summary
--     line and competitor-seat estimator stay accurate, then DELETE
--     the row (the FK is null'd implicitly by the row going away).
--   * The route is NOT auto-closed, even if it ends up with zero
--     aircraft. Player closes it explicitly when they're done.
--   * sync_corp_fleet_slots trigger (20261020) handles
--     factions.corp_fleet on the DELETE side automatically.
--   * No refund — retirement is free in cash terms. Sunk cost.
-- ════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION retire_aircraft(p_aircraft_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user UUID := auth.uid();
    v_ac   corp_aircraft%ROWTYPE;
    v_corp factions%ROWTYPE;
BEGIN
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    SELECT * INTO v_ac FROM corp_aircraft WHERE id = p_aircraft_id FOR UPDATE;
    IF v_ac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Aircraft not found');
    END IF;

    SELECT * INTO v_corp FROM factions WHERE id = v_ac.corp_id;
    IF v_corp.id <> v_user
       AND COALESCE(v_corp.linked_user_id, '00000000-0000-0000-0000-000000000000'::uuid) <> v_user THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not own this aircraft');
    END IF;

    -- Auto-release from assigned route. Decrement the per-class denorm
    -- so the UI's "3× Regional" summary and the competitor-seat
    -- estimator (used by the route-setup modal) stay correct. The
    -- route itself stays 'active' even if the count drops to zero —
    -- that's a player-visible "idle route" state they can close.
    IF v_ac.route_id IS NOT NULL THEN
        IF v_ac.aircraft_class = 'regional' THEN
            UPDATE airline_routes
               SET aircraft_regional = GREATEST(0, aircraft_regional - 1)
             WHERE id = v_ac.route_id;
        ELSIF v_ac.aircraft_class = 'narrowbody' THEN
            UPDATE airline_routes
               SET aircraft_narrowbody = GREATEST(0, aircraft_narrowbody - 1)
             WHERE id = v_ac.route_id;
        ELSIF v_ac.aircraft_class = 'widebody' THEN
            UPDATE airline_routes
               SET aircraft_widebody = GREATEST(0, aircraft_widebody - 1)
             WHERE id = v_ac.route_id;
        END IF;
    END IF;

    DELETE FROM corp_aircraft WHERE id = p_aircraft_id;

    RETURN jsonb_build_object(
        'success',           true,
        'aircraft_id',       p_aircraft_id,
        'released_route_id', v_ac.route_id
    );
END;
$$;

GRANT EXECUTE ON FUNCTION retire_aircraft(UUID) TO authenticated;

COMMENT ON FUNCTION retire_aircraft(UUID) IS
    'Player-facing aircraft retirement. Validates ownership, auto-releases from any assigned route (decrementing the route''s class-count denorm), and DELETEs the corp_aircraft row. The sync_corp_fleet_slots trigger handles factions.corp_fleet on DELETE. No cash refund — retirement is free.';

NOTIFY pgrst, 'reload schema';

COMMIT;
