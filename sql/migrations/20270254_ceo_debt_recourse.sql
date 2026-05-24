-- ============================================================================
-- CEO debt recourse: unpaid corp debt follows the founder personally.
--
-- Pairs with the withdrawal (20270233) + dividend (20270253) solvency gates to
-- close the bust-out fully. Those stop EXTRACTING borrowed cash; this handles
-- the founder who SPENT the loan and then bankrupts: the unpaid shortfall now
-- (a) garnishes their personal funds and (b) carries as a personal liability
-- that blocks founding new corps until settled.
--
-- Sink model: garnished/settled money is removed (the lenders' loss was already
-- booked when the loan defaulted) — not redistributed to lenders.
--
-- declare_bankruptcy / found_entrepreneur_corp bodies are copied verbatim from
-- 20270202 / 20270226; only the recourse hook + founding gate were added.
-- ============================================================================

BEGIN;

ALTER TABLE factions ADD COLUMN IF NOT EXISTS ent_unpaid_debt BIGINT NOT NULL DEFAULT 0;

-- Client-write protection: factions has a row-level "update own" RLS policy, so
-- without this a player could UPDATE factions SET ent_unpaid_debt = 0 on their
-- own row and dodge the gate. Only the SECURITY DEFINER RPCs below (which run as
-- owner and bypass column REVOKEs) may change it.
REVOKE UPDATE (ent_unpaid_debt) ON factions FROM PUBLIC, anon, authenticated;

-- ── declare_bankruptcy: + personal recourse (garnish now, lien remainder) ──
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

    -- 1) Repay corp-to-corp loans (this corp as borrower) from treasury.
    --    Each increment UPDATE is row-atomic, so crediting the lender is
    --    race-safe without an explicit lock.
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

    -- 2) Clear Central Bank loans (this corp as borrower). Principal frees CB
    --    capacity by leaving 'active'; cash leaves treasury (no party credit).
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

    -- 4) Distribute remaining cash to equity holders. Public corps split it
    --    proportionally by shareholding (founder included); private corps have
    --    no shareholdings, so the founder receives all of it.
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

    -- 4b) CEO personal recourse for unpaid debt: garnish current personal
    --     funds toward the shortfall, carry the remainder as a personal
    --     liability (ent_unpaid_debt) that blocks founding until settled.
    --     Sink — the lenders' loss was already booked at default.
    IF v_unpaid_total > 0 THEN
        SELECT GREATEST(0, COALESCE(party_funds, 0)) INTO v_pf FROM factions WHERE id = v_fac.id;
        v_garnish := LEAST(v_pf, v_unpaid_total);
        UPDATE factions
           SET party_funds     = COALESCE(party_funds, 0) - v_garnish,
               ent_unpaid_debt = COALESCE(ent_unpaid_debt, 0) + (v_unpaid_total - v_garnish)
         WHERE id = v_fac.id;
    END IF;

    -- 5) Audit + dissolve. Buildings → unowned (ON DELETE SET NULL);
    --    shareholdings + closed loan rows cascade.
    INSERT INTO event_log (nation_id, faction_id, event_name, description_used, category, trigger_key, effects_applied, fired_at_tick)
    VALUES (v_corp.hq_nation_id, v_fac.id, 'Corporation Bankrupt',
            format('%s declared bankruptcy.%s $%s distributed to equity holders.',
                   v_corp.name,
                   CASE WHEN v_any_unpaid THEN format(' Debts went unpaid — CEO reputation −3; CEO personally liable for $%s ($%s garnished).', v_unpaid_total - v_garnish, v_garnish) ELSE '' END,
                   v_remaining),
            'corporate', 'corp_bankruptcy',
            jsonb_build_object('corp_id', p_corp_id, 'corp_name', v_corp.name,
                               'remaining_distributed', v_remaining, 'debts_unpaid', v_any_unpaid),
            v_tick);

    DELETE FROM entrepreneur_corps WHERE id = p_corp_id;

    RETURN jsonb_build_object('success', true,
                              'remaining_distributed', v_remaining,
                              'debts_unpaid', v_any_unpaid,
                              'reputation_penalty', CASE WHEN v_any_unpaid THEN -3 ELSE 0 END,
                              'personal_garnished', v_garnish,
                              'personal_lien', v_unpaid_total - v_garnish);
