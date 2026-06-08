-- ════════════════════════════════════════════════════════════════════
-- 20270722 — City council seats — 1 CCP + 3 CCMs per city
--
-- Closes the "Vacant" placeholder on city.html. Adds a denormalized
-- cities.council jsonb column holding a fixed 4-element array: one
-- president seat + three member seats. Seeded with NPC names drawn
-- from each nation's name pool + a random in-nation movement_party
-- so the council reads as populated from the moment a player loads
-- the city page.
--
-- Seat shape (jsonb object):
--   {
--     "seat": "president" | "member_1" | "member_2" | "member_3",
--     "holder_faction_id": null | uuid,   -- NULL = NPC; uuid = player
--     "first_name": "...",
--     "last_name":  "...",
--     "age": int,
--     "party_id":  null | uuid,
--     "party_abbr": null | "...",          -- denormalized for chip render
--     "party_name": null | "...",          -- denormalized fallback
--     "archetype": null | "...",
--     "term_end_tick": null | int          -- NULL for NPC; tick for player
--   }
--
-- The seat array is ALWAYS 4 elements in order [president, m1, m2, m3]
-- so client renders can index it directly.
--
-- Resolver re-emit (politician_resolve_due_elections):
--   • CCM win (race_tier='city_council', city_id NOT NULL) — first
--     NPC-held member seat is replaced with the player's info, term
--     _end_tick = v_tick + 12. If all 3 member seats are already
--     player-held, the one with the earliest term_end_tick gets
--     evicted (oldest incumbent out, newest in).
--   • CCP win (race_tier='city_council_president', city_id NOT NULL) —
--     symmetric stamp on the president seat, term_end_tick = v_tick
--     + 36. Defensive — today's CCP race doesn't carry a city_id
--     (no picker yet), so this branch is silent until the CCP
--     picker lands.
--   • All other branches (mayor, mp, senior_mp, community, etc.)
--     unchanged. Body otherwise byte-faithful to 20270719.
--
-- Out of scope this commit (filed):
--   • CCP city picker — CCP race will start stamping seats the
--     moment the picker passes city_id.
--   • Term expiry restoring NPC to the seat — politician_resolve
--     _expired_terms (20270654) clears politician_office but doesn't
--     touch the seat. The seat sits with the expired player + a
--     past term_end_tick until either a new player wins the seat
--     or a follow-up migration backfills NPCs on expiry.
--   • Defensive party abandonment handling — party_id in the seat
--     jsonb could point at an abandoned faction. Display rendering
--     reads the denormalized party_abbr + party_name so this is
--     visual-only stale data, not a broken FK.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Schema: cities.council jsonb ───────────────────────────────
ALTER TABLE public.cities
    ADD COLUMN IF NOT EXISTS council jsonb;

COMMENT ON COLUMN public.cities.council IS
    '20270722: 4-element jsonb array — 1 president seat + 3 member seats. Each seat carries holder_faction_id (NULL = NPC), first/last name, age, denormalized party_id / party_abbr / party_name / archetype, and term_end_tick. Read directly by city.html''s Council section; written by politician_resolve_due_elections on CCM/CCP wins.';


