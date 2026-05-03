-- 20260806_finalize_formation_drop_dead_refs.sql
--
-- REDUCE pass on finalize_government_formation. Drops three dead
-- references inherited from 20260429 (and preserved verbatim by
-- 20260804):
--
--   1. head_of_government.ideology — column dropped by
--      20260427_sectors_phase5b_drop_ideology. The INSERT and
--      ON CONFLICT branches still wrote to it; the dead column
--      reference would crash the function the first time it
--      reached the HOG insert.
--   2. v_pm_ideology — declared, derived via a 12-line CASE on
--      faction_ideology, only consumed by the dead INSERT.
--   3. v_formation.lead_party_id — government_formations has no
--      such column. The reference sits inside a COALESCE whose
--      first arg (ministry_assignments->>'prime_minister') is
--      always set on a real formation, so it never evaluated and
--      never crashed — but it's a latent runtime error.
--
-- Body otherwise identical to 20260804. Single live writer for the
-- formation flow. ONE SOURCE OF TRUTH.
--
-- Idempotent (CREATE OR REPLACE).

BEGIN;

CREATE OR REPLACE FUNCTION finalize_government_formation(
  p_formation_id        UUID,
  p_caller_faction_id   UUID,
  p_ministry_baselines  JSONB DEFAULT '{}'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_user UUID := auth.uid();
  v_caller_faction RECORD;
  v_formation RECORD;
  v_nation RECORD;
  v_shard RECORD;
  v_result JSONB := '{}'::JSONB;
  v_pm_party_id UUID;
  v_pm_faction RECORD;
  v_total_seats INT := 0;
  v_gov_approval NUMERIC;
  v_stats_snapshot JSONB;
  v_saved_balances JSONB := '{}'::JSONB;
  v_restored_balance NUMERIC;
  v_hos_name TEXT;
  v_is_semi_pres BOOLEAN := false;
BEGIN
  -- 1. Load formation + validate
  SELECT * INTO v_formation
  FROM government_formations
  WHERE id = p_formation_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Formation not found');
  END IF;
  IF v_formation.status NOT IN ('proposed', 'active') THEN
    RETURN jsonb_build_object('error', 'Formation already resolved: ' || v_formation.status);
  END IF;

  -- ── Auth check (skip for service_role / tick processor) ─────────
  IF v_user IS NOT NULL THEN
    IF p_caller_faction_id IS NULL THEN
      RETURN jsonb_build_object('error', 'Missing caller faction id');
    END IF;

    SELECT id, linked_user_id INTO v_caller_faction
      FROM factions WHERE id = p_caller_faction_id;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('error', 'Caller faction not found');
    END IF;
    IF v_caller_faction.id <> v_user
       AND COALESCE(v_caller_faction.linked_user_id, '00000000-0000-0000-0000-000000000000'::uuid) <> v_user THEN
      RETURN jsonb_build_object('error', 'You do not own the calling faction');
    END IF;

    IF (v_formation.ministry_assignments->>'prime_minister')::UUID IS DISTINCT FROM p_caller_faction_id THEN
      RETURN jsonb_build_object('error', 'Only the Prime Minister party can finalize this formation');
    END IF;
  END IF;

  -- 2. Load nation
  SELECT * INTO v_nation FROM nations WHERE id = v_formation.nation_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Nation not found');
  END IF;

  -- 3. Load shard
  SELECT current_tick, current_date INTO v_shard FROM shard WHERE name = 'Alpha Shard';

  v_is_semi_pres := (
    v_nation.government_type ILIKE '%semi-presidential%'
    OR v_nation.government_type ILIKE '%semi_presidential%'
  );

  -- 4. Save existing ministry discretionary balances before dissolving
  SELECT jsonb_object_agg(ministry_key, discretionary_balance)
  INTO v_saved_balances
  FROM ministries
  WHERE nation_id = v_nation.id AND is_active = true AND discretionary_balance > 0;
  v_saved_balances := COALESCE(v_saved_balances, '{}'::JSONB);

  -- 5. Dissolve old coalition/government
  UPDATE government_formations SET status = 'dissolved'
  WHERE nation_id = v_nation.id
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

  -- 8. Stats snapshot for the new admin
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

  -- Close previous administration — PARLIAMENTARY ONLY.
  IF NOT v_is_semi_pres THEN
    UPDATE administrations SET
      ended_at_tick = v_shard.current_tick,
      ended_at_date = v_shard.current_date,
      end_reason = 'new_government',
      approval_at_end = v_gov_approval,
      stats_at_end = v_stats_snapshot,
      updated_at = now()
    WHERE nation_id = v_nation.id AND ended_at_tick IS NULL;
  END IF;

  -- PM party comes from the formation's ministry_assignments.
  -- (lead_party_id COALESCE branch removed — column does not exist.)
  v_pm_party_id := (v_formation.ministry_assignments->>'prime_minister')::UUID;

  IF v_pm_party_id IS NOT NULL THEN
    SELECT f.* INTO v_pm_faction FROM factions f WHERE f.id = v_pm_party_id;
  END IF;

  v_hos_name := NULLIF(TRIM(
      COALESCE(v_nation.head_of_state_first_name, '') || ' ' ||
      COALESCE(v_nation.head_of_state_last_name, '')
  ), '');

  -- Create new administration — PARLIAMENTARY ONLY.
  IF NOT v_is_semi_pres THEN
    INSERT INTO administrations (
      nation_id, coalition_parties, total_seats,
      government_type, started_at_tick, started_at_date,
      stats_at_start, approval_at_start,
      head_of_state, head_of_state_title, hos_election_method,
      pm_party_id, pm_party_name
    ) VALUES (
      v_nation.id,
      (SELECT jsonb_agg(jsonb_build_object('party_id', f.id, 'party_name', f.faction_name, 'seats', f.seats))
       FROM factions f WHERE f.id = ANY(v_formation.party_ids)),
      v_total_seats,
      COALESCE(v_nation.government_type, 'Parliamentary Democracy'),
      v_shard.current_tick,
      v_shard.current_date,
      v_stats_snapshot,
      v_gov_approval,
      v_hos_name,
      v_nation.head_of_state_title,
      v_nation.hos_election_method,
      v_pm_party_id,
      v_pm_faction.faction_name
    );
  END IF;

  UPDATE nations SET gov_approval = 50, gov_approval_events = 0
  WHERE id = v_nation.id;

  -- 9. Auto-appoint PM (party leader). HOG row no longer carries
  -- 'ideology' (dropped in 20260427); insert reflects the live schema.
  IF v_pm_faction.id IS NOT NULL AND v_pm_faction.leader_first_name IS NOT NULL THEN
    DELETE FROM pm_candidates
    WHERE faction_id = v_pm_party_id AND nation_id = v_nation.id;

    v_restored_balance := COALESCE((v_saved_balances->>'prime_minister')::NUMERIC, 0);

    INSERT INTO head_of_government (
      nation_id, faction_id, first_name, last_name, age,
      appointed_tick, active
    ) VALUES (
      v_nation.id, v_pm_party_id,
      v_pm_faction.leader_first_name,
      v_pm_faction.leader_last_name,
      v_pm_faction.leader_age,
      v_shard.current_tick,
      true
    )
    ON CONFLICT (nation_id)
    DO UPDATE SET
      faction_id     = EXCLUDED.faction_id,
      first_name     = EXCLUDED.first_name,
      last_name      = EXCLUDED.last_name,
      age            = EXCLUDED.age,
      appointed_tick = EXCLUDED.appointed_tick,
      active         = true;

    -- Defensive UPDATE of admin identity fields — PARLIAMENTARY ONLY.
    IF NOT v_is_semi_pres THEN
      UPDATE administrations SET
        prime_minister = v_pm_faction.leader_first_name || ' ' || v_pm_faction.leader_last_name,
        admin_name = v_pm_faction.leader_last_name || ' Administration',
        pm_party_name = v_pm_faction.faction_name,
        pm_party_id = v_pm_party_id
      WHERE nation_id = v_nation.id AND ended_at_tick IS NULL;
    END IF;

    -- Restore discretionary balance for the surviving PM ministry row
    UPDATE ministries SET discretionary_balance = v_restored_balance
    WHERE nation_id = v_nation.id AND ministry_key = 'prime_minister' AND is_active = true;

    v_result := v_result || jsonb_build_object(
      'pm_appointed', v_pm_faction.leader_first_name || ' ' || v_pm_faction.leader_last_name,
      'pm_party', v_pm_faction.faction_name
    );
  END IF;

  -- Reset failed formation attempts
  UPDATE nations SET failed_formation_attempts = 0 WHERE id = v_nation.id;

  v_result := v_result || jsonb_build_object(
    'status', 'formed',
    'formation_id', p_formation_id,
    'coalition_seats', v_total_seats,
    'nation', v_nation.name,
    'is_semi_pres', v_is_semi_pres
  );

  RETURN v_result;
END;
$fn$;

GRANT EXECUTE ON FUNCTION finalize_government_formation(UUID, UUID, JSONB) TO authenticated;

COMMIT;

NOTIFY pgrst, 'reload schema';