END; $$;

COMMENT ON FUNCTION public.declare_bankruptcy(UUID) IS
    'Owner-only corp shutdown. Repays borrower-side debts from treasury; unpaid shortfall → loan defaulted + CEO ent_reputation -3 AND personal recourse: garnish the founder''s party_funds toward the shortfall, remainder → factions.ent_unpaid_debt (blocks new foundings until settled via settle_personal_debt). Remaining cash distributed to equity holders. SECURITY DEFINER.';

-- ── found_entrepreneur_corp: + personal-delinquency gate ──
CREATE OR REPLACE FUNCTION found_entrepreneur_corp(
    p_industry text, p_hq_nation_id uuid, p_name text, p_capital bigint, p_listing text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid         uuid := auth.uid();
    v_fac         factions%ROWTYPE;
    v_capital     bigint := COALESCE(p_capital, 0);
    v_fee         bigint;
    v_total       bigint;
    v_id          uuid;
    v_tick        int;
    v_listing     text;
    v_city        uuid;
    v_seed_nation uuid;
    v_bld_type    text;
    v_home_nation uuid;
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

    -- Personal-delinquency gate: a founder carrying unpaid debt from a
    -- bankrupted corp (ent_unpaid_debt) cannot found new corps until they
    -- settle it — blocks the serial bankrupt-and-refound bust-out.
    IF COALESCE(v_fac.ent_unpaid_debt, 0) > 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'delinquent_debt',
            'owed', COALESCE(v_fac.ent_unpaid_debt, 0));
    END IF;

    -- HOME-NATION GATE: new corps are founded only in the entrepreneur's
    -- home nation (factions.nation, by name). Expansion to other nations is
    -- per-corp via regional HQs, not new foreign foundings.
    SELECT id INTO v_home_nation FROM nations WHERE name = v_fac.nation LIMIT 1;
    IF v_home_nation IS NULL OR p_hq_nation_id <> v_home_nation THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_home_nation',
            'home_nation', v_fac.nation);
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

    -- Public float: 100 shares outstanding, share_price = capital/100 so the
    -- founding valuation (shares × price) = capital. 20 awarded to the
    -- founder below → 80 available to buy.
    INSERT INTO entrepreneur_corps
        (owner_faction_id, name, industry, hq_nation_id, starting_capital, founding_fee,
         listing, founded_tick, treasury_cash, shares_outstanding, share_price)
    VALUES
        (v_fac.id, btrim(p_name), p_industry, p_hq_nation_id, v_capital, v_fee,
         v_listing, COALESCE(v_tick, 0),
         v_capital::numeric,
         CASE WHEN v_listing = 'public' THEN 100 END,
         CASE WHEN v_listing = 'public' THEN v_capital::numeric / 100 END)
    RETURNING id INTO v_id;

    IF v_listing = 'public' THEN
        INSERT INTO corp_shareholdings (corp_id, holder_faction_id, shares)
        VALUES (v_id, v_fac.id, 20);
    END IF;

    -- Airline starter seed: 2 free regional aircraft (corp_aircraft rows are
    -- the source of truth post-20270204) + 2 same-nation starter terminals
    -- so a first route is openable.
    IF p_industry = 'airline' THEN
        INSERT INTO corp_aircraft (entrepreneur_corp_id, aircraft_class, condition, acquired_at_tick)
        SELECT v_id, 'regional', 100, COALESCE(v_tick, 0)
          FROM generate_series(1, 2);

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

    -- Starter unique building (+ shipping freighters). Free, completed,
    -- owned, in the HQ nation; cost_paid 0, no GDP/ambition bonus.
    -- Aviation Manufacturing rolls 1D6 for its building type (5/23/26 spec).
    IF p_industry IN ('construction','banking','real_estate','shipping','aviation_manufacturing') THEN
        v_bld_type := CASE p_industry
            WHEN 'construction' THEN 'construction_yard'
            WHEN 'banking'      THEN 'banking_office'
            WHEN 'real_estate'  THEN 'real_estate_office'
            WHEN 'shipping'     THEN 'port'
            -- 1D6: 6 → Engine Assembly Plant (1/6), 1-5 → Light Assembly Plant (5/6).
            WHEN 'aviation_manufacturing' THEN
                CASE WHEN floor(random() * 6) + 1 >= 6
                     THEN 'engine_assembly_plant' ELSE 'light_assembly_plant' END
        END;

        INSERT INTO corp_buildings (
            builder_corp_id, owner_corp_id, nation_id,
            name, tier, building_type,
            cost_paid, ambition_granted,
            status, started_at_tick, completes_at_tick, completed_at_tick,
            gdp_growth_applied, list_price
        ) VALUES (
            v_id, v_id, p_hq_nation_id,
            left(btrim(p_name) || ' ' || initcap(replace(v_bld_type, '_', ' ')), 80), 'small', v_bld_type,
            0, 0,
            'completed', COALESCE(v_tick, 0), COALESCE(v_tick, 0), COALESCE(v_tick, 0),
            true, NULL
        );

        IF p_industry = 'shipping' THEN
            UPDATE entrepreneur_corps SET freighters_owned = 2 WHERE id = v_id;
        END IF;
    END IF;

    RETURN jsonb_build_object('success', true, 'corp_id', v_id, 'listing', v_listing,
        'capital', v_capital, 'founding_fee', v_fee);
