-- ════════════════════════════════════════════════════════════════════
-- 20270688 — Backfill: seed NPC slots on any committee with zero members
--
-- Bug surfaced by a player on Montequilla's Industry, Trade and Labor
-- Committee: the page rendered "0 members / No members seated yet"
-- and the Apply for membership link returned 'no_open_seat'. Root
-- cause: ensure_committee (latest body 20270496) skips the 5-row
-- member seed when the nation has zero movement_parties at create
-- time — it inserts the committees row, returns success, but exits
-- before the FOR 1..5 LOOP. If parties get added later, the committee
-- stays empty, and apply_for_committee — which looks for a
-- committee_members row whose politician_faction_id IS NULL to flip
-- — finds nothing and bails.
--
-- This migration walks every existing committees row that has zero
-- committee_members and seeds five NPC slots. Logic mirrors the
-- inline seed block in 20270496 verbatim (gov-quota, ranking-minority
-- offset, party round-robin from the second party onward), with one
-- carve-out: nations that genuinely have NO movement_parties get
-- five NULL-party_id slots so the structure exists; player apply
-- will work once any party appears, and the bloc tally already
-- treats party_id IS NULL as 'unaffiliated' so vote math doesn't
-- regress.
--
-- One-shot data backfill — no schema or function changes. Ongoing
-- prevention (e.g. backfill-on-every-ensure_committee call) is a
-- separate question and not in scope here.
--
-- Apply after 20270687.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

DO $$
DECLARE
    rec_comm       record;
    v_nation       nations%ROWTYPE;
    v_tick         int;
    v_party_ids    uuid[];
    v_party_seats  int[];
    v_n_parties    int;
    v_gov_seats    int;
    v_gov_quota    int;
    v_npool_len    int;
    v_lpool_len    int;
    v_other_idx    int;
    v_slot_party   uuid;
    v_slot_role    text;
    v_first        text;
    v_last         text;
    i              int;
    v_seeded_comms int := 0;
BEGIN
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    FOR rec_comm IN
        SELECT c.id AS committee_id, c.nation_id
          FROM committees c
         WHERE NOT EXISTS (
             SELECT 1 FROM committee_members cm WHERE cm.committee_id = c.id
         )
    LOOP
        SELECT * INTO v_nation FROM nations WHERE id = rec_comm.nation_id;
        IF v_nation.id IS NULL THEN
            CONTINUE;
        END IF;

        SELECT array_agg(id   ORDER BY COALESCE(seats, 0) DESC, created_at ASC),
               array_agg(COALESCE(seats, 0) ORDER BY COALESCE(seats, 0) DESC, created_at ASC)
          INTO v_party_ids, v_party_seats
          FROM factions
         WHERE nation_id = rec_comm.nation_id
           AND faction_type = 'movement_party'
           AND abandoned_at IS NULL;

        v_n_parties := COALESCE(array_length(v_party_ids, 1), 0);
        v_npool_len := COALESCE(array_length(v_nation.first_name_pool, 1), 0);
        v_lpool_len := COALESCE(array_length(v_nation.last_name_pool, 1), 0);
        v_other_idx := 2;

        IF v_n_parties > 0 THEN
            v_gov_seats := v_party_seats[1];
            v_gov_quota := LEAST(3, GREATEST(0, v_gov_seats));
        ELSE
            v_gov_quota := 0;
        END IF;

        FOR i IN 1..5 LOOP
            IF v_n_parties > 0 AND i <= v_gov_quota THEN
                v_slot_party := v_party_ids[1];
                v_slot_role  := CASE i
                                    WHEN 1 THEN 'chair'
                                    WHEN 2 THEN 'vice_chair'
                                    ELSE 'member'
                                END;
            ELSIF v_n_parties >= 2 THEN
                v_slot_party := v_party_ids[2 + ((v_other_idx - 2) % (v_n_parties - 1))];
                IF i = v_gov_quota + 1 THEN
                    v_slot_role := 'ranking_minority';
                ELSE
                    v_slot_role := 'member';
                END IF;
                v_other_idx := v_other_idx + 1;
            ELSIF v_n_parties = 1 THEN
                v_slot_party := v_party_ids[1];
                v_slot_role  := 'member';
            ELSE
                -- Zero parties — seat as Independent NPC. Player apply
                -- can still flip a member slot once a party exists;
                -- the bloc tally already excludes NULL party_id seats
                -- from votes (20270663) so vote math doesn't regress.
                v_slot_party := NULL;
                v_slot_role  := CASE i
                                    WHEN 1 THEN 'chair'
                                    WHEN 2 THEN 'vice_chair'
                                    WHEN 3 THEN 'ranking_minority'
                                    ELSE 'member'
                                END;
            END IF;

            IF v_npool_len > 0 THEN
                v_first := v_nation.first_name_pool[1 + floor(random() * v_npool_len)::int];
            ELSE
                v_first := 'Member';
            END IF;
            IF v_lpool_len > 0 THEN
                v_last := v_nation.last_name_pool[1 + floor(random() * v_lpool_len)::int];
            ELSE
                v_last := i::text;
            END IF;

            INSERT INTO committee_members (
                committee_id, slot_idx, role, party_id,
                npc_first_name, npc_last_name, seated_at_tick
            ) VALUES (
                rec_comm.committee_id, i, v_slot_role, v_slot_party,
                v_first, v_last, v_tick
            );
        END LOOP;

        v_seeded_comms := v_seeded_comms + 1;
    END LOOP;

    RAISE NOTICE '[20270688] Backfilled NPC slots on % empty committee(s).', v_seeded_comms;
END $$;

COMMIT;
