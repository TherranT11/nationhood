-- ════════════════════════════════════════════════════════════════════
-- ENTREPRENEUR CORPS — Share Price History
-- ════════════════════════════════════════════════════════════════════
-- Persistent time-series of every share_price change on every
-- entrepreneur corp. Backs the "Share Price History" panel on the
-- entrepreneur-corp page (sparkline + recent-changes list).
--
-- ── Capture model: TRIGGER (per user spec; ask-before-automate rule
-- ──                  consulted and confirmed)
--
-- A single AFTER UPDATE OF share_price trigger on entrepreneur_corps
-- writes the history row — ONE SOURCE for capture. Any current OR
-- future RPC that UPDATEs share_price is recorded automatically; no
-- per-call INSERT to forget. The trigger fires only when
-- OLD.share_price IS DISTINCT FROM NEW.share_price (handles
-- NULL→value at IPO and value→NULL at delist correctly).
--
-- Source / actor / quantity attribution comes from transaction-scoped
-- session vars set by the calling RPC just before the UPDATE:
--   nh.price_change_source    e.g. 'trade_buy' | 'ipo' | 'board_leave'
--   nh.price_change_actor     UUID of the acting faction (optional)
--   nh.price_change_quantity  shares involved (trades only, optional)
-- A namespaced custom GUC (the dotted name) works without
-- postgresql.conf changes. set_config(..., true) makes the value
-- transaction-scoped so it cannot bleed between calls.
--
-- The trigger function tolerates unset / malformed vars — it inserts
-- the row with source = NULL rather than failing. Any UPDATE we don't
-- instrument still gets a row, just unattributed. Robustness over
-- strict source labels.
--
-- ── RPCs rewritten to set the source vars ────────────────────────
--   corp_trade            (BUY  → 'trade_buy', SELL → 'trade_sell',
--                          actor = v_fac.id, qty = p_quantity)
--   go_public             ('ipo',    actor = v_fac.id)
--   go_private            ('delist', actor = v_fac.id)
--   corp_board_leave      ('board_leave', actor = v_fac.id;
--                          only when public + price actually changes)
--   corp_board_vote       ('board_join', actor = applicant;
--                          only on the accept path, public + change)
-- corp_board_request_join itself does NOT touch share_price (filing
-- only — the price bump happens in corp_board_vote's accept branch).
-- corp_dividend / corp_no_confidence_* do NOT touch share_price.
--
-- ── Backfill ──────────────────────────────────────────────────────
-- Every existing public corp gets one row recording its CURRENT
-- share_price as the chart's starting anchor (source = 'backfill',
-- old_price = NULL). One-time, idempotent via the NOT EXISTS guard.
--
-- ── RLS ───────────────────────────────────────────────────────────
-- Same class as corp_shareholdings / corp_board_seats: public market
-- data, SELECT-all, no write policy → only the SECURITY DEFINER
-- trigger function can INSERT.
--
-- Idempotent. Safe to re-apply (CREATE OR REPLACE everywhere; the
-- backfill's NOT EXISTS guard prevents duplicates).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── Table ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS corp_share_price_history (
    id               bigserial PRIMARY KEY,
    corp_id          uuid    NOT NULL REFERENCES entrepreneur_corps(id) ON DELETE CASCADE,
    at_tick          int     NOT NULL,
    at_ts            timestamptz NOT NULL DEFAULT now(),
    old_price        numeric,                       -- NULL on IPO (first listed price)
    new_price        numeric,                       -- NULL on delist
    delta_pct        numeric,                       -- (new-old)/old × 100; NULL if either side NULL
    source           text,                          -- 'trade_buy'|'trade_sell'|'board_join'|'board_leave'|'ipo'|'delist'|'backfill'|NULL
    actor_faction_id uuid REFERENCES factions(id) ON DELETE SET NULL,
    quantity         int                            -- trades only
);

CREATE INDEX IF NOT EXISTS idx_csph_corp_id
    ON corp_share_price_history (corp_id, id);

