-- =========================================================================
-- Fix: sign_presidential_bill RPC drops selected_option_id when activating
-- policy-backed articles, so option-switch bills (e.g. "Citizenship
-- Framework Act → Switch to Restricted Naturalization") leave
-- active_laws.selected_option_id pointing at the OLD option.
--
-- ROOT CAUSE
-- ----------
-- 20260313_fix_presidential_sign_duplicate_policy.sql defined the RPC
-- before multi-option policies existed (added 20260428). The INSERT
-- INTO active_laws lists only (nation_id, policy_id, passed_tick,
-- proposed_by, effects_applied_through_tick) and the ON CONFLICT DO
-- UPDATE only refreshes the same five columns — selected_option_id is
-- never written or updated.
--
-- For an existing active_laws row (the common case — every nation has
-- a Citizenship Framework Act row from the backfill), the ON CONFLICT
-- branch keeps selected_option_id at its prior value. The bill is
-- still marked status='passed' inside the same transaction, so the
-- player sees PASSED but the law shows the OLD option.
--
-- The JS-side enactBill that runs after the RPC ALSO upserts
-- active_laws with the correct selected_option_id, so when that
-- follow-up succeeds the bug is masked. Any silent failure of the
-- follow-up (RLS regression, network drop, browser tab closed before
-- it completed) leaves the wrong row in place — defense in depth says
-- the RPC itself should write the right thing.
--
-- FIX
-- ---
-- Re-CREATE sign_presidential_bill verbatim except the INSERT now
-- carries selected_option_id from bill_articles, and the ON CONFLICT
-- DO UPDATE includes selected_option_id = EXCLUDED.selected_option_id.
-- Every other line is byte-identical to the prior version (whole-bill
-- repeal, article-level repeals, DISTINCT ON dedup, tax-rate effects,
-- bill status flip, error handling).
--
-- PART B repairs any active_laws rows whose selected_option_id is out
-- of sync with the most recent passed bill_article for that policy.
-- Idempotent: re-runs no-op when every row is already aligned.
-- =========================================================================


-- ── PART A: re-CREATE sign_presidential_bill ────────────────────────────

CREATE OR REPLACE FUNCTION sign_presidential_bill(
    p_bill_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_bill               bills%ROWTYPE;
    v_current_tick       INT := 0;
    v_actor_faction_id   UUID;
    v_president_faction  UUID;
    v_income_tax         NUMERIC;
    v_sales_tax          NUMERIC;
    v_corporate_tax      NUMERIC;
    v_row                RECORD;
BEGIN
    v_actor_faction_id := auth.uid();
    IF v_actor_faction_id IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'code', 'UNAUTHENTICATED', 'message', 'Authentication is required.');
    END IF;

    SELECT *
    INTO v_bill
    FROM bills
    WHERE id = p_bill_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('ok', false, 'code', 'BILL_NOT_FOUND', 'message', 'Bill not found.');
    END IF;

    IF v_bill.status <> 'president_desk' THEN
        RETURN jsonb_build_object('ok', false, 'code', 'INVALID_STATUS', 'message', 'Bill is not on the president''s desk.');
    END IF;

    SELECT p.faction_id
    INTO v_president_faction
    FROM presidents p
    WHERE p.nation_id = v_bill.nation_id
      AND p.is_active = true
    ORDER BY p.elected_tick DESC NULLS LAST
    LIMIT 1;

    IF v_president_faction IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'code', 'NO_ACTIVE_PRESIDENT', 'message', 'No active president found for this nation.');
    END IF;

    IF v_actor_faction_id <> v_president_faction THEN
        RETURN jsonb_build_object('ok', false, 'code', 'UNAUTHORIZED', 'message', 'Only the president faction may sign this bill.');
    END IF;

    SELECT s.current_tick
    INTO v_current_tick
    FROM shard s
    WHERE s.name = 'Alpha Shard'
    LIMIT 1;

    v_current_tick := COALESCE(v_current_tick, 0);

    -- Whole-bill repeal support.
    IF v_bill.bill_type = 'repeal' AND v_bill.repeal_active_law_id IS NOT NULL THEN
        UPDATE bills
        SET repeal_active_law_id = NULL
        WHERE repeal_active_law_id = v_bill.repeal_active_law_id;

        UPDATE bill_articles
        SET repeal_active_law_id = NULL
        WHERE repeal_active_law_id = v_bill.repeal_active_law_id;

        DELETE FROM active_laws
        WHERE id = v_bill.repeal_active_law_id
          AND nation_id = v_bill.nation_id;
    END IF;

    -- Article-level repeals.
    FOR v_row IN
        SELECT ba.repeal_active_law_id
        FROM bill_articles ba
        WHERE ba.bill_id = p_bill_id
          AND ba.repeal_active_law_id IS NOT NULL
    LOOP
        UPDATE bills
        SET repeal_active_law_id = NULL
        WHERE repeal_active_law_id = v_row.repeal_active_law_id;

        UPDATE bill_articles
        SET repeal_active_law_id = NULL
        WHERE repeal_active_law_id = v_row.repeal_active_law_id;

        DELETE FROM active_laws
        WHERE id = v_row.repeal_active_law_id
          AND nation_id = v_bill.nation_id;
    END LOOP;

    -- Activate all policy-backed articles (deduplicate to avoid
    -- "ON CONFLICT DO UPDATE cannot affect row a second time" when a
    -- bill contains multiple articles referencing the same policy_id).
    -- Now carries selected_option_id so option-switch bills land the
    -- correct option on the active_laws row instead of leaving the
    -- prior option in place.
    INSERT INTO active_laws (
        nation_id,
        policy_id,
        passed_tick,
        proposed_by,
        effects_applied_through_tick,
        selected_option_id
    )
    SELECT DISTINCT ON (ba.policy_id)
        v_bill.nation_id,
        ba.policy_id,
        v_current_tick,
        v_bill.proposed_by,
        v_current_tick - 1,
        ba.selected_option_id
    FROM bill_articles ba
    WHERE ba.bill_id = p_bill_id
      AND ba.policy_id IS NOT NULL
    ORDER BY ba.policy_id, ba.created_at DESC
    ON CONFLICT (nation_id, policy_id)
    DO UPDATE SET
        passed_tick = EXCLUDED.passed_tick,
        proposed_by = EXCLUDED.proposed_by,
        effects_applied_through_tick = EXCLUDED.effects_applied_through_tick,
        selected_option_id = EXCLUDED.selected_option_id;

    -- Apply tax-rate effect_data payloads.
    FOR v_row IN
        SELECT
            ba.effect_data->>'tax_key' AS tax_key,
            LEAST(50, GREATEST(0, (ba.effect_data->>'new_rate')::NUMERIC)) AS new_rate
        FROM bill_articles ba
        WHERE ba.bill_id = p_bill_id
          AND ba.effect_data IS NOT NULL
          AND ba.effect_data->>'type' = 'TAX_RATE_CHANGE'
          AND ba.effect_data->>'tax_key' IN ('income_tax', 'sales_tax', 'corporate_tax')
    LOOP
        IF v_row.tax_key = 'income_tax' THEN
            v_income_tax := v_row.new_rate;
        ELSIF v_row.tax_key = 'sales_tax' THEN
            v_sales_tax := v_row.new_rate;
        ELSIF v_row.tax_key = 'corporate_tax' THEN
            v_corporate_tax := v_row.new_rate;
        END IF;
    END LOOP;

    UPDATE nations n
    SET income_tax = COALESCE(v_income_tax, n.income_tax),
        sales_tax = COALESCE(v_sales_tax, n.sales_tax),
        corporate_tax = COALESCE(v_corporate_tax, n.corporate_tax)
    WHERE n.id = v_bill.nation_id;

    UPDATE bills b
    SET status = 'passed',
        passed_tick = COALESCE(b.passed_tick, v_current_tick),
        president_action = 'signed',
        president_action_tick = v_current_tick
    WHERE b.id = p_bill_id;

    RETURN jsonb_build_object(
        'ok', true,
        'code', 'SIGNED',
        'message', 'Bill signed and enacted.',
        'bill_id', p_bill_id,
        'tick', v_current_tick
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'ok', false,
            'code', 'EXCEPTION',
            'message', SQLERRM
        );
