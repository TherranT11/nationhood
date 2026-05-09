-- ════════════════════════════════════════════════════════════════
-- Ministry of the Interior — Expand Infrastructure
--
-- New ministry action: the Interior Minister picks one of three
-- public-works tiers and posts the contract to the construction-bid
-- pipeline. Corps bid through the standard corp_contract_bids flow;
-- the winner builds the project; on completion the issuing nation
-- gains tier-specific stat bumps.
--
-- Tiers (single source of truth in interior_infrastructure_tiers):
--
--   small        Local Municipal Complex
--                 post $2M  ·  contract $20M  ·  6 ticks
--                 → +0.5 standard_of_living
--   modest       Civic Center
--                 post $5M  ·  contract $50M  · 12 ticks
--                 → +1.0 gdp_growth · +0.5 standard_of_living
--   extravagant  Provincial Infrastructure
--                 post $12M ·  contract $120M · 24 ticks
--                 → +1.5 gdp_growth · +1.0 standard_of_living
--                 · +0.5 public_approval
--
-- post_cost is debited from the Interior ministry's
-- discretionary_balance at submission. budget is the contract
-- value paid out to the winning construction corp via the
-- standard bid pipeline.
--
-- Pipeline shape mirrors post_stadium_contract (20260918): the
-- post inserts a corp_contracts row with status='open' and a
-- 6-tick bid window; bidders compete via place_construction_bid;
-- the winning bid is awarded; processCorpContracts advances the
-- contract; processInteriorInfrastructureCompletions in
-- advance-tick sweeps completed contracts and applies the stat
-- effects.
--
-- Gates: caller must be the active Interior Minister; nation can
-- have at most ONE Interior Infrastructure contract open or
-- active at a time; ministry discretionary_balance must cover
-- the post fee.
-- ════════════════════════════════════════════════════════════════

BEGIN;

-- ── Source of truth ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.interior_infrastructure_tiers()
RETURNS JSONB
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
    SELECT '{
        "small": {
            "name":          "Local Municipal Complex",
            "post_cost":     2000000,
            "budget":        20000000,
            "timeline":      6,
            "spec_category": "Light Infrastructure",
            "stat_effects": [
                {"stat": "standard_of_living", "delta": 0.5}
            ]
        },
        "modest": {
            "name":          "Civic Center",
            "post_cost":     5000000,
            "budget":        50000000,
            "timeline":      12,
            "spec_category": "Heavy Infrastructure",
            "stat_effects": [
                {"stat": "gdp_growth",         "delta": 1.0},
                {"stat": "standard_of_living", "delta": 0.5}
            ]
        },
        "extravagant": {
            "name":          "Provincial Infrastructure",
            "post_cost":     12000000,
            "budget":        120000000,
            "timeline":      24,
            "spec_category": "Megaproject",
            "stat_effects": [
                {"stat": "gdp_growth",         "delta": 1.5},
                {"stat": "standard_of_living", "delta": 1.0},
                {"stat": "public_approval",    "delta": 0.5}
            ]
        }
    }'::JSONB
$$;

GRANT EXECUTE ON FUNCTION public.interior_infrastructure_tiers() TO authenticated, anon;

COMMENT ON FUNCTION public.interior_infrastructure_tiers() IS
    'Single source of truth for the Ministry of the Interior''s Expand Infrastructure tiers. Returns a JSONB object keyed by size (small/modest/extravagant). post_interior_infrastructure reads this on submission; processInteriorInfrastructureCompletions reads the matching tier on completion to apply stat_effects; the government.html UI fetches it to render the tier picker.';