COMMENT ON TABLE corp_share_price_history IS
    'Append-only history of every share_price change. Written exclusively by the AFTER UPDATE trigger on entrepreneur_corps. SELECT-all (public market data), no write policy.';
COMMENT ON COLUMN corp_share_price_history.source IS
    'Labels the cause: trade_buy / trade_sell / board_join / board_leave / ipo / delist / backfill. NULL means an instrumented RPC didn''t set the session var (future writer / untouched RPC).';

ALTER TABLE corp_share_price_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select for all" ON corp_share_price_history;
CREATE POLICY "Allow select for all" ON corp_share_price_history
    FOR SELECT USING (true);

-- ── Trigger function ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public._trg_record_share_price_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tick   INT;
    v_source TEXT;
    v_actor  UUID;
    v_qty    INT;
    v_delta  NUMERIC;
BEGIN
    -- IS DISTINCT FROM treats NULL→value and value→NULL as changes,
    -- which is what we want for IPO + delist boundary capture.
    IF OLD.share_price IS NOT DISTINCT FROM NEW.share_price THEN
        RETURN NEW;
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- Pull source attribution from session vars (set by the calling
    -- RPC via set_config(..., true)). All three are optional; an
    -- uninstrumented UPDATE records source = NULL.
    v_source := NULLIF(current_setting('nh.price_change_source', true), '');
    BEGIN
        v_actor := NULLIF(current_setting('nh.price_change_actor', true), '')::uuid;
    EXCEPTION WHEN invalid_text_representation THEN
        v_actor := NULL;
    END;
    BEGIN
        v_qty := NULLIF(current_setting('nh.price_change_quantity', true), '')::int;
    EXCEPTION WHEN invalid_text_representation THEN
        v_qty := NULL;
    END;

    IF OLD.share_price IS NOT NULL AND NEW.share_price IS NOT NULL AND OLD.share_price <> 0 THEN
        v_delta := ROUND((NEW.share_price - OLD.share_price) / OLD.share_price * 100, 2);
    END IF;

    INSERT INTO corp_share_price_history
        (corp_id, at_tick, old_price, new_price, delta_pct, source, actor_faction_id, quantity)
    VALUES
        (NEW.id, v_tick, OLD.share_price, NEW.share_price, v_delta, v_source, v_actor, v_qty);

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_record_share_price_change ON entrepreneur_corps;
CREATE TRIGGER trg_record_share_price_change
    AFTER UPDATE OF share_price ON entrepreneur_corps
    FOR EACH ROW
    EXECUTE FUNCTION public._trg_record_share_price_change();

COMMENT ON FUNCTION public._trg_record_share_price_change() IS
    'AFTER UPDATE OF share_price trigger writer for corp_share_price_history. Source / actor / quantity read from txn-scoped GUCs (nh.price_change_*). Uninstrumented UPDATEs record source NULL — robust over strict.';

