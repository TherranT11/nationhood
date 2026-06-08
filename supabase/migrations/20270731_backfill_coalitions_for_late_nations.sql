-- ════════════════════════════════════════════════════════════════════
-- 20270731 — Backfill coalitions for nations seeded after 20270666
--
-- 20270666 shipped the always-on coalition + PM install for parliamentary
-- nations, plus a one-time backfill for everything that didn't have an
-- active administrations row at the time. Sierramar was seeded later
-- (20270695), so it slipped past that backfill. Result: the Government
-- & Politics panel reads "No majority · all OPPOSITION" — there's no
-- administration row to read coalition_parties off of, the client falls
-- back to "look for a solo majority," nobody has > 50%, every party
-- ends up in the opposition bucket.
--
-- Fix: re-run the same backfill DO block from 20270666 Part 2. The
-- WHERE NOT EXISTS guard makes it idempotent — nations that already
-- have an active admin row are skipped. Sierramar (no admin row yet)
-- gets the install; the three nations 20270666 already covered are
-- no-ops.
--
-- Coalition rule (unchanged from 20270666):
--   • Walk parties in seat-share DESC order, tie-break created_at ASC.
--   • Accumulate until total ≥ floor(total_seats / 2) + 1.
--   • PM is the leader of the largest member (first one added).
--   • Skip semi-presidential — those have a separate PM mechanism.
--
-- Companion client fix (politician-nation.html) ships in the same
-- commit: when no admin row exists the page builds the same coalition
-- on the fly, so the UI is never stuck at "all opposition" again even
-- if a future nation lands before a backfill catches it.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

DO $$
DECLARE
    v_tick               int;
    v_current_date       text;
    v_nation             RECORD;
    v_seats              int;
    v_majority           int;
    v_party              RECORD;
    v_coalition_array    jsonb;
    v_coalition_seats    int;
    v_pm_party_id        uuid;
    v_pm_party_name      text;
    v_pm_leader_first    text;
    v_pm_leader_last     text;
    v_pm_leader_age      int;
    v_is_semi_pres       boolean;
    v_largest_party      factions%ROWTYPE;
    v_hos_name           text;
    v_stats_snapshot     jsonb;
    v_installed          int := 0;
BEGIN
    SELECT current_tick, current_date INTO v_tick, v_current_date
      FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    FOR v_nation IN
        SELECT *
          FROM nations n
         WHERE COALESCE(n.total_seats, 0) > 0
           AND NOT EXISTS (
               SELECT 1 FROM administrations a
                WHERE a.nation_id     = n.id
                  AND a.ended_at_tick IS NULL
           )
    LOOP
        v_seats := v_nation.total_seats;
        v_is_semi_pres := COALESCE(v_nation.government_type, '') ILIKE '%semi-presidential%'
                          OR COALESCE(v_nation.government_type, '') ILIKE '%semi_presidential%';
        IF v_is_semi_pres THEN
            CONTINUE;
        END IF;

        SELECT * INTO v_largest_party
          FROM factions
         WHERE nation_id    = v_nation.id
           AND faction_type = 'movement_party'
           AND abandoned_at IS NULL
           AND COALESCE(seats, 0) > 0
         ORDER BY seats DESC, created_at ASC
         LIMIT 1;

        IF v_largest_party.id IS NULL
           OR COALESCE(v_largest_party.leader_first_name, '') = ''
           OR COALESCE(v_largest_party.leader_last_name, '')  = ''
           OR v_largest_party.leader_age IS NULL THEN
            CONTINUE;
        END IF;

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

        UPDATE head_of_government
           SET active = false
         WHERE nation_id = v_nation.id
           AND active = true;

        INSERT INTO head_of_government
            (nation_id, faction_id, first_name, last_name, age,
             appointed_tick, active)
        VALUES (
            v_nation.id, v_pm_party_id,
            v_pm_leader_first, v_pm_leader_last, v_pm_leader_age,
            v_tick, true
        );

        v_installed := v_installed + 1;
    END LOOP;

    RAISE NOTICE '20270731 backfill: installed coalition + PM in % nation(s)', v_installed;
END $$;

COMMIT;
