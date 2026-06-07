-- ════════════════════════════════════════════════════════════════════
-- 20270665 — Multi-politician faction_id sweep, round 2
--
-- 20270661 closed the original "ORDER BY created_at ASC LIMIT 1"
-- bug class for the ten user-visible standalone politician_* action
-- RPCs. This sweep picks up the nine stragglers it missed:
--
--   TIER A — no disambiguation, breaks any multi-politician account
--   the moment the oldest faction isn't a sitting MP:
--     • _mp_action_check()              (helper, gates Tier-A actions)
--     • politician_mp_floor_speech()
--     • politician_mp_hold_rally()
--     • politician_mp_fundraising_dinner()
--
--   TIER B — party-filtered, breaks if ≥2 politicians in same party:
--     • politician_get_election_offer(p_party_id)
--     • politician_campaign_rally(p_party_id)
--     • politician_request_endorsement(p_party_id)
--
--   TIER C — committee testimony actions, different code path so the
--   20270661 sweep did not touch them:
--     • accept_hearing_testimony(p_testimony_id)
--     • submit_hearing_testimony(p_hearing_id, p_persona_id, p_text)
--
-- Pattern per function (identical to 20270661):
--   1. DROP the old signature so any stale caller fails loud rather
--      than silently grading the wrong row.
--   2. Add p_faction_id uuid as the LAST argument (20270661
--      convention — domain args first, faction_id last).
--   3. Replace the SELECT block with the id-based lookup plus
--      ownership guard:
--        SELECT * INTO v_pol FROM factions
--         WHERE id = p_faction_id
--           AND faction_type = 'politician'      -- omitted on #9
--           AND abandoned_at IS NULL
--           AND (id = v_uid OR linked_user_id = v_uid)
--         FOR UPDATE;                            -- preserve original
--   4. Body otherwise byte-faithful to each RPC's latest source.
--
-- For the helper + the three MP actions, p_faction_id is the SOLE
-- argument (those RPCs had no domain args before this sweep). The
-- MP-action RPCs now thread p_faction_id into _mp_action_check(...)
-- so the chain is closed end-to-end.
--
-- Client coverage:
--   • politician-home.html's handleMpAction already passes
--     { p_faction_id: politician.id } on every MP action (line
--     2436), so the three MP RPCs light up without any client
--     change.
--   • bindCampaignActions, politician-career.html's offer load,
--     and committee.html's testimony submit/accept handlers do NOT
--     pass p_faction_id today — those client surfaces get a
--     companion edit in the same commit so the new signatures are
--     reachable.
--
-- KNOWN-ISSUE FLAG — helper-key drift (NOT fixed in this sweep):
--   politician_mp_floor_speech reads (v_ctx->>'credibility') but
--   _mp_action_check has long since stopped returning that key
--   (20270583 stat consolidation, 20270646 column rename). The
--   read returns NULL → v_total IS NULL → the >= 5 check evaluates
--   NULL → fail branch fires every time → speeches always cost the
--   party 1 popularity. politician_mp_hold_rally reads
--   (v_ctx->>'charisma'), which IS present in the helper but is
--   now mapped to politician_capital (the money stat) by 20270646
--   — rallies are silently rolling against your bank balance.
--   Both are real bugs but live outside the scope of this
--   multi-politician sweep; the function bodies are re-emitted
--   verbatim here. Fix lives in a follow-up.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ════════════════════════════════════════════════════════════════════
-- 1. _mp_action_check(p_faction_id)
-- ════════════════════════════════════════════════════════════════════
-- Body byte-faithful to 20270646's latest re-emit — same helper-key
-- shape (skill / charisma / reputation / politician_influence). Only
-- the politician SELECT changes.
DROP FUNCTION IF EXISTS public._mp_action_check();

