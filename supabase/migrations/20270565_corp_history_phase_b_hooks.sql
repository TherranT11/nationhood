-- ════════════════════════════════════════════════════════════════════
-- 20270565 — Corporate History Phase B capture hooks
--
-- Phase A (20270564) shipped the list_corp_history RPC + the UI
-- container, but five of the spec's eighteen event types had no
-- event_log capture today and showed up empty:
--
--   • Corporation Founding (found_entrepreneur_corp)
--   • IPO / Going Public  (go_public)
--   • Going Private        (go_private)
--   • Share Purchases      (corp_trade, buy side)
--   • Share Sells          (corp_trade, sell side)
--
-- Loan Payments stays excluded — gated on the user's design change
-- from per-tick auto-payment to a manual [Pay Loan] button, which is
-- separate work.
--
-- Each function is re-issued here with a single event_log INSERT
-- added just before its happy-path RETURN. The bodies are otherwise
-- byte-identical to their last-known versions:
--
--   found_entrepreneur_corp ← 20270490_found_corp_home_nation_gate
--   go_public               ← sql/migrations/20270232_unified_100_share_model
--   go_private              ← sql/migrations/20270164_corp_share_price_history
--   corp_trade              ← sql/migrations/20270365_corp_trade_reapply_flat_fill
--
-- The new event rows follow the codebase's existing convention:
--   • Corp-as-subject events (founded, IPO, going-private) set
--     event_log.faction_id to the corp's id directly so
--     list_corp_history's faction_id = corp_id match picks them up
--     with no JSONB lookup.
--   • Actor-acting-on-corp events (share trades, mirroring the
--     existing corp_investment pattern from 20270444) set faction_id
--     to the actor and embed corp_id inside effects_applied — the
--     other arm of list_corp_history's match clause.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. found_entrepreneur_corp — emit 'corp_founded' on creation ──
CREATE OR REPLACE FUNCTION found_entrepreneur_corp(
    p_industry text, p_hq_nation_id uuid, p_name text, p_capital bigint, p_listing text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid           uuid := auth.uid();
    v_fac           factions%ROWTYPE;
    v_capital       bigint := COALESCE(p_capital, 0);
    v_fee           bigint;
    v_building_cost bigint;
    v_fleet_cost    bigint;
    v_mult          numeric;
    v_total         bigint;
    v_id            uuid;
    v_tick          int;
    v_listing       text;
    v_bld_type      text;
    v_oil_roll      int;
    v_starter_cost  bigint;
    v_home_name     text;
    v_home_id       uuid;
    v_nation_name   text;
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

    v_mult := nation_construction_cost_multiplier(p_hq_nation_id);
    IF v_mult IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_hq_nation');
    END IF;
    v_building_cost := ROUND(starter_building_base_cost(p_industry) * v_mult)::bigint;
    v_fleet_cost    := CASE WHEN p_industry = 'airline' THEN airline_starter_fleet_cost() ELSE 0 END;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;

    -- Home-nation gate. Origin = ent_origin_nation when set (20270349),
    -- else fall back to current nation so pre-snapshot entrepreneurs
    -- aren't locked out. Compare names case-insensitively / trim-safe
    -- to match the travel RPC's own comparison style.
    v_home_name := COALESCE(NULLIF(btrim(v_fac.ent_origin_nation), ''), v_fac.nation);
    IF v_home_name IS NULL OR length(btrim(v_home_name)) = 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_home_nation');
    END IF;

    SELECT id INTO v_home_id FROM nations
     WHERE lower(btrim(name)) = lower(btrim(v_home_name))
     LIMIT 1;
    IF v_home_id IS NULL OR p_hq_nation_id <> v_home_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_home_nation',
            'home_nation', v_home_name);
    END IF;

    IF lower(btrim(COALESCE(v_fac.nation, ''))) <> lower(btrim(v_home_name)) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_at_home_nation',
            'home_nation',      v_home_name,
            'current_location', v_fac.nation);
    END IF;

    v_fee   := (v_capital * 5) / 100;
    v_total := v_capital + v_fee + v_building_cost + v_fleet_cost;
    IF COALESCE(v_fac.party_funds, 0) < v_total THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'have',          COALESCE(v_fac.party_funds, 0),
            'need',          v_total,
            'capital',       v_capital,
            'fee',           v_fee,
            'building_cost', v_building_cost,
            'fleet_cost',    v_fleet_cost);
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

    -- Airline branch: no starter seed (20270479).

    IF p_industry = 'oil_and_gas' THEN
        v_oil_roll := v_fac.oil_and_gas_starter_roll;
        IF v_oil_roll IS NULL THEN
            v_oil_roll := floor(random() * 3)::int + 1;
        END IF;

        IF v_oil_roll = 1 THEN
            SELECT cost INTO v_starter_cost
              FROM corp_building_cost_profile('pump_jack', NULL, p_hq_nation_id);
            INSERT INTO corp_buildings (
                builder_corp_id, owner_corp_id, nation_id,
                name, tier, building_type,
                cost_paid, ambition_granted,
                status, started_at_tick, completes_at_tick, completed_at_tick,
                gdp_growth_applied, list_price
            ) VALUES (
                v_id, v_id, p_hq_nation_id,
                left(btrim(p_name) || ' Pump Jack', 80), 'small', 'pump_jack',
                COALESCE(v_starter_cost, 0), 0,
                'completed', COALESCE(v_tick, 0), COALESCE(v_tick, 0), COALESCE(v_tick, 0),
                true, NULL
            );
        ELSIF v_oil_roll = 2 THEN
            SELECT cost INTO v_starter_cost
              FROM corp_building_cost_profile('refinery_small', NULL, p_hq_nation_id);
            INSERT INTO corp_buildings (
                builder_corp_id, owner_corp_id, nation_id,
                name, tier, building_type,
                cost_paid, ambition_granted,
                status, started_at_tick, completes_at_tick, completed_at_tick,
                gdp_growth_applied, list_price
            ) VALUES (
                v_id, v_id, p_hq_nation_id,
                left(btrim(p_name) || ' Small Refinery', 80), 'small', 'refinery_small',
                COALESCE(v_starter_cost, 0), 0,
                'completed', COALESCE(v_tick, 0), COALESCE(v_tick, 0), COALESCE(v_tick, 0),
                true, NULL
            );
        ELSIF v_oil_roll = 3 THEN
            SELECT cost INTO v_starter_cost
              FROM corp_building_cost_profile('gas_station', NULL, p_hq_nation_id);
            INSERT INTO corp_buildings (
                builder_corp_id, owner_corp_id, nation_id,
                name, tier, building_type,
                cost_paid, ambition_granted,
                status, started_at_tick, completes_at_tick, completed_at_tick,
                gdp_growth_applied, list_price
            )
            SELECT v_id, v_id, p_hq_nation_id,
                   left(btrim(p_name) || ' Gas Station #' || gs.n, 80), 'small', 'gas_station',
                   COALESCE(v_starter_cost, 0), 0,
                   'completed', COALESCE(v_tick, 0), COALESCE(v_tick, 0), COALESCE(v_tick, 0),
                   true, NULL
              FROM generate_series(1, 3) AS gs(n);
        END IF;

        UPDATE factions
           SET oil_and_gas_starter_roll           = NULL,
               oil_and_gas_starter_rolled_at_tick = NULL
         WHERE id = v_fac.id;
    END IF;

    -- Other industries: one starter unique building. Building-type
    -- strings restored from 20270447 — the broken values from
    -- 20270477/20270479 violated corp_buildings_building_type_check.
    -- Aviation rolls a d6: a natural 6 picks the rarer
    -- engine_assembly_plant, anything else picks light_assembly_plant.
    IF p_industry IN ('construction','banking','real_estate','shipping','aviation_manufacturing') THEN
        v_bld_type := CASE p_industry
            WHEN 'construction'             THEN 'construction_yard'
            WHEN 'banking'                  THEN 'banking_office'
            WHEN 'real_estate'              THEN 'real_estate_office'
            WHEN 'shipping'                 THEN 'port'
            WHEN 'aviation_manufacturing'   THEN
                CASE WHEN floor(random() * 6) + 1 >= 6
                     THEN 'engine_assembly_plant' ELSE 'light_assembly_plant' END
        END;
        IF v_bld_type IS NOT NULL THEN
            INSERT INTO corp_buildings (
                builder_corp_id, owner_corp_id, nation_id,
                name, tier, building_type,
                cost_paid, ambition_granted,
                status, started_at_tick, completes_at_tick, completed_at_tick,
                gdp_growth_applied, list_price
            ) VALUES (
                v_id, v_id, p_hq_nation_id,
                left(btrim(p_name) || ' ' || replace(initcap(replace(v_bld_type, '_', ' ')), ' ', ' '), 80),
                'small', v_bld_type,
                v_building_cost, 0,
                'completed', COALESCE(v_tick, 0), COALESCE(v_tick, 0), COALESCE(v_tick, 0),
                true, NULL
            );
        END IF;
    END IF;

    -- Phase B hook (20270565): emit a 'corp_founded' event so the
    -- Corporate History container picks up incorporation.
    SELECT name INTO v_nation_name FROM nations WHERE id = p_hq_nation_id;
    INSERT INTO event_log (
        nation_id, faction_id, event_name, description_used,
        category, trigger_key, effects_applied, fired_at_tick
    ) VALUES (
        p_hq_nation_id, v_id,
        'Corporation Founded',
        format('%s was founded in %s with $%s in starting capital (%s).',
               btrim(p_name),
               COALESCE(v_nation_name, '—'),
               to_char(v_capital, 'FM999,999,999,999'),
               v_listing),
        'business', 'corp_founded',
        jsonb_build_object(
            'corp_id',         v_id,
            'industry',        p_industry,
            'capital',         v_capital,
            'fee',             v_fee,
            'listing',         v_listing,
            'founder_faction_id', v_fac.id
        ),
        COALESCE(v_tick, 0)
    );

    RETURN jsonb_build_object(
        'success',   true,
        'id',        v_id,
        'industry',  p_industry,
        'capital',   v_capital,
        'fee',       v_fee,
        'building_cost', v_building_cost,
        'fleet_cost',    v_fleet_cost,
        'total',     v_total
    );
