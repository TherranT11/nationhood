-- ════════════════════════════════════════════════════════════════════
-- 20270861 — Build Local Contacts (the attaché works the room)
--
-- The embassy desk's BUILD LOCAL CONTACTS action goes live: the
-- serving attaché cultivates sources inside the host nation.
--   −$2 Embassy Budget · −1 Embassy Reputation (the pestering shows)
--   +0.3 Experience (politician_skill) · +0.3 Influence
-- Once per tick via its own next-tick stamp (same shape as the FIS
-- desk's next_fis_action_tick) — next_embassy_action_tick stays the
-- Foreign Events cooldown and is not touched.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.factions
    ADD COLUMN IF NOT EXISTS next_embassy_contacts_tick int;

COMMENT ON COLUMN public.factions.next_embassy_contacts_tick IS
    'Build Local Contacts is ready again at this tick (20270861) — one-tick lock, independent of next_embassy_action_tick.';

-- ── politician_build_contacts ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.politician_build_contacts(p_faction_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid  uuid := auth.uid();
    v_pol  factions%ROWTYPE;
    v_tick int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF lower(COALESCE(v_pol.status, '')) = 'arrested' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'arrested');
    END IF;
    IF v_pol.politician_foreign_service_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_attache');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF v_pol.next_embassy_contacts_tick IS NOT NULL
       AND v_pol.next_embassy_contacts_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_embassy_contacts_tick);
    END IF;

    IF COALESCE(v_pol.embassy_budget, 100) < 2 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_budget',
            'have', COALESCE(v_pol.embassy_budget, 100));
    END IF;

    UPDATE factions
       SET embassy_budget             = COALESCE(embassy_budget, 100) - 2,
           embassy_reputation         = GREATEST(0, COALESCE(embassy_reputation, 50) - 1),
           politician_skill           = COALESCE(politician_skill, 0) + 0.3,
           politician_influence       = COALESCE(politician_influence, 0) + 0.3,
           next_embassy_contacts_tick = v_tick + 1
     WHERE id = v_pol.id;

    RETURN jsonb_build_object(
        'success',          true,
        'budget_delta',     -2,
        'reputation_delta', -1,
        'skill_delta',      0.3,
        'influence_delta',  0.3,
        'next_action_tick', v_tick + 1
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.politician_build_contacts(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.politician_build_contacts(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
