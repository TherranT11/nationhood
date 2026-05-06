-- 20260933_vola_cup_knockout.sql
--
-- Phase 3 of the VWC pipeline: knockout bracket seed.
--
-- 7 rows per cup: 4 QF (cup_start+3), 2 SF (cup_start+4), 1 F
-- (cup_start+5). QF rows are seeded with both teams the moment
-- the group stage finishes; SF and F rows have feeder_a_match
-- and feeder_b_match references so Phase 4 can fill in
-- team_a/b_nation_id when the upstream match resolves.
--
-- Seed assignment:
--   1-3: group winners sorted by W → PTS → prowess → name
--   4-6: group runners-up sorted same
--   7-8: top 2 third-placers across all groups
-- Pairings: QF1=1v8, QF2=4v5, QF3=3v6, QF4=2v7. SF1=QF1+QF2,
-- SF2=QF3+QF4. F=SF1+SF2.

BEGIN;

CREATE TABLE IF NOT EXISTS public.vola_cup_knockout (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cup_number        INT  NOT NULL,
    round             TEXT NOT NULL CHECK (round IN ('QF','SF','F')),
    match_number      INT  NOT NULL CHECK (match_number BETWEEN 1 AND 4),
    scheduled_tick    INT  NOT NULL,
    team_a_nation_id  UUID REFERENCES public.nations(id) ON DELETE SET NULL,
    team_b_nation_id  UUID REFERENCES public.nations(id) ON DELETE SET NULL,
    team_a_seed       INT,
    team_b_seed       INT,
    feeder_a_match    INT,
    feeder_b_match    INT,
    team_a_score      INT,
    team_b_score      INT,
    winner_nation_id  UUID REFERENCES public.nations(id) ON DELETE SET NULL,
    resolved_at_tick  INT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (cup_number, round, match_number)
);

CREATE INDEX IF NOT EXISTS vola_cup_knockout_due_idx
    ON public.vola_cup_knockout (scheduled_tick)
    WHERE resolved_at_tick IS NULL;
CREATE INDEX IF NOT EXISTS vola_cup_knockout_cup_idx
    ON public.vola_cup_knockout (cup_number, round, match_number);

COMMENT ON TABLE public.vola_cup_knockout IS
    'Per-cup knockout bracket. 4 QF (teams seeded immediately) + 2 SF + 1 F (teams filled by Phase 4 from feeder match winners). round IN (QF, SF, F).';

ALTER TABLE public.vola_cup_knockout ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Vola cup knockout viewable by all authenticated"
    ON public.vola_cup_knockout;
CREATE POLICY "Vola cup knockout viewable by all authenticated"
    ON public.vola_cup_knockout
    FOR SELECT TO authenticated
    USING (true);
-- Writes via service_role only (tick processor).

NOTIFY pgrst, 'reload schema';

COMMIT;
