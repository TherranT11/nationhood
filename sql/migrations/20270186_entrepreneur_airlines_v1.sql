-- ════════════════════════════════════════════════════════════════════
-- ENTREPRENEUR AIRLINES — v1 (fleet + terminals + routes)
-- ════════════════════════════════════════════════════════════════════
-- Brings the airline sector to entrepreneur corps, reusing the existing
-- aviation infrastructure (airline_cities, airline_terminals,
-- airline_city_ranges, the three aircraft classes) that the legacy
-- faction-side airline system already seeded for Avelia + Calveth.
-- Legacy airline corps are slated for removal later; this is the
-- forward path for the airline sector.
--
-- ── Reused as-is (ownership-agnostic) ────────────────────────────
--   airline_cities       6 seeded cities (pop %, terminal_count,
--                        runway_type, is_capital).
--   airline_city_ranges  15 pairwise range_units (domestic 4-6,
--                        intra-Avelia 9-11, cross-nation 75-80).
--   aircraft classes     regional / narrowbody / widebody with
--                        seats (10/25/60) + ops cost (500/1200/2500)
--                        via airline_aircraft_seats / _ops_cost.
--
-- ── New ownership on shared tables (legacy FK'd to factions) ─────
--   airline_terminals.owner_corp_id   → entrepreneur_corps
--   airline_routes.airline_corp_id    → entrepreneur_corps
--   airline_routes.airline_faction_id is now nullable; a CHECK
--     enforces exactly one owner kind per route.
--
-- ── Fleet model ──────────────────────────────────────────────────
-- Three counters on entrepreneur_corps (mirrors freighters_owned —
-- no per-plane rows, no condition/aging in v1). Route assignment
-- uses airline_routes.aircraft_regional/narrowbody/widebody (already
-- in the Phase 5 schema). Idle = owned − Σ assigned across the corp's
-- active routes. Client-write-revoked like treasury_cash.
--
-- ── Economy (locked) ─────────────────────────────────────────────
--   Aircraft prices:  regional $60M / narrowbody $90M / widebody $120M.
--   Fleet:            uncapped — per-tick ops cost is the limiter.
--   Terminal claim:   $5M + $2M × population_pct (capital slots cost
--                     more; small-market slots cheaper).
--   Founding seed:    airline corps found with 2 free regional
--                     aircraft + 2 free starter terminals (HQ nation's
--                     two largest cities, falling back to the globally
--                     largest) so a first route is openable on day one.
--
-- ── Range gating (uses the seeded distances) ─────────────────────
--   regional   serves range_units ≤ 20  (domestic + intra-Avelia)
--   narrowbody serves range_units ≤ 60  (domestic + intra-Avelia)
--   widebody   serves any range          (only class that flies the
--                                         75-80 cross-nation lanes)
-- So international expansion requires widebodies — distance has teeth.
--
-- ── Out of scope for v1 (deferred) ───────────────────────────────
-- Aircraft design / engines / RFPs / manufacturing, incidents,
-- maintenance tiers + aging, per-plane condition. Entrepreneur routes
-- pin maintenance_tier='basic' and the per-tick allocator (next
-- migration) charges ops only.
--
-- Idempotent. ADD COLUMN IF NOT EXISTS; CREATE OR REPLACE on RPCs;
-- CHECK constraints guarded by name lookups.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. industry CHECK gains 'airline' ────────────────────────────
ALTER TABLE entrepreneur_corps DROP CONSTRAINT IF EXISTS entrepreneur_corps_industry_check;
ALTER TABLE entrepreneur_corps
    ADD CONSTRAINT entrepreneur_corps_industry_check
    CHECK (industry IN ('construction','banking','shipping','real_estate','airline'));

-- ── 2. entrepreneur_corps fleet counters ─────────────────────────
ALTER TABLE entrepreneur_corps
    ADD COLUMN IF NOT EXISTS aircraft_regional_owned   int NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS aircraft_narrowbody_owned int NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS aircraft_widebody_owned   int NOT NULL DEFAULT 0;

COMMENT ON COLUMN entrepreneur_corps.aircraft_regional_owned IS
    'Airline corps: regional aircraft owned (10 seats, $500/tick ops). Bought via entrepreneur_buy_aircraft; assigned to routes via airline_routes.aircraft_regional. Client-write-revoked — RPC-only, same model as freighters_owned.';
COMMENT ON COLUMN entrepreneur_corps.aircraft_narrowbody_owned IS
    'Airline corps: narrowbody aircraft owned (25 seats, $1200/tick ops). RPC-only.';
COMMENT ON COLUMN entrepreneur_corps.aircraft_widebody_owned IS
    'Airline corps: widebody aircraft owned (60 seats, $2500/tick ops). Only class that serves cross-nation (range > 60) lanes. RPC-only.';

-- Same write-revoke posture as treasury_cash / freighters_owned: real
-- economic value, must not be self-granted from the client.
REVOKE UPDATE (aircraft_regional_owned, aircraft_narrowbody_owned, aircraft_widebody_owned)
    ON entrepreneur_corps FROM PUBLIC, anon, authenticated;

-- ── 3. airline_terminals — entrepreneur ownership ────────────────
ALTER TABLE airline_terminals
    ADD COLUMN IF NOT EXISTS owner_corp_id uuid REFERENCES entrepreneur_corps(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_airline_terminals_owner_corp
    ON airline_terminals (owner_corp_id) WHERE owner_corp_id IS NOT NULL;

-- owner_corp_id carries real economic value (terminal presence gates
-- routes). The legacy "Owners can claim" UPDATE policy grants
-- authenticated table-level UPDATE on airline_terminals, so without
-- this revoke a client could self-assign owner_corp_id directly and
-- skip the claim fee. Writes must go through entrepreneur_claim_terminal
-- / _release_terminal (SECURITY DEFINER, which bypasses the revoke).
REVOKE UPDATE (owner_corp_id) ON airline_terminals FROM PUBLIC, anon, authenticated;

COMMENT ON COLUMN airline_terminals.owner_corp_id IS
    'Entrepreneur-corp owner of this terminal slot. Mutually exclusive in practice with the legacy owner_airline_id (faction owner); a slot is unclaimed when both are NULL. Claimed via entrepreneur_claim_terminal. Client-write-revoked — RPC-only.';

-- ── 4. airline_routes — entrepreneur ownership ───────────────────
ALTER TABLE airline_routes
    ADD COLUMN IF NOT EXISTS airline_corp_id uuid REFERENCES entrepreneur_corps(id) ON DELETE CASCADE;

ALTER TABLE airline_routes ALTER COLUMN airline_faction_id DROP NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
         WHERE table_name = 'airline_routes'
           AND constraint_name = 'airline_routes_one_owner_chk'
    ) THEN
        ALTER TABLE airline_routes
            ADD CONSTRAINT airline_routes_one_owner_chk
            CHECK ((airline_faction_id IS NULL) <> (airline_corp_id IS NULL));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_airline_routes_corp
    ON airline_routes (airline_corp_id) WHERE airline_corp_id IS NOT NULL;

-- The legacy one-active-per-lane unique index keys on airline_faction_id,
-- which is NULL for entrepreneur routes (multiple NULLs allowed → no
-- protection). Add a parallel partial unique for the corp path so the
-- DB enforces one active route per (corp, lane) — defence-in-depth
-- beyond open_route's corp-row lock + EXISTS check.
CREATE UNIQUE INDEX IF NOT EXISTS idx_airline_routes_one_active_per_ent_corp_lane
    ON airline_routes (airline_corp_id, origin_city_id, dest_city_id)
    WHERE status = 'active' AND airline_corp_id IS NOT NULL;

COMMENT ON COLUMN airline_routes.airline_corp_id IS
    'Entrepreneur-corp operator of this route. Mutually exclusive with the legacy airline_faction_id (enforced by airline_routes_one_owner_chk). Set by entrepreneur_open_route.';

-- ── 5. entrepreneur_buy_aircraft ─────────────────────────────────

CREATE OR REPLACE FUNCTION public.entrepreneur_buy_aircraft(
    p_corp_id  uuid,
    p_class    text,
    p_quantity int
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_corp      entrepreneur_corps%ROWTYPE;
    v_fac       factions%ROWTYPE;
    v_unit      bigint;
    v_cost      bigint;
    v_treas     numeric;
    v_col       text;
    v_new_owned int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL OR p_class IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_class NOT IN ('regional','narrowbody','widebody') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_class');
    END IF;
    IF p_quantity IS NULL OR p_quantity < 1 OR p_quantity > 50 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_quantity');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.industry <> 'airline' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_airline_corp');
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

    v_unit := CASE p_class
        WHEN 'regional'   THEN 60000000
        WHEN 'narrowbody' THEN 90000000
        WHEN 'widebody'   THEN 120000000
    END;
    v_cost  := v_unit * p_quantity::bigint;
    v_treas := COALESCE(v_corp.treasury_cash, 0);
    IF v_treas < v_cost THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'have', v_treas::bigint, 'need', v_cost, 'payer', 'corp');
    END IF;

    v_col := 'aircraft_' || p_class || '_owned';
    EXECUTE format(
        'UPDATE entrepreneur_corps SET treasury_cash = COALESCE(treasury_cash,0) - $1, %I = %I + $2, updated_at = now() WHERE id = $3',
        v_col, v_col)
      USING v_cost, p_quantity, p_corp_id;

    EXECUTE format('SELECT %I FROM entrepreneur_corps WHERE id = $1', v_col)
       INTO v_new_owned USING p_corp_id;

    RETURN jsonb_build_object(
        'success', true,
        'corp_id', p_corp_id,
        'class',   p_class,
        'quantity_bought', p_quantity,
        'unit_cost', v_unit,
        'total_cost', v_cost,
        'owned_after', v_new_owned,
        'corp_cash_after', (v_treas - v_cost)::bigint
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.entrepreneur_buy_aircraft(uuid, text, int) TO authenticated;

COMMENT ON FUNCTION public.entrepreneur_buy_aircraft(uuid, text, int) IS
    'Airline-corp owner buys N aircraft of a class from treasury_cash. Flat prices: regional $60M / narrowbody $90M / widebody $120M. Uncapped — per-tick ops cost is the natural limiter.';

-- ── 6. entrepreneur_claim_terminal ───────────────────────────────

CREATE OR REPLACE FUNCTION public.entrepreneur_claim_terminal(
    p_corp_id uuid,
    p_city_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_corp      entrepreneur_corps%ROWTYPE;
    v_fac       factions%ROWTYPE;
    v_city      airline_cities%ROWTYPE;
    v_term_id   uuid;
    v_fee       bigint;
    v_treas     numeric;
    v_tick      int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL OR p_city_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.industry <> 'airline' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_airline_corp');
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

    SELECT * INTO v_city FROM airline_cities WHERE id = p_city_id;
    IF v_city.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'city_not_found');
    END IF;

    -- One terminal per corp per city — no point owning two slots.
    IF EXISTS (
        SELECT 1 FROM airline_terminals
         WHERE city_id = p_city_id AND owner_corp_id = p_corp_id
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_have_terminal');
    END IF;

    -- Lowest-numbered unclaimed slot (legacy faction owner OR corp owner
    -- both NULL = free). FOR UPDATE so two simultaneous claims serialise.
    SELECT id INTO v_term_id FROM airline_terminals
     WHERE city_id = p_city_id
       AND owner_airline_id IS NULL
       AND owner_corp_id   IS NULL
     ORDER BY terminal_number ASC
     LIMIT 1
     FOR UPDATE;
    IF v_term_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_terminal_available');
    END IF;

    -- Fee scales with city size: $5M + $2M × population_pct.
    v_fee   := 5000000 + (2000000 * COALESCE(v_city.population_pct, 0))::bigint;
    v_treas := COALESCE(v_corp.treasury_cash, 0);
    IF v_treas < v_fee THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'have', v_treas::bigint, 'need', v_fee, 'payer', 'corp');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE entrepreneur_corps
       SET treasury_cash = COALESCE(treasury_cash, 0) - v_fee, updated_at = now()
     WHERE id = p_corp_id;

    UPDATE airline_terminals
       SET owner_corp_id = p_corp_id, acquired_at_tick = v_tick
     WHERE id = v_term_id;

    RETURN jsonb_build_object(
        'success', true,
        'corp_id', p_corp_id,
        'city_id', p_city_id,
        'city_name', v_city.name,
        'terminal_id', v_term_id,
        'fee', v_fee,
        'corp_cash_after', (v_treas - v_fee)::bigint
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.entrepreneur_claim_terminal(uuid, uuid) TO authenticated;

COMMENT ON FUNCTION public.entrepreneur_claim_terminal(uuid, uuid) IS
    'Airline-corp owner claims an unclaimed terminal slot at a city. Fee = $5M + $2M × population_pct, paid from treasury_cash. One slot per corp per city. Owning slots at both endpoints is the gate for entrepreneur_open_route.';

-- ── 7. entrepreneur_release_terminal ─────────────────────────────

CREATE OR REPLACE FUNCTION public.entrepreneur_release_terminal(
    p_corp_id     uuid,
    p_terminal_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_corp      entrepreneur_corps%ROWTYPE;
    v_fac       factions%ROWTYPE;
    v_term      airline_terminals%ROWTYPE;
    v_in_use    boolean;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL OR p_terminal_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
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
    IF v_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    SELECT * INTO v_term FROM airline_terminals WHERE id = p_terminal_id FOR UPDATE;
    IF v_term.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'terminal_not_found');
    END IF;
    IF v_term.owner_corp_id <> p_corp_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_your_terminal');
    END IF;

    -- Block release if an active route by this corp uses the terminal's
    -- city — releasing it would orphan a flying route.
    SELECT EXISTS (
        SELECT 1 FROM airline_routes
         WHERE airline_corp_id = p_corp_id
           AND status = 'active'
           AND (origin_city_id = v_term.city_id OR dest_city_id = v_term.city_id)
    ) INTO v_in_use;
    IF v_in_use THEN
        RETURN jsonb_build_object('success', false, 'reason', 'terminal_in_use');
    END IF;

    UPDATE airline_terminals
       SET owner_corp_id = NULL, acquired_at_tick = NULL
     WHERE id = p_terminal_id;

    RETURN jsonb_build_object('success', true, 'corp_id', p_corp_id, 'terminal_id', p_terminal_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.entrepreneur_release_terminal(uuid, uuid) TO authenticated;

COMMENT ON FUNCTION public.entrepreneur_release_terminal(uuid, uuid) IS
    'Airline-corp owner gives up a terminal slot (no refund). Blocked while an active route uses the city.';

-- ── 8. entrepreneur_open_route ───────────────────────────────────

CREATE OR REPLACE FUNCTION public.entrepreneur_open_route(
    p_corp_id        uuid,
    p_origin_city_id uuid,
    p_dest_city_id   uuid,
    p_ticket_price   int,
    p_regional       int,
    p_narrowbody     int,
    p_widebody       int
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_corp         entrepreneur_corps%ROWTYPE;
    v_fac          factions%ROWTYPE;
    v_origin       airline_cities%ROWTYPE;
    v_dest         airline_cities%ROWTYPE;
    v_a            uuid;   -- canonical low city id
    v_b            uuid;   -- canonical high city id
    v_range        int;
    v_route_type   text;
    v_tick         int;
    v_reg          int := COALESCE(p_regional, 0);
    v_nar          int := COALESCE(p_narrowbody, 0);
    v_wide         int := COALESCE(p_widebody, 0);
    v_idle_reg     int;
    v_idle_nar     int;
    v_idle_wide    int;
    v_route_id     uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL OR p_origin_city_id IS NULL OR p_dest_city_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_origin_city_id = p_dest_city_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'same_city');
    END IF;
    IF p_ticket_price IS NULL OR p_ticket_price < 0 OR p_ticket_price > 500 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_ticket_price');
    END IF;
    IF (v_reg + v_nar + v_wide) < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_aircraft_assigned');
    END IF;
    IF v_reg < 0 OR v_nar < 0 OR v_wide < 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_aircraft_counts');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.industry <> 'airline' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_airline_corp');
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

    SELECT * INTO v_origin FROM airline_cities WHERE id = p_origin_city_id;
    SELECT * INTO v_dest   FROM airline_cities WHERE id = p_dest_city_id;
    IF v_origin.id IS NULL OR v_dest.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'city_not_found');
    END IF;

    -- Must own a terminal at BOTH endpoints.
    IF NOT EXISTS (SELECT 1 FROM airline_terminals
                    WHERE city_id = p_origin_city_id AND owner_corp_id = p_corp_id) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_terminal_origin');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM airline_terminals
                    WHERE city_id = p_dest_city_id AND owner_corp_id = p_corp_id) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_terminal_dest');
    END IF;

    -- Canonical pair order (the table CHECK requires origin < dest).
    IF p_origin_city_id < p_dest_city_id THEN
        v_a := p_origin_city_id; v_b := p_dest_city_id;
    ELSE
        v_a := p_dest_city_id;   v_b := p_origin_city_id;
    END IF;

    -- One active route per (corp, lane).
    IF EXISTS (SELECT 1 FROM airline_routes
                WHERE airline_corp_id = p_corp_id
                  AND origin_city_id = v_a AND dest_city_id = v_b
                  AND status = 'active') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'route_exists');
    END IF;

    -- Range lookup + per-class gating. regional/narrowbody can't fly
    -- lanes longer than their ceiling; only widebody serves cross-nation.
    SELECT range_units INTO v_range FROM airline_city_ranges
     WHERE city_a_id = v_a AND city_b_id = v_b;
    IF v_range IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_range_data');
    END IF;
    IF v_range > 20 AND v_reg > 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'regional_out_of_range',
            'range', v_range, 'class_max', 20);
    END IF;
    IF v_range > 60 AND v_nar > 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'narrowbody_out_of_range',
            'range', v_range, 'class_max', 60);
    END IF;

    -- Idle fleet = owned − assigned across the corp's OTHER active routes.
    SELECT v_corp.aircraft_regional_owned   - COALESCE(SUM(aircraft_regional), 0),
           v_corp.aircraft_narrowbody_owned - COALESCE(SUM(aircraft_narrowbody), 0),
           v_corp.aircraft_widebody_owned   - COALESCE(SUM(aircraft_widebody), 0)
      INTO v_idle_reg, v_idle_nar, v_idle_wide
      FROM airline_routes
     WHERE airline_corp_id = p_corp_id AND status = 'active';

    IF v_reg > v_idle_reg OR v_nar > v_idle_nar OR v_wide > v_idle_wide THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_idle_aircraft',
            'idle_regional', v_idle_reg, 'idle_narrowbody', v_idle_nar, 'idle_widebody', v_idle_wide,
            'requested_regional', v_reg, 'requested_narrowbody', v_nar, 'requested_widebody', v_wide);
    END IF;

    v_route_type := CASE WHEN v_origin.nation_id = v_dest.nation_id THEN 'domestic' ELSE 'international' END;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    INSERT INTO airline_routes (
        airline_corp_id, airline_faction_id,
        origin_city_id, dest_city_id, ticket_price, maintenance_tier,
        aircraft_regional, aircraft_narrowbody, aircraft_widebody,
        route_type, status, opened_at_tick
    ) VALUES (
        p_corp_id, NULL,
        v_a, v_b, p_ticket_price, 'basic',
        v_reg, v_nar, v_wide,
        v_route_type, 'active', v_tick
    ) RETURNING id INTO v_route_id;

    RETURN jsonb_build_object(
        'success', true,
        'route_id', v_route_id,
        'corp_id', p_corp_id,
        'origin_city_id', v_a,
        'dest_city_id', v_b,
        'ticket_price', p_ticket_price,
        'route_type', v_route_type,
        'range_units', v_range,
        'aircraft', jsonb_build_object('regional', v_reg, 'narrowbody', v_nar, 'widebody', v_wide)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.entrepreneur_open_route(uuid, uuid, uuid, int, int, int, int) TO authenticated;

COMMENT ON FUNCTION public.entrepreneur_open_route(uuid, uuid, uuid, int, int, int, int) IS
    'Airline-corp owner opens a route between two cities. Requires owning a terminal at both endpoints + idle aircraft. Range-gated: regional ≤ 20, narrowbody ≤ 60, widebody any. ticket_price 0-500. maintenance_tier pinned ''basic'' in v1.';

-- ── 9. entrepreneur_close_route ──────────────────────────────────

CREATE OR REPLACE FUNCTION public.entrepreneur_close_route(
    p_corp_id  uuid,
    p_route_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid    uuid := auth.uid();
    v_corp   entrepreneur_corps%ROWTYPE;
    v_fac    factions%ROWTYPE;
    v_route  airline_routes%ROWTYPE;
    v_tick   int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL OR p_route_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
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
    IF v_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    SELECT * INTO v_route FROM airline_routes WHERE id = p_route_id FOR UPDATE;
    IF v_route.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'route_not_found');
    END IF;
    IF v_route.airline_corp_id <> p_corp_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_your_route');
    END IF;
    IF v_route.status <> 'active' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'route_not_active');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- Closed (not deleted) so history + aggregates survive. The aircraft
    -- become idle again because idle is computed over status='active'.
    UPDATE airline_routes
       SET status = 'closed', closed_at_tick = v_tick
     WHERE id = p_route_id;

    RETURN jsonb_build_object('success', true, 'corp_id', p_corp_id, 'route_id', p_route_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.entrepreneur_close_route(uuid, uuid) TO authenticated;

COMMENT ON FUNCTION public.entrepreneur_close_route(uuid, uuid) IS
    'Airline-corp owner closes a route (status=closed, kept for history). Assigned aircraft return to the idle pool.';

-- ── 10. found_entrepreneur_corp — airline starter seed branch ────
-- Verbatim 20270182 body + an airline branch: 2 free regional aircraft
-- and 2 free starter terminals at the HQ nation's two largest cities
-- (falling back to the globally largest if HQ has fewer than two), so
-- a first route is openable on day one despite the high aircraft prices.

CREATE OR REPLACE FUNCTION found_entrepreneur_corp(
    p_industry text, p_hq_nation_id uuid, p_name text, p_capital bigint, p_listing text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_fac       factions%ROWTYPE;
    v_capital   bigint := COALESCE(p_capital, 0);
    v_fee       bigint;
    v_total     bigint;
    v_id          uuid;
    v_tick        int;
    v_listing     text;
    v_city        uuid;
    v_seed_nation uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_name IS NULL OR length(btrim(p_name)) < 2 OR length(btrim(p_name)) > 80 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_name');
    END IF;
    IF v_capital < 5000000 OR v_capital > 500000000 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_capital');
    END IF;
    IF p_industry IS NULL OR length(btrim(p_industry)) = 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_industry');
    END IF;
    IF p_hq_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_hq_nation');
    END IF;
    v_listing := lower(COALESCE(NULLIF(btrim(p_listing), ''), 'private'));
    IF v_listing NOT IN ('private','public') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_listing');
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

    v_fee   := (v_capital * 5) / 100;
    v_total := v_capital + v_fee;
    IF COALESCE(v_fac.party_funds, 0) < v_total THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'have', COALESCE(v_fac.party_funds, 0), 'need', v_total);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;

    UPDATE factions
       SET party_funds = COALESCE(party_funds, 0) - v_total
     WHERE id = v_fac.id;

    INSERT INTO entrepreneur_corps
        (owner_faction_id, name, industry, hq_nation_id, starting_capital, founding_fee,
         listing, founded_tick, treasury_cash, shares_outstanding, share_price)
    VALUES
        (v_fac.id, btrim(p_name), p_industry, p_hq_nation_id, v_capital, v_fee,
         v_listing, COALESCE(v_tick, 0),
         v_capital::numeric,
         CASE WHEN v_listing = 'public' THEN 20 END,
         CASE WHEN v_listing = 'public' THEN v_capital::numeric / 20 END)
    RETURNING id INTO v_id;

    IF v_listing = 'public' THEN
        INSERT INTO corp_shareholdings (corp_id, holder_faction_id, shares)
        VALUES (v_id, v_fac.id, 20);
    END IF;

    -- Airline starter seed: 2 free regional aircraft + claim a terminal
    -- at two cities IN THE SAME NATION, so the resulting starter lane is
    -- domestic (range ≤ ~11) and the regional starters can actually fly
    -- it. A cross-nation pair (range 75-80) would need a widebody the
    -- corp doesn't have — so the two slots must share a nation.
    --
    -- Pick that nation: HQ if it has ≥2 seeded cities, else the
    -- city-richest qualifying nation. If no nation has ≥2 cities
    -- (degenerate / pre-aviation-seed DB), the corp still gets its 2
    -- aircraft and claims terminals later by hand.
    IF p_industry = 'airline' THEN
        UPDATE entrepreneur_corps SET aircraft_regional_owned = 2 WHERE id = v_id;

        SELECT nation_id INTO v_seed_nation
          FROM airline_cities
         GROUP BY nation_id
        HAVING COUNT(*) >= 2
         ORDER BY (nation_id = p_hq_nation_id) DESC, SUM(population_pct) DESC
         LIMIT 1;

        IF v_seed_nation IS NOT NULL THEN
            FOR v_city IN
                SELECT id FROM airline_cities
                 WHERE nation_id = v_seed_nation
                 ORDER BY population_pct DESC, name ASC
                 LIMIT 2
            LOOP
                UPDATE airline_terminals
                   SET owner_corp_id = v_id, acquired_at_tick = COALESCE(v_tick, 0)
                 WHERE id = (
                     SELECT id FROM airline_terminals
                      WHERE city_id = v_city
                        AND owner_airline_id IS NULL
                        AND owner_corp_id   IS NULL
                      ORDER BY terminal_number ASC
                      LIMIT 1
                 );
            END LOOP;
        END IF;
    END IF;

    RETURN jsonb_build_object('success', true, 'corp_id', v_id, 'listing', v_listing,
        'capital', v_capital, 'founding_fee', v_fee);
END;
$$;

GRANT EXECUTE ON FUNCTION found_entrepreneur_corp(text, uuid, text, bigint, text) TO authenticated;

COMMENT ON FUNCTION found_entrepreneur_corp(text, uuid, text, bigint, text) IS
    'Found an entrepreneur corp (private or public). Debits (capital + 5%% fee) from party_funds, seeds treasury_cash = capital. Public adds 20-share AMM state. Airline corps additionally get 2 free regional aircraft + 2 free starter terminals (HQ-nation largest cities, falling back to globally largest) so a first route is openable immediately.';

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK ──
-- BEGIN;
-- DROP FUNCTION IF EXISTS public.entrepreneur_close_route(uuid, uuid);
-- DROP FUNCTION IF EXISTS public.entrepreneur_open_route(uuid, uuid, uuid, int, int, int, int);
-- DROP FUNCTION IF EXISTS public.entrepreneur_release_terminal(uuid, uuid);
-- DROP FUNCTION IF EXISTS public.entrepreneur_claim_terminal(uuid, uuid);
-- DROP FUNCTION IF EXISTS public.entrepreneur_buy_aircraft(uuid, text, int);
-- -- found_entrepreneur_corp reverts by re-running 20270182's body.
-- ALTER TABLE airline_routes DROP CONSTRAINT IF EXISTS airline_routes_one_owner_chk;
-- ALTER TABLE airline_routes DROP COLUMN IF EXISTS airline_corp_id;
-- ALTER TABLE airline_terminals DROP COLUMN IF EXISTS owner_corp_id;
-- ALTER TABLE entrepreneur_corps
--     DROP COLUMN IF EXISTS aircraft_widebody_owned,
--     DROP COLUMN IF EXISTS aircraft_narrowbody_owned,
--     DROP COLUMN IF EXISTS aircraft_regional_owned;
-- ALTER TABLE entrepreneur_corps DROP CONSTRAINT IF EXISTS entrepreneur_corps_industry_check;
-- ALTER TABLE entrepreneur_corps ADD CONSTRAINT entrepreneur_corps_industry_check
--     CHECK (industry IN ('construction','banking','shipping','real_estate'));
-- COMMIT;
