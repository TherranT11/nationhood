-- ════════════════════════════════════════════════════════════════════
-- ADMIN / TESTING: withdraw Mateo Paredes from the CCP race + clear
-- the stale action cooldown the accidental click stamped
-- ════════════════════════════════════════════════════════════════════
-- User accidentally hit Run for City Council President on
-- politician-career.html. Two things to undo:
--
--   1. The in-flight CCP race row in politician_active_election —
--      the follow-up migration 20270740 adds a city picker so the
--      user can re-register with intent; this SQL clears the
--      accidental row.
--
--   2. The stale next_member_action_tick = current_tick + 1 the
--      accidental click left behind. The deployed version of
--      politician_register_for_office still has the pre-20270734
--      cooldown burn (migration ladder hasn't caught up on this
--      shard yet), so the Mayor card now reads "Ready in 1 tick"
--      on Collect Taxes + Campaign even though no actual action
--      was taken. Reset by clamping next_member_action_tick to the
--      current tick so the cooldown gate (next > current) opens
--      immediately.
--
-- Safe to run:
--   • Both writes scoped to Mateo's faction row via SELECT INTO
--     STRICT lookup with explicit exception handlers on missing /
--     ambiguous matches.
--   • Race row DELETE filters on race_tier so any other in-flight
--     race (unlikely) is left alone.
--   • next_member_action_tick clamp via LEAST() so if Mateo's
--     value is somehow already in the past we don't accidentally
--     bump it forward.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

DO $$
DECLARE
    v_pol_id    uuid;
    v_tick      int;
    v_deleted   int;
    v_old_cd    int;
BEGIN
    SELECT id, next_member_action_tick
      INTO STRICT v_pol_id, v_old_cd
      FROM public.factions
     WHERE faction_type = 'politician'
       AND abandoned_at IS NULL
       AND leader_first_name ILIKE 'Mateo'
       AND leader_last_name  ILIKE 'Paredes';

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- 1. Clear the accidental CCP race row.
    DELETE FROM public.politician_active_election
     WHERE politician_id = v_pol_id
       AND race_tier     = 'city_council_president';
    GET DIAGNOSTICS v_deleted = ROW_COUNT;

    IF v_deleted = 0 THEN
        RAISE EXCEPTION 'No in-flight CCP race found for Mateo Paredes.';
    END IF;

    -- 2. Clamp next_member_action_tick to current so the per-tick
    -- gate opens immediately. LEAST() so we never move the cooldown
    -- FORWARD if it's already in the past somehow.
    UPDATE public.factions
       SET next_member_action_tick = LEAST(COALESCE(next_member_action_tick, v_tick), v_tick)
     WHERE id = v_pol_id;

    RAISE NOTICE 'Withdrew Mateo Paredes from the CCP race (% row deleted). Reset next_member_action_tick from % to %.',
        v_deleted, v_old_cd, v_tick;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE EXCEPTION 'Mateo Paredes politician faction not found.';
    WHEN TOO_MANY_ROWS THEN
        RAISE EXCEPTION 'Multiple politician factions match "Mateo Paredes." Disambiguate before re-running.';
END $$;

COMMIT;
