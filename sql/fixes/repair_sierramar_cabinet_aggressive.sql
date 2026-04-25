-- Aggressive repair for Sierramar's empty cabinet.
--
-- Symptom: Government → Administrative shows "Navarro Administration" with
-- PM Emilio Navarro (TNP) and HoS Sergio Quiroga, but CABINET = "8 ministries"
-- with nothing listed, and the legend says "TNP holds 1".
--
-- Root cause: finalize_government_formation populated the PM + head_of_government
-- rows but didn't populate any non-PM ministry rows, either because:
--   (a) government_formations.ministry_assignments is empty/NULL, so the
--       "walk assignments" loop had nothing to do;
--   (b) or ministry_assignments was populated but minister_names was empty,
--       so the loop's `if (v_minister IS NULL) CONTINUE;` guard skipped
--       every row.
--
-- This repair populates all non-PM ministries in two steps:
--   1. Try to read ministry_assignments from the active formation. For any
--      key that has a party_id, upsert the ministries row (with a fallback
--      Crucera-pool name if minister_names is empty for that key).
--   2. For any cabinet slot STILL vacant after step 1, assign it to a
--      coalition party (proportional to seat share) and synthesize a name.
--
-- Idempotent — safe to re-run.

BEGIN;

DO $$
DECLARE
    v_nation_id        uuid;
    v_formation        RECORD;
    v_assignments      jsonb;
    v_minister_names   jsonb;
    v_pm_party_id      uuid;
    v_coalition_ids    uuid[];
    v_key              text;
    v_party_id_text    text;
    v_party_id         uuid;
    v_minister         jsonb;
    v_first            text;
    v_last             text;
    v_age              int;
    v_existing_id      uuid;
    v_party_seats      RECORD;
    v_total_seats      int;
    v_assigned_counts  jsonb := '{}'::jsonb;
    v_party_weights    RECORD;
    v_first_pool       text[] := ARRAY[
        'Alejandro','Camila','Diego','Valentina','Mateo','Isabela','Sebastián','Luca',
        'Andrés','Gabriel','Lucia','Renata','Mauricio','Patricia','Felipe','Daniela',
        'Rafael','Marisol','Eduardo','Gabriela','Roberto','Alicia','Francisco','Ximena',
        'Héctor','Ana','Tomás','Elena','Fernando','Claudia'
    ];
    v_last_pool        text[] := ARRAY[
        'Velasco','Mendoza','Guerrero','Salazar','Castillo','Herrera','Morales','Ríos',
        'Delgado','Espinoza','Vargas','Aguilar','Cordero','Navarro','Reyes','Flores',
        'Ortega','Rojas','Gómez','Paredes','Estrada','Montalbán','Cabrera','Serrano',
        'Cervantes','Mejía','Trujillo','Ibarra','Zamora','Pineda'
    ];
    v_display_names    jsonb := '{
        "interior":       "Ministry of the Interior",
        "foreign":        "Foreign Ministry",
        "defense":        "Ministry of Defense",
        "finance":        "Ministry of Finance",
        "education":      "Ministry of Education",
        "healthcare":     "Ministry of Healthcare",
        "labor":          "Ministry of Labor",
        "justice":        "Ministry of Justice",
        "trade":          "Ministry of Trade",
        "energy":         "Ministry of Energy",
        "transportation": "Ministry of Transportation"
    }'::jsonb;
    v_cabinet_keys     text[] := ARRAY[
        'interior','foreign','defense','finance','education','healthcare',
        'labor','justice','trade','energy','transportation'
    ];
    v_populated_count  int := 0;
    v_new_count        int := 0;
