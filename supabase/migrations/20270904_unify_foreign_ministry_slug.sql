-- ════════════════════════════════════════════════════════════════════
-- 20270904 — Unify the Foreign Affairs & Trade ministry slug
--
-- There is ONE Ministry of Foreign Affairs and Trade, but the political
-- canopy (Deputy Minister / Permanent Secretary) keyed it as
-- 'foreign_affairs_and_trade' while the ministry page, civil service,
-- paperwork, MINISTRY_NAMES, and ~every RPC use 'foreign_affairs'. A
-- Deputy Minister of 'foreign_affairs_and_trade' therefore didn't line
-- up with the ?ministry=foreign_affairs page or its civil servants.
--
-- This collapses the canopy onto the single canonical slug
-- 'foreign_affairs' (the smaller direction — 'foreign_affairs' is used
-- everywhere else; only these helpers + two PS-action functions carried
-- the combined slug). Mirrors the defense/security unification
-- (20270678).
--
-- Re-emits the two helper functions (verbatim except the slug) and the
-- two PS-action functions that hardcoded the slug (verbatim except the
-- slug), then backfills the two holder columns. Everything else reads
-- the slug through _major_ministry_keys() / _major_ministry_of_
-- politician(), so it updates automatically. Client mirror
-- (MAJOR_MINISTRY_LABEL, politician-home desk maps) lands alongside.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Helpers: the 4 major-ministry slugs are now self-named ─────
CREATE OR REPLACE FUNCTION public._major_ministry_keys()
RETURNS text[]
LANGUAGE sql IMMUTABLE
AS $$
    SELECT ARRAY['interior', 'defense', 'economic_development', 'foreign_affairs']::text[];
$$;

COMMENT ON FUNCTION public._major_ministry_keys() IS
    'Single source for the 4 major ministry slugs that back the political-canopy rungs (Permanent Secretary Tier 3 + Deputy Minister Tier 5). Mirrored client-side in js/utils.js MAJOR_MINISTRY_LABEL. 20270904: foreign_affairs_and_trade collapsed onto foreign_affairs (one Ministry of Foreign Affairs & Trade).';

-- The civil-service slug now equals its major-ministry slug for all
-- four; the CASE still returns NULL for any non-major ministry.
CREATE OR REPLACE FUNCTION public._major_ministry_of_politician(p_politician_ministry text)
RETURNS text
LANGUAGE sql IMMUTABLE
AS $$
    SELECT CASE p_politician_ministry
        WHEN 'defense'              THEN 'defense'
        WHEN 'foreign_affairs'      THEN 'foreign_affairs'
        WHEN 'economic_development' THEN 'economic_development'
        WHEN 'interior'             THEN 'interior'
        ELSE NULL
    END;
$$;

COMMENT ON FUNCTION public._major_ministry_of_politician(text) IS
    'Civil-service ministry slug → major-ministry slug for PS / DM slot assignment. 1:1 for the four majors (20270904 retired the foreign_affairs→foreign_affairs_and_trade collapse); NULL for any other ministry.';

-- ── 2. PS-action functions that hardcoded the combined slug ───────

