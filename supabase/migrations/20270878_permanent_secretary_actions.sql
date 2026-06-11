-- ════════════════════════════════════════════════════════════════════
-- 20270878 — Permanent Undersecretary kit (Tier 3 civil service)
--
-- Three approved actions for the Permanent Secretary rung
-- (politician_permanent_secretary_ministry holders), all sharing
-- the civil-service per-tick lock (next_civil_service_action_tick):
--
--   1. ps_direct_portfolio — the only action in the game where one
--      politician moves a nation stat directly. d20 + Experience/5
--      vs 18: success nudges the ministry's lever 0.5 the right way
--      (interior → crime OR unrest down; defense → state_apparatus
--      up; economic_development → industry up; foreign_affairs_and_
--      trade → global_image up; all clamped 0..100). A natural 1
--      backfires in the press: -1 Reputation, no stat change.
--
--   2. ps_prepare_brief — the only action that modifies someone
--      else's roll. Target: any sitting Junior Minister in the
--      nation, plus the player Foreign Minister for the FA&T desk.
--      'thorough' arms their next d20 with +2 and pays the author
--      +0.5 Influence; 'thin' plants -2 with a scandal check
--      (d20 <= 5 → author -2 Reputation and the target's career
--      timeline records who cooked their papers). The modifier
--      lives in factions.pending_brief_mod and is consumed by
--      _consume_brief_mod() — wired into politician_seek_fm_post's
--      NPC roll today (the one d20 a sitting minister fires);
--      future minister-tier roll RPCs should call the same helper.
--      Last brief wins if two Undersecretaries write for the same
--      minister.
--
--   3. ps_patronage — top-down mentorship. Target: a player Civil
--      Servant / Agency Head whose ministry maps (via _major_
--      ministry_of_politician) to the Undersecretary's desk.
--      +1 Experience to them, +0.3 Influence to the patron,
--      'noticed_by_undersecretary' career event on the target.
--
-- Plus a re-emit of politician_seek_fm_post (latest body 20270868)
-- adding the brief-modifier consumption to its d20.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. The brief seam ─────────────────────────────────────────────
ALTER TABLE public.factions
    ADD COLUMN IF NOT EXISTS pending_brief_mod int;

COMMENT ON COLUMN public.factions.pending_brief_mod IS
    'Pending briefing-paper modifier (+2 thorough / -2 thin) written by a Permanent Undersecretary via ps_prepare_brief. Consumed (read + cleared) by _consume_brief_mod() inside the holder''s next ministerial d20 — politician_seek_fm_post today. NULL = no pending brief. KNOWN LIMITATION: the column is client-readable like the rest of factions (a column-level SELECT revoke would break select * for every caller), so a minister inspecting the API can see a brief is pending and its sign — but never its author; only a CAUGHT thin brief discloses who wrote it. 20270878.';

REVOKE UPDATE (pending_brief_mod) ON public.factions
    FROM PUBLIC, anon, authenticated;

-- Read + clear in one statement: both CTEs share the statement
-- snapshot, so `old` captures the pre-clear value.
CREATE OR REPLACE FUNCTION public._consume_brief_mod(p_faction_id uuid)
RETURNS int
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
    WITH old AS (
        SELECT pending_brief_mod FROM factions WHERE id = p_faction_id
    ), clr AS (
        UPDATE factions SET pending_brief_mod = NULL
         WHERE id = p_faction_id AND pending_brief_mod IS NOT NULL
    )
    SELECT COALESCE((SELECT pending_brief_mod FROM old), 0);
$$;

REVOKE EXECUTE ON FUNCTION public._consume_brief_mod(uuid) FROM PUBLIC;

-- ── 2. ps_direct_portfolio ────────────────────────────────────────
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
        WHEN 'foreign_affairs_and_trade' THEN ARRAY['global_image']
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

-- ── 3. ps_prepare_brief ───────────────────────────────────────────
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
            AND v_pol.politician_permanent_secretary_ministry = 'foreign_affairs_and_trade');
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

