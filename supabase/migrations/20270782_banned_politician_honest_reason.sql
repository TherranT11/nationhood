-- ════════════════════════════════════════════════════════════════════
-- 20270782 — Politician onboarding: tell banned players the truth
--
-- Bug report: a player logs in, gets routed to the faction chooser as
-- if they own nothing, picks Politician, and is then refused with
-- "You already hold a politician in this nation." The contradiction:
--
--   • login.html counts a faction as owned only when it passes
--     isFactionInactive() — which treats is_banned rows as inactive —
--     so a banned politician routes its owner to the chooser.
--   • create_politician_with_tier_stats' pre-check counts ANY
--     non-abandoned politician row, banned or not, and replies
--     'already_in_nation'.
--
-- A banned row is therefore invisible at login but blocking at
-- creation, and the player ping-pongs with a message that reads like
-- a bug. The ban itself should keep blocking creation (otherwise a
-- ban is dodged by re-rolling a fresh politician in the same nation)
-- — the fix is honesty: return a distinct 'banned_in_nation' reason
-- and let first-steps.html say what actually happened.
--
-- Body byte-faithful to 20270729 except the pre-check SELECTs
-- is_banned and branches the reason. (The companion client fix in
-- login.html stops a silently-failed faction read from also dumping
-- existing players into the chooser.)
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.create_politician_with_tier_stats(
    p_nation_id  uuid,
    p_first_name text,
    p_last_name  text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid             uuid := auth.uid();
    v_nation          nations%ROWTYPE;
    v_tick            int;
    v_existing        uuid;
    v_existing_banned boolean;
    v_primary         uuid;
    v_is_linked       boolean;
    v_faction_id      uuid;
    v_first           text;
    v_last            text;
    v_n               int;
    v_pos             int;
    v_a_size          int;
    v_c_size          int;
    v_tier            text;
    v_age             int;
    v_skill           int;
    v_rep             int;
    v_cap             int;
    v_inf             int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    v_first := btrim(COALESCE(p_first_name, ''));
    v_last  := btrim(COALESCE(p_last_name,  ''));
    IF length(v_first) < 1 OR length(v_last) < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_name');
    END IF;

    SELECT * INTO v_nation FROM nations WHERE id = p_nation_id;
    IF v_nation.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_not_found');
    END IF;
    IF v_nation.foundable_for_politician IS NOT TRUE THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_foundable');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- 20270782: a banned (but not abandoned) politician still blocks
    -- creation — a ban must not be dodgeable by re-rolling — but the
    -- player gets the real reason instead of "already hold".
    SELECT id, COALESCE(is_banned, false) INTO v_existing, v_existing_banned
      FROM factions
     WHERE faction_type = 'politician'
       AND nation_id    = p_nation_id
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     LIMIT 1;
    IF v_existing IS NOT NULL THEN
        RETURN jsonb_build_object('success', false,
            'reason', CASE WHEN v_existing_banned THEN 'banned_in_nation'
                           ELSE 'already_in_nation' END);
    END IF;

    -- Tier algorithm: rank foundable_for_politician nations by active-
    -- politician count DESC; top third → A, bottom third → C, middle
    -- → B. random() tiebreak on equal counts so a flat field doesn't
    -- always slot the same nation into A. With N=4 you get pos
    -- 0 → A, pos 1-2 → B, pos 3 → C — exactly one of each tier with
    -- a middle band. N=1 → A; N=2 → A/C. Mirrored client-side in
    -- first-steps.html's computeTierMap.
    WITH counts AS (
        SELECT n.id AS nation_id,
               COUNT(f.id) FILTER (
                   WHERE f.faction_type = 'politician'
                     AND f.abandoned_at IS NULL
               ) AS pol_count
          FROM nations n
          LEFT JOIN factions f ON f.nation_id = n.id
         WHERE n.foundable_for_politician = TRUE
         GROUP BY n.id
    ),
    ranked AS (
        SELECT nation_id,
               ROW_NUMBER() OVER (ORDER BY pol_count DESC, random()) - 1 AS pos,
               COUNT(*)    OVER ()                                      AS total
          FROM counts
    )
    SELECT pos, total INTO v_pos, v_n
      FROM ranked WHERE nation_id = p_nation_id;

    IF v_n IS NULL OR v_n <= 1 THEN
        v_tier := 'A';
    ELSIF v_n = 2 THEN
        v_tier := CASE WHEN v_pos = 0 THEN 'A' ELSE 'C' END;
    ELSE
        v_a_size := GREATEST(1, FLOOR(v_n::numeric / 3.0)::int);
        v_c_size := GREATEST(1, FLOOR(v_n::numeric / 3.0)::int);
        IF v_pos < v_a_size THEN
            v_tier := 'A';
        ELSIF v_pos >= (v_n - v_c_size) THEN
            v_tier := 'C';
        ELSE
            v_tier := 'B';
        END IF;
    END IF;

    -- 20270710 stat values, unchanged.
    IF v_tier = 'A' THEN
        v_age := 25; v_skill := 1;  v_rep := 1;  v_cap := 1;  v_inf := 10;
    ELSIF v_tier = 'B' THEN
        v_age := 45; v_skill := 30; v_rep := 15; v_cap := 7;  v_inf := 40;
    ELSE -- 'C'
        v_age := 50; v_skill := 50; v_rep := 30; v_cap := 15; v_inf := 80;
    END IF;

    SELECT id INTO v_primary FROM factions
     WHERE id = v_uid AND abandoned_at IS NULL
     LIMIT 1;
    v_is_linked  := v_primary IS NOT NULL;
    v_faction_id := CASE WHEN v_is_linked THEN gen_random_uuid() ELSE v_uid END;

    BEGIN
        IF v_is_linked THEN
            INSERT INTO factions (
                id, faction_type, faction_name,
                nation_id, nation,
                seats, action_points, party_funds,
                abandoned_at,
                leader_first_name, leader_last_name, leader_age,
                founded_tick,
                politician_skill, politician_reputation,
                politician_capital, politician_influence,
                linked_user_id
            ) VALUES (
                v_faction_id, 'politician',
                v_first || ' ' || v_last,
                p_nation_id, v_nation.name,
                0, 0, 0,
                NULL,
                v_first, v_last, v_age,
                v_tick,
                v_skill, v_rep,
                v_cap, v_inf,
                v_uid
            );
        ELSE
            INSERT INTO factions (
                id, faction_type, faction_name,
                nation_id, nation,
                seats, action_points, party_funds,
                abandoned_at,
                leader_first_name, leader_last_name, leader_age,
                founded_tick,
                politician_skill, politician_reputation,
                politician_capital, politician_influence,
                linked_user_id
            ) VALUES (
                v_faction_id, 'politician',
                v_first || ' ' || v_last,
                p_nation_id, v_nation.name,
                0, 0, 0,
                NULL,
                v_first, v_last, v_age,
                v_tick,
                v_skill, v_rep,
                v_cap, v_inf,
                NULL
            )
            ON CONFLICT (id) DO UPDATE SET
                faction_type          = EXCLUDED.faction_type,
                faction_name          = EXCLUDED.faction_name,
                nation_id             = EXCLUDED.nation_id,
                nation                = EXCLUDED.nation,
                seats                 = EXCLUDED.seats,
                action_points         = EXCLUDED.action_points,
                party_funds           = EXCLUDED.party_funds,
                abandoned_at          = NULL,
                leader_first_name     = EXCLUDED.leader_first_name,
                leader_last_name      = EXCLUDED.leader_last_name,
                leader_age            = EXCLUDED.leader_age,
                founded_tick          = EXCLUDED.founded_tick,
                politician_skill      = EXCLUDED.politician_skill,
                politician_reputation = EXCLUDED.politician_reputation,
                politician_capital    = EXCLUDED.politician_capital,
                politician_influence  = EXCLUDED.politician_influence,
                linked_user_id        = NULL;
        END IF;
    EXCEPTION WHEN unique_violation THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_in_nation');
    END;

    RETURN jsonb_build_object(
        'success',    true,
        'faction_id', v_faction_id,
        'tier',       v_tier
    );
END $$;

GRANT EXECUTE ON FUNCTION public.create_politician_with_tier_stats(uuid, text, text) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
