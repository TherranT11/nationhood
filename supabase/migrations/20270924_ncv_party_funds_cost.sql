-- ════════════════════════════════════════════════════════════════════
-- 20270924 — Challenge Party Leadership: $50K Party Funds cost + dead-
--            column fix
--
-- file_party_no_confidence (20270912) referenced factions.political_
-- capital, but that column was renamed to politician_influence in 20270646
-- — so filing threw `record "v_me" has no field "political_capital"`.
--
-- Per the new spec, filing now costs the PARTY $50K from its treasury
-- (party_funds) instead of a personal stat, so the broken reference is
-- replaced outright. The resolution's challenger-standing composite hit
-- the same dead column; it's repointed to politician_influence (where the
-- old political_capital data now lives). Both functions re-emitted from
-- 20270912, changes confined to those lines.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.file_party_no_confidence(p_party_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    NCV_WINDOW_TICKS   constant int := 3;       -- open duration
    NCV_COOLDOWN_TICKS constant int := 12;      -- after a resolved motion
    NCV_FILE_COST      constant int := 50000;   -- $ of Party Funds to file
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

    -- Filing cost — $50K from the party treasury.
    IF COALESCE(v_party.party_funds, 0) < NCV_FILE_COST THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
                                  'needed', NCV_FILE_COST);
    END IF;

    -- Insert the motion first (catching the rare race that slips past the
    -- EXISTS check) so a loser charges no cost; the partial unique index
    -- party_ncv_one_open_per_party is the real one-open-at-a-time guard.
    BEGIN
        INSERT INTO party_no_confidence_motions (
            party_faction_id, nation_id, challenger_faction_id, challenger_name,
            leader_first_name, leader_last_name, opened_at_tick, resolve_tick)
        VALUES (
            p_party_id, v_party.nation_id, v_me.id,
            TRIM(COALESCE(v_me.leader_first_name,'') || ' ' || COALESCE(v_me.leader_last_name,'')),
            v_party.leader_first_name, v_party.leader_last_name,
            v_tick, v_tick + NCV_WINDOW_TICKS)
        RETURNING id INTO v_motion_id;
    EXCEPTION WHEN unique_violation THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_open');
    END;

    -- Charge the filing cost now that the motion is secured.
    UPDATE factions SET party_funds = party_funds - NCV_FILE_COST
     WHERE id = v_party.id;

    -- Challenger auto-votes for themselves.
    INSERT INTO party_no_confidence_votes (motion_id, voter_faction_id, choice, weight)
    VALUES (v_motion_id, v_me.id, 'challenger',
            _party_ncv_weight(v_me.politician_office, v_me.volunteers));

    RETURN jsonb_build_object('success', true, 'motion_id', v_motion_id,
                              'resolve_tick', v_tick + NCV_WINDOW_TICKS);
END $$;

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

    RETURN jsonb_build_object('success', true,
        'status', CASE WHEN v_passed THEN 'passed' ELSE 'failed' END,
        'leader_support', v_total_leader, 'challenger_support', v_total_chal);
END $$;

GRANT EXECUTE ON FUNCTION public.file_party_no_confidence(uuid)            TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_party_no_confidence(uuid)         TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
