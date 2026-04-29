-- =========================================================================
-- Tier 2 Phase 4: finalize_government_formation semi-pres skip + open-admin
-- backfill.
--
-- After Phase 3, every JS write to administrations identity fields is
-- gated correctly. But the SQL RPC finalize_government_formation
-- (20260421_finalize_formation_hos_pm_party_fields.sql) still:
--   1. Closes the open admin row on every parliamentary formation
--      (line 127-134), even in semi-pres.
--   2. INSERTs a new PM-centric admin row (line 159-180), even in
--      semi-pres.
--   3. Defensively UPDATEs the open admin row's identity fields
--      (line 233-238), even in semi-pres.
-- All three corrupt the President's admin row when a parliamentary
-- coalition forms.
--
-- This migration:
--   PART A — re-CREATEs the RPC verbatim from 20260421 with three
--            "IF NOT v_is_semi_pres THEN ... END IF" wrappers around
--            the three offending blocks. Every other line is byte-
--            identical to the prior version (PM ideology fix, HoS name
--            composition, HOG install, ministry balance restore).
--   PART B — backfills currently-open admin rows in semi-pres nations
--            whose identity points at a PM rather than the active
--            President. Closed/historical rows are NOT touched
--            (per Phase 1 decision: "fix open rows only, leave
--            history alone"). Idempotent: re-runs no-op when the
--            row is already President-centric.
--
-- Order matters: PART A first so the RPC stops creating new bad
-- rows; PART B fixes the rows that already exist.
-- =========================================================================


-- ── PART A: re-CREATE finalize_government_formation ─────────────────────

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
  v_existing_admin RECORD;
  v_saved_balances JSONB := '{}'::JSONB;
  v_restored_balance NUMERIC;
  v_hos_name TEXT;
  v_is_semi_pres BOOLEAN := false;
  cnt INT;
BEGIN
  SELECT * INTO v_formation
  FROM government_formations
  WHERE id = p_formation_id AND nation_id = p_nation_id;
  IF v_formation IS NULL THEN
    RETURN jsonb_build_object('error', 'Formation not found');
  END IF;
  IF v_formation.status NOT IN ('proposed', 'active') THEN
    RETURN jsonb_build_object('error', 'Formation already resolved: ' || v_formation.status);
  END IF;

  SELECT * INTO v_nation FROM nations WHERE id = p_nation_id;
  IF v_nation IS NULL THEN
    RETURN jsonb_build_object('error', 'Nation not found');
  END IF;

  SELECT current_tick, current_date INTO v_shard FROM shard WHERE name = 'Alpha Shard';

  -- Tier 2 Phase 4: detect semi-presidential to skip admin-row writes.
  -- In semi-pres, the admin row is bound to the PRESIDENT'S tenure,
  -- created by inauguratePresident on election. Parliamentary formation
  -- here is a sub-event within the existing presidential admin and
  -- must NOT close it or replace it with a PM-centric one.
  v_is_semi_pres := (
    v_nation.government_type ILIKE '%semi-presidential%'
    OR v_nation.government_type ILIKE '%semi_presidential%'
  );

  SELECT jsonb_object_agg(ministry_key, discretionary_balance)
  INTO v_saved_balances
  FROM ministries
  WHERE nation_id = p_nation_id AND is_active = true AND discretionary_balance > 0;
  v_saved_balances := COALESCE(v_saved_balances, '{}'::JSONB);

  UPDATE government_formations SET status = 'dissolved'
  WHERE nation_id = p_nation_id
    AND status IN ('formed', 'active', 'caretaker')
    AND id != p_formation_id;

  UPDATE government_formations SET
    status = 'formed',
    formed_at = now()
  WHERE id = p_formation_id;

  IF v_formation.party_ids IS NOT NULL THEN
    SELECT COALESCE(SUM(seats), 0) INTO v_total_seats
    FROM factions
    WHERE id = ANY(v_formation.party_ids);
  END IF;

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
    WHERE nation_id = p_nation_id AND ended_at_tick IS NULL;
  END IF;

  v_pm_party_id := COALESCE(
    (v_formation.ministry_assignments->>'prime_minister')::UUID,
    v_formation.lead_party_id
  );

  IF v_pm_party_id IS NOT NULL THEN
    SELECT f.* INTO v_pm_faction FROM factions f WHERE f.id = v_pm_party_id;
  END IF;

  v_hos_name := NULLIF(TRIM(
      COALESCE(v_nation.head_of_state_first_name, '') || ' ' ||
      COALESCE(v_nation.head_of_state_last_name, '')
  ), '');

  -- Create new administration — PARLIAMENTARY ONLY.
  -- In semi-pres, the President's admin row stays open and continues to
  -- represent the current administration; this parliamentary formation
  -- is a sub-event within it (recorded as leader_changes via installHOG).
  IF NOT v_is_semi_pres THEN
    INSERT INTO administrations (
      nation_id, coalition_parties, total_seats,
      government_type, started_at_tick, started_at_date,
      stats_at_start, approval_at_start,
      head_of_state, head_of_state_title, hos_election_method,
      pm_party_id, pm_party_name
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
      v_hos_name,
      v_nation.head_of_state_title,
      v_nation.hos_election_method,
      v_pm_party_id,
      v_pm_faction.faction_name
    );
  END IF;

  UPDATE nations SET gov_approval = 50, gov_approval_events = 0
  WHERE id = v_nation.id;

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

    -- Defensive UPDATE of admin identity fields — PARLIAMENTARY ONLY.
    -- In semi-pres the open admin row is the President's; we must not
    -- overwrite its identity with PM data. The pm_party_name was
    -- already filled at INSERT (above) for parliamentary; this block
    -- handles legacy rows whose pm fields were left blank.
    IF NOT v_is_semi_pres THEN
      UPDATE administrations SET
        prime_minister = v_pm_faction.leader_first_name || ' ' || v_pm_faction.leader_last_name,
        admin_name = v_pm_faction.leader_last_name || ' Administration',
        pm_party_name = v_pm_faction.faction_name,
        pm_party_id = v_pm_party_id
      WHERE nation_id = v_nation.id AND ended_at_tick IS NULL;
    END IF;

    UPDATE ministries SET discretionary_balance = v_restored_balance
    WHERE nation_id = p_nation_id AND ministry_key = 'prime_minister' AND is_active = true;

    v_result := v_result || jsonb_build_object(
      'pm_appointed', v_pm_faction.leader_first_name || ' ' || v_pm_faction.leader_last_name,
      'pm_party', v_pm_faction.faction_name,
      'pm_ideology', v_pm_ideology
    );
  END IF;

  FOR v_party_id IN SELECT UNNEST(v_formation.party_ids) LOOP
    NULL;
  END LOOP;

  UPDATE nations SET failed_formation_attempts = 0 WHERE id = p_nation_id;

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


-- ── PART B: backfill open admin rows in semi-pres nations ────────────────

-- Find every semi-pres nation whose currently-open admin row points at a
-- PM (or has stale president identity) and reconcile it to the active
-- President. Closed/historical rows are not touched.
--
-- Reconciliation method: UPDATE-in-place. Sets the President's identity
-- on the open admin row, clears PM-centric identity (those are now
-- recorded as leader_changes events on the same row, not as the row's
-- own identity).

WITH active_presidents AS (
    SELECT
        p.nation_id,
        p.faction_id     AS pres_faction_id,
        p.elected_tick,
        p.first_name     AS pres_first,
        p.last_name      AS pres_last,
        f.faction_name   AS pres_party_name
    FROM presidents p
    JOIN factions f ON f.id = p.faction_id
    WHERE p.is_active = true
),
semi_pres_open_admins AS (
    SELECT
        a.id,
        a.nation_id,
        a.president_party_id,
        ap.pres_faction_id,
        ap.pres_first,
        ap.pres_last,
        ap.pres_party_name
    FROM administrations a
    JOIN nations n
        ON n.id = a.nation_id
        AND (n.government_type ILIKE '%semi-presidential%'
          OR n.government_type ILIKE '%semi_presidential%')
    JOIN active_presidents ap ON ap.nation_id = a.nation_id
    WHERE a.ended_at_tick IS NULL
      AND (
          a.president_party_id IS DISTINCT FROM ap.pres_faction_id
          OR a.president_name IS NULL
          OR a.president_name <> TRIM(ap.pres_first || ' ' || ap.pres_last)
      )
)
UPDATE administrations a
SET
    president_party_id    = s.pres_faction_id,
    president_name        = TRIM(s.pres_first || ' ' || s.pres_last),
    president_party_name  = s.pres_party_name,
    admin_name            = s.pres_last || ' Administration',
    -- Clear PM-centric identity — those are recorded as leader_changes
    -- events on this row, not as the row's primary identity.
    pm_party_id           = NULL,
    pm_party_name         = NULL,
    prime_minister        = NULL,
    updated_at            = now()
FROM semi_pres_open_admins s
WHERE a.id = s.id;

-- ── Verify ──────────────────────────────────────────────────────────────

-- Every open admin row in a semi-pres nation should now have its
-- president_party_id matching the active president.
SELECT
    n.name AS nation,
    a.admin_name,
    a.president_name,
    a.president_party_id,
    p.faction_id AS active_pres_faction_id,
    (a.president_party_id = p.faction_id) AS reconciled
FROM administrations a
JOIN nations n ON n.id = a.nation_id
LEFT JOIN presidents p ON p.nation_id = a.nation_id AND p.is_active = true
WHERE a.ended_at_tick IS NULL
  AND (n.government_type ILIKE '%semi-presidential%'
    OR n.government_type ILIKE '%semi_presidential%')
ORDER BY n.name;
