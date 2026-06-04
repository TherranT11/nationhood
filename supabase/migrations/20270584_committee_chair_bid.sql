-- ════════════════════════════════════════════════════════════════════
-- 20270584 — Committee Chair: Bid for Chair action
--
-- The next rung after committee membership. A seated member can spend
-- 15 Political Capital to roll 1d6 + Skill against the incumbent's
-- 1d6 + Skill (NPC incumbents roll against a flat baseline of 7).
-- Higher total wins; ties go to the incumbent. Win swaps the bidder
-- onto the chair seat and demotes the old chair into the bidder's
-- former slot (role stays with the slot — vice_chair stays vice_chair,
-- etc.). Loss costs Reputation and burns the cooldown.
--
-- Gates (in order):
--   1. caller must own a politician (p_faction_id passed explicitly,
--      matching propose_party_motion / draw_court_case pattern — a
--      heuristic "first politician" pick would mis-resolve on
--      multi-politician accounts; see 20270582 for the precedent).
--   2. politician is a member of the committee (any role except chair).
--   3. seated_at_tick >= 4 ticks ago (skin in the game).
--   4. Skill >= 8.
--   5. Political Capital >= 15.
--   6. next_chair_bid_tick not in the future.
--   7. chair seat occupied (player or NPC); vacant chair seats are
--      handled by the committee-seed / refill path, not by a bid.
--
-- Capital is debited and cooldown is stamped UNCONDITIONALLY on a
-- resolved bid (win or loss). Only the gates above can bail before
-- payment.
--
-- Career events written:
--   • bidder:   'bid_won_chair' | 'bid_lost_chair'
--   • displaced player (on win):  'lost_chair_to_bid'
--   • surviving player (on loss): 'defended_chair_from_bid'
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Cooldown column ─────────────────────────────────────────────
ALTER TABLE factions
    ADD COLUMN IF NOT EXISTS next_chair_bid_tick int;

COMMENT ON COLUMN factions.next_chair_bid_tick IS
    'Tick at which the politician can next call politician_bid_for_chair. Stamped to (current_tick + 8) on resolution (win OR loss). NULL = never bid.';

-- ── 2. politician_bid_for_chair RPC ────────────────────────────────
DROP FUNCTION IF EXISTS public.politician_bid_for_chair(uuid, uuid);

