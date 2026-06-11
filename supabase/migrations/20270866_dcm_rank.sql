-- ════════════════════════════════════════════════════════════════════
-- 20270866 — Deputy Chief of Mission (Foreign Service tier 3)
--
-- Promotion: a serving Consul with 20 Experience (politician_skill)
-- picks a VACANT region — the game's continents (nations.continent):
-- Crucera, Meridian, Al-Makir, Faresia, Vesperia, Nexir, Serranthia.
-- One DCM per home-nation-per-region (partial unique index, the
-- consul-rule shape); the consul posting clears at promotion, so the
-- consulate vacates for the next climber.
--
-- V1 ships the post + the affiliation card with the STATION BOARD
-- (design ruling): the region's nations, who from the DCM's nation
-- serves where (Consul / Attaché), vacancies in red, with aggregate
-- stats computed client-side from the same rows everything else
-- reads — COVERAGE, MISSION STRENGTH (avg officer embassy
-- Reputation), REGIONAL STANDING (avg relation_score home↔region).
-- Regional actions are a follow-up; no new mechanics here.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.factions
    ADD COLUMN IF NOT EXISTS politician_dcm_region  text,
    ADD COLUMN IF NOT EXISTS politician_dcm_at_tick int;

COMMENT ON COLUMN public.factions.politician_dcm_region IS
    'The region (nations.continent) this politician runs as Deputy Chief of Mission (20270866). One DCM per home-nation-per-region — the partial unique index is the structural backstop; abandoning the faction vacates the post.';

CREATE UNIQUE INDEX IF NOT EXISTS factions_one_dcm_per_region
    ON public.factions (nation_id, politician_dcm_region)
    WHERE politician_dcm_region IS NOT NULL AND abandoned_at IS NULL;

-- ── politician_take_dcm_post ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.politician_take_dcm_post(
    p_faction_id uuid,
    p_region     text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid  uuid := auth.uid();
    v_pol  factions%ROWTYPE;
    v_tick int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL OR p_region IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_region NOT IN ('Crucera', 'Meridian', 'Al-Makir', 'Faresia',
                        'Vesperia', 'Nexir', 'Serranthia') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_region');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF lower(COALESCE(v_pol.status, '')) = 'arrested' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'arrested');
    END IF;
    IF v_pol.politician_consul_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_consul');
    END IF;
    IF COALESCE(v_pol.politician_skill, 0) < 20 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_enough_experience',
            'need', 20, 'have', COALESCE(v_pol.politician_skill, 0));
    END IF;
    IF EXISTS (SELECT 1 FROM factions
                WHERE faction_type = 'politician'
                  AND abandoned_at IS NULL
                  AND nation_id = v_pol.nation_id
                  AND politician_dcm_region = p_region) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'region_occupied');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    BEGIN
        UPDATE factions
           SET politician_dcm_region        = p_region,
               politician_dcm_at_tick       = v_tick,
               politician_consul_nation_id  = NULL,
               politician_consul_at_tick    = NULL
         WHERE id = v_pol.id;
    EXCEPTION WHEN unique_violation THEN
        -- Lost the race for the region.
        RETURN jsonb_build_object('success', false, 'reason', 'region_occupied');
    END;

    INSERT INTO politician_career_events (faction_id, event_tick, event_type, target_name, metadata)
    VALUES (v_pol.id, v_tick, 'dcm_posted', p_region,
            jsonb_build_object('region', p_region));

    RETURN jsonb_build_object('success', true, 'region', p_region);
END $$;

REVOKE EXECUTE ON FUNCTION public.politician_take_dcm_post(uuid, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.politician_take_dcm_post(uuid, text) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
