-- ════════════════════════════════════════════════════════════════════
-- ENTREPRENEUR CORPS — board seats (Phase A: schema + Leave Board)
-- ════════════════════════════════════════════════════════════════════
-- Storage for non-founder board members of an entrepreneur corp. The
-- founder is implicit (always the Chairman/CEO via owner_faction_id),
-- never a row in this table — one source for chairmanship, no
-- backfill needed at corp creation.
--
-- Phase A (this migration) ships: the table + RLS + a leave RPC. The
-- corp-detail BOARD card is rewired (separate client commit in the
-- same push) to render the Chairman from owner_faction_id and any
-- directors from this table. The Leave Board action is wired on
-- entrepreneur-corporations.html. The Join Board action stays SOON.
--
-- Phase B (future): corp_board_requests + corp_board_request_votes
-- (snapshot-pool 51% vote, 3-tick auto-reject in the tick processor)
-- and the corp_board_request_join / corp_board_vote RPCs.
--
-- Public market data, same RLS class as entrepreneur_corps /
-- corp_shareholdings: SELECT USING(true), no write policy so RLS
-- blocks all client writes and only SECURITY DEFINER RPCs can mutate.
-- Founder cannot leave (their seat is ownership of record).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE TABLE IF NOT EXISTS corp_board_seats (
    corp_id           uuid NOT NULL REFERENCES entrepreneur_corps(id) ON DELETE CASCADE,
    member_faction_id uuid NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    joined_tick       int  NOT NULL,
    PRIMARY KEY (corp_id, member_faction_id)
);

CREATE INDEX IF NOT EXISTS idx_corp_board_seats_member
    ON corp_board_seats (member_faction_id);

COMMENT ON TABLE corp_board_seats IS
    'Non-founder board members of an entrepreneur corp. Founder is implicit (owner_faction_id is the Chairman/CEO; never a row here). RPC-write-only (no client write policy with RLS enabled).';

ALTER TABLE corp_board_seats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select for all" ON corp_board_seats;
CREATE POLICY "Allow select for all" ON corp_board_seats
    FOR SELECT USING (true);

-- ── corp_board_leave: resign your seat from a corp ──────────────────
-- Mirrors corp_trade / go_public / go_private: SECURITY DEFINER, corp
-- row FOR UPDATE FIRST (consistent global order; eliminates deadlock
-- class), then the verbatim entrepreneur-faction guard. Founder cannot
-- leave (their seat is ownership of record — out of scope; would be a
-- transfer action). For public corps, share_price drops by 1d6%
-- (1..6%) — the column REVOKE means only this RPC can write it. Event
-- logged with category='corporate' for the dashboards' Corporate feeds
-- (Nation = corp's HQ nation; world view is the same row, queried
-- without a nation filter).
-- ════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.corp_board_leave(p_corp_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid       UUID := auth.uid();
    v_fac       factions%ROWTYPE;
    v_corp      entrepreneur_corps%ROWTYPE;
    v_seat_exists BOOLEAN;
    v_tick      INT;
    v_d6        INT;
    v_new_price NUMERIC;
    v_name      TEXT;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;

    -- Corp row FIRST — consistent global order with corp_trade /
    -- go_public / go_private.
    SELECT * INTO v_corp FROM entrepreneur_corps
     WHERE id = p_corp_id
     FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;

    -- Caller's entrepreneur faction. VERBATIM the prelude in
    -- found_entrepreneur_corp (20270144) / corp_trade (20270145) /
    -- go_public / go_private — keep the set in sync.
    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;

    -- Founder is implicit Chairman, not a board seat — out of scope.
    IF v_corp.owner_faction_id = v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'founder_cannot_leave');
    END IF;

    SELECT TRUE INTO v_seat_exists FROM corp_board_seats
     WHERE corp_id = p_corp_id AND member_faction_id = v_fac.id;
    IF v_seat_exists IS NOT TRUE THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_on_board');
    END IF;

    DELETE FROM corp_board_seats
     WHERE corp_id = p_corp_id AND member_faction_id = v_fac.id;

    -- Public corps: 1..6% drop. share_price stays exact numeric (same
    -- type/treatment as corp_trade). No-op for private (no share price).
    v_d6 := NULL;
    v_new_price := v_corp.share_price;
    IF v_corp.listing = 'public' AND v_corp.share_price IS NOT NULL THEN
        v_d6        := floor(random() * 6)::int + 1;       -- 1..6
        v_new_price := v_corp.share_price * (1 - v_d6::numeric / 100);
        UPDATE entrepreneur_corps
           SET share_price = v_new_price
         WHERE id = p_corp_id;
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;

    v_name := COALESCE(
        NULLIF(btrim(COALESCE(v_fac.leader_first_name,'') || ' ' || COALESCE(v_fac.leader_last_name,'')), ''),
        v_fac.faction_name,
        'An entrepreneur'
    );

    INSERT INTO event_log (
        nation_id, faction_id, event_name, description_used,
        category, trigger_key, effects_applied, fired_at_tick
    ) VALUES (
        v_corp.hq_nation_id, v_fac.id,
        'Board Resignation',
        format('%s has stepped down from their position on the Board of Directors of %s.', v_name, v_corp.name),
        'corporate', 'corp_board_leave',
        jsonb_build_object(
            'corp_id',   p_corp_id,
            'corp_name', v_corp.name,
            'd6',        v_d6,
            'new_price', v_new_price
        ),
        COALESCE(v_tick, 0)
    );

    RETURN jsonb_build_object(
        'success',   true,
        'corp_id',   p_corp_id,
        'd6',        v_d6,
        'new_price', v_new_price
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.corp_board_leave(UUID) TO authenticated;

COMMENT ON FUNCTION public.corp_board_leave(UUID) IS
    'Resign your seat on an entrepreneur corp''s board (Phase A). Founder cannot leave (ownership of record). Public corps take a 1..6%% share-price drop. Logs event_log row (category=corporate). SECURITY DEFINER; corp-row FOR UPDATE serialises against corp_trade/go_public/go_private/board_join (Phase B).';

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK ──
-- DROP FUNCTION IF EXISTS public.corp_board_leave(UUID);
-- DROP TABLE  IF EXISTS corp_board_seats;
-- Safe: no data in the table until Phase B's Join lands.
