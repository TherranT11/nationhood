-- ════════════════════════════════════════════════════════════════════
-- 20270683 — Undo 20270682's status-enum mismatch + redundancies
--
-- 20270682 (committee active-agenda mechanic) was shipped without
-- reading 20270662 first. That migration introduced four problems:
--
--   1. It DROPPED the canonical 9-value committee_proposals.status
--      enum (queued, in_hearing, awaiting_report_vote, reported,
--      tabled, on_floor, enacted, failed, withdrawn from 20270662)
--      and replaced it with a 5-value enum (queued, active, tabled,
--      reported_out, withdrawn). Any row with status in {in_hearing,
--      awaiting_report_vote, reported, on_floor, enacted, failed}
--      now violates the CHECK constraint — including every enacted
--      statute that could be amended via committee_propose_amendment
--      (which gates on status='enacted').
--
--   2. It reintroduced 'reported_out' as a status value, which
--      20270662 had explicitly removed (with a UPDATE backfill to
--      'reported' for any existing rows).
--
--   3. It invented a brand-new 'active' status to mean "currently
--      being heard," but 'in_hearing' was already the canonical
--      slug for exactly that state, with all the supporting
--      infrastructure built in 20270499 + 20270662:
--        • committee_hold_hearing / close_committee_hearing RPCs
--        • committee_hearings table with closes_at_tick = +3
--        • _seed_hearing_personas function
--        • committee_hearings_one_open_idx partial index (one open
--          hearing per committee)
--      The committee_set_active_proposal RPC + the partial unique
--      index on committee_proposals.status='active' + the
--      active_at_tick column were all redundant duplicates of
--      what already existed at the committee_hearings layer.
--
--   4. process_committee_npc_chair_agenda flipped status to 'active'
--      but skipped the rest of the hearing-open ceremony — no
--      committee_hearings row, no closes_at_tick, no persona seed.
--      Downstream consumers (testimony submission, the report-vote
--      gate) all key off committee_hearings.status = 'open', so the
--      "promoted" proposals would never appear as live hearings.
--
-- This migration:
--   • Restores the 9-value status enum from 20270662 verbatim.
--   • Migrates any rows with status='active' (left by 20270682) →
--     'in_hearing', so the new CHECK constraint passes during the
--     ADD.
--   • Drops the redundant committee_set_active_proposal RPC, the
--     partial unique index on status='active', and the
--     active_at_tick column.
--   • Keeps _committee_chair_is_player(uuid) — a useful helper
--     that doesn't collide with anything.
--   • Rewrites process_committee_npc_chair_agenda to mirror
--     committee_hold_hearing's full behavior: create the
--     committee_hearings row, flip the proposal status, seed
--     personas. The result is "if the chair is NPC, the oldest
--     queued proposal opens a hearing exactly as if the chair had
--     called committee_hold_hearing manually."
--
-- The committee active-agenda mechanic is now correct AND aligned
-- with the existing 20270662 vocabulary. The "5 stakeholders" UI
-- + persona_roles column lands in 20270684 — that's the actual
-- feature the user asked for.
--
-- Apply after 20270682.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Migrate any rows my broken CHECK happened to allow ────────
-- 20270682 narrowed the enum to (queued, active, tabled,
-- reported_out, withdrawn). Map 'active' back to 'in_hearing' and
-- 'reported_out' back to 'reported' (the 20270662 idempotent
-- backfill) so the new CHECK passes during ADD.
UPDATE public.committee_proposals
   SET status = 'in_hearing'
 WHERE status = 'active';
UPDATE public.committee_proposals
   SET status = 'reported'
 WHERE status = 'reported_out';

-- ── 2. Restore 9-value status enum ───────────────────────────────
ALTER TABLE public.committee_proposals
    DROP CONSTRAINT IF EXISTS committee_proposals_status_check;
ALTER TABLE public.committee_proposals
    ADD CONSTRAINT committee_proposals_status_check
    CHECK (status IN (
        'queued',
        'in_hearing',
        'awaiting_report_vote',
        'reported',
        'tabled',
        'on_floor',
        'enacted',
        'failed',
        'withdrawn'
    ));

-- ── 3. Drop the redundant pieces from 20270682 ───────────────────
DROP INDEX IF EXISTS public.committee_proposals_one_active_per_committee;
ALTER TABLE public.committee_proposals DROP COLUMN IF EXISTS active_at_tick;
DROP FUNCTION IF EXISTS public.committee_set_active_proposal(uuid);

-- ── 4. Rewrite process_committee_npc_chair_agenda properly ───────
-- For every committee whose chair is NPC AND has no open hearing,
-- open a hearing on the oldest queued proposal — exactly what
-- committee_hold_hearing does for player chairs, minus the chair
-- gate. Iterating committee-by-committee because INSERT into
-- committee_hearings + UPDATE committee_proposals + PERFORM
-- _seed_hearing_personas don't compose into a single CTE-driven
-- statement.
CREATE OR REPLACE FUNCTION public.process_committee_npc_chair_agenda(p_tick int)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tick      int;
    v_promoted  int := 0;
    v_committee record;
    v_prop      record;
    v_hearing   uuid;
BEGIN
    v_tick := COALESCE((SELECT current_tick FROM shard WHERE name = 'Alpha Shard'), p_tick, 0);

    FOR v_committee IN
        SELECT c.id AS committee_id, c.nation_id
          FROM committees c
         WHERE NOT _committee_chair_is_player(c.id)
           AND NOT EXISTS (
               SELECT 1 FROM committee_hearings h
                WHERE h.committee_id = c.id
                  AND h.status = 'open'
           )
    LOOP
        SELECT id, category INTO v_prop
          FROM committee_proposals
         WHERE committee_id = v_committee.committee_id
           AND status = 'queued'
         ORDER BY proposed_at_tick ASC, id ASC
         LIMIT 1;

        IF v_prop.id IS NOT NULL THEN
            INSERT INTO committee_hearings (
                committee_id, proposal_id, nation_id, opened_by_faction_id,
                opened_at_tick, closes_at_tick, status
            ) VALUES (
                v_committee.committee_id, v_prop.id, v_committee.nation_id, NULL,
                v_tick, v_tick + 3, 'open'
            ) RETURNING id INTO v_hearing;

            UPDATE committee_proposals
               SET status = 'in_hearing'
             WHERE id = v_prop.id;

            PERFORM _seed_hearing_personas(v_hearing, v_prop.category, v_committee.nation_id);

            v_promoted := v_promoted + 1;
        END IF;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'tick', v_tick, 'promoted', v_promoted);
END;
$$;
GRANT EXECUTE ON FUNCTION public.process_committee_npc_chair_agenda(int) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