CREATE OR REPLACE FUNCTION public._mp_action_check(p_faction_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid   uuid := auth.uid();
    v_pol   factions%ROWTYPE;
    v_party factions%ROWTYPE;
    v_tick  int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.politician_office NOT IN ('member_of_parliament', 'senior_mp') THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'wrong_office',
            'have', v_pol.politician_office);
    END IF;
    IF v_pol.politician_party_id IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'not_in_party');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    IF v_pol.next_mp_action_tick IS NOT NULL AND v_pol.next_mp_action_tick > v_tick THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_mp_action_tick, 'current_tick', v_tick);
    END IF;

    SELECT * INTO v_party FROM factions WHERE id = v_pol.politician_party_id FOR UPDATE;
    IF v_party.id IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'party_not_found');
    END IF;

    RETURN jsonb_build_object(
        'ok',                true,
        'politician_id',     v_pol.id,
        'skill',       COALESCE(v_pol.politician_skill, 0),
        'charisma',          COALESCE(v_pol.politician_capital, 0),
        'reputation',        COALESCE(v_pol.politician_reputation, 0),
        'politician_influence', COALESCE(v_pol.politician_influence, 0),
        'party_id',          v_party.id,
        'party_name',        v_party.faction_name,
        'party_funds',       COALESCE(v_party.party_funds, 0),
        'current_tick',      v_tick
    );
END;
$$;
REVOKE EXECUTE ON FUNCTION public._mp_action_check(uuid) FROM PUBLIC;

-- ════════════════════════════════════════════════════════════════════
-- 2. politician_mp_floor_speech(p_faction_id)
-- ════════════════════════════════════════════════════════════════════
-- Body byte-faithful to 20270462 — only the helper invocation gains
-- p_faction_id. Helper-key drift on 'credibility' is intentionally
-- preserved (see KNOWN-ISSUE FLAG in header).
DROP FUNCTION IF EXISTS public.politician_mp_floor_speech();

