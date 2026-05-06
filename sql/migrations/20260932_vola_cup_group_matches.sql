-- 20260932_vola_cup_group_matches.sql
--
-- Phase 2 of the VWC pipeline: per-group round-robin matches.
--
-- Each group of 4 plays a 3-round round-robin (6 matches per
-- group × 3 groups = 18 matches per cup). Pairing:
--   Round 1 (tick cup_start+0): seed1 v seed2, seed3 v seed4
--   Round 2 (tick cup_start+1): seed1 v seed3, seed2 v seed4
--   Round 3 (tick cup_start+2): seed1 v seed4, seed2 v seed3
--
-- Schedule rows are inserted by generateVolaCupGroupSchedule the
-- moment the draw lands (chained off generateVolaCupGroupDraw).
-- Resolver is processVolaCupGroupMatches (per-tick, server-side).
-- W-L / PTS standings are derived live from this table by the UI.

BEGIN;

CREATE TABLE IF NOT EXISTS public.vola_cup_group_matches (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cup_number        INT  NOT NULL,
    group_letter      TEXT NOT NULL CHECK (group_letter IN ('A','B','C')),
    round_number      INT  NOT NULL CHECK (round_number BETWEEN 1 AND 3),
    match_in_round    INT  NOT NULL CHECK (match_in_round BETWEEN 1 AND 2),
    scheduled_tick    INT  NOT NULL,
    team_a_nation_id  UUID NOT NULL REFERENCES public.nations(id) ON DELETE CASCADE,
    team_b_nation_id  UUID NOT NULL REFERENCES public.nations(id) ON DELETE CASCADE,
    team_a_score      INT,
    team_b_score      INT,
    winner_nation_id  UUID REFERENCES public.nations(id) ON DELETE SET NULL,
    resolved_at_tick  INT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (cup_number, group_letter, round_number, match_in_round)
);

CREATE INDEX IF NOT EXISTS vola_cup_group_matches_due_idx
    ON public.vola_cup_group_matches (scheduled_tick)
    WHERE resolved_at_tick IS NULL;
CREATE INDEX IF NOT EXISTS vola_cup_group_matches_cup_idx
    ON public.vola_cup_group_matches (cup_number, group_letter);

COMMENT ON TABLE public.vola_cup_group_matches IS
    'Per-cup group-stage matches. 6 per group × 3 groups = 18 per cup. Generated when the draw lands; resolved one round per tick (cup_start, +1, +2) by processVolaCupGroupMatches.';

ALTER TABLE public.vola_cup_group_matches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Vola cup group matches viewable by all authenticated"
    ON public.vola_cup_group_matches;
CREATE POLICY "Vola cup group matches viewable by all authenticated"
    ON public.vola_cup_group_matches
    FOR SELECT TO authenticated
    USING (true);
-- Writes via service_role only (tick processor).

NOTIFY pgrst, 'reload schema';

COMMIT;
