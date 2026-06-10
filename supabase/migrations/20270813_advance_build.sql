-- ════════════════════════════════════════════════════════════════════
-- 20270813 — Executive Actions: Advance Build
--
-- The third slot. Mobilize active capacity and push every one of the
-- corp's building sites 1 tick toward completion, at $10,000 per
-- active project — the more sites your Project Managers are running,
-- the more leverage one push buys.
--
--   advance_build(p_corp_id): owner-only (businessman, not arrested,
--   construction corp), needs ≥1 building project and a treasury
--   covering $10k × count. Spends the tick's executive action (same
--   exec_action_tick allowance + corp lock as its siblings). Every
--   building project's completes_at_tick drops by 1, then the
--   CANONICAL completion sweep (complete_construction_projects) runs
--   immediately — a project pushed to due finishes through the same
--   one path the tick engine uses: escrow payout, revenue stamp,
--   tier city effects.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.advance_build(p_corp_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid   uuid := auth.uid();
    v_fac   factions%ROWTYPE;
    v_corp  entrepreneur_corps%ROWTYPE;
    v_tick  int;
    v_count int;
    v_cost  bigint;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    -- Lock the corp row: the per-tick allowance check below must
    -- serialize against a concurrent executive action.
    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.industry <> 'construction' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'industry_not_chartered');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE id = v_corp.owner_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'businessman'
       AND abandoned_at IS NULL;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;
    IF lower(COALESCE(v_fac.status, '')) = 'arrested' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'arrested');
    END IF;

    SELECT COUNT(*) INTO v_count FROM corp_construction_projects
     WHERE corp_id = p_corp_id AND status = 'building';
    IF v_count = 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_active_projects');
    END IF;

    v_cost := v_count * 10000;
    IF FLOOR(COALESCE(v_corp.treasury_cash, 0)) < v_cost THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_treasury',
            'need', v_cost, 'have', FLOOR(COALESCE(v_corp.treasury_cash, 0))::bigint);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_corp.exec_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    UPDATE entrepreneur_corps
       SET treasury_cash    = COALESCE(treasury_cash, 0) - v_cost,
           exec_action_tick = v_tick
     WHERE id = p_corp_id;

    UPDATE corp_construction_projects
       SET completes_at_tick = completes_at_tick - 1
     WHERE corp_id = p_corp_id AND status = 'building';

    -- Anything pushed to due completes NOW through the canonical
    -- sweep — same payout, revenue stamp, and tier city effects the
    -- tick engine applies.
    PERFORM complete_construction_projects(v_tick);

    RETURN jsonb_build_object(
        'success',  true,
        'advanced', v_count,
        'cost',     v_cost
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.advance_build(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.advance_build(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
