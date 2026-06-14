-- ════════════════════════════════════════════════════════════════════
-- PARTY VOTE OF NO CONFIDENCE — internal leadership challenge (v2)
-- ════════════════════════════════════════════════════════════════════
-- A rank-and-file party member files a Vote of No Confidence against the
-- (NPC) party leader, putting themselves forward as the challenger. The
-- motion stays OPEN for 3 ticks; the leader is kept or the challenger is
-- installed when it resolves.
--
-- This is the "v2" the v1 party-motion system (party_motions /
-- propose_party_motion, 20270403) anticipated for multi-player parties:
-- propose → open window → tally. It mirrors that file's member check and
-- authenticated-read logging, but needs its own motion + per-voter vote
-- tables for the 3-tick window.
--
-- ── Who votes ───────────────────────────────────────────────────────
--   • Human party members (linked_user_id set) cast a real leader/
--     challenger vote, weighted by their standing:
--        local office holders → their `volunteers`
--        MPs                  → 1   (the "allies" weight is DEFERRED;
--                                     see _party_ncv_weight hook)
--        everyone else        → 1
--   • NPC members are a computed bloc: their leader-vs-challenger split
--     comes from an INCUMBENCY baseline (party popularity_pct) shifted by
--     the CHALLENGER'S STANDING among members, plus a little variance.
--     The bloc's size = the party's NPC member count on file, so the NPC
--     mass scales with the roster and human weighted votes add on top.
--
-- ── Resolution ──────────────────────────────────────────────────────
-- Lazy + idempotent (mirrors corp_no_confidence, 20270163 — NOT wired
-- into advance-tick). The party page calls resolve_party_no_confidence()
-- when it sees an open motion at/after resolve_tick. Strict majority to
-- oust (ties keep the incumbent). On a pass the challenger's name is
-- written into the party's leader_* fields.
--
-- Balance constants are commented inline so the feel is a one-line tune.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── Schema ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.party_no_confidence_motions (
    id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    party_faction_id      uuid NOT NULL REFERENCES public.factions(id) ON DELETE CASCADE,
    nation_id             uuid,
    challenger_faction_id uuid NOT NULL REFERENCES public.factions(id) ON DELETE CASCADE,
    challenger_name       text NOT NULL,           -- snapshot at file time
    leader_first_name     text,                    -- incumbent snapshot
    leader_last_name      text,
    opened_at_tick        int  NOT NULL,
    resolve_tick          int  NOT NULL,           -- opened_at_tick + window
    status                text NOT NULL DEFAULT 'open'
                          CHECK (status IN ('open','passed','failed')),
    leader_support        numeric,                 -- cached final tally
    challenger_support    numeric,
    resolved_at_tick      int,
    created_at            timestamptz NOT NULL DEFAULT now()
);

-- One OPEN motion per party at a time.
CREATE UNIQUE INDEX IF NOT EXISTS party_ncv_one_open_per_party
    ON public.party_no_confidence_motions (party_faction_id)
    WHERE status = 'open';

CREATE TABLE IF NOT EXISTS public.party_no_confidence_votes (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    motion_id        uuid NOT NULL REFERENCES public.party_no_confidence_motions(id) ON DELETE CASCADE,
    voter_faction_id uuid NOT NULL REFERENCES public.factions(id) ON DELETE CASCADE,
    choice           text NOT NULL CHECK (choice IN ('leader','challenger')),
    weight           numeric NOT NULL DEFAULT 1,
    created_at       timestamptz NOT NULL DEFAULT now(),
    UNIQUE (motion_id, voter_faction_id)           -- one vote per member, re-castable
);

-- Authenticated-read (party-public, like party_motions); writes only via
-- the SECURITY DEFINER RPCs below.
ALTER TABLE public.party_no_confidence_motions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_no_confidence_votes    ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated read ncv motions" ON public.party_no_confidence_motions;
CREATE POLICY "Authenticated read ncv motions" ON public.party_no_confidence_motions
    FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated read ncv votes" ON public.party_no_confidence_votes;
