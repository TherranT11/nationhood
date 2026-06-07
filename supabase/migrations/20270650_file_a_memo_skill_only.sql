-- ════════════════════════════════════════════════════════════════════
-- 20270650 — File a Memo: +0.5 Skill, no cost
--
-- Design swap. The 20270632 body fired +1 Capital / −1 Influence — a
-- zero-sum swap of two stats that left the action net-neutral on the
-- role sheet (you traded one currency for another). That made the
-- card a poor counterpart to File Paperwork (which already gives flat
-- Capital) and incentivized memo-spamming purely to drain Influence
-- before a costly move.
--
-- New shape: +0.5 Skill, no other costs. Memo becomes a true Skill-
-- generation lever for civil servants — slow accrual (half a point
-- per tick under the shared cooldown), no Capital flow, no Influence
-- drain. Matches the fractional Skill movement civic_meeting / office
-- _hours already produce in the elected-office branch.
--
-- Gates preserved verbatim:
--   - politician_ministry NOT NULL (civil-servant only)
--   - next_civil_service_action_tick cooldown shared with FILE PAPERWORK
--
-- JSONB return shape switches keys: 'new_capital' / 'capital_delta' /
-- 'new_influence' / 'influence_delta' → 'new_skill' / 'skill_delta'.
-- Client fmtMemoResult re-rendered to match in the same commit.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.politician_file_a_memo()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_tick      int;
    v_new_skill numeric;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
       AND politician_ministry IS NOT NULL
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_civil_servant');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- Per-tick cooldown — shared across FILE PAPERWORK + FILE A MEMO.
    IF v_pol.next_civil_service_action_tick IS NOT NULL
       AND v_pol.next_civil_service_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_civil_service_action_tick);
    END IF;

    UPDATE factions
       SET politician_skill                = COALESCE(politician_skill, 0) + 0.5,
           next_civil_service_action_tick  = v_tick + 1
     WHERE id = v_pol.id
    RETURNING politician_skill INTO v_new_skill;

    RETURN jsonb_build_object(
        'success',           true,
        'action',            'file_a_memo',
        'skill_delta',       0.5,
        'new_skill',         v_new_skill,
        'next_action_tick',  v_tick + 1
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.politician_file_a_memo() TO authenticated;

COMMIT;
