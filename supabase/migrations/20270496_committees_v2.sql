-- ════════════════════════════════════════════════════════════════════
-- Committees v2 — extend the registry to five committees, seed Melizea
-- and Avelia.
--
-- 20270453 shipped the committees table + ensure_committee with a
-- one-entry whitelist ('defense_foreign_affairs'). 20270454 made the
-- creation race-safe. This migration adds the other four committees
-- the design pass calls for:
--
--     finance_budget            — Finance and Budget Committee
--     judiciary_constitutional  — Judiciary & Constitutional Affairs
--     industry_trade_labor      — Industry, Trade and Labor Committee
--     interior_public_welfare   — Interior & Public Welfare Committee
--
-- Three pieces move together:
--   1. Widen the committees.committee_key CHECK to the 5-entry set.
--   2. CREATE OR REPLACE ensure_committee with the same 5-entry IN
--      check, mirroring 20270454's race-safe body verbatim — only the
--      key whitelist changes.
--   3. One-shot seed: for the two active politician nations (Melizea,
--      Avelia), insert a committees row for each NEW key and seed
--      5 committee_members per the 20270453 slot rules (chair from
--      governing party, ranking minority from largest non-gov, etc.).
--      Defense & Foreign Affairs is already seeded for both nations
--      via earlier player visits; this migration only fills the new
--      four. The seed is idempotent — re-running finds the committees
--      row via the unique (nation_id, committee_key) constraint and
--      skips the member insert.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Widen the CHECK constraint ───────────────────────────────────
ALTER TABLE committees DROP CONSTRAINT IF EXISTS committees_committee_key_check;
ALTER TABLE committees ADD  CONSTRAINT committees_committee_key_check
    CHECK (committee_key IN (
        'defense_foreign_affairs',
        'finance_budget',
        'judiciary_constitutional',
        'industry_trade_labor',
        'interior_public_welfare'
    ));

-- ── 2. ensure_committee — accept the 5-entry key set ────────────────
-- Body byte-identical to 20270454 (race-safe ON CONFLICT path); only
-- the IN list changes. Kept whole rather than patched piecewise so
-- the function definition is self-contained.
CREATE OR REPLACE FUNCTION public.ensure_committee(p_nation_id uuid, p_committee_key text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid           uuid := auth.uid();
    v_existing      committees%ROWTYPE;
    v_comm_id       uuid;
    v_tick          int;
    v_nation        nations%ROWTYPE;
    v_party_ids     uuid[];
    v_party_seats   int[];
    v_n_parties     int;
    v_gov_seats     int;
    v_gov_quota     int;
    v_slot_party    uuid;
    v_slot_role     text;
    v_first         text;
    v_last          text;
    v_npool_len     int;
    v_lpool_len     int;
    v_other_idx     int;
    v_seeded        int := 0;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_nation_id IS NULL OR p_committee_key IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_committee_key NOT IN (
        'defense_foreign_affairs',
        'finance_budget',
        'judiciary_constitutional',
        'industry_trade_labor',
        'interior_public_welfare'
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'unknown_committee_key');
    END IF;

    SELECT * INTO v_existing FROM committees
     WHERE nation_id = p_nation_id AND committee_key = p_committee_key;
    IF v_existing.id IS NOT NULL THEN
        RETURN jsonb_build_object('success', true, 'committee_id', v_existing.id, 'created', false);
    END IF;

    SELECT * INTO v_nation FROM nations WHERE id = p_nation_id;
    IF v_nation.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_not_found');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    INSERT INTO committees (nation_id, committee_key, seeded_at_tick)
    VALUES (p_nation_id, p_committee_key, v_tick)
    ON CONFLICT (nation_id, committee_key) DO NOTHING
    RETURNING id INTO v_comm_id;

    IF v_comm_id IS NULL THEN
        SELECT id INTO v_comm_id FROM committees
         WHERE nation_id = p_nation_id AND committee_key = p_committee_key;
        RETURN jsonb_build_object('success', true, 'committee_id', v_comm_id, 'created', false);
    END IF;

    SELECT array_agg(id ORDER BY COALESCE(seats, 0) DESC, created_at ASC),
           array_agg(COALESCE(seats, 0) ORDER BY COALESCE(seats, 0) DESC, created_at ASC)
      INTO v_party_ids, v_party_seats
      FROM factions
     WHERE nation_id = p_nation_id
       AND faction_type = 'movement_party'
       AND abandoned_at IS NULL;

    v_n_parties := COALESCE(array_length(v_party_ids, 1), 0);

    IF v_n_parties = 0 THEN
        RETURN jsonb_build_object('success', true, 'committee_id', v_comm_id,
            'created', true, 'members_seeded', 0, 'reason', 'no_parties');
    END IF;

    v_gov_seats := v_party_seats[1];
    v_gov_quota := LEAST(3, GREATEST(0, v_gov_seats));

    v_npool_len := COALESCE(array_length(v_nation.first_name_pool, 1), 0);
    v_lpool_len := COALESCE(array_length(v_nation.last_name_pool, 1), 0);

    v_other_idx := 2;

    FOR i IN 1..5 LOOP
        IF i <= v_gov_quota THEN
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
        ELSE
            v_slot_party := v_party_ids[1];
            v_slot_role  := 'member';
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
            v_comm_id, i, v_slot_role, v_slot_party,
            v_first, v_last, v_tick
        );
        v_seeded := v_seeded + 1;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'committee_id', v_comm_id,
        'created', true,
        'members_seeded', v_seeded
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_committee(uuid, text) TO authenticated;

