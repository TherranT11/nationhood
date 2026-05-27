-- ════════════════════════════════════════════════════════════════════
-- NAME THE CONTESTED REGION — either belligerent's head of government
-- ════════════════════════════════════════════════════════════════════
-- The contested region's name is shared: the head of government of EITHER
-- belligerent nation (claimant or pressor) may set it. Routed through
-- set_dispute_region (reusing dispute_actor_nation as the authority) and the
-- column is locked against direct client writes, mirroring decision_deadline_tick.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- Lock the region name — only set_dispute_region (SECURITY DEFINER) and the
-- service-role tick may write it; press_claim sets it on INSERT (unaffected).
REVOKE UPDATE (contested_region_name) ON public.bilateral_issues FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.set_dispute_region(p_issue_id UUID, p_region TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
    v_nation UUID;
    v_issue  bilateral_issues%ROWTYPE;
    v_tick   INT;
    v_region TEXT;
BEGIN
    v_nation := dispute_actor_nation();
    IF v_nation IS NULL THEN RETURN jsonb_build_object('ok', false, 'message', 'Only the head of government can name the region.'); END IF;

    SELECT * INTO v_issue FROM bilateral_issues WHERE id = p_issue_id FOR UPDATE;
    IF v_issue.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'message', 'Issue not found.'); END IF;
    IF v_issue.issue_type <> 'territorial_ownership' THEN RETURN jsonb_build_object('ok', false, 'message', 'Only territorial claims have a contested region.'); END IF;
    IF v_issue.status NOT IN ('active', 'partial') THEN RETURN jsonb_build_object('ok', false, 'message', 'This dispute is no longer open.'); END IF;
    -- Either belligerent's head of government may name the region.
    IF v_nation NOT IN (v_issue.nation_a_id, v_issue.nation_b_id) THEN
        RETURN jsonb_build_object('ok', false, 'message', 'Your nation is not a party to this dispute.');
    END IF;

    v_region := NULLIF(btrim(COALESCE(p_region, '')), '');
    IF v_region IS NOT NULL AND length(v_region) > 60 THEN v_region := left(v_region, 60); END IF;

    SELECT COALESCE(current_tick, 0) INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    UPDATE bilateral_issues SET contested_region_name = v_region, updated_at = NOW() WHERE id = p_issue_id;
    INSERT INTO bilateral_issue_history (issue_id, tick, event_type, event_text, metadata, caused_by_nation_id)
    VALUES (p_issue_id, v_tick, 'action_executed', 'The contested region was named.',
        jsonb_build_object('action', 'set_dispute_region', 'region', v_region), v_nation);
    RETURN jsonb_build_object('ok', true, 'region', v_region);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Error: ' || SQLERRM);
END; $$;

GRANT EXECUTE ON FUNCTION public.set_dispute_region(UUID, TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
