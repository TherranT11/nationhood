-- ════════════════════════════════════════════════════════════════════
-- Corp bankruptcy → buildings auto-listed at base × 0.8; proceeds pay
-- personal loans first, then go to the ex-owner's party_funds.
--
-- Before this migration: declare_bankruptcy paid corp-side debts +
-- distributed remaining treasury, then DELETEd the entrepreneur_corps
-- row. corp_buildings.owner_corp_id had ON DELETE SET NULL, so the
-- corp's buildings became orphans with NULL owner. buy_building
-- explicitly rejected NULL-owner buildings ('no_seller'), meaning
-- there was no way for those buildings to re-enter the economy.
--
-- After this migration:
--   declare_bankruptcy adds a step BEFORE the corp DELETE:
--     UPDATE corp_buildings
--        SET list_price = ROUND(tier_base × nation_multiplier × 0.8),
--            previous_owner_faction_id = v_fac.id
--      WHERE owner_corp_id = p_corp_id AND status = 'completed';
--   (in-progress buildings are left alone — orphaned, same as before)
--
--   buy_building grows an abandoned-case branch:
--     If owner_corp_id IS NULL AND previous_owner_faction_id IS NOT NULL,
--     the buyer pays the list_price; proceeds are applied to the
--     previous owner's active personal_loan (interest first, then
--     principal — mirror of make_personal_loan_payment); whatever's
--     left credits previous_owner.party_funds. Normal corp-to-corp
--     sale path is unchanged.
--
-- ── Pricing ─────────────────────────────────────────────────────────
-- list_price = ROUND(tier_base_cost(tier) ×
--                    nation_construction_cost_multiplier(nation_id) ×
--                    0.8)::bigint
-- Uses CURRENT nation pricing — a high-CoL / low-infra nation's
-- abandoned buildings are still proportionally expensive. cost_paid
-- isn't used because pre-20270425 buildings have cost_paid = 0.
--
-- ── tier_base_cost helper ───────────────────────────────────────────
-- Extracted from begin_construction's inline CASE (20270172). Pairs
-- with nation_construction_cost_multiplier from 20270425.
-- begin_construction STILL has the tier base inline — same SOT
-- carry-over flagged in 20270425's header. Both helpers become the
-- canonical source when begin_construction is next touched.
--
-- ── Personal-loan paydown order ─────────────────────────────────────
-- The "interest first, then principal" split is the same one
-- make_personal_loan_payment uses (20270426). Lazy accrual fires
-- right before payment application so the loan's books are up to date.
--
-- ── Deferred / soft carry-overs ────────────────────────────────────
-- * In-progress buildings (status != 'completed') stay orphaned, not
--   listed. Construction-credit refund is a separate concern.
-- * Aircraft, terminals, freighters — not in scope. The user's
--   directive was buildings only. Aircraft cleanup on disband
--   already orphans them via ON DELETE SET NULL.
-- * If previous_owner_faction_id is NULL (faction also deleted),
--   buy_building falls back to 'no_seller' — money can't route
--   anywhere, building stays listed.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. tier_base_cost helper ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.tier_base_cost(p_tier text)
RETURNS bigint
LANGUAGE sql IMMUTABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT CASE p_tier
        WHEN 'small'      THEN   20000000
        WHEN 'medium'     THEN   50000000
        WHEN 'large'      THEN  100000000
        WHEN 'major'      THEN  200000000
        WHEN 'monumental' THEN  400000000
        ELSE                     20000000  -- defensive fallback
    END::bigint;
$$;
GRANT EXECUTE ON FUNCTION public.tier_base_cost(text) TO authenticated;

COMMENT ON FUNCTION public.tier_base_cost(text) IS
    'Construction base cost in dollars for a tier (small/medium/large/major/monumental). Mirror of begin_construction''s inline CASE; canonical source going forward (refactor begin_construction when next touched).';

-- ── 2. previous_owner_faction_id on corp_buildings ──────────────────
ALTER TABLE corp_buildings
    ADD COLUMN IF NOT EXISTS previous_owner_faction_id uuid
        REFERENCES factions(id) ON DELETE SET NULL;

