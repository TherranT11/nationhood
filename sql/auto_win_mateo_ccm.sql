-- ════════════════════════════════════════════════════════════════════
-- ADMIN / TESTING: auto-win Mateo Paredes' Miramar del Sur City
-- Council Member race
-- ════════════════════════════════════════════════════════════════════
-- Third in the auto-win admin SQL series after
-- auto_win_mateo_mayor.sql + auto_win_mateo_ccp.sql. Short-circuits
-- natural tick-advance resolution and stamps Mateo as a sitting
-- CCM of Miramar del Sur. Mirrors the resolver's CCM-WIN branch
-- from 20270724/20270722 byte-for-byte.
--
-- Why not call politician_resolve_due_elections() from here? The
-- RPC's politician lookup is scoped to `(id = v_uid OR linked_user
-- _id = v_uid)` — only the caller's race. Admin SQL has no
-- auth.uid(), so the resolver returns early. Manual replay of the
-- WIN-branch writes is the only short-circuit available without
-- modifying the resolver.
--
-- Mirrors the resolver writes exactly:
--   1. factions: politician_office='city_council_member',
--      politician_office_won_at_tick = current_tick,
--      politician_skill +1 (per-tier reward). CCM stake_win = 0,
--      so no Influence delta.
--   2. cities (Miramar del Sur) council jsonb member seat:
--      • Picks the FIRST member seat with NULL holder_faction_id
--        (member_1, then member_2, then member_3).
--      • If every member seat is held, picks the OLDEST-term
--        member seat (smallest term_end_tick) and evicts.
--      jsonb_set replaces the chosen seat with Mateo's holder
--      info + 12-tick term.
--   3. politician_career_events 'won_election' with metadata +
--      forced + admin_override tags so the row is auditable.
--   4. DELETE the politician_active_election row.
--
-- KNOWN SIDE EFFECTS, documented for transparency:
--   • Mateo is currently CCP of Miramar del Sur (seat 0 stamp
--     from auto_win_mateo_ccp.sql). After this script, his
--     politician_office flips to 'city_council_member' — he's
--     no longer the CCP per the office column, but seat 0 of the
--     council STILL HAS HIM stamped. The resolver doesn't free
--     prior seats on a new win, and I'm intentionally mirroring
--     that behaviour rather than inventing new cleanup logic.
--     His name will appear twice on the council until something
--     clears it.
--   • The cities.mayor_* stamp (from auto_win_mateo_mayor) is
--     also still pointing at Mateo. Three stale identity stamps
--     on one cities row. Optional NPC-evict blocks at the bottom
--     of this file (commented out) clean each independently if
--     you want a fresh slate.
--
-- Safety:
--   • SELECT INTO STRICT catches missing / ambiguous politicians.
--   • Explicit guards for no-race / no-city / null-council /
--     no-member-seat-found.
--   • Transactional. NOT idempotent — re-running double-stamps
--     office_won_at_tick and double-awards +1 Skill.
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
    v_council         jsonb;
    v_seat_idx        int;
    v_seat_kind       text;
    v_party_abbr      text;
    v_party_name      text;
    v_new_seat        jsonb;
    v_new_skill       numeric;
BEGIN
    SELECT id, leader_first_name, leader_last_name, leader_age, politician_party_id
      INTO STRICT v_pol_id, v_first, v_last, v_age, v_party_id
      FROM public.factions
     WHERE faction_type = 'politician'
       AND abandoned_at IS NULL
       AND leader_first_name ILIKE 'Mateo'
       AND leader_last_name  ILIKE 'Paredes';

    SELECT * INTO v_race FROM public.politician_active_election
     WHERE politician_id = v_pol_id AND race_tier = 'city_council';
    IF v_race.politician_id IS NULL THEN
        RAISE EXCEPTION 'No in-flight CCM race for Mateo Paredes.';
    END IF;
    v_city_id := v_race.city_id;
    IF v_city_id IS NULL THEN
        RAISE EXCEPTION 'CCM race has no city_id — re-file with a city pick (20270721).';
    END IF;

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- 1. Politician faction: office stamp + +1 Skill.
    UPDATE public.factions
       SET politician_office             = 'city_council_member',
           politician_office_won_at_tick = v_tick,
           politician_skill              = COALESCE(politician_skill, 1) + 1
     WHERE id = v_pol_id
    RETURNING politician_skill INTO v_new_skill;

    -- 2. Seat pick. Mirrors the resolver: first NULL-holder member
    -- seat (member_1 → member_2 → member_3), else oldest-term
    -- member seat (smallest term_end_tick) gets evicted.
    SELECT council INTO v_council FROM public.cities WHERE id = v_city_id;
    IF v_council IS NULL THEN
        RAISE EXCEPTION 'Cities council jsonb is NULL for city_id=%.', v_city_id;
    END IF;

    SELECT (t.idx - 1)::int INTO v_seat_idx
      FROM jsonb_array_elements(v_council) WITH ORDINALITY AS t(elem, idx)
     WHERE elem->>'seat' LIKE 'member_%'
       AND (elem->>'holder_faction_id') IS NULL
     ORDER BY idx
     LIMIT 1;

    IF v_seat_idx IS NULL THEN
        SELECT (t.idx - 1)::int INTO v_seat_idx
          FROM jsonb_array_elements(v_council) WITH ORDINALITY AS t(elem, idx)
         WHERE elem->>'seat' LIKE 'member_%'
         ORDER BY NULLIF(elem->>'term_end_tick', '')::int ASC NULLS FIRST
         LIMIT 1;
    END IF;
    IF v_seat_idx IS NULL THEN
        RAISE EXCEPTION 'No member seat available to stamp on city_id=%.', v_city_id;
    END IF;

    v_seat_kind := v_council->v_seat_idx->>'seat';

    SELECT abbreviation, faction_name INTO v_party_abbr, v_party_name
      FROM public.factions
     WHERE id = v_party_id
     LIMIT 1;

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
        'term_end_tick',     v_tick + 12
    );

    UPDATE public.cities
       SET council = jsonb_set(council, ARRAY[v_seat_idx::text], v_new_seat)
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
            'seat_idx',        v_seat_idx,
            'term_end_tick',   v_tick + 12,
            'forced',          true,
            'admin_override',  'auto_win_mateo_ccm.sql'
        )
    );

    -- 4. Clear the in-flight race.
    DELETE FROM public.politician_active_election WHERE politician_id = v_pol_id;

    RAISE NOTICE 'Auto-win complete: Mateo Paredes is now CCM (% / seat_idx=%) of city_id=% at tick %.',
        v_seat_kind, v_seat_idx, v_city_id, v_tick;
    RAISE NOTICE '  New Skill=%. Seat term ends at tick %.', v_new_skill, v_tick + 12;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE EXCEPTION 'Mateo Paredes politician faction not found.';
    WHEN TOO_MANY_ROWS THEN
        RAISE EXCEPTION 'Multiple politician factions match "Mateo Paredes." Disambiguate before re-running.';
END $$;

COMMIT;

-- ════════════════════════════════════════════════════════════════════
-- OPTIONAL FOLLOW-UPS (commented out). Each independently cleans up
-- one of the three stale identity stamps Mateo has accumulated
-- across the three auto-win SQLs (mayor → CCP → CCM).
-- ════════════════════════════════════════════════════════════════════

-- ── Clear the stale MAYOR stamp on Miramar del Sur ───────────────────
-- BEGIN;
-- DO $$
-- DECLARE
--     v_first_pool text[];
--     v_last_pool  text[];
--     v_evict_first text;
--     v_evict_last  text;
-- BEGIN
--     SELECT n.first_name_pool, n.last_name_pool INTO v_first_pool, v_last_pool
--       FROM public.nations n
--       JOIN public.cities  c ON c.nation_id = n.id
--      WHERE c.city_name ILIKE 'Miramar del Sur';
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

-- ── Clear the stale CCP stamp (council seat 0) ──────────────────────
-- BEGIN;
-- DO $$
-- DECLARE
--     v_city_id    uuid;
--     v_first_pool text[];
--     v_last_pool  text[];
--     v_evict_first text;
--     v_evict_last  text;
--     v_new_seat   jsonb;
-- BEGIN
--     SELECT c.id, n.first_name_pool, n.last_name_pool
--       INTO v_city_id, v_first_pool, v_last_pool
--       FROM public.cities  c
--       JOIN public.nations n ON c.nation_id = n.id
--      WHERE c.city_name ILIKE 'Miramar del Sur';
--     v_evict_first := COALESCE(public.pick_random_pool_name(v_first_pool), 'President');
--     v_evict_last  := COALESCE(public.pick_random_pool_name(v_last_pool),  'Smith');
--     v_new_seat := jsonb_build_object(
--         'seat',              'president',
--         'holder_faction_id', NULL,
--         'first_name',        v_evict_first,
--         'last_name',         v_evict_last,
--         'age',               35 + floor(random() * 31)::int,
--         'party_id',          NULL,
--         'party_abbr',        NULL,
--         'party_name',        NULL,
--         'archetype',         NULL,
--         'term_end_tick',     NULL
--     );
--     UPDATE public.cities
--        SET council = jsonb_set(council, ARRAY['0'], v_new_seat)
--      WHERE id = v_city_id;
--     RAISE NOTICE 'CCP seat reset to NPC: % %.', v_evict_first, v_evict_last;
-- END $$;
-- COMMIT;
