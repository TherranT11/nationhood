-- ═══════════════════════════════════════════════════════════════════════════════
-- POLITICIAN LEAVE PARTY — 5 influence cost
-- ═══════════════════════════════════════════════════════════════════════════════
-- Design change: leaving a party now costs 5 politician_influence (clamped
-- at 0 so a low-influence politician can't go negative). Joining grants +3
-- ONLY on the first ever join (unchanged from 20270371), so leave + rejoin
-- is now a strictly losing trade — -5 to leave, +0 to rejoin = -5 net.
-- This kills any incentive to churn affiliations.
--
-- Body of politician_leave_party is otherwise identical to 20270371. The
-- already_independent fast-path still no-ops without touching influence;
-- only an actual leave deducts.
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.politician_leave_party(
    p_politician_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

    -- Snapshot the party name BEFORE clearing the link so the career event
    -- records who they actually left (and survives a later party rename).
    SELECT * INTO v_party FROM factions WHERE id = v_pol.politician_party_id;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- Clear the affiliation and pay the -5 influence cost (clamped at 0
    -- so leaving never sends the politician negative). The cost combined
    -- with first-join-only +3 makes leave + rejoin a net loss.
    UPDATE factions
       SET politician_party_id = NULL,
           politician_influence = GREATEST(0, COALESCE(politician_influence, 0) - 5)
     WHERE id = p_politician_id;

    INSERT INTO politician_career_events (faction_id, event_tick, event_type, target_name)
    VALUES (p_politician_id, v_tick, 'left_party', COALESCE(v_party.faction_name, 'a political party'));

    RETURN jsonb_build_object('success', true,
        'party_name', v_party.faction_name,
        'influence_delta', -5);
END;
$$;

GRANT EXECUTE ON FUNCTION public.politician_leave_party(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
