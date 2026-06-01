-- ════════════════════════════════════════════════════════════════════
-- SOT consolidation: entrepreneur_aircraft_class_price() helper
--
-- Audit on 20270441 found the off-the-shelf regional jet price ($60M)
-- duplicated across two SQL sites:
--
--   entrepreneur_buy_aircraft   — CASE on aircraft_class returning
--                                 $60M / $90M / $120M (20270204)
--   airline_starter_fleet_cost  — hardcoded $60M (20270441)
--
-- Both numbers must move together when aircraft pricing is tuned, but
-- nothing links them — pure copy-and-paste convention. This migration
-- extracts the per-class lookup into a single immutable function and
-- updates both call sites to read from it.
--
-- Two surgical updates:
--   1. entrepreneur_aircraft_class_price(p_class text) — new helper.
--      Single source for off-the-shelf aircraft prices. NULL on
--      unknown class (caller can decide how to handle).
--   2. entrepreneur_buy_aircraft — CASE replaced by a single
--      helper call. Body otherwise byte-identical to 20270204.
--   3. airline_starter_fleet_cost — now returns
--      entrepreneur_aircraft_class_price('regional') × 1
--      (1 regional jet at market price, the design spec from
--      20270441). If the regional price moves, both founding cost
--      and post-founding buy price track together automatically.
--
-- Aircraft DESIGN research costs (20261028 / 20261104 / 20270221)
-- are a different concept — what it costs to design a new aircraft
-- from scratch — and stay untouched.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. The helper — single source for class prices ──────────────────
CREATE OR REPLACE FUNCTION public.entrepreneur_aircraft_class_price(p_class text)
RETURNS bigint
LANGUAGE sql IMMUTABLE
AS $$
    SELECT CASE p_class
        WHEN 'regional'   THEN 60000000
        WHEN 'narrowbody' THEN 90000000
        WHEN 'widebody'   THEN 120000000
        ELSE NULL
    END::bigint;
$$;
GRANT EXECUTE ON FUNCTION public.entrepreneur_aircraft_class_price(text) TO authenticated;

COMMENT ON FUNCTION public.entrepreneur_aircraft_class_price(text) IS
    'Single source of truth for off-the-shelf aircraft purchase prices by class. regional $60M / narrowbody $90M / widebody $120M; NULL on unknown class. Called by entrepreneur_buy_aircraft + airline_starter_fleet_cost. Aircraft-design research costs are a separate concept and not tracked here.';

-- ── 2. entrepreneur_buy_aircraft — use the helper ───────────────────
-- Body of 20270204 with the price CASE replaced by a single helper
-- call. Validation, FOR UPDATE locks, corp_aircraft INSERT,
-- treasury_cash deduct, return shape — all preserved byte-for-byte.
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
    v_new_owned int;
    v_tick      int;
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

    v_unit  := entrepreneur_aircraft_class_price(p_class);
    v_cost  := v_unit * p_quantity::bigint;
    v_treas := COALESCE(v_corp.treasury_cash, 0);
    IF v_treas < v_cost THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'have', v_treas::bigint, 'need', v_cost, 'payer', 'corp');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    INSERT INTO corp_aircraft (entrepreneur_corp_id, aircraft_class, condition, acquired_at_tick)
    SELECT p_corp_id, p_class, 100, v_tick
      FROM generate_series(1, p_quantity);

    UPDATE entrepreneur_corps
       SET treasury_cash = COALESCE(treasury_cash, 0) - v_cost
     WHERE id = p_corp_id;

    SELECT COUNT(*) INTO v_new_owned
      FROM corp_aircraft
     WHERE entrepreneur_corp_id = p_corp_id AND aircraft_class = p_class;

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
    'Airline-corp owner buys N aircraft of a class from treasury_cash. Prices via entrepreneur_aircraft_class_price (single source). Inserts one corp_aircraft row per plane (condition 100, idle) — the rows are the single source of truth for the fleet. Uncapped — per-tick ops cost is the natural limiter.';

-- ── 3. airline_starter_fleet_cost — use the helper ──────────────────
-- 1 regional jet at off-the-shelf market price. The "1" stays as the
-- design intent (cut from 2 in 20270441); the price now tracks the
-- shared helper. If aircraft pricing moves, this updates automatically.
CREATE OR REPLACE FUNCTION public.airline_starter_fleet_cost()
RETURNS bigint
LANGUAGE sql STABLE
AS $$
    SELECT entrepreneur_aircraft_class_price('regional') * 1;
$$;
GRANT EXECUTE ON FUNCTION public.airline_starter_fleet_cost() TO authenticated;

COMMENT ON FUNCTION public.airline_starter_fleet_cost() IS
    'Total cash debited at airline founding for the 1 regional starter aircraft. Price = entrepreneur_aircraft_class_price(''regional'') — same single source as entrepreneur_buy_aircraft, so founding cost tracks post-founding purchase price automatically.';

NOTIFY pgrst, 'reload schema';

COMMIT;