-- ════════════════════════════════════════════════════════════════════
-- corp_trade — supersedes 20270157, adds source attribution
-- ════════════════════════════════════════════════════════════════════
-- Diff vs 20270157: two PERFORM set_config lines added before each of
-- the BUY and SELL UPDATE entrepreneur_corps statements (actor, qty,
-- source). Pricing math + lock order + guards UNCHANGED.
-- ════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION corp_trade(
    p_corp_id uuid, p_side text, p_quantity int
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_r         numeric := 1.05;
    v_corp      entrepreneur_corps%ROWTYPE;
    v_fac       factions%ROWTYPE;
    v_factor    numeric;
    v_unit      numeric;
    v_amount    numeric;
    v_pay_n     numeric;
    v_pay       bigint;
    v_new_price numeric;
    v_have      int;
    v_owned     int;
    v_held      int;
    v_available int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_side NOT IN ('buy','sell') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_side');
    END IF;
    IF p_quantity IS NULL OR p_quantity < 1 OR p_quantity > 1000000 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_quantity');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.listing <> 'public' OR v_corp.share_price IS NULL
       OR v_corp.shares_outstanding IS NULL OR v_corp.treasury_cash IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_public');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;

    SELECT COALESCE(SUM(shares), 0) INTO v_held
      FROM corp_shareholdings WHERE corp_id = p_corp_id;
    v_available := v_corp.shares_outstanding - v_held;

    v_factor := power(v_r, p_quantity::numeric);
    v_unit   := (v_factor - 1) / (v_r - 1);

    IF p_side = 'buy' THEN
        IF p_quantity > v_available THEN
            RETURN jsonb_build_object('success', false, 'reason', 'insufficient_float',
                'available', GREATEST(v_available, 0));
        END IF;

        v_amount    := v_corp.share_price * v_unit;
        v_pay_n     := ceil(v_amount);
        v_new_price := v_corp.share_price * v_factor;

        IF COALESCE(v_fac.party_funds, 0) < v_pay_n THEN
            RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
                'have', COALESCE(v_fac.party_funds, 0), 'need', v_pay_n);
        END IF;
        v_pay := v_pay_n::bigint;

        UPDATE factions SET party_funds = COALESCE(party_funds, 0) - v_pay
         WHERE id = v_fac.id;

        -- Source-attribution session vars (read by
        -- _trg_record_share_price_change after the next UPDATE).
        PERFORM set_config('nh.price_change_source',   'trade_buy',           true);
        PERFORM set_config('nh.price_change_actor',    v_fac.id::text,        true);
        PERFORM set_config('nh.price_change_quantity', p_quantity::text,      true);

        UPDATE entrepreneur_corps
           SET treasury_cash = treasury_cash + v_pay,
               share_price    = v_new_price
         WHERE id = p_corp_id;
        INSERT INTO corp_shareholdings (corp_id, holder_faction_id, shares)
        VALUES (p_corp_id, v_fac.id, p_quantity)
        ON CONFLICT (corp_id, holder_faction_id)
        DO UPDATE SET shares = corp_shareholdings.shares + EXCLUDED.shares
        RETURNING shares INTO v_owned;

        RETURN jsonb_build_object('success', true,
            'corp_id', p_corp_id, 'side', 'buy', 'quantity', p_quantity,
            'spent', v_pay, 'new_price', v_new_price,
            'shares_owned', v_owned,
            'shares_outstanding', v_corp.shares_outstanding,
            'available', v_available - p_quantity,
            'new_funds', COALESCE(v_fac.party_funds, 0) - v_pay);
    END IF;

    -- ── SELL ────────────────────────────────────────────────────────
    SELECT shares INTO v_have FROM corp_shareholdings
     WHERE corp_id = p_corp_id AND holder_faction_id = v_fac.id
     FOR UPDATE;
    IF v_have IS NULL OR v_have < p_quantity THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_shares',
            'have', COALESCE(v_have, 0), 'need', p_quantity);
    END IF;

    v_amount    := v_corp.share_price * v_unit / v_factor;
    v_pay_n     := floor(v_amount);
    v_new_price := v_corp.share_price / v_factor;

    IF v_corp.treasury_cash < v_pay_n THEN
        RETURN jsonb_build_object('success', false, 'reason', 'treasury_insufficient');
    END IF;
    v_pay := v_pay_n::bigint;

    UPDATE factions SET party_funds = COALESCE(party_funds, 0) + v_pay
     WHERE id = v_fac.id;

    PERFORM set_config('nh.price_change_source',   'trade_sell',          true);
    PERFORM set_config('nh.price_change_actor',    v_fac.id::text,        true);
    PERFORM set_config('nh.price_change_quantity', p_quantity::text,      true);

    UPDATE entrepreneur_corps
       SET treasury_cash = treasury_cash - v_pay,
           share_price    = v_new_price
     WHERE id = p_corp_id;
    UPDATE corp_shareholdings
       SET shares = shares - p_quantity
     WHERE corp_id = p_corp_id AND holder_faction_id = v_fac.id
    RETURNING shares INTO v_owned;

    RETURN jsonb_build_object('success', true,
        'corp_id', p_corp_id, 'side', 'sell', 'quantity', p_quantity,
        'proceeds', v_pay, 'new_price', v_new_price,
        'shares_owned', v_owned,
        'shares_outstanding', v_corp.shares_outstanding,
        'available', v_available + p_quantity,
        'new_funds', COALESCE(v_fac.party_funds, 0) + v_pay);