CREATE OR REPLACE FUNCTION public.politician_bid_for_chair(
    p_faction_id   uuid,
    p_committee_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    -- Tunables.
    SKILL_THRESHOLD       CONSTANT numeric := 8;
    CAPITAL_COST          CONSTANT numeric := 15;
    COOLDOWN_TICKS        CONSTANT int     := 8;
    MEMBERSHIP_TICKS      CONSTANT int     := 4;
    NPC_CHAIR_SKILL_BASE  CONSTANT numeric := 7;
    REPUTATION_REWARD     CONSTANT int     := 2;
    REPUTATION_PENALTY    CONSTANT int     := 1;

    v_uid                 uuid := auth.uid();
    v_bidder              factions%ROWTYPE;
    v_bidder_row          committee_members%ROWTYPE;
    v_chair_row           committee_members%ROWTYPE;
    v_chair_pol           factions%ROWTYPE;
    v_tick                int;
    v_bid_d6              int;
    v_def_d6              int;
    v_bid_roll            numeric;
    v_def_roll            numeric;
    v_def_skill           numeric;
    v_won                 boolean;
    v_kind                text;  -- 'player' | 'npc' | 'vacant' (rejected before resolve)
    v_incumbent_name      text;
    v_bidder_name         text;
    v_new_capital         numeric;
    v_new_reputation      int;
    v_old_chair_pol_id    uuid;
    v_old_chair_party_id  uuid;
    v_old_chair_first     text;
    v_old_chair_last      text;
BEGIN
    -- ── Auth + politician ownership ──
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL OR p_committee_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bad_args');
    END IF;

    SELECT * INTO v_bidder
      FROM factions
     WHERE id = p_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     FOR UPDATE;
    IF v_bidder.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;

    -- ── Tick (resolve once, reuse everywhere) ──
    SELECT current_tick INTO v_tick
      FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- ── Bidder must be a seated member of this committee. Lock the row. ──
    SELECT * INTO v_bidder_row
      FROM committee_members
     WHERE committee_id = p_committee_id
       AND politician_faction_id = v_bidder.id
     FOR UPDATE;
    IF v_bidder_row.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_member');
    END IF;
    IF v_bidder_row.role = 'chair' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_chair');
    END IF;
    IF (v_tick - COALESCE(v_bidder_row.seated_at_tick, v_tick)) < MEMBERSHIP_TICKS THEN
        RETURN jsonb_build_object('success', false, 'reason', 'membership_too_short',
            'need_ticks', MEMBERSHIP_TICKS,
            'have_ticks', v_tick - COALESCE(v_bidder_row.seated_at_tick, v_tick));
    END IF;

    -- ── Stat + cost + cooldown gates ──
    IF COALESCE(v_bidder.politician_skill, 0) < SKILL_THRESHOLD THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_skill',
            'required', SKILL_THRESHOLD,
            'have',     COALESCE(v_bidder.politician_skill, 0));
    END IF;
    IF COALESCE(v_bidder.political_capital, 0) < CAPITAL_COST THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_capital',
            'required', CAPITAL_COST,
            'have',     COALESCE(v_bidder.political_capital, 0));
    END IF;
    IF COALESCE(v_bidder.next_chair_bid_tick, 0) > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'next_tick', v_bidder.next_chair_bid_tick);
    END IF;

    -- ── Lock the chair row. Two players racing in the same tick
    --    serialise here; the second one re-reads the (now-updated)
    --    chair row and rolls against whoever just took the seat. ──
    SELECT * INTO v_chair_row
      FROM committee_members
     WHERE committee_id = p_committee_id
       AND role = 'chair'
     FOR UPDATE;
    IF v_chair_row.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_chair_seat');
    END IF;

    -- ── Identify the incumbent + their defence stat ──
    IF v_chair_row.politician_faction_id IS NOT NULL THEN
        -- Plain SELECT (no FOR UPDATE): we only read Skill + name. Locking
        -- the chair's faction row here would create a cross-bid deadlock
        -- when Player A bids on Player B's seat while Player B
        -- simultaneously bids on Player A's seat — each tx holds its own
        -- faction lock and waits on the other's. The bid-time stat is a
        -- snapshot regardless of concurrent grinds, so no UPDATE is needed.
        SELECT * INTO v_chair_pol
          FROM factions WHERE id = v_chair_row.politician_faction_id;
        v_def_skill := COALESCE(v_chair_pol.politician_skill, 0);
        v_kind := 'player';
        v_incumbent_name := NULLIF(btrim(COALESCE(v_chair_pol.leader_first_name, '') || ' ' ||
                                          COALESCE(v_chair_pol.leader_last_name,  '')), '');
    ELSIF v_chair_row.npc_first_name IS NOT NULL THEN
        v_def_skill := NPC_CHAIR_SKILL_BASE;
        v_kind := 'npc';
        v_incumbent_name := NULLIF(btrim(COALESCE(v_chair_row.npc_first_name, '') || ' ' ||
                                          COALESCE(v_chair_row.npc_last_name,  '')), '');
    ELSE
        -- Genuinely vacant chair seat — fall through to the seed/refill
        -- path. We don't auto-promote here (would steal the open-seat
        -- moment from any other applicant).
        RETURN jsonb_build_object('success', false, 'reason', 'no_chair_seat');
    END IF;

    -- ── Resolve the roll ──
    v_bid_d6   := 1 + floor(random() * 6)::int;
    v_def_d6   := 1 + floor(random() * 6)::int;
    v_bid_roll := v_bid_d6 + COALESCE(v_bidder.politician_skill, 0);
    v_def_roll := v_def_d6 + v_def_skill;
    v_won      := v_bid_roll > v_def_roll;  -- ties favour the incumbent

    -- ── Debit Capital + stamp cooldown unconditionally ──
    UPDATE factions
       SET political_capital   = GREATEST(0, COALESCE(political_capital, 0) - CAPITAL_COST),
           next_chair_bid_tick = v_tick + COOLDOWN_TICKS
     WHERE id = v_bidder.id
    RETURNING political_capital INTO v_new_capital;

    v_bidder_name := NULLIF(btrim(COALESCE(v_bidder.leader_first_name, '') || ' ' ||
                                   COALESCE(v_bidder.leader_last_name,  '')), '');

    IF v_won THEN
        -- +Reputation reward.
        UPDATE factions
           SET politician_reputation = GREATEST(0,
                   COALESCE(politician_reputation, 0) + REPUTATION_REWARD)
         WHERE id = v_bidder.id
        RETURNING politician_reputation INTO v_new_reputation;

        -- Snapshot displaced chair's identity BEFORE the swap.
        v_old_chair_pol_id   := v_chair_row.politician_faction_id;
        v_old_chair_party_id := v_chair_row.party_id;
        v_old_chair_first    := v_chair_row.npc_first_name;
        v_old_chair_last     := v_chair_row.npc_last_name;

        -- Promote bidder onto the chair row. Role stays 'chair'.
        UPDATE committee_members
           SET politician_faction_id = v_bidder.id,
               party_id              = v_bidder.politician_party_id,
               npc_first_name        = NULL,
               npc_last_name         = NULL,
               seated_at_tick        = v_tick
         WHERE id = v_chair_row.id;

        -- Demote old chair into bidder's old slot. Role stays whatever
        -- the bidder's old slot was (member / vice_chair / ranking_minority).
        UPDATE committee_members
           SET politician_faction_id = v_old_chair_pol_id,
               party_id              = v_old_chair_party_id,
               npc_first_name        = v_old_chair_first,
               npc_last_name         = v_old_chair_last,
               seated_at_tick        = v_tick
         WHERE id = v_bidder_row.id;

        -- Career events.
        INSERT INTO politician_career_events
               (faction_id,   event_tick, event_type,       target_name,      metadata)
        VALUES (v_bidder.id,  v_tick,    'bid_won_chair',  v_incumbent_name,
                jsonb_build_object(
                    'committee_id',    p_committee_id,
                    'bid_roll',        v_bid_roll,
                    'defender_roll',   v_def_roll,
                    'incumbent_kind',  v_kind));

        IF v_kind = 'player' AND v_old_chair_pol_id IS NOT NULL THEN
            INSERT INTO politician_career_events
                   (faction_id,         event_tick, event_type,           target_name,     metadata)
            VALUES (v_old_chair_pol_id, v_tick,     'lost_chair_to_bid',  v_bidder_name,
                    jsonb_build_object(
                        'committee_id',  p_committee_id,
                        'bid_roll',      v_bid_roll,
                        'defender_roll', v_def_roll));
        END IF;
    ELSE
        -- -Reputation penalty.
        UPDATE factions
           SET politician_reputation = GREATEST(0,
                   COALESCE(politician_reputation, 0) - REPUTATION_PENALTY)
         WHERE id = v_bidder.id
        RETURNING politician_reputation INTO v_new_reputation;

        INSERT INTO politician_career_events
               (faction_id,   event_tick, event_type,        target_name,      metadata)
        VALUES (v_bidder.id,  v_tick,    'bid_lost_chair',  v_incumbent_name,
                jsonb_build_object(
                    'committee_id',   p_committee_id,
                    'bid_roll',       v_bid_roll,
                    'defender_roll',  v_def_roll,
                    'incumbent_kind', v_kind));

        IF v_kind = 'player' AND v_chair_row.politician_faction_id IS NOT NULL THEN
            INSERT INTO politician_career_events
                   (faction_id,                          event_tick, event_type,                  target_name,    metadata)
            VALUES (v_chair_row.politician_faction_id,   v_tick,    'defended_chair_from_bid',   v_bidder_name,
                    jsonb_build_object(
                        'committee_id',  p_committee_id,
                        'bid_roll',      v_bid_roll,
                        'defender_roll', v_def_roll));
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'success',             true,
        'won',                 v_won,
        'bid_roll',            v_bid_roll,
        'defender_roll',       v_def_roll,
        'incumbent_kind',      v_kind,
        'incumbent_name',      v_incumbent_name,
        'new_chair',           CASE WHEN v_won THEN v_bidder_name ELSE v_incumbent_name END,
        'new_capital',         v_new_capital,
        'new_reputation',      v_new_reputation,
        'cooldown_until_tick', v_tick + COOLDOWN_TICKS
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.politician_bid_for_chair(uuid, uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
