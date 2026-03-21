-- Patch finalize_government_formation to respect hos_election_method
-- When 'hereditary': skip HoS auto-generation (monarch is permanent)
-- When 'appointed': always regenerate HoS (clear before check)

-- Replace the HoS auto-generation block (step 7) with hereditary-aware version
CREATE OR REPLACE FUNCTION finalize_government_formation(
  p_formation_id UUID,
  p_caller_faction_id UUID,
  p_ministry_baselines JSONB DEFAULT '{}'::JSONB
) RETURNS JSONB AS $$
DECLARE
  v_nation RECORD;
  v_formation RECORD;
  v_ministry_key TEXT;
  v_minister JSONB;
  v_existing_ministry_id UUID;
  v_coalition_parties JSONB;
  v_total_seats INT;
  v_gov_approval INT;
  v_recent_election RECORD;
  v_end_reason TEXT;
  v_pm_party RECORD;
  v_hog RECORD;
  v_admin_name TEXT;
  v_hos_name TEXT;
BEGIN
  -- 1. Load formation
  SELECT * INTO v_formation FROM government_formations WHERE id = p_formation_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'message', 'Formation not found'); END IF;
  IF v_formation.status != 'confirmed' THEN RETURN jsonb_build_object('success', false, 'message', 'Formation not confirmed'); END IF;

  -- 2. Load nation
  SELECT * INTO v_nation FROM nations WHERE id = v_formation.nation_id;

  -- 3. Cancel other active formations
  UPDATE government_formations SET status = 'cancelled'
  WHERE nation_id = v_nation.id AND status = 'active' AND id != p_formation_id;

  -- 4. Reset failed formation attempts
  UPDATE nations SET failed_formation_attempts = 0 WHERE id = v_nation.id;

  -- 5. Fail frozen bills
  UPDATE bills SET status = 'failed'
  WHERE nation_id = v_nation.id AND status = 'frozen';

  -- 6. Upsert ministries
  FOR v_ministry_key, v_minister IN
    SELECT key, value FROM jsonb_each(COALESCE(v_formation.minister_names, '{}'::JSONB))
  LOOP
    IF v_ministry_key = 'prime_minister' THEN CONTINUE; END IF;

    SELECT id INTO v_existing_ministry_id
    FROM ministries
    WHERE nation_id = v_nation.id AND ministry_key = v_ministry_key AND is_active = true
    LIMIT 1;

    IF v_existing_ministry_id IS NOT NULL THEN
      UPDATE ministries SET
        party_id = (v_formation.ministry_assignments->>v_ministry_key)::UUID,
        minister_first_name = v_minister->>'first_name',
        minister_last_name = v_minister->>'last_name',
        minister_age = (v_minister->>'age')::INT,
        minister_approval = 50,
        stat_baselines = COALESCE(p_ministry_baselines->v_ministry_key, '{}'::JSONB)
      WHERE id = v_existing_ministry_id;
    ELSE
      INSERT INTO ministries (nation_id, ministry_key, ministry_name, is_active, party_id, minister_first_name, minister_last_name, minister_age, minister_approval, stat_baselines)
      VALUES (
        v_nation.id,
        v_ministry_key,
        v_ministry_key,
        true,
        (v_formation.ministry_assignments->>v_ministry_key)::UUID,
        v_minister->>'first_name',
        v_minister->>'last_name',
        (v_minister->>'age')::INT,
        50,
        COALESCE(p_ministry_baselines->v_ministry_key, '{}'::JSONB)
      );
    END IF;
  END LOOP;

  -- 7. Auto-generate Head of State (respecting hos_election_method)
  -- If 'hereditary': never overwrite the monarch
  IF COALESCE(v_nation.hos_election_method, 'appointed') != 'hereditary' THEN
    -- If 'appointed': always generate a fresh HoS
    IF v_nation.hos_election_method = 'appointed' THEN
      UPDATE nations SET
        head_of_state_first_name = (ARRAY['Alejandro','Camila','Diego','Valentina','Mateo','Isabela','Sebastián','Luca','Andrés','Gabriel'])[1 + floor(random()*10)::int],
        head_of_state_last_name = (ARRAY['Velasco','Mendoza','Guerrero','Salazar','Castillo','Herrera','Morales','Ríos','Delgado','Espinoza'])[1 + floor(random()*10)::int],
        head_of_state_age = 45 + floor(random()*25)::int
      WHERE id = v_nation.id;
      SELECT * INTO v_nation FROM nations WHERE id = v_nation.id;
    ELSIF v_nation.head_of_state_first_name IS NULL
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
      SELECT * INTO v_nation FROM nations WHERE id = v_nation.id;
    END IF;
  END IF;

  -- 8. Close previous administration + create new one (rollover_administration)
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

  SELECT COALESCE(
    ROUND(AVG(f.approval_rating)),
    50
  )::INT INTO v_gov_approval
  FROM factions f
  WHERE f.id = ANY((SELECT array_agg(x::UUID) FROM jsonb_array_elements_text(v_formation.party_ids::JSONB) x))
    AND f.nation_id = v_nation.id;

  SELECT * INTO v_recent_election
  FROM elections
  WHERE nation_id = v_nation.id AND status = 'completed'
  ORDER BY election_tick DESC LIMIT 1;

  v_end_reason := CASE
    WHEN v_recent_election.id IS NOT NULL THEN 'election'
    ELSE 'formation'
  END;

  -- Close previous admin
  UPDATE administrations SET ended_at = NOW(), end_reason = v_end_reason
  WHERE nation_id = v_nation.id AND ended_at IS NULL;

  -- PM party info
  SELECT * INTO v_pm_party FROM factions
  WHERE id = (v_formation.ministry_assignments->>'prime_minister')::UUID;

  -- Head of Government
  SELECT * INTO v_hog FROM heads_of_government
  WHERE nation_id = v_nation.id AND active = true
  ORDER BY appointed_tick DESC LIMIT 1;

  v_hos_name := CASE
    WHEN v_nation.head_of_state_first_name IS NOT NULL AND v_nation.head_of_state_last_name IS NOT NULL
    THEN v_nation.head_of_state_first_name || ' ' || v_nation.head_of_state_last_name
    ELSE NULL
  END;

  v_admin_name := CASE
    WHEN v_hog.last_name IS NOT NULL THEN v_hog.last_name || ' Administration'
    WHEN v_nation.head_of_state_last_name IS NOT NULL THEN v_nation.head_of_state_last_name || ' Administration'
    WHEN v_pm_party.faction_name IS NOT NULL THEN v_pm_party.faction_name || ' Administration'
    ELSE 'New Administration'
  END;

  INSERT INTO administrations (
    nation_id, admin_name, head_of_state, head_of_state_title,
    coalition_parties, coalition_seats, government_approval, hos_election_method
  ) VALUES (
    v_nation.id, v_admin_name, v_hos_name, v_nation.head_of_state_title,
    v_coalition_parties, v_total_seats, v_gov_approval, v_nation.hos_election_method
  );

  -- Mark formation as completed
  UPDATE government_formations SET status = 'completed' WHERE id = p_formation_id;

  RETURN jsonb_build_object('success', true, 'message', v_admin_name || ' has been formed!');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
