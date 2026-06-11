-- ════════════════════════════════════════════════════════════════════
-- 20270844 — Expand Market: validate shipments before the fee moves
--
-- Audit fix. expand_market (20270840) charged the entry fee and
-- created the presence row BEFORE validating the shipment list — a
-- plain plpgsql RETURN does not roll back, so a ship_exceeds_stock
-- row left the fee paid, the presence established, and the caller
-- staring at an error. Re-emitted byte-faithful except the shipment
-- validation now runs as a first pass (taking the blueprint row
-- locks) before any money or presence state changes; the apply loop
-- keeps only the writes.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── expand_market — validate-then-apply ───────────────────────────
CREATE OR REPLACE FUNCTION public.expand_market(
    p_corp_id         uuid,
    p_nation_id       uuid,
    p_kind            text,
    p_subsidiary_name text,
    p_shipments       jsonb
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid      uuid := auth.uid();
    v_fac      factions%ROWTYPE;
    v_corp     entrepreneur_corps%ROWTYPE;
    v_nation   nations%ROWTYPE;
    v_presence corp_market_presence%ROWTYPE;
    v_tick     int;
    v_cost     bigint := 0;
    v_name     text := TRIM(COALESCE(p_subsidiary_name, ''));
    v_shipped  int := 0;
    r          RECORD;
    v_bp       vehicle_blueprints%ROWTYPE;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL OR p_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_kind NOT IN ('expansion', 'subsidiary') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_kind');
    END IF;

    -- Lock the corp row: allowance, fee, and HQ stock deductions
    -- below must serialize.
    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.industry <> 'automotive' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'industry_not_chartered');
    END IF;
    IF p_nation_id = v_corp.hq_nation_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'home_nation');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE id = v_corp.owner_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'businessman'
       AND abandoned_at IS NULL;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;
    IF lower(COALESCE(v_fac.status, '')) = 'arrested' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'arrested');
    END IF;

    SELECT * INTO v_nation FROM nations
     WHERE id = p_nation_id AND name = ANY (market_nation_names());
    IF v_nation.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_not_live');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_corp.exec_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    -- Validate every shipment BEFORE any money moves (20270844): a
    -- bad row must not leave the entry fee paid with nothing shipped
    -- (a plain RETURN does not roll back the debit). The row locks
    -- taken here also serialize the stock deductions below.
    FOR r IN SELECT * FROM jsonb_to_recordset(COALESCE(p_shipments, '[]'::jsonb))
                  AS x(blueprint_id uuid, units int, local_name text, list_price bigint)
    LOOP
        SELECT * INTO v_bp FROM vehicle_blueprints
         WHERE id = r.blueprint_id AND corp_id = p_corp_id
         FOR UPDATE;
        IF v_bp.id IS NULL THEN
            RETURN jsonb_build_object('success', false, 'reason', 'blueprint_not_found');
        END IF;
        IF COALESCE(r.units, 0) < 0 OR COALESCE(r.units, 0) > COALESCE(v_bp.units_in_stock, 0) THEN
            RETURN jsonb_build_object('success', false, 'reason', 'ship_exceeds_stock',
                'model', v_bp.name, 'have', COALESCE(v_bp.units_in_stock, 0));
        END IF;
    END LOOP;

    SELECT * INTO v_presence FROM corp_market_presence
     WHERE corp_id = p_corp_id AND nation_id = p_nation_id;

    IF v_presence.id IS NULL THEN
        -- First entry pays the fee: $10M flat to expand, or
        -- $7M × the TARGET nation's Standard of Living / 50 for a
        -- named subsidiary.
        IF p_kind = 'subsidiary' THEN
            IF length(v_name) < 2 OR length(v_name) > 60 THEN
                RETURN jsonb_build_object('success', false, 'reason', 'invalid_name');
            END IF;
            v_cost := ROUND(7000000
                * GREATEST(1, COALESCE(v_nation.standard_of_living, 50)) / 50.0)::bigint;
        ELSE
            v_cost := 10000000;
        END IF;
        IF floor(COALESCE(v_corp.treasury_cash, 0))::bigint < v_cost THEN
            RETURN jsonb_build_object('success', false, 'reason', 'insufficient_treasury',
                'need', v_cost, 'have', floor(COALESCE(v_corp.treasury_cash, 0))::bigint);
        END IF;
        INSERT INTO corp_market_presence (
            corp_id, nation_id, kind, subsidiary_name, cost_paid, established_tick
        ) VALUES (
            p_corp_id, p_nation_id, p_kind,
            CASE WHEN p_kind = 'subsidiary' THEN v_name END, v_cost, v_tick
        ) RETURNING * INTO v_presence;
        UPDATE entrepreneur_corps
           SET treasury_cash = COALESCE(treasury_cash, 0) - v_cost
         WHERE id = p_corp_id;
    END IF;
    -- Already present: the re-run ships and re-prices for free.

    -- Shipments (validated above): move units HQ → nation, set
    -- standing prices, and (subsidiaries only) the local Model names.
    FOR r IN SELECT * FROM jsonb_to_recordset(COALESCE(p_shipments, '[]'::jsonb))
                  AS x(blueprint_id uuid, units int, local_name text, list_price bigint)
    LOOP
        IF COALESCE(r.units, 0) > 0 THEN
            UPDATE vehicle_blueprints
               SET units_in_stock = units_in_stock - r.units
             WHERE id = r.blueprint_id;
            v_shipped := v_shipped + COALESCE(r.units, 0);
        END IF;
        INSERT INTO vehicle_market_stock (corp_id, nation_id, blueprint_id, units, local_name, list_price)
        VALUES (p_corp_id, p_nation_id, r.blueprint_id, COALESCE(r.units, 0),
                CASE WHEN v_presence.kind = 'subsidiary' THEN NULLIF(TRIM(COALESCE(r.local_name, '')), '') END,
                r.list_price)
        ON CONFLICT (blueprint_id, nation_id) DO UPDATE
           SET units      = vehicle_market_stock.units + COALESCE(EXCLUDED.units, 0),
               local_name = CASE WHEN v_presence.kind = 'subsidiary'
                                 THEN COALESCE(EXCLUDED.local_name, vehicle_market_stock.local_name)
                                 ELSE vehicle_market_stock.local_name END,
               list_price = COALESCE(EXCLUDED.list_price, vehicle_market_stock.list_price);
    END LOOP;

    UPDATE entrepreneur_corps SET exec_action_tick = v_tick WHERE id = p_corp_id;

    RETURN jsonb_build_object(
        'success',   true,
        'kind',      v_presence.kind,
        'name',      v_presence.subsidiary_name,
        'cost_paid', v_cost,
        'shipped',   v_shipped,
        'nation',    v_nation.name
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.expand_market(uuid, uuid, text, text, jsonb) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.expand_market(uuid, uuid, text, text, jsonb) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
