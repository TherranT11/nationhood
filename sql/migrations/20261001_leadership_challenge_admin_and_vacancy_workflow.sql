-- 20261001_leadership_challenge_admin_and_vacancy_workflow.sql
--
-- Fix two related PM-vacancy workflow problems:
--   1. Admin inspector sessions can act as a party in the UI, but the
--      Leadership Challenge RPC rejected those calls as not_owner. Match
--      finalize_government_formation by allowing is_admin() callers through
--      the ownership gate while preserving normal player ownership checks.
--   2. Keep the same coalition/vacancy validation contract so coalition
--      members can claim a government that is formed but missing a seated PM.
--
-- Re-runnable: replaces the RPC in-place.

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

    -- Authenticated players may only claim for their own faction. Admins are
    -- allowed because the in-game inspector intentionally loads arbitrary
    -- factions while auth.uid() remains the admin user's id.
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

    SELECT party_ids INTO v_party_ids FROM government_formations
        WHERE nation_id = p_nation_id
          AND status IN ('formed', 'active', 'caretaker')
        ORDER BY created_at DESC LIMIT 1;
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
  'Coalition member claims the vacant Premiership for the next-tick resolveLeadershipChallenges sweep. SECURITY DEFINER bypasses RLS on leadership_challenges; auth.uid() is checked against the calling faction unless the caller is an admin inspector session.';

NOTIFY pgrst, 'reload schema';

COMMIT;
