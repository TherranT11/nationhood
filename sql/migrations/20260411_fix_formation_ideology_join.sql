-- Fix finalize_government_formation: replace broken faction_ideology join
--
-- The faction_ideology table no longer has 'axis' or 'value' columns.
-- It now stores ideology scores as individual axis columns:
-- liberty_equality, tradition_progress, security_freedom,
-- globalism_nationalism, individualism_collectivism
--
-- This migration patches step 9 (auto-appoint PM) to derive the
-- ideology tag from the strongest axis value instead of the broken join.
--
-- Run in Supabase SQL editor. Safe to re-run.

-- Replace the function entirely with the fixed version
CREATE OR REPLACE FUNCTION finalize_government_formation(
  p_formation_id UUID,
  p_nation_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $fn$
DECLARE
  v_formation RECORD;
  v_nation RECORD;
  v_shard RECORD;
  v_result JSONB := '{}'::JSONB;
  v_pm_party_id UUID;
  v_pm_faction RECORD;
  v_pm_ideology TEXT;
  v_total_seats INT := 0;
  v_gov_approval NUMERIC;
  v_stats_snapshot JSONB;
  v_party_id UUID;
  v_party RECORD;
  v_existing_admin RECORD;
  v_saved_balances JSONB := '{}'::JSONB;
  v_restored_balance NUMERIC;
  cnt INT;
BEGIN
  -- 1. Load formation + validate
  SELECT * INTO v_formation
  FROM government_formations
  WHERE id = p_formation_id AND nation_id = p_nation_id;

  IF v_formation IS NULL THEN
    RETURN jsonb_build_object('error', 'Formation not found');
  END IF;

  IF v_formation.status NOT IN ('proposed', 'active') THEN
    RETURN jsonb_build_object('error', 'Formation already resolved: ' || v_formation.status);
  END IF;

  -- 2. Load nation
  SELECT * INTO v_nation FROM nations WHERE id = p_nation_id;
  IF v_nation IS NULL THEN
    RETURN jsonb_build_object('error', 'Nation not found');
  END IF;

  -- 3. Load shard
  SELECT current_tick, current_date INTO v_shard FROM shard WHERE name = 'Alpha Shard';

  -- 4. Save existing ministry discretionary balances before dissolving
  SELECT jsonb_object_agg(ministry_key, discretionary_balance)
  INTO v_saved_balances
  FROM ministries
  WHERE nation_id = p_nation_id AND is_active = true AND discretionary_balance > 0;
  v_saved_balances := COALESCE(v_saved_balances, '{}'::JSONB);

  -- 5. Dissolve old coalition/government
  UPDATE government_formations SET status = 'dissolved'
  WHERE nation_id = p_nation_id
    AND status IN ('formed', 'active', 'caretaker')
    AND id != p_formation_id;

  -- 6. Mark this formation as 'formed'
  UPDATE government_formations SET
    status = 'formed',
    formed_at = now()
  WHERE id = p_formation_id;

  -- 7. Calculate total coalition seats
  IF v_formation.party_ids IS NOT NULL THEN
    SELECT COALESCE(SUM(seats), 0) INTO v_total_seats
    FROM factions
    WHERE id = ANY(v_formation.party_ids);
  END IF;

  -- 8. Create stats snapshot for administration
  v_stats_snapshot := jsonb_build_object(
    'gdp_growth', v_nation.gdp_growth,
    'unemployment', v_nation.unemployment,
    'inflation', v_nation.inflation,
    'stability', v_nation.stability,
    'happiness', v_nation.happiness,
    'healthcare_accessibility', v_nation.healthcare_accessibility,
    'education', v_nation.education,
    'physical_infrastructure', v_nation.physical_infrastructure,
    'corruption', v_nation.corruption,
    'civil_unrest', v_nation.civil_unrest,
    'carbon_emissions', v_nation.carbon_emissions,
    'income_inequality', v_nation.income_inequality,
    'cost_of_living', v_nation.cost_of_living,
    'standard_of_living', v_nation.standard_of_living,
    'crime_rate', v_nation.crime_rate,
    'manufacturing_output', v_nation.manufacturing_output,
    'foreign_investment', v_nation.foreign_investment,
    'terrorism', v_nation.terrorism,
    'renewable_energy_percentage', v_nation.renewable_energy_percentage,
    'beds_per_100k', v_nation.beds_per_100k
  );

  v_gov_approval := COALESCE(v_nation.gov_approval, 50);

  -- Close previous administration
  UPDATE administrations SET
    ended_at_tick = v_shard.current_tick,
    ended_at_date = v_shard.current_date,
    end_reason = 'new_government',
    approval_at_end = v_gov_approval,
    stats_at_end = v_stats_snapshot,
    updated_at = now()
  WHERE nation_id = p_nation_id AND ended_at_tick IS NULL;

  -- Determine PM party
  v_pm_party_id := COALESCE(
    (v_formation.ministry_assignments->>'prime_minister')::UUID,
    v_formation.lead_party_id
  );

  -- Create new administration
  INSERT INTO administrations (
    nation_id, coalition_parties, total_seats,
    government_type, started_at_tick, started_at_date,
    stats_at_start, approval_at_start, head_of_state_title
  ) VALUES (
    p_nation_id,
    (SELECT jsonb_agg(jsonb_build_object('party_id', f.id, 'party_name', f.faction_name, 'seats', f.seats))
     FROM factions f WHERE f.id = ANY(v_formation.party_ids)),
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
  -- Fixed: derive ideology from strongest axis instead of broken fi.axis join
  SELECT f.* INTO v_pm_faction
  FROM factions f
  WHERE f.id = v_pm_party_id;

  -- Derive ideology tag from the faction's strongest axis
  SELECT CASE
    WHEN ABS(fi.liberty_equality) >= GREATEST(ABS(fi.tradition_progress), ABS(fi.security_freedom), ABS(fi.globalism_nationalism), ABS(fi.individualism_collectivism))
      THEN CASE WHEN fi.liberty_equality < 0 THEN 'Liberty' ELSE 'Equality' END
    WHEN ABS(fi.tradition_progress) >= GREATEST(ABS(fi.liberty_equality), ABS(fi.security_freedom), ABS(fi.globalism_nationalism), ABS(fi.individualism_collectivism))
      THEN CASE WHEN fi.tradition_progress < 0 THEN 'Tradition' ELSE 'Progress' END
    WHEN ABS(fi.security_freedom) >= GREATEST(ABS(fi.liberty_equality), ABS(fi.tradition_progress), ABS(fi.globalism_nationalism), ABS(fi.individualism_collectivism))
      THEN CASE WHEN fi.security_freedom < 0 THEN 'Security' ELSE 'Freedom' END
    WHEN ABS(fi.globalism_nationalism) >= GREATEST(ABS(fi.liberty_equality), ABS(fi.tradition_progress), ABS(fi.security_freedom), ABS(fi.individualism_collectivism))
      THEN CASE WHEN fi.globalism_nationalism < 0 THEN 'Nationalism' ELSE 'Globalism' END
    ELSE CASE WHEN fi.individualism_collectivism < 0 THEN 'Individualism' ELSE 'Collectivism' END
  END INTO v_pm_ideology
  FROM faction_ideology fi
  WHERE fi.faction_id = v_pm_party_id;

  IF v_pm_faction.id IS NOT NULL AND v_pm_faction.leader_first_name IS NOT NULL THEN
    DELETE FROM pm_candidates
    WHERE faction_id = v_pm_party_id AND nation_id = v_nation.id;

    -- Restore PM discretionary balance too
    v_restored_balance := COALESCE((v_saved_balances->>'prime_minister')::NUMERIC, 0);

    INSERT INTO head_of_government (
      nation_id, faction_id, first_name, last_name, age,
      ideology, appointed_tick, active
    ) VALUES (
      v_nation.id, v_pm_party_id,
      v_pm_faction.leader_first_name,
      v_pm_faction.leader_last_name,
      v_pm_faction.leader_age,
      v_pm_ideology,
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

    -- Restore discretionary balances for surviving ministries
    UPDATE ministries SET discretionary_balance = v_restored_balance
    WHERE nation_id = p_nation_id AND ministry_key = 'prime_minister' AND is_active = true;

    v_result := v_result || jsonb_build_object(
      'pm_appointed', v_pm_faction.leader_first_name || ' ' || v_pm_faction.leader_last_name,
      'pm_party', v_pm_faction.faction_name,
      'pm_ideology', v_pm_ideology
    );
  END IF;

  -- 10. Restore discretionary balances for other ministries
  FOR v_party_id IN SELECT UNNEST(v_formation.party_ids) LOOP
    NULL; -- placeholder; ministry assignment happens client-side
  END LOOP;

  -- 11. Reset failed formation attempts
  UPDATE nations SET failed_formation_attempts = 0 WHERE id = p_nation_id;

  v_result := v_result || jsonb_build_object(
    'status', 'formed',
    'formation_id', p_formation_id,
    'coalition_seats', v_total_seats,
    'nation', v_nation.name
  );

  RETURN v_result;
END;
$fn$;