COMMENT ON COLUMN corp_buildings.previous_owner_faction_id IS
    'Stamped by declare_bankruptcy when a corp dissolves with buildings owned — points at the ex-owner''s faction so buy_building can route proceeds to their personal_loan / party_funds when the abandoned building is later acquired. NULL on freshly-built / never-abandoned buildings.';

-- Filter index for the marketplace's "abandoned listings" view.
CREATE INDEX IF NOT EXISTS idx_corp_buildings_abandoned_market
    ON corp_buildings (nation_id)
    WHERE owner_corp_id IS NULL
      AND previous_owner_faction_id IS NOT NULL
      AND list_price IS NOT NULL
      AND status = 'completed';

-- ── 3. declare_bankruptcy: list buildings before deleting the corp ──
-- Body = 20270254 + new step 4c. Everything else (corp-loan repay,
-- central-bank loans, reputation hit, equity distribution, personal
-- recourse, audit log, DELETE) is byte-for-byte identical.
CREATE OR REPLACE FUNCTION public.declare_bankruptcy(p_corp_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_uid          UUID := auth.uid();
    v_fac          factions%ROWTYPE;
    v_corp         entrepreneur_corps%ROWTYPE;
    v_treasury     BIGINT;
    v_owed         BIGINT;
    v_pay          BIGINT;
    v_any_unpaid   BOOLEAN := false;
    v_unpaid_total BIGINT := 0;
    v_garnish      BIGINT := 0;
    v_pf           BIGINT;
    v_total_shares BIGINT;
    v_remaining    BIGINT;
    v_tick         INT;
    v_buildings_listed INT := 0;
    r              RECORD;
BEGIN
    IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated'); END IF;
    IF p_corp_id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found'); END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found'); END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur' AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1 FOR UPDATE;
    IF v_fac.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur'); END IF;
    IF v_corp.owner_faction_id <> v_fac.id THEN RETURN jsonb_build_object('success', false, 'reason', 'not_owner'); END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    v_treasury := floor(COALESCE(v_corp.treasury_cash, 0))::bigint;

    -- 1) Repay corp-to-corp loans.
    FOR r IN SELECT id, lender_corp_id, GREATEST(0, principal - total_paid)::bigint AS owed
               FROM corp_loans
              WHERE borrower_corp_id = p_corp_id AND status = 'active'
              ORDER BY created_at ASC NULLS FIRST
              FOR UPDATE
    LOOP
        v_owed := r.owed;
        IF v_owed <= 0 THEN UPDATE corp_loans SET status = 'repaid', payments_remaining = 0 WHERE id = r.id; CONTINUE; END IF;
        v_pay := LEAST(v_treasury, v_owed);
        IF v_pay > 0 THEN
            UPDATE entrepreneur_corps SET treasury_cash = COALESCE(treasury_cash, 0) + v_pay WHERE id = r.lender_corp_id;
            UPDATE corp_loans SET total_paid = total_paid + v_pay WHERE id = r.id;
            v_treasury := v_treasury - v_pay;
        END IF;
        IF v_pay >= v_owed THEN UPDATE corp_loans SET status = 'repaid', payments_remaining = 0 WHERE id = r.id;
        ELSE                    UPDATE corp_loans SET status = 'defaulted' WHERE id = r.id; v_any_unpaid := true; v_unpaid_total := v_unpaid_total + (v_owed - v_pay); END IF;
    END LOOP;

    -- 2) Central bank loans.
    FOR r IN SELECT id, GREATEST(0, outstanding)::bigint AS owed
               FROM central_bank_loans
              WHERE borrower_corp_id = p_corp_id AND status = 'active'
              ORDER BY created_at ASC
              FOR UPDATE
    LOOP
        v_owed := r.owed;
        v_pay := LEAST(v_treasury, v_owed);
        v_treasury := v_treasury - v_pay;
        IF v_pay >= v_owed THEN UPDATE central_bank_loans SET status = 'repaid', outstanding = 0 WHERE id = r.id;
        ELSE                    UPDATE central_bank_loans SET status = 'defaulted', outstanding = v_owed - v_pay WHERE id = r.id; v_any_unpaid := true; v_unpaid_total := v_unpaid_total + (v_owed - v_pay); END IF;
    END LOOP;

    -- 3) CEO reputation hit if any debt was left unpaid.
    IF v_any_unpaid THEN
        UPDATE factions SET ent_reputation = COALESCE(ent_reputation, 0) - 3 WHERE id = v_fac.id;
    END IF;

    -- 4) Distribute remaining cash to equity holders.
    v_remaining := GREATEST(0, v_treasury);
    SELECT COALESCE(SUM(shares), 0) INTO v_total_shares FROM corp_shareholdings WHERE corp_id = p_corp_id AND shares > 0;
    IF v_remaining > 0 THEN
        IF v_total_shares > 0 THEN
            UPDATE factions f
               SET party_funds = COALESCE(f.party_funds, 0) + (v_remaining * cs.shares / v_total_shares)
              FROM corp_shareholdings cs
             WHERE cs.corp_id = p_corp_id AND cs.shares > 0 AND f.id = cs.holder_faction_id;
        ELSE
            UPDATE factions SET party_funds = COALESCE(party_funds, 0) + v_remaining WHERE id = v_fac.id;
        END IF;
    END IF;

    -- 4b) CEO personal recourse (existing).
    IF v_unpaid_total > 0 THEN
        SELECT GREATEST(0, COALESCE(party_funds, 0)) INTO v_pf FROM factions WHERE id = v_fac.id;
        v_garnish := LEAST(v_pf, v_unpaid_total);
        UPDATE factions
           SET party_funds     = COALESCE(party_funds, 0) - v_garnish,
               ent_unpaid_debt = COALESCE(ent_unpaid_debt, 0) + (v_unpaid_total - v_garnish)
         WHERE id = v_fac.id;
    END IF;

    -- 4c) NEW (20270427): auto-list every completed building this corp
    -- owns at base × nation_multiplier × 0.8. previous_owner_faction_id
    -- routes future buy_building proceeds back to the ex-owner via the
    -- personal-loan paydown path. In-progress buildings stay orphaned
    -- (refunding mid-construction is a separate concern).
    UPDATE corp_buildings
       SET list_price = GREATEST(1, ROUND(
             tier_base_cost(tier)
             * nation_construction_cost_multiplier(nation_id)
             * 0.8
           )::bigint),
           previous_owner_faction_id = v_fac.id
     WHERE owner_corp_id = p_corp_id
       AND status = 'completed';
    GET DIAGNOSTICS v_buildings_listed = ROW_COUNT;

    -- 5) Audit + dissolve. corp_buildings.owner_corp_id flips to NULL
    --    via ON DELETE SET NULL; the list_price + previous_owner_faction_id
    --    we just stamped survive and gate the abandoned-buy branch.
    INSERT INTO event_log (nation_id, faction_id, event_name, description_used, category, trigger_key, effects_applied, fired_at_tick)
    VALUES (v_corp.hq_nation_id, v_fac.id, 'Corporation Bankrupt',
            format('%s declared bankruptcy.%s $%s distributed to equity holders.%s',
                   v_corp.name,
                   CASE WHEN v_any_unpaid THEN format(' Debts went unpaid — CEO reputation −3; CEO personally liable for $%s ($%s garnished).', v_unpaid_total - v_garnish, v_garnish) ELSE '' END,
                   v_remaining,
                   CASE WHEN v_buildings_listed > 0 THEN format(' %s building(s) listed for sale.', v_buildings_listed) ELSE '' END),
            'corporate', 'corp_bankruptcy',
            jsonb_build_object('corp_id', p_corp_id, 'corp_name', v_corp.name,
                               'remaining_distributed', v_remaining, 'debts_unpaid', v_any_unpaid,
                               'buildings_listed', v_buildings_listed),
            v_tick);

    DELETE FROM entrepreneur_corps WHERE id = p_corp_id;

    RETURN jsonb_build_object('success', true,
                              'remaining_distributed', v_remaining,
                              'debts_unpaid', v_any_unpaid,
                              'reputation_penalty', CASE WHEN v_any_unpaid THEN -3 ELSE 0 END,
                              'personal_garnished', v_garnish,
                              'personal_lien', v_unpaid_total - v_garnish,
                              'buildings_listed', v_buildings_listed);
