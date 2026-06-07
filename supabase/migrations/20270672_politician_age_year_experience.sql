-- ════════════════════════════════════════════════════════════════════
-- 20270672 — Politician age-year Experience awards
--
-- Every politician with an active career or affiliation gains +1
-- Experience (politician_skill column — displayed as Experience per
-- the 8d3bd59 rename) whenever their age ticks over a year. Age is
-- derived: START_AGE (25) + floor((current_tick - founded_tick) /
-- TICKS_PER_AGE_YEAR (12)); a year passes every 12 ticks since
-- founding. The award fires on the exact tick where (current_tick -
-- founded_tick) is a positive multiple of 12.
--
-- Active career/affiliation filter — current-state columns only:
--   abandoned_at              IS NULL  (politician hasn't quit)
--   AND (
--     politician_party_id     IS NOT NULL  (party member)
--     OR politician_office    IS NOT NULL  (elected office)
--     OR politician_ministry  IS NOT NULL  (civil service)
--     OR bar_admitted_nation_id IS NOT NULL (bar-admitted advocate)
--   )
--
-- *_at_tick stamp columns (politician_senior_civil_servant_at_tick,
-- politician_speaker_of_assembly_at_tick, etc.) are deliberately
-- NOT in the filter — they capture historical achievement and never
-- clear, which would award retired Agency Heads / Speakers / etc.
-- forever. The four current-state columns above clear when the
-- politician steps away from the role, so the award correctly tracks
-- engagement, not legacy.
--
-- "Blank slate" politicians (founded but never affiliated) accrue
-- nothing — they have to actually do something first. This rewards
-- engagement while leaving player-driven Experience grind (file
-- paperwork, run office hours, etc.) as the primary climbing path.
--
-- Dual-constant landmine: TICKS_PER_AGE_YEAR (12) + START_AGE (25)
-- live in js/utils.js and are hardcoded again here. SQL has no
-- shared-constant import. Flagging — if either ever changes, this
-- function must move in lockstep. A SoT-correct fix would be a SQL
-- helper _politician_age_constants() but that's deferred.
--
-- Idempotency: politician_career_events gets one row per award
-- (event_type='age_year_experience_award'). The UPDATE's NOT EXISTS
-- guard skips any politician already awarded for v_tick, so manual
-- reprocessing of the same tick is a clean no-op.
--
-- Apply after 20270671.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.process_politician_age_year_experience(p_tick int)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_tick    int;
    v_awarded int := 0;
BEGIN
    -- Shard current_tick is the SoT — p_tick is the hint, the shard
    -- value wins so an out-of-band caller can't backdate awards.
    v_tick := COALESCE((SELECT current_tick FROM shard WHERE name = 'Alpha Shard'), p_tick, 0);

    WITH awards AS (
        UPDATE factions f
           SET politician_skill = COALESCE(f.politician_skill, 0) + 1
         WHERE f.faction_type = 'politician'
           AND f.abandoned_at IS NULL
           AND f.founded_tick IS NOT NULL
           AND v_tick > f.founded_tick
           AND (v_tick - f.founded_tick) % 12 = 0
           AND (
                f.politician_party_id        IS NOT NULL
             OR f.politician_office          IS NOT NULL
             OR f.politician_ministry        IS NOT NULL
             OR f.bar_admitted_nation_id     IS NOT NULL
           )
           AND NOT EXISTS (
                SELECT 1 FROM politician_career_events e
                 WHERE e.faction_id = f.id
                   AND e.event_tick = v_tick
                   AND e.event_type = 'age_year_experience_award'
           )
         RETURNING f.id, ((v_tick - f.founded_tick) / 12) AS years_since_founding
    )
    INSERT INTO politician_career_events
        (faction_id, event_tick, event_type, target_name)
    SELECT id, v_tick, 'age_year_experience_award',
           'year ' || years_since_founding::text
      FROM awards;
    GET DIAGNOSTICS v_awarded = ROW_COUNT;

    RETURN jsonb_build_object('success', true, 'tick', v_tick, 'awarded', v_awarded);
END;
$$;

GRANT EXECUTE ON FUNCTION public.process_politician_age_year_experience(int) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
