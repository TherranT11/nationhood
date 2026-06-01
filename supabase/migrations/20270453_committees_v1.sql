-- ════════════════════════════════════════════════════════════════════
-- Committees v1 — per-nation Defense & Foreign Affairs (forward-compat
-- for additional committees behind committee_key)
--
-- Schema:
--   committees           — one row per (nation, committee_key)
--   committee_members    — five slots per committee
--
-- Membership: 5 slots, seeded once on first view via ensure_committee.
-- Slot rules (gov_seats = top party's seat count in this nation):
--   gov_seats >= 3 → gov takes slots 1-3 (chair, vice_chair, member),
--                    largest non-gov gets slot 4 (ranking_minority),
--                    next non-gov gets slot 5 (member)
--   gov_seats = 2  → gov takes slots 1-2 (chair, vice_chair),
--                    largest non-gov gets slot 3 (ranking_minority),
--                    next non-gov gets slots 4-5 (members)
--   gov_seats = 1  → gov takes slot 1 (chair),
--                    largest non-gov gets slot 2 (ranking_minority),
--                    remaining slots cycle non-gov parties
--   gov_seats = 0  → committee row exists but no members (no
--                    parliament / Absolute Monarchy / fresh nation)
--
-- Names: NPCs only at seed time. Pulled from nations.first_name_pool +
-- last_name_pool (same pattern as 20270413 auto-leader backfill). Real
-- politicians take seats only via a future apply flow.
--
-- Per user spec (20270453): one-time seed, never re-cast. Government
-- changes (election, defection) do NOT reshuffle the committee.
-- Membership changes only via player actions (apply/resign), which
-- come in follow-up migrations.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Tables ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS committees (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nation_id       uuid NOT NULL REFERENCES nations(id) ON DELETE CASCADE,
    committee_key   text NOT NULL CHECK (committee_key IN ('defense_foreign_affairs')),
    member_count    int  NOT NULL DEFAULT 5,
    seeded_at_tick  int,
    created_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE (nation_id, committee_key)
);

CREATE INDEX IF NOT EXISTS committees_nation_idx ON committees(nation_id);

COMMENT ON TABLE committees IS
    'Per-nation committee scaffold. One row per (nation_id, committee_key). committee_key is a small enum; v1 ships defense_foreign_affairs only.';

CREATE TABLE IF NOT EXISTS committee_members (
    id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    committee_id          uuid NOT NULL REFERENCES committees(id) ON DELETE CASCADE,
    slot_idx              int  NOT NULL CHECK (slot_idx BETWEEN 1 AND 5),
    role                  text NOT NULL CHECK (role IN ('chair','vice_chair','ranking_minority','member')),
    party_id              uuid REFERENCES factions(id) ON DELETE SET NULL,
    npc_first_name        text,
    npc_last_name         text,
    politician_faction_id uuid REFERENCES factions(id) ON DELETE SET NULL,
    seated_at_tick        int,
    UNIQUE (committee_id, slot_idx)
);

CREATE INDEX IF NOT EXISTS committee_members_committee_idx ON committee_members(committee_id);
CREATE INDEX IF NOT EXISTS committee_members_politician_idx ON committee_members(politician_faction_id);

COMMENT ON TABLE committee_members IS
    'Five-row block per committee. politician_faction_id is non-null when a real player holds the seat; otherwise (npc_first_name, npc_last_name) render the NPC. party_id always reflects the affiliated movement_party.';

-- ── 2. RLS ──────────────────────────────────────────────────────────
ALTER TABLE committees        ENABLE ROW LEVEL SECURITY;
ALTER TABLE committee_members ENABLE ROW LEVEL SECURITY;

-- Committees and their rosters are public reading material.
DROP POLICY IF EXISTS committees_select ON committees;
CREATE POLICY committees_select ON committees
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS committee_members_select ON committee_members;
CREATE POLICY committee_members_select ON committee_members
    FOR SELECT TO authenticated USING (true);

-- Writes only via service_role / SECURITY DEFINER RPCs. No direct
-- client UPDATE/INSERT/DELETE — seat shuffles are server-controlled.
DROP POLICY IF EXISTS committees_service_all ON committees;
CREATE POLICY committees_service_all ON committees
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS committee_members_service_all ON committee_members;
CREATE POLICY committee_members_service_all ON committee_members
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── 3. ensure_committee — idempotent seed ───────────────────────────
-- First call: creates the committee row, seeds members per the slot
-- rules in the header. Subsequent calls: noop, returns existing id.
-- SECURITY DEFINER because it INSERTs into committee_members (write-
-- protected for clients).
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
    IF p_committee_key NOT IN ('defense_foreign_affairs') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'unknown_committee_key');
    END IF;

    -- Idempotency: if the committee already exists, return it.
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
    RETURNING id INTO v_comm_id;

    -- Parties in this nation ranked by seats DESC. The first entry is
    -- the governing party (most seats); subsequent entries fill the
    -- non-gov slots in seat order.
    SELECT array_agg(id ORDER BY COALESCE(seats, 0) DESC, created_at ASC),
           array_agg(COALESCE(seats, 0) ORDER BY COALESCE(seats, 0) DESC, created_at ASC)
      INTO v_party_ids, v_party_seats
      FROM factions
     WHERE nation_id = p_nation_id
       AND faction_type = 'movement_party'
       AND abandoned_at IS NULL;

    v_n_parties := COALESCE(array_length(v_party_ids, 1), 0);

    -- No parties to seed against → committee row exists but empty.
    -- Real-world case: nation has no movement parties yet (e.g.,
    -- Absolute Monarchy or fresh-spawned shard before founding).
    IF v_n_parties = 0 THEN
        RETURN jsonb_build_object('success', true, 'committee_id', v_comm_id,
            'created', true, 'members_seeded', 0, 'reason', 'no_parties');
    END IF;

    v_gov_seats := v_party_seats[1];
    v_gov_quota := LEAST(3, GREATEST(0, v_gov_seats));

    -- Name pools — fall back to a neutral surname if a nation lacks
    -- them. seed_npc_name() inlined as the helper below.
    v_npool_len := COALESCE(array_length(v_nation.first_name_pool, 1), 0);
    v_lpool_len := COALESCE(array_length(v_nation.last_name_pool, 1), 0);

    v_other_idx := 2;  -- next non-gov party index

    -- Fill slots 1..5.
    FOR i IN 1..5 LOOP
        IF i <= v_gov_quota THEN
            v_slot_party := v_party_ids[1];
            v_slot_role  := CASE i
                                WHEN 1 THEN 'chair'
                                WHEN 2 THEN 'vice_chair'
                                ELSE 'member'
                            END;
        ELSIF v_n_parties >= 2 THEN
            -- Cycle through non-gov parties (indices 2..N).
            v_slot_party := v_party_ids[2 + ((v_other_idx - 2) % (v_n_parties - 1))];
            -- First non-gov seat (the slot immediately after gov quota) is the
            -- ranking minority — recognised opposition voice on the panel.
            IF i = v_gov_quota + 1 THEN
                v_slot_role := 'ranking_minority';
            ELSE
                v_slot_role := 'member';
            END IF;
            v_other_idx := v_other_idx + 1;
        ELSE
            -- Only the gov party exists; pad remaining slots with gov
            -- members. Edge case (single-party state).
            v_slot_party := v_party_ids[1];
            v_slot_role  := 'member';
        END IF;

        -- Pick NPC name from the nation's pools. Falls back to "Member N"
        -- if the nation has no pools (shouldn't happen in seeded data,
        -- but defensive).
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

COMMENT ON FUNCTION public.ensure_committee(uuid, text) IS
    'Idempotent committee seed. First call: creates committees row + 5 committee_members per the slot rules in 20270453 (chair from governing party, ranking minority from largest non-gov, members cycle). Subsequent calls: returns existing committee_id with created=false. NPC names pulled from nations.first_name_pool/last_name_pool. Per spec: one-time seed; government changes do not re-cast membership.';

NOTIFY pgrst, 'reload schema';

COMMIT;
