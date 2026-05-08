-- ════════════════════════════════════════════════════════════════
-- form_minority_government: drop the redundant ministry deactivation.
--
-- Reported: post-formation cabinet showed "Cabinet · 0 / No cabinet
-- assembled" instead of the expected vacant-slot view. PM seated
-- correctly, but every other portfolio invisible.
--
-- Cause: 20261003 added a post-finalize UPDATE that flipped every
-- non-PM ministry to is_active=false. The cabinet UI at
-- government.html:1640-1665 reads ministries WHERE is_active=true,
-- excludes prime_minister, and falls back to "No cabinet assembled"
-- when zero rows remain. The deactivation made every slot disappear.
--
-- finalize_government_formation already nulls party_id and minister
-- fields on every active ministry (20260910:185-193) before seating
-- the PM, so the rows are vacant after finalize regardless. The
-- deactivation step in form_minority_government was duplicating
-- "vacate the slot" with the wrong mechanism — flipping is_active
-- instead of just letting the nulled rows render as empty.
--
-- Drop the UPDATE. Cabinet UI will render the full ministry roster
-- with PM seated and the rest vacant; existing appoint-minister
-- flow (confirmAssign in government.html) handles re-staffing.
--
-- Idempotent (CREATE OR REPLACE).
--
-- One-shot repair: nations that already formed an emergency_minority
-- under the buggy version have orphaned inactive ministries the new
-- code path won't restore. The block at the bottom reactivates them
-- where the formation is still the live one and finalize had nulled
-- the slot — narrow filter so this can't accidentally re-enable a
-- portfolio that was deactivated for an unrelated reason.
-- ════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION form_minority_government(p_nation_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_caller            UUID := auth.uid();
    v_caller_faction    factions%ROWTYPE;
    v_nation            nations%ROWTYPE;
    v_tick              INT;
    v_election          RECORD;
    v_existing          RECORD;
    v_largest_active    factions%ROWTYPE;
    v_majority_seats    INT;
    v_total_seats       INT;
    v_formation_id      UUID;
    v_finalize_result   JSONB;
    v_inactive_thresh   INT := 4;  -- mirror INACTIVITY_TICKS in coalition-formation.js:47
    v_deadline_ticks    INT := 3;  -- mirror FORMATION_DEADLINE_TICKS in config.js:145
BEGIN
    IF p_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_nation');
    END IF;

    SELECT * INTO v_nation FROM nations WHERE id = p_nation_id;
    IF v_nation.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_nation');
    END IF;

    -- Absolute monarchy: PM is appointed by the Monarch directly,
    -- there's no coalition-formation deadlock to break.
    IF v_nation.government_type ILIKE '%absolute%monarchy%' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_parliamentary');
    END IF;

    -- Caller must own a party in this nation. Admin override skips
    -- this lookup; v_caller_faction gets assigned to v_largest_active
    -- below so all downstream INSERTs attribute to CPP (or whichever
    -- party qualifies as largest active).
    IF NOT is_admin() THEN
        SELECT * INTO v_caller_faction FROM factions
            WHERE faction_type = 'party'
              AND nation_id = p_nation_id
              AND (id = v_caller OR linked_user_id = v_caller)
            LIMIT 1;
        IF v_caller_faction.id IS NULL THEN
            RETURN jsonb_build_object('success', false, 'reason', 'not_party_leader');
        END IF;
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;

    -- Latest completed election for this nation. The vacancy gate
    -- only makes sense post-election.
    SELECT id, election_tick INTO v_election FROM elections
        WHERE nation_id = p_nation_id
          AND status = 'completed'
          AND results IS NOT NULL
        ORDER BY election_tick DESC
        LIMIT 1;
    IF v_election.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_election');
    END IF;

    -- Formation deadline gate. Cannot form minority gov until the
    -- normal coalition-building window has elapsed — otherwise this
    -- becomes the meta and coalitions stop forming altogether.
    IF v_tick < v_election.election_tick + v_deadline_ticks THEN
        RETURN jsonb_build_object('success', false, 'reason', 'gate_not_elapsed',
            'opens_at_tick', v_election.election_tick + v_deadline_ticks);
    END IF;

    -- If a party already has outright majority, the player should
    -- form a normal single-party majority via the regular coalition
    -- flow; minority gov is for the deadlock case only.
    v_total_seats := COALESCE(v_nation.total_seats, 100);
    v_majority_seats := (v_total_seats / 2) + 1;
    IF EXISTS (
        SELECT 1 FROM factions
        WHERE nation_id = p_nation_id
          AND faction_type = 'party'
          AND seats >= v_majority_seats
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'majority_exists');
    END IF;

    -- A coalition (formed or caretaker) already exists for this
    -- nation. Don't double-seat governments.
    SELECT id, status, formation_type INTO v_existing FROM government_formations
        WHERE nation_id = p_nation_id
          AND status IN ('formed', 'caretaker')
        ORDER BY created_at DESC
        LIMIT 1;
    IF v_existing.id IS NOT NULL THEN
        IF v_existing.formation_type = 'emergency_minority' THEN
            RETURN jsonb_build_object('success', false, 'reason', 'already_minority');
        END IF;
        RETURN jsonb_build_object('success', false, 'reason', 'coalition_exists');
    END IF;

    -- Caller must be the largest active party.
    -- "Active" mirrors the UI's INACTIVITY_TICKS threshold: a party
    -- whose linked_user_id has touched the game within the last 4
    -- ticks. Tiebreak is deterministic (id ASC) so two players in
    -- the same tick with equal seats can't both win the race.
    SELECT * INTO v_largest_active FROM factions
        WHERE nation_id = p_nation_id
          AND faction_type = 'party'
          AND seats > 0
          AND COALESCE(last_seen_tick, 0) >= v_tick - v_inactive_thresh
        ORDER BY seats DESC, id ASC
        LIMIT 1;
    IF v_largest_active.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_active_parties');
    END IF;
    -- Admin acts as the largest active party (the one entitled to
    -- form the minority gov under normal rules). For non-admin, the
    -- caller must BE the largest active party.
    IF is_admin() THEN
        v_caller_faction := v_largest_active;
    ELSIF v_largest_active.id <> v_caller_faction.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_largest_active');
    END IF;

    -- ── All gates passed; create the formation ──────────────────────

    -- Insert a single-party minority formation row. ministry_assignments
    -- carries only prime_minister — finalize_government_formation
    -- requires that key for its own auth check, and downstream code
    -- doesn't try to seat ministers that aren't in the map.
    INSERT INTO government_formations (
        nation_id, election_id, proposed_by, status,
        party_ids, ministry_assignments, formation_type
    ) VALUES (
        p_nation_id, v_election.id, v_caller_faction.id, 'active',
        ARRAY[v_caller_faction.id]::UUID[],
        jsonb_build_object('prime_minister', v_caller_faction.id),
        'emergency_minority'
    )
    RETURNING id INTO v_formation_id;

    -- Delegate to the existing finalizer. Atomically: dissolves
    -- rivals, marks the row 'formed' with formed_at=NOW(), nulls
    -- party_id + minister fields on every previously-active ministry
    -- (so portfolios start vacant), seats the PM, creates a new
    -- administration, resets gov_approval. finalize already has its
    -- own is_admin() bypass (20260910:91).
    --
    -- The non-PM ministries stay is_active=true with party_id=NULL.
    -- The cabinet UI renders them as vacant slots; the PM re-staffs
    -- them via the existing appoint-minister flow.
    v_finalize_result := finalize_government_formation(
        v_formation_id,
        v_caller_faction.id,
        '{}'::JSONB
    );
    IF v_finalize_result ? 'error' THEN
        RAISE EXCEPTION 'finalize_failed: %', v_finalize_result->>'error';
    END IF;

    -- Stamp the tick mirror so the tick processor's auto-snap timer
    -- has an integer reference. finalize set formed_at=NOW() but
    -- doesn't know about formed_at_tick (separate column).
    UPDATE government_formations
       SET formed_at_tick = v_tick
     WHERE id = v_formation_id;

    INSERT INTO event_log (
        nation_id, event_name, category, trigger_key,
        description_chosen, fired_at_tick
    ) VALUES (
        p_nation_id,
        'Minority Government Formed',
        'political',
        'emergency_minority_government',
        format('%s has formed a minority government in %s after coalition negotiations failed. Bills face a -20%% effective YES-vote penalty until a stable coalition replaces this government, with a snap election scheduled in 36 ticks.',
               COALESCE(v_caller_faction.faction_name, 'A party'),
               COALESCE(v_nation.name, 'Unknown')),
        v_tick
    );

    RETURN jsonb_build_object(
        'success',           true,
        'formation_id',      v_formation_id,
        'pm_party',          v_caller_faction.faction_name,
        'formed_at_tick',    v_tick,
        'auto_snap_at_tick', v_tick + 36
    );
END;
$$;

GRANT EXECUTE ON FUNCTION form_minority_government(UUID) TO authenticated;

COMMENT ON FUNCTION form_minority_government(UUID) IS
    'Player-triggered minority government formation. Caller must be leader of the largest active party (last_seen_tick within 4 ticks); admin override bypasses both the party-ownership lookup and the largest-active comparison, acting as the largest active party for attribution. Gates: post-election formation deadline (3 ticks) elapsed, no existing formed/caretaker coalition, no party with outright majority, parliamentary government type. Inserts an emergency_minority formation and delegates to finalize_government_formation; the PM is seated and all other portfolios are left active-but-vacant for the cabinet UI to render as empty slots. Bills face a -20%% effective YES-vote penalty (bills.js:1112). Auto-snap election fires from the tick processor at formed_at_tick + 36.';

-- ── One-shot repair for nations formed under the buggy version ──
-- Reactivate ministries that were deactivated by the prior RPC's
-- post-finalize UPDATE. Filter narrowly: only nations whose live
-- formation is the emergency_minority one, and only ministries that
-- finalize had vacated (party_id IS NULL) — so we can't accidentally
-- re-enable a portfolio that was off for an unrelated reason.
UPDATE ministries m
   SET is_active = true
  FROM government_formations gf
 WHERE gf.nation_id = m.nation_id
   AND gf.status = 'formed'
   AND gf.formation_type = 'emergency_minority'
   AND m.is_active = false
   AND m.party_id IS NULL
   AND m.ministry_key <> 'prime_minister';

NOTIFY pgrst, 'reload schema';

COMMIT;
