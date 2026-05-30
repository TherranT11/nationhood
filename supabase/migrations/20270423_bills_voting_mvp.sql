-- ════════════════════════════════════════════════════════════════════
-- Bills + voting MVP — politician-side legislative loop
--
-- Politicians in a nation can propose to switch one of their active
-- policy options. The bill enters a 3-tick voting window; player
-- politicians cast yes/no; NPC parties auto-vote aligned with their
-- archetype × the bill's archetype stance; on close, seat-weighted
-- majority determines pass/fail and popularity_pct moves per party.
--
-- ── Table naming note ───────────────────────────────────────────────
-- Stored as `assembly_bills` + `assembly_bill_votes` because the
-- pre-existing `bills` table from the diplomatic-inbox era (see
-- 20261212_drop_diplomatic_inbox_tables.sql) is still on the schema
-- and would collide with `CREATE TABLE IF NOT EXISTS bills`.
-- The user-facing RPC names (propose_bill / cast_vote_on_bill /
-- resolve_due_bills) keep "bill" as the domain word.
--
-- ── Popularity formula (diminishing returns) ────────────────────────
-- For each party in the nation at bill close:
--   alignment = bill_stance[party.archetype] in {-1, 0, +1}
--   party_position = +1 if seat-weighted yes > no among the party,
--                    -1 if no > yes, 0 if tied / no votes
--   if alignment ≠ 0 and party_position ≠ 0:
--     match = (alignment > 0) == (party_position > 0)
--     if match:    popularity += BASE × (1 − popularity/100)
--     else:        popularity -= BASE × (popularity/100)
--   for each absent player-politician member of the party:
--     popularity -= BASE × (popularity/100)
--
-- BASE = 4. Asymptotes toward 100% without inflating; misaligned and
-- absent members hurt high-popularity parties more (mirror curve).
-- NPC parties (no politician members) never have absent members and
-- always vote aligned, so they only gain — capped at their natural
-- asymptote by the diminishing-returns term.
--
-- ── Bill stance derivation ──────────────────────────────────────────
-- Auto-derived from policy_options.stat_effects via a stat→archetype
-- mapping table inside derive_bill_stance(). Each effect adds ±1 to
-- the relevant archetype's accumulator; final stance per archetype is
-- SIGN(accumulator) — clamped to {-1, 0, +1}. Multi-effect bills can't
-- trigger outsized swings.
--
-- ── Resolution ──────────────────────────────────────────────────────
-- Bills auto-close 3 ticks after proposal. resolve_due_bills() runs
-- fire-and-forget from js/politician-topbar.js on every politician-page
-- bootstrap (same pattern as resolve_due_general_elections). On pass:
-- the matching active_laws row is updated to selected_option_id =
-- bill.proposed_option_id (or inserted if the nation didn't have
-- that policy active before).
--
-- ── Cooldown ────────────────────────────────────────────────────────
-- factions.next_bill_propose_tick gates proposing to 1 per 5 ticks
-- per politician. REVOKE UPDATE so clients can't direct-clear it.
--
-- ── Deferred (flagged) ──────────────────────────────────────────────
-- * Whip enforcement — party leaders can't force members to vote a
--   given way yet; each politician votes independently.
-- * Bill-passage cleanup of the previous law row's effects (the
--   active_laws update flips the option but doesn't recompute any
--   active stat effects). The existing tick-processor handles
--   stat_effects independently.
-- * Special elections / by-elections triggered by failed bills.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Schema ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.assembly_bills (
    id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nation_id              uuid NOT NULL REFERENCES nations(id)         ON DELETE CASCADE,
    policy_id              uuid NOT NULL REFERENCES policies(id)        ON DELETE CASCADE,
    current_option_id      uuid          REFERENCES policy_options(id),
    proposed_option_id     uuid NOT NULL REFERENCES policy_options(id),
    proposer_politician_id uuid NOT NULL REFERENCES factions(id)        ON DELETE CASCADE,
    proposer_party_id      uuid          REFERENCES factions(id)        ON DELETE SET NULL,
    archetype_alignment    jsonb NOT NULL DEFAULT '{}'::jsonb,
    status                 text NOT NULL DEFAULT 'voting'
                                CHECK (status IN ('voting', 'passed', 'failed', 'expired')),
    proposed_at_tick       int  NOT NULL,
    close_at_tick          int  NOT NULL,
    yes_seats              int,
    no_seats               int,
    created_at             timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_assembly_bills_nation_status ON assembly_bills (nation_id, status);
CREATE INDEX IF NOT EXISTS idx_assembly_bills_status_close  ON assembly_bills (status, close_at_tick);

CREATE TABLE IF NOT EXISTS public.assembly_bill_votes (
    bill_id        uuid NOT NULL REFERENCES assembly_bills(id) ON DELETE CASCADE,
    politician_id  uuid NOT NULL REFERENCES factions(id)       ON DELETE CASCADE,
    party_id       uuid          REFERENCES factions(id)       ON DELETE SET NULL,
    position       text NOT NULL CHECK (position IN ('yes', 'no')),
    voted_at_tick  int  NOT NULL,
    PRIMARY KEY (bill_id, politician_id)
);
CREATE INDEX IF NOT EXISTS idx_assembly_bill_votes_politician ON assembly_bill_votes (politician_id);

ALTER TABLE assembly_bills      ENABLE ROW LEVEL SECURITY;
ALTER TABLE assembly_bill_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read assembly_bills" ON assembly_bills;
CREATE POLICY "Authenticated read assembly_bills" ON assembly_bills
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated read assembly_bill_votes" ON assembly_bill_votes;
CREATE POLICY "Authenticated read assembly_bill_votes" ON assembly_bill_votes
    FOR SELECT TO authenticated USING (true);

ALTER TABLE factions
    ADD COLUMN IF NOT EXISTS next_bill_propose_tick int;
COMMENT ON COLUMN factions.next_bill_propose_tick IS
    'Earliest tick at which this politician may propose another bill. Set to current_tick + 5 by propose_bill on success.';
REVOKE UPDATE (next_bill_propose_tick) ON factions FROM PUBLIC, anon, authenticated;

-- ── 2. derive_bill_stance — stat_effects → archetype alignment ──────
CREATE OR REPLACE FUNCTION public.derive_bill_stance(p_option_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_effects jsonb;
    v_acc     jsonb;
BEGIN
    SELECT stat_effects INTO v_effects FROM policy_options WHERE id = p_option_id;
    IF v_effects IS NULL OR jsonb_typeof(v_effects) <> 'array' THEN
        RETURN '{}'::jsonb;
    END IF;

    -- One CTE: walk stat_effects, JOIN to a stat→archetype mapping,
    -- aggregate per archetype, SIGN-clamp so a 5-effect bill doesn't
    -- swing 5x harder than a 1-effect bill on the same axis. Mapping
    -- covers the load-bearing ideological axes (private/public
    -- spending, civil freedoms, immigration); expand the VALUES when
    -- more policies want representation.
    WITH effects AS (
        SELECT e->>'stat_key' AS stat_key,
               CASE e->>'direction' WHEN 'up' THEN 1 WHEN 'down' THEN -1 ELSE 0 END AS sign
          FROM jsonb_array_elements(v_effects) e
    ),
    mapping(stat_key, archetype, multiplier) AS (VALUES
        ('income_tax',     'Social Democratic',           1),
        ('income_tax',     'Libertarian',                -1),
        ('welfare',        'Social Democratic',           1),
        ('welfare',        'Communist / Leftist',         1),
        ('welfare',        'Libertarian',                -1),
        ('health',         'Social Democratic',           1),
        ('health',         'Communist / Leftist',         1),
        ('health',         'Libertarian',                -1),
        ('education',      'Social Democratic',           1),
        ('education',      'Communist / Leftist',         1),
        ('education',      'Libertarian',                -1),
        -- inequality going DOWN is good for the left
        ('inequality',     'Communist / Leftist',        -1),
        ('inequality',     'Social Democratic',          -1),
        ('inequality',     'Libertarian',                 1),
        ('civil_freedoms', 'Liberal',                     1),
        ('civil_freedoms', 'Traditional Conservative',   -1),
        ('civil_freedoms', 'Green',                       1),
        ('immigration',    'Liberal',                     1),
        ('immigration',    'Nationalist',                -1),
        ('immigration',    'Populist',                   -1)
    ),
    contributions AS (
        SELECT m.archetype, SUM(e.sign * m.multiplier) AS raw
          FROM effects e
          JOIN mapping m USING (stat_key)
         WHERE e.sign <> 0
         GROUP BY m.archetype
    )
    SELECT COALESCE(jsonb_object_agg(archetype,
                CASE WHEN raw > 0 THEN 1 WHEN raw < 0 THEN -1 ELSE 0 END),
             '{}'::jsonb)
      INTO v_acc
      FROM contributions
     WHERE raw <> 0;

    RETURN COALESCE(v_acc, '{}'::jsonb);
END;
$$;
GRANT EXECUTE ON FUNCTION public.derive_bill_stance(uuid) TO authenticated;

-- ── 3. propose_bill ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.propose_bill(
    p_policy_id uuid,
    p_option_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_tick      int;
    v_option    policy_options%ROWTYPE;
    v_current   uuid;
    v_stance    jsonb;
    v_bill_id   uuid;
    v_next_pr   int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_nation');
    END IF;
    IF v_pol.politician_party_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_in_party');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    IF v_pol.next_bill_propose_tick IS NOT NULL
       AND v_pol.next_bill_propose_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_bill_propose_tick);
    END IF;

    SELECT * INTO v_option FROM policy_options WHERE id = p_option_id;
    IF v_option.id IS NULL OR v_option.policy_id <> p_policy_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_option');
    END IF;

    SELECT selected_option_id INTO v_current
      FROM active_laws
     WHERE nation_id = v_pol.nation_id
       AND policy_id = p_policy_id
       AND COALESCE(is_reversal, false) = false
     ORDER BY passed_tick DESC NULLS LAST LIMIT 1;
    IF v_current IS NOT NULL AND v_current = p_option_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_active');
    END IF;

    IF EXISTS (SELECT 1 FROM assembly_bills
                WHERE nation_id = v_pol.nation_id
                  AND policy_id = p_policy_id
                  AND status    = 'voting') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bill_in_flight');
    END IF;

    v_stance := derive_bill_stance(p_option_id);

    INSERT INTO assembly_bills (
        nation_id, policy_id, current_option_id, proposed_option_id,
        proposer_politician_id, proposer_party_id,
        archetype_alignment, proposed_at_tick, close_at_tick
    ) VALUES (
        v_pol.nation_id, p_policy_id, v_current, p_option_id,
        v_pol.id, v_pol.politician_party_id,
        v_stance, v_tick, v_tick + 3
    ) RETURNING id INTO v_bill_id;

    v_next_pr := v_tick + 5;
    UPDATE factions SET next_bill_propose_tick = v_next_pr WHERE id = v_pol.id;

    RETURN jsonb_build_object(
        'success', true,
        'bill_id', v_bill_id,
        'archetype_alignment', v_stance,
        'close_at_tick', v_tick + 3,
        'next_propose_tick', v_next_pr
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.propose_bill(uuid, uuid) TO authenticated;

-- ── 4. cast_vote_on_bill ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.cast_vote_on_bill(
    p_bill_id  uuid,
    p_position text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid  uuid := auth.uid();
    v_pol  factions%ROWTYPE;
    v_bill assembly_bills%ROWTYPE;
    v_tick int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_position NOT IN ('yes', 'no') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_position');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;

    SELECT * INTO v_bill FROM assembly_bills WHERE id = p_bill_id;
    IF v_bill.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bill_not_found');
    END IF;
    IF v_bill.status <> 'voting' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bill_closed');
    END IF;
    IF v_bill.nation_id <> v_pol.nation_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'wrong_nation');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    INSERT INTO assembly_bill_votes (bill_id, politician_id, party_id, position, voted_at_tick)
    VALUES (p_bill_id, v_pol.id, v_pol.politician_party_id, p_position, v_tick)
    ON CONFLICT (bill_id, politician_id) DO UPDATE
        SET position      = EXCLUDED.position,
            party_id      = EXCLUDED.party_id,
            voted_at_tick = EXCLUDED.voted_at_tick;

    RETURN jsonb_build_object('success', true, 'bill_id', p_bill_id, 'position', p_position);
END;
$$;
GRANT EXECUTE ON FUNCTION public.cast_vote_on_bill(uuid, text) TO authenticated;

-- ── 5. resolve_due_bills ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.resolve_due_bills()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_tick      int;
    v_bill      assembly_bills%ROWTYPE;
    v_party     RECORD;
    v_resolved  int := 0;
    v_yes       int;
    v_no        int;
    v_align     int;
    v_pos       int;
    v_pop       numeric;
    v_delta     numeric;
    v_absent    int;
    v_base      numeric := 4.0;
    v_outcome   text;
BEGIN
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', true, 'resolved', 0, 'reason', 'no_shard');
    END IF;

    FOR v_bill IN
        SELECT * FROM assembly_bills
         WHERE status = 'voting' AND close_at_tick <= v_tick
         FOR UPDATE SKIP LOCKED
    LOOP
        v_yes := 0;
        v_no  := 0;

        FOR v_party IN
            SELECT p.id, p.seats, p.archetype, p.popularity_pct,
                   (SELECT COUNT(*) FROM factions f
                     WHERE f.faction_type = 'politician'
                       AND f.politician_party_id = p.id
                       AND f.abandoned_at IS NULL) AS member_count,
                   (SELECT COUNT(*) FROM assembly_bill_votes bv
                      JOIN factions f ON f.id = bv.politician_id
                     WHERE bv.bill_id = v_bill.id
                       AND f.politician_party_id = p.id
                       AND bv.position = 'yes') AS member_yes,
                   (SELECT COUNT(*) FROM assembly_bill_votes bv
                      JOIN factions f ON f.id = bv.politician_id
                     WHERE bv.bill_id = v_bill.id
                       AND f.politician_party_id = p.id
                       AND bv.position = 'no') AS member_no
              FROM factions p
             WHERE p.faction_type  = 'movement_party'
               AND p.nation_id     = v_bill.nation_id
               AND p.abandoned_at IS NULL
        LOOP
            v_align := COALESCE((v_bill.archetype_alignment->>v_party.archetype)::int, 0);

            IF v_party.member_count = 0 THEN
                v_pos := v_align;  -- NPC party: auto-vote aligned (0 = abstain)
            ELSE
                v_pos := CASE WHEN v_party.member_yes > v_party.member_no THEN 1
                              WHEN v_party.member_no  > v_party.member_yes THEN -1
                              ELSE 0 END;
            END IF;

            IF v_pos > 0 THEN
                v_yes := v_yes + COALESCE(v_party.seats, 0);
            ELSIF v_pos < 0 THEN
                v_no := v_no + COALESCE(v_party.seats, 0);
            END IF;

            v_pop   := COALESCE(v_party.popularity_pct, 0);
            v_delta := 0;
            IF v_align <> 0 AND v_pos <> 0 THEN
                IF (v_align > 0) = (v_pos > 0) THEN
                    v_delta := v_delta + v_base * (1 - v_pop / 100.0);
                ELSE
                    v_delta := v_delta - v_base * (v_pop / 100.0);
                END IF;
            END IF;

            v_absent := GREATEST(0, v_party.member_count - v_party.member_yes - v_party.member_no);
            IF v_absent > 0 THEN
                v_delta := v_delta - v_absent * v_base * (v_pop / 100.0);
            END IF;

            IF v_delta <> 0 THEN
                UPDATE factions
                   SET popularity_pct = GREATEST(0, LEAST(100, v_pop + v_delta))
                 WHERE id = v_party.id;
            END IF;
        END LOOP;

        v_outcome := CASE
            WHEN v_yes = 0 AND v_no = 0 THEN 'expired'
            WHEN v_yes > v_no             THEN 'passed'
            ELSE                               'failed'
        END;

        UPDATE assembly_bills
           SET status     = v_outcome,
               yes_seats  = v_yes,
               no_seats   = v_no
         WHERE id = v_bill.id;

        IF v_outcome = 'passed' THEN
            IF EXISTS (
                SELECT 1 FROM active_laws
                 WHERE nation_id = v_bill.nation_id
                   AND policy_id = v_bill.policy_id
                   AND COALESCE(is_reversal, false) = false
            ) THEN
                UPDATE active_laws
                   SET selected_option_id = v_bill.proposed_option_id,
                       passed_tick        = v_tick
                 WHERE nation_id = v_bill.nation_id
                   AND policy_id = v_bill.policy_id
                   AND COALESCE(is_reversal, false) = false;
            ELSE
                INSERT INTO active_laws (nation_id, policy_id, selected_option_id, passed_tick, is_reversal)
                VALUES (v_bill.nation_id, v_bill.policy_id, v_bill.proposed_option_id, v_tick, false);
            END IF;
        END IF;

        v_resolved := v_resolved + 1;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'tick', v_tick, 'resolved', v_resolved);
END;
$$;
GRANT EXECUTE ON FUNCTION public.resolve_due_bills() TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
