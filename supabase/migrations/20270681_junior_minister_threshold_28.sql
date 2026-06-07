-- ════════════════════════════════════════════════════════════════════
-- 20270681 — Junior Minister threshold bump: 20 → 28 Experience
--
-- User design retune. The 20-Experience gate (per 20270677) made
-- Junior Minister reachable too quickly under the passive +1/age-
-- year accrual from 20270672. Bumping the bar to 28 keeps JM as a
-- meaningful rung — roughly 8 additional in-game years past Agency
-- Head's 15-XP threshold under passive accrual alone, or ~9 ticks
-- of perfect File Paperwork on top of the existing curve.
--
-- Signature unchanged ((→ jsonb)) so CREATE OR REPLACE replaces in
-- place. Body byte-identical to 20270677 except:
--   • politician_skill < 20 → < 28
--   • 'need': 20 → 28 in the insufficient_skill error envelope
--
-- All other gates (Agency Head ladder requirement, no current
-- portfolio, cooldown, pending-app dedup, vacancy precheck, player
-- vs NPC HoG branch, dice equation, random-vacant pick) are
-- preserved verbatim.
--
-- Apply after 20270680.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

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

    -- Threshold bumped from 20 to 28 in this migration (20270681).
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
GRANT EXECUTE ON FUNCTION public.politician_seek_junior_appointment() TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