CREATE POLICY "Authenticated read ncv votes" ON public.party_no_confidence_votes
    FOR SELECT TO authenticated USING (true);

-- ── Vote-weight helper (one source of truth) ────────────────────────
-- local office → volunteers; MP/other → 1. The MP "allies" weight is a
-- deferred design decision: change the ELSE branch when it's settled.
CREATE OR REPLACE FUNCTION public._party_ncv_weight(p_office text, p_volunteers numeric)
RETURNS numeric LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN p_office IN ('community_organizer','city_council_member','city_council_president',
                      'mayor','mayor_of_capital','regional_leader')
      THEN GREATEST(1, COALESCE(p_volunteers, 0))
    ELSE 1   -- MPs: 'allies' weight DEFERRED (hook); everyone else: 1
  END;
$$;

-- ── RPC: file a Vote of No Confidence ───────────────────────────────
CREATE OR REPLACE FUNCTION public.file_party_no_confidence(p_party_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    NCV_WINDOW_TICKS   constant int := 3;    -- open duration
    NCV_COOLDOWN_TICKS constant int := 12;   -- after a resolved motion
    NCV_FILE_COST      constant int := 10;   -- political_capital to file
    v_uid       uuid := auth.uid();
    v_party     factions%ROWTYPE;
    v_me        factions%ROWTYPE;
    v_tick      int;
    v_motion_id uuid;
BEGIN
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;

    SELECT * INTO v_party FROM factions
     WHERE id = p_party_id AND faction_type = 'movement_party';
    IF v_party.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'party_not_found');
    END IF;
    IF v_party.leader_first_name IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_leader');
    END IF;

    -- Caller must be a (human) member of this party.
    SELECT * INTO v_me FROM factions
     WHERE faction_type = 'politician'
       AND politician_party_id = p_party_id
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     LIMIT 1;
    IF v_me.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_member');
    END IF;

    -- One open motion at a time.
    IF EXISTS (SELECT 1 FROM party_no_confidence_motions
                WHERE party_faction_id = p_party_id AND status = 'open') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_open');
    END IF;

    -- Cooldown after the most recent resolution.
    IF EXISTS (SELECT 1 FROM party_no_confidence_motions
                WHERE party_faction_id = p_party_id
                  AND resolved_at_tick IS NOT NULL
                  AND resolved_at_tick > v_tick - NCV_COOLDOWN_TICKS) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'on_cooldown');
    END IF;

    -- Filing cost.
    IF COALESCE(v_me.political_capital, 0) < NCV_FILE_COST THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_capital',
                                  'needed', NCV_FILE_COST);
    END IF;
    UPDATE factions SET political_capital = political_capital - NCV_FILE_COST
     WHERE id = v_me.id;

    INSERT INTO party_no_confidence_motions (
        party_faction_id, nation_id, challenger_faction_id, challenger_name,
        leader_first_name, leader_last_name, opened_at_tick, resolve_tick)
    VALUES (
        p_party_id, v_party.nation_id, v_me.id,
        TRIM(COALESCE(v_me.leader_first_name,'') || ' ' || COALESCE(v_me.leader_last_name,'')),
        v_party.leader_first_name, v_party.leader_last_name,
        v_tick, v_tick + NCV_WINDOW_TICKS)
    RETURNING id INTO v_motion_id;

    -- Challenger auto-votes for themselves.
    INSERT INTO party_no_confidence_votes (motion_id, voter_faction_id, choice, weight)
    VALUES (v_motion_id, v_me.id, 'challenger',
            _party_ncv_weight(v_me.politician_office, v_me.volunteers));

    RETURN jsonb_build_object('success', true, 'motion_id', v_motion_id,
                              'resolve_tick', v_tick + NCV_WINDOW_TICKS);
END $$;

