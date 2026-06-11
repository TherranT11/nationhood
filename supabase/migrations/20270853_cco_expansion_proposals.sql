-- ════════════════════════════════════════════════════════════════════
-- 20270853 — The CCO's EXPAND MARKET proposal replaces Dealer Summit
--
-- Design change: the chief's second action is now a market-entry
-- pitch. The CCO picks a nation and the shape — main brand
-- expansion or a named subsidiary — and it lands in the Owner/CEO's
-- Pressing Issues to ACCEPT (the corp pays the entry fee and the
-- presence is established; no executive action — the CCO's daily
-- action was the price, the Product Engineer precedent) or REJECT
-- for free. One pending pitch per CCO. Shipping stock stays the
-- owner's Expand Market modal (free re-runs once present).
--
--   market_entry_cost is the ONE home of the fee ($10M flat /
--   $7M × the target's Standard of Living ÷ 50) — expand_market
--   re-emitted from 20270852 to read it, review_expansion_proposal
--   reads it on acceptance.
--   The Dealer Summit retires with the action: cco_dealer_summit is
--   dropped, the +1.5 branch leaves _resolve_sales_campaign
--   (re-emitted from 20270852), and summit_nation_id is dropped.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

DROP FUNCTION IF EXISTS public.cco_dealer_summit(uuid);
ALTER TABLE public.entrepreneur_corps DROP COLUMN IF EXISTS summit_nation_id;

CREATE TABLE IF NOT EXISTS public.market_expansion_proposals (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    corp_id             uuid NOT NULL REFERENCES public.entrepreneur_corps(id) ON DELETE CASCADE,
    proposer_faction_id uuid NOT NULL REFERENCES public.factions(id) ON DELETE CASCADE,
    nation_id           uuid NOT NULL REFERENCES public.nations(id) ON DELETE CASCADE,
    kind                text NOT NULL CHECK (kind IN ('expansion', 'subsidiary')),
    subsidiary_name     text,
    status              text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at_tick     int  NOT NULL,
    created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS market_expansion_proposals_corp_idx
    ON public.market_expansion_proposals (corp_id);

ALTER TABLE public.market_expansion_proposals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select for all" ON public.market_expansion_proposals;
CREATE POLICY "Allow select for all" ON public.market_expansion_proposals
    FOR SELECT USING (true);

-- ── market_entry_cost — the one fee ───────────────────────────────
CREATE OR REPLACE FUNCTION public.market_entry_cost(p_kind text, p_nation_id uuid)
RETURNS bigint
LANGUAGE sql STABLE
AS $$
    SELECT CASE WHEN p_kind = 'subsidiary'
        THEN ROUND(7000000 * GREATEST(1, COALESCE(
                 (SELECT standard_of_living FROM nations WHERE id = p_nation_id), 50)) / 50.0)::bigint
        ELSE 10000000::bigint
    END;
$$;
COMMENT ON FUNCTION public.market_entry_cost(text, uuid) IS
    'Market entry fee (20270840 pricing): $10M flat to expand, $7M × the TARGET nation''s Standard of Living / 50 for a subsidiary. The ONLY home of the formula — expand_market and review_expansion_proposal both read it.';

-- ── cco_propose_expansion ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.cco_propose_expansion(
    p_nation_id       uuid,
    p_kind            text,
    p_subsidiary_name text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid    uuid := auth.uid();
    v_fac    factions%ROWTYPE;
    v_corp   entrepreneur_corps%ROWTYPE;
    v_nation nations%ROWTYPE;
    v_tick   int;
    v_name   text := TRIM(COALESCE(p_subsidiary_name, ''));
    v_id     uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_nation_id IS NULL OR p_kind NOT IN ('expansion', 'subsidiary') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_kind = 'subsidiary' AND (length(v_name) < 2 OR length(v_name) > 60) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_name');
    END IF;
    v_fac := _commercial_chief_check(v_uid);
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_cco');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps
     WHERE id = v_fac.biz_employer_corp_id;
    IF p_nation_id = v_corp.hq_nation_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'home_nation');
    END IF;
    SELECT * INTO v_nation FROM nations
     WHERE id = p_nation_id AND name = ANY (market_nation_names());
    IF v_nation.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_not_live');
    END IF;
    IF EXISTS (SELECT 1 FROM corp_market_presence
                WHERE corp_id = v_corp.id AND nation_id = p_nation_id) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_present');
    END IF;
    -- One pitch on the boss's desk at a time.
    IF EXISTS (SELECT 1 FROM market_expansion_proposals
                WHERE proposer_faction_id = v_fac.id AND status = 'pending') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'proposal_pending');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_fac.biz_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    INSERT INTO market_expansion_proposals (
        corp_id, proposer_faction_id, nation_id, kind, subsidiary_name, created_at_tick
    ) VALUES (
        v_corp.id, v_fac.id, p_nation_id, p_kind,
        CASE WHEN p_kind = 'subsidiary' THEN v_name END, v_tick
    ) RETURNING id INTO v_id;

    UPDATE factions SET biz_action_tick = v_tick WHERE id = v_fac.id;

    RETURN jsonb_build_object('success', true, 'proposal_id', v_id,
        'nation', v_nation.name, 'kind', p_kind,
        'cost', market_entry_cost(p_kind, p_nation_id));
END $$;

REVOKE EXECUTE ON FUNCTION public.cco_propose_expansion(uuid, text, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.cco_propose_expansion(uuid, text, text) TO authenticated;

-- ── review_expansion_proposal — the owner's call ──────────────────
CREATE OR REPLACE FUNCTION public.review_expansion_proposal(
    p_proposal_id uuid,
    p_accept      boolean
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid    uuid := auth.uid();
    v_prop   market_expansion_proposals%ROWTYPE;
    v_corp   entrepreneur_corps%ROWTYPE;
    v_fac    factions%ROWTYPE;
    v_nation nations%ROWTYPE;
    v_tick   int;
    v_cost   bigint;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_proposal_id IS NULL OR p_accept IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_prop FROM market_expansion_proposals
     WHERE id = p_proposal_id FOR UPDATE;
    IF v_prop.id IS NULL OR v_prop.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_pending');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps
     WHERE id = v_prop.corp_id FOR UPDATE;
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

    IF NOT p_accept THEN
        UPDATE market_expansion_proposals SET status = 'rejected' WHERE id = v_prop.id;
        RETURN jsonb_build_object('success', true, 'accepted', false);
    END IF;

    -- The window may have closed since the pitch.
    IF EXISTS (SELECT 1 FROM corp_market_presence
                WHERE corp_id = v_corp.id AND nation_id = v_prop.nation_id) THEN
        UPDATE market_expansion_proposals SET status = 'rejected' WHERE id = v_prop.id;
        RETURN jsonb_build_object('success', false, 'reason', 'already_present');
    END IF;
    SELECT * INTO v_nation FROM nations
     WHERE id = v_prop.nation_id AND name = ANY (market_nation_names());
    IF v_nation.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_not_live');
    END IF;

    -- Acceptance pays the entry fee — no executive action; the
    -- CCO's daily action already paid for this pitch.
    v_cost := market_entry_cost(v_prop.kind, v_prop.nation_id);
    IF floor(COALESCE(v_corp.treasury_cash, 0))::bigint < v_cost THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_treasury',
            'need', v_cost, 'have', floor(COALESCE(v_corp.treasury_cash, 0))::bigint);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    INSERT INTO corp_market_presence (
        corp_id, nation_id, kind, subsidiary_name, cost_paid, established_tick
    ) VALUES (
        v_corp.id, v_prop.nation_id, v_prop.kind, v_prop.subsidiary_name, v_cost, v_tick
    );
    UPDATE entrepreneur_corps
       SET treasury_cash = COALESCE(treasury_cash, 0) - v_cost
     WHERE id = v_corp.id;
    UPDATE market_expansion_proposals SET status = 'accepted' WHERE id = v_prop.id;

    PERFORM _log_corp_history(v_corp.id, v_tick, CASE WHEN v_prop.kind = 'subsidiary'
        THEN format('Opened the subsidiary “%s” in %s ($%s) — the CCO''s pitch.', v_prop.subsidiary_name, v_nation.name, v_cost)
        ELSE format('Expanded into %s ($%s) — the CCO''s pitch.', v_nation.name, v_cost) END);

    RETURN jsonb_build_object('success', true, 'accepted', true,
        'nation', v_nation.name, 'kind', v_prop.kind, 'cost', v_cost);
END $$;

REVOKE EXECUTE ON FUNCTION public.review_expansion_proposal(uuid, boolean) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.review_expansion_proposal(uuid, boolean) TO authenticated;

-- ── expand_market — the fee reads the shared helper ───────────────
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
        END IF;
        v_cost := market_entry_cost(p_kind, p_nation_id);
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

    PERFORM _log_corp_history(p_corp_id, v_tick, CASE
        WHEN v_cost > 0 AND v_presence.kind = 'subsidiary'
            THEN format('Opened the subsidiary “%s” in %s ($%s)%s', v_presence.subsidiary_name, v_nation.name, v_cost,
                        CASE WHEN v_shipped > 0 THEN format(' — shipped %s vehicle(s).', v_shipped) ELSE '.' END)
        WHEN v_cost > 0
            THEN format('Expanded into %s ($%s)%s', v_nation.name, v_cost,
                        CASE WHEN v_shipped > 0 THEN format(' — shipped %s vehicle(s).', v_shipped) ELSE '.' END)
        ELSE format('Shipped %s vehicle(s) to %s.', v_shipped, v_nation.name)
    END);
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

-- ── _resolve_sales_campaign — the summit branch retires ───────────
CREATE OR REPLACE FUNCTION public._resolve_sales_campaign(
    p_corp_id      uuid,
    p_nation_id    uuid,
    p_blueprint_id uuid,
    p_price        bigint
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_corp   entrepreneur_corps%ROWTYPE;
    v_bp     vehicle_blueprints%ROWTYPE;
    v_nation nations%ROWTYPE;
    v_tick   int;
    v_aff    numeric;
    v_w      numeric;
    v_wsum   numeric;
    v_units  numeric;
    v_appeal numeric;
    v_comp   numeric;
    v_sold   int;
    v_rev    bigint;
    v_home   boolean;
    v_presence corp_market_presence%ROWTYPE;
    v_stockrow vehicle_market_stock%ROWTYPE;
    v_stock  int;
BEGIN
    IF p_corp_id IS NULL OR p_nation_id IS NULL OR p_blueprint_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_price IS NULL OR p_price < 1 OR p_price > 100000000 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_price');
    END IF;

    -- Lock the corp row: the allowance spend and the revenue credit
    -- below must serialize.
    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.industry <> 'automotive' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'industry_not_chartered');
    END IF;

    SELECT * INTO v_bp FROM vehicle_blueprints
     WHERE id = p_blueprint_id AND corp_id = p_corp_id;
    IF v_bp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'blueprint_not_found');
    END IF;

    SELECT * INTO v_nation FROM nations
     WHERE id = p_nation_id AND name = ANY (market_nation_names());
    IF v_nation.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_not_live');
    END IF;

    -- Home campaigns sell HQ inventory; foreign ones need presence
    -- there (Expand Market, 20270840) and sell the stock you shipped.
    -- A Subsidiary's local badge earns +1 appeal.
    v_home := (p_nation_id = v_corp.hq_nation_id);
    IF NOT v_home THEN
        SELECT * INTO v_presence FROM corp_market_presence
         WHERE corp_id = p_corp_id AND nation_id = p_nation_id;
        IF v_presence.id IS NULL THEN
            RETURN jsonb_build_object('success', false, 'reason', 'not_in_market');
        END IF;
        SELECT * INTO v_stockrow FROM vehicle_market_stock
         WHERE blueprint_id = p_blueprint_id AND nation_id = p_nation_id;
        v_stock := COALESCE(v_stockrow.units, 0);
    ELSE
        v_stock := COALESCE(v_bp.units_in_stock, 0);
    END IF;
    IF v_stock < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_stock');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- The month's demand for this type × class in the nation
    -- (identical math to analyze_vehicle_market via the helpers).
    v_aff := (GREATEST(1, COALESCE(v_nation.standard_of_living, 50))
              + GREATEST(1, COALESCE(v_nation.wages, 50))) / 2.0;
    v_w := vehicle_class_weight(v_bp.vehicle_class, v_aff);
    v_wsum := vehicle_class_weight('economy', v_aff) + vehicle_class_weight('mid_range', v_aff)
            + vehicle_class_weight('premium', v_aff) + vehicle_class_weight('luxury', v_aff)
            + vehicle_class_weight('ultra_luxury', v_aff);
    v_units := vehicle_type_monthly_demand(v_nation.population, v_bp.vehicle_type)
               * v_w / v_wsum;

    -- Gas prices and disposable income: high Energy on hand helps,
    -- a high Cost of Living hurts.
    v_units := v_units
        * GREATEST(0.5, LEAST(1.5, GREATEST(0, COALESCE(v_nation.energy, 0)) / 50.0))
        * GREATEST(0.5, LEAST(1.5, 50.0 / GREATEST(1, COALESCE(v_nation.cost_of_living, 50))));

    -- Pricing against the class anchor: undercutting sells more.
    -- Sweeten the Financing (20270846): the demand math reads the
    -- price 10% lower than the full sticker the buyers actually pay.
    v_units := v_units * GREATEST(0.4, LEAST(1.6,
        vehicle_class_anchor_price(v_bp.vehicle_class)::numeric
        / (p_price * CASE WHEN COALESCE(v_corp.sales_buff_price, 0) > 0 THEN 0.90 ELSE 1 END)));

    -- Appeal share against competitor Models of the same type with
    -- stock, HQ'd in the nation.
    v_appeal := vehicle_appeal(v_bp.engine, v_bp.quality,
                               COALESCE(array_length(v_bp.packages, 1), 0))
                -- Bench-tested designs (20270847) carry their bonus.
                + COALESCE(v_bp.appeal_bonus, 0)
                + CASE WHEN NOT v_home AND (v_presence).kind = 'subsidiary' THEN 1 ELSE 0 END
                -- Sharpen the Pitch (20270846): the rep's polish.
                + CASE WHEN COALESCE(v_corp.sales_buff_appeal, 0) > 0 THEN 0.5 ELSE 0 END;
    -- Rivals with stock IN this nation: locals' HQ inventory plus
    -- anything foreigners shipped in (their subsidiary badges don't
    -- defend — the bonus is the campaigner's edge).
    SELECT COALESCE(SUM(vehicle_appeal(vb.engine, vb.quality,
                                       COALESCE(array_length(vb.packages, 1), 0))
                        + COALESCE(vb.appeal_bonus, 0)), 0)
      INTO v_comp
      FROM vehicle_blueprints vb
      JOIN entrepreneur_corps ec ON ec.id = vb.corp_id
     WHERE vb.vehicle_type = v_bp.vehicle_type
       AND vb.corp_id <> p_corp_id
       AND ((ec.hq_nation_id = p_nation_id AND COALESCE(vb.units_in_stock, 0) > 0)
            OR EXISTS (SELECT 1 FROM vehicle_market_stock ms
                        WHERE ms.blueprint_id = vb.id
                          AND ms.nation_id = p_nation_id
                          AND ms.units > 0));
    v_units := v_units * v_appeal / (v_appeal + v_comp);

    -- Franchise & Commercial Suite (20270842): the network adds
    -- Demand at home by suite level (+1/+2/+3/+4, retained at V),
    -- and Subsidiary-brand campaigns gain +1/+2/+3 from Level III.
    IF v_home THEN
        v_units := v_units + franchise_home_demand(COALESCE(v_corp.franchise_tier, 1));
    ELSIF (v_presence).kind = 'subsidiary' THEN
        v_units := v_units + franchise_subsidiary_demand(COALESCE(v_corp.franchise_tier, 1));
    END IF;

    -- Drum Up Buyers (20270846): +10% units, rounded up, min +1 —
    -- applied before the stock cap.
    IF COALESCE(v_corp.sales_buff_units, 0) > 0 THEN
        v_units := v_units + GREATEST(1, CEIL(FLOOR(v_units) * 0.10));
    END IF;

    v_sold := LEAST(v_stock, FLOOR(v_units)::int);
    v_rev  := v_sold::bigint * p_price;

    IF v_home THEN
        UPDATE vehicle_blueprints
           SET units_in_stock = units_in_stock - v_sold
         WHERE id = v_bp.id;
    ELSE
        UPDATE vehicle_market_stock
           SET units = units - v_sold
         WHERE id = (v_stockrow).id;
    END IF;
    UPDATE entrepreneur_corps
       SET treasury_cash = COALESCE(treasury_cash, 0) + v_rev,
           sales_buff_units  = GREATEST(0, COALESCE(sales_buff_units, 0) - 1),
           sales_buff_appeal = GREATEST(0, COALESCE(sales_buff_appeal, 0) - 1),
           sales_buff_price  = GREATEST(0, COALESCE(sales_buff_price, 0) - 1)
     WHERE id = p_corp_id;
    IF v_rev > 0 THEN
        PERFORM stamp_entrepreneur_corp_revenue(p_corp_id, v_tick, v_rev);
    END IF;

    PERFORM _log_corp_history(p_corp_id, v_tick, format('Sales campaign in %s — sold %s × %s for $%s.', v_nation.name, v_sold, v_bp.name, v_rev));
    RETURN jsonb_build_object(
        'success', true,
        'sold',    v_sold,
        'revenue', v_rev,
        'name',    v_bp.name,
        'price',   p_price,
        'nation',  v_nation.name
    );
END $$;

REVOKE EXECUTE ON FUNCTION public._resolve_sales_campaign(uuid, uuid, uuid, bigint) FROM PUBLIC;

NOTIFY pgrst, 'reload schema';

COMMIT;
