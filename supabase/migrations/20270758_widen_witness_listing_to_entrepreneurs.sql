-- ════════════════════════════════════════════════════════════════════
-- 20270758 — list_open_hearings_for_witness: widen to entrepreneurs
--
-- Per user spec, the open-hearing invitation should reach every
-- player in the nation who isn't on the committee — politicians AND
-- entrepreneurs. The existing 20270691 RPC gated the caller to
-- faction_type = 'politician'; this lifts that gate to accept
-- entrepreneurs as well.
--
-- Why the rest of the filter logic survives without a tweak:
--
--   • NOT EXISTS committee_members WHERE politician_faction_id = …
--     trivially passes for entrepreneurs because that column only
--     ever stores politician faction ids — an entrepreneur is
--     definitionally not on any committee.
--
--   • NOT EXISTS committee_hearing_testimonies WHERE
--     submitter_faction_id = … already works for entrepreneurs
--     because submit_hearing_testimony (20270499) accepts any
--     faction_type as submitter.
--
-- submit_hearing_testimony itself needs no change — it has accepted
-- any faction type since day one — and accept_hearing_testimony
-- already rewards entrepreneurs with +1 ent_reputation when the
-- committee promotes their testimony to the public record.
--
-- Apply after 20270757.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.list_open_hearings_for_witness(
    p_faction_id uuid
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_caller  factions%ROWTYPE;
    v_result  jsonb;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    -- 20270758: politician OR entrepreneur — both can be invited to
    -- testify. Other faction types (party, corporation, etc.) are
    -- out of scope for v1; widen further only if user spec demands.
    SELECT * INTO v_caller FROM factions
     WHERE id = p_faction_id
       AND faction_type IN ('politician', 'entrepreneur')
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid);
    IF v_caller.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_faction');
    END IF;
    IF v_caller.nation_id IS NULL THEN
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
       AND h.nation_id = v_caller.nation_id
       AND NOT EXISTS (
           SELECT 1 FROM committee_members cm
            WHERE cm.committee_id          = h.committee_id
              AND cm.politician_faction_id = v_caller.id
       )
       AND NOT EXISTS (
           SELECT 1 FROM committee_hearing_testimonies t
            WHERE t.hearing_id           = h.id
              AND t.submitter_faction_id = v_caller.id
       );

    RETURN jsonb_build_object('success', true, 'hearings', v_result);
END $$;

COMMENT ON FUNCTION public.list_open_hearings_for_witness(uuid) IS
    'Pressing Issues source: open committee hearings in the caller''s nation where the caller is NOT a committee member AND has not yet submitted testimony. Returns minimal joinable fields for the renderer to format "Committee X is seeking expert testimony on Y" cards. Politicians + entrepreneurs accepted as callers (20270758, was politician-only in 20270691).';

NOTIFY pgrst, 'reload schema';

COMMIT;
