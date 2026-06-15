-- ════════════════════════════════════════════════════════════════════
-- 20270947 — Tick-driven resolution for party Votes of No Confidence
--
-- 20270912 made resolve_party_no_confidence lazy (NOT in advance-tick): an
-- open motion only finalized when someone loaded the party page at/after its
-- resolve_tick. If nobody visited, it sat open forever. This adds a sweep the
-- tick processor calls each tick so a motion finalizes on its own — the lazy
-- page-load kick in party.html stays as an instant fast-path.
--
-- resolve_party_no_confidence is already idempotent and self-guarding (it
-- locks the motion FOR UPDATE, no-ops when status <> 'open', and rejects when
-- shard.current_tick < resolve_tick), so the sweep + the page kick can never
-- double-apply. The sweep reads shard.current_tick directly, so advance-tick
-- MUST call it AFTER the shard tick is committed (the internal guard in
-- resolve_party_no_confidence reads the same shard value).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.resolve_due_party_no_confidence_motions()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_tick      int;
    v_id        uuid;
    v_processed int := 0;
BEGIN
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', true, 'processed', 0, 'reason', 'no_shard');
    END IF;

    -- Every open motion whose 3-tick window has closed. SKIP LOCKED steps
    -- around any concurrent lazy resolve already holding the row; the
    -- idempotent resolver no-ops on anything already settled.
    FOR v_id IN
        SELECT id FROM party_no_confidence_motions
         WHERE status = 'open' AND resolve_tick <= v_tick
         ORDER BY resolve_tick ASC
         FOR UPDATE SKIP LOCKED
    LOOP
        PERFORM resolve_party_no_confidence(v_id);
        v_processed := v_processed + 1;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'processed', v_processed, 'tick', v_tick);
END $$;

REVOKE ALL ON FUNCTION public.resolve_due_party_no_confidence_motions() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_due_party_no_confidence_motions() TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