-- ── post_interior_infrastructure RPC ───────────────────────────
CREATE OR REPLACE FUNCTION post_interior_infrastructure(p_size TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller        UUID := auth.uid();
    v_tier          JSONB;
    v_ministry      ministries%ROWTYPE;
    v_nation_id     UUID;
    v_tick          INT;
    v_existing      UUID;
    v_contract_id   UUID;
    v_contract_no   TEXT;
    v_year          INT;
    v_name          TEXT;
    v_post_cost     BIGINT;
    v_budget        BIGINT;
    v_timeline      INT;
    v_spec_cat      TEXT;
    v_balance       NUMERIC;
BEGIN
    v_tier := interior_infrastructure_tiers() -> p_size;
    IF v_tier IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid tier: ' || COALESCE(p_size, 'NULL'));
    END IF;

    SELECT * INTO v_ministry FROM ministries
        WHERE ministry_key = 'interior' AND is_active = true
          AND EXISTS (
              SELECT 1 FROM factions f
              WHERE f.id = ministries.party_id
                AND (f.id = v_caller OR f.linked_user_id = v_caller)
          )
        ORDER BY created_at DESC LIMIT 1;
    IF v_ministry.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Only the active Interior Minister can post this contract');
    END IF;
    v_nation_id := v_ministry.nation_id;
    v_balance   := COALESCE(v_ministry.discretionary_balance, 0);

    -- Discretionary post-fee. Mirrors post_stadium_contract: the
    -- ministry's discretionary balance must cover the post fee
    -- before the contract goes out to bid. Debited atomically below.
    v_post_cost := (v_tier->>'post_cost')::BIGINT;
    IF v_balance < v_post_cost THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Insufficient discretionary balance — post fee is $%s; ministry has $%s',
                to_char(v_post_cost, 'FM999,999,999'),
                to_char(v_balance, 'FM999,999,999')),
            'balance', v_balance, 'cost', v_post_cost);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Shard not found');
    END IF;

    -- Cap: at most one Interior Infrastructure contract open or
    -- active per nation. Prevents spam and keeps the nation's
    -- budget impact predictable.
    SELECT id INTO v_existing FROM corp_contracts
        WHERE issuer_nation_id = v_nation_id
          AND project_subtype  = 'Interior Infrastructure'
          AND status           IN ('open', 'active')
        LIMIT 1;
    IF v_existing IS NOT NULL THEN
        RETURN jsonb_build_object('success', false,
            'error', 'An Interior Infrastructure contract is already open or active for this nation. Wait for it to complete or be cancelled before posting another.');
    END IF;

    -- Debit the post fee from discretionary.
    UPDATE ministries
       SET discretionary_balance = v_balance - v_post_cost
     WHERE id = v_ministry.id;

    v_year        := 2000 + (v_tick / 12);
    v_contract_no := 'INT-' || v_year::TEXT || '-' ||
                     lpad((floor(random() * 1000)::INT)::TEXT, 3, '0');
    v_name        := v_tier->>'name';
    v_budget      := (v_tier->>'budget')::BIGINT;
    v_timeline    := (v_tier->>'timeline')::INT;
    v_spec_cat    := v_tier->>'spec_category';

    INSERT INTO corp_contracts (
        contract_number, name, description,
        contract_type,   issuer_name,                 issuer_faction_id, issuer_nation_id,
        required_sector, spec_category,               budget,            timeline_months,
        project_type,    project_subtype,             status,
        created_at_tick, expires_at_tick
    ) VALUES (
        v_contract_no,
        v_name,
        'Ministry of the Interior infrastructure project (' || p_size || ' tier).',
        'GOVERNMENT',
        'Ministry of the Interior',
        NULL,
        v_nation_id,
        'Construction',
        v_spec_cat,
        v_budget,
        v_timeline,
        'Civil Engineering',
        'Interior Infrastructure',
        'open',
        v_tick,
        v_tick + 6
    ) RETURNING id INTO v_contract_id;

    RETURN jsonb_build_object(
        'success',     true,
        'contract_id', v_contract_id,
        'tier',        p_size,
        'name',        v_name,
        'post_cost',   v_post_cost,
        'budget',      v_budget,
        'timeline',    v_timeline
    );
END;
$$;

GRANT EXECUTE ON FUNCTION post_interior_infrastructure(TEXT) TO authenticated;

COMMENT ON FUNCTION post_interior_infrastructure(TEXT) IS
    'Ministry of the Interior — Expand Infrastructure action. Picks a tier (small/modest/extravagant) from interior_infrastructure_tiers() and inserts a corp_contracts row with status=open + a 6-tick bid window. One open/active contract at a time per nation. Stat effects are applied on completion by processInteriorInfrastructureCompletions.';

COMMIT;

NOTIFY pgrst, 'reload schema';
