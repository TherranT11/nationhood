-- ════════════════════════════════════════════════════════════════════
-- 20270706 — Local Politics jumpstart (Experience-gated)
--
-- Tier C politicians joining with Experience already at 30+ shouldn't
-- have to grind through Community Organizer + a 12-tick City Council
-- Member term just to surface on the local-politics ladder. Per user
-- direction the higher rungs become Experience-locked self-applies
-- (same shape as the judicial bench), with one exception: City
-- Council President KEEPS its race mechanic — Experience just opens
-- the door to register.
--
-- New rungs (self-stamped, one-shot, never auto-cleared — matches
-- politician_magistrate_at_tick's pattern):
--   • Mayor                — Experience >= 50
--   • Mayor of the Capital — Experience >= 60
--   • Regional Leader      — Experience >= 75
--
-- City Council President — Experience >= 40 unlocks the existing race
-- (politician_register_for_office) by bypassing the CCM-currently and
-- term-window gates. Race resolution, opponent generation, and the
-- politician_office stamp on win are unchanged.
--
-- Schema columns (factions, NULL = not held; one-shot, never cleared):
--   • politician_mayor_at_tick
--   • politician_mayor_of_capital_at_tick
--   • politician_regional_leader_at_tick
-- Client write REVOKE'd; only the take_office_* RPCs in this migration
-- set them, mirroring politician_magistrate_at_tick's lock-down.
--
-- Rungs intentionally NOT bound to a specific city today — the rung
-- renders + the at_tick stamp is the source of truth. City-binding
-- (which specific Mayor of which city, term lengths, vacating on
-- term-end) is a separate piece of work. Resignation is deferred for
-- the same reason; today retire-the-politician is the only way out
-- of these stamps. Same pattern as Magistrate before 20270705.
--
-- The City Council President override re-emits the entire
-- politician_register_for_office function (last touch 20270664) with
-- one branch change: the CCP arm now skips the CCM + term-window
-- gates when Experience >= 40. Every other branch (community organizer,
-- senior MP) is verbatim from 20270664.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Schema ──────────────────────────────────────────────────────
ALTER TABLE public.factions
    ADD COLUMN IF NOT EXISTS politician_mayor_at_tick               int,
    ADD COLUMN IF NOT EXISTS politician_mayor_of_capital_at_tick    int,
    ADD COLUMN IF NOT EXISTS politician_regional_leader_at_tick     int;

COMMENT ON COLUMN public.factions.politician_mayor_at_tick IS
    'Tick at which this politician self-stamped as Mayor (Local Politics Tier 4, 20270706). NULL = not held. One-shot — never cleared. Experience >= 50 gate.';
COMMENT ON COLUMN public.factions.politician_mayor_of_capital_at_tick IS
    'Tick at which this politician self-stamped as Mayor of the Capital (Local Politics Tier 5, 20270706). One-shot. Experience >= 60 gate.';
COMMENT ON COLUMN public.factions.politician_regional_leader_at_tick IS
    'Tick at which this politician self-stamped as Regional Leader (Local Politics Tier 6 / APEX, 20270706). One-shot. Experience >= 75 gate.';

REVOKE UPDATE (politician_mayor_at_tick) ON public.factions
    FROM PUBLIC, anon, authenticated;
REVOKE UPDATE (politician_mayor_of_capital_at_tick) ON public.factions
    FROM PUBLIC, anon, authenticated;
REVOKE UPDATE (politician_regional_leader_at_tick) ON public.factions
    FROM PUBLIC, anon, authenticated;


-- ── 2. politician_take_office_mayor ────────────────────────────────
-- Self-stamp, Experience >= 50. Mirrors politician_take_the_bench's
-- shape (20270531) — gates → UPDATE → event_log → career_events.
CREATE OR REPLACE FUNCTION public.politician_take_office_mayor(
    p_faction_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_tick      int;
    v_full_name text;
    v_nation_nm text;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    SELECT * INTO v_pol FROM public.factions
     WHERE id = p_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;

    IF COALESCE(v_pol.politician_skill, 0) < 50 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'experience_too_low',
            'experience', COALESCE(v_pol.politician_skill, 0),
            'required',   50);
    END IF;

    IF v_pol.politician_mayor_at_tick IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_mayor');
    END IF;

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE public.factions
       SET politician_mayor_at_tick = v_tick
     WHERE id = v_pol.id;

    v_full_name := btrim(COALESCE(v_pol.leader_first_name, '') || ' ' ||
                         COALESCE(v_pol.leader_last_name, ''));
    IF length(v_full_name) = 0 THEN
        v_full_name := COALESCE(v_pol.faction_name, 'A politician');
    END IF;
    SELECT name INTO v_nation_nm FROM public.nations WHERE id = v_pol.nation_id;

    INSERT INTO public.event_log (
        nation_id, faction_id,
        event_name, description_used,
        category, trigger_key,
        fired_at_tick
    ) VALUES (
        v_pol.nation_id, v_pol.id,
        'Sworn In as Mayor',
        v_full_name
            || ' has been sworn in as mayor of a city in '
            || COALESCE(NULLIF(btrim(v_nation_nm), ''), 'their nation')
            || '.',
        'politician', 'politician_took_office_mayor',
        v_tick
    );

    INSERT INTO public.politician_career_events
        (faction_id, event_tick, event_type, target_name, metadata)
    VALUES (
        v_pol.id, v_tick,
        'took_office_mayor',
        COALESCE(NULLIF(btrim(v_nation_nm), ''), 'their nation'),
        '{}'::jsonb
    );

    RETURN jsonb_build_object('success', true, 'at_tick', v_tick);
END $$;

REVOKE EXECUTE ON FUNCTION public.politician_take_office_mayor(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.politician_take_office_mayor(uuid) TO authenticated;


-- ── 3. politician_take_office_mayor_of_capital ─────────────────────
-- Experience >= 60. Same shape as Mayor.
CREATE OR REPLACE FUNCTION public.politician_take_office_mayor_of_capital(
    p_faction_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_tick      int;
    v_full_name text;
    v_nation_nm text;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    SELECT * INTO v_pol FROM public.factions
     WHERE id = p_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;

    IF COALESCE(v_pol.politician_skill, 0) < 60 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'experience_too_low',
            'experience', COALESCE(v_pol.politician_skill, 0),
            'required',   60);
    END IF;

    IF v_pol.politician_mayor_of_capital_at_tick IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_mayor_of_capital');
    END IF;

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE public.factions
       SET politician_mayor_of_capital_at_tick = v_tick
     WHERE id = v_pol.id;

    v_full_name := btrim(COALESCE(v_pol.leader_first_name, '') || ' ' ||
                         COALESCE(v_pol.leader_last_name, ''));
    IF length(v_full_name) = 0 THEN
        v_full_name := COALESCE(v_pol.faction_name, 'A politician');
    END IF;
    SELECT name INTO v_nation_nm FROM public.nations WHERE id = v_pol.nation_id;

    INSERT INTO public.event_log (
        nation_id, faction_id,
        event_name, description_used,
        category, trigger_key,
        fired_at_tick
    ) VALUES (
        v_pol.nation_id, v_pol.id,
        'Sworn In as Mayor of the Capital',
        v_full_name
            || ' has been sworn in as Mayor of the Capital of '
            || COALESCE(NULLIF(btrim(v_nation_nm), ''), 'their nation')
            || '.',
        'politician', 'politician_took_office_mayor_of_capital',
        v_tick
    );

    INSERT INTO public.politician_career_events
        (faction_id, event_tick, event_type, target_name, metadata)
    VALUES (
        v_pol.id, v_tick,
        'took_office_mayor_of_capital',
        COALESCE(NULLIF(btrim(v_nation_nm), ''), 'their nation'),
        '{}'::jsonb
    );

    RETURN jsonb_build_object('success', true, 'at_tick', v_tick);
END $$;

REVOKE EXECUTE ON FUNCTION public.politician_take_office_mayor_of_capital(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.politician_take_office_mayor_of_capital(uuid) TO authenticated;


-- ── 4. politician_take_office_regional_leader ──────────────────────
-- Experience >= 75. APEX rung of the Local Politics ladder.
CREATE OR REPLACE FUNCTION public.politician_take_office_regional_leader(
    p_faction_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_tick      int;
    v_full_name text;
    v_nation_nm text;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    SELECT * INTO v_pol FROM public.factions
     WHERE id = p_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;

    IF COALESCE(v_pol.politician_skill, 0) < 75 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'experience_too_low',
            'experience', COALESCE(v_pol.politician_skill, 0),
            'required',   75);
    END IF;

    IF v_pol.politician_regional_leader_at_tick IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_regional_leader');
    END IF;

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE public.factions
       SET politician_regional_leader_at_tick = v_tick
     WHERE id = v_pol.id;

    v_full_name := btrim(COALESCE(v_pol.leader_first_name, '') || ' ' ||
                         COALESCE(v_pol.leader_last_name, ''));
    IF length(v_full_name) = 0 THEN
        v_full_name := COALESCE(v_pol.faction_name, 'A politician');
    END IF;
    SELECT name INTO v_nation_nm FROM public.nations WHERE id = v_pol.nation_id;

    INSERT INTO public.event_log (
        nation_id, faction_id,
        event_name, description_used,
        category, trigger_key,
        fired_at_tick
    ) VALUES (
        v_pol.nation_id, v_pol.id,
        'Sworn In as Regional Leader',
        v_full_name
            || ' has been sworn in as a Regional Leader of '
            || COALESCE(NULLIF(btrim(v_nation_nm), ''), 'their nation')
            || ', commanding a regional budget and a seat at the national table.',
        'politician', 'politician_took_office_regional_leader',
        v_tick
    );

    INSERT INTO public.politician_career_events
        (faction_id, event_tick, event_type, target_name, metadata)
    VALUES (
        v_pol.id, v_tick,
        'took_office_regional_leader',
        COALESCE(NULLIF(btrim(v_nation_nm), ''), 'their nation'),
        '{}'::jsonb
    );

    RETURN jsonb_build_object('success', true, 'at_tick', v_tick);
END $$;

REVOKE EXECUTE ON FUNCTION public.politician_take_office_regional_leader(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.politician_take_office_regional_leader(uuid) TO authenticated;


-- ── 5. politician_register_for_office — CCP Experience override ───
-- Re-emits 20270664's body verbatim EXCEPT for the city_council_
-- president branch, where the CCM-currently + term-window gates are
-- now bypassed when politician_skill >= 40. Every other branch
-- (community organizer race, senior MP race) is unchanged.
CREATE OR REPLACE FUNCTION public.politician_register_for_office(
    p_faction_id    uuid,
    p_target_office text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_pol          factions%ROWTYPE;
    v_tick         int;
    v_shard_id     uuid;
    v_first_pool   text[];
    v_last_pool    text[];
    v_opp_first    text;
    v_opp_last     text;
    v_opp_stat     int;
    v_your_stat    int;
    v_race_tier    text;
    v_resolve      int;
    v_next_elect   int;
    v_term_ticks   int;
    v_won_at       int;
    v_player_share numeric;
    v_poll_you     int;
    v_poll_opp     int;
    v_poll_und     int;
    v_next_action  int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_target_office NOT IN ('city_council_member', 'senior_mp', 'city_council_president') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_target_office');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid);
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.politician_party_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_in_party');
    END IF;
    IF v_pol.nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_nation');
    END IF;

    SELECT current_tick, id INTO v_tick, v_shard_id FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;

    IF EXISTS (SELECT 1 FROM politician_active_election WHERE politician_id = v_pol.id) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'race_in_progress');
    END IF;

    IF p_target_office = 'city_council_member' THEN
        IF v_pol.politician_office <> 'community_organizer'
           AND COALESCE(v_pol.politician_former_community_organizer, FALSE) IS NOT TRUE THEN
            RETURN jsonb_build_object('success', false, 'reason', 'wrong_current_office',
                'have', v_pol.politician_office, 'expected', 'community_organizer_now_or_past');
        END IF;
        IF v_pol.politician_office = 'community_organizer' THEN
            v_won_at := COALESCE(v_pol.politician_office_won_at_tick, v_tick);
            IF v_tick < v_won_at + 9 THEN
                RETURN jsonb_build_object('success', false, 'reason', 'too_early',
                    'opens_at_tick', v_won_at + 9, 'current_tick', v_tick);
            END IF;
        END IF;
        v_race_tier := 'city_council';
        v_your_stat := COALESCE(v_pol.politician_skill, 1);
        v_opp_stat  := 2 + floor(random() * 3)::int;
        v_resolve   := v_tick + 1;

    ELSIF p_target_office = 'city_council_president' THEN
        -- 20270706: Experience >= 40 bypasses the CCM + term-window
        -- prereqs. Tier C jumpstart: high-Experience joiners shouldn't
        -- need to grind through Community Organizer + a full CCM term
        -- just to register for CCP. Race resolution unchanged.
        IF COALESCE(v_pol.politician_skill, 0) < 40 THEN
            IF v_pol.politician_office <> 'city_council_member' THEN
                RETURN jsonb_build_object('success', false, 'reason', 'wrong_current_office',
                    'have', v_pol.politician_office, 'expected', 'city_council_member');
            END IF;
            v_won_at := COALESCE(v_pol.politician_office_won_at_tick, v_tick);
            IF v_tick < v_won_at + 9 THEN
                RETURN jsonb_build_object('success', false, 'reason', 'too_early',
                    'opens_at_tick', v_won_at + 9, 'current_tick', v_tick);
            END IF;
        END IF;
        v_race_tier := 'city_council_president';
        v_your_stat := COALESCE(v_pol.politician_skill, 1);
        v_opp_stat  := 1 + floor(random() * 6)::int + 1;
        v_resolve   := v_tick + 1;

    ELSE  -- senior_mp
        IF v_pol.politician_office <> 'member_of_parliament' THEN
            RETURN jsonb_build_object('success', false, 'reason', 'wrong_current_office',
                'have', v_pol.politician_office, 'expected', 'member_of_parliament');
        END IF;
        SELECT next_election_tick, COALESCE(parliamentary_term_ticks, 24)
          INTO v_next_elect, v_term_ticks
          FROM nations WHERE id = v_pol.nation_id;
        IF v_next_elect IS NULL THEN
            RETURN jsonb_build_object('success', false, 'reason', 'no_general_election');
        END IF;
        IF v_pol.politician_office_won_at_tick IS NULL
           OR v_tick < v_pol.politician_office_won_at_tick + v_term_ticks THEN
            RETURN jsonb_build_object('success', false, 'reason', 'term_too_short',
                'won_at',           v_pol.politician_office_won_at_tick,
                'term_ticks',       v_term_ticks,
                'eligible_at_tick', COALESCE(v_pol.politician_office_won_at_tick, 0) + v_term_ticks,
                'current_tick',     v_tick);
        END IF;
        IF v_tick < v_next_elect - 6 THEN
            RETURN jsonb_build_object('success', false, 'reason', 'too_early',
                'opens_at_tick', v_next_elect - 6, 'current_tick', v_tick);
        END IF;
        IF v_tick > v_next_elect THEN
            RETURN jsonb_build_object('success', false, 'reason', 'window_closed',
                'last_open_tick', v_next_elect);
        END IF;
        v_race_tier := 'senior_mp';
        v_your_stat := COALESCE(v_pol.politician_skill, 1);
        v_opp_stat  := 1 + floor(random() * 6)::int;
        v_resolve   := v_next_elect;
    END IF;

    SELECT first_name_pool, last_name_pool INTO v_first_pool, v_last_pool
      FROM nations WHERE id = v_pol.nation_id;
    v_opp_first := COALESCE(pick_random_pool_name(v_first_pool), 'Opponent');
    v_opp_last  := COALESCE(pick_random_pool_name(v_last_pool),  'Smith');

    v_player_share := v_your_stat::numeric / GREATEST(1, v_your_stat + v_opp_stat);
    v_poll_you     := ROUND(v_player_share * 85)::int;
    v_poll_opp     := 85 - v_poll_you;
    v_poll_und     := 15;

    INSERT INTO politician_active_election (
        politician_id, shard_id, race_tier, district,
        opp_first, opp_last, opp_blurb, opp_party_name,
        your_stat, opp_stat, win_odds_pct, stake_win, stake_lose,
        resolve_tick,
        polling_you_pct, polling_opp_pct, polling_undecided_pct,
        party_id
    ) VALUES (
        v_pol.id, v_shard_id, v_race_tier,
        CASE v_race_tier
            WHEN 'city_council'           THEN 'City Council seat'
            WHEN 'city_council_president' THEN 'City Council Presidency'
            WHEN 'senior_mp'              THEN 'Senior MP slot'
        END,
        v_opp_first, v_opp_last,
        CASE v_race_tier
            WHEN 'city_council'           THEN 'Independent challenger for the council seat'
            WHEN 'city_council_president' THEN 'Independent contender for the council chair'
            WHEN 'senior_mp'              THEN 'Independent contender for the Senior MP nomination'
        END,
        NULL,
        v_your_stat, v_opp_stat,
        GREATEST(1, LEAST(99, v_poll_you)),
        CASE v_race_tier
            WHEN 'city_council'           THEN 2
            WHEN 'city_council_president' THEN 3
            ELSE                                4
        END,
        CASE v_race_tier
            WHEN 'city_council'           THEN 0
            WHEN 'city_council_president' THEN 0
            ELSE                                -3
        END,
        v_resolve,
        v_poll_you, v_poll_opp, v_poll_und,
        v_pol.politician_party_id
    );

    v_next_action := v_tick + 1;
    UPDATE factions SET next_member_action_tick = v_next_action WHERE id = v_pol.id;

    INSERT INTO politician_career_events (
        faction_id, event_tick, event_type, target_name, metadata
    ) VALUES (
        v_pol.id, v_tick, 'stood_for_election',
        CASE v_race_tier
            WHEN 'city_council'           THEN 'City Council seat'
            WHEN 'city_council_president' THEN 'City Council Presidency'
            ELSE                                'Senior MP slot'
        END,
        jsonb_build_object(
            'race_tier',      v_race_tier,
            'your_stat',      v_your_stat,
            'opp_stat',       v_opp_stat,
            'opponent',       v_opp_first || ' ' || v_opp_last,
            'resolve_tick',   v_resolve,
            'polling_you',    v_poll_you,
            'polling_opp',    v_poll_opp,
            'polling_und',    v_poll_und
        )
    );

    RETURN jsonb_build_object(
        'success',                true,
        'target_office',          p_target_office,
        'opponent',               v_opp_first || ' ' || v_opp_last,
        'resolve_tick',           v_resolve,
        'your_stat',              v_your_stat,
        'opp_stat',               v_opp_stat,
        'win_odds_pct',           GREATEST(1, LEAST(99, v_poll_you)),
        'next_member_action_tick',v_next_action
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.politician_register_for_office(uuid, text) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
