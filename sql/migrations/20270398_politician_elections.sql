-- ════════════════════════════════════════════════════════════════════
-- STAND FOR ELECTION — offer slate + active race + resolve-on-tick
-- ════════════════════════════════════════════════════════════════════
-- First electoral action for a card-carrying politician. Two-stage flow:
--
--   1. politician_get_election_offer  — modal open. Returns the current
--      offer slate (community + parliament race). Generates lazily if no
--      offer exists. Persisted so closing/reopening the modal is stable.
--
--   2. politician_stand_for_election  — CONFIRM. Copies the chosen tier
--      from the offer onto politician_active_election, deletes the offer,
--      stamps next_member_action_tick (the 1-per-turn gate from 20270382).
--
--   3. politician_resolve_due_elections — called on politician page loads.
--      For any active_election whose resolve_tick has passed, rolls the
--      win check, applies the influence delta, logs a career event,
--      deletes the row.
--
-- ── Race economy (per design lock-in) ──
--   Community  (low stakes):  cred-driven  · resolves +1 tick · +1 / 0
--   Parliament (high stakes): cha-driven   · resolves +2 ticks · +3 / -4
--
--   Odds: clamp(15, 50 + 10*(your_stat - opp_stat), 85). Opponent stat is
--   rolled relative to the politician's (random -2..+2, clamped >= 1) so
--   matchups are usually close but can mismatch either way.
--
-- ── Generation sources ──
--   Opponent first + last:  nations.first_name_pool / last_name_pool
--   District stem:          random last_name pool entry (place-name-like
--                           by accident in most cultures, and varies by
--                           nation pool seeding — keeps it on-theme).
--   Community suffix:       ward / quarter list
--   Parliament suffix:      directional list
--   Parliament opp party:   random OTHER movement_party in same nation,
--                           or NULL (Independent) if there isn't one.
--
-- ── Schema notes ──
-- One row per politician in each table (politician_id is PK). A politician
-- can have at most one active race at a time and one offer slate at a
-- time; concurrent offer generation collapses via ON CONFLICT DO NOTHING.
--
-- Opponent party fields are denormalised snapshots (same approach
-- politician_career_events takes with target_name) so a rename / abandon
-- doesn't corrupt an in-flight race or a historical event.
--
-- Stakes + odds + your_stat are snapshotted at commit time so a stat
-- drift between commit and resolve (e.g. a speech in between) doesn't
-- silently change the race the politician agreed to.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── Tables ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS politician_election_offers (
    politician_id          uuid PRIMARY KEY REFERENCES factions(id) ON DELETE CASCADE,
    shard_id               uuid NOT NULL,
    generated_tick         int  NOT NULL,
    -- community race
    com_district           text NOT NULL,
    com_opp_first          text NOT NULL,
    com_opp_last           text NOT NULL,
    com_opp_blurb          text NOT NULL,
    com_your_stat          int  NOT NULL,
    com_opp_stat           int  NOT NULL,
    com_odds_pct           int  NOT NULL,
    -- parliament race
    parl_district          text NOT NULL,
    parl_opp_first         text NOT NULL,
    parl_opp_last          text NOT NULL,
    parl_opp_blurb         text NOT NULL,
    parl_opp_party_name    text,
    parl_opp_party_abbr    text,
    parl_opp_party_color   text,
    parl_your_stat         int  NOT NULL,
    parl_opp_stat          int  NOT NULL,
    parl_odds_pct          int  NOT NULL,
    created_at             timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS politician_active_election (
    politician_id          uuid PRIMARY KEY REFERENCES factions(id) ON DELETE CASCADE,
    shard_id               uuid NOT NULL,
    race_tier              text NOT NULL CHECK (race_tier IN ('community','parliament')),
    district               text NOT NULL,
    opp_first              text NOT NULL,
    opp_last               text NOT NULL,
    opp_blurb              text NOT NULL,
    opp_party_name         text,
    opp_party_abbr         text,
    opp_party_color        text,
    your_stat              int  NOT NULL,
    opp_stat               int  NOT NULL,
    win_odds_pct           int  NOT NULL,
    stake_win              int  NOT NULL,
    stake_lose             int  NOT NULL,
    committed_tick         int  NOT NULL,
    resolve_tick           int  NOT NULL,
    created_at             timestamptz NOT NULL DEFAULT now()
);

-- Politician careers are public; both tables are caller-reads-own via the
-- RPCs. Direct table reads are not part of the contract.
ALTER TABLE politician_election_offers   ENABLE ROW LEVEL SECURITY;
ALTER TABLE politician_active_election   ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read offers" ON politician_election_offers;
CREATE POLICY "Authenticated read offers" ON politician_election_offers
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated read active" ON politician_active_election;
CREATE POLICY "Authenticated read active" ON politician_active_election
    FOR SELECT TO authenticated USING (true);

-- ── RPC: get the current offer slate (generate if missing) ──────────
--
-- Returns null fields with success=false if the politician currently has
-- an active race in flight (the offer surface is for picking a race, not
-- a second race — they need to wait for resolution).
CREATE OR REPLACE FUNCTION public.politician_get_election_offer(p_party_id uuid)
RETURNS jsonb
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
    -- generation buffers
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
    v_parl_opp_party_abbr  text;
    v_parl_opp_party_color text;
    -- flavor pools (kept inline; promoted to a table if/when a 2nd surface
    -- needs them).
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

    SELECT * INTO v_pol FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND politician_party_id = p_party_id
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1;
    IF v_pol.id IS NULL THEN
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

    -- Return existing offer verbatim if one is already on file.
    SELECT * INTO v_offer FROM politician_election_offers WHERE politician_id = v_pol.id;
    IF v_offer.politician_id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', true,
            'generated_tick', v_offer.generated_tick,
            'community',  jsonb_build_object(
                'district',  v_offer.com_district,
                'opp_first', v_offer.com_opp_first,
                'opp_last',  v_offer.com_opp_last,
                'opp_blurb', v_offer.com_opp_blurb,
                'your_stat', v_offer.com_your_stat,
                'opp_stat',  v_offer.com_opp_stat,
                'odds_pct',  v_offer.com_odds_pct,
                'stake_win', 1,
                'stake_lose', 0
            ),
            'parliament', jsonb_build_object(
                'district',  v_offer.parl_district,
                'opp_first', v_offer.parl_opp_first,
                'opp_last',  v_offer.parl_opp_last,
                'opp_blurb', v_offer.parl_opp_blurb,
                'opp_party_name',  v_offer.parl_opp_party_name,
                'opp_party_abbr',  v_offer.parl_opp_party_abbr,
                'opp_party_color', v_offer.parl_opp_party_color,
                'your_stat', v_offer.parl_your_stat,
                'opp_stat',  v_offer.parl_opp_stat,
                'odds_pct',  v_offer.parl_odds_pct,
                'stake_win', 3,
                'stake_lose', -4
            )
        );
    END IF;

    -- Generate a fresh slate. Nation pools first.
    SELECT * INTO v_nation FROM nations WHERE id = v_pol.nation_id;
    IF v_nation.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_nation');
    END IF;

    v_first_len := GREATEST(COALESCE(array_length(v_nation.first_name_pool, 1), 0), 1);
    v_last_len  := GREATEST(COALESCE(array_length(v_nation.last_name_pool,  1), 0), 1);

    -- District = random last-pool entry + suffix from the tier-appropriate list.
    -- Falls back to nation name as the stem if last_name_pool is empty.
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

    -- Snapshot the politician's tier-driving stats. Opponent stat = your stat
    -- + random[-2..2], clamped >= 1.
    v_com_your  := COALESCE(v_pol.politician_credibility, 1);
    v_com_opp   := GREATEST(1, v_com_your  + floor(random() * 5)::int - 2);
    v_parl_your := COALESCE(v_pol.politician_charisma, 1);
    v_parl_opp  := GREATEST(1, v_parl_your + floor(random() * 5)::int - 2);

    v_com_odds  := GREATEST(15, LEAST(85, 50 + 10 * (v_com_your  - v_com_opp )));
    v_parl_odds := GREATEST(15, LEAST(85, 50 + 10 * (v_parl_your - v_parl_opp)));

    -- Parliament opponent's party = random OTHER movement_party in the
    -- same nation (snapshot name/abbr/color). NULL falls through to
    -- Independent display.
    SELECT faction_name, abbreviation, party_color
      INTO v_parl_opp_party_name, v_parl_opp_party_abbr, v_parl_opp_party_color
      FROM factions
     WHERE nation_id = v_pol.nation_id
       AND faction_type = 'movement_party'
       AND id <> p_party_id
       AND abandoned_at IS NULL
     ORDER BY random() LIMIT 1;

    INSERT INTO politician_election_offers (
        politician_id, shard_id, generated_tick,
        com_district, com_opp_first, com_opp_last, com_opp_blurb,
        com_your_stat, com_opp_stat, com_odds_pct,
        parl_district, parl_opp_first, parl_opp_last, parl_opp_blurb,
        parl_opp_party_name, parl_opp_party_abbr, parl_opp_party_color,
        parl_your_stat, parl_opp_stat, parl_odds_pct
    ) VALUES (
        v_pol.id, v_shard_id, v_tick,
        v_com_district, v_com_opp_first, v_com_opp_last, v_com_opp_blurb,
        v_com_your, v_com_opp, v_com_odds,
        v_parl_district, v_parl_opp_first, v_parl_opp_last, v_parl_opp_blurb,
        v_parl_opp_party_name, v_parl_opp_party_abbr, v_parl_opp_party_color,
        v_parl_your, v_parl_opp, v_parl_odds
    )
    -- A concurrent get-offer call could race this insert. The losing
    -- insert silently no-ops; the SELECT below re-reads the winning row
    -- so both callers walk away with the same slate.
    ON CONFLICT (politician_id) DO NOTHING;

    SELECT * INTO v_offer FROM politician_election_offers WHERE politician_id = v_pol.id;

    RETURN jsonb_build_object(
        'success', true,
        'generated_tick', v_offer.generated_tick,
        'community',  jsonb_build_object(
            'district',  v_offer.com_district,
            'opp_first', v_offer.com_opp_first,
            'opp_last',  v_offer.com_opp_last,
            'opp_blurb', v_offer.com_opp_blurb,
            'your_stat', v_offer.com_your_stat,
            'opp_stat',  v_offer.com_opp_stat,
            'odds_pct',  v_offer.com_odds_pct,
            'stake_win', 1,
            'stake_lose', 0
        ),
        'parliament', jsonb_build_object(
            'district',  v_offer.parl_district,
            'opp_first', v_offer.parl_opp_first,
            'opp_last',  v_offer.parl_opp_last,
            'opp_blurb', v_offer.parl_opp_blurb,
            'opp_party_name',  v_offer.parl_opp_party_name,
            'opp_party_abbr',  v_offer.parl_opp_party_abbr,
            'opp_party_color', v_offer.parl_opp_party_color,
            'your_stat', v_offer.parl_your_stat,
            'opp_stat',  v_offer.parl_opp_stat,
            'odds_pct',  v_offer.parl_odds_pct,
            'stake_win', 3,
            'stake_lose', -4
        )
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.politician_get_election_offer(uuid) TO authenticated;

-- ── RPC: commit to a race ───────────────────────────────────────────
--
-- Consumes the 1-per-turn member-action gate (next_member_action_tick),
-- same as door_knock / give_speech. Deletes the offer slate (both races
-- expire when one is chosen). Sets resolve_tick to commit + 1 (community)
-- or commit + 2 (parliament).
CREATE OR REPLACE FUNCTION public.politician_stand_for_election(p_party_id uuid, p_tier text)
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
    v_opp_pabbr text;
    v_opp_pcol  text;
    v_your      int;
    v_opp       int;
    v_odds      int;
    v_win       int;
    v_lose      int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_tier NOT IN ('community','parliament') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_tier');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND politician_party_id = p_party_id
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_member');
    END IF;

    SELECT current_tick, id INTO v_tick, v_shard_id FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;

    -- Block if already in a race.
    IF EXISTS (SELECT 1 FROM politician_active_election WHERE politician_id = v_pol.id) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'race_in_progress');
    END IF;

    -- 1-per-turn gate.
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
        v_opp_pname := NULL; v_opp_pabbr := NULL; v_opp_pcol := NULL;
        v_your      := v_offer.com_your_stat;
        v_opp       := v_offer.com_opp_stat;
        v_odds      := v_offer.com_odds_pct;
        v_win       := 1; v_lose := 0;
        v_resolve   := v_tick + 1;
    ELSE
        v_district  := v_offer.parl_district;
        v_opp_first := v_offer.parl_opp_first;
        v_opp_last  := v_offer.parl_opp_last;
        v_opp_blurb := v_offer.parl_opp_blurb;
        v_opp_pname := v_offer.parl_opp_party_name;
        v_opp_pabbr := v_offer.parl_opp_party_abbr;
        v_opp_pcol  := v_offer.parl_opp_party_color;
        v_your      := v_offer.parl_your_stat;
        v_opp       := v_offer.parl_opp_stat;
        v_odds      := v_offer.parl_odds_pct;
        v_win       := 3; v_lose := -4;
        v_resolve   := v_tick + 2;
    END IF;

    INSERT INTO politician_active_election (
        politician_id, shard_id, race_tier, district,
        opp_first, opp_last, opp_blurb,
        opp_party_name, opp_party_abbr, opp_party_color,
        your_stat, opp_stat, win_odds_pct, stake_win, stake_lose,
        committed_tick, resolve_tick
    ) VALUES (
        v_pol.id, v_shard_id, p_tier, v_district,
        v_opp_first, v_opp_last, v_opp_blurb,
        v_opp_pname, v_opp_pabbr, v_opp_pcol,
        v_your, v_opp, v_odds, v_win, v_lose,
        v_tick, v_resolve
    );

    DELETE FROM politician_election_offers WHERE politician_id = v_pol.id;

    v_next := v_tick + 1;
    UPDATE factions
       SET next_member_action_tick = v_next
     WHERE id = v_pol.id;

    RETURN jsonb_build_object(
        'success', true,
        'race_tier', p_tier,
        'district', v_district,
        'opp_full_name', v_opp_first || ' ' || v_opp_last,
        'win_odds_pct', v_odds,
        'committed_tick', v_tick,
        'resolve_tick', v_resolve,
        'next_member_action_tick', v_next
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.politician_stand_for_election(uuid, text) TO authenticated;

-- ── RPC: resolve any race whose resolve_tick has arrived ────────────
--
-- Called on politician page loads (politician-career, politician-home).
-- No-ops when there's no active race, or when one exists but its
-- resolve_tick is still in the future. On resolution: roll, apply
-- influence delta (parliament losses can drop influence below 0; that's
-- the design — influence floors at 0 elsewhere but a parliamentary loss
-- is meant to sting, so we apply the raw delta and let the floor catch
-- it at next read).
--
-- Wait — re-checking 20270381's give_speech: influence is GREATEST(0,
-- existing + delta) so it floors at 0 on write. Mirroring that here for
-- consistency; a -4 loss against influence 2 lands at 0, not -2. The
-- player still feels the loss (zero) but doesn't owe back-influence.
CREATE OR REPLACE FUNCTION public.politician_resolve_due_elections()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_pol     factions%ROWTYPE;
    v_tick    int;
    v_race    politician_active_election%ROWTYPE;
    v_roll    int;
    v_won     boolean;
    v_delta   int;
    v_new_inf numeric;
    v_event   text;
    v_opp_full text;
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
        RETURN jsonb_build_object('success', true, 'resolved', false, 'reason', 'no_politician');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', true, 'resolved', false, 'reason', 'no_shard');
    END IF;

    SELECT * INTO v_race FROM politician_active_election WHERE politician_id = v_pol.id;
    IF v_race.politician_id IS NULL THEN
        RETURN jsonb_build_object('success', true, 'resolved', false);
    END IF;
    IF v_race.resolve_tick > v_tick THEN
        RETURN jsonb_build_object(
            'success', true, 'resolved', false,
            'race_tier', v_race.race_tier,
            'resolve_tick', v_race.resolve_tick,
            'current_tick', v_tick
        );
    END IF;

    v_roll := 1 + floor(random() * 100)::int;   -- 1..100
    v_won  := v_roll <= v_race.win_odds_pct;
    v_delta := CASE WHEN v_won THEN v_race.stake_win ELSE v_race.stake_lose END;
    v_event := CASE WHEN v_won THEN 'won_election' ELSE 'lost_election' END;
    v_opp_full := v_race.opp_first || ' ' || v_race.opp_last;

    UPDATE factions
       SET politician_influence = GREATEST(0, COALESCE(politician_influence, 0) + v_delta)
     WHERE id = v_pol.id
    RETURNING politician_influence INTO v_new_inf;

    INSERT INTO politician_career_events (
        faction_id, event_tick, event_type, target_name, metadata
    ) VALUES (
        v_pol.id, v_tick, v_event, v_race.district,
        jsonb_build_object(
            'race_tier',      v_race.race_tier,
            'district',       v_race.district,
            'opponent',       v_opp_full,
            'opp_party_name', v_race.opp_party_name,
            'win_odds_pct',   v_race.win_odds_pct,
            'roll',           v_roll,
            'influence_delta', v_delta
        )
    );

    DELETE FROM politician_active_election WHERE politician_id = v_pol.id;

    RETURN jsonb_build_object(
        'success',       true,
        'resolved',      true,
        'won',           v_won,
        'race_tier',     v_race.race_tier,
        'district',      v_race.district,
        'opponent',      v_opp_full,
        'opp_party_name', v_race.opp_party_name,
        'win_odds_pct',  v_race.win_odds_pct,
        'roll',          v_roll,
        'influence_delta', v_delta,
        'politician_influence', v_new_inf
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.politician_resolve_due_elections() TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
