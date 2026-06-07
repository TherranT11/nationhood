-- ════════════════════════════════════════════════════════════════════
-- 20270682 — Committee active-agenda mechanic
--
-- Adds the "active agenda" concept to committee_proposals (20270498).
-- A committee has at most one active proposal at any time — the one
-- currently being heard. Testimony, member comments, and the
-- chair-called vote all attach to whatever's `active`. Until this
-- migration, status flowed queued → tabled / reported_out / withdrawn
-- with no formal "being considered right now" state.
--
-- Schema changes:
--   • status CHECK extended with 'active'
--   • active_at_tick column added (NULL until promoted; stamps the
--     start of the testimony window for the auto-vote timer that's
--     coming in a follow-up migration)
--   • partial unique index — at most one active proposal per
--     committee. Cleanly enforces "single active agenda" without
--     a more elaborate scheduler.
--
-- RPCs:
--   • committee_set_active_proposal(p_proposal_id) — player chair
--     promotes a queued proposal to the active agenda. Gates: caller
--     is the committee's chair (politician_faction_id matches),
--     proposal is queued, no other proposal in the committee is
--     already active.
--   • process_committee_npc_chair_agenda(p_tick) — tick-processor
--     entry. For every committee whose chair seat is NPC-held (no
--     politician_faction_id) AND has no active proposal, promote
--     the oldest queued proposal to active. FIFO by
--     proposed_at_tick ASC, id ASC as tiebreaker.
--
-- Helper:
--   • _committee_chair_is_player(p_committee_id) — used by the
--     tick processor + future UI to gate auto-promotion logic.
--
-- Vote-calling on the active proposal lands in a follow-up. NPC
-- chairs eventually trigger Accept/Amend/Reject votes after the
-- testimony window (~3 ticks per user spec); for now the
-- promotion mechanic alone is enough to start surfacing the
-- agenda in the UI and accumulating testimony rows.
--
-- Apply after 20270681.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Schema changes ───────────────────────────────────────────
ALTER TABLE public.committee_proposals
    DROP CONSTRAINT IF EXISTS committee_proposals_status_check;
ALTER TABLE public.committee_proposals
    ADD CONSTRAINT committee_proposals_status_check
    CHECK (status IN ('queued','active','tabled','reported_out','withdrawn'));

ALTER TABLE public.committee_proposals
    ADD COLUMN IF NOT EXISTS active_at_tick int;

COMMENT ON COLUMN public.committee_proposals.active_at_tick IS
    'Tick at which this proposal was promoted to the committee''s active agenda (status=active). NULL until promoted. Drives the testimony-window countdown that will trigger the auto-vote in a follow-up migration. 20270682.';

-- At most one active proposal per committee.
CREATE UNIQUE INDEX IF NOT EXISTS committee_proposals_one_active_per_committee
    ON public.committee_proposals (committee_id)
    WHERE status = 'active';

-- ── 2. Helper: is the chair a real player? ──────────────────────
CREATE OR REPLACE FUNCTION public._committee_chair_is_player(p_committee_id uuid)
RETURNS boolean
LANGUAGE sql STABLE
AS $$
    -- Join to factions so an abandoned politician's chair seat
    -- registers as "no live player" — the politician_faction_id
    -- column on committee_members isn't auto-cleared at abandonment,
    -- so a NULL check on it alone would leave a ghost chair blocking
    -- the NPC auto-advance forever.
    SELECT EXISTS (
        SELECT 1 FROM committee_members cm
          JOIN factions f ON f.id = cm.politician_faction_id
         WHERE cm.committee_id = p_committee_id
           AND cm.role = 'chair'
           AND f.abandoned_at IS NULL
    );
$$;

COMMENT ON FUNCTION public._committee_chair_is_player(uuid) IS
    'True when the committee chair seat is held by an active (non-abandoned) player faction. Used by process_committee_npc_chair_agenda to gate auto-promotion. Abandoned-player chairs correctly fall back to NPC behavior here, so a player who left mid-term doesn''t stall their committee''s agenda. 20270682.';