END;
$$;

-- ── settle_personal_debt: pay the personal liability down from party_funds ──
CREATE OR REPLACE FUNCTION public.settle_personal_debt(p_amount BIGINT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_fac factions%ROWTYPE;
    v_pay BIGINT;
BEGIN
    IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated'); END IF;
    IF p_amount IS NULL OR p_amount < 1 THEN RETURN jsonb_build_object('success', false, 'reason', 'invalid_amount'); END IF;
    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur' AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1 FOR UPDATE;
    IF v_fac.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur'); END IF;
    IF COALESCE(v_fac.ent_unpaid_debt, 0) <= 0 THEN RETURN jsonb_build_object('success', false, 'reason', 'no_debt'); END IF;
    -- Pay the personal liability down from personal funds (sink). Capped at
    -- both the outstanding debt and available funds; partial payments allowed.
    v_pay := LEAST(p_amount, COALESCE(v_fac.ent_unpaid_debt, 0), GREATEST(0, COALESCE(v_fac.party_funds, 0)));
    IF v_pay < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'have', GREATEST(0, COALESCE(v_fac.party_funds, 0)), 'owed', COALESCE(v_fac.ent_unpaid_debt, 0));
    END IF;
    UPDATE factions
       SET party_funds     = COALESCE(party_funds, 0) - v_pay,
           ent_unpaid_debt = COALESCE(ent_unpaid_debt, 0) - v_pay
     WHERE id = v_fac.id;
    RETURN jsonb_build_object('success', true, 'paid', v_pay,
        'remaining', COALESCE(v_fac.ent_unpaid_debt, 0) - v_pay);
END; $$;
GRANT EXECUTE ON FUNCTION public.settle_personal_debt(BIGINT) TO authenticated;

COMMENT ON FUNCTION public.settle_personal_debt(BIGINT) IS
    'Entrepreneur founder pays down factions.ent_unpaid_debt (post-bankruptcy personal liability) from party_funds. Sink. Clearing it re-enables found_entrepreneur_corp. SECURITY DEFINER.';

NOTIFY pgrst, 'reload schema';

COMMIT;
