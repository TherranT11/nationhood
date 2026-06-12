-- ════════════════════════════════════════════════════════════════════
-- 20270884 — Leave Party is free
--
-- DESIGN CHANGE per user: leaving a political party no longer costs
-- 5 Influence. Body otherwise byte-identical to the 20270646
-- emission; the influence_delta key drops from the response.
-- Client confirm copy (LEAVE_PARTY_CONFIRM, one source for all
-- three Leave buttons) updated in lockstep.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.politician_leave_party(
    p_politician_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_party     factions%ROWTYPE;
    v_tick      int;
BEGIN
    IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated'); END IF;

    SELECT * INTO v_pol FROM factions WHERE id = p_politician_id FOR UPDATE;
    IF v_pol.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'politician_not_found'); END IF;
    IF v_pol.faction_type <> 'politician' THEN RETURN jsonb_build_object('success', false, 'reason', 'not_a_politician'); END IF;
    IF v_pol.id <> v_uid AND v_pol.linked_user_id IS DISTINCT FROM v_uid THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;
    IF v_pol.abandoned_at IS NOT NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'politician_inactive'); END IF;

    IF v_pol.politician_party_id IS NULL THEN
        RETURN jsonb_build_object('success', true, 'already_independent', true);
    END IF;

    SELECT * INTO v_party FROM factions WHERE id = v_pol.politician_party_id;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- 20270884: leaving is free — no Influence charge.
    UPDATE factions
       SET politician_party_id = NULL
     WHERE id = p_politician_id;

    INSERT INTO politician_career_events (faction_id, event_tick, event_type, target_name)
    VALUES (p_politician_id, v_tick, 'left_party', COALESCE(v_party.faction_name, 'a political party'));

    RETURN jsonb_build_object('success', true,
        'party_name', v_party.faction_name);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.politician_leave_party(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.politician_leave_party(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