-- ── 3. Seed the four new committees for Melizea + Avelia ────────────
-- Migration-context auth.uid() is NULL, so we can't go through the
-- public RPC. Inline the same logic against the (nation, key) grid.
-- ON CONFLICT (nation_id, committee_key) DO NOTHING on the committees
-- INSERT keeps this idempotent — if the row already exists, the
-- member loop is skipped via the RETURNING-is-NULL branch below.
DO $$
DECLARE
    rec           RECORD;
    v_comm_id     uuid;
    v_tick        int;
    v_nation      nations%ROWTYPE;
    v_party_ids   uuid[];
    v_party_seats int[];
    v_n_parties   int;
    v_gov_seats   int;
    v_gov_quota   int;
    v_slot_party  uuid;
    v_slot_role   text;
    v_first       text;
    v_last        text;
    v_npool_len   int;
    v_lpool_len   int;
    v_other_idx   int;
BEGIN
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    FOR rec IN
        SELECT n.id AS nation_id,
               k.key AS committee_key
          FROM nations n
         CROSS JOIN (VALUES
             ('finance_budget'),
             ('judiciary_constitutional'),
             ('industry_trade_labor'),
             ('interior_public_welfare')
         ) AS k(key)
         WHERE n.name IN ('Melizea', 'Avelia')
    LOOP
        INSERT INTO committees (nation_id, committee_key, seeded_at_tick)
        VALUES (rec.nation_id, rec.committee_key, v_tick)
        ON CONFLICT (nation_id, committee_key) DO NOTHING
        RETURNING id INTO v_comm_id;

        IF v_comm_id IS NULL THEN
            CONTINUE;  -- already existed; skip member seed.
        END IF;

        SELECT * INTO v_nation FROM nations WHERE id = rec.nation_id;

        SELECT array_agg(id ORDER BY COALESCE(seats, 0) DESC, created_at ASC),
               array_agg(COALESCE(seats, 0) ORDER BY COALESCE(seats, 0) DESC, created_at ASC)
          INTO v_party_ids, v_party_seats
          FROM factions
         WHERE nation_id = rec.nation_id
           AND faction_type = 'movement_party'
           AND abandoned_at IS NULL;

        v_n_parties := COALESCE(array_length(v_party_ids, 1), 0);
        IF v_n_parties = 0 THEN
            CONTINUE;  -- committee row exists, no parties to seed against.
        END IF;

        v_gov_seats := v_party_seats[1];
        v_gov_quota := LEAST(3, GREATEST(0, v_gov_seats));

        v_npool_len := COALESCE(array_length(v_nation.first_name_pool, 1), 0);
        v_lpool_len := COALESCE(array_length(v_nation.last_name_pool, 1), 0);

        v_other_idx := 2;

        FOR i IN 1..5 LOOP
            IF i <= v_gov_quota THEN
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
            ELSE
                v_slot_party := v_party_ids[1];
                v_slot_role  := 'member';
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
                v_comm_id, i, v_slot_role, v_slot_party,
                v_first, v_last, v_tick
            );
        END LOOP;
    END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