-- ── 3. committee_set_active_proposal — player chair path ────────
CREATE OR REPLACE FUNCTION public.committee_set_active_proposal(
    p_proposal_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_caller  factions%ROWTYPE;
    v_prop    committee_proposals%ROWTYPE;
    v_tick    int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_proposal_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_proposal_id');
    END IF;

    SELECT * INTO v_caller FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1;
    IF v_caller.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;

    -- Lock the proposal — serialises against concurrent promotion
    -- attempts on the same proposal.
    SELECT * INTO v_prop FROM committee_proposals
     WHERE id = p_proposal_id
     FOR UPDATE;
    IF v_prop.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'proposal_not_found');
    END IF;

    -- Caller must be the committee's chair. Chair row identifies
    -- via role = 'chair' AND politician_faction_id = caller.
    IF NOT EXISTS (
        SELECT 1 FROM committee_members
         WHERE committee_id = v_prop.committee_id
           AND role = 'chair'
           AND politician_faction_id = v_caller.id
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_committee_chair');
    END IF;

    IF v_prop.status <> 'queued' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'proposal_not_queued',
                                  'status', v_prop.status);
    END IF;

    -- No other proposal can be active in this committee. The partial
    -- unique index would catch this anyway, but the friendly error
    -- is nicer than bubbling SQLSTATE 23505.
    IF EXISTS (
        SELECT 1 FROM committee_proposals
         WHERE committee_id = v_prop.committee_id
           AND status = 'active'
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'agenda_already_active');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE committee_proposals
       SET status         = 'active',
           active_at_tick = v_tick
     WHERE id = v_prop.id;

    RETURN jsonb_build_object(
        'success',       true,
        'proposal_id',   v_prop.id,
        'committee_id',  v_prop.committee_id,
        'active_at_tick', v_tick
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.committee_set_active_proposal(uuid) TO authenticated;

-- ── 4. process_committee_npc_chair_agenda — tick processor ──────
CREATE OR REPLACE FUNCTION public.process_committee_npc_chair_agenda(p_tick int)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tick     int;
    v_promoted int := 0;
BEGIN
    -- Shard's current_tick wins over p_tick so an out-of-band call
    -- can't backdate or future-date promotions.
    v_tick := COALESCE((SELECT current_tick FROM shard WHERE name = 'Alpha Shard'), p_tick, 0);

    -- For every committee whose chair is NPC AND has no active
    -- proposal AND has at least one queued proposal: promote the
    -- oldest queued by (proposed_at_tick ASC, id ASC). Single
    -- statement so concurrent ticks don't double-promote (the
    -- partial unique index is the final safety net).
    WITH npc_committees AS (
        SELECT c.id AS committee_id
          FROM committees c
         WHERE NOT _committee_chair_is_player(c.id)
           AND NOT EXISTS (
               SELECT 1 FROM committee_proposals p
                WHERE p.committee_id = c.id
                  AND p.status = 'active'
           )
    ),
    next_up AS (
        SELECT DISTINCT ON (p.committee_id)
               p.id, p.committee_id
          FROM committee_proposals p
          JOIN npc_committees nc ON nc.committee_id = p.committee_id
         WHERE p.status = 'queued'
         ORDER BY p.committee_id, p.proposed_at_tick ASC, p.id ASC
    )
    UPDATE committee_proposals p
       SET status         = 'active',
           active_at_tick = v_tick
      FROM next_up
     WHERE p.id = next_up.id;
    GET DIAGNOSTICS v_promoted = ROW_COUNT;

    RETURN jsonb_build_object('success', true, 'tick', v_tick, 'promoted', v_promoted);
END;
$$;
GRANT EXECUTE ON FUNCTION public.process_committee_npc_chair_agenda(int) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
