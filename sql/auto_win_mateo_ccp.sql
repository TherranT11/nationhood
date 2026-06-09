-- ════════════════════════════════════════════════════════════════════
-- ADMIN / TESTING: auto-win Mateo Paredes' City Council Presidency
-- race (Miramar del Sur)
-- ════════════════════════════════════════════════════════════════════
-- User wants to short-circuit the natural tick-advance resolution
-- (resolve_tick=165, current_tick=164) and stamp Mateo as the new
-- CCP of Miramar del Sur now. Mirrors the resolver's CCP-WIN branch
-- from 20270724/20270722 byte-for-byte against Mateo's row.
--
-- Why not call politician_resolve_due_elections() from here? The
-- RPC's politician lookup is scoped to `(id = v_uid OR linked_user
-- _id = v_uid)` — only the calling user's race. Admin SQL has no
-- auth.uid(), so the resolver returns early without touching the
-- row. Manually replaying the WIN-branch writes is the only way
-- to short-circuit from SQL without modifying the resolver.
--
-- Mirrors the resolver writes exactly:
--   1. factions: politician_office='city_council_president',
--      politician_office_won_at_tick = current_tick,
--      politician_skill +1 (per-tier Skill reward),
--      politician_influence +3 (CCP stake_win).
--   2. cities (Miramar del Sur) council jsonb seat 0 (president):
--      jsonb_set replaces the seat with Mateo's holder info
--      (holder_faction_id, first_name, last_name, age, party_id,
--      party_abbr, party_name, archetype=NULL since PC seat,
--      term_end_tick = tick + 36).
--   3. politician_career_events: 'won_election' with the resolver's
--      standard metadata + 'forced' + 'admin_override' tags so the
--      row is auditable as a manual override.
--   4. DELETE the politician_active_election row.
--
-- KNOWN SIDE EFFECT — Mateo is currently the MAYOR of Miramar del
-- Sur (politician_office='mayor', cities.mayor_first_name='Mateo').
-- Awarding CCP flips his politician_office to 'city_council
-- _president' BUT leaves the cities.mayor_* stamp pointing at him.
-- The Mayor card on politician-home disappears (it keys off the
-- politician_office column), but the cities row still attributes
-- the mayoralty to him. If you want a clean slate, run the
-- standalone NPC-evict block at the bottom of this file
-- (commented out by default) — same logic the resolver uses for
-- mayor-LOSS incumbency eviction.
--
-- Safety:
--   • SELECT INTO STRICT on the politician lookup raises clean
--     exceptions on missing / ambiguous matches.
--   • Explicit guards for "no in-flight race" and "race has no
--     city_id."
--   • Transactional. NOT idempotent — re-running double-stamps
--     office_won_at_tick and double-awards +1 Skill / +3 Influence.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

DO $$
DECLARE
    v_pol_id          uuid;
    v_first           text;
    v_last            text;
    v_age             int;
    v_party_id        uuid;
    v_tick            int;
    v_race            politician_active_election%ROWTYPE;
    v_city_id         uuid;
    v_party_abbr      text;
    v_party_name      text;
    v_seat_kind       text;
    v_new_seat        jsonb;
    v_council         jsonb;
    v_new_skill       numeric;
    v_new_influence   numeric;
BEGIN
    SELECT id, leader_first_name, leader_last_name, leader_age, politician_party_id
      INTO STRICT v_pol_id, v_first, v_last, v_age, v_party_id
      FROM public.factions
     WHERE faction_type = 'politician'
       AND abandoned_at IS NULL
       AND leader_first_name ILIKE 'Mateo'
       AND leader_last_name  ILIKE 'Paredes';

    SELECT * INTO v_race FROM public.politician_active_election
     WHERE politician_id = v_pol_id AND race_tier = 'city_council_president';
    IF v_race.politician_id IS NULL THEN
        RAISE EXCEPTION 'No in-flight CCP race for Mateo Paredes.';
    END IF;
    v_city_id := v_race.city_id;
    IF v_city_id IS NULL THEN
        RAISE EXCEPTION 'CCP race has no city_id — re-file with a city pick (20270740).';
    END IF;

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- 1. Politician faction: office stamp + Skill + Influence rewards.
    UPDATE public.factions
       SET politician_office             = 'city_council_president',
           politician_office_won_at_tick = v_tick,
           politician_skill              = COALESCE(politician_skill, 1) + 1,
           politician_influence          = COALESCE(politician_influence, 0) + 3
     WHERE id = v_pol_id
    RETURNING politician_skill, politician_influence
        INTO v_new_skill, v_new_influence;

    -- 2. Cities council seat 0 (president) — jsonb_set replace.
    SELECT abbreviation, faction_name INTO v_party_abbr, v_party_name
      FROM public.factions
     WHERE id = v_party_id
     LIMIT 1;

    SELECT council INTO v_council FROM public.cities WHERE id = v_city_id;
    IF v_council IS NULL THEN
        RAISE EXCEPTION 'Cities council jsonb is NULL for city_id=%.', v_city_id;
    END IF;
    v_seat_kind := v_council->0->>'seat';   -- always 'president' but read it to match the resolver

    v_new_seat := jsonb_build_object(
        'seat',              v_seat_kind,
        'holder_faction_id', v_pol_id,
        'first_name',        v_first,
        'last_name',         v_last,
        'age',               v_age,
        'party_id',          v_party_id,
        'party_abbr',        v_party_abbr,
        'party_name',        v_party_name,
        'archetype',         NULL,
        'term_end_tick',     v_tick + 36
    );

    UPDATE public.cities
       SET council = jsonb_set(council, ARRAY['0'], v_new_seat)
     WHERE id = v_city_id;

    -- 3. Career event.
    INSERT INTO public.politician_career_events (
        faction_id, event_tick, event_type, target_name, metadata
    ) VALUES (
        v_pol_id, v_tick, 'won_election', v_race.district,
        jsonb_build_object(
            'race_tier',       v_race.race_tier,
            'your_stat',       v_race.your_stat,
            'opp_stat',        v_race.opp_stat,
            'opponent',        v_race.opp_first || ' ' || v_race.opp_last,
            'polling_you',     v_race.polling_you_pct,
            'polling_opp',     v_race.polling_opp_pct,
            'polling_und',     v_race.polling_undecided_pct,
            'city_id',         v_city_id,
            'seat',            v_seat_kind,
            'term_end_tick',   v_tick + 36,
            'forced',          true,
            'admin_override',  'auto_win_mateo_ccp.sql'
        )
    );

    -- 4. Clear the in-flight race.
    DELETE FROM public.politician_active_election WHERE politician_id = v_pol_id;

    RAISE NOTICE 'Auto-win complete: Mateo Paredes is now CCP of city_id=% at tick %.', v_city_id, v_tick;
    RAISE NOTICE '  New Skill=%, New Influence=%.', v_new_skill, v_new_influence;
    RAISE NOTICE '  Council seat 0 (% term ends at tick %).', v_seat_kind, v_tick + 36;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE EXCEPTION 'Mateo Paredes politician faction not found.';
    WHEN TOO_MANY_ROWS THEN
        RAISE EXCEPTION 'Multiple politician factions match "Mateo Paredes." Disambiguate before re-running.';
END $$;

COMMIT;

-- ════════════════════════════════════════════════════════════════════
-- OPTIONAL FOLLOW-UP: clean up the stale mayor stamp on Miramar del
-- Sur. Uncomment + run if you want the cities row to forget Mateo's
-- mayoralty (NPC name + party, mirroring the resolver's mayor-LOSS
-- incumbent eviction in 20270724).
-- ════════════════════════════════════════════════════════════════════
-- BEGIN;
-- DO $$
-- DECLARE
--     v_first_pool text[];
--     v_last_pool  text[];
--     v_evict_first text;
--     v_evict_last  text;
-- BEGIN
--     SELECT first_name_pool, last_name_pool INTO v_first_pool, v_last_pool
--       FROM public.nations n
--       JOIN public.cities  c ON c.nation_id = n.id
--      WHERE c.id = (SELECT city_id FROM public.cities WHERE city_name ILIKE 'Miramar del Sur' LIMIT 1);
--     v_evict_first := COALESCE(public.pick_random_pool_name(v_first_pool), 'Mayor');
--     v_evict_last  := COALESCE(public.pick_random_pool_name(v_last_pool),  'Smith');
--     UPDATE public.cities
--        SET mayor_first_name    = v_evict_first,
--            mayor_last_name     = v_evict_last,
--            mayor_age           = 35 + floor(random() * 31)::int,
--            mayor_party_id      = NULL,
--            mayor_archetype     = NULL,
--            mayor_term_end_tick = NULL
--      WHERE city_name ILIKE 'Miramar del Sur';
--     RAISE NOTICE 'Mayor seat reset to NPC: % %.', v_evict_first, v_evict_last;
-- END $$;
-- COMMIT;
