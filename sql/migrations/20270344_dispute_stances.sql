-- ════════════════════════════════════════════════════════════════════
-- THIRD-PARTY STANCES — other nations back, condemn, or offer to mediate
-- ════════════════════════════════════════════════════════════════════
-- A nation that is NOT a party to a territorial dispute may take a public stance
-- via its FOREIGN MINISTER. Stances are world-visible and shift the stance-taker's
-- relation_score with the affected nation(s):
--   support_claimant  +8 with claimant, −8 with pressor
--   support_pressor   +8 with pressor,  −8 with claimant
--   condemn_claimant  −15 with claimant
--   condemn_pressor   −15 with pressor
--   mediate / neutral  free
-- The cost applies only when the stance actually CHANGES. v1 records + displays
-- stances and moves relation_score; no battlefield/leverage effect yet. The
-- mediation HANDSHAKE (both-HoG accept → clock + chat) is a following pass; here
-- 'mediate' is recorded and shown as "Offered to mediate".
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── The nation where the caller holds the active Foreign Ministry, or NULL ───
CREATE OR REPLACE FUNCTION public.foreign_ministry_nation()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT m.nation_id FROM ministries m
   WHERE m.ministry_key = 'foreign' AND m.is_active = true
     AND EXISTS (SELECT 1 FROM factions f WHERE f.id = m.party_id
                  AND (f.id = auth.uid() OR f.linked_user_id = auth.uid()))
   LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.foreign_ministry_nation() TO authenticated;

-- ── Stances table ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bilateral_issue_stances (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id   UUID NOT NULL REFERENCES bilateral_issues(id) ON DELETE CASCADE,
    nation_id  UUID NOT NULL REFERENCES nations(id) ON DELETE CASCADE,
    stance     TEXT NOT NULL CHECK (stance IN
        ('support_claimant','support_pressor','condemn_claimant','condemn_pressor','mediate','neutral')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (issue_id, nation_id)
);
CREATE INDEX IF NOT EXISTS idx_issue_stances_issue ON bilateral_issue_stances (issue_id);

ALTER TABLE bilateral_issue_stances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS stance_read ON bilateral_issue_stances;
CREATE POLICY stance_read ON bilateral_issue_stances FOR SELECT TO authenticated USING (true);
-- Writes go only through set_issue_stance (SECURITY DEFINER) — no client write policy.

-- ── Clamp-adjust a canonical pair's relation_score ───────────────────────────
CREATE OR REPLACE FUNCTION public.dispute_nudge_relation(p_n1 UUID, p_n2 UUID, p_delta NUMERIC)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public, pg_temp AS $$
  UPDATE diplomatic_relations
     SET relation_score = GREATEST(-100, LEAST(100, relation_score + p_delta))
   WHERE nation_a_id = LEAST(p_n1, p_n2) AND nation_b_id = GREATEST(p_n1, p_n2);
$$;
-- Internal helper only — it nudges relation_score with NO auth check, so it must
-- NOT be client-callable. Revoke the default PUBLIC execute; set_issue_stance
-- (running as owner) still calls it.
REVOKE EXECUTE ON FUNCTION public.dispute_nudge_relation(UUID, UUID, NUMERIC) FROM PUBLIC;

-- ── set_issue_stance: a third party's Foreign Minister sets the stance ───────
CREATE OR REPLACE FUNCTION public.set_issue_stance(p_issue_id UUID, p_stance TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
    v_nation   UUID;
    v_issue    bilateral_issues%ROWTYPE;
    v_claimant UUID;
    v_pressor  UUID;
    v_prev     TEXT;
BEGIN
    v_nation := foreign_ministry_nation();
    IF v_nation IS NULL THEN RETURN jsonb_build_object('ok', false, 'message', 'Only the Foreign Ministry can set a stance.'); END IF;
    IF p_stance NOT IN ('support_claimant','support_pressor','condemn_claimant','condemn_pressor','mediate','neutral') THEN
        RETURN jsonb_build_object('ok', false, 'message', 'Invalid stance.');
    END IF;

    SELECT * INTO v_issue FROM bilateral_issues WHERE id = p_issue_id;
    IF v_issue.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'message', 'Issue not found.'); END IF;
    IF v_issue.issue_type <> 'territorial_ownership' THEN RETURN jsonb_build_object('ok', false, 'message', 'Only territorial disputes have stances.'); END IF;
    IF v_issue.status NOT IN ('active', 'partial') THEN RETURN jsonb_build_object('ok', false, 'message', 'This dispute is no longer open.'); END IF;
    IF v_nation IN (v_issue.nation_a_id, v_issue.nation_b_id) THEN
        RETURN jsonb_build_object('ok', false, 'message', 'A party to the dispute cannot take a third-party stance.');
    END IF;

    v_claimant := v_issue.administering_nation_id;
    v_pressor  := v_issue.initiative_nation_id;

    SELECT stance INTO v_prev FROM bilateral_issue_stances WHERE issue_id = p_issue_id AND nation_id = v_nation;

    -- Standing cost — only when the stance actually changes.
    IF v_prev IS DISTINCT FROM p_stance THEN
        IF    p_stance = 'support_claimant' THEN PERFORM dispute_nudge_relation(v_nation, v_claimant,  8); PERFORM dispute_nudge_relation(v_nation, v_pressor,  -8);
        ELSIF p_stance = 'support_pressor'  THEN PERFORM dispute_nudge_relation(v_nation, v_pressor,   8); PERFORM dispute_nudge_relation(v_nation, v_claimant, -8);
        ELSIF p_stance = 'condemn_claimant' THEN PERFORM dispute_nudge_relation(v_nation, v_claimant, -15);
        ELSIF p_stance = 'condemn_pressor'  THEN PERFORM dispute_nudge_relation(v_nation, v_pressor,  -15);
        END IF;  -- mediate / neutral are free
    END IF;

    IF p_stance = 'neutral' THEN
        DELETE FROM bilateral_issue_stances WHERE issue_id = p_issue_id AND nation_id = v_nation;
    ELSE
        INSERT INTO bilateral_issue_stances (issue_id, nation_id, stance)
        VALUES (p_issue_id, v_nation, p_stance)
        ON CONFLICT (issue_id, nation_id) DO UPDATE SET stance = EXCLUDED.stance, updated_at = NOW();
    END IF;

    RETURN jsonb_build_object('ok', true, 'stance', p_stance);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Error: ' || SQLERRM);
END; $$;

GRANT EXECUTE ON FUNCTION public.set_issue_stance(UUID, TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