END; $$;

GRANT EXECUTE ON FUNCTION public.declare_bankruptcy(UUID) TO authenticated;

COMMENT ON FUNCTION public.declare_bankruptcy(UUID) IS
    'Owner-only corp shutdown. Repays borrower-side debts from treasury; unpaid → loan defaulted + CEO ent_reputation -3 + personal recourse (garnish then ent_unpaid_debt). Remaining cash to equity holders. 20270427: every completed building this corp owns gets list_price = base × nation_multiplier × 0.8 and previous_owner_faction_id stamped, so buy_building can route proceeds back through personal_loan paydown.';

-- ── 4. buy_building: abandoned branch (proceeds → personal loan first)
-- Body = 20270167 + a new branch for owner_corp_id IS NULL AND
-- previous_owner_faction_id IS NOT NULL. Normal corp-to-corp path is
-- byte-for-byte unchanged.
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
    v_seller_fac       factions%ROWTYPE;
    v_price            bigint;
    v_tick             int;
    v_nation_name      text;
    v_abandoned        bool := false;
    -- Loan paydown locals
    v_loan             personal_loans%ROWTYPE;
    v_ticks_passed     int;
    v_new_interest     numeric;
    v_total_interest   numeric;
    v_int_due_bigint   bigint;
    v_to_loan          bigint := 0;
    v_int_paid         bigint := 0;
    v_prin_paid        bigint := 0;
    v_to_party_funds   bigint;
    v_new_loan_status  text;
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

    -- Branch: normal corp-to-corp sale vs abandoned-building flow.
    -- Abandoned means owner_corp_id is NULL (the corp dissolved) but
    -- previous_owner_faction_id is still pointing at a real faction.
    IF v_building.owner_corp_id IS NULL THEN
        IF v_building.previous_owner_faction_id IS NULL THEN
            -- Truly orphaned — no one to route proceeds to.
            RETURN jsonb_build_object('success', false, 'reason', 'no_seller');
        END IF;
        v_abandoned := true;
        v_seller_fac_id := v_building.previous_owner_faction_id;
    ELSE
        IF p_buyer_corp_id = v_building.owner_corp_id THEN
            RETURN jsonb_build_object('success', false, 'reason', 'cannot_buy_own_building');
        END IF;
    END IF;
    v_price := v_building.list_price;

    IF v_abandoned THEN
        -- Lock only the buyer corp (the seller corp doesn't exist).
        PERFORM id FROM entrepreneur_corps WHERE id = p_buyer_corp_id FOR UPDATE;
    ELSE
        -- Lock both corps in uuid order to prevent A↔B sale deadlocks.
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

    -- Caller's faction. Verifies they own the buyer corp.
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

    IF COALESCE(v_fac.party_funds, 0) < v_price THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'have', COALESCE(v_fac.party_funds, 0), 'need', v_price);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- Debit buyer.
    UPDATE factions SET party_funds = COALESCE(party_funds, 0) - v_price
     WHERE id = v_fac.id;

    -- Route proceeds.
    IF v_abandoned THEN
        -- Lock the LOAN before the seller faction so the lock order
        -- matches make_personal_loan_payment (which locks loan first,
        -- then borrower faction). Otherwise a player paying down their
        -- own loan concurrently with a buyer acquiring their abandoned
        -- building would risk a deadlock on (loan, faction).
        SELECT * INTO v_loan FROM personal_loans
         WHERE borrower_faction_id = v_seller_fac_id AND status = 'active'
         LIMIT 1 FOR UPDATE;

        SELECT * INTO v_seller_fac FROM factions WHERE id = v_seller_fac_id FOR UPDATE;
        IF v_seller_fac.id IS NULL THEN
            -- previous_owner_faction_id pointed at a deleted faction
            -- (rare — would imply the factions row was hard-deleted
            -- with the ON DELETE SET NULL trigger failing somehow).
            -- Sink the payment rather than block the sale.
            v_to_party_funds := 0;
        ELSE
            v_to_party_funds := v_price;

            IF v_loan.id IS NOT NULL THEN
                v_ticks_passed := GREATEST(0, v_tick - v_loan.last_accrual_tick);
                v_new_interest := v_loan.principal_remaining
                                * v_loan.apr_pct / 100.0
                                / 144.0
                                * v_ticks_passed;
                v_total_interest := v_loan.accrued_interest_unpaid + v_new_interest;
                v_int_due_bigint := ROUND(v_total_interest)::bigint;

                -- Cap loan paydown at the actual outstanding.
                v_to_loan  := LEAST(v_price, v_int_due_bigint + v_loan.principal_remaining);
                v_int_paid := LEAST(v_to_loan, v_int_due_bigint);
                v_prin_paid := LEAST(v_to_loan - v_int_paid, v_loan.principal_remaining);
                v_to_party_funds := v_price - (v_int_paid + v_prin_paid);

                v_new_loan_status := CASE
                    WHEN (v_loan.principal_remaining - v_prin_paid) = 0
                     AND (v_total_interest - v_int_paid) <= 0.5
                    THEN 'paid'
                    ELSE 'active'
                END;

                UPDATE personal_loans
                   SET principal_remaining     = principal_remaining - v_prin_paid,
                       accrued_interest_unpaid = GREATEST(0, v_total_interest - v_int_paid),
                       last_accrual_tick       = v_tick,
                       status                  = v_new_loan_status,
                       closed_at_tick          = CASE WHEN v_new_loan_status = 'paid' THEN v_tick ELSE NULL END
                 WHERE id = v_loan.id;

                -- Credit the lender corp's owner with the loan-paydown
                -- portion (same as make_personal_loan_payment). If the
                -- lender corp is gone, that portion is sunk.
                IF v_loan.lender_corp_id IS NOT NULL AND (v_int_paid + v_prin_paid) > 0 THEN
                    UPDATE factions f
                       SET party_funds = COALESCE(party_funds, 0) + (v_int_paid + v_prin_paid)
                      FROM entrepreneur_corps c
                     WHERE c.id = v_loan.lender_corp_id AND f.id = c.owner_faction_id;
                END IF;
            END IF;

            -- Remainder to seller's party_funds.
            IF v_to_party_funds > 0 THEN
                UPDATE factions SET party_funds = COALESCE(party_funds, 0) + v_to_party_funds
                 WHERE id = v_seller_fac_id;
            END IF;
        END IF;
    ELSE
        -- Normal sale: credit seller corp's owner faction.
        UPDATE factions SET party_funds = COALESCE(party_funds, 0) + v_price
         WHERE id = v_seller_fac_id;
    END IF;

    -- Flip ownership. previous_owner_faction_id is cleared on a real
    -- sale so the building doesn't loop back through the abandoned
    -- branch if the new owner ever dissolves.
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
                         to_char(v_int_paid + v_prin_paid, 'FM999,999,999,999'),
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
            'loan_paydown',     v_int_paid + v_prin_paid,
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
        'loan_paydown',      v_int_paid + v_prin_paid,
        'to_party_funds',    v_to_party_funds,
        'new_funds',         COALESCE(v_fac.party_funds, 0) - v_price
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.buy_building(uuid, uuid) TO authenticated;

COMMENT ON FUNCTION public.buy_building(uuid, uuid) IS
    'Real-Estate corp acquires a listed completed building. Buyer must be industry=real_estate AND owned by caller. Two paths: (1) normal corp-to-corp sale → buyer pays seller corp''s owner faction; (2) ABANDONED (20270427) — owner_corp_id NULL with previous_owner_faction_id set → buyer''s payment routes through the ex-owner''s active personal_loan (interest, then principal — mirror of make_personal_loan_payment), remainder to ex-owner''s party_funds. Corp+faction lock order is deadlock-safe. SECURITY DEFINER.';

NOTIFY pgrst, 'reload schema';

COMMIT;
