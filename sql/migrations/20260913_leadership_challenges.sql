-- 20260913_leadership_challenges.sql
--
-- Coalition leadership challenge log. When the Head of Government seat
-- is vacant inside an active coalition, a coalition member can claim
-- the Premiership for their party leader. Multiple parties may claim on
-- the same tick; the next tick's resolveLeadershipChallenges pass picks
-- the one with the most seats (earliest claim wins ties) and installs
-- their leader as PM.
--
-- One row per (nation, faction, claimed_at_tick) — UNIQUE constraint
-- makes the action idempotent against double-clicks. Resolution writes
-- back: resolved_at_tick + resolution ('won' | 'lost' | 'discarded').
--
-- 'discarded' = vacancy filled or coalition collapsed between claim
-- tick and resolution tick; no winner emerges, no popularity boost,
-- claimers can re-challenge once a new vacancy opens.

BEGIN;

CREATE TABLE IF NOT EXISTS public.leadership_challenges (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nation_id         UUID NOT NULL REFERENCES public.nations(id) ON DELETE CASCADE,
    faction_id        UUID NOT NULL REFERENCES public.factions(id) ON DELETE CASCADE,
    claimed_at_tick   INT  NOT NULL,
    resolved_at_tick  INT,
    resolution        TEXT CHECK (resolution IN ('won', 'lost', 'discarded')),
    seats_at_claim    INT  NOT NULL DEFAULT 0,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (nation_id, faction_id, claimed_at_tick)
);

CREATE INDEX IF NOT EXISTS leadership_challenges_pending_idx
    ON public.leadership_challenges (nation_id, claimed_at_tick)
    WHERE resolved_at_tick IS NULL;

COMMENT ON TABLE public.leadership_challenges IS
    'Per-tick claim log for coalition Leadership Challenge action. Pending rows (resolved_at_tick IS NULL) are processed by resolveLeadershipChallenges each tick.';

NOTIFY pgrst, 'reload schema';

COMMIT;