BEGIN
    -- 1. Resolve Sierramar nation.
    SELECT id INTO v_nation_id FROM nations WHERE name = 'Sierramar' LIMIT 1;
    IF v_nation_id IS NULL THEN
        RAISE EXCEPTION 'Sierramar nation not found';
    END IF;

    -- 2. Pull the most-recently-formed formation.
    SELECT * INTO v_formation
      FROM government_formations
     WHERE nation_id = v_nation_id
       AND status IN ('formed', 'active')
     ORDER BY COALESCE(formed_at, created_at) DESC NULLS LAST
     LIMIT 1;

    IF v_formation.id IS NULL THEN
        RAISE EXCEPTION 'No formed/active government_formation for Sierramar';
    END IF;

    v_assignments    := COALESCE(v_formation.ministry_assignments, '{}'::jsonb);
    v_minister_names := COALESCE(v_formation.minister_names,       '{}'::jsonb);
    v_pm_party_id    := NULLIF(v_assignments ->> 'prime_minister', '')::uuid;
    v_coalition_ids  := COALESCE(v_formation.party_ids, ARRAY[]::uuid[]);

    -- Fallback: if party_ids is empty, derive from the active administration's coalition_parties.
    IF array_length(v_coalition_ids, 1) IS NULL THEN
        SELECT COALESCE(array_agg((p ->> 'party_id')::uuid), ARRAY[]::uuid[])
          INTO v_coalition_ids
          FROM administrations a, jsonb_array_elements(COALESCE(a.coalition_parties, '[]'::jsonb)) p
         WHERE a.nation_id = v_nation_id AND a.ended_at_tick IS NULL;
    END IF;

    -- Fallback: if STILL empty, at least include the PM party.
    IF array_length(v_coalition_ids, 1) IS NULL AND v_pm_party_id IS NOT NULL THEN
        v_coalition_ids := ARRAY[v_pm_party_id];
    END IF;

    IF array_length(v_coalition_ids, 1) IS NULL THEN
        RAISE EXCEPTION 'Unable to determine coalition parties for Sierramar';
    END IF;

    RAISE NOTICE 'Sierramar: formation=%, pm=%, coalition size=%',
        v_formation.id, v_pm_party_id, array_length(v_coalition_ids, 1);

    -- ══════════════════════════════════════════════════════════════
    -- STEP A: apply explicit assignments from the formation JSON
    -- ══════════════════════════════════════════════════════════════
    FOR v_key, v_party_id_text IN
        SELECT key, value::text
          FROM jsonb_each_text(v_assignments)
         WHERE value IS NOT NULL AND value <> ''
    LOOP
        IF v_key = 'prime_minister' THEN CONTINUE; END IF;

        BEGIN
            v_party_id := v_party_id_text::uuid;
        EXCEPTION WHEN invalid_text_representation THEN
            CONTINUE;
        END;

        v_minister := v_minister_names -> v_key;
        v_first    := NULLIF(v_minister ->> 'first_name', '');
        v_last     := NULLIF(v_minister ->> 'last_name',  '');
        v_age      := NULLIF(v_minister ->> 'age', '')::int;
        IF v_first IS NULL THEN v_first := v_first_pool[1 + floor(random() * array_length(v_first_pool, 1))::int]; END IF;
        IF v_last  IS NULL THEN v_last  := v_last_pool[1  + floor(random() * array_length(v_last_pool,  1))::int]; END IF;
        IF v_age IS NULL OR v_age <= 0 THEN v_age := 38 + floor(random() * 25)::int; END IF;

        SELECT id INTO v_existing_id
          FROM ministries
         WHERE nation_id = v_nation_id AND ministry_key = v_key AND is_active = true
         LIMIT 1;

        IF v_existing_id IS NOT NULL THEN
            UPDATE ministries
               SET party_id = v_party_id, minister_first_name = v_first,
                   minister_last_name = v_last, minister_age = v_age,
                   minister_approval = COALESCE(minister_approval, 50)
             WHERE id = v_existing_id;
        ELSE
            INSERT INTO ministries (nation_id, ministry_key, ministry_name, is_active,
                party_id, minister_first_name, minister_last_name, minister_age, minister_approval)
            VALUES (v_nation_id, v_key, COALESCE(v_display_names ->> v_key, v_key), true,
                v_party_id, v_first, v_last, v_age, 50);
            v_new_count := v_new_count + 1;
        END IF;

        v_populated_count := v_populated_count + 1;
    END LOOP;

    RAISE NOTICE 'Step A: populated % from formation assignments (% new rows)',
        v_populated_count, v_new_count;

    -- ══════════════════════════════════════════════════════════════
    -- STEP B: fill any cabinet slot still vacant, distributing
    -- proportionally to coalition seat share. The PM party keeps its PM
    -- slot; the remaining 11 cabinet slots are split by seat share.
    -- ══════════════════════════════════════════════════════════════

    -- Pull seat counts for the coalition.
    SELECT COALESCE(SUM(seats), 0) INTO v_total_seats
      FROM factions
     WHERE id = ANY(v_coalition_ids) AND nation_id = v_nation_id;

    -- Walk each cabinet key. If no ministries row exists (or is vacant), assign
    -- to the coalition party with the largest remaining seat budget.
    FOR v_key IN SELECT unnest(v_cabinet_keys)
    LOOP
        SELECT id, party_id INTO v_existing_id, v_party_id
          FROM ministries
         WHERE nation_id = v_nation_id AND ministry_key = v_key AND is_active = true
         LIMIT 1;

        IF v_party_id IS NOT NULL THEN
            CONTINUE;  -- already filled by Step A or earlier runs
        END IF;

        -- Pick the coalition party currently holding the fewest ministries
        -- (tie-break by highest seat count) so distribution stays balanced.
        SELECT f.id, f.seats
          INTO v_party_weights
          FROM factions f
         WHERE f.id = ANY(v_coalition_ids)
           AND f.nation_id = v_nation_id
         ORDER BY COALESCE((v_assigned_counts ->> f.id::text)::int, 0) ASC,
                  f.seats DESC NULLS LAST
         LIMIT 1;

        IF v_party_weights.id IS NULL THEN
            CONTINUE;  -- no coalition party available; skip
        END IF;

        v_party_id := v_party_weights.id;
        v_first    := v_first_pool[1 + floor(random() * array_length(v_first_pool, 1))::int];
        v_last     := v_last_pool[1  + floor(random() * array_length(v_last_pool,  1))::int];
        v_age      := 38 + floor(random() * 25)::int;

        IF v_existing_id IS NOT NULL THEN
            UPDATE ministries
               SET party_id = v_party_id, minister_first_name = v_first,
                   minister_last_name = v_last, minister_age = v_age,
                   minister_approval = COALESCE(minister_approval, 50)
             WHERE id = v_existing_id;
        ELSE
            INSERT INTO ministries (nation_id, ministry_key, ministry_name, is_active,
                party_id, minister_first_name, minister_last_name, minister_age, minister_approval)
            VALUES (v_nation_id, v_key, COALESCE(v_display_names ->> v_key, v_key), true,
                v_party_id, v_first, v_last, v_age, 50);
            v_new_count := v_new_count + 1;
        END IF;

        -- Bookkeeping: bump the assigned counter for the picked party
        v_assigned_counts := jsonb_set(
            v_assigned_counts,
            ARRAY[v_party_id::text],
            to_jsonb(COALESCE((v_assigned_counts ->> v_party_id::text)::int, 0) + 1)
        );
        v_populated_count := v_populated_count + 1;
    END LOOP;

    RAISE NOTICE 'Total populated: % ministries (% new rows, % across coalition)',
        v_populated_count, v_new_count, v_assigned_counts;

    -- Reset approval to a clean slate.
    UPDATE nations
       SET gov_approval        = 50,
           gov_approval_events = 0
     WHERE id = v_nation_id;
END $$;

-- Verify final cabinet state.
SELECT ministry_key, ministry_name,
       minister_first_name || ' ' || minister_last_name AS minister,
       minister_age, party_id, minister_approval
  FROM ministries
 WHERE nation_id = (SELECT id FROM nations WHERE name = 'Sierramar' LIMIT 1)
   AND is_active = true
 ORDER BY
   CASE ministry_key
     WHEN 'prime_minister' THEN 0
     WHEN 'interior' THEN 1 WHEN 'foreign' THEN 2 WHEN 'defense' THEN 3
     WHEN 'finance' THEN 4 WHEN 'education' THEN 5 WHEN 'healthcare' THEN 6
     WHEN 'labor' THEN 7 WHEN 'justice' THEN 8 WHEN 'trade' THEN 9
     WHEN 'energy' THEN 10 WHEN 'transportation' THEN 11
     ELSE 99
   END;

COMMIT;
