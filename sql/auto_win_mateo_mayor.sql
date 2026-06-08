-- ════════════════════════════════════════════════════════════════════
-- ADMIN / TESTING: auto-win Mateo Paredes' mayor race (Miramar del Sur)
-- ════════════════════════════════════════════════════════════════════
-- The race resolves naturally on the next tick advance (resolve_tick=162,
-- current_tick=162; condition is `resolve_tick < v_tick`, fires at 163).
-- User wants to move on to the next test now, so we manually mirror
-- the resolver's mayor-WIN branch from 20270724 against Mateo's row.
--
-- Why not call politician_resolve_due_elections() from here? The RPC's
-- politician lookup is scoped to `(id = v_uid OR linked_user_id = v_uid)`
-- — it only resolves the CALLER's race. Admin SQL has no auth.uid(), so
-- the resolver returns early. Manually replaying the writes is the
-- only way to short-circuit without modifying the resolver.
--
-- Mirrors the WIN-branch writes exactly:
--   1. factions: politician_office='mayor' + politician_office_won_at
--      _tick + politician_skill +1
--   2. factions (party): popularity_cap_pct +3, popularity_pct +2
--      (clamped to new cap), party_funds +200000
--   3. cities (Miramar del Sur): mayor_first_name / mayor_last_name /
--      mayor_age / mayor_party_id / mayor_term_end_tick = tick+48 /
--      mayor_archetype = NULL
--   4. politician_career_events: 'won_election' with metadata
--   5. DELETE politician_active_election row
--
-- Transactional + STRICT lookups + NOTICE for sanity check. Not
-- idempotent — re-running would write the same office stamp + duplicate
-- the +1 Skill / +200K funds / popularity bonus. Run once.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

DO $$
DECLARE
    v_pol_id        uuid;
    v_first         text;
    v_last          text;
    v_age           int;
    v_party_id      uuid;
    v_tick          int;
    v_race          politician_active_election%ROWTYPE;
    v_city_id       uuid;
    v_new_office    text := 'mayor';
    v_new_skill     numeric;
    v_party_pop     numeric;
    v_party_pop_cap numeric;
    v_party_funds   numeric;
BEGIN
    SELECT id, leader_first_name, leader_last_name, leader_age, politician_party_id
      INTO STRICT v_pol_id, v_first, v_last, v_age, v_party_id
      FROM public.factions
     WHERE faction_type = 'politician'
       AND abandoned_at IS NULL
       AND leader_first_name ILIKE 'Mateo'
       AND leader_last_name  ILIKE 'Paredes';

    SELECT * INTO v_race FROM public.politician_active_election
     WHERE politician_id = v_pol_id AND race_tier = 'mayor';
    IF v_race.politician_id IS NULL THEN
        RAISE EXCEPTION 'No in-flight mayor race for Mateo Paredes.';
    END IF;
    v_city_id := v_race.city_id;
    IF v_city_id IS NULL THEN
        RAISE EXCEPTION 'Mayor race has no city_id — run assign_mateo_paredes_mayor_race_to_city.sql first.';
    END IF;

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- 1. Politician faction: office stamp + Experience reward.
    UPDATE public.factions
       SET politician_office             = v_new_office,
           politician_office_won_at_tick = v_tick,
           politician_skill              = COALESCE(politician_skill, 1) + 1
     WHERE id = v_pol_id
    RETURNING politician_skill INTO v_new_skill;

    -- 2. Party rewards: +3 cap, +2 popularity (clamped), +$200K funds.
    --    Inline cap expression appears twice in the SET so the LEAST
    --    clamp uses the BUMPED cap value, matching 20270724.
    IF v_party_id IS NOT NULL THEN
        UPDATE public.factions
           SET popularity_cap_pct = COALESCE(popularity_cap_pct, 0) + 3,
               popularity_pct     = LEAST(
                   COALESCE(popularity_cap_pct, 0) + 3,
                   COALESCE(popularity_pct, 0) + 2
               ),
               party_funds        = COALESCE(party_funds, 0) + 200000
         WHERE id = v_party_id
           AND faction_type = 'movement_party'
           AND abandoned_at IS NULL
        RETURNING popularity_pct, popularity_cap_pct, party_funds
            INTO v_party_pop, v_party_pop_cap, v_party_funds;
    END IF;

    -- 3. Cities row stamp (Miramar del Sur).
    UPDATE public.cities
       SET mayor_first_name    = v_first,
           mayor_last_name     = v_last,
           mayor_age           = COALESCE(v_age, mayor_age),
           mayor_archetype     = NULL,
           mayor_party_id      = v_party_id,
           mayor_term_end_tick = v_tick + 48
     WHERE id = v_city_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Failed to stamp cities row for city_id=%.', v_city_id;
    END IF;

    -- 4. Career event.
    INSERT INTO public.politician_career_events (
        faction_id, event_tick, event_type, target_name, metadata
    ) VALUES (
        v_pol_id, v_tick, 'won_election', v_race.district,
        jsonb_build_object(
            'race_tier',      v_race.race_tier,
            'your_stat',      v_race.your_stat,
            'opp_stat',       v_race.opp_stat,
            'opponent',       v_race.opp_first || ' ' || v_race.opp_last,
            'polling_you',    v_race.polling_you_pct,
            'polling_opp',    v_race.polling_opp_pct,
            'polling_und',    v_race.polling_undecided_pct,
            'city_id',        v_city_id,
            'forced',         true,
            'admin_override', '20270735_auto_win_mateo_mayor.sql'
        )
    );

    -- 5. Clear the in-flight race.
    DELETE FROM public.politician_active_election WHERE politician_id = v_pol_id;

    RAISE NOTICE 'Auto-win complete for Mateo Paredes — mayor of city_id=% at tick %.', v_city_id, v_tick;
    RAISE NOTICE '  Politician: office=mayor, won_at_tick=%, new Experience=%.', v_tick, v_new_skill;
    IF v_party_id IS NOT NULL THEN
        RAISE NOTICE '  Party rewards: popularity=%, cap=%, funds=%.', v_party_pop, v_party_pop_cap, v_party_funds;
    END IF;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE EXCEPTION 'Mateo Paredes politician faction not found.';
    WHEN TOO_MANY_ROWS THEN
        RAISE EXCEPTION 'Multiple politician factions match "Mateo Paredes." Disambiguate before re-running.';
END $$;

COMMIT;
