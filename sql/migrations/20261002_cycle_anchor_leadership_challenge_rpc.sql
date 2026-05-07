-- 20261002_cycle_anchor_leadership_challenge_rpc.sql
--
-- Keep Leadership Challenge aligned with fetchActiveCoalition(): only the
-- latest completed election's formed/caretaker government counts as an active
-- coalition in parliamentary/constitutional-monarchy systems. This avoids the
-- UI and RPC disagreeing when old admin/ministry data exists but there is no
-- current government_formations row for the election cycle.

BEGIN;

CREATE OR REPLACE FUNCTION claim_leadership_challenge(
    p_nation_id   UUID,
    p_faction_id  UUID
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_caller       UUID := auth.uid();
    v_faction      factions%ROWTYPE;
    v_nation       nations%ROWTYPE;
    v_tick         INT;
    v_hog_id       UUID;
    v_party_ids    UUID[];
    v_latest_election_id UUID;
    v_gov_type     TEXT;
    v_is_par       BOOLEAN;
BEGIN
    IF p_nation_id IS NULL OR p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_args');
    END IF;

    SELECT * INTO v_faction FROM factions WHERE id = p_faction_id;
    IF v_faction.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_faction');
    END IF;

    IF v_caller IS NOT NULL
       AND NOT is_admin()
       AND v_faction.id <> v_caller
       AND v_faction.linked_user_id IS DISTINCT FROM v_caller THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    IF v_faction.leader_first_name IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_leader');
    END IF;
    IF COALESCE(v_faction.seats, 0) <= 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_seats');
    END IF;

    SELECT * INTO v_nation FROM nations WHERE id = p_nation_id;
    IF v_nation.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_nation');
    END IF;
    v_gov_type := lower(COALESCE(v_nation.government_type, ''));
    v_is_par := (v_gov_type LIKE '%parliamentary%' OR v_nation.hos_election_method = 'hereditary')
                AND v_gov_type NOT LIKE '%absolute monarchy%'
                AND NOT (v_gov_type LIKE '%presidential%' AND v_gov_type NOT LIKE '%semi%')
                AND v_gov_type NOT LIKE '%semi-presidential%'
                AND v_gov_type NOT LIKE '%semi_presidential%';
    IF NOT v_is_par THEN
        RETURN jsonb_build_object('success', false, 'reason', 'wrong_gov_type');
    END IF;

    SELECT id INTO v_hog_id FROM head_of_government
        WHERE nation_id = p_nation_id AND active = true LIMIT 1;
    IF v_hog_id IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'pm_already_installed');
    END IF;

    SELECT id INTO v_latest_election_id
    FROM elections
    WHERE nation_id = p_nation_id
      AND status = 'completed'
      AND results IS NOT NULL
    ORDER BY election_tick DESC
    LIMIT 1;

    SELECT party_ids INTO v_party_ids FROM government_formations
        WHERE nation_id = p_nation_id
          AND status IN ('formed', 'caretaker')
          AND (v_latest_election_id IS NULL OR election_id = v_latest_election_id)
        ORDER BY formed_at DESC NULLS LAST, created_at DESC LIMIT 1;
    IF v_party_ids IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_coalition');
    END IF;
    IF NOT (p_faction_id = ANY(v_party_ids)) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_in_coalition');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;

    BEGIN
        INSERT INTO leadership_challenges (
            nation_id, faction_id, claimed_at_tick, seats_at_claim
        ) VALUES (
            p_nation_id, p_faction_id, v_tick, v_faction.seats
        );
    EXCEPTION WHEN unique_violation THEN
        RETURN jsonb_build_object('success', true, 'already_claimed', true);
    END;

    RETURN jsonb_build_object('success', true, 'claimed_at_tick', v_tick);
END;
$$;

GRANT EXECUTE ON FUNCTION claim_leadership_challenge(UUID, UUID) TO authenticated;

COMMENT ON FUNCTION claim_leadership_challenge(UUID, UUID) IS
  'Coalition member claims the vacant Premiership for the next-tick resolveLeadershipChallenges sweep. Uses the latest completed election formed/caretaker government as the active coalition source of truth; admin inspector sessions bypass only the faction ownership check.';

NOTIFY pgrst, 'reload schema';

COMMIT;
