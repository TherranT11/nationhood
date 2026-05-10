-- ════════════════════════════════════════════════════════════════
-- Vola Cup tables — schema-drift backfill
--
-- The four VWC pipeline tables (vola_cup_groups,
-- vola_cup_group_matches, vola_cup_knockout, vola_cup_final_standings)
-- were defined in migrations 20260931–20260934, but those timestamps
-- were already behind the prod migration high-water mark by the time
-- the files landed, so `supabase db push` silently skipped them.
-- Symptom (confirmed via 2026-05-10 diagnostic):
--     ERROR: 42P01: relation "vola_cup_group_matches" does not exist
--
-- Once f9de88c lands the placement chain will actually run for the
-- first time — and would fail on every downstream INSERT without
-- these tables. This migration re-issues the four CREATE TABLEs,
-- their indexes, comments, and RLS policies, all idempotent (
-- CREATE TABLE IF NOT EXISTS, CREATE INDEX IF NOT EXISTS,
-- DROP POLICY IF EXISTS + CREATE POLICY). Safe to re-run.
--
-- Same forward-dated-recreate pattern we used at 20261123 for the
-- aligned_interest_floor_apr / _ceiling_apr columns.
-- ════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. vola_cup_groups (Phase 1: post-placement draw) ──────────
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


-- ── 2. vola_cup_group_matches (Phase 2: group-stage matches) ───
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


-- ── 3. vola_cup_knockout (Phase 3: knockout bracket) ──────────
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


-- ── 4. vola_cup_final_standings (Phase 5: cup result history) ──
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
    'Per-cup final standings (1..13). Written by settleVolaCupChampionship at the final tick.';

ALTER TABLE public.vola_cup_final_standings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Vola cup final standings viewable by all authenticated"
    ON public.vola_cup_final_standings;
CREATE POLICY "Vola cup final standings viewable by all authenticated"
    ON public.vola_cup_final_standings
    FOR SELECT TO authenticated
    USING (true);

COMMIT;

NOTIFY pgrst, 'reload schema';
