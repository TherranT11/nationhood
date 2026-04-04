-- ════════════════════════════════════════════════════════════════════════════════
-- Fix: finalize_government_formation uses hardcoded Spanish names for Head of State
--
-- Bug: The HoS auto-generation block in finalize_government_formation only uses
-- Crucera (Spanish) names for all nations. Calveth should use Danish names,
-- Flandis should use Dutch names, and Avelia should use Avelian names.
--
-- Fix: Full CREATE OR REPLACE with nation-aware CASE on v_nation.name.
-- Also carries forward the to_jsonb(v_nation) stats snapshot fix from 20260401.
-- ════════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION finalize_government_formation(
  p_formation_id UUID,
  p_caller_faction_id UUID,
  p_ministry_baselines JSONB DEFAULT '{}'::JSONB
) RETURNS JSONB AS $$
DECLARE
  v_formation RECORD;
  v_nation RECORD;
  v_shard RECORD;
  v_pm_party_id UUID;
  v_pm_faction RECORD;
  v_active_hog RECORD;
  v_coalition_parties JSONB;
  v_total_seats INT := 0;
  v_pm_name TEXT;
  v_hos_name TEXT;
  v_admin_name TEXT;
  v_end_reason TEXT;
  v_gov_approval INT;
  v_recent_election RECORD;
  v_ministry_key TEXT;
  v_ministry_party_id UUID;
  v_minister JSONB;
  v_existing_ministry_id UUID;
  v_ministry_display_names JSONB := '{
    "prime_minister": "Prime Minister",
    "interior": "Ministry of the Interior",
    "foreign": "Foreign Ministry",
    "defense": "Ministry of Defense",
    "finance": "Ministry of Finance",
    "education": "Ministry of Education",
    "healthcare": "Ministry of Healthcare",
    "labor": "Ministry of Labor",
    "justice": "Ministry of Justice",
    "trade": "Ministry of Trade",
    "energy": "Ministry of Energy",
    "transportation": "Ministry of Transportation"
  }'::JSONB;
  v_stats_snapshot JSONB;
  v_ideology RECORD;
  v_trait RECORD;
  v_leader_trait_key TEXT;
