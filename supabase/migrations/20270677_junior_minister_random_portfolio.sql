-- ════════════════════════════════════════════════════════════════════
-- 20270677 — Junior Minister: random portfolio at appoint
--
-- User design change. Was: applicant picks a specific portfolio at
-- application time, RPC blocks if that portfolio is filled, success
-- assigns the picked portfolio. Now: applicant doesn't pick, RPC
-- gates on "at least one portfolio vacant in this nation", and the
-- portfolio gets randomly drawn from the current vacancy set at the
-- moment of appointment.
--
-- Why moment-of-appoint and not moment-of-apply: handles the race
-- where two applicants both pass the seek-stage vacancy check, then
-- the first appointment fills the last seat. Picking at appoint
-- under the head_of_government FOR UPDATE lock serialises cleanly.
--
-- Schema relaxation:
--   politician_junior_appointments.portfolio was NOT NULL CHECK
--   (portfolio = ANY(_junior_portfolio_keys())). Now nullable; CHECK
--   becomes (portfolio IS NULL OR portfolio = ANY(...)). NULL is the
--   pre-resolution state for pending rows and the final state for
--   rejected/humiliated NPC-roll outcomes (no portfolio ever
--   assigned to those).
--
-- Signature changes (rename → drop_then_create):
--   politician_seek_junior_appointment(text)              → ()
--   politician_decide_junior_appointment(uuid, text)      unchanged
--
-- Apply after 20270676.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Relax the portfolio column on the appointments table ───────
ALTER TABLE public.politician_junior_appointments
    ALTER COLUMN portfolio DROP NOT NULL;

ALTER TABLE public.politician_junior_appointments
    DROP CONSTRAINT IF EXISTS politician_junior_appointments_portfolio_check;

ALTER TABLE public.politician_junior_appointments
    ADD CONSTRAINT politician_junior_appointments_portfolio_check
    CHECK (portfolio IS NULL OR portfolio = ANY(public._junior_portfolio_keys()));

-- ── 2. politician_seek_junior_appointment() ──────────────────────
-- Signature changed (was (text)). Drop the old binding, create new.
DROP FUNCTION IF EXISTS public.politician_seek_junior_appointment(text);

CREATE OR REPLACE FUNCTION public.politician_seek_junior_appointment()
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

    SELECT * INTO v_pol FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1
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

    -- Lock the HoG row for the serialise-on-PM-identity invariant +
    -- the random-vacant-pick that may follow.
    SELECT * INTO v_hog FROM head_of_government
     WHERE nation_id = v_pol.nation_id
       AND active = true
     ORDER BY appointed_tick DESC LIMIT 1
     FOR UPDATE;
    IF v_hog.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_head_of_government');
    END IF;

    -- "Any portfolio vacant in this nation?" gate. Counts how many
    -- of the 5 are currently held; if all 5 are held, no point in
    -- proceeding to the dice roll.
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

    -- ── Branch A: player HoG — queue the application ─────────────
    -- Portfolio stays NULL; the random pick happens at the moment
    -- the PM clicks Appoint (politician_decide_junior_appointment).
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

    -- ── Branch B: NPC HoG — roll, resolve, persist ───────────────
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

    -- Random vacant-portfolio pick — only when the dice say
    -- appointed. Re-checks vacancies under the HoG lock so the
    -- count above can't have drifted between count and pick.
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
            -- Vanishingly unlikely (HoG row was locked) but defence
            -- in depth: if the vacant set is somehow empty, downgrade
            -- to a soft reject rather than crash.
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
GRANT EXECUTE ON FUNCTION public.politician_seek_junior_appointment() TO authenticated;

