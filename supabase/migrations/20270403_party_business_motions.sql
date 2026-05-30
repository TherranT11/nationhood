-- ════════════════════════════════════════════════════════════════════
-- PARTY BUSINESS — motion petition + vote (v1)
-- ════════════════════════════════════════════════════════════════════
-- Three starting motions a rank-and-file party member can propose,
-- rendered as cards in the Party Business container on party.html:
--   amend_description  → factions.party_description
--   change_slogan      → factions.party_slogan (new column this migration)
--   modernize_image    → factions.custom_logo_url
--
-- ── v1 mechanic (party is NPC-only — no other player politicians) ───
--   1. Petition phase: deputy leader rolls 1D2 to cosign the motion.
--      On 1, motion fails at petition and never reaches a vote.
--   2. Vote phase: 1D100 → yes-percentage of the (simulated) members
--      who turn out. > 50 passes (simple majority of votes cast).
--   3. On pass, apply the change to factions in the same transaction.
--
-- The whole flow runs server-side in one RPC so the client makes a
-- single call and gets the rolled values + final outcome back for an
-- immediate-result modal. When the design grows to require an actual
-- petition window (multi-player parties), this RPC splits into
-- propose + cosign + tally; the rolls and the apply step stay
-- substantially the same.
--
-- ── Logging ─────────────────────────────────────────────────────────
-- Every motion writes a row to party_motions (passed, failed_petition,
-- failed_vote). Today there's no history surface — the RPC return is
-- what drives the result modal — but the durable log unblocks any
-- future "Recent Party Business" feed without another migration.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── Schema ──────────────────────────────────────────────────────────
ALTER TABLE factions ADD COLUMN IF NOT EXISTS party_slogan text;

CREATE TABLE IF NOT EXISTS party_motions (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    party_id        uuid NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    proposer_id     uuid NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    motion_type     text NOT NULL CHECK (motion_type IN (
                        'amend_description','change_slogan','modernize_image'
                    )),
    -- payload_text vs payload_url is mutually exclusive per motion_type;
    -- the RPC enforces the right field is set for the requested motion.
    payload_text    text,
    payload_url     text,
    outcome         text NOT NULL CHECK (outcome IN (
                        'passed','failed_petition','failed_vote'
                    )),
    deputy_roll     int  NOT NULL,    -- 1..2; 2 advances to vote
    vote_yes_pct    int,              -- 1..100; NULL when failed_petition
    created_tick    int  NOT NULL,
    created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_party_motions_party_created
    ON party_motions(party_id, created_at DESC);

ALTER TABLE party_motions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read motions" ON party_motions;
CREATE POLICY "Authenticated read motions" ON party_motions
    FOR SELECT TO authenticated USING (true);

COMMENT ON TABLE party_motions IS
    'Durable log of party-business motions. The current Party Business '
    'panel renders results from the RPC return, not this table; the '
    'table exists so a Recent Party Business feed can land without a '
    'second migration.';

-- ── RPC: propose a motion (resolves end-to-end in v1) ───────────────
CREATE OR REPLACE FUNCTION public.propose_party_motion(
    p_motion_type  text,
    p_payload_text text DEFAULT NULL,
    p_payload_url  text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_pol          factions%ROWTYPE;
    v_party_id     uuid;
    v_tick         int;
    v_deputy_roll  int;
    v_yes_pct      int;
    v_outcome      text;
    v_motion_id    uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_motion_type NOT IN ('amend_description','change_slogan','modernize_image') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_motion_type');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.politician_party_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_member');
    END IF;
    v_party_id := v_pol.politician_party_id;

    -- Payload shape per motion type. amend_description + change_slogan
    -- both take p_payload_text; modernize_image takes p_payload_url.
    -- Length caps keep the row from growing without bound — the
    -- description cap matches the createparty form's textarea cap;
    -- the slogan cap is tighter on intent (it's a tagline).
    IF p_motion_type IN ('amend_description','change_slogan') THEN
        IF p_payload_text IS NULL OR length(trim(p_payload_text)) = 0 THEN
            RETURN jsonb_build_object('success', false, 'reason', 'empty_text');
        END IF;
        IF p_motion_type = 'amend_description' AND length(p_payload_text) > 2000 THEN
            RETURN jsonb_build_object('success', false, 'reason', 'description_too_long');
        END IF;
        IF p_motion_type = 'change_slogan' AND length(p_payload_text) > 140 THEN
            RETURN jsonb_build_object('success', false, 'reason', 'slogan_too_long');
        END IF;
    ELSE
        IF p_payload_url IS NULL OR length(trim(p_payload_url)) = 0 THEN
            RETURN jsonb_build_object('success', false, 'reason', 'empty_url');
        END IF;
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- Petition phase: deputy leader 1D2 cosign. 1 = refused (fail);
    -- 2 = cosigned (advance to vote). The roll is logged either way so
    -- a future history view can render "the deputy refused" rows.
    v_deputy_roll := 1 + floor(random() * 2)::int;
    IF v_deputy_roll = 1 THEN
        v_outcome := 'failed_petition';
        v_yes_pct := NULL;
    ELSE
        -- Vote phase: 1D100 aggregate yes-percentage. > 50 passes
        -- (simple majority of votes cast). v1 treats the vote as a
        -- single roll rather than a per-voter loop; the result
        -- distribution is uniform across [1..100] which is close
        -- enough to a "what did the party decide" outcome for v1.
        v_yes_pct := 1 + floor(random() * 100)::int;
        v_outcome := CASE WHEN v_yes_pct > 50 THEN 'passed' ELSE 'failed_vote' END;
    END IF;

    -- Apply on pass. modernize_image trusts that p_payload_url came
    -- from the party-logos bucket — the client uploads there before
    -- calling this RPC, same pattern entrepreneur-corp + party-actions
    -- already use for custom_logo_url.
    IF v_outcome = 'passed' THEN
        IF p_motion_type = 'amend_description' THEN
            UPDATE factions SET party_description = p_payload_text WHERE id = v_party_id;
        ELSIF p_motion_type = 'change_slogan' THEN
            UPDATE factions SET party_slogan = p_payload_text WHERE id = v_party_id;
        ELSE
            UPDATE factions SET custom_logo_url = p_payload_url WHERE id = v_party_id;
        END IF;
    END IF;

    INSERT INTO party_motions (
        party_id, proposer_id, motion_type, payload_text, payload_url,
        outcome, deputy_roll, vote_yes_pct, created_tick
    ) VALUES (
        v_party_id, v_pol.id, p_motion_type, p_payload_text, p_payload_url,
        v_outcome, v_deputy_roll, v_yes_pct, v_tick
    ) RETURNING id INTO v_motion_id;

    RETURN jsonb_build_object(
        'success',       true,
        'motion_id',     v_motion_id,
        'motion_type',   p_motion_type,
        'outcome',       v_outcome,
        'deputy_roll',   v_deputy_roll,
        'vote_yes_pct',  v_yes_pct
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.propose_party_motion(text, text, text) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