END;
$$;

ALTER FUNCTION sign_presidential_bill(UUID) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION sign_presidential_bill(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION sign_presidential_bill(UUID) TO service_role;


-- ── PART B: repair active_laws rows whose selected_option_id is out
-- of sync with the most recent passed bill_article for that policy ──

WITH latest_article AS (
    -- For every (nation_id, policy_id), pick the bill_articles row
    -- from the most recently passed bill that carries a non-null
    -- selected_option_id. Repeal articles intentionally leave
    -- selected_option_id null and are excluded.
    SELECT DISTINCT ON (b.nation_id, ba.policy_id)
        b.nation_id,
        ba.policy_id,
        ba.selected_option_id
    FROM bills b
    JOIN bill_articles ba ON ba.bill_id = b.id
    WHERE b.status = 'passed'
      AND ba.policy_id IS NOT NULL
      AND ba.selected_option_id IS NOT NULL
    ORDER BY b.nation_id, ba.policy_id, b.passed_tick DESC NULLS LAST, ba.created_at DESC
)
UPDATE active_laws al
SET selected_option_id = la.selected_option_id
FROM latest_article la
WHERE al.nation_id = la.nation_id
  AND al.policy_id = la.policy_id
  AND al.selected_option_id IS DISTINCT FROM la.selected_option_id;


-- ── Verify ──────────────────────────────────────────────────────────────

-- List every (nation, policy) where active_laws.selected_option_id
-- still differs from the most recent passed bill_article. After this
-- migration, the result set should be empty.
WITH latest_article AS (
    SELECT DISTINCT ON (b.nation_id, ba.policy_id)
        b.nation_id,
        ba.policy_id,
        ba.selected_option_id AS expected_option_id
    FROM bills b
    JOIN bill_articles ba ON ba.bill_id = b.id
    WHERE b.status = 'passed'
      AND ba.policy_id IS NOT NULL
      AND ba.selected_option_id IS NOT NULL
    ORDER BY b.nation_id, ba.policy_id, b.passed_tick DESC NULLS LAST, ba.created_at DESC
)
SELECT
    n.name              AS nation,
    p.policy_name       AS policy,
    al.selected_option_id   AS active_option_id,
    la.expected_option_id   AS expected_option_id
FROM latest_article la
JOIN active_laws al
    ON al.nation_id = la.nation_id
    AND al.policy_id = la.policy_id
JOIN nations n  ON n.id = la.nation_id
JOIN policies p ON p.id = la.policy_id
WHERE al.selected_option_id IS DISTINCT FROM la.expected_option_id
ORDER BY n.name, p.policy_name;
