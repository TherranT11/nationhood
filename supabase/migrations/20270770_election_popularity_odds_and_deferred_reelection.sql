-- ════════════════════════════════════════════════════════════════════
-- 20270770 — Election odds from party popularity + deferred re-election
--             + +1 Experience on parliament wins
--
-- Three user-spec'd changes to the Stand-for-Election system:
--
-- 1. ODDS FORMULA (politician_get_election_offer). Starting odds are
--    now popularity-driven instead of pure-Experience-driven:
--
--        your score  = your party's popularity_pct + (Experience / 2)
--        opp score   = opp party's popularity_pct + 5
--        odds        = clamp(15, 85, 50 + (your score − opp score))
--
--    Community-race opponents are independents (no party), so their
--    "party popularity" is 0 → score = 5 flat. That makes community
--    races a near-lock for any party-backed player, which fits the
--    "low stakes, learn the trade" framing of that tier.
--
--    parl_your_stat / parl_opp_stat keep storing Experience (the
--    modal's matchup display) — only the odds derivation changed.
--    Pre-existing offer rows keep their old odds until consumed
--    (the RPC returns early on an existing row).
--
-- 2. DEFERRED RE-ELECTION (politician_stand_for_election). Incumbent
--    MP / Senior MP re-election filings no longer resolve in 2 ticks
--    like a fresh race — resolve_tick = the nation's next general
--    election tick, so the candidacy rides until the actual election.
--    Fresh (non-incumbent) races keep the v_tick + 2 quickie.
--
-- 3. +1 EXPERIENCE ON PARLIAMENT WINS (politician_resolve_due_
--    elections). Parliament / Senior MP wins now grant +1
--    politician_skill alongside the existing +1 politician_capital.
--    Community wins already granted +1 skill (20270709) — unchanged.
--
-- Bodies byte-faithful to their baselines (20270713 offer / 20270766
-- stand / 20270724 resolver) outside the labelled blocks.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ════════════════════════════════════════════════════════════════════
-- 1. politician_get_election_offer — popularity-based starting odds
-- ════════════════════════════════════════════════════════════════════
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
    -- 20270770: popularity-based odds inputs
    v_my_party_pop     numeric;
    v_opp_party_pop    numeric;
    v_your_score       numeric;
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

    -- your_stat / opp_stat keep the Experience values — the modal's
    -- matchup display reads these. Only the odds math changed.
    v_com_your  := COALESCE(v_pol.politician_skill, 1);
    v_com_opp   := 2 + floor(random() * 2)::int;
    v_parl_your := COALESCE(v_pol.politician_skill, 1);
    v_parl_opp  := GREATEST(1, v_parl_your + floor(random() * 5)::int - 2);

    -- Opposing party picked BEFORE odds now — its popularity feeds the
    -- parliament odds. Same random-pick semantics as 20270713.
    SELECT faction_name, party_color, popularity_pct
      INTO v_parl_opp_party_name, v_parl_opp_party_color, v_opp_party_pop
      FROM factions
     WHERE nation_id = v_pol.nation_id
       AND faction_type = 'movement_party'
       AND id <> p_party_id
       AND abandoned_at IS NULL
     ORDER BY random() LIMIT 1;

    -- 20270770: popularity-based starting odds.
    --   your score = your party popularity + Experience/2
    --   opp score  = opp party popularity + 5 (community opponents
    --                are independents → 0 popularity → 5 flat)
    --   odds       = clamp(15, 85, 50 + (your − opp))
    SELECT popularity_pct INTO v_my_party_pop
      FROM factions WHERE id = p_party_id;
    v_your_score := COALESCE(v_my_party_pop, 0)
                  + COALESCE(v_pol.politician_skill, 1) / 2.0;

    v_com_odds  := GREATEST(15, LEAST(85,
        ROUND(50 + (v_your_score - 5))::int));
    v_parl_odds := GREATEST(15, LEAST(85,
        ROUND(50 + (v_your_score - (COALESCE(v_opp_party_pop, 0) + 5)))::int));

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
-- 2. politician_stand_for_election — incumbent races resolve at the
--    general election tick. Byte-faithful to 20270766 otherwise.
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.politician_stand_for_election(
    p_party_id   uuid,
    p_tier       text,
    p_faction_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_tick      int;
    v_shard_id  uuid;
    v_offer     politician_election_offers%ROWTYPE;
    v_next      int;
    v_resolve   int;
    v_district  text;
    v_opp_first text;
    v_opp_last  text;
    v_opp_blurb text;
    v_opp_pname text;
    v_your      int;
    v_opp       int;
    v_odds      int;
    v_win       int;
    v_lose      int;
    v_poll_you  int;
    v_poll_opp  int;
    v_poll_und  int;
    v_party_funds_before bigint;
    v_entry_fee bigint := 50000;
    v_election_tick int;
    v_is_reelection boolean := false;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_tier NOT IN ('community','parliament') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_tier');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid);
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_member');
    END IF;
    IF v_pol.politician_party_id IS DISTINCT FROM p_party_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_member');
    END IF;

    SELECT current_tick, id INTO v_tick, v_shard_id FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;

    -- 20270766: incumbent MP / Senior MP may run for re-election in
    -- the final 5 ticks of their term (tier='parliament' only).
    -- 20270770: when that path is taken, the race resolves AT the
    -- general election rather than in 2 ticks.
    IF v_pol.politician_office IS NOT NULL THEN
        SELECT next_election_tick INTO v_election_tick
          FROM nations WHERE id = v_pol.nation_id;
        IF NOT (
            p_tier = 'parliament'
            AND v_pol.politician_office IN ('member_of_parliament','senior_mp')
            AND v_election_tick IS NOT NULL
            AND v_election_tick >= v_tick
            AND v_election_tick - v_tick <= 5
        ) THEN
            RETURN jsonb_build_object('success', false, 'reason', 'already_in_office',
                'office', v_pol.politician_office);
        END IF;
        v_is_reelection := true;
    END IF;

    IF EXISTS (SELECT 1 FROM politician_active_election WHERE politician_id = v_pol.id) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'race_in_progress');
    END IF;

    IF v_pol.next_member_action_tick IS NOT NULL
       AND v_pol.next_member_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_member_action_tick);
    END IF;

    SELECT * INTO v_offer FROM politician_election_offers WHERE politician_id = v_pol.id;
    IF v_offer.politician_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_offer');
    END IF;

    IF p_tier = 'community' THEN
        v_district  := v_offer.com_district;
        v_opp_first := v_offer.com_opp_first;
        v_opp_last  := v_offer.com_opp_last;
        v_opp_blurb := v_offer.com_opp_blurb;
        v_opp_pname := NULL;
        v_your      := v_offer.com_your_stat;
        v_opp       := v_offer.com_opp_stat;
        v_odds      := v_offer.com_odds_pct;
        v_win       := v_offer.com_stake_win;
        v_lose      := v_offer.com_stake_lose;
        v_resolve   := v_tick + 1;
    ELSE
        v_district  := v_offer.parl_district;
        v_opp_first := v_offer.parl_opp_first;
        v_opp_last  := v_offer.parl_opp_last;
        v_opp_blurb := v_offer.parl_opp_blurb;
        v_opp_pname := v_offer.parl_opp_party_name;
        v_your      := v_offer.parl_your_stat;
        v_opp       := v_offer.parl_opp_stat;
        v_odds      := v_offer.parl_odds_pct;
        v_win       := v_offer.parl_stake_win;
        v_lose      := v_offer.parl_stake_lose;
        -- 20270770: re-election candidacies ride to the general
        -- election; fresh parliament races keep the 2-tick window.
        v_resolve   := CASE WHEN v_is_reelection
                            THEN v_election_tick
                            ELSE v_tick + 2 END;
    END IF;

    IF p_tier = 'parliament' THEN
        SELECT party_funds INTO v_party_funds_before
          FROM factions
         WHERE id = p_party_id
           AND faction_type = 'movement_party'
           AND abandoned_at IS NULL
         FOR UPDATE;
        IF v_party_funds_before IS NULL THEN
            RETURN jsonb_build_object('success', false, 'reason', 'party_not_found');
        END IF;
        IF v_party_funds_before < v_entry_fee THEN
            RETURN jsonb_build_object('success', false,
                'reason', 'insufficient_party_funds',
                'have', v_party_funds_before, 'need', v_entry_fee);
        END IF;
        UPDATE factions
           SET party_funds = party_funds - v_entry_fee
         WHERE id = p_party_id;
    END IF;

    v_poll_you := GREATEST(0, LEAST(100, v_odds - 8));
    v_poll_und := 15;
    v_poll_opp := GREATEST(0, 100 - v_poll_you - v_poll_und);

    INSERT INTO politician_active_election (
        politician_id, shard_id, race_tier, district,
        opp_first, opp_last, opp_blurb, opp_party_name,
        your_stat, opp_stat, win_odds_pct, stake_win, stake_lose,
        resolve_tick,
        polling_you_pct, polling_opp_pct, polling_undecided_pct,
        party_id
    ) VALUES (
        v_pol.id, v_shard_id, p_tier, v_district,
        v_opp_first, v_opp_last, v_opp_blurb, v_opp_pname,
        v_your, v_opp, v_odds, v_win, v_lose,
        v_resolve,
        v_poll_you, v_poll_opp, v_poll_und,
        p_party_id
    );

    DELETE FROM politician_election_offers WHERE politician_id = v_pol.id;

    v_next := v_pol.next_member_action_tick;

    INSERT INTO politician_career_events (
        faction_id, event_tick, event_type, target_name, metadata
    ) VALUES (
        v_pol.id, v_tick, 'stood_for_election', v_district,
        jsonb_build_object(
            'race_tier',      p_tier,
            'opponent',       v_opp_first || ' ' || v_opp_last,
            'opp_party_name', v_opp_pname,
            'win_odds_pct',   v_odds,
            'entry_fee',      CASE WHEN p_tier = 'parliament' THEN v_entry_fee ELSE 0 END,
            'is_reelection',  v_is_reelection
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'race_tier', p_tier,
        'district', v_district,
        'opp_full_name', v_opp_first || ' ' || v_opp_last,
        'win_odds_pct', v_odds,
        'resolve_tick', v_resolve,
        'is_reelection', v_is_reelection,
        'next_member_action_tick', v_next,
        'polling_you_pct', v_poll_you,
        'polling_opp_pct', v_poll_opp,
        'polling_undecided_pct', v_poll_und
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.politician_stand_for_election(uuid, text, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.politician_stand_for_election(uuid, text, uuid) TO authenticated;

-- ════════════════════════════════════════════════════════════════════
-- 3. politician_resolve_due_elections — +1 Experience on parliament /
--    senior MP wins. Byte-faithful to 20270724 otherwise.
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.politician_resolve_due_elections()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_pol          factions%ROWTYPE;
    v_tick         int;
    v_race         politician_active_election%ROWTYPE;
    v_won          boolean;
    v_stake        int;
    v_cap_before   numeric;
    v_new_cap      numeric;
    v_actual_delta numeric;
    v_event        text;
    v_opp_full     text;
    v_party_seats  int;
    v_party_pop    numeric;
    v_party_pop_cap numeric;
    v_party_funds  bigint;
    v_party_name   text;
    v_party_reward jsonb;
    v_party_penalty jsonb;
    v_new_cha      int;
    v_new_skill    numeric;
    v_stat_reward  jsonb;
    v_office       text;
    v_city_stamp   jsonb;
    v_city_row     cities%ROWTYPE;
    v_first_pool   text[];
    v_last_pool    text[];
    v_evict_first  text;
    v_evict_last   text;
    v_was_incumbent boolean;
    v_seat_idx     int;
    v_seat_kind    text;
    v_new_seat     jsonb;
    v_pol_party_abbr text;
    v_pol_party_name text;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', true, 'resolved', false, 'reason', 'no_shard');
    END IF;

    SELECT f.* INTO v_pol
      FROM factions f
      JOIN politician_active_election pae ON pae.politician_id = f.id
     WHERE (f.id = v_uid OR f.linked_user_id = v_uid)
       AND f.faction_type = 'politician'
       AND f.abandoned_at IS NULL
       AND pae.resolve_tick < v_tick
     LIMIT 1;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', true, 'resolved', false);
    END IF;

    SELECT * INTO v_race FROM politician_active_election WHERE politician_id = v_pol.id;
    IF v_race.politician_id IS NULL THEN
        RETURN jsonb_build_object('success', true, 'resolved', false);
    END IF;
    IF v_race.resolve_tick >= v_tick THEN
        RETURN jsonb_build_object(
            'success', true, 'resolved', false,
            'race_tier', v_race.race_tier,
            'resolve_tick', v_race.resolve_tick,
            'current_tick', v_tick
        );
    END IF;

    IF v_race.polling_you_pct > v_race.polling_opp_pct THEN
        v_won := true;
    ELSIF v_race.polling_you_pct < v_race.polling_opp_pct THEN
        v_won := false;
    ELSE
        v_won := random() < 0.5;
    END IF;
    v_stake := CASE WHEN v_won THEN v_race.stake_win ELSE v_race.stake_lose END;
    v_event := CASE WHEN v_won THEN 'won_election' ELSE 'lost_election' END;
    v_opp_full := v_race.opp_first || ' ' || v_race.opp_last;
    v_cap_before := COALESCE(v_pol.politician_influence, 0);
    UPDATE factions
       SET politician_influence = GREATEST(0, v_cap_before + v_stake)
     WHERE id = v_pol.id
    RETURNING politician_influence INTO v_new_cap;
    v_actual_delta := v_new_cap - v_cap_before;

    -- Party rewards. Mayor / Mayor of Capital now also raise the
    -- party's approval ceiling per 20270724.
    IF v_won AND v_race.party_id IS NOT NULL THEN
        IF v_race.race_tier IN ('parliament', 'senior_mp') THEN
            UPDATE factions
               SET seats = COALESCE(seats, 0) + 1
             WHERE id = v_race.party_id
               AND faction_type = 'movement_party'
               AND abandoned_at IS NULL
            RETURNING seats, faction_name INTO v_party_seats, v_party_name;
            IF FOUND THEN
                v_party_reward := jsonb_build_object(
                    'kind',       'seats',
                    'delta',      1,
                    'new_value',  v_party_seats,
                    'party_name', v_party_name
                );
            END IF;
        ELSIF v_race.race_tier = 'community' THEN
            UPDATE factions
               SET popularity_pct = LEAST(popularity_cap_pct, COALESCE(popularity_pct, 0) + 1)
             WHERE id = v_race.party_id
               AND faction_type = 'movement_party'
               AND abandoned_at IS NULL
            RETURNING popularity_pct, faction_name INTO v_party_pop, v_party_name;
            IF FOUND THEN
                v_party_reward := jsonb_build_object(
                    'kind',       'popularity',
                    'delta',      1,
                    'new_value',  v_party_pop,
                    'party_name', v_party_name
                );
            END IF;
        ELSIF v_race.race_tier = 'city_council' THEN
            UPDATE factions
               SET popularity_cap_pct = COALESCE(popularity_cap_pct, 0) + 1,
                   popularity_pct     = LEAST(
                       COALESCE(popularity_cap_pct, 0) + 1,
                       COALESCE(popularity_pct, 0) + 1
                   ),
                   party_funds        = COALESCE(party_funds, 0) + 100000
             WHERE id = v_race.party_id
               AND faction_type = 'movement_party'
               AND abandoned_at IS NULL
            RETURNING popularity_pct, popularity_cap_pct, party_funds, faction_name
                 INTO v_party_pop, v_party_pop_cap, v_party_funds, v_party_name;
            IF FOUND THEN
                v_party_reward := jsonb_build_object(
                    'kind',           'city_council',
                    'popularity_delta',     1,
                    'popularity_new',       v_party_pop,
                    'popularity_cap_delta', 1,
                    'popularity_cap_new',   v_party_pop_cap,
                    'funds_delta',          100000,
                    'funds_new',            v_party_funds,
                    'party_name',           v_party_name
                );
            END IF;
        ELSIF v_race.race_tier = 'city_council_president' THEN
            UPDATE factions
               SET party_funds = COALESCE(party_funds, 0) + 200000
             WHERE id = v_race.party_id
               AND faction_type = 'movement_party'
               AND abandoned_at IS NULL
            RETURNING party_funds, faction_name INTO v_party_funds, v_party_name;
            IF FOUND THEN
                v_party_reward := jsonb_build_object(
                    'kind',        'city_council_president',
                    'funds_delta', 200000,
                    'funds_new',   v_party_funds,
                    'party_name',  v_party_name
                );
            END IF;
        ELSIF v_race.race_tier = 'mayor' THEN
            -- 20270724: +3 popularity_cap_pct on Mayor (non-capital).
            -- Pairs with the existing +2 popularity_pct + $200K funds.
            -- Inline expression appears twice in the SET so both reads
            -- pick up the OLD cap value (Postgres UPDATE semantics);
            -- the LEAST(new_cap, pop+2) clamp uses the BUMPED cap.
            UPDATE factions
               SET popularity_cap_pct = COALESCE(popularity_cap_pct, 0) + 3,
                   popularity_pct     = LEAST(
                       COALESCE(popularity_cap_pct, 0) + 3,
                       COALESCE(popularity_pct, 0) + 2
                   ),
                   party_funds        = COALESCE(party_funds, 0) + 200000
             WHERE id = v_race.party_id
               AND faction_type = 'movement_party'
               AND abandoned_at IS NULL
            RETURNING popularity_pct, popularity_cap_pct, party_funds, faction_name
                 INTO v_party_pop, v_party_pop_cap, v_party_funds, v_party_name;
            IF FOUND THEN
                v_party_reward := jsonb_build_object(
                    'kind',                 'mayor',
                    'popularity_delta',     2,
                    'popularity_new',       v_party_pop,
                    'popularity_cap_delta', 3,
                    'popularity_cap_new',   v_party_pop_cap,
                    'funds_delta',          200000,
                    'funds_new',            v_party_funds,
                    'party_name',           v_party_name
                );
            END IF;
        ELSIF v_race.race_tier = 'mayor_of_capital' THEN
            -- 20270724: +5 popularity_cap_pct on Mayor of Capital.
            -- Forward-only — capital mayor has no auto-term + no
            -- incumbent-loss branch + cities row isn't stamped, so
            -- there's nowhere to put a symmetric subtract today.
            -- Loss handling lands when the capital flow gets
            -- city-stamped (filed).
            UPDATE factions
               SET popularity_cap_pct = COALESCE(popularity_cap_pct, 0) + 5
             WHERE id = v_race.party_id
               AND faction_type = 'movement_party'
               AND abandoned_at IS NULL
            RETURNING popularity_cap_pct, faction_name
                 INTO v_party_pop_cap, v_party_name;
            IF FOUND THEN
                v_party_reward := jsonb_build_object(
                    'kind',                 'mayor_of_capital',
                    'popularity_cap_delta', 5,
                    'popularity_cap_new',   v_party_pop_cap,
                    'party_name',           v_party_name
                );
            END IF;
        END IF;
    END IF;

    IF NOT v_won AND v_race.party_id IS NOT NULL THEN
        UPDATE factions
           SET popularity_pct = GREATEST(0, COALESCE(popularity_pct, 0) - 1)
         WHERE id = v_race.party_id
           AND faction_type = 'movement_party'
           AND abandoned_at IS NULL
        RETURNING popularity_pct, faction_name INTO v_party_pop, v_party_name;
        IF FOUND THEN
            v_party_penalty := jsonb_build_object(
                'kind',       'popularity',
                'delta',      -1,
                'new_value',  v_party_pop,
                'party_name', v_party_name
            );
        END IF;
    END IF;

    -- Player stat reward. 20270770: parliament / senior MP wins now
    -- grant +1 politician_skill (Experience) alongside the existing
    -- +1 politician_capital. Local-tier wins keep their +1 skill from
    -- 20270709.
    IF v_won THEN
        IF v_race.race_tier IN ('parliament', 'senior_mp') THEN
            UPDATE factions
               SET politician_capital = COALESCE(politician_capital, 1) + 1,
                   politician_skill   = COALESCE(politician_skill, 1) + 1
             WHERE id = v_pol.id
            RETURNING politician_capital, politician_skill INTO v_new_cha, v_new_skill;
            v_stat_reward := jsonb_build_object(
                'kind', 'influence_and_skill',
                'capital_delta', 1, 'capital_new', v_new_cha,
                'skill_delta',   1, 'skill_new',   v_new_skill
            );
        ELSIF v_race.race_tier IN (
            'community', 'city_council', 'city_council_president',
            'mayor', 'mayor_of_capital', 'regional_leader'
        ) THEN
            UPDATE factions
               SET politician_skill = COALESCE(politician_skill, 1) + 1
             WHERE id = v_pol.id
            RETURNING politician_skill INTO v_new_skill;
            v_stat_reward := jsonb_build_object('kind', 'skill', 'delta', 1, 'new_value', v_new_skill);
        END IF;
        v_office := CASE v_race.race_tier
                        WHEN 'community'              THEN 'community_organizer'
                        WHEN 'parliament'             THEN 'member_of_parliament'
                        WHEN 'city_council'           THEN 'city_council_member'
                        WHEN 'city_council_president' THEN 'city_council_president'
                        WHEN 'senior_mp'              THEN 'senior_mp'
                        WHEN 'mayor'                  THEN 'mayor'
                        WHEN 'mayor_of_capital'       THEN 'mayor_of_capital'
                        WHEN 'regional_leader'        THEN 'regional_leader'
                    END;
        IF v_office IS NOT NULL THEN
            UPDATE factions
               SET politician_office             = v_office,
                   politician_office_won_at_tick = v_tick
             WHERE id = v_pol.id;
        END IF;
        IF v_race.race_tier = 'community' THEN
            UPDATE factions
               SET politician_former_community_organizer = TRUE
             WHERE id = v_pol.id;
        END IF;

        -- Mayor WIN city stamp (20270718/20270719). Unchanged.
        IF v_race.race_tier = 'mayor' AND v_race.city_id IS NOT NULL THEN
            UPDATE cities
               SET mayor_first_name    = v_pol.leader_first_name,
                   mayor_last_name     = v_pol.leader_last_name,
                   mayor_age           = COALESCE(v_pol.leader_age, mayor_age),
                   mayor_archetype     = NULL,
                   mayor_party_id      = v_pol.politician_party_id,
                   mayor_term_end_tick = v_tick + 48
             WHERE id = v_race.city_id;
            IF FOUND THEN
                v_city_stamp := jsonb_build_object(
                    'city_id',             v_race.city_id,
                    'mayor_first',         v_pol.leader_first_name,
                    'mayor_last',          v_pol.leader_last_name,
                    'mayor_party_id',      v_pol.politician_party_id,
                    'mayor_term_end_tick', v_tick + 48
                );
            END IF;
        END IF;

        -- CCM / CCP WIN council seat stamp (20270722). Unchanged.
        IF v_race.race_tier IN ('city_council', 'city_council_president')
           AND v_race.city_id IS NOT NULL THEN
            SELECT abbreviation, faction_name
              INTO v_pol_party_abbr, v_pol_party_name
              FROM factions
             WHERE id = v_pol.politician_party_id
             LIMIT 1;

            SELECT * INTO v_city_row FROM cities WHERE id = v_race.city_id;
            IF v_city_row.id IS NOT NULL AND v_city_row.council IS NOT NULL THEN
                IF v_race.race_tier = 'city_council_president' THEN
                    v_seat_idx := 0;
                ELSE
                    SELECT (t.idx - 1)::int INTO v_seat_idx
                      FROM jsonb_array_elements(v_city_row.council)
                           WITH ORDINALITY AS t(elem, idx)
                     WHERE elem->>'seat' LIKE 'member_%'
                       AND (elem->>'holder_faction_id') IS NULL
                     ORDER BY idx
                     LIMIT 1;
                    IF v_seat_idx IS NULL THEN
                        SELECT (t.idx - 1)::int INTO v_seat_idx
                          FROM jsonb_array_elements(v_city_row.council)
                               WITH ORDINALITY AS t(elem, idx)
                         WHERE elem->>'seat' LIKE 'member_%'
                         ORDER BY NULLIF(elem->>'term_end_tick', '')::int ASC NULLS FIRST
                         LIMIT 1;
                    END IF;
                END IF;

                IF v_seat_idx IS NOT NULL THEN
                    v_seat_kind := v_city_row.council->v_seat_idx->>'seat';
                    v_new_seat := jsonb_build_object(
                        'seat',              v_seat_kind,
                        'holder_faction_id', v_pol.id,
                        'first_name',        v_pol.leader_first_name,
                        'last_name',         v_pol.leader_last_name,
                        'age',               v_pol.leader_age,
                        'party_id',          v_pol.politician_party_id,
                        'party_abbr',        v_pol_party_abbr,
                        'party_name',        v_pol_party_name,
                        'archetype',         NULL,
                        'term_end_tick',     v_tick + CASE v_race.race_tier
                                                  WHEN 'city_council_president' THEN 36
                                                  ELSE                                12
                                              END
                    );
                    UPDATE cities
                       SET council = jsonb_set(council, ARRAY[v_seat_idx::text], v_new_seat)
                     WHERE id = v_race.city_id;
                    v_city_stamp := jsonb_build_object(
                        'city_id',   v_race.city_id,
                        'seat',      v_seat_kind,
                        'seat_idx',  v_seat_idx
                    );
                END IF;
            END IF;
        END IF;
    END IF;

    -- Mayor LOSS — incumbent eviction. 20270724 adds the cap
    -- subtraction (-3) when the player loses re-election; both the
    -- cap and the clamped pop ride down so the party doesn't sit
    -- above its new ceiling. Mayor of Capital has no symmetric
    -- subtract path today (no incumbent-loss branch for the
    -- capital race tier).
    IF NOT v_won AND v_race.race_tier = 'mayor' AND v_race.city_id IS NOT NULL THEN
        SELECT * INTO v_city_row FROM cities WHERE id = v_race.city_id;
        v_was_incumbent :=
            v_city_row.id IS NOT NULL
            AND v_city_row.mayor_party_id   = v_pol.politician_party_id
            AND v_city_row.mayor_first_name = v_pol.leader_first_name
            AND v_city_row.mayor_last_name  = v_pol.leader_last_name;
        IF v_was_incumbent THEN
            SELECT first_name_pool, last_name_pool INTO v_first_pool, v_last_pool
              FROM nations WHERE id = v_pol.nation_id;
            v_evict_first := COALESCE(pick_random_pool_name(v_first_pool), 'Mayor');
            v_evict_last  := COALESCE(pick_random_pool_name(v_last_pool),  'Smith');
            UPDATE cities
               SET mayor_first_name    = v_evict_first,
                   mayor_last_name     = v_evict_last,
                   mayor_age           = 35 + floor(random() * 31)::int,
                   mayor_archetype     = NULL,
                   mayor_party_id      = NULL,
                   mayor_term_end_tick = NULL
             WHERE id = v_race.city_id;
            UPDATE factions
               SET politician_office             = NULL,
                   politician_office_won_at_tick = NULL
             WHERE id = v_pol.id;

            -- 20270724: pull the +3 ceiling bonus back. GREATEST(0,
            -- ...) is defensive against accounting drift; the LEAST
            -- pop clamp keeps it from ranging above the new cap.
            -- v_pol.politician_party_id can be NULL (player left
            -- party while mayor) — UPDATE WHERE then matches nothing
            -- and the subtraction is silently skipped. That's an
            -- accepted edge from 20270719.
            UPDATE factions
               SET popularity_cap_pct = GREATEST(0, COALESCE(popularity_cap_pct, 0) - 3),
                   popularity_pct     = LEAST(
                       GREATEST(0, COALESCE(popularity_cap_pct, 0) - 3),
                       COALESCE(popularity_pct, 0)
                   )
             WHERE id = v_pol.politician_party_id
               AND faction_type = 'movement_party'
               AND abandoned_at IS NULL;

            v_city_stamp := jsonb_build_object(
                'city_id',                  v_race.city_id,
                'evicted',                  true,
                'new_mayor',                v_evict_first || ' ' || v_evict_last,
                'popularity_cap_delta',     -3
            );
        END IF;
    END IF;

    INSERT INTO politician_career_events (
        faction_id, event_tick, event_type, target_name, metadata
    ) VALUES (
        v_pol.id, v_tick, v_event, v_race.district,
        jsonb_build_object(
            'race_tier',              v_race.race_tier,
            'district',               v_race.district,
            'opponent',               v_opp_full,
            'opp_party_name',         v_race.opp_party_name,
            'polling_you',            v_race.polling_you_pct,
            'polling_opp',            v_race.polling_opp_pct,
            'political_capital_delta', v_actual_delta,
            'party_reward',           v_party_reward,
            'party_penalty',          v_party_penalty,
            'stat_reward',            v_stat_reward,
            'office_gained',          v_office,
            'city_id',                v_race.city_id,
            'city_stamp',             v_city_stamp
        )
    );
    DELETE FROM politician_active_election WHERE politician_id = v_pol.id;
    RETURN jsonb_build_object(
        'success',                true,
        'resolved',               true,
        'won',                    v_won,
        'race_tier',              v_race.race_tier,
        'district',               v_race.district,
        'opponent',               v_opp_full,
        'opp_party_name',         v_race.opp_party_name,
        'polling_you',            v_race.polling_you_pct,
        'polling_opp',            v_race.polling_opp_pct,
        'political_capital_delta', v_actual_delta,
        'politician_influence',   v_new_cap,
        'party_reward',           v_party_reward,
        'party_penalty',          v_party_penalty,
        'stat_reward',            v_stat_reward,
        'office_gained',          v_office,
        'city_stamp',             v_city_stamp
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.politician_resolve_due_elections() TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