END;
$$;

-- ── 2. go_public — emit 'corp_went_public' on IPO ─────────────────
CREATE OR REPLACE FUNCTION public.go_public(
    p_corp_id UUID
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid             UUID := auth.uid();
    v_fac             factions%ROWTYPE;
    v_corp            entrepreneur_corps%ROWTYPE;
    v_price           NUMERIC;
    v_treas           NUMERIC;
    v_dir_insider     int;
    v_founder_insider int;
    v_tick            int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL THEN
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

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;
    IF v_corp.listing <> 'private' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_public');
    END IF;

    -- Share price anchored to current cash; 100 shares so valuation = treasury.
    v_treas := COALESCE(v_corp.treasury_cash, v_corp.starting_capital::numeric);
    v_price := v_treas / 100;

    IF v_corp.shares_outstanding IS NULL THEN
        -- Sole-founder private corp: founder 20, 80 public float.
        UPDATE entrepreneur_corps
           SET listing            = 'public',
               shares_outstanding = 100,
               share_price        = v_price,
               updated_at         = now()
         WHERE id = p_corp_id;

        INSERT INTO corp_shareholdings (corp_id, holder_faction_id, shares)
        VALUES (p_corp_id, v_fac.id, 20)
        ON CONFLICT (corp_id, holder_faction_id) DO UPDATE SET shares = 20;
    ELSE
        -- Director-invested: scale ALL existing holders proportionally into a
        -- 20-share insider pool (directors keep ≥1 — no silent wipe), founder
        -- absorbs the rounding remainder; the other 80 become the float.
        SELECT COALESCE(SUM(GREATEST(1, ROUND(shares * 20.0 / v_corp.shares_outstanding))), 0)::int
          INTO v_dir_insider
          FROM corp_shareholdings
         WHERE corp_id = p_corp_id
           AND holder_faction_id <> v_corp.owner_faction_id
           AND shares > 0;

        UPDATE corp_shareholdings
           SET shares = GREATEST(1, ROUND(shares * 20.0 / v_corp.shares_outstanding))::int
         WHERE corp_id = p_corp_id
           AND holder_faction_id <> v_corp.owner_faction_id
           AND shares > 0;

        v_founder_insider := GREATEST(0, 20 - v_dir_insider);
        INSERT INTO corp_shareholdings (corp_id, holder_faction_id, shares)
        VALUES (p_corp_id, v_corp.owner_faction_id, v_founder_insider)
        ON CONFLICT (corp_id, holder_faction_id) DO UPDATE SET shares = v_founder_insider;

        DELETE FROM corp_shareholdings WHERE corp_id = p_corp_id AND shares <= 0;

        UPDATE entrepreneur_corps
           SET listing            = 'public',
               shares_outstanding = 100,
               share_price        = v_price,
               updated_at         = now()
         WHERE id = p_corp_id;
    END IF;

    -- Phase B hook (20270565): IPO event. Corp is the subject so
    -- faction_id = corp id (list_corp_history matches directly).
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    INSERT INTO event_log (
        nation_id, faction_id, event_name, description_used,
        category, trigger_key, effects_applied, fired_at_tick
    ) VALUES (
        v_corp.hq_nation_id, v_corp.id,
        'Initial Public Offering',
        format('%s went public at $%s per share (treasury $%s, 100 shares outstanding, 80-share float).',
               v_corp.name,
               to_char(v_price, 'FM999,999,999,990.00'),
               to_char(v_treas, 'FM999,999,999,999')),
        'business', 'corp_went_public',
        jsonb_build_object(
            'corp_id',            v_corp.id,
            'share_price',        v_price,
            'shares_outstanding', 100,
            'treasury_cash',      v_treas
        ),
        COALESCE(v_tick, 0)
    );

    RETURN jsonb_build_object(
        'success',            true,
        'corp_id',            p_corp_id,
        'listing',            'public',
        'shares_outstanding', 100,
        'share_price',        v_price,
        'treasury_cash',      v_treas
    );
END;
$$;

-- ── 3. go_private — emit 'corp_went_private' on delisting ─────────
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
    v_tick    INT;
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

    -- Phase B hook (20270565): going-private event. Corp is subject.
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    INSERT INTO event_log (
        nation_id, faction_id, event_name, description_used,
        category, trigger_key, effects_applied, fired_at_tick
    ) VALUES (
        v_corp.hq_nation_id, v_corp.id,
        'Taken Private',
        format('%s was taken private. Outstanding shares bought out for $%s (treasury $%s reclaimed by the founder).',
               v_corp.name,
               to_char(v_total, 'FM999,999,999,999'),
               to_char(v_treas, 'FM999,999,999,999')),
        'business', 'corp_went_private',
        jsonb_build_object(
            'corp_id',            v_corp.id,
            'bought_out',         v_total,
            'treasury_reclaimed', v_treas,
            'premium_pct',        25
        ),
        COALESCE(v_tick, 0)
    );

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

-- ── 4. corp_trade — emit 'corp_shares_bought' / 'corp_shares_sold' ─
CREATE OR REPLACE FUNCTION corp_trade(
    p_corp_id uuid, p_side text, p_quantity int
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pct       numeric := 0.01;   -- 1% per share
    v_corp      entrepreneur_corps%ROWTYPE;
    v_fac       factions%ROWTYPE;
    v_amount    numeric;   -- exact cost (buy) or proceeds (sell)
    v_pay_n     numeric;   -- whole-dollar, treasury-favouring
    v_pay       bigint;
    v_new_price numeric;
    v_have      int;       -- seller's current holding
    v_owned     int;       -- holder's shares after the trade
    v_held      int;       -- Σ all holdings (for the fixed float)
    v_available int;
    v_tick      int;
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

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;

    IF p_side = 'buy' THEN
        IF p_quantity > v_available THEN
            RETURN jsonb_build_object('success', false, 'reason', 'insufficient_float',
                'available', GREATEST(v_available, 0));
        END IF;

        -- Flat fill: all N shares at the current price. The 1%-per-share
        -- move is applied to new_price below, not walked into the cost.
        v_amount    := v_corp.share_price * p_quantity;
        v_pay_n     := ceil(v_amount);                  -- buyer pays ≥ exact
        v_new_price := v_corp.share_price * (1 + v_pct * p_quantity);

        IF COALESCE(v_fac.party_funds, 0) < v_pay_n THEN
            RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
                'have', COALESCE(v_fac.party_funds, 0), 'need', v_pay_n);
        END IF;
        v_pay := v_pay_n::bigint;

        UPDATE factions SET party_funds = COALESCE(party_funds, 0) - v_pay
         WHERE id = v_fac.id;

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

        -- Phase B hook (20270565). Buyer is the actor; corp_id rides
        -- in effects_applied so list_corp_history's JSONB match arm
        -- picks it up. Same convention as 20270444 corp_investment.
        INSERT INTO event_log (
            nation_id, faction_id, event_name, description_used,
            category, trigger_key, effects_applied, fired_at_tick
        ) VALUES (
            v_corp.hq_nation_id, v_fac.id,
            'Shares Purchased',
            format('A shareholder bought %s share(s) of %s for $%s.',
                   p_quantity, v_corp.name,
                   to_char(v_pay, 'FM999,999,999,999')),
            'business', 'corp_shares_bought',
            jsonb_build_object(
                'corp_id',     v_corp.id,
                'buyer_faction_id', v_fac.id,
                'quantity',    p_quantity,
                'paid',        v_pay,
                'new_price',   v_new_price
            ),
            COALESCE(v_tick, 0)
        );

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

    v_new_price := v_corp.share_price * (1 - v_pct * p_quantity);
    -- Linear curve has a hard floor at p_quantity = 1/pct (= 100 at
    -- 1%). Anything ≥ that would drive the price to zero or negative.
    IF v_new_price <= 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'price_floor',
            'max_per_trade', floor(1 / v_pct)::int - 1);
    END IF;

    -- Flat fill: all N shares sold at the current price; the 1%-per-share
    -- drop is applied to new_price above, not walked into the proceeds.
    v_amount := v_corp.share_price * p_quantity;
    v_pay_n  := floor(v_amount);                       -- seller gets ≤ exact

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

    -- Phase B hook (20270565). Same shape as the buy branch.
    INSERT INTO event_log (
        nation_id, faction_id, event_name, description_used,
        category, trigger_key, effects_applied, fired_at_tick
    ) VALUES (
        v_corp.hq_nation_id, v_fac.id,
        'Shares Sold',
        format('A shareholder sold %s share(s) of %s for $%s.',
               p_quantity, v_corp.name,
               to_char(v_pay, 'FM999,999,999,999')),
        'business', 'corp_shares_sold',
        jsonb_build_object(
            'corp_id',     v_corp.id,
            'seller_faction_id', v_fac.id,
            'quantity',    p_quantity,
            'proceeds',    v_pay,
            'new_price',   v_new_price
        ),
        COALESCE(v_tick, 0)
    );

    RETURN jsonb_build_object('success', true,
        'corp_id', p_corp_id, 'side', 'sell', 'quantity', p_quantity,
        'proceeds', v_pay, 'new_price', v_new_price,
        'shares_owned', v_owned,
        'shares_outstanding', v_corp.shares_outstanding,
        'available', v_available + p_quantity,
        'new_funds', COALESCE(v_fac.party_funds, 0) + v_pay);
END;
$$;

NOTIFY pgrst, 'reload schema';

COMMIT;
