-- ═══════════════════════════════════════════════════════════════════════════════
-- NATIONS — add hidden `national_vola_culture` stat column
-- ═══════════════════════════════════════════════════════════════════════════════
-- 0-100 hidden stat used by the Sports subtab (Ministry of Sports → Vola
-- Program). Defaults to 0 for every nation. Decays 3% per tick (handled
-- in JS by processVolaCultureDecay in political-actions.js / advance-tick
-- edge function).
--
-- Kept out of NATION_STAT_COLUMNS / STAT_DECAY_CONFIG so the standard
-- additive stat pipeline (events, policies, ministry effects, stat
-- connections) doesn't touch it. Multiplicative decay diverges from the
-- additive system by design.
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.nations
    ADD COLUMN IF NOT EXISTS national_vola_culture SMALLINT NOT NULL DEFAULT 0
        CHECK (national_vola_culture BETWEEN 0 AND 100);

UPDATE public.nations
SET national_vola_culture = 0
WHERE national_vola_culture IS NULL;

COMMENT ON COLUMN public.nations.national_vola_culture IS
    'Hidden Vola Program engagement, 0-100. Defaults to 0. Decays 3% per tick toward 0 (multiplicative).';

NOTIFY pgrst, 'reload schema';

COMMIT;
