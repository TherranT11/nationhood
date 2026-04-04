-- ════════════════════════════════════════════════════════════════════════════════
-- Fix: finalize_government_formation uses hardcoded Spanish names for Head of State
--
-- Bug: The HoS auto-generation block in finalize_government_formation only uses
-- Crucera (Spanish) names for all nations. Calveth should use Danish names,
-- Flandis should use Dutch names, and Avelia should use Avelian names.
--
-- Fix: Replace the hardcoded Spanish name arrays with a CASE on v_nation.name
-- that selects the appropriate culture-specific name pool.
-- ════════════════════════════════════════════════════════════════════════════════

DO $patch$
DECLARE
    v_src TEXT;
    v_patched TEXT;
    v_old_block TEXT;
    v_new_block TEXT;
BEGIN
    SELECT prosrc INTO v_src
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname = 'finalize_government_formation'
      AND n.nspname = 'public';

    IF v_src IS NULL THEN
        RAISE EXCEPTION 'Function finalize_government_formation not found';
    END IF;

    -- The old HoS block uses hardcoded Spanish name arrays.
    -- Replace with nation-aware name selection using CASE on v_nation.name.

    v_old_block := $old$head_of_state_first_name = COALESCE(v_nation.head_of_state_first_name,
        (ARRAY['Alejandro','Camila','Diego','Valentina','Mateo','Isabela','Sebastián','Luca','Andrés','Gabriel'])[1 + floor(random()*10)::int])$old$;

    v_new_block := $new$head_of_state_first_name = COALESCE(v_nation.head_of_state_first_name,
        CASE v_nation.name
          WHEN 'Calveth' THEN (ARRAY['Lukas','Noah','Victor','Oliver','Oscar','William','Emil','Alfred','Magnus','Mads','Frederik','Christian','Mikkel','Anders','Lars','Søren','Rasmus','Kristian','Morten','Jesper'])[1 + floor(random()*20)::int]
          WHEN 'Avelia' THEN (ARRAY['Marcelo','Luciana','Dante','Sofía','Lorenzo','Elena','Tomás','Rosario','Fabrizio','Carolina','Leandro','Paloma','Giancarlo','Inés','Renato','Marisol','Nico','Florencia','Aurelio','Celeste'])[1 + floor(random()*20)::int]
          WHEN 'Flandis' THEN (ARRAY['Adriaan','Bastiaan','Casper','Damiaan','Evert','Floris','Gerben','Harmen','Ivo','Jasper','Klaas','Laurens','Maarten','Niels','Olaf','Pieter','Quinten','Reinier','Sander','Thijs'])[1 + floor(random()*20)::int]
          ELSE (ARRAY['Alejandro','Camila','Diego','Valentina','Mateo','Isabela','Sebastián','Luca','Andrés','Gabriel'])[1 + floor(random()*10)::int]
        END)$new$;

    v_patched := replace(v_src, v_old_block, v_new_block);

    -- Now fix the last names
    v_old_block := $old$head_of_state_last_name = COALESCE(v_nation.head_of_state_last_name,
        (ARRAY['Velasco','Mendoza','Guerrero','Salazar','Castillo','Herrera','Morales','Ríos','Delgado','Espinoza'])[1 + floor(random()*10)::int])$old$;

    v_new_block := $new$head_of_state_last_name = COALESCE(v_nation.head_of_state_last_name,
        CASE v_nation.name
          WHEN 'Calveth' THEN (ARRAY['Jensen','Nielsen','Hansen','Pedersen','Andersen','Christensen','Larsen','Sørensen','Rasmussen','Jørgensen','Petersen','Madsen','Kristensen','Olsen','Thomsen','Christiansen','Poulsen','Johansen','Knudsen','Mortensen'])[1 + floor(random()*20)::int]
          WHEN 'Avelia' THEN (ARRAY['Montalbán','Ferretti','Salcedo','Conti','Valverde','Lucero','Maretti','Orellana','Bellini','Calderón','Santoro','Vásquez','Lombardi','Peñaloza','Rinaldi','Escobar','Castellani','Madrigal','Giacomo','Solano'])[1 + floor(random()*20)::int]
          WHEN 'Flandis' THEN (ARRAY['Bakker','Bos','Bosman','Brouwer','De Graaf','De Jong','De Vries','De Wit','Dekker','Dijkstra','Dijk','Driessen','Gerritsen','Hendriks','Hermans','Hoekstra','Huisman','Jacobs','Janssen','Koster'])[1 + floor(random()*20)::int]
          ELSE (ARRAY['Velasco','Mendoza','Guerrero','Salazar','Castillo','Herrera','Morales','Ríos','Delgado','Espinoza'])[1 + floor(random()*10)::int]
        END)$new$;

    v_patched := replace(v_patched, v_old_block, v_new_block);

    -- Verify at least one replacement happened
    IF v_patched = v_src THEN
        RAISE NOTICE 'WARNING: No replacements made — HoS name arrays may have already been patched or format differs';
    END IF;

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
