-- ════════════════════════════════════════════════════════════════════
-- 20270876 — Governing-coalition source: movement parties, not the
-- administrations snapshot
--
-- The Junior Minister party-government notice quoted "Sierramar's
-- Party of Communist and The Communitarian Voters' Coalition" —
-- phantom parties living only in Sierramar's administrations
-- coalition snapshot, while the Active Movements page (factions.
-- party_status pills) correctly shows PVS Governing / ACD Coalition.
-- Per user direction: pull from the movement parties, and purge the
-- phantoms.
--
--   1. politician_seek_junior_appointment re-emitted —
--      • gate + party names now read factions.party_status
--        ('Governing' / 'Coalition') instead of administrations.
--        coalition_parties; alignment +5 Governing / +2 Coalition /
--        0 when no coalition exists.
--      • nations with no Governing/Coalition party (NPC-run /
--        semi-presidential) waive the gate — the cabinet roll
--        decides (no party politics to join).
--      • the 'no_head_of_government' dead end is gone: with no
--        seated PM/President the application falls through to the
--        NPC cabinet roll, nation row replacing the hog row as the
--        portfolio-pick lock. (This half originally shipped as an
--        in-place edit to 20270875 after it had already been
--        applied, so it never reached the database — re-landed
--        here properly.)
--
--   2. resolve_due_general_elections (7th re-emission, body from
--      20270875) — after installing the new administration it now
--      also syncs factions.party_status (Governing / Coalition /
--      Opposition) so the pills can never drift from the elected
--      coalition again, then strips Junior Ministers as before.
--
--   3. Data repair — any ACTIVE administrations row whose coalition
--      references a party that is not a live movement_party of that
--      nation is rebuilt in place from the live seats walk
--      (coalition, PM party, PM name, ministries PM row, NPC hog
--      row if none is active, party_status pills). Kills the
--      Sierramar phantoms everywhere they render. Phantom party
--      faction rows matching the two names are soft-abandoned —
--      no hard DELETE so no FK landmines inside db-push.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. politician_seek_junior_appointment — party_status source ──
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
    v_gov_names     jsonb;
    v_my_status     text;
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

    -- ── Governing-party gate (20270876) ──────────────────────────
    -- Source of truth: the movement parties' own status pills —
    -- factions.party_status 'Governing' / 'Coalition' — exactly what
    -- the Active Movements page shows. (20270875 read the
    -- administrations coalition snapshot, which for Sierramar still
    -- listed phantom formation-era parties.) Nations with no
    -- Governing/Coalition party (NPC-run / semi-presidential) have
    -- no coalition to join — gate waived, the cabinet roll decides.
    SELECT party_status INTO v_my_status
      FROM factions
     WHERE id = v_pol.politician_party_id
       AND nation_id = v_pol.nation_id
       AND faction_type = 'movement_party'
       AND abandoned_at IS NULL;
    IF COALESCE(v_my_status, '') NOT IN ('Governing', 'Coalition')
       AND EXISTS (
           SELECT 1 FROM factions
            WHERE nation_id = v_pol.nation_id
              AND faction_type = 'movement_party'
              AND abandoned_at IS NULL
              AND party_status IN ('Governing', 'Coalition')
       ) THEN
        SELECT COALESCE(jsonb_agg(faction_name
                        ORDER BY (party_status = 'Governing') DESC,
                                 seats DESC NULLS LAST), '[]'::jsonb)
          INTO v_gov_names
          FROM factions
         WHERE nation_id = v_pol.nation_id
           AND faction_type = 'movement_party'
           AND abandoned_at IS NULL
           AND party_status IN ('Governing', 'Coalition');
        RETURN jsonb_build_object('success', false, 'reason', 'not_governing_party',
                                  'governing_parties', v_gov_names);
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
        -- No seated PM/President at all (20270876): the cabinet
        -- machinery decides on its own — fall through to the NPC
        -- roll. The hog row normally serializes concurrent
        -- portfolio picks; without one, the nation row takes over
        -- as the lock.
        PERFORM 1 FROM nations WHERE id = v_pol.nation_id FOR UPDATE;
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

    -- Where a coalition exists the gate above guarantees membership.
    -- The lead party gets the warmer reception; nations without a
    -- governing coalition have no party politics to read.
    IF v_my_status = 'Governing' THEN
        v_alignment_mod := 5;
    ELSIF v_my_status = 'Coalition' THEN
        v_alignment_mod := 2;
    ELSE
        v_alignment_mod := 0;
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

