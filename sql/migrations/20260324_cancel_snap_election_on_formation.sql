-- Cancel pending snap elections when a government is successfully formed.
-- This prevents the race condition where a snap election fires after
-- players have already completed Form Government.

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

  -- Call the existing form_government RPC logic inline:
  -- Validate caller is PM party + all conditions met
  v_pm_party_id := (v_formation.ministry_assignments->>'prime_minister')::UUID;
  IF v_pm_party_id IS NULL OR v_pm_party_id != p_caller_faction_id THEN
    RETURN jsonb_build_object('success', false, 'message', 'Only the Prime Minister party can form the government.');
  END IF;

  -- Mark formation as formed (if not already done by form_government RPC)
  IF v_formation.status = 'active' THEN
    UPDATE government_formations SET status = 'formed' WHERE id = p_formation_id;
  END IF;

  -- Refresh formation data
  SELECT * INTO v_formation FROM government_formations WHERE id = p_formation_id;

  -- Load nation
  SELECT * INTO v_nation FROM nations WHERE id = v_formation.nation_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Nation not found.');
  END IF;

  -- Load shard data
  SELECT current_tick, current_date INTO v_shard
  FROM shard WHERE name = 'Alpha Shard';

  -- 2. Dissolve old coalitions (exclude the new formation)
  UPDATE government_formations
  SET status = 'dissolved'
  WHERE nation_id = v_nation.id
    AND status IN ('formed', 'caretaker')
    AND id != p_formation_id;

  UPDATE active_coalitions
  SET status = 'dissolved', dissolved_at = NOW()
  WHERE nation_id = v_nation.id
    AND dissolved_at IS NULL;

  -- Deactivate old PM
  UPDATE head_of_government
  SET active = false
  WHERE nation_id = v_nation.id AND active = true;

  -- Vacate all ministries
  UPDATE ministries
  SET minister_first_name = NULL,
      minister_last_name = NULL,
      minister_age = NULL,
      party_id = NULL
  WHERE nation_id = v_nation.id AND is_active = true;

  -- 3. Reset failed formation attempts
  UPDATE nations SET failed_formation_attempts = 0 WHERE id = v_nation.id;

  -- 3b. Cancel any pending snap elections (government formed, no longer needed)
  -- Snap elections are scheduled within a few ticks; regular periodic elections are far out
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
      CONTINUE; -- PM handled separately below
    END IF;

    v_minister := v_formation.minister_names->v_ministry_key;
    IF v_minister IS NULL THEN
      CONTINUE;
    END IF;

    -- Check for existing ministry row
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
        minister_approval = 40,
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

  -- 7. Auto-generate Head of State if missing
  IF v_nation.head_of_state_first_name IS NULL
     OR v_nation.head_of_state_last_name IS NULL
     OR v_nation.head_of_state_age IS NULL
     OR v_nation.head_of_state_age <= 0 THEN
    UPDATE nations SET
      head_of_state_first_name = COALESCE(v_nation.head_of_state_first_name,
        (ARRAY['Alejandro','Camila','Diego','Valentina','Mateo','Isabela','Sebastián','Luca','Andrés','Gabriel'])[1 + floor(random()*10)::int]),
      head_of_state_last_name = COALESCE(v_nation.head_of_state_last_name,
        (ARRAY['Velasco','Mendoza','Guerrero','Salazar','Castillo','Herrera','Morales','Ríos','Delgado','Espinoza'])[1 + floor(random()*10)::int]),
      head_of_state_age = CASE
        WHEN v_nation.head_of_state_age IS NOT NULL AND v_nation.head_of_state_age > 0
        THEN v_nation.head_of_state_age
        ELSE 45 + floor(random()*25)::int
      END
    WHERE id = v_nation.id;

    -- Refresh nation
    SELECT * INTO v_nation FROM nations WHERE id = v_nation.id;
  END IF;

  -- 8. Close previous administration + create new one (rollover_administration)
  -- Build coalition_parties array for the new administration
  SELECT jsonb_agg(
    jsonb_build_object(
      'party_id', f.id,
      'party_name', f.faction_name,
      'seats', f.seats
    )
  ) INTO v_coalition_parties
  FROM factions f
  WHERE f.id = ANY((SELECT array_agg(x::UUID) FROM jsonb_array_elements_text(v_formation.party_ids::JSONB) x))
    AND f.nation_id = v_nation.id;

  SELECT COALESCE(SUM(f.seats), 0) INTO v_total_seats
  FROM factions f
  WHERE f.id = ANY((SELECT array_agg(x::UUID) FROM jsonb_array_elements_text(v_formation.party_ids::JSONB) x))
    AND f.nation_id = v_nation.id;

  -- Government approval always starts at 50 for a new administration
  v_gov_approval := 50;

  -- Determine end reason
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

  -- Snapshot current nation stats for administration record
  v_stats_snapshot := jsonb_build_object(
    'gdp', v_nation.gdp,
    'stability', v_nation.stability,
    'inflation', v_nation.inflation,
    'unemployment', v_nation.unemployment,
    'population', v_nation.population,
    'healthcare_quality', v_nation.healthcare_quality,
    'education_quality', v_nation.education_quality,
    'infrastructure', v_nation.infrastructure,
    'military_strength', v_nation.military_strength,
    'corruption', v_nation.corruption,
    'crime_rate', v_nation.crime_rate,
    'trade_balance', v_nation.trade_balance,
    'civil_liberties', v_nation.civil_liberties,
    'environmental_index', v_nation.environmental_index,
    'debt', v_nation.debt,
    'innovation_index', v_nation.innovation_index,
    'tax_rate', v_nation.tax_rate,
    'happiness', v_nation.happiness,
    'inequality', v_nation.inequality,
    'immigration_rate', v_nation.immigration_rate
  );

  -- Try rollover_administration RPC first (atomically closes old + creates new)
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

  -- Get PM faction name for admin_name
  SELECT * INTO v_pm_faction FROM factions WHERE id = v_pm_party_id;
  v_admin_name := COALESCE(
    v_active_hog.last_name || ' Administration',
    v_nation.head_of_state_last_name || ' Administration',
    COALESCE(v_pm_faction.faction_name, 'Unknown') || ' Administration'
  );

  -- Close current administration
  UPDATE administrations SET
    ended_at_tick = v_shard.current_tick,
    ended_at_date = v_shard.current_date,
    end_reason = v_end_reason,
    approval_at_end = v_gov_approval,
    stats_at_end = v_stats_snapshot
  WHERE nation_id = v_nation.id AND ended_at_tick IS NULL;

  -- Create new administration
  INSERT INTO administrations (
    nation_id, admin_name, head_of_state, prime_minister,
    pm_party_name, pm_party_id, coalition_parties, total_seats,
    government_type, started_at_tick, started_at_date,
    stats_at_start, approval_at_start, head_of_state_title
  ) VALUES (
    v_nation.id,
    v_pm_faction.faction_name || ' Administration',
    v_hos_name,
    NULL, -- PM not yet appointed, will be set by step 9
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

  -- 9. Auto-appoint PM (party leader)
  SELECT f.*, fi.value AS ideology_tag
  INTO v_pm_faction
  FROM factions f
  LEFT JOIN faction_ideology fi ON fi.faction_id = f.id AND fi.axis = 'primary'
  WHERE f.id = v_pm_party_id;

  IF v_pm_faction.id IS NOT NULL AND v_pm_faction.leader_first_name IS NOT NULL THEN
    -- Delete unselected PM candidates
    DELETE FROM pm_candidates
    WHERE faction_id = v_pm_party_id AND nation_id = v_nation.id;

    -- Insert new Head of Government
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

    -- Update administration with PM name
    UPDATE administrations SET
      prime_minister = v_pm_faction.leader_first_name || ' ' || v_pm_faction.leader_last_name,
      admin_name = v_pm_faction.leader_last_name || ' Administration'
    WHERE nation_id = v_nation.id AND ended_at_tick IS NULL;

    -- Update/insert PM ministry row
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
        minister_approval = 40,
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

    -- Update nation ruling_faction_id
    UPDATE nations SET ruling_faction_id = v_pm_party_id WHERE id = v_nation.id;

    -- Fire system event
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
      -- fire_system_event may not exist; non-fatal
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
