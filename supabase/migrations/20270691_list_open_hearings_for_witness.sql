-- ════════════════════════════════════════════════════════════════════
-- 20270691 — list_open_hearings_for_witness
--
-- New Pressing Issues source for politician-home: while a committee
-- hearing is in session, every politician in the same nation who is
-- NOT on that committee sees a "Committee X is seeking expert
-- testimony on Y" card with Accept / Close. Accept punts them to
-- committee.html?key=... where the existing witness-signup modal
-- takes over; Close dismisses the card client-side via localStorage
-- (per-hearing key — a follow-up hearing on a different proposal
-- triggers a fresh card).
--
-- Returns: { success, hearings: [{ hearing_id, committee_id,
--   committee_key, proposal_id, section, category, opened_at_tick,
--   closes_at_tick }] }
--
-- Filter rules (server-side, RLS-safe):
--   • h.status = 'open'
--   • h.nation_id = viewer's nation_id
--   • viewer is NOT seated on h.committee_id (committee_members)
--   • viewer has NOT already submitted testimony to h (testimonies)
--
-- Politicians without a nation_id get an empty result so the client
-- can call unconditionally — same defensive shape as
-- list_pending_state_advocate_requests_for_reviewer (20270555) and
-- the other Pressing Issues RPCs.
--
-- STABLE — pure read. Safe to call on every politician-home boot
-- without side effects.
--
-- Apply after 20270690.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.list_open_hearings_for_witness(
    p_faction_id uuid
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_pol     factions%ROWTYPE;
    v_result  jsonb;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
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
    IF v_pol.nation_id IS NULL THEN
        RETURN jsonb_build_object('success', true, 'hearings', '[]'::jsonb);
    END IF;

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'hearing_id',     h.id,
                'committee_id',   h.committee_id,
                'committee_key',  c.committee_key,
                'proposal_id',    h.proposal_id,
                'section',        p.section,
                'category',       p.category,
                'opened_at_tick', h.opened_at_tick,
                'closes_at_tick', h.closes_at_tick
           ) ORDER BY h.opened_at_tick DESC), '[]'::jsonb)
      INTO v_result
      FROM committee_hearings h
      JOIN committees          c ON c.id = h.committee_id
      JOIN committee_proposals p ON p.id = h.proposal_id
     WHERE h.status    = 'open'
       AND h.nation_id = v_pol.nation_id
       AND NOT EXISTS (
           SELECT 1 FROM committee_members cm
            WHERE cm.committee_id          = h.committee_id
              AND cm.politician_faction_id = v_pol.id
       )
       AND NOT EXISTS (
           SELECT 1 FROM committee_hearing_testimonies t
            WHERE t.hearing_id           = h.id
              AND t.submitter_faction_id = v_pol.id
       );

    RETURN jsonb_build_object('success', true, 'hearings', v_result);
END $$;

GRANT EXECUTE ON FUNCTION public.list_open_hearings_for_witness(uuid) TO authenticated;

COMMENT ON FUNCTION public.list_open_hearings_for_witness(uuid) IS
    'Pressing Issues source: open committee hearings in the politician''s nation where the politician is NOT a committee member AND has not yet submitted testimony. Returns minimal joinable fields for the politician-home renderer to format "Committee X is seeking expert testimony on Y" cards. 20270691.';

NOTIFY pgrst, 'reload schema';

COMMIT;