-- ── 2. resolve_due_general_elections — party_status sync ─────────
CREATE OR REPLACE FUNCTION public.resolve_due_general_elections()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_tick           int;
    v_current_date   text;
    v_nation         RECORD;
    v_seats          int;
    v_majority       int;
    v_next_tick      int;
    v_resolved       int := 0;
    v_largest_party  factions%ROWTYPE;
    -- Coalition walk vars.
    v_party              RECORD;
    v_coalition_array    jsonb;
    v_coalition_seats    int;
    v_pm_party_id        uuid;
    v_pm_party_name      text;
    v_pm_leader_first    text;
    v_pm_leader_last     text;
    v_pm_leader_age      int;
    v_is_semi_pres       boolean;
    v_hos_name           text;
    v_stats_snapshot     jsonb;
BEGIN
    SELECT current_tick, current_date INTO v_tick, v_current_date
      FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', true, 'resolved', 0, 'reason', 'no_shard');
    END IF;

    FOR v_nation IN
        SELECT *
          FROM nations
         WHERE next_election_tick IS NOT NULL
           AND next_election_tick <= v_tick
         FOR UPDATE SKIP LOCKED
    LOOP
        v_seats := COALESCE(v_nation.total_seats, 0);

        -- 20270696: next-election cadence. Stored term_ticks wins when
        -- > 0; NULL / 0 / negative all fall back to the original 6..41
        -- tick random. Computed once per iteration so both the early-
        -- continue path (v_seats <= 0) and the end-of-loop reschedule
        -- read the same value — no duplication, no divergent random
        -- rolls between the two writes.
        v_next_tick := v_tick + CASE
            WHEN COALESCE(v_nation.parliamentary_term_ticks, 0) > 0
                THEN v_nation.parliamentary_term_ticks
            ELSE 5 + 1 + floor(random() * 36)::int
        END;

        IF v_seats <= 0 THEN
            UPDATE nations SET next_election_tick = v_next_tick WHERE id = v_nation.id;
            CONTINUE;
        END IF;

        UPDATE factions f
           SET seats = pr.projected_seats
          FROM project_general_election(v_nation.id) pr
         WHERE f.id = pr.party_id;

        -- Chairs (Deputy Speaker 20270592 / Speaker of the Assembly
        -- 20270593) open at every general election. Scoped to the
        -- resolving nation so SKIP LOCKED stays per-nation.
        UPDATE factions
           SET politician_deputy_speaker_at_tick = NULL
         WHERE nation_id = v_nation.id
           AND politician_deputy_speaker_at_tick IS NOT NULL;
        UPDATE factions
           SET politician_speaker_of_assembly_at_tick = NULL
         WHERE nation_id = v_nation.id
           AND politician_speaker_of_assembly_at_tick IS NOT NULL;

        -- Auto-install HoG (20270594). Pick the largest-seated party
        -- in the nation; tie-break on created_at ASC, same convention
        -- as 20270453 / chair RPCs. Skip when no party has seats
        -- (post-allocation v_seats > 0 doesn't guarantee any party
        -- got a positive share — could be all zero if popularity
        -- summed to zero, in which case there's no PM to seat).
        SELECT * INTO v_largest_party
          FROM factions
         WHERE nation_id    = v_nation.id
           AND faction_type = 'movement_party'
           AND abandoned_at IS NULL
           AND COALESCE(seats, 0) > 0
         ORDER BY seats DESC, created_at ASC
         LIMIT 1;

        IF v_largest_party.id IS NOT NULL
           AND COALESCE(v_largest_party.leader_first_name, '') <> ''
           AND COALESCE(v_largest_party.leader_last_name, '')  <> ''
           AND v_largest_party.leader_age IS NOT NULL THEN
            UPDATE head_of_government
               SET active = false
             WHERE nation_id = v_nation.id
               AND active = true;

            INSERT INTO head_of_government
                (nation_id, faction_id, first_name, last_name, age,
                 appointed_tick, active)
            VALUES (
                v_nation.id, v_largest_party.id,
                v_largest_party.leader_first_name,
                v_largest_party.leader_last_name,
                v_largest_party.leader_age,
                v_tick, true
            );

            -- ── 20270666: always-on coalition + PM install ──
            v_is_semi_pres := COALESCE(v_nation.government_type, '') ILIKE '%semi-presidential%'
                              OR COALESCE(v_nation.government_type, '') ILIKE '%semi_presidential%';

            IF NOT v_is_semi_pres THEN
                v_majority        := (v_seats / 2) + 1;
                v_coalition_array := '[]'::jsonb;
                v_coalition_seats := 0;
                v_pm_party_id     := NULL;
                v_pm_party_name   := NULL;
                v_pm_leader_first := NULL;
                v_pm_leader_last  := NULL;
                v_pm_leader_age   := NULL;

                FOR v_party IN
                    SELECT id, faction_name, seats,
                           leader_first_name, leader_last_name, leader_age
                      FROM factions
                     WHERE nation_id    = v_nation.id
                       AND faction_type = 'movement_party'
                       AND abandoned_at IS NULL
                       AND COALESCE(seats, 0) > 0
                     ORDER BY seats DESC, created_at ASC
                LOOP
                    v_coalition_array := v_coalition_array ||
                        jsonb_build_object(
                            'party_id',   v_party.id,
                            'party_name', v_party.faction_name,
                            'seats',      v_party.seats
                        );
                    v_coalition_seats := v_coalition_seats + v_party.seats;
                    IF v_pm_party_id IS NULL THEN
                        v_pm_party_id     := v_party.id;
                        v_pm_party_name   := v_party.faction_name;
                        v_pm_leader_first := v_party.leader_first_name;
                        v_pm_leader_last  := v_party.leader_last_name;
                        v_pm_leader_age   := v_party.leader_age;
                    END IF;
                    EXIT WHEN v_coalition_seats >= v_majority;
                END LOOP;

                v_hos_name := NULLIF(btrim(
                    COALESCE(v_nation.head_of_state_first_name, '') || ' ' ||
                    COALESCE(v_nation.head_of_state_last_name,  '')
                ), '');
                v_stats_snapshot := jsonb_build_object(
                    'gdp_growth',         v_nation.gdp_growth,
                    'debt',               v_nation.debt,
                    'immigration',        v_nation.immigration,
                    'standard_of_living', v_nation.standard_of_living,
                    'cost_of_living',     v_nation.cost_of_living,
                    'budget',             v_nation.budget,
                    'state_apparatus',    v_nation.state_apparatus,
                    'unrest',             v_nation.unrest,
                    'public_approval',    v_nation.public_approval,
                    'crown_authority',    v_nation.crown_authority,
                    'energy',             v_nation.energy,
                    'health',             v_nation.health,
                    'education',          v_nation.education,
                    'global_image',       v_nation.global_image,
                    'infrastructure',     v_nation.infrastructure,
                    'industry',           v_nation.industry,
                    'farmland',           v_nation.farmland,
                    'service_sector',     v_nation.service_sector,
                    'unskilled_workers',  v_nation.unskilled_workers,
                    'skilled_workers',    v_nation.skilled_workers,
                    'wages',              v_nation.wages,
                    'income_tax',         v_nation.income_tax,
                    'corporate_tax',      v_nation.corporate_tax,
                    'crime',              v_nation.crime,
                    'corruption',         v_nation.corruption,
                    'inequality',         v_nation.inequality
                );

                UPDATE administrations
                   SET ended_at_tick   = v_tick,
                       ended_at_date   = v_current_date,
                       end_reason      = 'general_election',
                       approval_at_end = COALESCE(v_nation.gov_approval, 50),
                       stats_at_end    = v_stats_snapshot,
                       updated_at      = now()
                 WHERE nation_id     = v_nation.id
                   AND ended_at_tick IS NULL;

                INSERT INTO administrations (
                    nation_id, coalition_parties, total_seats,
                    government_type, started_at_tick, started_at_date,
                    stats_at_start, approval_at_start,
                    head_of_state, head_of_state_title, hos_election_method,
                    pm_party_id, pm_party_name,
                    prime_minister, admin_name
                ) VALUES (
                    v_nation.id, v_coalition_array, v_seats,
                    COALESCE(v_nation.government_type, 'Parliamentary Democracy'),
                    v_tick, v_current_date,
                    v_stats_snapshot, COALESCE(v_nation.gov_approval, 50),
                    v_hos_name, v_nation.head_of_state_title, v_nation.hos_election_method,
                    v_pm_party_id, v_pm_party_name,
                    v_pm_leader_first || ' ' || v_pm_leader_last,
                    v_pm_leader_last || ' Administration'
                );

                -- Party government cuts both ways (20270875): any
                -- sitting Junior Minister in this nation whose party
                -- is not in the NEW coalition loses the portfolio.
                WITH losers AS (
                    SELECT f.id, f.politician_junior_portfolio AS portfolio
                      FROM factions f
                     WHERE f.nation_id = v_nation.id
                       AND f.politician_junior_portfolio IS NOT NULL
                       AND f.abandoned_at IS NULL
                       AND (f.politician_party_id IS NULL
                            OR NOT EXISTS (
                                SELECT 1 FROM jsonb_array_elements(v_coalition_array) e
                                 WHERE (e->>'party_id')::uuid = f.politician_party_id))
                     FOR UPDATE
                ), stripped AS (
                    UPDATE factions f
                       SET politician_junior_minister_at_tick = NULL,
                           politician_junior_portfolio        = NULL
                     WHERE f.id IN (SELECT id FROM losers)
                )
                INSERT INTO politician_career_events
                    (faction_id, event_tick, event_type, target_name)
                SELECT id, v_tick, 'junior_minister_lost_power', COALESCE(portfolio, '')
                  FROM losers;

                -- Keep the movement-party status pills in lockstep
                -- with the new administration (20270876) — factions.
                -- party_status is the user-facing source for who
                -- governs, and the resolver previously left it stale
                -- after every election.
                UPDATE factions f
                   SET party_status = CASE
                        WHEN f.id = v_pm_party_id THEN 'Governing'
                        WHEN EXISTS (
                            SELECT 1 FROM jsonb_array_elements(v_coalition_array) e
                             WHERE (e->>'party_id')::uuid = f.id) THEN 'Coalition'
                        ELSE 'Opposition' END
                 WHERE f.nation_id = v_nation.id
                   AND f.faction_type = 'movement_party'
                   AND f.abandoned_at IS NULL;

                UPDATE ministries SET
                    party_id            = v_pm_party_id,
                    minister_first_name = v_pm_leader_first,
                    minister_last_name  = v_pm_leader_last,
                    minister_age        = v_pm_leader_age,
                    is_active           = true
                 WHERE nation_id    = v_nation.id
                   AND ministry_key = 'prime_minister';
                IF NOT FOUND THEN
                    INSERT INTO ministries (
                        nation_id, ministry_key, ministry_name,
                        party_id, minister_first_name, minister_last_name,
                        minister_age, is_active
                    ) VALUES (
                        v_nation.id, 'prime_minister', 'Prime Minister',
                        v_pm_party_id, v_pm_leader_first, v_pm_leader_last,
                        v_pm_leader_age, true
                    );
                END IF;
            END IF;
        END IF;

        -- v_next_tick was computed at the top of this iteration.
        UPDATE nations
           SET next_election_tick = v_next_tick
         WHERE id = v_nation.id;

        v_resolved := v_resolved + 1;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'tick', v_tick, 'resolved', v_resolved);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.resolve_due_general_elections() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.resolve_due_general_elections() TO authenticated;