CREATE OR REPLACE FUNCTION public.politician_mp_floor_speech(p_faction_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_ctx        jsonb;
    v_pol_id     uuid;
    v_party_id   uuid;
    v_tick       int;
    v_roll       int;
    v_stat       numeric;
    v_total      numeric;
    v_passed     boolean;
    v_new_rep    int;
    v_new_pop    numeric;
    v_party_name text;
BEGIN
    v_ctx := _mp_action_check(p_faction_id);
    IF NOT (v_ctx->>'ok')::bool THEN
        RETURN (v_ctx - 'ok') || jsonb_build_object('success', false);
    END IF;

    v_pol_id     := (v_ctx->>'politician_id')::uuid;
    v_party_id   := (v_ctx->>'party_id')::uuid;
    v_party_name := v_ctx->>'party_name';
    v_tick       := (v_ctx->>'current_tick')::int;
    v_stat       := (v_ctx->>'credibility')::numeric;

    v_roll  := 1 + floor(random() * 6)::int;
    v_total := v_roll + v_stat;
    v_passed := v_total >= 5;

    IF v_passed THEN
        UPDATE factions
           SET politician_reputation = COALESCE(politician_reputation, 0) + 1
         WHERE id = v_pol_id
        RETURNING politician_reputation INTO v_new_rep;
    ELSE
        UPDATE factions
           SET popularity_pct = GREATEST(0, COALESCE(popularity_pct, 0) - 1)
         WHERE id = v_party_id
        RETURNING popularity_pct INTO v_new_pop;
    END IF;

    UPDATE factions SET next_mp_action_tick = v_tick + 1 WHERE id = v_pol_id;

    RETURN jsonb_build_object(
        'success',              true,
        'action',               'floor_speech',
        'roll',                 v_roll,
        'stat',                 v_stat,
        'total',                v_total,
        'passed',               v_passed,
        'new_reputation',       v_new_rep,
        'new_party_popularity', v_new_pop,
        'party_name',           v_party_name,
        'next_action_tick',     v_tick + 1
    );
END;
$$;
REVOKE EXECUTE ON FUNCTION public.politician_mp_floor_speech(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.politician_mp_floor_speech(uuid) TO authenticated;

-- ════════════════════════════════════════════════════════════════════
-- 3. politician_mp_hold_rally(p_faction_id)
-- ════════════════════════════════════════════════════════════════════
-- Body byte-faithful to 20270460 — helper invocation gains p_faction_id;
-- 'charisma' key drift preserved (see KNOWN-ISSUE FLAG in header).
DROP FUNCTION IF EXISTS public.politician_mp_hold_rally();

CREATE OR REPLACE FUNCTION public.politician_mp_hold_rally(p_faction_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_ctx        jsonb;
    v_pol_id     uuid;
    v_party_id   uuid;
    v_party_name text;
    v_tick       int;
    v_funds      bigint;
    v_roll       int;
    v_stat       int;
    v_total      int;
    v_passed     boolean;
    v_new_pop    numeric;
    v_new_rep    int;
    v_new_funds  numeric;
    v_cost       bigint := 10000;
BEGIN
    v_ctx := _mp_action_check(p_faction_id);
    IF NOT (v_ctx->>'ok')::bool THEN
        RETURN (v_ctx - 'ok') || jsonb_build_object('success', false);
    END IF;

    v_pol_id     := (v_ctx->>'politician_id')::uuid;
    v_party_id   := (v_ctx->>'party_id')::uuid;
    v_party_name := v_ctx->>'party_name';
    v_tick       := (v_ctx->>'current_tick')::int;
    v_funds      := (v_ctx->>'party_funds')::bigint;
    v_stat       := (v_ctx->>'charisma')::int;

    IF v_funds < v_cost THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_party_funds',
            'have', v_funds, 'need', v_cost);
    END IF;

    UPDATE factions SET party_funds = COALESCE(party_funds, 0) - v_cost
     WHERE id = v_party_id
    RETURNING party_funds INTO v_new_funds;

    v_roll  := 1 + floor(random() * 6)::int;
    v_total := v_roll + v_stat;
    v_passed := v_total >= 5;

    IF v_passed THEN
        UPDATE factions
           SET popularity_pct = LEAST(popularity_cap_pct, COALESCE(popularity_pct, 0) + 1)
         WHERE id = v_party_id
        RETURNING popularity_pct INTO v_new_pop;
    ELSE
        UPDATE factions
           SET politician_reputation = GREATEST(0, COALESCE(politician_reputation, 0) - 1)
         WHERE id = v_pol_id
        RETURNING politician_reputation INTO v_new_rep;
    END IF;

    UPDATE factions SET next_mp_action_tick = v_tick + 1 WHERE id = v_pol_id;

    RETURN jsonb_build_object(
        'success',              true,
        'action',               'hold_rally',
        'roll',                 v_roll,
        'stat',                 v_stat,
        'total',                v_total,
        'passed',               v_passed,
        'cost',                 v_cost,
        'party_funds_after',    v_new_funds,
        'new_party_popularity', v_new_pop,
        'new_reputation',       v_new_rep,
        'party_name',           v_party_name,
        'next_action_tick',     v_tick + 1
    );
END;
$$;
REVOKE EXECUTE ON FUNCTION public.politician_mp_hold_rally(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.politician_mp_hold_rally(uuid) TO authenticated;

-- ════════════════════════════════════════════════════════════════════
-- 4. politician_mp_fundraising_dinner(p_faction_id)
-- ════════════════════════════════════════════════════════════════════
-- Body byte-faithful to 20270486 (the d20-flat redesign). No stat read,
-- so unaffected by helper-key drift.
DROP FUNCTION IF EXISTS public.politician_mp_fundraising_dinner();

CREATE OR REPLACE FUNCTION public.politician_mp_fundraising_dinner(p_faction_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_ctx        jsonb;
    v_pol_id     uuid;
    v_party_id   uuid;
    v_party_name text;
    v_tick       int;
    v_roll       int;
    v_money      bigint;
    v_new_funds  numeric;
    v_new_pop    numeric;
BEGIN
    v_ctx := _mp_action_check(p_faction_id);
    IF NOT (v_ctx->>'ok')::bool THEN
        RETURN (v_ctx - 'ok') || jsonb_build_object('success', false);
    END IF;

    v_pol_id     := (v_ctx->>'politician_id')::uuid;
    v_party_id   := (v_ctx->>'party_id')::uuid;
    v_party_name := v_ctx->>'party_name';
    v_tick       := (v_ctx->>'current_tick')::int;

    v_roll  := 1 + floor(random() * 20)::int;
    v_money := (v_roll * 1000)::bigint;

    UPDATE factions
       SET party_funds    = COALESCE(party_funds, 0) + v_money,
           popularity_pct = GREATEST(0, COALESCE(popularity_pct, 0) - 1)
     WHERE id = v_party_id
    RETURNING party_funds, popularity_pct INTO v_new_funds, v_new_pop;

    UPDATE factions SET next_mp_action_tick = v_tick + 1 WHERE id = v_pol_id;

    RETURN jsonb_build_object(
        'success',              true,
        'action',               'fundraising_dinner',
        'roll',                 v_roll,
        'money_raised',         v_money,
        'party_funds_after',    v_new_funds,
        'new_party_popularity', v_new_pop,
        'party_name',           v_party_name,
        'next_action_tick',     v_tick + 1
    );
END;
$$;
REVOKE EXECUTE ON FUNCTION public.politician_mp_fundraising_dinner(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.politician_mp_fundraising_dinner(uuid) TO authenticated;

-- ════════════════════════════════════════════════════════════════════
-- 5. politician_get_election_offer(p_party_id, p_faction_id)
-- ════════════════════════════════════════════════════════════════════
-- Body byte-faithful to 20270646's latest re-emit — only the politician
-- SELECT changes (id-based + ownership guard, FOR UPDATE preserved
-- absence, no party filter is now needed since p_faction_id pins the
-- row; the party-match check moves into an explicit
-- politician_party_id = p_party_id branch like 20270661's pattern).
DROP FUNCTION IF EXISTS public.politician_get_election_offer(uuid);

CREATE OR REPLACE FUNCTION public.politician_get_election_offer(
    p_party_id   uuid,
    p_faction_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid         uuid := auth.uid();
    v_pol         factions%ROWTYPE;
    v_tick        int;
    v_shard_id    uuid;
    v_nation      nations%ROWTYPE;
    v_first_len   int;
    v_last_len    int;
    v_offer       politician_election_offers%ROWTYPE;
    v_has_active  boolean;
    v_com_district     text;
    v_com_opp_first    text;
    v_com_opp_last     text;
    v_com_opp_blurb    text;
    v_com_your         int;
    v_com_opp          int;
    v_com_odds         int;
    v_parl_district    text;
    v_parl_opp_first   text;
    v_parl_opp_last    text;
    v_parl_opp_blurb   text;
    v_parl_your        int;
    v_parl_opp         int;
    v_parl_odds        int;
    v_parl_opp_party_name  text;
    v_parl_opp_party_color text;
    v_com_suffixes constant text[] := ARRAY[
        '14th Ward','7th Ward','3rd Ward','Old Quarter','Market District',
        'Riverside','Hillside','Lower Quarter','Upper Quarter','Mercado',
        'Vieja','Antigua','Central','Costa','Plaza','Barrio Alto'
    ];
    v_parl_suffixes constant text[] := ARRAY[
        'Norte','Sur','Centro','Este','Oeste','Capital','Distrito Federal',
        'Litoral','Interior','Frontera'
    ];
    v_com_blurbs constant text[] := ARRAY[
        'pensioner, attends every meeting',
        'longtime block organizer',
        'retired schoolteacher',
        'small shopkeeper, well-liked',
        'local football coach',
        'former priest',
        'union retiree',
        'building superintendent'
    ];
    v_parl_blurbs constant text[] := ARRAY[
        'party fixer',
        'former union steward',
        'rising star, well-funded',
        'incumbent''s chosen successor',
        'lawyer, deep donor network',
        'media-savvy populist',
        'ex-cabinet aide',
        'celebrity outsider candidate'
    ];
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid);
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.politician_party_id IS DISTINCT FROM p_party_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_member');
    END IF;

    SELECT current_tick, id INTO v_tick, v_shard_id FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM politician_active_election WHERE politician_id = v_pol.id
    ) INTO v_has_active;
    IF v_has_active THEN
        RETURN jsonb_build_object('success', false, 'reason', 'race_in_progress');
    END IF;

    SELECT * INTO v_offer FROM politician_election_offers WHERE politician_id = v_pol.id;
    IF v_offer.politician_id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', true,
            'community',  jsonb_build_object(
                'district',  v_offer.com_district,
                'opp_first', v_offer.com_opp_first,
                'opp_last',  v_offer.com_opp_last,
                'opp_blurb', v_offer.com_opp_blurb,
                'your_stat', v_offer.com_your_stat,
                'opp_stat',  v_offer.com_opp_stat,
                'odds_pct',  v_offer.com_odds_pct,
                'stake_win', v_offer.com_stake_win,
                'stake_lose', v_offer.com_stake_lose
            ),
            'parliament', jsonb_build_object(
                'district',  v_offer.parl_district,
                'opp_first', v_offer.parl_opp_first,
                'opp_last',  v_offer.parl_opp_last,
                'opp_blurb', v_offer.parl_opp_blurb,
                'opp_party_name',  v_offer.parl_opp_party_name,
                'opp_party_color', v_offer.parl_opp_party_color,
                'your_stat', v_offer.parl_your_stat,
                'opp_stat',  v_offer.parl_opp_stat,
                'odds_pct',  v_offer.parl_odds_pct,
                'stake_win', v_offer.parl_stake_win,
                'stake_lose', v_offer.parl_stake_lose
            )
        );
    END IF;

    SELECT * INTO v_nation FROM nations WHERE id = v_pol.nation_id;
    IF v_nation.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_nation');
    END IF;

    v_first_len := GREATEST(COALESCE(array_length(v_nation.first_name_pool, 1), 0), 1);
    v_last_len  := GREATEST(COALESCE(array_length(v_nation.last_name_pool,  1), 0), 1);

    v_com_district  := COALESCE(v_nation.last_name_pool[1 + floor(random() * v_last_len)::int], v_nation.name)
                       || ' ' || v_com_suffixes[1 + floor(random() * array_length(v_com_suffixes, 1))::int];
    v_parl_district := COALESCE(v_nation.last_name_pool[1 + floor(random() * v_last_len)::int], v_nation.name)
                       || ' ' || v_parl_suffixes[1 + floor(random() * array_length(v_parl_suffixes, 1))::int];

    v_com_opp_first  := COALESCE(v_nation.first_name_pool[1 + floor(random() * v_first_len)::int], 'Alex');
    v_com_opp_last   := COALESCE(v_nation.last_name_pool [1 + floor(random() * v_last_len )::int], 'Vargas');
    v_parl_opp_first := COALESCE(v_nation.first_name_pool[1 + floor(random() * v_first_len)::int], 'Sam');
    v_parl_opp_last  := COALESCE(v_nation.last_name_pool [1 + floor(random() * v_last_len )::int], 'Rivas');

    v_com_opp_blurb  := v_com_blurbs [1 + floor(random() * array_length(v_com_blurbs,  1))::int];
    v_parl_opp_blurb := v_parl_blurbs[1 + floor(random() * array_length(v_parl_blurbs, 1))::int];

    v_com_your  := COALESCE(v_pol.politician_skill, 1);
    v_com_opp   := GREATEST(1, v_com_your  + floor(random() * 5)::int - 2);
    -- 20270619: parl matchup now reads Skill too (was politician_capital).
    v_parl_your := COALESCE(v_pol.politician_skill, 1);
    v_parl_opp  := GREATEST(1, v_parl_your + floor(random() * 5)::int - 2);

    v_com_odds  := GREATEST(15, LEAST(85, 50 + 10 * (v_com_your  - v_com_opp )));
    v_parl_odds := GREATEST(15, LEAST(85, 50 + 10 * (v_parl_your - v_parl_opp)));

    SELECT faction_name, party_color
      INTO v_parl_opp_party_name, v_parl_opp_party_color
      FROM factions
     WHERE nation_id = v_pol.nation_id
       AND faction_type = 'movement_party'
       AND id <> p_party_id
       AND abandoned_at IS NULL
     ORDER BY random() LIMIT 1;

    INSERT INTO politician_election_offers (
        politician_id, shard_id,
        com_district, com_opp_first, com_opp_last, com_opp_blurb,
        com_your_stat, com_opp_stat, com_odds_pct,
        com_stake_win, com_stake_lose,
        parl_district, parl_opp_first, parl_opp_last, parl_opp_blurb,
        parl_opp_party_name, parl_opp_party_color,
        parl_your_stat, parl_opp_stat, parl_odds_pct,
        parl_stake_win, parl_stake_lose
    ) VALUES (
        v_pol.id, v_shard_id,
        v_com_district, v_com_opp_first, v_com_opp_last, v_com_opp_blurb,
        v_com_your, v_com_opp, v_com_odds,
        1, 0,
        v_parl_district, v_parl_opp_first, v_parl_opp_last, v_parl_opp_blurb,
        v_parl_opp_party_name, v_parl_opp_party_color,
        v_parl_your, v_parl_opp, v_parl_odds,
        3, -4
    )
    ON CONFLICT (politician_id) DO NOTHING;

    SELECT * INTO v_offer FROM politician_election_offers WHERE politician_id = v_pol.id;

    RETURN jsonb_build_object(
        'success', true,
        'community',  jsonb_build_object(
            'district',  v_offer.com_district,
            'opp_first', v_offer.com_opp_first,
            'opp_last',  v_offer.com_opp_last,
            'opp_blurb', v_offer.com_opp_blurb,
            'your_stat', v_offer.com_your_stat,
            'opp_stat',  v_offer.com_opp_stat,
            'odds_pct',  v_offer.com_odds_pct,
            'stake_win', v_offer.com_stake_win,
            'stake_lose', v_offer.com_stake_lose
        ),
        'parliament', jsonb_build_object(
            'district',  v_offer.parl_district,
            'opp_first', v_offer.parl_opp_first,
            'opp_last',  v_offer.parl_opp_last,
            'opp_blurb', v_offer.parl_opp_blurb,
            'opp_party_name',  v_offer.parl_opp_party_name,
            'opp_party_color', v_offer.parl_opp_party_color,
            'your_stat', v_offer.parl_your_stat,
            'opp_stat',  v_offer.parl_opp_stat,
            'odds_pct',  v_offer.parl_odds_pct,
            'stake_win', v_offer.parl_stake_win,
            'stake_lose', v_offer.parl_stake_lose
        )
    );
END;
$$;
REVOKE EXECUTE ON FUNCTION public.politician_get_election_offer(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.politician_get_election_offer(uuid, uuid) TO authenticated;

-- ════════════════════════════════════════════════════════════════════
-- 6. politician_campaign_rally(p_party_id, p_faction_id)
-- ════════════════════════════════════════════════════════════════════
-- Body byte-faithful to 20270591 — only the politician SELECT changes.
DROP FUNCTION IF EXISTS public.politician_campaign_rally(uuid);

CREATE OR REPLACE FUNCTION public.politician_campaign_rally(
    p_party_id   uuid,
    p_faction_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_tick      int;
    v_roll      int;
    v_race      politician_active_election%ROWTYPE;
    v_und_take  int;
    v_opp_take  int;
    v_next      int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.politician_party_id IS DISTINCT FROM p_party_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_member');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;

    IF v_pol.next_member_action_tick IS NOT NULL
       AND v_pol.next_member_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_member_action_tick);
    END IF;

    v_roll := 1 + floor(random() * 6)::int;
    v_next := v_tick + 1;

    UPDATE factions
       SET next_member_action_tick = v_next
     WHERE id = v_pol.id;

    SELECT * INTO v_race FROM politician_active_election WHERE politician_id = v_pol.id;
    IF v_race.politician_id IS NOT NULL THEN
        v_und_take := LEAST(v_roll, v_race.polling_undecided_pct);
        v_opp_take := v_roll - v_und_take;
        UPDATE politician_active_election
           SET polling_you_pct       = LEAST(100, polling_you_pct + v_roll),
               polling_undecided_pct = polling_undecided_pct - v_und_take,
               polling_opp_pct       = GREATEST(0, polling_opp_pct - v_opp_take)
         WHERE politician_id = v_pol.id;
    END IF;

    RETURN jsonb_build_object(
        'success',                 true,
        'action',                  'campaign_rally',
        'roll',                    v_roll,
        'polling_delta',           v_roll,
        'next_member_action_tick', v_next,
        'has_active_race',         v_race.politician_id IS NOT NULL
    );
END;
$$;
REVOKE EXECUTE ON FUNCTION public.politician_campaign_rally(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.politician_campaign_rally(uuid, uuid) TO authenticated;

-- ════════════════════════════════════════════════════════════════════
-- 7. politician_request_endorsement(p_party_id, p_faction_id)
-- ════════════════════════════════════════════════════════════════════
-- Body byte-faithful to 20270591 — only the politician SELECT changes.
DROP FUNCTION IF EXISTS public.politician_request_endorsement(uuid);

CREATE OR REPLACE FUNCTION public.politician_request_endorsement(
    p_party_id   uuid,
    p_faction_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    SUCCESS_THRESHOLD CONSTANT int := 3;
    SUCCESS_BONUS     CONSTANT int := 7;
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_tick      int;
    v_race      politician_active_election%ROWTYPE;
    v_roll      int;
    v_total     int;
    v_outcome   text;
    v_penalty   int;
    v_loss      int;
    v_und_take  int;
    v_opp_take  int;
    v_next      int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.politician_party_id IS DISTINCT FROM p_party_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_member');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;

    IF v_pol.next_member_action_tick IS NOT NULL
       AND v_pol.next_member_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_member_action_tick);
    END IF;

    SELECT * INTO v_race FROM politician_active_election
     WHERE politician_id = v_pol.id
     FOR UPDATE;
    IF v_race.politician_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_active_race');
    END IF;
    IF v_race.endorsement_outcome IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'endorsement_already_used',
            'outcome', v_race.endorsement_outcome);
    END IF;

    v_roll  := 1 + floor(random() * 6)::int;
    v_total := v_roll + COALESCE(v_pol.politician_reputation, 0);
    v_next  := v_tick + 1;

    UPDATE factions
       SET next_member_action_tick = v_next
     WHERE id = v_pol.id;

    IF v_total >= SUCCESS_THRESHOLD THEN
        v_outcome  := 'endorsed';
        v_und_take := LEAST(SUCCESS_BONUS, v_race.polling_undecided_pct);
        v_opp_take := SUCCESS_BONUS - v_und_take;
        UPDATE politician_active_election
           SET polling_you_pct       = LEAST(100, polling_you_pct + SUCCESS_BONUS),
               polling_undecided_pct = polling_undecided_pct - v_und_take,
               polling_opp_pct       = GREATEST(0, polling_opp_pct - v_opp_take),
               endorsement_outcome   = 'endorsed'
         WHERE politician_id = v_pol.id;

        RETURN jsonb_build_object(
            'success',                 true,
            'action',                  'request_endorsement',
            'roll',                    v_roll,
            'reputation',              COALESCE(v_pol.politician_reputation, 0),
            'total',                   v_total,
            'outcome',                 'endorsed',
            'polling_delta',           SUCCESS_BONUS,
            'next_member_action_tick', v_next
        );
    ELSE
        v_outcome := 'rejected';
        v_penalty := 1 + floor(random() * 3)::int;   -- 1d3
        v_loss    := LEAST(v_penalty, v_race.polling_you_pct);
        UPDATE politician_active_election
           SET polling_you_pct       = polling_you_pct - v_loss,
               polling_undecided_pct = polling_undecided_pct + v_loss,
               endorsement_outcome   = 'rejected'
         WHERE politician_id = v_pol.id;

        RETURN jsonb_build_object(
            'success',                 true,
            'action',                  'request_endorsement',
            'roll',                    v_roll,
            'reputation',              COALESCE(v_pol.politician_reputation, 0),
            'total',                   v_total,
            'outcome',                 'rejected',
            'polling_delta',           -v_loss,
            'penalty_roll',            v_penalty,
            'next_member_action_tick', v_next
        );
    END IF;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.politician_request_endorsement(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.politician_request_endorsement(uuid, uuid) TO authenticated;

-- ════════════════════════════════════════════════════════════════════
-- 8. accept_hearing_testimony(p_testimony_id, p_faction_id)
-- ════════════════════════════════════════════════════════════════════
-- Body byte-faithful to 20270646's latest re-emit — only the politician
-- SELECT changes. The downstream committee-membership check
-- (committee_members.politician_faction_id = v_pol.id) still gates;
-- p_faction_id only fixes which politician we resolve to.
DROP FUNCTION IF EXISTS public.accept_hearing_testimony(uuid);

CREATE OR REPLACE FUNCTION public.accept_hearing_testimony(
    p_testimony_id uuid,
    p_faction_id   uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_pol     factions%ROWTYPE;
    v_test    committee_hearing_testimonies%ROWTYPE;
    v_hearing committee_hearings%ROWTYPE;
    v_sub     factions%ROWTYPE;
    v_tick    int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid);
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;

    SELECT * INTO v_test FROM committee_hearing_testimonies WHERE id = p_testimony_id;
    IF v_test.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'testimony_not_found');
    END IF;
    IF v_test.accepted THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_accepted');
    END IF;

    SELECT * INTO v_hearing FROM committee_hearings WHERE id = v_test.hearing_id;
    IF v_hearing.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'hearing_not_found');
    END IF;

    PERFORM 1 FROM committee_members
     WHERE committee_id = v_hearing.committee_id AND politician_faction_id = v_pol.id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_member');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- Conditional UPDATE so two members racing to accept the same
    -- testimony don't both fire the stat reward. The first writer wins;
    -- the second's UPDATE matches zero rows and the function returns
    -- without granting a second +1.
    UPDATE committee_hearing_testimonies
       SET accepted               = true,
           accepted_by_faction_id = v_pol.id,
           accepted_at_tick       = v_tick
     WHERE id = v_test.id
       AND accepted = false;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', true, 'testimony_id', v_test.id, 'already_accepted', true);
    END IF;

    -- Submitter reward. Skipped silently if the submitter faction is
    -- gone (ON DELETE SET NULL would have nulled submitter_faction_id).
    IF v_test.submitter_faction_id IS NOT NULL THEN
        SELECT * INTO v_sub FROM factions WHERE id = v_test.submitter_faction_id;
        IF v_sub.faction_type = 'politician' THEN
            UPDATE factions
               SET politician_influence = COALESCE(politician_influence, 0) + 1
             WHERE id = v_sub.id;
        ELSIF v_sub.faction_type = 'entrepreneur' THEN
            UPDATE factions
               SET ent_reputation = COALESCE(ent_reputation, 0) + 1
             WHERE id = v_sub.id;
        END IF;
        -- All other faction types: no stat reward (acceptance is the
        -- public-record reward).
    END IF;

    RETURN jsonb_build_object('success', true, 'testimony_id', v_test.id);
END $$;

REVOKE EXECUTE ON FUNCTION public.accept_hearing_testimony(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.accept_hearing_testimony(uuid, uuid) TO authenticated;

-- ════════════════════════════════════════════════════════════════════
-- 9. submit_hearing_testimony(p_hearing_id, p_persona_id, p_text, p_faction_id)
-- ════════════════════════════════════════════════════════════════════
-- Body byte-faithful to 20270646's latest re-emit — only the faction
-- SELECT changes. Note: testimony submission allows ANY faction type
-- (entrepreneurs, civilians, politicians all submit), so the new
-- SELECT preserves "no faction_type filter" — p_faction_id pins the
-- specific faction and the ownership guard ensures the caller owns it.
DROP FUNCTION IF EXISTS public.submit_hearing_testimony(uuid, uuid, text);

CREATE OR REPLACE FUNCTION public.submit_hearing_testimony(
    p_hearing_id uuid,
    p_persona_id uuid,
    p_text       text,
    p_faction_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_fac     factions%ROWTYPE;
    v_hearing committee_hearings%ROWTYPE;
    v_pers    committee_hearing_personas%ROWTYPE;
    v_tick    int;
    v_text    text;
    v_id      uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    -- Resolve the caller's faction. Any faction type allowed
    -- (entrepreneur / politician / civilian all submit testimony);
    -- p_faction_id pins the specific row and the ownership guard
    -- ensures the caller owns it. Replaces 20270646's oldest-first
    -- pick that mis-selected on multi-faction accounts.
    SELECT * INTO v_fac FROM factions
     WHERE id = p_faction_id
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid);
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_faction');
    END IF;

    SELECT * INTO v_hearing FROM committee_hearings WHERE id = p_hearing_id;
    IF v_hearing.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'hearing_not_found');
    END IF;
    IF v_hearing.status <> 'open' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'hearing_closed');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF v_tick > v_hearing.closes_at_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'hearing_window_passed');
    END IF;

    v_text := btrim(COALESCE(p_text, ''));
    IF length(v_text) < 1 OR length(v_text) > 400 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_text');
    END IF;

    -- Atomic persona claim. UPDATE … WHERE claimed_by IS NULL returns
    -- 0 rows if someone else claimed it between the page load and the
    -- click. RETURNING populates v_pers only on the winning path.
    UPDATE committee_hearing_personas
       SET claimed_by_faction_id = v_fac.id,
           claimed_at            = now()
     WHERE id = p_persona_id
       AND hearing_id = v_hearing.id
       AND claimed_by_faction_id IS NULL
    RETURNING * INTO v_pers;
    IF v_pers.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'persona_claimed');
    END IF;

    -- UNIQUE (hearing_id, submitter_faction_id) catches a second
    -- testimony from the same faction. On conflict, release the
    -- persona so it's not orphaned.
    BEGIN
        INSERT INTO committee_hearing_testimonies (
            hearing_id, persona_id, submitter_faction_id, text, created_at_tick
        ) VALUES (
            v_hearing.id, v_pers.id, v_fac.id, v_text, v_tick
        ) RETURNING id INTO v_id;
    EXCEPTION WHEN unique_violation THEN
        UPDATE committee_hearing_personas
           SET claimed_by_faction_id = NULL, claimed_at = NULL
         WHERE id = v_pers.id;
        RETURN jsonb_build_object('success', false, 'reason', 'already_testified');
    END;

    RETURN jsonb_build_object(
        'success',       true,
        'testimony_id',  v_id,
        'persona_name',  v_pers.name,
        'persona_title', v_pers.title
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.submit_hearing_testimony(uuid, uuid, text, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.submit_hearing_testimony(uuid, uuid, text, uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
