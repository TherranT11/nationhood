-- ════════════════════════════════════════════════════════════════════
-- WRITE ARTICLE → sector popularity (replaces the momentum reward)
-- ════════════════════════════════════════════════════════════════════
-- Design change (2.6.5): a party's Write Article now targets a sector +
-- a party (including its own) and moves that party's sector popularity
-- by ±0.3 — own party +0.3, any other party −0.3. The momentum reward
-- is removed (handled client-side: the party branch no longer calls
-- adjust_momentum). Corp authors are unaffected — this RPC is party-only
-- and the news.js corp branch keeps its existing reward.
--
-- faction_sector_popularity is admin-write-only (RLS), so the client
-- routes through this SECURITY DEFINER RPC, same as hold_rally.
--
-- Once per tick: the effect lands only on a party's FIRST article each
-- tick. Gate reuses the player_articles record (the triggering article
-- is inserted before this call) — count > 1 at the current tick means a
-- prior article already moved popularity, so this one publishes without
-- a popularity change. No new gate table/column.
--
-- ±0.3 = ±3 tenths (popularity is stored in tenths 0..100, like rally).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.article_sector_popularity(
    p_target_party_id uuid,
    p_sector_id       uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller        uuid := auth.uid();
    v_party_id      uuid;   -- caller's party (the author)
    v_sec_id        uuid;
    v_sec_nation    uuid;
    v_target_nation uuid;
    v_tick          int;
    v_delta         int;    -- ±3 tenths
    v_count         int;
    v_pop_id        uuid;
    v_cur           int;
    v_next          int;
    v_self          boolean;
BEGIN
    IF v_caller IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_target_party_id IS NULL OR p_sector_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    -- Target sector (active) + its nation.
    SELECT id, nation_id INTO v_sec_id, v_sec_nation
      FROM sectors WHERE id = p_sector_id AND is_active = true LIMIT 1;
    IF v_sec_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_sector');
    END IF;

    -- The caller's PARTY faction in the sector's nation (mirrors the
    -- 20270190 hold_rally resolution — faction follows the sector so a
    -- multi-nation player can't mismatch).
    SELECT id INTO v_party_id FROM factions
     WHERE faction_type = 'party'
       AND nation_id = v_sec_nation
       AND (id = v_caller OR linked_user_id = v_caller)
     ORDER BY created_at DESC LIMIT 1;
    IF v_party_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_party');
    END IF;

    -- Target must be a party in the same nation.
    SELECT nation_id INTO v_target_nation FROM factions
     WHERE id = p_target_party_id AND faction_type = 'party';
    IF v_target_nation IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'target_not_party');
    END IF;
    IF v_target_nation <> v_sec_nation THEN
        RETURN jsonb_build_object('success', false, 'reason', 'target_wrong_nation');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- One popularity-moving article per tick. The triggering article is
    -- already inserted into player_articles, so a count > 1 means a prior
    -- article this tick already moved popularity.
    SELECT count(*) INTO v_count FROM player_articles
     WHERE author_faction_id = v_party_id AND published_tick = v_tick;
    IF v_count > 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_written_this_tick');
    END IF;

    -- Own party +0.3, any other party −0.3 (tenths).
    v_self  := (p_target_party_id = v_party_id);
    v_delta := CASE WHEN v_self THEN 3 ELSE -3 END;

    -- Read-modify-write the target's row (clamp 0..100). Skip silently if
    -- the sector wasn't seeded for the target — matches the rest of the
    -- popularity pipeline (no create-on-write).
    SELECT id, popularity INTO v_pop_id, v_cur
      FROM faction_sector_popularity
     WHERE faction_id = p_target_party_id AND sector_id = v_sec_id;
    IF v_pop_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_popularity_row');
    END IF;
    v_cur  := COALESCE(v_cur, 0);
    v_next := GREATEST(0, LEAST(100, v_cur + v_delta));

    UPDATE faction_sector_popularity
       SET popularity = v_next, updated_at = now()
     WHERE id = v_pop_id;

    RETURN jsonb_build_object(
        'success',       true,
        'target_self',   v_self,
        'delta_tenths',  v_delta,
        'popularity',    round(v_next / 10.0, 1)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.article_sector_popularity(uuid, uuid) TO authenticated;

COMMENT ON FUNCTION public.article_sector_popularity(uuid, uuid) IS
    'Write Article (party authors): moves the target party''s popularity in the chosen sector by +0.3 (own party) or −0.3 (any other), once per tick. SECURITY DEFINER (faction_sector_popularity is admin-write-only). Resolves the author''s party by the sector''s nation; gates one-per-tick via player_articles count. Replaces the momentum reward.';

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK ──
-- BEGIN;
-- DROP FUNCTION IF EXISTS public.article_sector_popularity(uuid, uuid);
-- COMMIT;
