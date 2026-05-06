-- 20260931_vola_cup_groups.sql
--
-- Phase 1 of the VWC group/knockout pipeline: store the result of
-- the group draw for each cup. 12 qualified nations distributed
-- into Groups A / B / C, 4 teams per group.
--
-- Draw logic (in JS): seed by vwc_ranking ASC (cycle 1 falls back
-- to national_team_prowess DESC), break into 4 pots of 3, shuffle
-- within each pot, then deal pot 1 → A1/B1/C1, pot 2 → A2/B2/C2,
-- pot 3 → A3/B3/C3, pot 4 → A4/B4/C4.
--
-- Fires from processVolaPlacementMatches once Match 3 of the
-- placement round settles (= qualifier_tick + 2). Aspirant
-- (is_vola_aspirant=true) is excluded; the remaining 12 are the
-- qualified set.

BEGIN;

CREATE TABLE IF NOT EXISTS public.vola_cup_groups (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cup_number      INT  NOT NULL,
    nation_id       UUID NOT NULL REFERENCES public.nations(id) ON DELETE CASCADE,
    group_letter    TEXT NOT NULL CHECK (group_letter IN ('A','B','C')),
    seed_rank       INT  NOT NULL CHECK (seed_rank BETWEEN 1 AND 4),
    qualified_via   TEXT NOT NULL CHECK (qualified_via IN ('auto','placement')),
    drawn_at_tick   INT  NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (cup_number, nation_id),
    UNIQUE (cup_number, group_letter, seed_rank)
);

CREATE INDEX IF NOT EXISTS vola_cup_groups_cup_idx
    ON public.vola_cup_groups (cup_number, group_letter, seed_rank);

COMMENT ON TABLE public.vola_cup_groups IS
    'Per-cup group draw: 12 qualified nations × {A,B,C} × seed 1-4. Aspirant excluded. Written by generateVolaCupGroupDraw after placement Match 3 settles.';

ALTER TABLE public.vola_cup_groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Vola cup groups viewable by all authenticated"
    ON public.vola_cup_groups;
CREATE POLICY "Vola cup groups viewable by all authenticated"
    ON public.vola_cup_groups
    FOR SELECT TO authenticated
    USING (true);
-- Writes via service_role only (tick processor).

NOTIFY pgrst, 'reload schema';

COMMIT;
