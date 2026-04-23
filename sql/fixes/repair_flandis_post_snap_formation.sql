-- ════════════════════════════════════════════════════════════════════════════════
-- Repair Flandis post-snap formation state
--
-- Bug: After a PM-called snap election concluded in Flandis, the Election sub-tab
-- rendered "Government Formed — A coalition government is currently active" instead
-- of the coalition formation UI, and the Administrative tab still labeled the prior
-- Van Rijn Administration as CURRENT with a stale SDAP coalition.
--
-- Root causes (now fixed in code):
--   1. processGovernmentVacancy used POST_SNAP_DEADLINE_TICKS (2) post-snap, which
--      starved the player of a real formation window before Stage 2 fired.
--   2. coalition-formation.js gated the formation UI on a stale active HoG row,
--      hiding the UI even when no current-cycle formed coalition existed.
--
-- This script cleans up the live Flandis state so the formation UI appears on the
-- next page load. Idempotent — safe to re-run.
-- ════════════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
    v_nation_id     uuid;
    v_election_id   uuid;
    v_election_tick int;
    v_shard_date    text;
BEGIN
    SELECT id INTO v_nation_id FROM nations WHERE name = 'Flandis';
    IF v_nation_id IS NULL THEN
        RAISE NOTICE 'Flandis nation row not found — nothing to repair.';
        RETURN;
    END IF;

    -- Latest completed election (the post-snap one). The new coalition must be
    -- tied to this election; everything older gets cleaned up.
    SELECT id, election_tick
      INTO v_election_id, v_election_tick
      FROM elections
     WHERE nation_id = v_nation_id
       AND status = 'completed'
       AND results IS NOT NULL
     ORDER BY election_tick DESC
     LIMIT 1;

    SELECT current_date INTO v_shard_date FROM shard WHERE name = 'Alpha Shard';

    -- 1. Dissolve every formed/active/caretaker government_formations row that is
    --    not tied to the latest completed election.
    UPDATE government_formations
       SET status = 'dissolved'
     WHERE nation_id = v_nation_id
       AND status IN ('formed', 'active', 'caretaker')
       AND (election_id IS DISTINCT FROM v_election_id);

    -- 2. Dissolve any active legacy active_coalitions row.
    UPDATE active_coalitions
       SET status = 'dissolved',
           dissolved_at = now()
     WHERE nation_id = v_nation_id
       AND dissolved_at IS NULL;

    -- 3. Deactivate any active head_of_government row. Formation will create a
    --    fresh row when the new coalition is sworn in.
    UPDATE head_of_government
       SET active = false
     WHERE nation_id = v_nation_id
       AND active = true;

    -- 4. Vacate active ministries — incoming coalition assigns ministers.
    UPDATE ministries
       SET minister_first_name = NULL,
           minister_last_name = NULL,
           minister_age = NULL,
           party_id = NULL
     WHERE nation_id = v_nation_id
       AND is_active = true;

    -- 5. Close the open administration row so a fresh one can open on formation.
    UPDATE administrations
       SET ended_at_tick = COALESCE(v_election_tick, ended_at_tick),
           ended_at_date = COALESCE(v_shard_date, ended_at_date),
           end_reason    = 'dissolved',
           updated_at    = now()
     WHERE nation_id = v_nation_id
       AND ended_at_tick IS NULL;

    -- 6. Reset failed_formation_attempts so the new formation window starts fresh.
    UPDATE nations
       SET failed_formation_attempts = 0
     WHERE id = v_nation_id;

    RAISE NOTICE 'Flandis post-snap state repaired. Latest election: %', v_election_id;
END $$;
