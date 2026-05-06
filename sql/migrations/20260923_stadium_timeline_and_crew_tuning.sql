-- 20260923_stadium_timeline_and_crew_tuning.sql
--
-- Tuning pass: stadium build timelines + construction crew gates.
--
-- Updated tunings (mirror VOLA_STADIUM_TIERS in js/game/political-actions.js):
--   Small        18-month timeline / 1 crew required
--   Modest       28-month timeline / 1 crew required
--   Extravagant  38-month timeline / 2 crews required
--
-- timeline_months is the contract's posted duration. Corps quote
-- timelines down to ~70% of this when bidding (existing
-- award_construction_contract behaviour), so the average on-the-ground
-- build time runs slightly under the posted figure.
--
-- requirements.work_crews is the gating stat checked by the existing
-- construction-sector bid system — corps with fewer crews than the
-- requirement can't bid.
--
-- Only post_stadium_contract changes; the cancel/award/refund flow is
-- untouched. Idempotent CREATE OR REPLACE.

BEGIN;

CREATE OR REPLACE FUNCTION post_stadium_contract(
    p_size          TEXT,
    p_stadium_name  TEXT,
    p_team_name     TEXT
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_caller        UUID := auth.uid();
    v_post_cost     BIGINT;
    v_budget_target BIGINT;
    v_timeline      INT;
    v_crews         INT;
    v_spec_cat      TEXT;
    v_ministry      ministries%ROWTYPE;
    v_nation_id     UUID;
    v_tick          INT;
    v_existing      UUID;
    v_contract_id   UUID;
    v_contract_no   TEXT;
    v_year          INT;
    v_balance       NUMERIC;
BEGIN
    IF p_size = 'small' THEN
        v_post_cost := 3000000;  v_budget_target := 60000000;
        v_timeline  := 18;       v_crews := 1;       v_spec_cat := 'Light Infrastructure';
    ELSIF p_size = 'modest' THEN
        v_post_cost := 7000000;  v_budget_target := 140000000;
        v_timeline  := 28;       v_crews := 1;       v_spec_cat := 'Heavy Infrastructure';
    ELSIF p_size = 'extravagant' THEN
        v_post_cost := 10000000; v_budget_target := 450000000;
        v_timeline  := 38;       v_crews := 2;       v_spec_cat := 'Megaproject';
    ELSE
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_size');
    END IF;

    IF p_stadium_name IS NULL OR length(trim(p_stadium_name)) = 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_stadium_name');
    END IF;

    SELECT * INTO v_ministry FROM ministries
        WHERE ministry_key = 'sports' AND is_active = true
          AND EXISTS (
              SELECT 1 FROM factions f
              WHERE f.id = ministries.party_id
                AND (f.id = v_caller OR f.linked_user_id = v_caller)
          )
        ORDER BY created_at DESC LIMIT 1;
    IF v_ministry.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_minister');
    END IF;
    v_nation_id := v_ministry.nation_id;
    v_balance := COALESCE(v_ministry.discretionary_balance, 0);

    IF v_balance < v_post_cost THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_balance',
            'balance', v_balance, 'cost', v_post_cost);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;

    SELECT id INTO v_existing FROM corp_contracts
        WHERE issuer_nation_id = v_nation_id
          AND project_subtype  = 'Vola Stadium'
          AND status           = 'open'
        LIMIT 1;
    IF v_existing IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_open');
    END IF;

    UPDATE ministries SET discretionary_balance = v_balance - v_post_cost
        WHERE id = v_ministry.id;

    v_year := 2000 + (v_tick / 12);
    v_contract_no := 'GOV-' || v_year::TEXT || '-' ||
                     lpad((floor(random() * 1000)::INT)::TEXT, 3, '0');

    INSERT INTO corp_contracts (
        contract_number, name, description,
        contract_type,   issuer_name,        issuer_faction_id, issuer_nation_id,
        required_sector, spec_category,      budget,            timeline_months,
        project_type,    project_subtype,    status,
        requirements,    created_at_tick,    expires_at_tick
    ) VALUES (
        v_contract_no,   trim(p_stadium_name),
        CASE WHEN p_team_name IS NULL OR length(trim(p_team_name)) = 0
             THEN 'Vola Stadium'
             ELSE 'Home of: ' || trim(p_team_name) END,
        'GOVERNMENT',    'Ministry of Sports', NULL,            v_nation_id,
        'Construction',  v_spec_cat,           v_budget_target, v_timeline,
        'Civil Engineering', 'Vola Stadium',   'open',
        jsonb_build_object('work_crews', v_crews),
        v_tick,          v_tick + 6
    ) RETURNING id INTO v_contract_id;

    RETURN jsonb_build_object(
        'success',      true,
        'contract_id',  v_contract_id,
        'tier',         p_size,
        'cost',         v_post_cost,
        'crews',        v_crews,
        'timeline',     v_timeline
    );
END;
$$;

GRANT EXECUTE ON FUNCTION post_stadium_contract(TEXT, TEXT, TEXT) TO authenticated;

COMMENT ON FUNCTION post_stadium_contract(TEXT, TEXT, TEXT) IS
  'Sports Minister posts a Vola Stadium contract. Tier tunings: Small 18-mo/1-crew, Modest 28-mo/1-crew, Extravagant 38-mo/2-crew. Crew requirement written to corp_contracts.requirements.work_crews; the existing construction-sector bid gate enforces it.';

NOTIFY pgrst, 'reload schema';

COMMIT;