-- ── 4. ps_patronage ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.ps_patronage(
    p_faction_id        uuid,
    p_target_faction_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_tgt       factions%ROWTYPE;
    v_tick      int;
    v_new_skill numeric;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL OR p_target_faction_id IS NULL THEN
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
    IF v_tgt.politician_ministry IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_civil_servant');
    END IF;
    IF v_tgt.politician_permanent_secretary_ministry IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'target_outranks_patronage');
    END IF;
    IF _major_ministry_of_politician(v_tgt.politician_ministry)
       IS DISTINCT FROM v_pol.politician_permanent_secretary_ministry THEN
        RETURN jsonb_build_object('success', false, 'reason', 'wrong_ministry');
    END IF;

    UPDATE factions
       SET politician_skill = COALESCE(politician_skill, 0) + 1
     WHERE id = v_tgt.id
    RETURNING politician_skill INTO v_new_skill;

    UPDATE factions
       SET politician_influence           = COALESCE(politician_influence, 0) + 0.3,
           next_civil_service_action_tick = v_tick + 1
     WHERE id = v_pol.id;

    INSERT INTO politician_career_events
        (faction_id, event_tick, event_type, target_name)
    VALUES
        (v_tgt.id, v_tick, 'noticed_by_undersecretary', '');

    RETURN jsonb_build_object('success', true, 'action', 'patronage',
        'target_new_skill', v_new_skill, 'influence_delta', 0.3);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.ps_patronage(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.ps_patronage(uuid, uuid) TO authenticated;

-- ── 5. politician_seek_fm_post — consume the brief ────────────────
CREATE OR REPLACE FUNCTION public.politician_seek_fm_post(p_faction_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid    uuid := auth.uid();
    v_pol    factions%ROWTYPE;
    v_tick   int;
    v_hog    head_of_government%ROWTYPE;
    v_is_player_hog boolean;
    v_admin  administrations%ROWTYPE;
    v_app_id uuid;
    v_mods   int;
    v_roll   int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
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
    IF v_pol.nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_nation');
    END IF;
    IF v_pol.politician_foreign_minister_at_tick IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_fm');
    END IF;
    IF EXISTS (SELECT 1 FROM factions
                WHERE nation_id = v_pol.nation_id
                  AND politician_foreign_minister_at_tick IS NOT NULL
                  AND abandoned_at IS NULL) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'post_filled');
    END IF;
    IF EXISTS (SELECT 1 FROM politician_fm_applications
                WHERE applicant_faction_id = v_pol.id AND status = 'pending') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'application_pending');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    SELECT * INTO v_hog FROM head_of_government
     WHERE nation_id = v_pol.nation_id
     ORDER BY created_at DESC LIMIT 1;
    v_is_player_hog := v_hog.id IS NOT NULL AND v_hog.candidate_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM factions
         WHERE id = v_hog.candidate_id
           AND linked_user_id IS NOT NULL
           AND abandoned_at IS NULL);

    IF v_is_player_hog THEN
        INSERT INTO politician_fm_applications
            (applicant_faction_id, target_nation_id, submitted_tick)
        VALUES (v_pol.id, v_pol.nation_id, v_tick)
        RETURNING id INTO v_app_id;
        RETURN jsonb_build_object('success', true, 'path', 'player_hog',
            'status', 'pending_review', 'application_id', v_app_id);
    END IF;

    -- NPC HoG: the junior-minister modifier scheme (20270669) —
    -- skill/5 + rep/5 (capped +10) + alignment, d20, threshold 28.
    v_mods := FLOOR(COALESCE(v_pol.politician_skill, 0) / 5)
            + LEAST(10, FLOOR(COALESCE(v_pol.politician_reputation, 0) / 5));
    SELECT * INTO v_admin FROM administrations
     WHERE nation_id = v_pol.nation_id AND ended_at_tick IS NULL
     ORDER BY started_at_tick DESC LIMIT 1;
    IF v_pol.politician_party_id IS NULL THEN
        v_mods := v_mods - 5;
    ELSIF v_admin.id IS NOT NULL AND v_admin.pm_party_id = v_pol.politician_party_id THEN
        v_mods := v_mods + 5;
    END IF;
    -- 20270878: a Permanent Undersecretary's briefing papers tilt
    -- the table -- the pending brief modifier (+2 thorough / -2 thin)
    -- is consumed by the minister's next d20.
    v_roll := 1 + FLOOR(random() * 20)::int + v_mods + _consume_brief_mod(v_pol.id);

    IF v_roll >= 28 THEN
        BEGIN
            UPDATE factions SET politician_foreign_minister_at_tick = v_tick
             WHERE id = v_pol.id;
        EXCEPTION WHEN unique_violation THEN
            RETURN jsonb_build_object('success', false, 'reason', 'post_filled');
        END;
        INSERT INTO politician_fm_applications
            (applicant_faction_id, target_nation_id, submitted_tick,
             status, decided_by_path, decided_tick)
        VALUES (v_pol.id, v_pol.nation_id, v_tick, 'approved', 'npc_roll', v_tick);
        INSERT INTO politician_career_events (faction_id, event_tick, event_type, target_name, metadata)
        VALUES (v_pol.id, v_tick, 'fm_appointed', '', jsonb_build_object('path', 'npc_roll'));
        RETURN jsonb_build_object('success', true, 'path', 'npc_roll',
            'status', 'approved', 'roll', v_roll);
    END IF;

    INSERT INTO politician_fm_applications
        (applicant_faction_id, target_nation_id, submitted_tick,
         status, decided_by_path, decided_tick)
    VALUES (v_pol.id, v_pol.nation_id, v_tick, 'declined', 'npc_roll', v_tick);
    RETURN jsonb_build_object('success', true, 'path', 'npc_roll',
        'status', 'declined', 'roll', v_roll);
END $$;

REVOKE EXECUTE ON FUNCTION public.politician_seek_fm_post(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.politician_seek_fm_post(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
