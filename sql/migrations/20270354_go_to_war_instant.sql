-- ═══════════════════════════════════════════════════════════════════════════════
-- INSTANT WAR — go_to_war redefinition (manual press by the pressor's FM)
-- ═══════════════════════════════════════════════════════════════════════════════
-- Previous behaviour (20270339 / 20270341): go_to_war collapsed the dispute's
-- decision_deadline_tick to "now" and relied on the next tick's processIssueTick
-- expiry branch (which calls startWarFromIssue → setNationsAtWar) to actually
-- flip diplomatic_relations.relation_type to 'war'. War therefore began on the
-- following tick — up to the shard's tick interval (8 hours in production) of
-- delay between the click and the visible war state.
--
-- This redefinition makes the war instant from the player's click:
--   1. Upserts diplomatic_relations to relation_type='war' (canonical a/b order).
--   2. Initialises any pre-existing land-front line_positions to the static
--      border — the same best-effort init setNationsAtWar performs.
--   3. Inserts 'War Declared' event_log rows for both belligerents.
--   4. Sets bilateral_issues.status='escalated', which is the same guard
--      processIssueTick (js/game/issues.js:1182) already checks before firing
--      startWarFromIssue. The tick path naturally SKIPS re-firing — no
--      duplicate writes, no duplicate events.
--
-- This makes go_to_war a SECOND writer for the war-state transition. The
-- single-writer invariant the codebase previously maintained (setNationsAtWar)
-- now applies only to the natural-deadline auto-escalation path. The companion
-- comment updates in diplomacy-constants.js and issues.js note the new dual-
-- writer reality.
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.go_to_war(p_issue_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
    v_caller   UUID := auth.uid();
    v_ministry ministries%ROWTYPE;
    v_nation   UUID;
    v_issue    bilateral_issues%ROWTYPE;
    v_tick     INT;
    v_a        UUID;
    v_b        UUID;
    v_name_a   TEXT;
    v_name_b   TEXT;
    v_summary  TEXT;
BEGIN
    IF v_caller IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'message', 'Not authenticated.');
    END IF;

    SELECT * INTO v_ministry FROM ministries
     WHERE ministry_key = 'foreign' AND is_active = true
       AND EXISTS (SELECT 1 FROM factions f WHERE f.id = ministries.party_id
                    AND (f.id = v_caller OR f.linked_user_id = v_caller));
    IF v_ministry.id IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'message', 'Your party does not hold the Foreign Ministry.');
    END IF;
    v_nation := v_ministry.nation_id;

    SELECT * INTO v_issue FROM bilateral_issues WHERE id = p_issue_id FOR UPDATE;
    IF v_issue.id IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'message', 'Issue not found.');
    END IF;
    IF v_issue.issue_type <> 'territorial_ownership' THEN
        RETURN jsonb_build_object('ok', false, 'message', 'Only territorial claims escalate this way.');
    END IF;
    IF v_issue.status NOT IN ('active', 'partial') THEN
        RETURN jsonb_build_object('ok', false, 'message', 'This dispute is no longer open.');
    END IF;
    IF v_issue.initiative_nation_id IS DISTINCT FROM v_nation THEN
        RETURN jsonb_build_object('ok', false, 'message', 'Only the pressor can go to war.');
    END IF;

    SELECT COALESCE(current_tick, 0) INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;

    -- Canonical (a, b) for diplomatic_relations / war_fronts. Mirrors
    -- setNationsAtWar's `nationX < nationY ? ...` order so the same row is hit.
    v_a := LEAST(v_issue.nation_a_id, v_issue.nation_b_id);
    v_b := GREATEST(v_issue.nation_a_id, v_issue.nation_b_id);
    SELECT name INTO v_name_a FROM nations WHERE id = v_a;
    SELECT name INTO v_name_b FROM nations WHERE id = v_b;

    -- ── 1. Flip the diplomatic relation to 'war' (the headline transition). ──
    -- See the file header for the dual-writer note. Same row shape as
    -- setNationsAtWar's upsert in js/game/diplomacy-constants.js.
    INSERT INTO diplomatic_relations
        (nation_a_id, nation_b_id, relation_type, war_declared_at_tick, war_justification, updated_at)
    VALUES (v_a, v_b, 'war', v_tick, 'Territorial Dispute', NOW())
    ON CONFLICT (nation_a_id, nation_b_id) DO UPDATE
       SET relation_type        = 'war',
           war_declared_at_tick = v_tick,
           war_justification    = 'Territorial Dispute',
           updated_at           = NOW();

    -- ── 2. Initialise pre-existing land-front line_positions (best-effort). ──
    -- Set-based equivalent of setNationsAtWar's per-front loop: line_position
    -- = clamp(a's sector count, 1, sector_count - 1). Idempotent — only
    -- touches fronts where line_position IS NULL.
    WITH a_counts AS (
        SELECT s.front_id, COUNT(*)::int AS a_secs
          FROM war_sectors s
          JOIN war_fronts  f ON f.id = s.front_id
         WHERE f.front_type = 'land'
           AND f.nation_a_id = v_a AND f.nation_b_id = v_b
           AND f.line_position IS NULL
           AND s.nation_id = v_a
         GROUP BY s.front_id
    )
    UPDATE war_fronts f
       SET line_position = GREATEST(1, LEAST(
           COALESCE((SELECT a_secs FROM a_counts WHERE front_id = f.id),
                    GREATEST(f.sector_count / 2, 1)),
           GREATEST(f.sector_count - 1, 1)
       ))
     WHERE f.front_type = 'land'
       AND f.nation_a_id = v_a AND f.nation_b_id = v_b
       AND f.line_position IS NULL;

    -- ── 3. Broadcast 'War Declared' to both belligerents. ───────────────────
    -- Same shape as startWarFromIssue's event_log insert in js/game/issues.js,
    -- with manual-press-specific wording so the news feed reflects the cause.
    v_summary := v_name_a || ' and ' || v_name_b ||
                 ' are at war — the pressor escalated the territorial dispute.';
    INSERT INTO event_log
        (nation_id, event_name, trigger_key, description_chosen, category, fired_at_tick)
    VALUES
        (v_a, 'War Declared', 'war_started_territorial', v_summary, 'crisis', v_tick),
        (v_b, 'War Declared', 'war_started_territorial', v_summary, 'crisis', v_tick);

    -- ── 4. Close the dispute. status='escalated' is the gate that prevents
    -- processIssueTick's expiry branch (issues.js:1182) from re-firing
    -- startWarFromIssue on the next tick. The deadline collapse is preserved
    -- so the audit trail reads consistently with the natural-deadline path.
    UPDATE bilateral_issues
       SET status                 = 'escalated',
           decision_deadline_tick = v_tick,
           updated_at             = NOW()
     WHERE id = p_issue_id;

    INSERT INTO bilateral_issue_history
        (issue_id, tick, event_type, event_text, metadata, caused_by_nation_id)
    VALUES (p_issue_id, v_tick, 'escalated',
            'The pressor declared war — a state of war now exists.',
            jsonb_build_object('action', 'go_to_war', 'deadline_tick', v_tick), v_nation);

    RETURN jsonb_build_object('ok', true, 'message', 'A state of war now exists.');
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Error: ' || SQLERRM);
END; $$;

GRANT EXECUTE ON FUNCTION public.go_to_war(UUID) TO authenticated;

COMMIT;
