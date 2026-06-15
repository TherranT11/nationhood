-- ════════════════════════════════════════════════════════════════════
-- 20270930 — MP Allies count in a leadership challenge
--
-- _party_ncv_weight gained the deferred "MPs: allies weight" hook: an MP's
-- vote in a Challenge Party Leadership now weighs 1 + their allies, so a
-- Senior MP's caucus actually swings the coup. The two callers (the
-- challenger's auto-vote in file_party_no_confidence, and member votes in
-- cast_party_no_confidence_vote) re-emitted to pass politician_allies; the
-- old 2-arg weight is dropped for one function.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

DROP FUNCTION IF EXISTS public._party_ncv_weight(text, numeric);

CREATE OR REPLACE FUNCTION public._party_ncv_weight(p_office text, p_volunteers numeric, p_allies int DEFAULT 0)
RETURNS numeric LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN p_office IN ('community_organizer','city_council_member','city_council_president',
                      'mayor','mayor_of_capital','regional_leader')
      THEN GREATEST(1, COALESCE(p_volunteers, 0))
    -- MPs vote with their personal bloc: 1 (themselves) + allies.
    WHEN p_office IN ('member_of_parliament','full_mp','senior_mp')
      THEN 1 + GREATEST(0, COALESCE(p_allies, 0))
    ELSE 1
  END;
$$;

-- file_party_no_confidence (re-emit 20270924) — auto-vote weight + allies.
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

    -- Challenger auto-votes for themselves (with their MP allies bloc).
    INSERT INTO party_no_confidence_votes (motion_id, voter_faction_id, choice, weight)
    VALUES (v_motion_id, v_me.id, 'challenger',
            _party_ncv_weight(v_me.politician_office, v_me.volunteers, v_me.politician_allies));

    RETURN jsonb_build_object('success', true, 'motion_id', v_motion_id,
                              'resolve_tick', v_tick + NCV_WINDOW_TICKS);
END $$;

-- cast_party_no_confidence_vote (re-emit 20270912) — member vote + allies.
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
            _party_ncv_weight(v_me.politician_office, v_me.volunteers, v_me.politician_allies))
    ON CONFLICT (motion_id, voter_faction_id)
    DO UPDATE SET choice = EXCLUDED.choice, weight = EXCLUDED.weight;

    RETURN jsonb_build_object('success', true, 'choice', p_choice);
END $$;

GRANT EXECUTE ON FUNCTION public.file_party_no_confidence(uuid)              TO authenticated;
GRANT EXECUTE ON FUNCTION public.cast_party_no_confidence_vote(uuid, text)   TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
