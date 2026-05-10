-- ════════════════════════════════════════════════════════════════
-- Two related fixes, atomic in one migration:
--
-- 1. Rename nations.control → nations.state_apparatus.
--    Commit 4ed35e3 (May 9) updated NATION_STAT_COLUMNS, in-memory
--    stat constants, and several Supabase select/update sites in
--    elections.js, political-actions.js, etc. to use 'state_apparatus'.
--    The commit message claimed the user manually renamed both
--    nations.control AND nations_history.control, but a 2026-05-10
--    information_schema check confirms nations.control still exists
--    and nations.state_apparatus does not. The rename was never
--    applied to nations on prod.
--
--    Effect of the silent gap:
--      - Recent code paths reading nation.state_apparatus (target-based
--        engine, callEarlyElectionsAction, dissolveParliament) would
--        42703 the moment they fire.
--      - snapshotNationHistory + recordStatHistory write to history
--        with key 'state_apparatus' but read nation['state_apparatus']
--        which is undefined, so the column is silently skipped from
--        every snapshot.
--      - finalize_government_formation reads v_nation.control (legacy
--        name); works today but blocks the line-150 fix below.
--
-- 2. Update v_stats_snapshot in finalize_government_formation to use
--    'state_apparatus' (both the JSONB key and the column read).
--    Until now the snapshot wrote a 'control' key, which
--    computeAdminChanges (government.html:12377) iterates against
--    STATS_HIGHER_IS_BETTER — that array uses 'state_apparatus' so
--    'control' deltas were silently skipped from the player-visible
--    achievements/challenges feed.
--
-- All other RPC logic preserved verbatim from 20261119 (which
-- preserved the per-ministry UPSERT bug fix).
--
-- Idempotent: column rename guarded by information_schema check;
-- function uses CREATE OR REPLACE.
-- ════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Rename nations.control → state_apparatus ───────────────
DO $do$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name   = 'nations'
           AND column_name  = 'control'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name   = 'nations'
           AND column_name  = 'state_apparatus'
    ) THEN
        ALTER TABLE public.nations RENAME COLUMN control TO state_apparatus;
    END IF;
END
$do$;


-- ── 2. Re-issue finalize_government_formation ────────────────
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
  v_ministry_key TEXT;
  v_ministry_party UUID;
  v_minister JSONB;
  v_ministry_name TEXT;
  v_baselines JSONB;
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
    'sports',         'Ministry of Sports',
    'security',       'Ministry of Security'
  );
