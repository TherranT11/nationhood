-- ════════════════════════════════════════════════════════════════════
-- HEAD-OF-GOVERNMENT CHANNEL — private leader-to-leader messages per dispute
-- ════════════════════════════════════════════════════════════════════
-- A dispute carries a message channel. READ: any faction (military or political)
-- of either belligerent nation can follow along. WRITE: only the head of
-- government (PM/President) of a belligerent nation may post — via
-- send_issue_message, which reuses dispute_actor_nation() as the authority.
-- Third parties (uninvolved nations) see nothing here.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE TABLE IF NOT EXISTS bilateral_issue_messages (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id         UUID NOT NULL REFERENCES bilateral_issues(id) ON DELETE CASCADE,
    sender_nation_id UUID NOT NULL REFERENCES nations(id) ON DELETE CASCADE,
    body             TEXT NOT NULL,
    sent_at_tick     INT  NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_issue_messages_issue ON bilateral_issue_messages (issue_id, created_at);

ALTER TABLE bilateral_issue_messages ENABLE ROW LEVEL SECURITY;

-- READ: the caller owns a faction in one of the issue's two nations.
DROP POLICY IF EXISTS bim_read ON bilateral_issue_messages;
CREATE POLICY bim_read ON bilateral_issue_messages FOR SELECT TO authenticated
USING (EXISTS (
    SELECT 1 FROM bilateral_issues bi
     WHERE bi.id = bilateral_issue_messages.issue_id
       AND EXISTS (SELECT 1 FROM factions f
                    WHERE (f.id = auth.uid() OR f.linked_user_id = auth.uid())
                      AND f.nation_id IN (bi.nation_a_id, bi.nation_b_id))
));
-- WRITE goes only through send_issue_message (SECURITY DEFINER) — no client INSERT policy.

-- ── send_issue_message: a belligerent's head of government posts ─────────────
CREATE OR REPLACE FUNCTION public.send_issue_message(p_issue_id UUID, p_body TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
    v_nation UUID;
    v_issue  bilateral_issues%ROWTYPE;
    v_tick   INT;
    v_body   TEXT;
    v_id     UUID;
BEGIN
    v_nation := dispute_actor_nation();
    IF v_nation IS NULL THEN RETURN jsonb_build_object('ok', false, 'message', 'Only the head of government can use this channel.'); END IF;

    v_body := btrim(COALESCE(p_body, ''));
    IF v_body = '' THEN RETURN jsonb_build_object('ok', false, 'message', 'Message is empty.'); END IF;
    IF length(v_body) > 1000 THEN v_body := left(v_body, 1000); END IF;

    SELECT * INTO v_issue FROM bilateral_issues WHERE id = p_issue_id;
    IF v_issue.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'message', 'Issue not found.'); END IF;
    IF v_nation NOT IN (v_issue.nation_a_id, v_issue.nation_b_id) THEN
        RETURN jsonb_build_object('ok', false, 'message', 'Your nation is not a party to this dispute.');
    END IF;

    SELECT COALESCE(current_tick, 0) INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    INSERT INTO bilateral_issue_messages (issue_id, sender_nation_id, body, sent_at_tick)
    VALUES (p_issue_id, v_nation, v_body, v_tick)
    RETURNING id INTO v_id;

    RETURN jsonb_build_object('ok', true, 'id', v_id);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Error: ' || SQLERRM);
END; $$;

GRANT EXECUTE ON FUNCTION public.send_issue_message(UUID, TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
