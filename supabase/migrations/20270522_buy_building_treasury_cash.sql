-- ════════════════════════════════════════════════════════════════════
-- 20270521 — buy_building: pay from buyer corp's treasury_cash
--
-- Player report: a public real-estate corp purchased the Flandis
-- Commercial Pier for $19M via Browse Market. The $19M was deducted
-- from the FOUNDER's personal cash (factions.party_funds) instead of
-- the CORP's treasury (entrepreneur_corps.treasury_cash). Especially
-- broken for public corps — the founder has no legitimate way to
-- inject cash into one, yet was charged for the buy. Same bug on
-- private corps since the RPC doesn't differentiate.
--
-- Root cause: buy_building's last re-author (20270428) carried over
-- the original party_funds wiring without migrating to the treasury
-- pattern that broker_buy_listing, request_building_construction, etc.
-- already use. The comment on accept_offer (20270207) flagged
-- "Money moves corp-to-corp via treasury_cash" as the intended model
-- but buy_building was overlooked.
--
-- Fix: route the price through treasury_cash on both ends in the
-- non-abandoned path:
--   • affordability check + deduction: buyer corp's treasury_cash
--   • seller credit:                   seller corp's treasury_cash
-- The abandoned path is unchanged on the seller side (ex-owner's
-- party_funds + their personal loan get the proceeds since the
-- bankrupted corp no longer exists), but the BUYER still pays from
-- their corp's treasury — that's the part the old code got wrong
-- for both paths.
--
-- Founder ownership check (v_fac lookup + corp-owner verify) stays —
-- only the corp owner can spend the corp's treasury via this RPC.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.buy_building(
    p_building_id   uuid,
    p_buyer_corp_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid              uuid := auth.uid();
    v_fac              factions%ROWTYPE;
    v_building         corp_buildings%ROWTYPE;
    v_buyer_corp       entrepreneur_corps%ROWTYPE;
    v_seller_corp      entrepreneur_corps%ROWTYPE;
    v_seller_fac_id    uuid;
    v_price            bigint;
    v_tick             int;
    v_nation_name      text;
    v_abandoned        bool := false;
    v_loan_id          uuid;
    v_paydown          jsonb;
    v_to_loan          bigint := 0;
    v_int_paid         bigint := 0;
    v_prin_paid        bigint := 0;
    v_to_party_funds   bigint;
    v_new_treasury     bigint;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_building_id IS NULL OR p_buyer_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_building FROM corp_buildings
     WHERE id = p_building_id FOR UPDATE;
    IF v_building.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'building_not_found');
    END IF;
    IF v_building.list_price IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_for_sale');
    END IF;
    IF v_building.status <> 'completed' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_completed');
    END IF;

    IF v_building.owner_corp_id IS NULL THEN
        IF v_building.previous_owner_faction_id IS NULL THEN
            RETURN jsonb_build_object('success', false, 'reason', 'no_seller');
        END IF;
        v_abandoned     := true;
        v_seller_fac_id := v_building.previous_owner_faction_id;
    ELSE
        IF p_buyer_corp_id = v_building.owner_corp_id THEN
            RETURN jsonb_build_object('success', false, 'reason', 'cannot_buy_own_building');
        END IF;
    END IF;
    v_price := v_building.list_price;

    IF v_abandoned THEN
        PERFORM id FROM entrepreneur_corps WHERE id = p_buyer_corp_id FOR UPDATE;
    ELSE
        PERFORM id FROM entrepreneur_corps
         WHERE id IN (p_buyer_corp_id, v_building.owner_corp_id)
         ORDER BY id FOR UPDATE;
    END IF;

    SELECT * INTO v_buyer_corp FROM entrepreneur_corps WHERE id = p_buyer_corp_id;
    IF v_buyer_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'buyer_corp_not_found');
    END IF;
    IF v_buyer_corp.industry <> 'real_estate' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'buyer_not_real_estate');
    END IF;

    IF NOT v_abandoned THEN
        SELECT * INTO v_seller_corp FROM entrepreneur_corps WHERE id = v_building.owner_corp_id;
        IF v_seller_corp.id IS NULL THEN
            RETURN jsonb_build_object('success', false, 'reason', 'seller_corp_not_found');
        END IF;
        IF v_seller_corp.owner_faction_id IS NULL THEN
            RETURN jsonb_build_object('success', false, 'reason', 'seller_orphan');
        END IF;
        v_seller_fac_id := v_seller_corp.owner_faction_id;
    END IF;

    -- Owner-of-corp check: the calling user must be the corp's owner
    -- (or the linked second-account owner). Auth boundary unchanged
    -- from 20270428; only the cash plumbing is being rewired.
    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;
    IF v_buyer_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_buyer_corp_owner');
    END IF;

    -- ── Affordability + deduction on the BUYER CORP's treasury ───
    -- This is the fix: prior versions checked + debited the founder's
    -- party_funds, charging the player personally for what should be
    -- a corporate expense. Especially broken on public corps where
    -- the founder can't legally inject cash into the treasury.
    IF COALESCE(v_buyer_corp.treasury_cash, 0) < v_price THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'have', COALESCE(v_buyer_corp.treasury_cash, 0), 'need', v_price);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE entrepreneur_corps
       SET treasury_cash = COALESCE(treasury_cash, 0) - v_price
     WHERE id = p_buyer_corp_id
    RETURNING treasury_cash INTO v_new_treasury;

    IF v_abandoned THEN
        -- Abandoned: the seller corp is gone. Proceeds go to the
        -- ex-owner entrepreneur — first to settle any active personal
        -- loan, then the remainder to their party_funds. Lock order
        -- (loan → seller faction) matches make_personal_loan_payment
        -- so concurrent paydowns can't deadlock.
        SELECT id INTO v_loan_id FROM personal_loans
         WHERE borrower_faction_id = v_seller_fac_id AND status = 'active'
         LIMIT 1;

        IF v_loan_id IS NOT NULL THEN
            v_paydown   := apply_personal_loan_paydown(v_loan_id, v_price, v_tick, false);
            v_to_loan   := (v_paydown->>'total_applied')::bigint;
            v_int_paid  := (v_paydown->>'interest_paid')::bigint;
            v_prin_paid := (v_paydown->>'principal_paid')::bigint;
        END IF;

        v_to_party_funds := v_price - v_to_loan;
        IF v_to_party_funds > 0 THEN
            UPDATE factions SET party_funds = COALESCE(party_funds, 0) + v_to_party_funds
             WHERE id = v_seller_fac_id;
        END IF;
    ELSE
        -- Standard corp-to-corp sale: credit the seller corp's
        -- treasury_cash. Same model broker_buy_listing /
        -- accept_offer use for owned-building transfers.
        UPDATE entrepreneur_corps
           SET treasury_cash = COALESCE(treasury_cash, 0) + v_price
         WHERE id = v_seller_corp.id;
    END IF;

    UPDATE corp_buildings
       SET owner_corp_id              = p_buyer_corp_id,
           list_price                 = NULL,
           previous_owner_faction_id  = NULL
     WHERE id = p_building_id;

    SELECT name INTO v_nation_name FROM nations WHERE id = v_building.nation_id;
    INSERT INTO event_log (
        nation_id, faction_id, event_name, description_used,
        category, trigger_key, effects_applied, fired_at_tick
    ) VALUES (
        v_building.nation_id, v_fac.id,
        CASE WHEN v_abandoned THEN 'Abandoned Building Acquired' ELSE 'Building Acquired' END,
        CASE WHEN v_abandoned
             THEN format('%s acquires abandoned %s in %s for $%s. $%s → loan paydown, $%s → ex-owner.',
                         v_buyer_corp.name, v_building.name, v_nation_name,
                         to_char(v_price, 'FM999,999,999,999'),
                         to_char(v_to_loan, 'FM999,999,999,999'),
                         to_char(v_to_party_funds, 'FM999,999,999,999'))
             ELSE format('%s acquires %s in %s from %s for $%s.',
                         v_buyer_corp.name, v_building.name, v_nation_name,
                         v_seller_corp.name, to_char(v_price, 'FM999,999,999,999'))
        END,
        'corporate', 'building_purchased',
        jsonb_build_object(
            'building_id',      p_building_id,
            'building_name',    v_building.name,
            'buyer_corp_id',    p_buyer_corp_id,
            'buyer_corp_name',  v_buyer_corp.name,
            'seller_corp_id',   v_seller_corp.id,
            'seller_corp_name', v_seller_corp.name,
            'price',            v_price,
            'tier',             v_building.tier,
            'abandoned',        v_abandoned,
            'loan_paydown',     v_to_loan,
            'to_party_funds',   v_to_party_funds
        ),
        v_tick
    );

    RETURN jsonb_build_object(
        'success',           true,
        'building_id',       p_building_id,
        'price',             v_price,
        'new_owner_corp_id', p_buyer_corp_id,
        'seller_corp_id',    v_seller_corp.id,
        'abandoned',         v_abandoned,
        'loan_paydown',      v_to_loan,
        'to_party_funds',    v_to_party_funds,
        'new_treasury',      v_new_treasury
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.buy_building(uuid, uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
