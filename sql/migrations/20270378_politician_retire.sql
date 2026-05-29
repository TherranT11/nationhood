-- ═══════════════════════════════════════════════════════════════════════════════
-- POLITICIAN RETIRE — soft-delete a politician faction
-- ═══════════════════════════════════════════════════════════════════════════════
-- Player-driven "end my political career" action, mirrored from the Political
-- Career section on politician-home.html. Stamps abandoned_at = NOW() so the
-- politician disappears from every bootstrap select (which filter
-- abandoned_at IS NULL), and clears politician_party_id so the dangling
-- party FK doesn't keep them on member rosters.
--
-- Soft-delete rather than hard DELETE so the historical record survives:
-- politician_career_events still reference the faction id, the party they
-- joined still has them in its "Members ever" set (for any future page
-- that wants to look back), and a freed user can create a new politician
-- via the standard first-steps.html flow afterwards (first-steps already
-- ignores abandoned rows when deciding whether the user has a primary or
-- needs a linked secondary).
--
-- Influence is NOT zeroed. The politician retires with whatever they
-- earned/lost — same principle as politician_leave_party not clawing the
-- starting +3. The career events log is the record; the row stays inert.
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.politician_retire(p_politician_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid uuid := auth.uid();
    v_pol factions%ROWTYPE;
BEGIN
    IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated'); END IF;

    SELECT * INTO v_pol FROM factions WHERE id = p_politician_id FOR UPDATE;
    IF v_pol.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'politician_not_found'); END IF;
    IF v_pol.faction_type <> 'politician' THEN RETURN jsonb_build_object('success', false, 'reason', 'not_a_politician'); END IF;
    IF v_pol.id <> v_uid AND v_pol.linked_user_id IS DISTINCT FROM v_uid THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;
    IF v_pol.abandoned_at IS NOT NULL THEN
        RETURN jsonb_build_object('success', true, 'already_retired', true);
    END IF;

    UPDATE factions
       SET politician_party_id = NULL,
           abandoned_at = NOW()
     WHERE id = p_politician_id;

    RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.politician_retire(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
