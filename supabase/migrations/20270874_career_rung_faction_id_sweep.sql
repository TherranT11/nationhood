-- ════════════════════════════════════════════════════════════════════
-- 20270874 — Career rung faction_id sweep (Permanent Secretary +
-- Junior Minister)
--
-- Mateo Paredes (Experience 54) hit [Seek Promotion] on the
-- Permanent Secretary rung and was told "you need 20 Experience.
-- You have 4." — the 4 belongs to a sibling politician on the same
-- account. politician_seek_permanent_secretary (20270679) and
-- politician_seek_junior_appointment (20270681) were the last two
-- Government Service rung RPCs still resolving the caller via
--
--   WHERE (id = auth.uid() OR linked_user_id = auth.uid())
--   ORDER BY created_at ASC LIMIT 1
--
-- which grades whichever politician was created FIRST, not the one
-- the career page is showing. Same bug class as 20270661 /
-- 20270665 / 20270668; same fix pattern:
--   1. DROP the old zero-arg signature so stale callers fail loud.
--   2. Add p_faction_id uuid as the only argument.
--   3. Lookup by id + ownership guard (id = uid OR linked_user_id).
--   4. Everything else byte-identical to the latest emission
--      (20270679 for PS, 20270681 for JM).
--
-- Client callers in politician-career.html updated in lockstep to
-- pass window.__careerCtx.faction.id.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. politician_seek_permanent_secretary(p_faction_id) ─────────
DROP FUNCTION IF EXISTS public.politician_seek_permanent_secretary();

CREATE OR REPLACE FUNCTION public.politician_seek_permanent_secretary(
    p_faction_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid           uuid := auth.uid();
    v_pol           factions%ROWTYPE;
    v_tick          int;
    v_major         text;
    v_slot_held     boolean;
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
    IF v_pol.nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_nation');
    END IF;

    IF COALESCE(v_pol.politician_skill, 0) < 20 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_skill',
                                  'have', COALESCE(v_pol.politician_skill, 0), 'need', 20);
    END IF;

    -- Ladder-strict: must currently be Agency Head. Civil servants
    -- who never promoted to AH can't skip the rung.
    IF v_pol.politician_senior_civil_servant_at_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_agency_head');
    END IF;

    IF v_pol.politician_permanent_secretary_ministry IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_permanent_secretary',
                                  'ministry', v_pol.politician_permanent_secretary_ministry);
    END IF;

    IF v_pol.politician_ministry IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_civil_service_ministry');
    END IF;

    v_major := _major_ministry_of_politician(v_pol.politician_ministry);
    IF v_major IS NULL THEN
        -- Civil servant in a ministry not represented at major-cabinet
        -- level. Impossible today (sit_the_exam only assigns the 4
        -- majors) but defensive.
        RETURN jsonb_build_object('success', false, 'reason', 'ministry_not_eligible',
                                  'civil_service_ministry', v_pol.politician_ministry);
    END IF;

    -- Vacancy check — slot is held iff some non-abandoned player
    -- faction in this nation has politician_permanent_secretary_
    -- ministry = v_major. Implicit NPC otherwise.
    SELECT EXISTS (
        SELECT 1 FROM factions
         WHERE nation_id = v_pol.nation_id
           AND politician_permanent_secretary_ministry = v_major
           AND abandoned_at IS NULL
    ) INTO v_slot_held;
    IF v_slot_held THEN
        RETURN jsonb_build_object('success', false, 'reason', 'slot_held_by_player',
                                  'ministry', v_major);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- The UPDATE + INSERT pair is wrapped so a concurrent promotion
    -- racing onto the same (nation, ministry) slot returns a clean
    -- 'slot_held_by_player' rather than bubbling SQLSTATE 23505.
    -- The vacancy check above passes for both contenders in the
    -- worst-case interleave; the partial unique index on factions
    -- (nation_id, politician_permanent_secretary_ministry) is the
    -- final arbiter — first to UPDATE wins, second trips the index.
    BEGIN
        UPDATE factions
           SET politician_permanent_secretary_at_tick  = v_tick,
               politician_permanent_secretary_ministry = v_major
         WHERE id = v_pol.id;

        INSERT INTO politician_career_events
            (faction_id, event_tick, event_type, target_name)
        VALUES
            (v_pol.id, v_tick, 'promoted_permanent_secretary', v_major);
    EXCEPTION WHEN unique_violation THEN
        RETURN jsonb_build_object('success', false, 'reason', 'slot_held_by_player',
                                  'ministry', v_major);
    END;

    RETURN jsonb_build_object(
        'success',     true,
        'action',      'permanent_secretary',
        'promoted_at', v_tick,
        'ministry',    v_major
    );
