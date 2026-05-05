-- 20260906_finalize_formation_atomic_ministries.sql
--
-- Phase C consolidation. Pulls the last three pieces of the Form
-- Government flow off the JS layer and into the single SQL transaction
-- inside finalize_government_formation. Before this migration:
--
--   - JS createMinistriesFromAssignments wrote 11+ ministry rows AFTER
--     the RPC returned. If JS crashed mid-loop (or never ran — see the
--     ideology.tag bug in autoAppointPartyLeaderAsPM that was caught
--     during the Sangreza/Calveth/Sierramar incident) the RPC's admin
--     row landed but the cabinet was empty / stale.
--   - JS autoAppointPartyLeaderAsPM emitted the pm_appointed event_log
--     row separately. Same half-state risk.
--   - The previous admin's ministers were not vacated — JS overwrote
--     them via "update if exists, insert if not." Anything assigned to
--     a ministry under the prior admin that the new coalition didn't
--     re-assign would silently persist.
--
-- After this migration:
--
--   1. The RPC vacates every non-PM minister BEFORE the new inserts.
--      Same write shape as orphanCabinet (js/game/elections.js:781) so
--      the contract matches Phase B's invariant.
--   2. The RPC loops over ministry_assignments + minister_names + the
--      p_ministry_baselines JSONB and upserts each ministry row.
--      Skips 'prime_minister' — the existing HOG insert/upsert owns
--      that side.
--   3. The RPC inserts a single pm_appointed event_log row inside the
--      same transaction.
--
-- Net: every formation write happens inside one transaction. Either
-- the entire transition lands or the database state is untouched.
-- Phase C is the lock-solid version of Form Government the user asked
-- for.
--
-- Idempotent (CREATE OR REPLACE). Safe to deploy ahead of the JS
-- changes — old JS calls the new RPC, then runs its own
-- createMinistriesFromAssignments which becomes a redundant idempotent
-- UPDATE on rows the RPC already wrote correctly. Once the JS-side
-- code lands the deletion is a no-op cleanup.
--
-- The SECURITY DEFINER context lets the RPC bypass RLS to write
-- ministries / event_log; same as it already bypasses RLS for
-- administrations and head_of_government.

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
  -- Phase C additions:
  v_ministry_key TEXT;
  v_ministry_party UUID;
  v_minister JSONB;
  v_ministry_name TEXT;
  v_baselines JSONB;
  -- Source-of-truth ministry display-name map. Mirrors
  -- MINISTRY_OFFICE_NAMES in js/game/government-types.js.
  -- If you add a ministry there, add it here.
  v_office_names CONSTANT JSONB := jsonb_build_object(
    'prime_minister', 'Prime Minister',
    'interior',       'Ministry of the Interior',
    'foreign',        'Foreign Ministry',
    'defense',        'Ministry of Defense',
    'finance',        'Ministry of Finance',
    'education',      'Ministry of Education',
    'healthcare',     'Ministry of Healthcare',
    'labor',          'Ministry of Labor',
    'justice',        'Ministry of Justice',
    'trade',          'Ministry of Trade',
    'energy',         'Ministry of Energy',
    'transportation', 'Ministry of Transportation',
    'security',       'Ministry of Security'
  );
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

  -- ── Auth check (skip for service_role / tick processor / admin) ─────
  -- is_admin() returns true for users in the moderation table set up
  -- by 20260424_phase5_moderation.sql. Admin override on the client
  -- side means the operator is logged in as themselves but
  -- impersonating a different faction; the JS faction-ownership
  -- check would fail without this bypass, but the RPC needs to honor
  -- the admin context the same way it honors service_role.
  IF v_user IS NOT NULL AND NOT is_admin() THEN
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

  -- ── Phase C: vacate the previous cabinet inside the same
  -- transaction. Mirrors orphanCabinet's UPDATE shape exactly. Runs
  -- only for parliamentary nations — semi-pres has its own rotation
  -- model and does not flip ministers on every formation. Without
  -- this, ministers from the previous coalition that the new
  -- coalition doesn't re-assign would silently persist.
  IF NOT v_is_semi_pres THEN
    UPDATE ministries SET
      minister_first_name = NULL,
      minister_last_name  = NULL,
      minister_age        = NULL,
      party_id            = NULL
    WHERE nation_id = v_nation.id
      AND is_active = true;
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

    -- ── Phase C: pm_appointed event_log inside the same
    -- transaction. Mirrors what autoAppointPartyLeaderAsPM emits
    -- on the JS side; the JS call goes away once Phase C lands.
    INSERT INTO event_log (
      nation_id, event_name, trigger_key, description_used, category, fired_at_tick
    ) VALUES (
      v_nation.id,
      'PM_APPOINTED',
      'pm_appointed',
      'Auto-appointed party leader as PM: ' ||
        v_pm_faction.leader_first_name || ' ' || v_pm_faction.leader_last_name ||
        ' for faction ' || v_pm_faction.faction_name,
      'POLITICAL',
      v_shard.current_tick
    );

    v_result := v_result || jsonb_build_object(
      'pm_appointed', v_pm_faction.leader_first_name || ' ' || v_pm_faction.leader_last_name,
      'pm_party', v_pm_faction.faction_name
    );
  END IF;

  -- ── Phase C: insert/upsert non-PM ministry rows from formation
  -- assignments. PARLIAMENTARY ONLY (semi-pres ministers go through
  -- the per-confirmation flow, not the formation flow). Skips
  -- 'prime_minister' — HOG above owns that. Reads minister_names
  -- from the formation row (handleFormGovernment populates it before
  -- calling the RPC) and stat baselines from p_ministry_baselines.
  -- Without this, the cabinet panel reads stale or empty rows after
  -- the cabinet-vacate UPDATE above.
  IF NOT v_is_semi_pres THEN
    FOR v_ministry_key, v_ministry_party IN
      SELECT key, value::UUID
      FROM jsonb_each_text(v_formation.ministry_assignments)
      WHERE key <> 'prime_minister'
        AND value IS NOT NULL AND value <> ''
    LOOP
      v_minister     := COALESCE(v_formation.minister_names->v_ministry_key, '{}'::JSONB);
      v_ministry_name := COALESCE(v_office_names->>v_ministry_key, v_ministry_key);
      v_baselines    := COALESCE(p_ministry_baselines->v_ministry_key, '{}'::JSONB);

      -- ON CONFLICT requires a constraint; the (nation_id, ministry_key)
      -- pair isn't necessarily unique-constrained at this schema rev,
      -- so do an explicit UPDATE-then-INSERT-if-zero pattern that
      -- matches js createMinistriesFromAssignments.
      UPDATE ministries SET
        party_id            = v_ministry_party,
        minister_first_name = v_minister->>'first_name',
        minister_last_name  = v_minister->>'last_name',
        minister_age        = NULLIF(v_minister->>'age','')::INT,
        minister_approval   = 50,
        stat_baselines      = v_baselines,
        is_active           = true
      WHERE nation_id = v_nation.id
        AND ministry_key = v_ministry_key
        AND is_active = true;

      IF NOT FOUND THEN
        INSERT INTO ministries (
          nation_id, ministry_key, ministry_name,
          party_id, minister_first_name, minister_last_name,
          minister_age, minister_approval, stat_baselines, is_active
        ) VALUES (
          v_nation.id, v_ministry_key, v_ministry_name,
          v_ministry_party,
          v_minister->>'first_name',
          v_minister->>'last_name',
          NULLIF(v_minister->>'age','')::INT,
          50,
          v_baselines,
          true
        );
      END IF;
    END LOOP;
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
