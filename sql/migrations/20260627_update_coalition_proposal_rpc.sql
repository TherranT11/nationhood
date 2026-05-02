-- ══════════════════════════════════════════════════════════════
-- Edit Proposal: update_coalition_proposal RPC.
--
-- Lets the original proposer change their coalition's party_ids
-- mid-formation. Resets every support row for the formation —
-- proposer included — so all members must re-vote on the new
-- membership (option A: full reset, no carry-over).
--
-- Gates (mirror client):
--   • caller owns the calling party
--   • caller IS the proposer (formations.proposed_by = caller)
--   • formation status = 'active'
--   • caller's party is in the new party_ids list
--   • coalition meets majority threshold (sanity, client also checks)
--   • not already at unanimous support — once everyone has voted
--     YES the configure step is in motion and the coalition is
--     locked
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_coalition_proposal(
    p_formation_id UUID,
    p_party_ids    UUID[]
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user        UUID := auth.uid();
    v_caller      factions%ROWTYPE;
    v_formation   government_formations%ROWTYPE;
    v_total_seats INT;
    v_majority    INT;
    v_coalition_seats INT;
    v_support_yes INT;
    v_coalition_size INT;
BEGIN
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    SELECT * INTO v_formation FROM government_formations WHERE id = p_formation_id;
    IF v_formation.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Proposal not found');
    END IF;
    IF v_formation.status <> 'active' THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Proposal is %s; cannot edit', v_formation.status));
    END IF;

    SELECT * INTO v_caller FROM factions WHERE id = v_formation.proposed_by;
    IF v_caller.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Proposer party not found');
    END IF;
    IF v_caller.id <> v_user AND v_caller.linked_user_id IS DISTINCT FROM v_user THEN
        RETURN jsonb_build_object('success', false, 'error', 'Only the proposer can edit this coalition');
    END IF;

    IF p_party_ids IS NULL OR array_length(p_party_ids, 1) IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'At least one party required');
    END IF;
    IF NOT (v_caller.id = ANY(p_party_ids)) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Your party must be in its own coalition');
    END IF;

    -- Lock-out once unanimous: editing here would yank a confirmed
    -- coalition out from under the parties about to form government.
    SELECT COUNT(*) FILTER (WHERE supports = TRUE)
      INTO v_support_yes
      FROM government_formation_support s
     WHERE s.formation_id = p_formation_id
       AND s.faction_id   = ANY(v_formation.party_ids);
    v_coalition_size := COALESCE(array_length(v_formation.party_ids, 1), 0);
    IF v_coalition_size > 0 AND v_support_yes >= v_coalition_size THEN
        RETURN jsonb_build_object('success', false,
            'error', 'Coalition has unanimous support; configure or dissolve before editing');
    END IF;

    -- Majority threshold sanity check using parties in the same nation.
    SELECT COALESCE(SUM(seats), 0) INTO v_total_seats
      FROM factions
     WHERE nation_id = v_formation.nation_id
       AND faction_type = 'party'
       AND abandoned_at IS NULL;
    v_majority := CEIL(v_total_seats::numeric / 2)::INT + 1;
    SELECT COALESCE(SUM(seats), 0) INTO v_coalition_seats
      FROM factions
     WHERE id = ANY(p_party_ids);
    IF v_coalition_seats < v_majority THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Coalition needs %s seats for a majority; have %s', v_majority, v_coalition_seats));
    END IF;

    -- Reset all supports — every member must re-vote on the new
    -- membership, including the proposer.
    DELETE FROM government_formation_support
     WHERE formation_id = p_formation_id;

    UPDATE government_formations
       SET party_ids = p_party_ids
     WHERE id = p_formation_id;

    RETURN jsonb_build_object(
        'success',   true,
        'party_ids', to_jsonb(p_party_ids)
    );
END;
$$;

ALTER FUNCTION public.update_coalition_proposal(UUID, UUID[]) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.update_coalition_proposal(UUID, UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_coalition_proposal(UUID, UUID[]) TO service_role;

COMMENT ON FUNCTION public.update_coalition_proposal(UUID, UUID[]) IS
  'Proposer-only edit on an active government_formations row. Resets every support row for the formation so all members must re-vote on the new membership. Locked once the coalition reaches unanimous support.';

NOTIFY pgrst, 'reload schema';
