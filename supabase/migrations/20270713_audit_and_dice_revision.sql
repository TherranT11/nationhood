-- ════════════════════════════════════════════════════════════════════
-- 20270713 — Audit fix + opponent dice revision
--
-- Pre-commit audit on 20270712 surfaced two issues + a dice spec
-- change from the user.
--
-- AUDIT FIX
--   • politician_register_for_office now rejects 'mayor' /
--     'mayor_of_capital' / 'regional_leader' when the politician
--     already holds that office. The 20270712 implementation let a
--     sitting mayor file for a different city; on win, the new
--     city's row was stamped but the old city's row was NOT
--     cleared (no faction→city back-reference exists), so the
--     player appeared as mayor of two cities. Until resign-from
--     -local-politics lands, the simplest correct behavior is to
--     refuse the re-run. Returns reason='already_holds_office'.
--
-- DICE REVISION — per user spec, opponent Experience formulas are:
--     Community Organizer   1 + 1d2  →  2..3
--     City Council Member   1d6 + 1  →  2..7   (already correct)
--     City Council President 1d6 + 5 →  6..11  (already correct)
--     Mayor                 45 + 1d10 → 46..55
--     Capital Mayor         55 + 1d10 → 56..65
--     Regional Leader       70 + 1d10 → 71..80
--
-- The CO change requires re-emitting politician_get_election_offer
-- (deferred in 20270709 due to ROI; bundled here now since we're
-- already on the re-emit path). Other tiers live on
-- politician_register_for_office, which is re-emitted alongside the
-- audit fix in one shot.
--
-- Note on PostgreSQL: floor(random() * 10)::int returns 0..9, so
-- "45 + 1d10" (1..10) is encoded as "46 + floor(random() * 10)::int"
-- (46..55), and so on for the other tiers. Verified against
-- 20270712's "6 + floor(random() * 10)::int" → 6..15 pattern.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. politician_register_for_office re-emit ─────────────────────
-- Body identical to 20270712's (the just-shipped p_city_id-aware
-- version) except for:
--   • Mayor / MotC / RL "already holds office" guard added to the
--     ELSIF branch.
--   • Mayor opp_stat dice: 46 + 1d10 (was 6 + 1d10).
--   • MotC  opp_stat dice: 56 + 1d10 (was 7 + 1d10).
--   • RL    opp_stat dice: 71 + 1d10 (was 11 + 1d15).
-- No signature change → CREATE OR REPLACE is enough; no DROP needed.
CREATE OR REPLACE FUNCTION public.politician_register_for_office(
    p_faction_id    uuid,
    p_target_office text,
    p_city_id       uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_pol          factions%ROWTYPE;
    v_tick         int;
    v_shard_id     uuid;
    v_first_pool   text[];
    v_last_pool    text[];
    v_opp_first    text;
    v_opp_last     text;
    v_opp_stat     int;
    v_your_stat    int;
    v_race_tier    text;
    v_resolve      int;
    v_next_elect   int;
    v_term_ticks   int;
    v_won_at       int;
    v_player_share numeric;
    v_poll_you     int;
    v_poll_opp     int;
    v_poll_und     int;
    v_next_action  int;
    v_district     text;
    v_opp_blurb    text;
    v_stake_win    int;
    v_stake_lose   int;
    v_exp_threshold int;
    v_city         cities%ROWTYPE;
    v_active_city  uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_target_office NOT IN (
        'city_council_member', 'senior_mp', 'city_council_president',
        'mayor', 'mayor_of_capital', 'regional_leader'
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_target_office');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid);
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.politician_party_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_in_party');
    END IF;
    IF v_pol.nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_nation');
    END IF;

    SELECT current_tick, id INTO v_tick, v_shard_id FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;

    IF EXISTS (SELECT 1 FROM politician_active_election WHERE politician_id = v_pol.id) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'race_in_progress');
    END IF;

    IF p_target_office = 'city_council_member' THEN
        IF COALESCE(v_pol.politician_skill, 0) < 20 THEN
            IF v_pol.politician_office <> 'community_organizer'
               AND COALESCE(v_pol.politician_former_community_organizer, FALSE) IS NOT TRUE THEN
                RETURN jsonb_build_object('success', false, 'reason', 'wrong_current_office',
                    'have', v_pol.politician_office, 'expected', 'community_organizer_now_or_past');
            END IF;
            IF v_pol.politician_office = 'community_organizer' THEN
                v_won_at := COALESCE(v_pol.politician_office_won_at_tick, v_tick);
                IF v_tick < v_won_at + 9 THEN
                    RETURN jsonb_build_object('success', false, 'reason', 'too_early',
                        'opens_at_tick', v_won_at + 9, 'current_tick', v_tick);
                END IF;
            END IF;
        END IF;
        v_race_tier  := 'city_council';
        v_your_stat  := COALESCE(v_pol.politician_skill, 1);
        v_opp_stat   := 2 + floor(random() * 6)::int;
        v_resolve    := v_tick + 1;
        v_district   := 'City Council seat';
        v_opp_blurb  := 'Independent challenger for the council seat';
        v_stake_win  := 0;
        v_stake_lose := 0;

    ELSIF p_target_office = 'city_council_president' THEN
        IF COALESCE(v_pol.politician_skill, 0) < 40 THEN
            IF v_pol.politician_office <> 'city_council_member' THEN
                RETURN jsonb_build_object('success', false, 'reason', 'wrong_current_office',
                    'have', v_pol.politician_office, 'expected', 'city_council_member');
            END IF;
            v_won_at := COALESCE(v_pol.politician_office_won_at_tick, v_tick);
            IF v_tick < v_won_at + 9 THEN
                RETURN jsonb_build_object('success', false, 'reason', 'too_early',
                    'opens_at_tick', v_won_at + 9, 'current_tick', v_tick);
            END IF;
        END IF;
        v_race_tier  := 'city_council_president';
        v_your_stat  := COALESCE(v_pol.politician_skill, 1);
        v_opp_stat   := 6 + floor(random() * 6)::int;
        v_resolve    := v_tick + 1;
        v_district   := 'City Council Presidency';
        v_opp_blurb  := 'Independent contender for the council chair';
        v_stake_win  := 3;
        v_stake_lose := 0;

    ELSIF p_target_office IN ('mayor', 'mayor_of_capital', 'regional_leader') THEN
        v_exp_threshold := CASE p_target_office
            WHEN 'mayor'             THEN 50
            WHEN 'mayor_of_capital'  THEN 60
            WHEN 'regional_leader'   THEN 75
        END;
        IF COALESCE(v_pol.politician_skill, 0) < v_exp_threshold THEN
            RETURN jsonb_build_object('success', false, 'reason', 'experience_too_low',
                'experience', COALESCE(v_pol.politician_skill, 0),
                'required',   v_exp_threshold);
        END IF;

        -- 20270713 audit fix: a sitting mayor / MotC / RL can't run
        -- for ANY local-executive tier again. Without resign-from
        -- -local-politics, a winning re-run would leave the prior
        -- city's row pointing at the player without a way to clear
        -- it. Blocking the whole tier band (rather than just the
        -- same office) keeps the invariant "one local-exec chair
        -- per politician at a time" tight; lifting it is a
        -- one-line change once resignation lands.
        IF v_pol.politician_office IN ('mayor', 'mayor_of_capital', 'regional_leader') THEN
            RETURN jsonb_build_object('success', false, 'reason', 'already_holds_office',
                'office', v_pol.politician_office);
        END IF;

        v_race_tier  := p_target_office;
        v_your_stat  := COALESCE(v_pol.politician_skill, 1);
        -- 20270713 dice revision per user spec.
        v_opp_stat   := CASE p_target_office
            WHEN 'mayor'             THEN 46 + floor(random() * 10)::int   -- 45 + 1d10 → 46..55
            WHEN 'mayor_of_capital'  THEN 56 + floor(random() * 10)::int   -- 55 + 1d10 → 56..65
            WHEN 'regional_leader'   THEN 71 + floor(random() * 10)::int   -- 70 + 1d10 → 71..80
        END;
        v_resolve    := v_tick + 1;

        IF p_target_office = 'mayor' THEN
            IF p_city_id IS NULL THEN
                RETURN jsonb_build_object('success', false, 'reason', 'city_required');
            END IF;
            SELECT * INTO v_city FROM cities
             WHERE id        = p_city_id
               AND nation_id = v_pol.nation_id
             LIMIT 1;
            IF v_city.id IS NULL THEN
                RETURN jsonb_build_object('success', false, 'reason', 'invalid_city');
            END IF;
            IF v_city.city_type = 'capital' THEN
                RETURN jsonb_build_object('success', false, 'reason', 'capital_blocked',
                    'detail', 'Use target_office=mayor_of_capital for the capital city.');
            END IF;
            v_active_city := v_city.id;
            v_district    := COALESCE(v_city.city_name, 'a city');
            v_opp_blurb   := 'Independent challenger for the ' || COALESCE(v_city.city_name, 'city') || ' mayoralty';
        ELSIF p_target_office = 'mayor_of_capital' THEN
            v_district   := 'Mayor of the Capital';
            v_opp_blurb  := 'Independent challenger for the capital''s mayoralty';
        ELSE  -- regional_leader
            v_district   := 'Regional Leader';
            v_opp_blurb  := 'Independent challenger for the regional leadership';
        END IF;

        v_stake_win  := 0;
        v_stake_lose := 0;

    ELSE  -- senior_mp
        IF v_pol.politician_office <> 'member_of_parliament' THEN
            RETURN jsonb_build_object('success', false, 'reason', 'wrong_current_office',
                'have', v_pol.politician_office, 'expected', 'member_of_parliament');
        END IF;
        SELECT next_election_tick, COALESCE(parliamentary_term_ticks, 24)
          INTO v_next_elect, v_term_ticks
          FROM nations WHERE id = v_pol.nation_id;
        IF v_next_elect IS NULL THEN
            RETURN jsonb_build_object('success', false, 'reason', 'no_general_election');
        END IF;
        IF v_pol.politician_office_won_at_tick IS NULL
           OR v_tick < v_pol.politician_office_won_at_tick + v_term_ticks THEN
            RETURN jsonb_build_object('success', false, 'reason', 'term_too_short',
                'won_at',           v_pol.politician_office_won_at_tick,
                'term_ticks',       v_term_ticks,
                'eligible_at_tick', COALESCE(v_pol.politician_office_won_at_tick, 0) + v_term_ticks,
                'current_tick',     v_tick);
        END IF;
        IF v_tick < v_next_elect - 6 THEN
            RETURN jsonb_build_object('success', false, 'reason', 'too_early',
                'opens_at_tick', v_next_elect - 6, 'current_tick', v_tick);
        END IF;
        IF v_tick > v_next_elect THEN
            RETURN jsonb_build_object('success', false, 'reason', 'window_closed',
                'last_open_tick', v_next_elect);
        END IF;
        v_race_tier  := 'senior_mp';
        v_your_stat  := COALESCE(v_pol.politician_skill, 1);
        v_opp_stat   := 1 + floor(random() * 6)::int;
        v_resolve    := v_next_elect;
        v_district   := 'Senior MP slot';
        v_opp_blurb  := 'Independent contender for the Senior MP nomination';
        v_stake_win  := 4;
        v_stake_lose := -3;
    END IF;

    SELECT first_name_pool, last_name_pool INTO v_first_pool, v_last_pool
      FROM nations WHERE id = v_pol.nation_id;
    v_opp_first := COALESCE(pick_random_pool_name(v_first_pool), 'Opponent');
    v_opp_last  := COALESCE(pick_random_pool_name(v_last_pool),  'Smith');

    v_player_share := v_your_stat::numeric / GREATEST(1, v_your_stat + v_opp_stat);
    v_poll_you     := ROUND(v_player_share * 85)::int;
    v_poll_opp     := 85 - v_poll_you;
    v_poll_und     := 15;

    INSERT INTO politician_active_election (
        politician_id, shard_id, race_tier, district,
        opp_first, opp_last, opp_blurb, opp_party_name,
        your_stat, opp_stat, win_odds_pct, stake_win, stake_lose,
        resolve_tick,
        polling_you_pct, polling_opp_pct, polling_undecided_pct,
        party_id, city_id
    ) VALUES (
        v_pol.id, v_shard_id, v_race_tier, v_district,
        v_opp_first, v_opp_last, v_opp_blurb, NULL,
        v_your_stat, v_opp_stat,
        GREATEST(1, LEAST(99, v_poll_you)),
        v_stake_win, v_stake_lose,
        v_resolve,
        v_poll_you, v_poll_opp, v_poll_und,
        v_pol.politician_party_id, v_active_city
    );

    v_next_action := v_tick + 1;
    UPDATE factions SET next_member_action_tick = v_next_action WHERE id = v_pol.id;

    INSERT INTO politician_career_events (
        faction_id, event_tick, event_type, target_name, metadata
    ) VALUES (
        v_pol.id, v_tick, 'stood_for_election', v_district,
        jsonb_build_object(
            'race_tier',      v_race_tier,
            'your_stat',      v_your_stat,
            'opp_stat',       v_opp_stat,
            'opponent',       v_opp_first || ' ' || v_opp_last,
            'resolve_tick',   v_resolve,
            'polling_you',    v_poll_you,
            'polling_opp',    v_poll_opp,
            'polling_und',    v_poll_und,
            'city_id',        v_active_city
        )
    );

    RETURN jsonb_build_object(
        'success',                true,
        'target_office',          p_target_office,
        'opponent',               v_opp_first || ' ' || v_opp_last,
        'resolve_tick',           v_resolve,
        'your_stat',              v_your_stat,
        'opp_stat',               v_opp_stat,
        'win_odds_pct',           GREATEST(1, LEAST(99, v_poll_you)),
        'next_member_action_tick',v_next_action,
        'city_id',                v_active_city,
        'district',               v_district
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.politician_register_for_office(uuid, text, uuid) TO authenticated;


-- ── 2. politician_get_election_offer re-emit ──────────────────────
-- Body byte-faithful to 20270665 except for ONE line: v_com_opp is
-- now 2 + 1d2 (per user spec) instead of player_skill ± random
-- offset. 20270709 deferred this re-emit ("re-emitting a 250-line
-- RPC for a single line change is bad ROI"); we're already on the
-- re-emit path for the Mayor/MotC/RL dice fix above so it costs
-- nothing extra to land here.
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
    -- 20270713: CO opponent Experience is now 1 + 1d2 (=2..3) per
    -- user spec — independent of the player's stat. Previously
    -- (20270665) was v_com_your + floor(random()*5)::int - 2 floored
    -- at 1 (relative ±2 scaling).
    v_com_opp   := 2 + floor(random() * 2)::int;
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


-- ── 3. Clear cached CO offers so the new dice take effect ─────────
-- politician_get_election_offer caches the rolled offer on
-- politician_election_offers; a row pre-dating this migration will
-- still serve the old player-relative numbers until the politician
-- stands for that offer (which deletes the row) or it ages out.
-- Forward-only nuke: drop every cached offer that hasn't been
-- committed to an active race yet. politicians without an active
-- race will see a fresh roll on next open.
DELETE FROM public.politician_election_offers
 WHERE politician_id NOT IN (
       SELECT politician_id FROM public.politician_active_election
   );

NOTIFY pgrst, 'reload schema';

COMMIT;
