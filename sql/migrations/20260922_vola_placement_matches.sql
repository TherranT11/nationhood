-- 20260922_vola_placement_matches.sql
--
-- VWC PLACEMENT MATCHES — bottom-3 round-robin to fill spots 11/12.
--
-- With 13 nations in the world, the top 10 auto-qualify by VWC ranking
-- (cycle 1 fallback: prowess → culture → name) and the bottom 3 play a
-- 3-team round-robin over 3 ticks starting at qualifier_tick:
--
--   qualifier_tick + 0 : Match 1  (A vs B)
--   qualifier_tick + 1 : Match 2  (A vs C)
--   qualifier_tick + 2 : Match 3  (B vs C)
--
-- Match score = (national_team_prowess + 1d20), clamped 1..24 per side.
-- Standings: wins DESC, then total points DESC, then random tiebreak.
-- Top 2 → cup spots 11 + 12. Bottom 1 → Aspirant flag (label only) +
-- −1 Global Image penalty.
--
-- Schema only ships the table + the aspirant flag. Schedule generation
-- and match resolution live JS-side (political-actions.js, called from
-- the post-loop block in handler-template).

BEGIN;

CREATE TABLE IF NOT EXISTS public.vola_placement_matches (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cup_number          INT  NOT NULL CHECK (cup_number > 0),
    match_number        INT  NOT NULL CHECK (match_number BETWEEN 1 AND 3),
    scheduled_tick      INT  NOT NULL,
    team_a_nation_id    UUID NOT NULL REFERENCES nations(id) ON DELETE CASCADE,
    team_b_nation_id    UUID NOT NULL REFERENCES nations(id) ON DELETE CASCADE,
    team_a_score        INT,
    team_b_score        INT,
    winner_nation_id    UUID REFERENCES nations(id) ON DELETE SET NULL,
    resolved_at_tick    INT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (cup_number, match_number)
);

CREATE INDEX IF NOT EXISTS vola_placement_pending_idx
    ON public.vola_placement_matches (scheduled_tick)
    WHERE resolved_at_tick IS NULL;

COMMENT ON TABLE public.vola_placement_matches IS
    'Bottom-3 round-robin matches that fill VWC spots 11 + 12. 3 rows per cup. Score formula: (national_team_prowess + 1d20) clamped 1..24, both sides rolled at scheduled_tick.';

-- Aspirant flag — purely cosmetic for now (badge in the UI). Set when
-- the bottom-1 of placement is determined; cleared when the next
-- placement round generates so it always reflects "still aspiring this
-- cycle".
ALTER TABLE public.nations
    ADD COLUMN IF NOT EXISTS is_vola_aspirant BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.nations.is_vola_aspirant IS
    'True when this nation lost the bottom-1 slot of the most recent placement round. Just a label for now; mechanically the nation is treated like any other non-qualifier next cycle.';

-- ── Read access ────────────────────────────────────────────────────
ALTER TABLE public.vola_placement_matches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Placement matches viewable by all authenticated"
    ON public.vola_placement_matches;
CREATE POLICY "Placement matches viewable by all authenticated"
    ON public.vola_placement_matches
    FOR SELECT TO authenticated
    USING (true);
-- Writes: service_role only (tick processor). No INSERT/UPDATE policies
-- for authenticated.

NOTIFY pgrst, 'reload schema';

COMMIT;