-- ── RPC: cast a vote on an open motion ──────────────────────────────
CREATE OR REPLACE FUNCTION public.cast_party_no_confidence_vote(p_motion_id uuid, p_choice text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_uid    uuid := auth.uid();
    v_motion party_no_confidence_motions%ROWTYPE;
    v_me     factions%ROWTYPE;
    v_tick   int;
BEGIN
    IF p_choice NOT IN ('leader','challenger') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bad_choice');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;

    SELECT * INTO v_motion FROM party_no_confidence_motions WHERE id = p_motion_id;
    IF v_motion.id IS NULL OR v_motion.status <> 'open' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_open');
    END IF;
    IF v_tick > v_motion.resolve_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'window_closed');
    END IF;

    SELECT * INTO v_me FROM factions
     WHERE faction_type = 'politician'
       AND politician_party_id = v_motion.party_faction_id
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     LIMIT 1;
    IF v_me.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_member');
    END IF;

    INSERT INTO party_no_confidence_votes (motion_id, voter_faction_id, choice, weight)
    VALUES (p_motion_id, v_me.id, p_choice,
            _party_ncv_weight(v_me.politician_office, v_me.volunteers))
    ON CONFLICT (motion_id, voter_faction_id)
    DO UPDATE SET choice = EXCLUDED.choice, weight = EXCLUDED.weight;

    RETURN jsonb_build_object('success', true, 'choice', p_choice);
END $$;

