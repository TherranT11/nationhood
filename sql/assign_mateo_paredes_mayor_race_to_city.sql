-- ════════════════════════════════════════════════════════════════════
-- ADMIN / DATA FIX: assign Mateo Paredes' in-flight mayor race to a city
-- ════════════════════════════════════════════════════════════════════
-- The Pressing Issues card reads "Mayor · Mayor of a city" because the
-- politician_active_election row was filed under the pre-20270712
-- code path — district stored as the literal "Mayor of a city," no
-- city_id set, no per-city stamp on win. We retarget the in-flight
-- race to a specific (non-capital) Sierramar city so:
--
--   • The home page renders "Mayor · {city_name}" instead of the
--     generic placeholder.
--   • On resolve, the cities row for the target city gets stamped
--     with the player's name + party (per the 20270712 / 20270719
--     resolver branch — it keys off v_race.city_id).
--
-- City selection — swap v_target_city below to retarget:
--   • 'Miramar del Sur' (major_city_1) — agricultural heartland,
--     fits MAA's agrarian populism. (Default.)
--   • 'Clara del Vega'  (major_city_2) — southern coastal hub.
--   • 'Alta Sierra'     (major_city_3) — mountain outpost.
--
-- Capital ('Puerto Rey') is intentionally excluded — the resolver's
-- mayor branch validates v_city.city_type != 'capital' and a Mayor
-- of Capital race goes through a separate target_office. The query
-- below also rejects capital matches defensively.
--
-- The opp_blurb is also rewritten so the modal text references the
-- right city (was: "Independent challenger for the mayor's office").
-- The career-event row for 'stood_for_election' is intentionally
-- left alone — historical record, would only matter if a future
-- surface re-read it for the city; the resolver writes a fresh
-- won_election / lost_election row at resolve time with the correct
-- city_id anyway.
--
-- Idempotent against re-runs (UPDATE is no-op if the row already
-- points at the target city). Transactional.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

DO $$
DECLARE
    v_target_city constant text := 'Miramar del Sur';
    v_nation_id   uuid;
    v_pol_id      uuid;
    v_city        cities%ROWTYPE;
    v_updated     int;
BEGIN
    SELECT id INTO v_nation_id FROM nations WHERE name = 'Sierramar' LIMIT 1;
    IF v_nation_id IS NULL THEN
        RAISE EXCEPTION 'Sierramar nation not found.';
    END IF;

    SELECT id INTO v_pol_id
      FROM factions
     WHERE nation_id    = v_nation_id
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
       AND leader_first_name ILIKE 'Mateo'
       AND leader_last_name  ILIKE 'Paredes'
     LIMIT 1;
    IF v_pol_id IS NULL THEN
        RAISE EXCEPTION 'Mateo Paredes politician faction not found in Sierramar.';
    END IF;

    SELECT * INTO v_city
      FROM cities
     WHERE nation_id  = v_nation_id
       AND city_name  = v_target_city
       AND city_type <> 'capital'
     LIMIT 1;
    IF v_city.id IS NULL THEN
        RAISE EXCEPTION '"%" not found as a non-capital city in Sierramar. Check the v_target_city constant.', v_target_city;
    END IF;

    UPDATE politician_active_election
       SET city_id   = v_city.id,
           district  = v_city.city_name,
           opp_blurb = 'Independent challenger for the ' || v_city.city_name || ' mayoralty'
     WHERE politician_id = v_pol_id
       AND race_tier     = 'mayor';
    GET DIAGNOSTICS v_updated = ROW_COUNT;

    IF v_updated = 0 THEN
        RAISE EXCEPTION 'No in-flight mayor race found for Mateo Paredes.';
    END IF;

    RAISE NOTICE 'Assigned Mateo Paredes'' mayor race to % (city_id=%). Updated % row.',
        v_city.city_name, v_city.id, v_updated;
END $$;

COMMIT;