BEGIN
  SELECT * INTO v_formation FROM government_formations WHERE id = p_formation_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Formation not found');
  END IF;
  IF v_formation.status NOT IN ('proposed', 'active') THEN
    RETURN jsonb_build_object('error', 'Formation already resolved: ' || v_formation.status);
  END IF;

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

  SELECT * INTO v_nation FROM nations WHERE id = v_formation.nation_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Nation not found');
  END IF;

  SELECT current_tick, current_date INTO v_shard FROM shard WHERE name = 'Alpha Shard';

  v_is_semi_pres := (
    v_nation.government_type ILIKE '%semi-presidential%'
    OR v_nation.government_type ILIKE '%semi_presidential%'
  );

  SELECT jsonb_object_agg(ministry_key, discretionary_balance)
  INTO v_saved_balances
  FROM ministries
  WHERE nation_id = v_nation.id AND is_active = true AND discretionary_balance > 0;
  v_saved_balances := COALESCE(v_saved_balances, '{}'::JSONB);

  UPDATE government_formations SET status = 'dissolved'
  WHERE nation_id = v_nation.id
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

  -- 4ed35e3 fix: was 'control', v_nation.control. Renamed to canonical
  -- alpha column so computeAdminChanges (which reads STATS_HIGHER_IS_BETTER
  -- for 'state_apparatus') surfaces deltas in achievements/challenges.
  -- Reads nations.state_apparatus (renamed from .control by step 1 above).
  v_stats_snapshot := jsonb_build_object(
    'gdp_growth',         v_nation.gdp_growth,
    'debt',               v_nation.debt,
    'immigration',        v_nation.immigration,
    'standard_of_living', v_nation.standard_of_living,
    'cost_of_living',     v_nation.cost_of_living,
    'budget',             v_nation.budget,
    'state_apparatus',    v_nation.state_apparatus,
    'unrest',             v_nation.unrest,
    'public_approval',    v_nation.public_approval,
    'crown_authority',    v_nation.crown_authority,
    'energy',             v_nation.energy,
    'health',             v_nation.health,
    'education',          v_nation.education,
    'global_image',       v_nation.global_image,
    'infrastructure',     v_nation.infrastructure,
    'industry',           v_nation.industry,
    'farmland',           v_nation.farmland,
    'service_sector',     v_nation.service_sector,
    'unskilled_workers',  v_nation.unskilled_workers,
    'skilled_workers',    v_nation.skilled_workers,
    'wages',              v_nation.wages,
    'income_tax',         v_nation.income_tax,
    'corporate_tax',      v_nation.corporate_tax,
    'crime',              v_nation.crime,
    'corruption',         v_nation.corruption,
    'inequality',         v_nation.inequality
  );

  v_gov_approval := COALESCE(v_nation.gov_approval, 50);

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

  IF NOT v_is_semi_pres THEN
    UPDATE ministries SET
      minister_first_name = NULL,
      minister_last_name  = NULL,
      minister_age        = NULL,
      party_id            = NULL
    WHERE nation_id = v_nation.id
      AND is_active = true;
  END IF;

  v_pm_party_id := (v_formation.ministry_assignments->>'prime_minister')::UUID;

  IF v_pm_party_id IS NOT NULL THEN
    SELECT f.* INTO v_pm_faction FROM factions f WHERE f.id = v_pm_party_id;
  END IF;

  v_hos_name := NULLIF(TRIM(
      COALESCE(v_nation.head_of_state_first_name, '') || ' ' ||
      COALESCE(v_nation.head_of_state_last_name, '')
  ), '');

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

  IF v_pm_faction.id IS NOT NULL AND v_pm_faction.leader_first_name IS NOT NULL THEN
    DELETE FROM pm_candidates
    WHERE faction_id = v_pm_party_id AND nation_id = v_nation.id;

    v_restored_balance := COALESCE((v_saved_balances->>'prime_minister')::NUMERIC, 0);

    UPDATE head_of_government
    SET active = false
    WHERE nation_id = v_nation.id AND active = true;

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
    );

    IF NOT v_is_semi_pres THEN
      UPDATE administrations SET
        prime_minister = v_pm_faction.leader_first_name || ' ' || v_pm_faction.leader_last_name,
        admin_name = v_pm_faction.leader_last_name || ' Administration',
        pm_party_name = v_pm_faction.faction_name,
        pm_party_id = v_pm_party_id
      WHERE nation_id = v_nation.id AND ended_at_tick IS NULL;
    END IF;

    UPDATE ministries SET discretionary_balance = v_restored_balance
    WHERE nation_id = v_nation.id AND ministry_key = 'prime_minister' AND is_active = true;

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

      -- 20261119 fix: dropped "AND is_active = true" so the UPDATE
      -- matches inactive rows from prior governments and reactivates
      -- them in place. Without this, INSERT below 23505'd on
      -- ministries_nation_ministry_unique.
      UPDATE ministries SET
        party_id            = v_ministry_party,
        minister_first_name = v_minister->>'first_name',
        minister_last_name  = v_minister->>'last_name',
        minister_age        = NULLIF(v_minister->>'age','')::INT,
        minister_approval   = 50,
        stat_baselines      = v_baselines,
        is_active           = true
      WHERE nation_id = v_nation.id
        AND ministry_key = v_ministry_key;

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