-- ── RPC: resolve a motion (lazy, idempotent) ────────────────────────
CREATE OR REPLACE FUNCTION public.resolve_party_no_confidence(p_motion_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    -- Balance knobs (tunable):
    NCV_LEADER_BASE_MIN     constant numeric := 0.35;  -- leader NPC share at 0% popularity
    NCV_LEADER_BASE_MAX     constant numeric := 0.75;  -- leader NPC share at 100% popularity
    NCV_CHALLENGER_BONUS_MAX constant numeric := 0.25; -- max shift toward a top-standing challenger
    NCV_VARIANCE            constant numeric := 0.10;   -- ± random swing on the NPC leader share
    -- Per-NPC-member voting weight. Puts the NPC bloc on a comparable
    -- scale to volunteer-weighted human votes so the mass scales with the
    -- roster and a single high-volunteer player can sway but not single-
    -- handedly override a big contented party. THE key balance knob.
    NCV_NPC_MEMBER_WEIGHT   constant numeric := 10;
    NCV_WIN_REP             constant int := 5;          -- challenger reputation on a win
    NCV_LOSS_REP            constant int := 3;          -- challenger reputation penalty on a loss
    v_motion party_no_confidence_motions%ROWTYPE;
    v_party  factions%ROWTYPE;
    v_chal   factions%ROWTYPE;
    v_tick   int;
    v_npc_n  int;
    v_chal_composite numeric;
    v_max_composite  numeric;
    v_standing       numeric;
    v_leader_share   numeric;
    v_npc_leader     numeric;
    v_npc_chal       numeric;
    v_human_leader   numeric;
    v_human_chal     numeric;
    v_total_leader   numeric;
    v_total_chal     numeric;
    v_passed boolean;
BEGIN
    -- Lock the motion so concurrent lazy-resolve calls don't double-apply.
    SELECT * INTO v_motion FROM party_no_confidence_motions WHERE id = p_motion_id FOR UPDATE;
    IF v_motion.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_found');
    END IF;
    IF v_motion.status <> 'open' THEN
        -- Idempotent: already resolved.
        RETURN jsonb_build_object('success', true, 'status', v_motion.status,
                                  'leader_support', v_motion.leader_support,
                                  'challenger_support', v_motion.challenger_support);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick < v_motion.resolve_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_ready',
                                  'resolve_tick', v_motion.resolve_tick);
    END IF;

    SELECT * INTO v_party FROM factions WHERE id = v_motion.party_faction_id;
    SELECT * INTO v_chal  FROM factions WHERE id = v_motion.challenger_faction_id;

    -- NPC bloc size = NPC member factions on file.
    SELECT count(*) INTO v_npc_n FROM factions
     WHERE faction_type = 'politician'
       AND politician_party_id = v_motion.party_faction_id
       AND abandoned_at IS NULL
       AND linked_user_id IS NULL;

    -- Incumbency baseline from party popularity (0..100 → MIN..MAX share).
    v_leader_share := NCV_LEADER_BASE_MIN
        + (LEAST(100, GREATEST(0, COALESCE(v_party.popularity_pct, 0))) / 100.0)
          * (NCV_LEADER_BASE_MAX - NCV_LEADER_BASE_MIN);

    -- Challenger standing among members (composite vs the party's strongest).
    v_chal_composite := COALESCE(v_chal.political_capital,0) + COALESCE(v_chal.politician_reputation,0)
                      + COALESCE(v_chal.politician_skill,0);
    SELECT MAX(COALESCE(political_capital,0) + COALESCE(politician_reputation,0) + COALESCE(politician_skill,0))
      INTO v_max_composite FROM factions
     WHERE faction_type = 'politician' AND politician_party_id = v_motion.party_faction_id
       AND abandoned_at IS NULL;
    v_standing := CASE WHEN COALESCE(v_max_composite,0) > 0
                       THEN LEAST(1, v_chal_composite / v_max_composite) ELSE 0.5 END;
    v_leader_share := v_leader_share - v_standing * NCV_CHALLENGER_BONUS_MAX;

    -- Variance, then clamp.
    v_leader_share := v_leader_share + (random() * 2 - 1) * NCV_VARIANCE;
    v_leader_share := LEAST(0.95, GREATEST(0.05, v_leader_share));

    v_npc_leader := ROUND(v_npc_n * NCV_NPC_MEMBER_WEIGHT * v_leader_share);
    v_npc_chal   := v_npc_n * NCV_NPC_MEMBER_WEIGHT - v_npc_leader;

    -- Human weighted votes.
    SELECT COALESCE(SUM(weight) FILTER (WHERE choice = 'leader'), 0),
           COALESCE(SUM(weight) FILTER (WHERE choice = 'challenger'), 0)
      INTO v_human_leader, v_human_chal
      FROM party_no_confidence_votes WHERE motion_id = p_motion_id;

    v_total_leader := v_npc_leader + v_human_leader;
    v_total_chal   := v_npc_chal   + v_human_chal;

    -- Strict majority to oust; a tie keeps the incumbent.
    v_passed := v_total_chal > v_total_leader;

    UPDATE party_no_confidence_motions
       SET status = CASE WHEN v_passed THEN 'passed' ELSE 'failed' END,
           leader_support = v_total_leader,
           challenger_support = v_total_chal,
           resolved_at_tick = v_tick
     WHERE id = p_motion_id;

    IF v_passed THEN
        -- Install the challenger as the party's (new) leader.
        UPDATE factions
           SET leader_first_name = v_chal.leader_first_name,
               leader_last_name  = v_chal.leader_last_name,
               leader_age        = v_chal.leader_age
         WHERE id = v_motion.party_faction_id;
        UPDATE factions
           SET politician_reputation = GREATEST(0, COALESCE(politician_reputation,0) + NCV_WIN_REP)
         WHERE id = v_motion.challenger_faction_id;
    ELSE
        -- Failed challenge costs the challenger reputation.
        UPDATE factions
           SET politician_reputation = GREATEST(0, COALESCE(politician_reputation,0) - NCV_LOSS_REP)
         WHERE id = v_motion.challenger_faction_id;
    END IF;

    RETURN jsonb_build_object('success', true,
        'status', CASE WHEN v_passed THEN 'passed' ELSE 'failed' END,
        'leader_support', v_total_leader, 'challenger_support', v_total_chal);
END $$;

REVOKE ALL ON FUNCTION public.file_party_no_confidence(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cast_party_no_confidence_vote(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.resolve_party_no_confidence(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.file_party_no_confidence(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cast_party_no_confidence_vote(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_party_no_confidence(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
