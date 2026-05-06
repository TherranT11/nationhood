-- ═══════════════════════════════════════════════════════════════════════════════
-- NATIONS — add 3 hidden Vola stat columns surfaced as Sports subtab boxes
-- ═══════════════════════════════════════════════════════════════════════════════
-- Companion stats to national_vola_culture, displayed as the trio of stat
-- boxes to the right of the National Sports Culture container in the
-- World/Diplomacy → Sports subtab. All three default to 0 for every nation
-- and are not yet driven by any gameplay system — placeholders for future
-- tournament / national-team / infrastructure mechanics.
--
-- Kept out of NATION_STAT_COLUMNS so the additive stat pipeline (events,
-- policies, ministry effects, stat connections) doesn't touch them. Their
-- update paths will be bespoke when the subsystems land.
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.nations
    ADD COLUMN IF NOT EXISTS vwc_ranking          SMALLINT NOT NULL DEFAULT 0 CHECK (vwc_ranking >= 0),
    ADD COLUMN IF NOT EXISTS national_team_prowess INT     NOT NULL DEFAULT 0 CHECK (national_team_prowess >= 0),
    ADD COLUMN IF NOT EXISTS vola_stadiums        SMALLINT NOT NULL DEFAULT 0 CHECK (vola_stadiums >= 0);

COMMENT ON COLUMN public.nations.vwc_ranking IS
    'Hidden Vola World Cup ranking. 0 = unranked. Lower positive values = higher rank. Default 0.';
COMMENT ON COLUMN public.nations.national_team_prowess IS
    'Hidden total prowess of the national Vola team (sum across players). Default 0.';
COMMENT ON COLUMN public.nations.vola_stadiums IS
    'Hidden count of completed Vola stadiums in this nation. Default 0.';

NOTIFY pgrst, 'reload schema';

COMMIT;