END;
$$;
REVOKE EXECUTE ON FUNCTION public.politician_seek_permanent_secretary(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.politician_seek_permanent_secretary(uuid) TO authenticated;

-- ── 2. politician_seek_junior_appointment(p_faction_id) ──────────
DROP FUNCTION IF EXISTS public.politician_seek_junior_appointment();

CREATE OR REPLACE FUNCTION public.politician_seek_junior_appointment(
    p_faction_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_tick      int;
    v_hog       head_of_government%ROWTYPE;
    v_admin     administrations%ROWTYPE;
    v_is_player_hog boolean;
    v_alignment_mod int;
    v_skill_mod     int;
    v_rep_mod       int;
    v_d20           int;
    v_total         int;
    v_outcome       text;
    v_status        text;
    v_rep_delta     numeric := 0;
    v_inf_delta     int     := 0;
    v_cooldown      int     := 0;
    v_app_id        uuid;
    v_breakdown     jsonb;
    v_assigned      text;
    v_vacant_count  int;
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
    IF v_pol.nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_nation');
    END IF;

    -- Threshold bumped from 20 to 28 in 20270681.
    IF COALESCE(v_pol.politician_skill, 0) < 28 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_skill',
                                  'have', COALESCE(v_pol.politician_skill, 0), 'need', 28);
    END IF;

    IF v_pol.politician_senior_civil_servant_at_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_agency_head');
    END IF;

    IF v_pol.politician_junior_portfolio IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_junior_minister',
                                  'portfolio', v_pol.politician_junior_portfolio);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    IF v_pol.politician_seek_appointment_cooldown_until_tick IS NOT NULL
       AND v_tick < v_pol.politician_seek_appointment_cooldown_until_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'on_cooldown',
                                  'cooldown_until', v_pol.politician_seek_appointment_cooldown_until_tick,
                                  'ticks_remaining', v_pol.politician_seek_appointment_cooldown_until_tick - v_tick);
    END IF;

    IF EXISTS (SELECT 1 FROM politician_junior_appointments
                WHERE applicant_faction_id = v_pol.id
                  AND status = 'pending') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'pending_application_exists');
    END IF;

    SELECT * INTO v_hog FROM head_of_government
     WHERE nation_id = v_pol.nation_id
       AND active = true
     ORDER BY appointed_tick DESC LIMIT 1
     FOR UPDATE;
    IF v_hog.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_head_of_government');
    END IF;

    SELECT COUNT(*) INTO v_vacant_count
      FROM unnest(_junior_portfolio_keys()) AS pk(portfolio)
     WHERE NOT EXISTS (
         SELECT 1 FROM factions
          WHERE nation_id = v_pol.nation_id
            AND politician_junior_portfolio = pk.portfolio
            AND abandoned_at IS NULL
     );
    IF v_vacant_count = 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'all_portfolios_full');
    END IF;

    v_is_player_hog := v_hog.candidate_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM factions
         WHERE id = v_hog.candidate_id
           AND linked_user_id IS NOT NULL
           AND abandoned_at IS NULL
    );

    IF v_is_player_hog THEN
        INSERT INTO politician_junior_appointments
            (applicant_faction_id, target_nation_id, portfolio,
             submitted_tick, status)
        VALUES
            (v_pol.id, v_pol.nation_id, NULL,
             v_tick, 'pending')
        RETURNING id INTO v_app_id;

        RETURN jsonb_build_object(
            'success',         true,
            'path',            'player_hog',
            'status',          'pending_review',
            'application_id',  v_app_id,
            'submitted_tick',  v_tick,
            'vacant_count',    v_vacant_count
        );
    END IF;

    v_skill_mod := FLOOR(COALESCE(v_pol.politician_skill, 0) / 5);
    v_rep_mod   := LEAST(10, FLOOR(COALESCE(v_pol.politician_reputation, 0) / 5));

    SELECT * INTO v_admin FROM administrations
     WHERE nation_id = v_pol.nation_id
       AND ended_at_tick IS NULL
     ORDER BY started_at_tick DESC LIMIT 1;

    IF v_pol.politician_party_id IS NULL THEN
        v_alignment_mod := -5;
    ELSIF v_admin.id IS NOT NULL
          AND v_admin.pm_party_id = v_pol.politician_party_id THEN
        v_alignment_mod := 5;
    ELSIF v_admin.id IS NOT NULL
          AND v_admin.coalition_parties IS NOT NULL
          AND v_admin.coalition_parties @> to_jsonb(v_pol.politician_party_id) THEN
        v_alignment_mod := 2;
    ELSE
        v_alignment_mod := -3;
    END IF;

    v_d20  := FLOOR(random() * 20)::int + 1;
    v_total := v_d20 + v_skill_mod + v_rep_mod + v_alignment_mod;

    IF v_total >= 22 THEN
        v_outcome   := 'appointed';
        v_status    := 'appointed';
        v_rep_delta := 2;
    ELSIF v_total >= 16 THEN
        v_outcome  := 'rejected';
        v_status   := 'rejected';
        v_cooldown := 6;
    ELSIF v_total >= 10 THEN
        v_outcome  := 'rejected';
        v_status   := 'rejected';
        v_inf_delta := -1;
        v_cooldown := 6;
    ELSE
        v_outcome   := 'humiliated';
        v_status    := 'humiliated';
        v_rep_delta := -2;
        v_inf_delta := -1;
        v_cooldown  := 12;
    END IF;

    IF v_status = 'appointed' THEN
        SELECT pk.portfolio INTO v_assigned
          FROM unnest(_junior_portfolio_keys()) AS pk(portfolio)
         WHERE NOT EXISTS (
             SELECT 1 FROM factions
              WHERE nation_id = v_pol.nation_id
                AND politician_junior_portfolio = pk.portfolio
                AND abandoned_at IS NULL
         )
         ORDER BY random()
         LIMIT 1;
        IF v_assigned IS NULL THEN
            v_status   := 'rejected';
            v_outcome  := 'rejected';
            v_rep_delta := 0;
            v_inf_delta := 0;
            v_cooldown  := 6;
        END IF;
    END IF;

    v_breakdown := jsonb_build_object(
        'd20',           v_d20,
        'skill_mod',     v_skill_mod,
        'reputation_mod', v_rep_mod,
        'alignment_mod', v_alignment_mod,
        'ideology_mod',  0,
        'total',         v_total,
        'outcome',       v_outcome,
        'rep_delta',     v_rep_delta,
        'inf_delta',     v_inf_delta,
        'cooldown_ticks', v_cooldown,
        'assigned_portfolio', v_assigned
    );

    INSERT INTO politician_junior_appointments
        (applicant_faction_id, target_nation_id, portfolio,
         submitted_tick, status, resolved_tick, decided_by_path,
         roll_total, roll_breakdown)
    VALUES
        (v_pol.id, v_pol.nation_id, v_assigned,
         v_tick, v_status, v_tick, 'npc_roll',
         v_total, v_breakdown)
    RETURNING id INTO v_app_id;

    UPDATE factions
       SET politician_reputation = GREATEST(0, COALESCE(politician_reputation, 0) + v_rep_delta),
           politician_influence  = GREATEST(0, COALESCE(politician_influence, 0) + v_inf_delta),
           politician_seek_appointment_cooldown_until_tick =
               CASE WHEN v_cooldown > 0 THEN v_tick + v_cooldown ELSE NULL END,
           politician_junior_minister_at_tick =
               CASE WHEN v_status = 'appointed' THEN v_tick
                    ELSE politician_junior_minister_at_tick END,
           politician_junior_portfolio =
               CASE WHEN v_status = 'appointed' THEN v_assigned
                    ELSE politician_junior_portfolio END
     WHERE id = v_pol.id;

    INSERT INTO politician_career_events
        (faction_id, event_tick, event_type, target_name)
    VALUES
        (v_pol.id, v_tick,
         CASE v_status
            WHEN 'appointed'  THEN 'appointed_junior_minister'
            WHEN 'humiliated' THEN 'humiliated_junior_minister'
            ELSE                   'rejected_junior_minister'
         END,
         COALESCE(v_assigned, ''));

    RETURN jsonb_build_object(
        'success',        true,
        'path',           'npc_roll',
        'status',         v_status,
        'application_id', v_app_id,
        'portfolio',      v_assigned,
        'breakdown',      v_breakdown,
        'cooldown_until', CASE WHEN v_cooldown > 0 THEN v_tick + v_cooldown ELSE NULL END
    );
END;
$$;
REVOKE EXECUTE ON FUNCTION public.politician_seek_junior_appointment(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.politician_seek_junior_appointment(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
