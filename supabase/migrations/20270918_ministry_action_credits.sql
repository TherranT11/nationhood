-- ════════════════════════════════════════════════════════════════════
-- 20270918 — Ministry action credits: the yearly allowance, wired
--
-- Each major ministry gets a per-year action allowance: 7 base + the
-- National Focus grant (Domestic → Econ Dev + Interior +1; Diplomatic →
-- Foreign Affairs +3; Military → Defense +3). Spending a ministry action
-- decrements the counter; at 0 the actions are spent. The allowance
-- refills to 7 + bonus every January.
--
-- Lazy throughout (no tick sweep): 12 ticks = 1 game year (tickToDate —
-- tick % 12 is the month, tick / 12 the year), so when the stored
-- refill_year falls behind floor(tick/12), the next touch tops the
-- counter back up. The focus bonus is baked in AT the refill — changing
-- focus mid-year affects NEXT January's allowance, not the current pool.
--
-- Who may spend (per the design call): that ministry's minister, or the
-- Head of Government. Foreign Affairs' minister is the dedicated post
-- (politician_foreign_minister_at_tick); the other three are matched by
-- name against the ministries row (the same match the page's access
-- gate uses). Slugs are the canonical _major_ministry_keys().
--
-- The table is RPC-only (RLS on, no policies): the page reads through
-- get_ministry_credits and writes through spend_ministry_action, both
-- SECURITY DEFINER.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE TABLE IF NOT EXISTS public.ministry_action_credits (
    nation_id    uuid NOT NULL REFERENCES public.nations(id) ON DELETE CASCADE,
    ministry_key text NOT NULL,
    remaining    int  NOT NULL DEFAULT 7,
    refill_year  int  NOT NULL DEFAULT -1,   -- last game-year topped up; -1 forces a first fill
    PRIMARY KEY (nation_id, ministry_key)
);
ALTER TABLE public.ministry_action_credits ENABLE ROW LEVEL SECURITY;
-- No policies: only the SECURITY DEFINER RPCs below touch the table.

-- The focus bonus per ministry — one source, used at refill time.
CREATE OR REPLACE FUNCTION public._ministry_focus_bonus(p_ministry_key text, p_focus text)
RETURNS int LANGUAGE sql IMMUTABLE
AS $$
    SELECT CASE
        WHEN p_focus = 'domestic'   AND p_ministry_key IN ('economic_development', 'interior') THEN 1
        WHEN p_focus = 'diplomatic' AND p_ministry_key = 'foreign_affairs' THEN 3
        WHEN p_focus = 'military'   AND p_ministry_key = 'defense'         THEN 3
        ELSE 0
    END;
$$;

-- Lazy annual refill + read: upsert the row, topping the counter back up
-- to 7 + focus bonus only when the game year has rolled over. Returns the
-- current remaining. Caller is SECURITY DEFINER.
CREATE OR REPLACE FUNCTION public._ministry_refill(p_nation_id uuid, p_ministry_key text)
RETURNS int
LANGUAGE plpgsql
AS $$
DECLARE
    v_tick  int;
    v_year  int;
    v_focus text;
    v_allow int;
    v_out   int;
BEGIN
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_year := floor(COALESCE(v_tick, 0) / 12.0)::int;
    SELECT national_focus INTO v_focus FROM administrations
     WHERE nation_id = p_nation_id AND ended_at_tick IS NULL
     ORDER BY started_at_tick DESC NULLS LAST LIMIT 1;
    v_allow := 7 + _ministry_focus_bonus(p_ministry_key, COALESCE(v_focus, 'domestic'));

    INSERT INTO ministry_action_credits AS c (nation_id, ministry_key, remaining, refill_year)
         VALUES (p_nation_id, p_ministry_key, v_allow, v_year)
    ON CONFLICT (nation_id, ministry_key) DO UPDATE
         SET remaining   = CASE WHEN c.refill_year < EXCLUDED.refill_year
                                THEN EXCLUDED.remaining ELSE c.remaining END,
             refill_year = GREATEST(c.refill_year, EXCLUDED.refill_year)
    RETURNING remaining INTO v_out;
    RETURN v_out;
END $$;

-- Page read: the four ministries' current remaining (refilled lazily).
CREATE OR REPLACE FUNCTION public.get_ministry_credits(p_nation_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_out jsonb := '{}'::jsonb; v_key text;
BEGIN
    IF p_nation_id IS NULL THEN RETURN v_out; END IF;
    FOREACH v_key IN ARRAY _major_ministry_keys() LOOP
        v_out := v_out || jsonb_build_object(v_key, _ministry_refill(p_nation_id, v_key));
    END LOOP;
    RETURN v_out;
END $$;

-- Spend one action: that ministry's minister or the HoG, decrement at >0.
CREATE OR REPLACE FUNCTION public.spend_ministry_action(p_nation_id uuid, p_ministry_key text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid         uuid := auth.uid();
    v_hog_fac     uuid;
    v_authorized  boolean := false;
    v_remaining   int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF NOT (p_ministry_key = ANY (_major_ministry_keys())) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_ministry');
    END IF;

    -- Head of Government may spend any ministry's actions.
    SELECT faction_id INTO v_hog_fac FROM head_of_government
     WHERE nation_id = p_nation_id AND active = true LIMIT 1;
    IF v_hog_fac IS NOT NULL AND EXISTS (
         SELECT 1 FROM factions WHERE id = v_hog_fac AND (id = v_uid OR linked_user_id = v_uid)) THEN
        v_authorized := true;
    END IF;

    -- Otherwise the minister of this ministry: Foreign Affairs via the
    -- dedicated post, the rest by name against the ministries row.
    IF NOT v_authorized AND p_ministry_key = 'foreign_affairs' THEN
        v_authorized := EXISTS (
            SELECT 1 FROM factions f
             WHERE (f.id = v_uid OR f.linked_user_id = v_uid)
               AND f.nation_id = p_nation_id
               AND f.politician_foreign_minister_at_tick IS NOT NULL);
    ELSIF NOT v_authorized THEN
        v_authorized := EXISTS (
            SELECT 1 FROM ministries m
              JOIN factions f
                ON lower(trim(f.leader_first_name)) = lower(trim(m.minister_first_name))
               AND lower(trim(f.leader_last_name))  = lower(trim(m.minister_last_name))
             WHERE m.nation_id = p_nation_id AND m.ministry_key = p_ministry_key
               AND m.is_active = true
               AND (f.id = v_uid OR f.linked_user_id = v_uid)
               AND f.nation_id = p_nation_id);
    END IF;

    IF NOT v_authorized THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authorized');
    END IF;

    v_remaining := _ministry_refill(p_nation_id, p_ministry_key);
    IF v_remaining <= 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions', 'remaining', 0);
    END IF;

    UPDATE ministry_action_credits
       SET remaining = remaining - 1
     WHERE nation_id = p_nation_id AND ministry_key = p_ministry_key
     RETURNING remaining INTO v_remaining;
    RETURN jsonb_build_object('success', true, 'remaining', v_remaining);
END $$;

-- Internal helpers (one of which writes) — never client-callable; the
-- SECURITY DEFINER RPCs reach them as the table owner.
REVOKE EXECUTE ON FUNCTION public._ministry_focus_bonus(text, text)   FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public._ministry_refill(uuid, text)        FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_ministry_credits(uuid)        FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.spend_ministry_action(uuid, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_ministry_credits(uuid)        TO authenticated;
GRANT  EXECUTE ON FUNCTION public.spend_ministry_action(uuid, text) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
