-- ════════════════════════════════════════════════════════════════════
-- 20270723 — Term expiry restores a fresh NPC to the council seat
--
-- 20270722 stamps a player into a city council seat on CCM/CCP win
-- but never clears the seat when the term auto-expires. The 20270654
-- politician_resolve_expired_terms RPC clears politician_office /
-- politician_office_won_at_tick correctly, but the cities.council
-- jsonb keeps pointing at the (now ex-) holder with a past term_end
-- _tick. The seat reads as "Term ended Month Year" indefinitely.
--
-- This migration re-emits the RPC. For each CCM/CCP whose term has
-- expired:
--   1. Locate the cities row + seat index where holder_faction_id
--      matches the expired faction. holder_faction_id is unique
--      per seat — at most one row in the country can match.
--   2. Roll a fresh NPC: random name from the nation's pools, a
--      random in-nation movement_party for the chip (NULL OK), age
--      35-65. Same shape as the 20270722 seed.
--   3. Replace the seat via jsonb_set, with term_end_tick = NULL
--      (NPCs don't have terms).
--
-- Community Organizer expiries skip the seat block — COs don't sit
-- on city councils.
--
-- A holder whose seat was already replaced by another player (rare
-- in V1 single-player nations) returns no row from the lookup; the
-- block falls through silently and only the office clear fires.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.politician_resolve_expired_terms()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid             uuid := auth.uid();
    v_tick            int;
    v_pol             RECORD;
    v_office_label    text;
    v_expired_count   int := 0;
    v_seat_city_id    uuid;
    v_seat_nation_id  uuid;
    v_seat_idx        int;
    v_seat_kind       text;
    v_first_pool      text[];
    v_last_pool       text[];
    v_npc_first       text;
    v_npc_last        text;
    v_party_id        uuid;
    v_party_abbr      text;
    v_party_name      text;
    v_party_arch      text;
    v_new_seat        jsonb;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    FOR v_pol IN
        SELECT id, politician_office, politician_office_won_at_tick
          FROM factions
         WHERE (id = v_uid OR linked_user_id = v_uid)
           AND faction_type = 'politician'
           AND abandoned_at IS NULL
           AND politician_office IN ('community_organizer', 'city_council_member', 'city_council_president')
           AND (
               politician_office_won_at_tick IS NULL
               OR v_tick >= politician_office_won_at_tick + CASE politician_office
                       WHEN 'city_council_president' THEN 36
                       ELSE                                12
                  END
           )
         FOR UPDATE
    LOOP
        v_office_label := CASE v_pol.politician_office
            WHEN 'community_organizer'    THEN 'Community Organizer'
            WHEN 'city_council_member'    THEN 'City Council Member'
            WHEN 'city_council_president' THEN 'City Council President'
            ELSE initcap(replace(v_pol.politician_office, '_', ' '))
        END;

        UPDATE factions
           SET politician_office             = NULL,
               politician_office_won_at_tick = NULL
         WHERE id = v_pol.id;

        INSERT INTO politician_career_events (faction_id, event_tick, event_type, target_name)
        VALUES (v_pol.id, v_tick, 'term_ended', v_office_label);

        -- 20270723: Restore a fresh NPC to the council seat the
        -- expired player held. CO doesn't sit on the council, so
        -- skip it. Lookup matches by holder_faction_id which is
        -- unique per seat — at most one row returns.
        IF v_pol.politician_office IN ('city_council_member', 'city_council_president') THEN
            v_seat_city_id   := NULL;
            v_seat_nation_id := NULL;
            v_seat_idx       := NULL;
            v_seat_kind      := NULL;

            SELECT c.id, c.nation_id, (t.idx - 1)::int, t.elem->>'seat'
              INTO v_seat_city_id, v_seat_nation_id, v_seat_idx, v_seat_kind
              FROM cities c, jsonb_array_elements(c.council) WITH ORDINALITY AS t(elem, idx)
             WHERE (t.elem->>'holder_faction_id')::uuid = v_pol.id
             LIMIT 1;

            IF v_seat_city_id IS NOT NULL THEN
                SELECT first_name_pool, last_name_pool
                  INTO v_first_pool, v_last_pool
                  FROM nations WHERE id = v_seat_nation_id;
                v_npc_first := COALESCE(pick_random_pool_name(v_first_pool), 'Council');
                v_npc_last  := COALESCE(pick_random_pool_name(v_last_pool),  'Member');

                -- Reset party_* between iterations so a previous
                -- expired-faction's value doesn't leak into a nation
                -- with zero active parties.
                v_party_id := NULL; v_party_abbr := NULL;
                v_party_name := NULL; v_party_arch := NULL;
                SELECT f.id, f.abbreviation, f.faction_name, f.archetype
                  INTO v_party_id, v_party_abbr, v_party_name, v_party_arch
                  FROM factions f
                 WHERE f.nation_id    = v_seat_nation_id
                   AND f.faction_type = 'movement_party'
                   AND f.abandoned_at IS NULL
                 ORDER BY random()
                 LIMIT 1;

                v_new_seat := jsonb_build_object(
                    'seat',              v_seat_kind,
                    'holder_faction_id', NULL,
                    'first_name',        v_npc_first,
                    'last_name',         v_npc_last,
                    'age',               35 + floor(random() * 31)::int,
                    'party_id',          v_party_id,
                    'party_abbr',        v_party_abbr,
                    'party_name',        v_party_name,
                    'archetype',         v_party_arch,
                    'term_end_tick',     NULL
                );
                UPDATE cities
                   SET council = jsonb_set(council, ARRAY[v_seat_idx::text], v_new_seat)
                 WHERE id = v_seat_city_id;
            END IF;
        END IF;

        v_expired_count := v_expired_count + 1;
    END LOOP;

    RETURN jsonb_build_object(
        'success',       true,
        'tick',          v_tick,
        'expired_count', v_expired_count
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.politician_resolve_expired_terms() TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