END;
$$;

GRANT EXECUTE ON FUNCTION corp_trade(uuid, text, int) TO authenticated;

-- ════════════════════════════════════════════════════════════════════
-- go_public — supersedes 20270156, adds 'ipo' source attribution
-- ════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.go_public(p_corp_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid    UUID := auth.uid();
    v_fac    factions%ROWTYPE;
    v_corp   entrepreneur_corps%ROWTYPE;
    v_seed   BIGINT;
    v_price  NUMERIC;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.listing <> 'private' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_public');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;
    IF v_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    v_seed := v_corp.starting_capital;
    IF COALESCE(v_fac.party_funds, 0) < v_seed THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'have', COALESCE(v_fac.party_funds, 0), 'need', v_seed);
    END IF;
    v_price := v_seed::numeric / 100;

    UPDATE factions SET party_funds = COALESCE(party_funds, 0) - v_seed
     WHERE id = v_fac.id;

    PERFORM set_config('nh.price_change_source', 'ipo',           true);
    PERFORM set_config('nh.price_change_actor',  v_fac.id::text,  true);

    UPDATE entrepreneur_corps
       SET listing            = 'public',
           treasury_cash      = v_seed::numeric,
           shares_outstanding = 100,
           share_price        = v_price
     WHERE id = p_corp_id;

    INSERT INTO corp_shareholdings (corp_id, holder_faction_id, shares)
    VALUES (p_corp_id, v_fac.id, 20)
    ON CONFLICT (corp_id, holder_faction_id) DO UPDATE SET shares = 20;

    RETURN jsonb_build_object(
        'success',            true,
        'corp_id',            p_corp_id,
        'listing',            'public',
        'shares_outstanding', 100,
        'share_price',        v_price,
        'treasury_cash',      v_seed,
        'spent',              v_seed,
        'new_funds',          COALESCE(v_fac.party_funds, 0) - v_seed
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.go_public(UUID) TO authenticated;

-- ════════════════════════════════════════════════════════════════════
-- go_private — supersedes 20270153, adds 'delist' source attribution
-- ════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.go_private(p_corp_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid     UUID := auth.uid();
    v_fac     factions%ROWTYPE;
    v_corp    entrepreneur_corps%ROWTYPE;
    v_premium NUMERIC := 1.25;
    v_total   BIGINT;
    v_treas   BIGINT;
    v_pay     BIGINT;
    r         RECORD;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.listing <> 'public' OR v_corp.share_price IS NULL
       OR v_corp.shares_outstanding IS NULL OR v_corp.treasury_cash IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_public');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;
    IF v_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    SELECT COALESCE(SUM(ceil(shares::numeric * v_corp.share_price * v_premium)), 0)::bigint
      INTO v_total
      FROM corp_shareholdings
     WHERE corp_id = p_corp_id
       AND holder_faction_id <> v_fac.id
       AND shares > 0;

    IF COALESCE(v_fac.party_funds, 0) < v_total THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'have', COALESCE(v_fac.party_funds, 0), 'need', v_total);
    END IF;

    FOR r IN
        SELECT holder_faction_id, shares
          FROM corp_shareholdings
         WHERE corp_id = p_corp_id
           AND holder_faction_id <> v_fac.id
           AND shares > 0
    LOOP
        v_pay := ceil(r.shares::numeric * v_corp.share_price * v_premium)::bigint;
        UPDATE factions
           SET party_funds = COALESCE(party_funds, 0) + v_pay
         WHERE id = r.holder_faction_id;
    END LOOP;

    DELETE FROM corp_shareholdings WHERE corp_id = p_corp_id;

    v_treas := floor(COALESCE(v_corp.treasury_cash, 0))::bigint;
    UPDATE factions
       SET party_funds = COALESCE(party_funds, 0) - v_total + v_treas
     WHERE id = v_fac.id;

    PERFORM set_config('nh.price_change_source', 'delist',         true);
    PERFORM set_config('nh.price_change_actor',  v_fac.id::text,   true);

    UPDATE entrepreneur_corps
       SET listing            = 'private',
           treasury_cash      = NULL,
           shares_outstanding = NULL,
           share_price        = NULL
     WHERE id = p_corp_id;

    RETURN jsonb_build_object(
        'success',            true,
        'corp_id',            p_corp_id,
        'listing',            'private',
        'bought_out',         v_total,
        'treasury_reclaimed', v_treas,
        'new_funds',          COALESCE(v_fac.party_funds, 0) - v_total + v_treas
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.go_private(UUID) TO authenticated;

-- ════════════════════════════════════════════════════════════════════
-- corp_board_leave — supersedes 20270158, adds 'board_leave' source
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

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;

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

    v_d6 := NULL;
    v_new_price := v_corp.share_price;
    IF v_corp.listing = 'public' AND v_corp.share_price IS NOT NULL THEN
        v_d6        := floor(random() * 6)::int + 1;
        v_new_price := v_corp.share_price * (1 - v_d6::numeric / 100);

        PERFORM set_config('nh.price_change_source', 'board_leave',    true);
        PERFORM set_config('nh.price_change_actor',  v_fac.id::text,   true);

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

-- ════════════════════════════════════════════════════════════════════
-- corp_board_vote — supersedes 20270160, adds 'board_join' source
-- ════════════════════════════════════════════════════════════════════
-- Only the accept-path's share-price bump is instrumented. NO-vote /
-- below-threshold paths do not change share_price.
-- ════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.corp_board_vote(p_request_id UUID, p_yes BOOLEAN)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid        UUID := auth.uid();
    v_fac        factions%ROWTYPE;
    v_req        corp_board_requests%ROWTYPE;
    v_corp       entrepreneur_corps%ROWTYPE;
    v_tick       INT;
    v_pool_size  INT;
    v_yes_count  INT;
    v_threshold  INT;
    v_d6         INT;
    v_new_price  NUMERIC;
    v_finalised  BOOLEAN := FALSE;
    v_name       TEXT;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_request_id IS NULL OR p_yes IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_req FROM corp_board_requests
     WHERE id = p_request_id FOR UPDATE;
    IF v_req.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'request_not_found');
    END IF;
    IF v_req.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'request_not_pending');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM corp_board_request_pool
                    WHERE request_id = p_request_id
                      AND voter_faction_id = v_fac.id) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_eligible_voter');
    END IF;

    IF EXISTS (SELECT 1 FROM corp_board_request_votes
                WHERE request_id = p_request_id
                  AND voter_faction_id = v_fac.id) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_voted');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    INSERT INTO corp_board_request_votes (request_id, voter_faction_id, vote, voted_at_tick)
    VALUES (p_request_id, v_fac.id, p_yes, v_tick);

    IF p_yes THEN
        SELECT COUNT(*) INTO v_pool_size FROM corp_board_request_pool
         WHERE request_id = p_request_id;
        SELECT COUNT(*) INTO v_yes_count FROM corp_board_request_votes
         WHERE request_id = p_request_id AND vote = TRUE;
        v_threshold := CEIL(v_pool_size::numeric * 0.51)::int;

        IF v_yes_count >= v_threshold THEN
            SELECT * INTO v_corp FROM entrepreneur_corps
             WHERE id = v_req.corp_id FOR UPDATE;
            IF v_corp.id IS NULL THEN
                RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
            END IF;

            INSERT INTO corp_board_seats (corp_id, member_faction_id, joined_tick)
            VALUES (v_corp.id, v_req.applicant_faction_id, v_tick)
            ON CONFLICT (corp_id, member_faction_id) DO NOTHING;

            UPDATE factions
               SET ent_reputation = COALESCE(ent_reputation, 0) + 1
             WHERE id = v_req.applicant_faction_id;
            UPDATE factions
               SET ent_reputation = COALESCE(ent_reputation, 0) + 1
             WHERE id = v_corp.owner_faction_id;

            v_d6 := NULL;
            v_new_price := v_corp.share_price;
            IF v_corp.listing = 'public' AND v_corp.share_price IS NOT NULL THEN
                v_d6        := floor(random() * 6)::int + 1;
                v_new_price := v_corp.share_price * (1 + v_d6::numeric / 100);

                PERFORM set_config('nh.price_change_source', 'board_join',                          true);
                PERFORM set_config('nh.price_change_actor',  v_req.applicant_faction_id::text,      true);

                UPDATE entrepreneur_corps
                   SET share_price = v_new_price
                 WHERE id = v_corp.id;
            END IF;

            UPDATE corp_board_requests
               SET status = 'accepted', finalized_tick = v_tick
             WHERE id = p_request_id;

            SELECT COALESCE(
                NULLIF(btrim(COALESCE(f.leader_first_name,'') || ' ' || COALESCE(f.leader_last_name,'')), ''),
                f.faction_name, 'An entrepreneur')
              INTO v_name
              FROM factions f WHERE f.id = v_req.applicant_faction_id;

            INSERT INTO event_log (
                nation_id, faction_id, event_name, description_used,
                category, trigger_key, effects_applied, fired_at_tick
            ) VALUES (
                v_corp.hq_nation_id, v_req.applicant_faction_id,
                'Board Appointment Confirmed',
                format('%s has been welcomed to the Board of Directors of %s.', v_name, v_corp.name),
                'corporate', 'corp_board_request_accepted',
                jsonb_build_object('corp_id', v_corp.id, 'corp_name', v_corp.name,
                                   'request_id', p_request_id, 'd6', v_d6,
                                   'new_price', v_new_price,
                                   'pool_size', v_pool_size, 'yes_count', v_yes_count),
                v_tick
            );

            v_finalised := TRUE;
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'success',   true,
        'finalised', v_finalised,
        'd6',        v_d6,
        'new_price', v_new_price
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.corp_board_vote(UUID, BOOLEAN) TO authenticated;

-- ── One-time backfill: anchor row for every existing public corp ──
-- Records the CURRENT share_price as the chart's starting point.
-- NOT EXISTS guard makes it idempotent (re-running the migration
-- doesn't duplicate the anchor row).

INSERT INTO corp_share_price_history
    (corp_id, at_tick, old_price, new_price, delta_pct, source)
SELECT c.id,
       COALESCE((SELECT current_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1), 0),
       NULL,
       c.share_price,
       NULL,
       'backfill'
  FROM entrepreneur_corps c
 WHERE c.listing = 'public'
   AND c.share_price IS NOT NULL
   AND NOT EXISTS (
       SELECT 1 FROM corp_share_price_history h WHERE h.corp_id = c.id
   );

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK ──
-- BEGIN;
-- DROP TRIGGER  IF EXISTS trg_record_share_price_change ON entrepreneur_corps;
-- DROP FUNCTION IF EXISTS public._trg_record_share_price_change();
-- -- Re-apply 20270157 / 20270156 / 20270153 / 20270158 / 20270160 to
-- -- restore the un-instrumented function bodies. Optional — the
-- -- session-var PERFORMs are no-ops with the trigger gone.
-- DROP TABLE    IF EXISTS corp_share_price_history;
-- COMMIT;
