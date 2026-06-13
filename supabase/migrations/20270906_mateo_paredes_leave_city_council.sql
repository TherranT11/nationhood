-- ════════════════════════════════════════════════════════════════════
-- 20270906 — Data fix: remove Mateo Paredes from the City Council
--
-- Mateo Paredes (faction_type='politician') was holding three careers at
-- once: an elected City Council Member seat (politician_office =
-- 'city_council_member'), a Junior Minister of Tourism appointment
-- (politician_junior_portfolio = 'tourism'), and the civil-service
-- ministry post the Junior Minister rank is promoted from
-- (politician_ministry — REQUIRED by politician_seek_junior_appointment,
-- 20270669:228, so it is the EXPECTED companion of a JM, not a bug).
--
-- The "Civil Servant" mislabel was a display bug — careerLabel /
-- getPoliticianRoleLabel fell through the appointed canopy to the plain
-- "Civil Servant of …" string. Fixed in code (utils.appointmentTitle).
--
-- The genuine data problem is the simultaneous elected seat: under the
-- one-affiliation-at-a-time rule he should not sit on the council while
-- serving as Junior Minister. This migration evicts him from the council
-- and clears the elected office, leaving him cleanly the Junior Minister
-- of Tourism (junior portfolio + its underlying civil-service ministry
-- untouched).
--
-- Name-keyed + IF-found guards throughout so it is a safe no-op on any
-- database where the row is already clean or absent.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

DO $$
DECLARE
    v_pol        factions%ROWTYPE;
    v_city       cities%ROWTYPE;
    v_seat_idx   int;
    v_seat_kind  text;
    v_first_pool text[];
    v_last_pool  text[];
    v_npc_first  text;
    v_npc_last   text;
    v_new_seat   jsonb;
BEGIN
    -- Resolve the faction row (defensive: pick the politician variant).
    SELECT * INTO v_pol
      FROM public.factions
     WHERE leader_first_name = 'Mateo'
       AND leader_last_name  = 'Paredes'
       AND faction_type      = 'politician'
     LIMIT 1;

    IF v_pol.id IS NULL THEN
        RAISE NOTICE '20270906: no Mateo Paredes politician row — nothing to do.';
        RETURN;
    END IF;

    -- ── 1. Clear the elected City Council office ──────────────────────
    IF v_pol.politician_office = 'city_council_member' THEN
        UPDATE public.factions
           SET politician_office             = NULL,
               politician_office_won_at_tick = NULL
         WHERE id = v_pol.id;
        RAISE NOTICE '20270906: cleared city_council_member office for %.', v_pol.id;
    ELSE
        RAISE NOTICE '20270906: % not holding city_council_member (office=%); leaving office column.', v_pol.id, v_pol.politician_office;
    END IF;

    -- ── 2. Restore his council seat to an NPC ─────────────────────────
    -- Find the city whose council jsonb carries his holder_faction_id.
    SELECT c.* INTO v_city
      FROM public.cities c
     WHERE c.council @> jsonb_build_array(
               jsonb_build_object('holder_faction_id', v_pol.id::text))
     LIMIT 1;

    IF v_city.id IS NOT NULL THEN
        -- Index of his seat in the 4-element [president, m1, m2, m3] array.
        SELECT (t.idx - 1)::int, t.elem->>'seat'
          INTO v_seat_idx, v_seat_kind
          FROM jsonb_array_elements(v_city.council)
               WITH ORDINALITY AS t(elem, idx)
         WHERE t.elem->>'holder_faction_id' = v_pol.id::text
         LIMIT 1;

        IF v_seat_idx IS NOT NULL THEN
            SELECT first_name_pool, last_name_pool
              INTO v_first_pool, v_last_pool
              FROM public.nations WHERE id = v_city.nation_id;
            v_npc_first := COALESCE(pick_random_pool_name(v_first_pool), 'Council');
            v_npc_last  := COALESCE(pick_random_pool_name(v_last_pool),  'Member');

            -- NPC seat: holder_faction_id NULL, term_end_tick NULL,
            -- party denormalization dropped (NPCs render off the name).
            v_new_seat := jsonb_build_object(
                'seat',              v_seat_kind,
                'holder_faction_id', NULL,
                'first_name',        v_npc_first,
                'last_name',         v_npc_last,
                'age',               35 + floor(random() * 31)::int,
                'party_id',          NULL,
                'party_abbr',        NULL,
                'party_name',        NULL,
                'archetype',         NULL,
                'term_end_tick',     NULL
            );
            UPDATE public.cities
               SET council = jsonb_set(council, ARRAY[v_seat_idx::text], v_new_seat)
             WHERE id = v_city.id;
            RAISE NOTICE '20270906: replaced Mateo''s % seat in city % with NPC % %.',
                v_seat_kind, v_city.id, v_npc_first, v_npc_last;
        END IF;
    ELSE
        RAISE NOTICE '20270906: no council seat held by % — office clear alone.', v_pol.id;
    END IF;
END $$;

COMMIT;
