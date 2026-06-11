-- ════════════════════════════════════════════════════════════════════
-- 20270862 — Balanced archetype stances + the committee's fast track
--
-- 1. Archetype balance (design ruling): a proposal's Supporting and
--    Opposing archetype lists must be the SAME SIZE — 1 support needs
--    1 oppose, 3 need 3 (disjointness already enforced). Both empty
--    stays fine. Lives in _validate_archetype_pair (re-emitted from
--    its latest emission, 20270686) so committee_propose_law,
--    committee_propose_amendment, and every future caller inherit it.
--
-- 2. committee_move_to_floor: once an open VOTE motion holds 3 YES
--    votes — an unbeatable majority of the five seats — any committee
--    member can resolve it early and send the bill to the floor
--    instead of waiting out the 3-tick window. Resolution reuses
--    _committee_carry_out_motion, the same path the deadline resolver
--    takes.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. _validate_archetype_pair — balance joins disjointness ──────
CREATE OR REPLACE FUNCTION public._validate_archetype_pair(
    p_support jsonb, p_oppose jsonb
)
RETURNS boolean
LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
    v_sup text[];
    v_opp text[];
BEGIN
    IF NOT _validate_archetype_array(p_support) THEN RETURN false; END IF;
    IF NOT _validate_archetype_array(p_oppose)  THEN RETURN false; END IF;

    SELECT array_agg(v) INTO v_sup FROM jsonb_array_elements_text(COALESCE(p_support, '[]'::jsonb)) v;
    SELECT array_agg(v) INTO v_opp FROM jsonb_array_elements_text(COALESCE(p_oppose,  '[]'::jsonb)) v;
    v_sup := COALESCE(v_sup, ARRAY[]::text[]);
    v_opp := COALESCE(v_opp, ARRAY[]::text[]);

    -- Disjointness — no archetype on both sides.
    IF v_sup && v_opp THEN RETURN false; END IF;

    -- Balance (20270862) — every Supporting archetype needs an
    -- Opposing one. NULL counts as empty, so a one-sided stance
    -- (3 support, 0 oppose) no longer validates.
    IF cardinality(v_sup) <> cardinality(v_opp) THEN RETURN false; END IF;

    RETURN true;
END $$;

-- ── 2. committee_move_to_floor — early resolution at 3 YES ────────
CREATE OR REPLACE FUNCTION public.committee_move_to_floor(
    p_faction_id   uuid,
    p_committee_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid    uuid := auth.uid();
    v_pol    factions%ROWTYPE;
    v_comm   committees%ROWTYPE;
    v_member committee_members%ROWTYPE;
    v_motion committee_motions%ROWTYPE;
    v_tick   int;
    v_yes    int;
    v_no     int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL OR p_committee_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid);
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;

    SELECT * INTO v_comm FROM committees WHERE id = p_committee_id;
    IF v_comm.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'committee_not_found');
    END IF;

    SELECT * INTO v_member FROM committee_members
     WHERE committee_id = v_comm.id AND politician_faction_id = v_pol.id;
    IF v_member.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_member');
    END IF;

    -- Lock the open motion against the deadline resolver and a
    -- concurrent fast-track.
    SELECT * INTO v_motion FROM committee_motions
     WHERE committee_id = v_comm.id AND status = 'open'
     FOR UPDATE;
    IF v_motion.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_open_motion');
    END IF;
    IF v_motion.motion <> 'vote' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_a_vote_motion');
    END IF;

    SELECT
        COUNT(*) FILTER (WHERE vote = 'yes'),
        COUNT(*) FILTER (WHERE vote = 'no')
      INTO v_yes, v_no
      FROM committee_motion_votes
     WHERE motion_id = v_motion.id;

    -- Three of five seats: the majority is unbeatable, so the early
    -- resolution can't change the outcome — only the timing.
    IF v_yes < 3 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_enough_yes',
            'yes', v_yes, 'needed', 3);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE committee_motions
       SET status           = 'passed',
           yes_count        = v_yes,
           no_count         = v_no,
           resolved_at_tick = v_tick
     WHERE id = v_motion.id;

    PERFORM _committee_carry_out_motion(
        v_motion.committee_id, v_motion.proposal_id, 'vote', v_tick);

    RETURN jsonb_build_object('success', true,
        'yes', v_yes, 'no', v_no, 'proposal_id', v_motion.proposal_id);
END $$;

REVOKE EXECUTE ON FUNCTION public.committee_move_to_floor(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.committee_move_to_floor(uuid, uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
