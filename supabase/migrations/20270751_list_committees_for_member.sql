-- ════════════════════════════════════════════════════════════════════
-- 20270751 — list_committees_for_member
--
-- Surface for the new Pressing Issues card per user spec: for every
-- committee the caller sits on, return:
--   • committee_id, committee_key, role        (for navigation + label)
--   • queued_count                              (article proposals)
--   • queued_policy_count                       (policy_change proposals)
--   • pending_count = queued + queued_policy    (the headline number)
--
-- "Pending Items on Agenda" in the card UI sums article + policy queue
-- depths the way committee.html's own Upcoming Agenda merges them
-- (20270728). Future statuses (in_hearing / awaiting_report_vote /
-- in_amendment) are intentionally NOT counted — those are "in flight,"
-- not "pending agenda."
--
-- Empty array for any caller who isn't on a committee. Safe to call
-- unconditionally from politician-home's Pressing Issues fetch batch.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.list_committees_for_member(
    p_faction_id uuid
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid  uuid := auth.uid();
    v_pol  factions%ROWTYPE;
    v_list jsonb;
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

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'committee_id',        c.id,
        'committee_key',       c.committee_key,
        'role',                m.role,
        'queued_count',        COALESCE(art.cnt, 0),
        'queued_policy_count', COALESCE(pol.cnt, 0),
        'pending_count',       COALESCE(art.cnt, 0) + COALESCE(pol.cnt, 0)
    ) ORDER BY c.committee_key), '[]'::jsonb)
      INTO v_list
      FROM committee_members m
      JOIN committees        c ON c.id = m.committee_id
      LEFT JOIN (
          SELECT committee_id, COUNT(*) AS cnt
            FROM committee_proposals
           WHERE status = 'queued'
           GROUP BY committee_id
      ) art ON art.committee_id = c.id
      LEFT JOIN (
          SELECT committee_id, COUNT(*) AS cnt
            FROM committee_policy_proposals
           WHERE status = 'queued'
           GROUP BY committee_id
      ) pol ON pol.committee_id = c.id
     WHERE m.politician_faction_id = v_pol.id;

    RETURN jsonb_build_object('success', true, 'committees', v_list);
END $$;

REVOKE EXECUTE ON FUNCTION public.list_committees_for_member(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.list_committees_for_member(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