-- ── 2. Seed councils for every existing city ──────────────────────
-- One DO block over the cities table. For each city with council
-- IS NULL, picks 4 NPCs (random names from the nation pool) and 4
-- random in-nation movement_party assignments (with replacement so
-- nations with <4 parties don't break the loop). Idempotent via
-- the IS NULL guard.
DO $$
DECLARE
    v_city           RECORD;
    v_seat_kinds     constant text[] := ARRAY['president', 'member_1', 'member_2', 'member_3'];
    v_kind           text;
    v_seat           jsonb;
    v_council        jsonb;
    v_party_id       uuid;
    v_party_abbr     text;
    v_party_name     text;
    v_party_arch     text;
    v_seat_first     text;
    v_seat_last      text;
BEGIN
    FOR v_city IN
        SELECT c.id, c.nation_id, n.first_name_pool, n.last_name_pool
          FROM public.cities c
          JOIN public.nations n ON n.id = c.nation_id
         WHERE c.council IS NULL
    LOOP
        v_council := '[]'::jsonb;
        FOREACH v_kind IN ARRAY v_seat_kinds LOOP
            -- Random in-nation party. Best effort — NULL is fine if
            -- the nation has no active movement_party rows yet.
            SELECT f.id, f.abbreviation, f.faction_name, f.archetype
              INTO v_party_id, v_party_abbr, v_party_name, v_party_arch
              FROM public.factions f
             WHERE f.nation_id    = v_city.nation_id
               AND f.faction_type = 'movement_party'
               AND f.abandoned_at IS NULL
             ORDER BY random()
             LIMIT 1;

            v_seat_first := COALESCE(pick_random_pool_name(v_city.first_name_pool), 'Council');
            v_seat_last  := COALESCE(pick_random_pool_name(v_city.last_name_pool),  'Member');

            v_seat := jsonb_build_object(
                'seat',              v_kind,
                'holder_faction_id', NULL,
                'first_name',        v_seat_first,
                'last_name',         v_seat_last,
                'age',               35 + floor(random() * 31)::int,
                'party_id',          v_party_id,
                'party_abbr',        v_party_abbr,
                'party_name',        v_party_name,
                'archetype',         v_party_arch,
                'term_end_tick',     NULL
            );
            v_council := v_council || jsonb_build_array(v_seat);
        END LOOP;

        UPDATE public.cities SET council = v_council WHERE id = v_city.id;
    END LOOP;
END $$;


-- ── 3. Re-emit politician_resolve_due_elections ───────────────────
-- Body byte-faithful to 20270719 except for two new branches in the
-- v_won block:
--   • CCM win with city_id → stamp player into a member seat.
--   • CCP win with city_id → stamp player into the president seat
--     (silent today — CCP race has no city_id picker yet).
-- All other races (mayor / community / mp / senior_mp) unchanged.
CREATE OR REPLACE FUNCTION public.politician_resolve_due_elections()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_pol          factions%ROWTYPE;
    v_tick         int;
    v_race         politician_active_election%ROWTYPE;
    v_won          boolean;
    v_stake        int;
    v_cap_before   numeric;
    v_new_cap      numeric;
    v_actual_delta numeric;
    v_event        text;
    v_opp_full     text;
    v_party_seats  int;
    v_party_pop    numeric;
    v_party_pop_cap numeric;
    v_party_funds  bigint;
    v_party_name   text;
    v_party_reward jsonb;
    v_party_penalty jsonb;
    v_new_cha      int;
    v_new_skill    numeric;
    v_stat_reward  jsonb;
    v_office       text;
    v_city_stamp   jsonb;
    v_city_row     cities%ROWTYPE;
    v_first_pool   text[];
    v_last_pool    text[];
    v_evict_first  text;
    v_evict_last   text;
    v_was_incumbent boolean;
    v_seat_idx     int;
    v_seat_kind    text;
    v_new_seat     jsonb;
    v_pol_party_abbr text;
    v_pol_party_name text;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', true, 'resolved', false, 'reason', 'no_shard');
    END IF;

    SELECT f.* INTO v_pol
      FROM factions f
      JOIN politician_active_election pae ON pae.politician_id = f.id
     WHERE (f.id = v_uid OR f.linked_user_id = v_uid)
       AND f.faction_type = 'politician'
       AND f.abandoned_at IS NULL
       AND pae.resolve_tick < v_tick
     LIMIT 1;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', true, 'resolved', false);
    END IF;

    SELECT * INTO v_race FROM politician_active_election WHERE politician_id = v_pol.id;
    IF v_race.politician_id IS NULL THEN
        RETURN jsonb_build_object('success', true, 'resolved', false);
    END IF;
    IF v_race.resolve_tick >= v_tick THEN
        RETURN jsonb_build_object(
            'success', true, 'resolved', false,
            'race_tier', v_race.race_tier,
            'resolve_tick', v_race.resolve_tick,
            'current_tick', v_tick
        );
    END IF;

    IF v_race.polling_you_pct > v_race.polling_opp_pct THEN
        v_won := true;
    ELSIF v_race.polling_you_pct < v_race.polling_opp_pct THEN
        v_won := false;
    ELSE
        v_won := random() < 0.5;
    END IF;
    v_stake := CASE WHEN v_won THEN v_race.stake_win ELSE v_race.stake_lose END;
    v_event := CASE WHEN v_won THEN 'won_election' ELSE 'lost_election' END;
    v_opp_full := v_race.opp_first || ' ' || v_race.opp_last;
    v_cap_before := COALESCE(v_pol.politician_influence, 0);
    UPDATE factions
       SET politician_influence = GREATEST(0, v_cap_before + v_stake)
     WHERE id = v_pol.id
    RETURNING politician_influence INTO v_new_cap;
    v_actual_delta := v_new_cap - v_cap_before;

    -- Party rewards — unchanged from 20270712/20270719.
    IF v_won AND v_race.party_id IS NOT NULL THEN
        IF v_race.race_tier IN ('parliament', 'senior_mp') THEN
            UPDATE factions
               SET seats = COALESCE(seats, 0) + 1
             WHERE id = v_race.party_id
               AND faction_type = 'movement_party'
               AND abandoned_at IS NULL
            RETURNING seats, faction_name INTO v_party_seats, v_party_name;
            IF FOUND THEN
                v_party_reward := jsonb_build_object(
                    'kind',       'seats',
                    'delta',      1,
                    'new_value',  v_party_seats,
                    'party_name', v_party_name
                );
            END IF;
        ELSIF v_race.race_tier = 'community' THEN
            UPDATE factions
               SET popularity_pct = LEAST(popularity_cap_pct, COALESCE(popularity_pct, 0) + 1)
             WHERE id = v_race.party_id
               AND faction_type = 'movement_party'
               AND abandoned_at IS NULL
            RETURNING popularity_pct, faction_name INTO v_party_pop, v_party_name;
            IF FOUND THEN
                v_party_reward := jsonb_build_object(
                    'kind',       'popularity',
                    'delta',      1,
                    'new_value',  v_party_pop,
                    'party_name', v_party_name
                );
            END IF;
        ELSIF v_race.race_tier = 'city_council' THEN
            UPDATE factions
               SET popularity_cap_pct = COALESCE(popularity_cap_pct, 0) + 1,
                   popularity_pct     = LEAST(
                       COALESCE(popularity_cap_pct, 0) + 1,
                       COALESCE(popularity_pct, 0) + 1
                   ),
                   party_funds        = COALESCE(party_funds, 0) + 100000
             WHERE id = v_race.party_id
               AND faction_type = 'movement_party'
               AND abandoned_at IS NULL
            RETURNING popularity_pct, popularity_cap_pct, party_funds, faction_name
                 INTO v_party_pop, v_party_pop_cap, v_party_funds, v_party_name;
            IF FOUND THEN
                v_party_reward := jsonb_build_object(
                    'kind',           'city_council',
                    'popularity_delta',     1,
                    'popularity_new',       v_party_pop,
                    'popularity_cap_delta', 1,
                    'popularity_cap_new',   v_party_pop_cap,
                    'funds_delta',          100000,
                    'funds_new',            v_party_funds,
                    'party_name',           v_party_name
                );
            END IF;
        ELSIF v_race.race_tier = 'city_council_president' THEN
            UPDATE factions
               SET party_funds = COALESCE(party_funds, 0) + 200000
             WHERE id = v_race.party_id
               AND faction_type = 'movement_party'
               AND abandoned_at IS NULL
            RETURNING party_funds, faction_name INTO v_party_funds, v_party_name;
            IF FOUND THEN
                v_party_reward := jsonb_build_object(
                    'kind',        'city_council_president',
                    'funds_delta', 200000,
                    'funds_new',   v_party_funds,
                    'party_name',  v_party_name
                );
            END IF;
        ELSIF v_race.race_tier = 'mayor' THEN
            UPDATE factions
               SET popularity_pct = LEAST(
                       COALESCE(popularity_cap_pct, 100),
                       COALESCE(popularity_pct, 0) + 2
                   ),
                   party_funds    = COALESCE(party_funds, 0) + 200000
             WHERE id = v_race.party_id
               AND faction_type = 'movement_party'
               AND abandoned_at IS NULL
            RETURNING popularity_pct, party_funds, faction_name
                 INTO v_party_pop, v_party_funds, v_party_name;
            IF FOUND THEN
                v_party_reward := jsonb_build_object(
                    'kind',             'mayor',
                    'popularity_delta', 2,
                    'popularity_new',   v_party_pop,
                    'funds_delta',      200000,
                    'funds_new',        v_party_funds,
                    'party_name',       v_party_name
                );
            END IF;
        END IF;
    END IF;

    IF NOT v_won AND v_race.party_id IS NOT NULL THEN
        UPDATE factions
           SET popularity_pct = GREATEST(0, COALESCE(popularity_pct, 0) - 1)
         WHERE id = v_race.party_id
           AND faction_type = 'movement_party'
           AND abandoned_at IS NULL
        RETURNING popularity_pct, faction_name INTO v_party_pop, v_party_name;
        IF FOUND THEN
            v_party_penalty := jsonb_build_object(
                'kind',       'popularity',
                'delta',      -1,
                'new_value',  v_party_pop,
                'party_name', v_party_name
            );
        END IF;
    END IF;

    -- Player stat reward — unchanged from 20270709.
    IF v_won THEN
        IF v_race.race_tier IN ('parliament', 'senior_mp') THEN
            UPDATE factions
               SET politician_capital = COALESCE(politician_capital, 1) + 1
             WHERE id = v_pol.id
            RETURNING politician_capital INTO v_new_cha;
            v_stat_reward := jsonb_build_object('kind', 'influence', 'delta', 1, 'new_value', v_new_cha);
        ELSIF v_race.race_tier IN (
            'community', 'city_council', 'city_council_president',
            'mayor', 'mayor_of_capital', 'regional_leader'
        ) THEN
            UPDATE factions
               SET politician_skill = COALESCE(politician_skill, 1) + 1
             WHERE id = v_pol.id
            RETURNING politician_skill INTO v_new_skill;
            v_stat_reward := jsonb_build_object('kind', 'skill', 'delta', 1, 'new_value', v_new_skill);
        END IF;
        v_office := CASE v_race.race_tier
                        WHEN 'community'              THEN 'community_organizer'
                        WHEN 'parliament'             THEN 'member_of_parliament'
                        WHEN 'city_council'           THEN 'city_council_member'
                        WHEN 'city_council_president' THEN 'city_council_president'
                        WHEN 'senior_mp'              THEN 'senior_mp'
                        WHEN 'mayor'                  THEN 'mayor'
                        WHEN 'mayor_of_capital'       THEN 'mayor_of_capital'
                        WHEN 'regional_leader'        THEN 'regional_leader'
                    END;
        IF v_office IS NOT NULL THEN
            UPDATE factions
               SET politician_office             = v_office,
                   politician_office_won_at_tick = v_tick
             WHERE id = v_pol.id;
        END IF;
        IF v_race.race_tier = 'community' THEN
            UPDATE factions
               SET politician_former_community_organizer = TRUE
             WHERE id = v_pol.id;
        END IF;

        -- Mayor WIN city stamp (20270718/20270719). Unchanged.
        IF v_race.race_tier = 'mayor' AND v_race.city_id IS NOT NULL THEN
            UPDATE cities
               SET mayor_first_name    = v_pol.leader_first_name,
                   mayor_last_name     = v_pol.leader_last_name,
                   mayor_age           = COALESCE(v_pol.leader_age, mayor_age),
                   mayor_archetype     = NULL,
                   mayor_party_id      = v_pol.politician_party_id,
                   mayor_term_end_tick = v_tick + 48
             WHERE id = v_race.city_id;
            IF FOUND THEN
                v_city_stamp := jsonb_build_object(
                    'city_id',             v_race.city_id,
                    'mayor_first',         v_pol.leader_first_name,
                    'mayor_last',          v_pol.leader_last_name,
                    'mayor_party_id',      v_pol.politician_party_id,
                    'mayor_term_end_tick', v_tick + 48
                );
            END IF;
        END IF;

        -- 20270722: CCM / CCP WIN stamps the council seat.
        IF v_race.race_tier IN ('city_council', 'city_council_president')
           AND v_race.city_id IS NOT NULL THEN
            -- Pull the player's party abbr / name once for the seat
            -- denormalization so the rendered chip stays accurate
            -- even if the live party row is later renamed.
            SELECT abbreviation, faction_name
              INTO v_pol_party_abbr, v_pol_party_name
              FROM factions
             WHERE id = v_pol.politician_party_id
             LIMIT 1;

            SELECT * INTO v_city_row FROM cities WHERE id = v_race.city_id;
            IF v_city_row.id IS NOT NULL AND v_city_row.council IS NOT NULL THEN
                IF v_race.race_tier = 'city_council_president' THEN
                    -- President seat is always at index 0 in the
                    -- council array (per the seed order).
                    v_seat_idx := 0;
                ELSE
                    -- Member seat: first NPC-held slot wins. If all
                    -- three are player-held, replace the one with the
                    -- earliest term_end_tick (oldest incumbent out).
                    SELECT (t.idx - 1)::int INTO v_seat_idx
                      FROM jsonb_array_elements(v_city_row.council)
                           WITH ORDINALITY AS t(elem, idx)
                     WHERE elem->>'seat' LIKE 'member_%'
                       AND (elem->>'holder_faction_id') IS NULL
                     ORDER BY idx
                     LIMIT 1;
                    IF v_seat_idx IS NULL THEN
                        SELECT (t.idx - 1)::int INTO v_seat_idx
                          FROM jsonb_array_elements(v_city_row.council)
                               WITH ORDINALITY AS t(elem, idx)
                         WHERE elem->>'seat' LIKE 'member_%'
                         ORDER BY NULLIF(elem->>'term_end_tick', '')::int ASC NULLS FIRST
                         LIMIT 1;
                    END IF;
                END IF;

                IF v_seat_idx IS NOT NULL THEN
                    v_seat_kind := v_city_row.council->v_seat_idx->>'seat';
                    v_new_seat := jsonb_build_object(
                        'seat',              v_seat_kind,
                        'holder_faction_id', v_pol.id,
                        'first_name',        v_pol.leader_first_name,
                        'last_name',         v_pol.leader_last_name,
                        'age',               v_pol.leader_age,
                        'party_id',          v_pol.politician_party_id,
                        'party_abbr',        v_pol_party_abbr,
                        'party_name',        v_pol_party_name,
                        'archetype',         NULL,
                        'term_end_tick',     v_tick + CASE v_race.race_tier
                                                  WHEN 'city_council_president' THEN 36
                                                  ELSE                                12
                                              END
                    );
                    UPDATE cities
                       SET council = jsonb_set(council, ARRAY[v_seat_idx::text], v_new_seat)
                     WHERE id = v_race.city_id;
                    v_city_stamp := jsonb_build_object(
                        'city_id',   v_race.city_id,
                        'seat',      v_seat_kind,
                        'seat_idx',  v_seat_idx
                    );
                END IF;
            END IF;
        END IF;
    END IF;

    -- 20270719: Mayor LOSS — incumbent eviction. Unchanged.
    IF NOT v_won AND v_race.race_tier = 'mayor' AND v_race.city_id IS NOT NULL THEN
        SELECT * INTO v_city_row FROM cities WHERE id = v_race.city_id;
        v_was_incumbent :=
            v_city_row.id IS NOT NULL
            AND v_city_row.mayor_party_id   = v_pol.politician_party_id
            AND v_city_row.mayor_first_name = v_pol.leader_first_name
            AND v_city_row.mayor_last_name  = v_pol.leader_last_name;
        IF v_was_incumbent THEN
            SELECT first_name_pool, last_name_pool INTO v_first_pool, v_last_pool
              FROM nations WHERE id = v_pol.nation_id;
            v_evict_first := COALESCE(pick_random_pool_name(v_first_pool), 'Mayor');
            v_evict_last  := COALESCE(pick_random_pool_name(v_last_pool),  'Smith');
            UPDATE cities
               SET mayor_first_name    = v_evict_first,
                   mayor_last_name     = v_evict_last,
                   mayor_age           = 35 + floor(random() * 31)::int,
                   mayor_archetype     = NULL,
                   mayor_party_id      = NULL,
                   mayor_term_end_tick = NULL
             WHERE id = v_race.city_id;
            UPDATE factions
               SET politician_office             = NULL,
                   politician_office_won_at_tick = NULL
             WHERE id = v_pol.id;
            v_city_stamp := jsonb_build_object(
                'city_id',    v_race.city_id,
                'evicted',    true,
                'new_mayor',  v_evict_first || ' ' || v_evict_last
            );
        END IF;
    END IF;

    INSERT INTO politician_career_events (
        faction_id, event_tick, event_type, target_name, metadata
    ) VALUES (
        v_pol.id, v_tick, v_event, v_race.district,
        jsonb_build_object(
            'race_tier',              v_race.race_tier,
            'district',               v_race.district,
            'opponent',               v_opp_full,
            'opp_party_name',         v_race.opp_party_name,
            'polling_you',            v_race.polling_you_pct,
            'polling_opp',            v_race.polling_opp_pct,
            'political_capital_delta', v_actual_delta,
            'party_reward',           v_party_reward,
            'party_penalty',          v_party_penalty,
            'stat_reward',            v_stat_reward,
            'office_gained',          v_office,
            'city_id',                v_race.city_id,
            'city_stamp',             v_city_stamp
        )
    );
    DELETE FROM politician_active_election WHERE politician_id = v_pol.id;
    RETURN jsonb_build_object(
        'success',                true,
        'resolved',               true,
        'won',                    v_won,
        'race_tier',              v_race.race_tier,
        'district',               v_race.district,
        'opponent',               v_opp_full,
        'opp_party_name',         v_race.opp_party_name,
        'polling_you',            v_race.polling_you_pct,
        'polling_opp',            v_race.polling_opp_pct,
        'political_capital_delta', v_actual_delta,
        'politician_influence',   v_new_cap,
        'party_reward',           v_party_reward,
        'party_penalty',          v_party_penalty,
        'stat_reward',            v_stat_reward,
        'office_gained',          v_office,
        'city_stamp',             v_city_stamp
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.politician_resolve_due_elections() TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
