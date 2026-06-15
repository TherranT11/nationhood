-- ════════════════════════════════════════════════════════════════════
-- 20270928 — Minister → Prime Minister via a won leadership challenge
--
-- head_of_government tracks the governing PARTY (faction_id) + the PM's
-- NAME (copied from that party's leader). A won Challenge Party Leadership
-- already overwrites the party's leader_* with the challenger — so the
-- premiership handoff is just refreshing head_of_government's name, but
-- ONLY when that party is the active governing party (else 0 rows).
--
-- Consequences (one helper called after the motion resolves):
--   • WIN + you become PM → you step out of your ministry; an NPC of your
--     nation's name pool backfills it.
--   • LOSE while holding a cabinet seat → the PM purges you: the ministry
--     is NPC-backfilled and you're barred from cabinet for 24 ticks
--     (politician_cabinet_ban_until_tick).
--
-- NOTE: the ban is RECORDED here but not yet ENFORCED — the cabinet
-- appointment RPCs (politician_seek_fm_post, the Deputy/Junior paths) need
-- a `politician_cabinet_ban_until_tick > current_tick` reject. That one
-- check per appointment is the follow-up.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.factions
    ADD COLUMN IF NOT EXISTS politician_cabinet_ban_until_tick int;

-- Vacate p_faction's cabinet seat (Foreign Minister post or a major
-- ministry, matched by name) and backfill the ministries row with an NPC
-- drawn from the nation's name pool. Returns whether they held a seat.
CREATE OR REPLACE FUNCTION public._vacate_minister_to_npc(p_faction_id uuid)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
    v_pol   factions%ROWTYPE;
    v_key   text;
    v_npc_f text;
    v_npc_l text;
    v_held  boolean := false;
BEGIN
    SELECT * INTO v_pol FROM factions WHERE id = p_faction_id;
    IF v_pol.id IS NULL THEN RETURN false; END IF;

    IF v_pol.politician_foreign_minister_at_tick IS NOT NULL THEN
        v_key  := 'foreign_affairs';
        v_held := true;
        UPDATE factions SET politician_foreign_minister_at_tick = NULL WHERE id = p_faction_id;
    ELSE
        SELECT m.ministry_key INTO v_key FROM ministries m
         WHERE m.nation_id = v_pol.nation_id AND m.is_active = true
           AND lower(trim(m.minister_first_name)) = lower(trim(COALESCE(v_pol.leader_first_name, '')))
           AND lower(trim(m.minister_last_name))  = lower(trim(COALESCE(v_pol.leader_last_name, '')))
         LIMIT 1;
        v_held := v_key IS NOT NULL;
    END IF;

    IF v_held AND v_key IS NOT NULL THEN
        SELECT first_name_pool[1 + floor(random() * GREATEST(1, array_length(first_name_pool, 1)))::int],
               last_name_pool [1 + floor(random() * GREATEST(1, array_length(last_name_pool , 1)))::int]
          INTO v_npc_f, v_npc_l
          FROM nations WHERE id = v_pol.nation_id;
        UPDATE ministries
           SET minister_first_name = COALESCE(v_npc_f, 'Acting'),
               minister_last_name  = COALESCE(v_npc_l, 'Minister'),
               minister_age        = 35 + floor(random() * 31)::int
         WHERE nation_id = v_pol.nation_id AND ministry_key = v_key;
    END IF;

    RETURN v_held;
END $$;
REVOKE EXECUTE ON FUNCTION public._vacate_minister_to_npc(uuid) FROM PUBLIC;

-- Apply the leadership-challenge outcome (called once after resolution).
CREATE OR REPLACE FUNCTION public._party_ncv_apply_outcome(p_motion_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    NCV_CABINET_BAN constant int := 24;   -- ticks barred from cabinet on a loss
    v_m         party_no_confidence_motions%ROWTYPE;
    v_chal      factions%ROWTYPE;
    v_became_pm int := 0;
    v_held      boolean;
    v_tick      int;
BEGIN
    SELECT * INTO v_m FROM party_no_confidence_motions WHERE id = p_motion_id;
    IF v_m.id IS NULL THEN RETURN; END IF;
    SELECT * INTO v_chal FROM factions WHERE id = v_m.challenger_faction_id;
    IF v_chal.id IS NULL THEN RETURN; END IF;
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    IF v_m.status = 'passed' THEN
        -- Premiership handoff: only fires if this party leads the
        -- government (the active head_of_government row IS this party).
        UPDATE head_of_government
           SET first_name = v_chal.leader_first_name,
               last_name  = v_chal.leader_last_name,
               age        = v_chal.leader_age
         WHERE nation_id = v_m.nation_id
           AND faction_id = v_m.party_faction_id
           AND active = true;
        GET DIAGNOSTICS v_became_pm = ROW_COUNT;
        -- A PM steps out of their ministry; an NPC backfills it.
        IF v_became_pm > 0 THEN
            PERFORM _vacate_minister_to_npc(v_chal.id);
        END IF;
    ELSE
        -- Failed coup: if they held a cabinet seat, they're purged and
        -- barred from cabinet for a spell.
        v_held := _vacate_minister_to_npc(v_chal.id);
        IF v_held THEN
            UPDATE factions SET politician_cabinet_ban_until_tick = v_tick + NCV_CABINET_BAN
             WHERE id = v_chal.id;
        END IF;
    END IF;
END $$;
REVOKE EXECUTE ON FUNCTION public._party_ncv_apply_outcome(uuid) FROM PUBLIC;

-- resolve_party_no_confidence re-emitted (20270924) — only change: the
-- PERFORM _party_ncv_apply_outcome line after the win/loss block.
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
    -- politician_influence is the post-20270646 home of the old political_capital.
    v_chal_composite := COALESCE(v_chal.politician_influence,0) + COALESCE(v_chal.politician_reputation,0)
                      + COALESCE(v_chal.politician_skill,0);
    SELECT MAX(COALESCE(politician_influence,0) + COALESCE(politician_reputation,0) + COALESCE(politician_skill,0))
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

    -- Premiership handoff / cabinet purge (20270928).
    PERFORM _party_ncv_apply_outcome(p_motion_id);

    RETURN jsonb_build_object('success', true,
        'status', CASE WHEN v_passed THEN 'passed' ELSE 'failed' END,
        'leader_support', v_total_leader, 'challenger_support', v_total_chal);
END $$;

GRANT EXECUTE ON FUNCTION public.resolve_party_no_confidence(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