-- ── 3. Data repair — rebuild stale coalition snapshots ───────────
DO $do$
DECLARE
    v_tick            int;
    v_nation          RECORD;
    v_party           RECORD;
    v_majority        int;
    v_coalition_array jsonb;
    v_coalition_seats int;
    v_pm_party_id     uuid;
    v_pm_party_name   text;
    v_pm_leader_first text;
    v_pm_leader_last  text;
    v_pm_leader_age   int;
    v_fixed           int := 0;
BEGIN
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- Lingering phantom party rows (if they exist as factions at
    -- all — the names may live only in the snapshot). Soft-abandon:
    -- removes them from every surface without FK risk.
    UPDATE factions
       SET abandoned_at = COALESCE(abandoned_at, now())
     WHERE faction_type = 'movement_party'
       AND (faction_name ILIKE '%party of communist%'
            OR faction_name ILIKE '%communitarian voters%');

    FOR v_nation IN
        SELECT n.id, n.total_seats, a.id AS admin_id
          FROM nations n
          JOIN administrations a
            ON a.nation_id = n.id AND a.ended_at_tick IS NULL
         WHERE COALESCE(n.government_type, '') NOT ILIKE '%semi-presidential%'
           AND COALESCE(n.government_type, '') NOT ILIKE '%semi_presidential%'
           AND EXISTS (
               SELECT 1 FROM jsonb_array_elements(COALESCE(a.coalition_parties, '[]'::jsonb)) e
                WHERE NOT EXISTS (
                    SELECT 1 FROM factions f
                     WHERE f.id = (e->>'party_id')::uuid
                       AND f.nation_id = n.id
                       AND f.faction_type = 'movement_party'
                       AND f.abandoned_at IS NULL))
    LOOP
        -- Live seats walk (same rule as 20270666 / 20270731):
        -- accumulate parties seats-DESC until floor(total/2)+1.
        v_majority        := (COALESCE(v_nation.total_seats, 0) / 2) + 1;
        v_coalition_array := '[]'::jsonb;
        v_coalition_seats := 0;
        v_pm_party_id     := NULL;
        FOR v_party IN
            SELECT id, faction_name, seats,
                   leader_first_name, leader_last_name, leader_age
              FROM factions
             WHERE nation_id    = v_nation.id
               AND faction_type = 'movement_party'
               AND abandoned_at IS NULL
               AND COALESCE(seats, 0) > 0
             ORDER BY seats DESC, created_at ASC
        LOOP
            v_coalition_array := v_coalition_array || jsonb_build_object(
                'party_id', v_party.id, 'party_name', v_party.faction_name,
                'seats', v_party.seats);
            v_coalition_seats := v_coalition_seats + v_party.seats;
            IF v_pm_party_id IS NULL THEN
                v_pm_party_id     := v_party.id;
                v_pm_party_name   := v_party.faction_name;
                v_pm_leader_first := v_party.leader_first_name;
                v_pm_leader_last  := v_party.leader_last_name;
                v_pm_leader_age   := v_party.leader_age;
            END IF;
            EXIT WHEN v_coalition_seats >= v_majority;
        END LOOP;

        IF v_pm_party_id IS NULL THEN
            CONTINUE;  -- no live seated parties; nothing to rebuild from
        END IF;

        -- Repair the record in place — this is fixing a snapshot,
        -- not ending a government, so started_at/stats stay put.
        UPDATE administrations
           SET coalition_parties = v_coalition_array,
               pm_party_id       = v_pm_party_id,
               pm_party_name     = v_pm_party_name,
               prime_minister    = NULLIF(btrim(COALESCE(v_pm_leader_first, '') || ' ' ||
                                                COALESCE(v_pm_leader_last, '')), ''),
               admin_name        = COALESCE(v_pm_leader_last, v_pm_party_name) || ' Administration',
               updated_at        = now()
         WHERE id = v_nation.admin_id;

        UPDATE ministries SET
            party_id            = v_pm_party_id,
            minister_first_name = v_pm_leader_first,
            minister_last_name  = v_pm_leader_last,
            minister_age        = v_pm_leader_age,
            is_active           = true
         WHERE nation_id    = v_nation.id
           AND ministry_key = 'prime_minister';
        IF NOT FOUND THEN
            INSERT INTO ministries (
                nation_id, ministry_key, ministry_name,
                party_id, minister_first_name, minister_last_name,
                minister_age, is_active
            ) VALUES (
                v_nation.id, 'prime_minister', 'Prime Minister',
                v_pm_party_id, v_pm_leader_first, v_pm_leader_last,
                v_pm_leader_age, true
            );
        END IF;

        -- Seat an NPC PM only where no active hog row exists at all
        -- (Sierramar's gap) — never displace a sitting one.
        IF NOT EXISTS (SELECT 1 FROM head_of_government
                        WHERE nation_id = v_nation.id AND active = true) THEN
            INSERT INTO head_of_government
                (nation_id, faction_id, first_name, last_name, age,
                 appointed_tick, active)
            VALUES (v_nation.id, v_pm_party_id,
                    v_pm_leader_first, v_pm_leader_last, v_pm_leader_age,
                    v_tick, true);
        END IF;

        UPDATE factions f
           SET party_status = CASE
                WHEN f.id = v_pm_party_id THEN 'Governing'
                WHEN EXISTS (
                    SELECT 1 FROM jsonb_array_elements(v_coalition_array) e
                     WHERE (e->>'party_id')::uuid = f.id) THEN 'Coalition'
                ELSE 'Opposition' END
         WHERE f.nation_id = v_nation.id
           AND f.faction_type = 'movement_party'
           AND f.abandoned_at IS NULL;

        v_fixed := v_fixed + 1;
    END LOOP;

    RAISE NOTICE '20270876 repair: rebuilt % stale coalition snapshot(s)', v_fixed;
END $do$;

NOTIFY pgrst, 'reload schema';

COMMIT;