-- ── 3. politician_decide_junior_appointment(p_app_id, p_action) ──
-- Signature unchanged. The appoint branch now picks a random vacant
-- portfolio at the moment the PM clicks — the application row
-- carries NULL portfolio until this point.
CREATE OR REPLACE FUNCTION public.politician_decide_junior_appointment(
    p_application_id uuid,
    p_action         text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_decider   factions%ROWTYPE;
    v_app       politician_junior_appointments%ROWTYPE;
    v_applicant factions%ROWTYPE;
    v_hog       head_of_government%ROWTYPE;
    v_tick      int;
    v_action    text := lower(NULLIF(btrim(p_action), ''));
    v_assigned  text;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_application_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_application_id');
    END IF;
    IF v_action NOT IN ('appoint', 'reject') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_action');
    END IF;

    SELECT * INTO v_decider FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1;
    IF v_decider.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;

    SELECT * INTO v_app FROM politician_junior_appointments
     WHERE id = p_application_id
     FOR UPDATE;
    IF v_app.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'application_not_found');
    END IF;
    IF v_app.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_resolved',
                                  'status', v_app.status);
    END IF;

    SELECT * INTO v_hog FROM head_of_government
     WHERE nation_id = v_app.target_nation_id
       AND active = true
     ORDER BY appointed_tick DESC LIMIT 1
     FOR UPDATE;
    IF v_hog.id IS NULL OR v_hog.candidate_id IS DISTINCT FROM v_decider.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_head_of_government');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    SELECT * INTO v_applicant FROM factions
     WHERE id = v_app.applicant_faction_id
     FOR UPDATE;
    IF v_applicant.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'applicant_missing');
    END IF;

    IF v_action = 'appoint' THEN
        IF v_applicant.politician_junior_portfolio IS NOT NULL THEN
            RETURN jsonb_build_object('success', false, 'reason', 'applicant_already_serving',
                                      'portfolio', v_applicant.politician_junior_portfolio);
        END IF;

        -- Random vacant-portfolio pick under the HoG row lock. If
        -- nothing's vacant the PM gets a clean error and the
        -- application stays pending (they can retry once a portfolio
        -- opens up, or reject explicitly).
        SELECT pk.portfolio INTO v_assigned
          FROM unnest(_junior_portfolio_keys()) AS pk(portfolio)
         WHERE NOT EXISTS (
             SELECT 1 FROM factions
              WHERE nation_id = v_app.target_nation_id
                AND politician_junior_portfolio = pk.portfolio
                AND abandoned_at IS NULL
         )
         ORDER BY random()
         LIMIT 1;
        IF v_assigned IS NULL THEN
            RETURN jsonb_build_object('success', false, 'reason', 'all_portfolios_full');
        END IF;

        UPDATE factions
           SET politician_junior_minister_at_tick = v_tick,
               politician_junior_portfolio        = v_assigned
         WHERE id = v_app.applicant_faction_id;

        UPDATE politician_junior_appointments
           SET status                = 'appointed',
               portfolio             = v_assigned,
               resolved_tick         = v_tick,
               decided_by_path       = 'player_hog',
               decided_by_faction_id = v_decider.id
         WHERE id = v_app.id;

        INSERT INTO politician_career_events
            (faction_id, event_tick, event_type, target_name)
        VALUES
            (v_app.applicant_faction_id, v_tick,
             'appointed_junior_minister', v_assigned);

        RETURN jsonb_build_object(
            'success',        true,
            'action',         'appoint',
            'application_id', v_app.id,
            'portfolio',      v_assigned,
            'applicant_id',   v_app.applicant_faction_id
        );
    END IF;

    -- v_action = 'reject'. No stat penalty, no portfolio touched.
    UPDATE politician_junior_appointments
       SET status                = 'rejected',
           resolved_tick         = v_tick,
           decided_by_path       = 'player_hog',
           decided_by_faction_id = v_decider.id
     WHERE id = v_app.id;

    INSERT INTO politician_career_events
        (faction_id, event_tick, event_type, target_name)
    VALUES
        (v_app.applicant_faction_id, v_tick,
         'rejected_junior_minister', '');

    RETURN jsonb_build_object(
        'success',        true,
        'action',         'reject',
        'application_id', v_app.id,
        'applicant_id',   v_app.applicant_faction_id
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.politician_decide_junior_appointment(uuid, text) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