BEGIN
  -- 1. Validate formation exists and caller is the PM party
  SELECT * INTO v_formation
  FROM government_formations
  WHERE id = p_formation_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Formation not found.');
  END IF;

  IF v_formation.status != 'formed' AND v_formation.status != 'active' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Formation is not active.');
  END IF;

  v_pm_party_id := (v_formation.ministry_assignments->>'prime_minister')::UUID;
  IF v_pm_party_id IS NULL OR v_pm_party_id != p_caller_faction_id THEN
    RETURN jsonb_build_object('success', false, 'message', 'Only the Prime Minister party can form the government.');
  END IF;

  IF v_formation.status = 'active' THEN
    UPDATE government_formations SET status = 'formed' WHERE id = p_formation_id;
  END IF;

  SELECT * INTO v_formation FROM government_formations WHERE id = p_formation_id;

  SELECT * INTO v_nation FROM nations WHERE id = v_formation.nation_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Nation not found.');
  END IF;

  SELECT current_tick, current_date INTO v_shard
  FROM shard WHERE name = 'Alpha Shard';

  -- 2. Dissolve old coalitions
  UPDATE government_formations
  SET status = 'dissolved'
  WHERE nation_id = v_nation.id
    AND status IN ('formed', 'caretaker')
    AND id != p_formation_id;

  UPDATE active_coalitions
  SET status = 'dissolved', dissolved_at = NOW()
  WHERE nation_id = v_nation.id
    AND dissolved_at IS NULL;

  UPDATE head_of_government
  SET active = false
  WHERE nation_id = v_nation.id AND active = true;

  UPDATE ministries
  SET minister_first_name = NULL,
      minister_last_name = NULL,
      minister_age = NULL,
      party_id = NULL
  WHERE nation_id = v_nation.id AND is_active = true;

  -- 3. Reset failed formation attempts
  UPDATE nations SET failed_formation_attempts = 0 WHERE id = v_nation.id;

  -- 3b. Cancel pending snap elections
  UPDATE elections
  SET status = 'cancelled'
  WHERE nation_id = v_nation.id
    AND status = 'scheduled'
    AND (election_type IS NULL OR election_type = 'parliamentary')
    AND election_tick <= v_shard.current_tick + 5;

  -- 4. Cancel other active formation proposals
  UPDATE government_formations
  SET status = 'cancelled'
  WHERE nation_id = v_nation.id
    AND status = 'active'
    AND id != p_formation_id;

  -- 5. Fail frozen bills
  UPDATE bills
  SET status = 'failed'
  WHERE nation_id = v_nation.id AND status = 'frozen';

  -- 6. Populate ministries from formation data
  FOR v_ministry_key, v_ministry_party_id IN
    SELECT key, value::UUID
    FROM jsonb_each_text(v_formation.ministry_assignments)
    WHERE value IS NOT NULL AND value != ''
  LOOP
    IF v_ministry_key = 'prime_minister' THEN
      CONTINUE;
    END IF;

    v_minister := v_formation.minister_names->v_ministry_key;
    IF v_minister IS NULL THEN
      CONTINUE;
    END IF;

    SELECT id INTO v_existing_ministry_id
    FROM ministries
    WHERE nation_id = v_nation.id
      AND ministry_key = v_ministry_key
      AND is_active = true
    LIMIT 1;

    IF v_existing_ministry_id IS NOT NULL THEN
      UPDATE ministries SET
        party_id = v_ministry_party_id,
        minister_first_name = v_minister->>'first_name',
        minister_last_name = v_minister->>'last_name',
        minister_age = (v_minister->>'age')::INT,
        minister_approval = 50,
        stat_baselines = COALESCE(p_ministry_baselines->v_ministry_key, '{}'::JSONB)
      WHERE id = v_existing_ministry_id;
    ELSE
      INSERT INTO ministries (
        nation_id, ministry_key, ministry_name, is_active,
        party_id, minister_first_name, minister_last_name, minister_age,
        minister_approval, stat_baselines
      ) VALUES (
        v_nation.id, v_ministry_key,
        COALESCE(v_ministry_display_names->>v_ministry_key, v_ministry_key),
        true, v_ministry_party_id,
        v_minister->>'first_name', v_minister->>'last_name',
        (v_minister->>'age')::INT,
        50,
        COALESCE(p_ministry_baselines->v_ministry_key, '{}'::JSONB)
      );
    END IF;
  END LOOP;

  -- 7. Auto-generate Head of State if missing — nation-aware name pools
  IF v_nation.head_of_state_first_name IS NULL
     OR v_nation.head_of_state_last_name IS NULL
     OR v_nation.head_of_state_age IS NULL
     OR v_nation.head_of_state_age <= 0 THEN
    UPDATE nations SET
      head_of_state_first_name = COALESCE(v_nation.head_of_state_first_name,
        CASE v_nation.name
          WHEN 'Calveth' THEN (ARRAY['Lukas','Noah','Victor','Oliver','Oscar','William','Emil','Alfred','Magnus','Mads','Frederik','Christian','Mikkel','Anders','Lars','Søren','Rasmus','Kristian','Morten','Jesper'])[1 + floor(random()*20)::int]
          WHEN 'Avelia' THEN (ARRAY['Marcelo','Luciana','Dante','Sofía','Lorenzo','Elena','Tomás','Rosario','Fabrizio','Carolina','Leandro','Paloma','Giancarlo','Inés','Renato','Marisol','Nico','Florencia','Aurelio','Celeste'])[1 + floor(random()*20)::int]
          WHEN 'Flandis' THEN (ARRAY['Adriaan','Bastiaan','Casper','Damiaan','Evert','Floris','Gerben','Harmen','Ivo','Jasper','Klaas','Laurens','Maarten','Niels','Olaf','Pieter','Quinten','Reinier','Sander','Thijs'])[1 + floor(random()*20)::int]
          ELSE (ARRAY['Alejandro','Camila','Diego','Valentina','Mateo','Isabela','Sebastián','Luca','Andrés','Gabriel'])[1 + floor(random()*10)::int]
        END),
      head_of_state_last_name = COALESCE(v_nation.head_of_state_last_name,
        CASE v_nation.name
          WHEN 'Calveth' THEN (ARRAY['Jensen','Nielsen','Hansen','Pedersen','Andersen','Christensen','Larsen','Sørensen','Rasmussen','Jørgensen','Petersen','Madsen','Kristensen','Olsen','Thomsen','Christiansen','Poulsen','Johansen','Knudsen','Mortensen'])[1 + floor(random()*20)::int]
          WHEN 'Avelia' THEN (ARRAY['Montalbán','Ferretti','Salcedo','Conti','Valverde','Lucero','Maretti','Orellana','Bellini','Calderón','Santoro','Vásquez','Lombardi','Peñaloza','Rinaldi','Escobar','Castellani','Madrigal','Giacomo','Solano'])[1 + floor(random()*20)::int]
          WHEN 'Flandis' THEN (ARRAY['Bakker','Bos','Bosman','Brouwer','De Graaf','De Jong','De Vries','De Wit','Dekker','Dijkstra','Dijk','Driessen','Gerritsen','Hendriks','Hermans','Hoekstra','Huisman','Jacobs','Janssen','Koster'])[1 + floor(random()*20)::int]
          ELSE (ARRAY['Velasco','Mendoza','Guerrero','Salazar','Castillo','Herrera','Morales','Ríos','Delgado','Espinoza'])[1 + floor(random()*10)::int]
        END),
      head_of_state_age = CASE
        WHEN v_nation.head_of_state_age IS NOT NULL AND v_nation.head_of_state_age > 0
        THEN v_nation.head_of_state_age
        ELSE 45 + floor(random()*25)::int
      END
    WHERE id = v_nation.id;

    SELECT * INTO v_nation FROM nations WHERE id = v_nation.id;
  END IF;

  -- 8. Close previous administration + create new one
  SELECT jsonb_agg(
    jsonb_build_object(
      'party_id', f.id,
      'party_name', f.faction_name,
      'seats', f.seats
    )
  ) INTO v_coalition_parties
  FROM factions f
  WHERE f.id = ANY(v_formation.party_ids)
    AND f.nation_id = v_nation.id;

  SELECT COALESCE(SUM(f.seats), 0) INTO v_total_seats
  FROM factions f
  WHERE f.id = ANY(v_formation.party_ids)
    AND f.nation_id = v_nation.id;

  v_gov_approval := 50;

  SELECT * INTO v_recent_election
  FROM elections
  WHERE nation_id = v_nation.id AND status = 'completed'
  ORDER BY election_tick DESC LIMIT 1;

  IF v_recent_election.election_tick IS NOT NULL
     AND (v_shard.current_tick - v_recent_election.election_tick) <= 8 THEN
    v_end_reason := 'election_loss';
  ELSE
    v_end_reason := 'new_coalition';
  END IF;

  -- Dynamic stats snapshot (never goes stale when columns are renamed)
  v_stats_snapshot := to_jsonb(v_nation);

  BEGIN
    SELECT first_name, last_name INTO v_active_hog
    FROM head_of_government
    WHERE nation_id = v_nation.id AND active = true
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    v_active_hog := NULL;
  END;

  v_pm_name := NULL;
  IF v_active_hog.first_name IS NOT NULL THEN
    v_pm_name := v_active_hog.first_name || ' ' || v_active_hog.last_name;
  END IF;

  v_hos_name := NULL;
  IF v_nation.head_of_state_first_name IS NOT NULL AND v_nation.head_of_state_last_name IS NOT NULL THEN
    v_hos_name := v_nation.head_of_state_first_name || ' ' || v_nation.head_of_state_last_name;
  END IF;

  SELECT * INTO v_pm_faction FROM factions WHERE id = v_pm_party_id;
  v_admin_name := COALESCE(
    v_active_hog.last_name || ' Administration',
    v_nation.head_of_state_last_name || ' Administration',
    COALESCE(v_pm_faction.faction_name, 'Unknown') || ' Administration'
  );

  UPDATE administrations SET
    ended_at_tick = v_shard.current_tick,
    ended_at_date = v_shard.current_date,
    end_reason = v_end_reason,
    approval_at_end = v_gov_approval,
    stats_at_end = v_stats_snapshot
  WHERE nation_id = v_nation.id AND ended_at_tick IS NULL;

  INSERT INTO administrations (
    nation_id, admin_name, head_of_state, prime_minister,
    pm_party_name, pm_party_id, coalition_parties, total_seats,
    government_type, started_at_tick, started_at_date,
    stats_at_start, approval_at_start, head_of_state_title
  ) VALUES (
    v_nation.id,
    v_pm_faction.faction_name || ' Administration',
    v_hos_name,
    NULL,
    v_pm_faction.faction_name,
    v_pm_party_id,
    v_coalition_parties,
    v_total_seats,
    COALESCE(v_nation.government_type, 'Parliamentary Democracy'),
    v_shard.current_tick,
    v_shard.current_date,
    v_stats_snapshot,
    v_gov_approval,
    v_nation.head_of_state_title
  );

  UPDATE nations SET gov_approval = 50, gov_approval_events = 0
  WHERE id = v_nation.id;

  -- 9. Auto-appoint PM (party leader)
  SELECT f.*, fi.value AS ideology_tag
  INTO v_pm_faction
  FROM factions f
  LEFT JOIN faction_ideology fi ON fi.faction_id = f.id AND fi.axis = 'primary'
  WHERE f.id = v_pm_party_id;

  IF v_pm_faction.id IS NOT NULL AND v_pm_faction.leader_first_name IS NOT NULL THEN
    DELETE FROM pm_candidates
    WHERE faction_id = v_pm_party_id AND nation_id = v_nation.id;

    INSERT INTO head_of_government (
      nation_id, faction_id, first_name, last_name, age,
      ideology, appointed_tick, active
    ) VALUES (
      v_nation.id, v_pm_party_id,
      v_pm_faction.leader_first_name,
      v_pm_faction.leader_last_name,
      v_pm_faction.leader_age,
      v_pm_faction.ideology_tag,
      v_shard.current_tick,
      true
    )
    ON CONFLICT (nation_id)
    DO UPDATE SET
      faction_id = EXCLUDED.faction_id,
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      age = EXCLUDED.age,
      ideology = EXCLUDED.ideology,
      appointed_tick = EXCLUDED.appointed_tick,
      active = true;

    UPDATE administrations SET
      prime_minister = v_pm_faction.leader_first_name || ' ' || v_pm_faction.leader_last_name,
      admin_name = v_pm_faction.leader_last_name || ' Administration'
    WHERE nation_id = v_nation.id AND ended_at_tick IS NULL;

    SELECT id INTO v_existing_ministry_id
    FROM ministries
    WHERE nation_id = v_nation.id AND ministry_key = 'prime_minister' AND is_active = true
    LIMIT 1;

    IF v_existing_ministry_id IS NOT NULL THEN
      UPDATE ministries SET
        party_id = v_pm_party_id,
        minister_first_name = v_pm_faction.leader_first_name,
        minister_last_name = v_pm_faction.leader_last_name,
        minister_age = v_pm_faction.leader_age,
        minister_approval = 50,
        stat_baselines = COALESCE(p_ministry_baselines->'prime_minister', '{}'::JSONB)
      WHERE id = v_existing_ministry_id;
    ELSE
      INSERT INTO ministries (
        nation_id, ministry_key, ministry_name, is_active,
        party_id, minister_first_name, minister_last_name, minister_age,
        minister_approval, stat_baselines
      ) VALUES (
        v_nation.id, 'prime_minister', 'Prime Minister', true,
        v_pm_party_id,
        v_pm_faction.leader_first_name, v_pm_faction.leader_last_name,
        v_pm_faction.leader_age,
        50,
        COALESCE(p_ministry_baselines->'prime_minister', '{}'::JSONB)
      );
    END IF;

    UPDATE nations SET ruling_faction_id = v_pm_party_id WHERE id = v_nation.id;

    BEGIN
      PERFORM fire_system_event(
        v_nation.id,
        'pm_appointed',
        jsonb_build_object(
          'pm_name', v_pm_faction.leader_first_name || ' ' || v_pm_faction.leader_last_name,
          'party_name', v_pm_faction.faction_name
        )
      );
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Government formed successfully! ' || COALESCE(v_pm_faction.leader_first_name || ' ' || v_pm_faction.leader_last_name, 'Party leader') || ' is now Prime Minister.'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'message', 'Error forming government: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;
