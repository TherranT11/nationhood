-- 20260934_vola_cup_final_standings.sql
--
-- Phase 5 of the VWC pipeline: per-cup final standings and the
-- crowning hook.
--
-- One row per nation per cup. final_position is unique within a
-- cup (1..13) and feeds back into nations.vwc_ranking when
-- settleVolaCupChampionship runs at cup_start+5 (final tick).
--
-- eliminated_at is bookkeeping for the UI / future event feed:
--   'champion'     → cup winner
--   'final'        → runner-up
--   'semifinal'    → 2 SF losers
--   'quarterfinal' → 4 QF losers
--   'group_stage'  → 4 non-knockout (1 worst 3rd-placer + 3 4th-placers)
--   'placement'    → aspirant (placement loser, didn't enter cup)

BEGIN;

CREATE TABLE IF NOT EXISTS public.vola_cup_final_standings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cup_number      INT  NOT NULL,
    nation_id       UUID NOT NULL REFERENCES public.nations(id) ON DELETE CASCADE,
    final_position  INT  NOT NULL CHECK (final_position BETWEEN 1 AND 13),
    eliminated_at   TEXT NOT NULL CHECK (eliminated_at IN ('champion','final','semifinal','quarterfinal','group_stage','placement')),
    settled_at_tick INT  NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (cup_number, nation_id),
    UNIQUE (cup_number, final_position)
);

CREATE INDEX IF NOT EXISTS vola_cup_final_standings_cup_idx
    ON public.vola_cup_final_standings (cup_number, final_position);

COMMENT ON TABLE public.vola_cup_final_standings IS
    'Per-cup final standings (1..13). Written by settleVolaCupChampionship at the final tick. nations.vwc_ranking is set from final_position so the next cup''s seeding uses these results.';

ALTER TABLE public.vola_cup_final_standings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Vola cup final standings viewable by all authenticated"
    ON public.vola_cup_final_standings;
CREATE POLICY "Vola cup final standings viewable by all authenticated"
    ON public.vola_cup_final_standings
    FOR SELECT TO authenticated
    USING (true);
-- Writes via service_role only (tick processor).

NOTIFY pgrst, 'reload schema';

COMMIT;
