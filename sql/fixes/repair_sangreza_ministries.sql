-- Repair Sangreza cabinet: populate ministry rows from the active formation.
--
-- Bug: finalize_government_formation appointed the PM but the rest of the
-- cabinet never got ministry rows, so the Government tab shows "0 ministries".
-- This script reads the most-recently-formed formation for Sangreza, walks
-- ministry_assignments, and upserts a ministries row per non-PM key. If
-- minister_names is missing for an assigned ministry, a placeholder name is
-- generated from a Crucera-region name pool so the seat doesn't render blank.
--
-- Safe to re-run; uses ON CONFLICT-style guard via SELECT/UPDATE/INSERT.

BEGIN;

DO $$
DECLARE
    v_nation_id        uuid;
    v_formation        RECORD;
    v_assignments      jsonb;
    v_minister_names   jsonb;
    v_key              text;
    v_party_id_text    text;
    v_party_id         uuid;
    v_minister         jsonb;
    v_first            text;
    v_last             text;
    v_age              int;
    v_existing_id      uuid;
    v_first_pool       text[] := ARRAY[
        'Alejandro','Camila','Diego','Valentina','Mateo','Isabela','Sebastián','Luca',
        'Andrés','Gabriel','Lucia','Renata','Mauricio','Patricia','Felipe','Daniela'
    ];
    v_last_pool        text[] := ARRAY[
        'Velasco','Mendoza','Guerrero','Salazar','Castillo','Herrera','Morales','Ríos',
        'Delgado','Espinoza','Vargas','Aguilar','Cordero','Navarro','Reyes','Flores'
    ];
    v_display_names    jsonb := '{
        "interior":      "Ministry of the Interior",
        "foreign":       "Foreign Ministry",
        "defense":       "Ministry of Defense",
        "finance":       "Ministry of Finance",
        "education":     "Ministry of Education",
        "healthcare":    "Ministry of Healthcare",
        "labor":         "Ministry of Labor",
        "justice":       "Ministry of Justice",
        "trade":         "Ministry of Trade",
        "energy":        "Ministry of Energy",
        "transportation":"Ministry of Transportation"
    }'::jsonb;
    v_populated_count  int := 0;
BEGIN
    -- 1. Resolve Sangreza nation.
    SELECT id INTO v_nation_id FROM nations WHERE name = 'Sangreza' LIMIT 1;
    IF v_nation_id IS NULL THEN
        RAISE EXCEPTION 'Sangreza nation not found';
    END IF;

    -- 2. Pull the most-recently-formed formation (or active fallback).
    SELECT * INTO v_formation
      FROM government_formations
     WHERE nation_id = v_nation_id
       AND status IN ('formed', 'active')
     ORDER BY COALESCE(formed_at, created_at) DESC NULLS LAST
     LIMIT 1;

    IF v_formation.id IS NULL THEN
        RAISE EXCEPTION 'No formed/active government_formation found for Sangreza';
    END IF;

    v_assignments    := COALESCE(v_formation.ministry_assignments, '{}'::jsonb);
    v_minister_names := COALESCE(v_formation.minister_names,       '{}'::jsonb);

    RAISE NOTICE 'Sangreza formation: id=%, assignments=%',
        v_formation.id, (SELECT array_agg(k) FROM jsonb_object_keys(v_assignments) AS k);

    -- 3. Walk every assignment except prime_minister and upsert the ministry row.
    FOR v_key, v_party_id_text IN
        SELECT key, value::text
          FROM jsonb_each_text(v_assignments)
         WHERE value IS NOT NULL AND value <> ''
    LOOP
        IF v_key = 'prime_minister' THEN
            CONTINUE;
        END IF;

        BEGIN
            v_party_id := v_party_id_text::uuid;
        EXCEPTION WHEN invalid_text_representation THEN
            RAISE NOTICE '  skip %: party id "%" is not a uuid', v_key, v_party_id_text;
            CONTINUE;
        END;

        -- Resolve minister name; fall back to random Crucera names if missing.
        v_minister := v_minister_names -> v_key;
        v_first    := NULLIF(v_minister ->> 'first_name', '');
        v_last     := NULLIF(v_minister ->> 'last_name',  '');
        v_age      := NULLIF(v_minister ->> 'age', '')::int;
        IF v_first IS NULL THEN
            v_first := v_first_pool[1 + floor(random() * array_length(v_first_pool, 1))::int];
        END IF;
        IF v_last IS NULL THEN
            v_last := v_last_pool[1 + floor(random() * array_length(v_last_pool, 1))::int];
        END IF;
        IF v_age IS NULL OR v_age <= 0 THEN
            v_age := 38 + floor(random() * 25)::int;
        END IF;

        -- Upsert (look up existing active row first to avoid relying on a unique index).
        SELECT id INTO v_existing_id
          FROM ministries
         WHERE nation_id    = v_nation_id
           AND ministry_key = v_key
           AND is_active    = true
         LIMIT 1;

        IF v_existing_id IS NOT NULL THEN
            UPDATE ministries
               SET party_id              = v_party_id,
                   minister_first_name   = v_first,
                   minister_last_name    = v_last,
                   minister_age          = v_age,
                   minister_approval     = COALESCE(minister_approval, 50)
             WHERE id = v_existing_id;
        ELSE
            INSERT INTO ministries (
                nation_id, ministry_key, ministry_name, is_active,
                party_id, minister_first_name, minister_last_name, minister_age,
                minister_approval
            ) VALUES (
                v_nation_id, v_key,
                COALESCE(v_display_names ->> v_key, v_key),
                true, v_party_id,
                v_first, v_last, v_age,
                50
            );
        END IF;

        v_populated_count := v_populated_count + 1;
    END LOOP;

    RAISE NOTICE 'Sangreza ministries populated/updated: %', v_populated_count;

    -- 4. Reset government approval to a clean 50% for the new administration.
    UPDATE nations
       SET gov_approval = 50,
           gov_approval_events = 0
     WHERE id = v_nation_id;
END $$;

-- Verify final cabinet state.
SELECT ministry_key, ministry_name,
       minister_first_name || ' ' || minister_last_name AS minister,
       minister_age, party_id, minister_approval
  FROM ministries
 WHERE nation_id = (SELECT id FROM nations WHERE name = 'Sangreza' LIMIT 1)
   AND is_active = true
 ORDER BY ministry_key;

COMMIT;
