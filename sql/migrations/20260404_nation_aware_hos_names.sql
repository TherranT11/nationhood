-- ════════════════════════════════════════════════════════════════════════════════
-- Fix: finalize_government_formation uses hardcoded Spanish names for Head of State
--
-- Bug: The HoS auto-generation block in finalize_government_formation only uses
-- Crucera (Spanish) names for all nations. Calveth should use Danish names,
-- Flandis should use Dutch names, and Avelia should use Avelian names.
--
-- Fix: Replace the hardcoded Spanish name arrays with a CASE on v_nation.name
-- that selects the appropriate culture-specific name pool.
--
-- Uses regexp_replace to tolerate whitespace differences in the stored function.
-- ════════════════════════════════════════════════════════════════════════════════

DO $patch$
DECLARE
    v_src TEXT;
    v_patched TEXT;
BEGIN
    SELECT prosrc INTO v_src
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname = 'finalize_government_formation'
      AND n.nspname = 'public';

    IF v_src IS NULL THEN
        RAISE EXCEPTION 'Function finalize_government_formation not found';
    END IF;

    -- Replace the first-name COALESCE block (tolerates whitespace variations)
    -- Matches: head_of_state_first_name = COALESCE(v_nation.head_of_state_first_name, (ARRAY[...Spanish names...])[1 + floor(random()*10)::int])
    v_patched := regexp_replace(
        v_src,
        E'head_of_state_first_name\\s*=\\s*COALESCE\\s*\\(\\s*v_nation\\.head_of_state_first_name\\s*,\\s*\\(ARRAY\\[''Alejandro''[^\\]]+\\]\\)\\s*\\[1\\s*\\+\\s*floor\\(random\\(\\)\\s*\\*\\s*10\\)::int\\]\\s*\\)',
        E'head_of_state_first_name = COALESCE(v_nation.head_of_state_first_name,\n'
        E'        CASE v_nation.name\n'
        E'          WHEN ''Calveth'' THEN (ARRAY[''Lukas'',''Noah'',''Victor'',''Oliver'',''Oscar'',''William'',''Emil'',''Alfred'',''Magnus'',''Mads'',''Frederik'',''Christian'',''Mikkel'',''Anders'',''Lars'',''Søren'',''Rasmus'',''Kristian'',''Morten'',''Jesper''])[1 + floor(random()*20)::int]\n'
        E'          WHEN ''Avelia'' THEN (ARRAY[''Marcelo'',''Luciana'',''Dante'',''Sofía'',''Lorenzo'',''Elena'',''Tomás'',''Rosario'',''Fabrizio'',''Carolina'',''Leandro'',''Paloma'',''Giancarlo'',''Inés'',''Renato'',''Marisol'',''Nico'',''Florencia'',''Aurelio'',''Celeste''])[1 + floor(random()*20)::int]\n'
        E'          WHEN ''Flandis'' THEN (ARRAY[''Adriaan'',''Bastiaan'',''Casper'',''Damiaan'',''Evert'',''Floris'',''Gerben'',''Harmen'',''Ivo'',''Jasper'',''Klaas'',''Laurens'',''Maarten'',''Niels'',''Olaf'',''Pieter'',''Quinten'',''Reinier'',''Sander'',''Thijs''])[1 + floor(random()*20)::int]\n'
        E'          ELSE (ARRAY[''Alejandro'',''Camila'',''Diego'',''Valentina'',''Mateo'',''Isabela'',''Sebastián'',''Luca'',''Andrés'',''Gabriel''])[1 + floor(random()*10)::int]\n'
        E'        END)',
        'n'
    );

    IF v_patched = v_src THEN
        RAISE EXCEPTION 'First-name pattern not matched. Run: SELECT prosrc FROM pg_proc WHERE proname = ''finalize_government_formation''; and search for head_of_state_first_name to see the actual format.';
    END IF;

    -- Replace the last-name COALESCE block
    -- Matches: head_of_state_last_name = COALESCE(v_nation.head_of_state_last_name, (ARRAY[...Spanish names...])[1 + floor(random()*10)::int])
    v_patched := regexp_replace(
        v_patched,
        E'head_of_state_last_name\\s*=\\s*COALESCE\\s*\\(\\s*v_nation\\.head_of_state_last_name\\s*,\\s*\\(ARRAY\\[''Velasco''[^\\]]+\\]\\)\\s*\\[1\\s*\\+\\s*floor\\(random\\(\\)\\s*\\*\\s*10\\)::int\\]\\s*\\)',
        E'head_of_state_last_name = COALESCE(v_nation.head_of_state_last_name,\n'
        E'        CASE v_nation.name\n'
        E'          WHEN ''Calveth'' THEN (ARRAY[''Jensen'',''Nielsen'',''Hansen'',''Pedersen'',''Andersen'',''Christensen'',''Larsen'',''Sørensen'',''Rasmussen'',''Jørgensen'',''Petersen'',''Madsen'',''Kristensen'',''Olsen'',''Thomsen'',''Christiansen'',''Poulsen'',''Johansen'',''Knudsen'',''Mortensen''])[1 + floor(random()*20)::int]\n'
        E'          WHEN ''Avelia'' THEN (ARRAY[''Montalbán'',''Ferretti'',''Salcedo'',''Conti'',''Valverde'',''Lucero'',''Maretti'',''Orellana'',''Bellini'',''Calderón'',''Santoro'',''Vásquez'',''Lombardi'',''Peñaloza'',''Rinaldi'',''Escobar'',''Castellani'',''Madrigal'',''Giacomo'',''Solano''])[1 + floor(random()*20)::int]\n'
        E'          WHEN ''Flandis'' THEN (ARRAY[''Bakker'',''Bos'',''Bosman'',''Brouwer'',''De Graaf'',''De Jong'',''De Vries'',''De Wit'',''Dekker'',''Dijkstra'',''Dijk'',''Driessen'',''Gerritsen'',''Hendriks'',''Hermans'',''Hoekstra'',''Huisman'',''Jacobs'',''Janssen'',''Koster''])[1 + floor(random()*20)::int]\n'
        E'          ELSE (ARRAY[''Velasco'',''Mendoza'',''Guerrero'',''Salazar'',''Castillo'',''Herrera'',''Morales'',''Ríos'',''Delgado'',''Espinoza''])[1 + floor(random()*10)::int]\n'
        E'        END)',
        'n'
    );

    -- Recreate function with patched source
    EXECUTE format(
        $f$
        CREATE OR REPLACE FUNCTION finalize_government_formation(
            p_formation_id UUID,
            p_caller_faction_id UUID,
            p_ministry_baselines JSONB DEFAULT '{}'::JSONB
        ) RETURNS JSONB AS $body$
        %s
        $body$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
        $f$,
        v_patched
    );

    RAISE NOTICE 'Successfully patched finalize_government_formation with nation-aware HoS names';
END $patch$;