-- ps_direct_portfolio (20270878, verbatim except the slug)
CREATE OR REPLACE FUNCTION public.ps_direct_portfolio(
    p_faction_id uuid,
    p_lever      text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_pol     factions%ROWTYPE;
    v_tick    int;
    v_levers  text[];
    v_d20     int;
    v_total   int;
    v_delta   numeric;
    v_new     numeric;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.politician_permanent_secretary_ministry IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_permanent_secretary');
    END IF;

    v_levers := CASE v_pol.politician_permanent_secretary_ministry
        WHEN 'interior'                  THEN ARRAY['crime', 'unrest']
        WHEN 'defense'                   THEN ARRAY['state_apparatus']
        WHEN 'economic_development'      THEN ARRAY['industry']
        WHEN 'foreign_affairs' THEN ARRAY['global_image']
        ELSE ARRAY[]::text[]
    END;
    IF p_lever IS NULL OR NOT (p_lever = ANY(v_levers)) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_lever',
                                  'levers', to_jsonb(v_levers));
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF v_pol.next_civil_service_action_tick IS NOT NULL
       AND v_pol.next_civil_service_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'on_cooldown',
            'ready_at_tick', v_pol.next_civil_service_action_tick);
    END IF;

    v_d20   := 1 + FLOOR(random() * 20)::int;
    v_total := v_d20 + FLOOR(COALESCE(v_pol.politician_skill, 0) / 5)::int;

    UPDATE factions SET next_civil_service_action_tick = v_tick + 1
     WHERE id = v_pol.id;

    -- A natural 1 backfires regardless of modifiers — the programme
    -- collapses in public view.
    IF v_d20 = 1 THEN
        UPDATE factions
           SET politician_reputation = GREATEST(0, COALESCE(politician_reputation, 0) - 1)
         WHERE id = v_pol.id;
        RETURN jsonb_build_object('success', true, 'outcome', 'backfired',
            'd20', v_d20, 'total', v_total, 'lever', p_lever,
            'reputation_delta', -1);
    END IF;

    IF v_total < 18 THEN
        RETURN jsonb_build_object('success', true, 'outcome', 'no_traction',
            'd20', v_d20, 'total', v_total, 'lever', p_lever, 'need', 18);
    END IF;

    -- Crime and unrest are good DOWN; the rest are good UP. Clamped
    -- to the 0..100 band like every other nation-stat writer.
    v_delta := CASE WHEN p_lever IN ('crime', 'unrest') THEN -0.5 ELSE 0.5 END;
    EXECUTE format(
        'UPDATE nations SET %I = LEAST(100, GREATEST(0, COALESCE(%I, 50) + $1)) WHERE id = $2 RETURNING %I',
        p_lever, p_lever, p_lever)
      INTO v_new
      USING v_delta, v_pol.nation_id;

    RETURN jsonb_build_object('success', true, 'outcome', 'moved',
        'd20', v_d20, 'total', v_total, 'lever', p_lever,
        'stat_delta', v_delta, 'new_value', v_new);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.ps_direct_portfolio(uuid, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.ps_direct_portfolio(uuid, text) TO authenticated;

-- ps_prepare_brief (20270878, verbatim except the slug)
CREATE OR REPLACE FUNCTION public.ps_prepare_brief(
    p_faction_id        uuid,
    p_target_faction_id uuid,
    p_kind              text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid      uuid := auth.uid();
    v_pol      factions%ROWTYPE;
    v_tgt      factions%ROWTYPE;
    v_tick     int;
    v_minister boolean;
    v_d20      int;
    v_caught   boolean := false;
    v_my_name  text;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL OR p_target_faction_id IS NULL
       OR p_kind IS NULL OR p_kind NOT IN ('thorough', 'thin') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.politician_permanent_secretary_ministry IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_permanent_secretary');
    END IF;
    IF p_target_faction_id = v_pol.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cannot_target_self');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF v_pol.next_civil_service_action_tick IS NOT NULL
       AND v_pol.next_civil_service_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'on_cooldown',
            'ready_at_tick', v_pol.next_civil_service_action_tick);
    END IF;

    SELECT * INTO v_tgt FROM factions
     WHERE id = p_target_faction_id
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
       AND nation_id = v_pol.nation_id
     FOR UPDATE;
    IF v_tgt.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'target_not_found');
    END IF;
    -- Any sitting Junior Minister takes briefs; the Foreign Minister
    -- only from the Foreign Affairs and Trade desk.
    v_minister := v_tgt.politician_junior_portfolio IS NOT NULL
        OR (v_tgt.politician_foreign_minister_at_tick IS NOT NULL
            AND v_pol.politician_permanent_secretary_ministry = 'foreign_affairs');
    IF NOT v_minister THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_a_minister');
    END IF;

    UPDATE factions SET next_civil_service_action_tick = v_tick + 1
     WHERE id = v_pol.id;

    IF p_kind = 'thorough' THEN
        UPDATE factions SET pending_brief_mod = 2 WHERE id = v_tgt.id;
        UPDATE factions
           SET politician_influence = COALESCE(politician_influence, 0) + 0.5
         WHERE id = v_pol.id;
        RETURN jsonb_build_object('success', true, 'kind', 'thorough',
            'brief_mod', 2, 'influence_delta', 0.5);
    END IF;

    -- Thin brief: plant the -2, then the scandal check.
    UPDATE factions SET pending_brief_mod = -2 WHERE id = v_tgt.id;
    v_d20 := 1 + FLOOR(random() * 20)::int;
    IF v_d20 <= 5 THEN
        v_caught  := true;
        v_my_name := NULLIF(btrim(COALESCE(v_pol.leader_first_name, '') || ' ' ||
                                  COALESCE(v_pol.leader_last_name, '')), '');
        UPDATE factions
           SET politician_reputation = GREATEST(0, COALESCE(politician_reputation, 0) - 2)
         WHERE id = v_pol.id;
        INSERT INTO politician_career_events
            (faction_id, event_tick, event_type, target_name)
        VALUES
            (v_tgt.id, v_tick, 'brief_sabotage_caught',
             COALESCE(v_my_name, 'the Permanent Undersecretary'));
    END IF;

    RETURN jsonb_build_object('success', true, 'kind', 'thin',
        'brief_mod', -2, 'caught', v_caught, 'scandal_d20', v_d20,
        'reputation_delta', CASE WHEN v_caught THEN -2 ELSE 0 END);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.ps_prepare_brief(uuid, uuid, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.ps_prepare_brief(uuid, uuid, text) TO authenticated;

-- ── 3. Backfill the holder columns to the unified slug ────────────
UPDATE factions SET politician_deputy_minister_ministry = 'foreign_affairs'
 WHERE politician_deputy_minister_ministry = 'foreign_affairs_and_trade';
UPDATE factions SET politician_permanent_secretary_ministry = 'foreign_affairs'
 WHERE politician_permanent_secretary_ministry = 'foreign_affairs_and_trade';

NOTIFY pgrst, 'reload schema';

COMMIT;
