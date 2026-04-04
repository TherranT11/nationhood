-- ==================== FIX ALL NATIONS' LIVE GOVERNMENT NAMES ====================
-- Directly patches ministries, head_of_government, and administrations
-- for EVERY nation's active government.
--
-- Problem: The assign_ministry RPC writes "Unknown Person" placeholders
-- for all nations. This fixes any active government that has bad minister names.
--
-- Each nation gets its own culture-correct name pool:
--   Calveth  → Danish
--   Avelia   → Italian-Spanish
--   Flandis  → Dutch
--   Default  → Spanish (Crucera)
--
-- Safe to re-run: only touches rows with "Unknown"/"Person" names.

DO $$
DECLARE
  v_nation RECORD;
  v_pm_faction_id UUID;
  v_pm_first TEXT;
  v_pm_last TEXT;
  v_pm_age INT;
  v_ministry RECORD;
  v_first_names TEXT[];
  v_last_names TEXT[];
  v_new_first TEXT;
  v_new_last TEXT;
  v_new_age INT;
  v_fixed_count INT;
BEGIN
  -- Loop through all nations
  FOR v_nation IN SELECT id, name FROM nations LOOP
    RAISE NOTICE '=== Processing nation: % ===', v_nation.name;

    -- Select nation-specific name pools
    CASE v_nation.name
      WHEN 'Calveth' THEN
        v_first_names := ARRAY['Lukas','Noah','Victor','Oliver','Oscar','William','Emil','Alfred','Magnus','Mads','Frederik','Christian','Mikkel','Anders','Lars','Søren','Rasmus','Kristian','Morten','Jesper'];
        v_last_names  := ARRAY['Jensen','Nielsen','Hansen','Pedersen','Andersen','Christensen','Larsen','Sørensen','Rasmussen','Jørgensen','Petersen','Madsen','Kristensen','Olsen','Thomsen','Christiansen','Poulsen','Johansen','Knudsen','Mortensen'];
      WHEN 'Avelia' THEN
        v_first_names := ARRAY['Marcelo','Luciana','Dante','Sofía','Lorenzo','Elena','Tomás','Rosario','Fabrizio','Carolina','Leandro','Paloma','Giancarlo','Inés','Renato','Marisol','Nico','Florencia','Aurelio','Celeste'];
        v_last_names  := ARRAY['Montalbán','Ferretti','Salcedo','Conti','Valverde','Lucero','Maretti','Orellana','Bellini','Calderón','Santoro','Vásquez','Lombardi','Peñaloza','Rinaldi','Escobar','Castellani','Madrigal','Giacomo','Solano'];
      WHEN 'Flandis' THEN
        v_first_names := ARRAY['Adriaan','Bastiaan','Casper','Damiaan','Evert','Floris','Gerben','Harmen','Ivo','Jasper','Klaas','Laurens','Maarten','Niels','Olaf','Pieter','Quinten','Reinier','Sander','Thijs'];
        v_last_names  := ARRAY['Bakker','Bos','Bosman','Brouwer','De Graaf','De Jong','De Vries','De Wit','Dekker','Dijkstra','Dijk','Driessen','Gerritsen','Hendriks','Hermans','Hoekstra','Huisman','Jacobs','Janssen','Koster'];
      ELSE
        -- Crucera / default → Spanish
        v_first_names := ARRAY['Alejandro','Camila','Diego','Valentina','Mateo','Isabela','Sebastián','Luca','Andrés','Gabriel','Joaquín','Mariana','Carlos','Tomas','Rafael','Edwin','Emilio','Catalina','Fernando','Renata'];
        v_last_names  := ARRAY['Velasco','Mendoza','Guerrero','Salazar','Castillo','Herrera','Morales','Ríos','Delgado','Espinoza','Guzmán','Navarro','Córdoba','Echeverría','Pacheco','Montero','Aguilar','Valenzuela','Carrasco','Ibarra'];
    END CASE;

    -- 1. Fix PM: sync from faction leader (already backfilled with correct culture names)
    SELECT faction_id INTO v_pm_faction_id
    FROM head_of_government
    WHERE nation_id = v_nation.id AND active = true;

    IF v_pm_faction_id IS NOT NULL THEN
      SELECT leader_first_name, leader_last_name, leader_age
      INTO v_pm_first, v_pm_last, v_pm_age
      FROM factions
      WHERE id = v_pm_faction_id;

      -- Only fix if leader name exists and PM currently has wrong-culture or placeholder name
      IF v_pm_first IS NOT NULL AND v_pm_last IS NOT NULL THEN
        UPDATE head_of_government SET
          first_name = v_pm_first,
          last_name  = v_pm_last,
          age        = COALESCE(v_pm_age, 45)
        WHERE nation_id = v_nation.id AND active = true;

        UPDATE ministries SET
          minister_first_name = v_pm_first,
          minister_last_name  = v_pm_last,
          minister_age        = COALESCE(v_pm_age, 45)
        WHERE nation_id = v_nation.id
          AND ministry_key = 'prime_minister'
          AND is_active = true;

        UPDATE administrations SET
          prime_minister = v_pm_first || ' ' || v_pm_last,
          admin_name     = v_pm_last || ' Administration'
        WHERE nation_id = v_nation.id AND ended_at_tick IS NULL;

        RAISE NOTICE '  PM → % %', v_pm_first, v_pm_last;
      END IF;
    END IF;

    -- 2. Fix non-PM ministers with "Unknown Person" or NULL names
    v_fixed_count := 0;
    FOR v_ministry IN
      SELECT id, ministry_key
      FROM ministries
      WHERE nation_id = v_nation.id
        AND is_active = true
        AND ministry_key != 'prime_minister'
        AND (minister_first_name IS NULL
             OR minister_first_name = 'Unknown'
             OR minister_last_name IS NULL
             OR minister_last_name = 'Person')
    LOOP
      v_new_first := v_first_names[1 + floor(random() * array_length(v_first_names, 1))::int];
      v_new_last  := v_last_names[1 + floor(random() * array_length(v_last_names, 1))::int];
      v_new_age   := 35 + floor(random() * 31)::int;

      UPDATE ministries SET
        minister_first_name = v_new_first,
        minister_last_name  = v_new_last,
        minister_age        = v_new_age
      WHERE id = v_ministry.id;

      v_fixed_count := v_fixed_count + 1;
      RAISE NOTICE '    % → % % (age %)', v_ministry.ministry_key, v_new_first, v_new_last, v_new_age;
    END LOOP;

    IF v_fixed_count = 0 THEN
      RAISE NOTICE '  No broken ministers found.';
    ELSE
      RAISE NOTICE '  Fixed % ministers.', v_fixed_count;
    END IF;

  END LOOP;

  RAISE NOTICE '=== All nations processed. ===';
END $$;
