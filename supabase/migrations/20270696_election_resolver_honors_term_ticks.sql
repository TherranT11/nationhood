-- ════════════════════════════════════════════════════════════════════
-- 20270696 — Election resolver honors parliamentary_term_ticks
--
-- Pre-existing bug: nations.parliamentary_term_ticks has been stored
-- as 48 for most nations since 20260323 (Melizea, Avelia, Palvera,
-- Montequilla, San Estrella, Valdoria, and now Sierramar via 20270695)
-- but the election resolver hard-codes a 6..41 tick random reschedule
-- (v_tick + 5 + 1 + floor(random() * 36)::int). The stored column was
-- decorative — the random math was the actual source of truth.
--
-- ONE SOURCE OF TRUTH fix: the stored column wins. When
-- parliamentary_term_ticks is set, the next election fires exactly
-- that many ticks after the current one. When NULL (e.g. Sangreza,
-- per 20260323's explicit NULL), the existing random fallback kicks
-- in — same 6..41 range, no behavioural change for those nations.
--
-- Behavioural impact (intended):
--   Melizea / Avelia / Palvera / Montequilla / San Estrella /
--   Valdoria / Sierramar shift from "random 6..41 ticks per cycle"
--   → "exactly 48 ticks per cycle" on every reschedule from this
--   migration forward. Their NEXT election (already scheduled) is
--   not retro-touched — only the schedule that fires AFTER the next
--   resolve gets the new cadence.
--
-- Mechanism: re-emit resolve_due_general_elections with the
-- latest body (20270666) and replace the two reschedule lines with
-- COALESCE(v_nation.parliamentary_term_ticks, 5 + 1 + floor(random()
-- * 36)::int). v_nation is already a RECORD from `SELECT *`, so the
-- column is in scope without a re-query.
--
-- Apply after 20270695.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

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
        IF v_seats <= 0 THEN
            -- 20270696: stored term_ticks wins; random fallback when NULL.
            v_next_tick := v_tick + COALESCE(v_nation.parliamentary_term_ticks,
                                             5 + 1 + floor(random() * 36)::int);
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

        -- 20270696: stored term_ticks wins; random fallback when NULL.
        v_next_tick := v_tick + COALESCE(v_nation.parliamentary_term_ticks,
                                         5 + 1 + floor(random() * 36)::int);
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

COMMENT ON FUNCTION public.resolve_due_general_elections() IS
    'Reallocates assembly seats and reschedules next election. As of 20270696, the next-election cadence reads nations.parliamentary_term_ticks (canonical when set) with a fallback to the original 6..41-tick random for nations whose term column is NULL. Re-emitted from 20270666''s body with only that one substantive change.';

NOTIFY pgrst, 'reload schema';

COMMIT;
