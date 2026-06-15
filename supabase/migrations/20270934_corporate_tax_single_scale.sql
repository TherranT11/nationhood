-- ════════════════════════════════════════════════════════════════════
-- 20270934 — Corporate tax: one 0-100 scale, real-world anchors
--
-- User report (Sierramar): corp shows CORPORATE TAX RATE 100% under the
-- "Progressive Corporate Tax" law. Root cause was a split scale:
--   • Almost every consumer reads nations.corporate_tax as a DIRECT
--     0-100 percent — nation-info ('0-100'), entrepreneur-corp (filing),
--     entrepreneur-corporations, select-nation, budget.js, the option
--     anchors in 20270117 (10/30/50/70/90), and the seeds (52, 48…).
--   • Two outliers — file_corporate_tax (20270872/887) and the
--     business-corp page — multiplied that value ×5 on the false premise
--     that it was a 0-10 codebook. 70 × 5 = 350 → clamped at 100%.
--
-- The ×5 was a buggy way to reach "real-world" rates. Fix properly:
-- keep the SINGLE 0-100 scale everyone else uses, drop the ×5, and
-- re-anchor the codebook to the intended real-world rates directly:
--   Tax Haven 5 · Pro-Business 15 · Standard 25 · Progressive 35 · Heavy 45
-- Now display == charge == every other page, and Progressive reads 35%.
--
-- business-corp.html and select-nation.html move in lockstep (drop ×5;
-- re-bucket the policy-label thresholds to the new anchors).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Re-anchor the 5 Corporate Taxation options (0-100 scale) ────────
-- Strip the corporate_tax stat_targets element and re-add at the new
-- anchor (pull 1.0), mirroring 20270117's jsonb rewrite.
WITH m(opt_id, tgt) AS (VALUES
    ('a149e203-c42b-45d5-af23-3b342e14fbe3'::uuid,  5),  -- Tax Haven
    ('1ef33bba-7157-4c9a-b36c-5267c4f61010'::uuid, 15),  -- Pro-Business Low Tax
    ('99429608-a10b-4a84-8861-0606dbd89c1f'::uuid, 25),  -- Standard Rate
    ('01fb8791-b03c-42f8-b05a-d1d390e945f1'::uuid, 35),  -- Progressive Corporate Tax
    ('ed338045-29c0-4395-b0b3-04afc3361aae'::uuid, 45)   -- Heavy Taxation
)
UPDATE public.policy_options po SET
    stat_targets = COALESCE((
        SELECT jsonb_agg(t)
        FROM jsonb_array_elements(
            CASE WHEN jsonb_typeof(po.stat_targets) = 'array' THEN po.stat_targets ELSE '[]'::jsonb END
        ) t
        WHERE t->>'stat_key' <> 'corporate_tax'
    ), '[]'::jsonb)
    || jsonb_build_array(jsonb_build_object('stat_key', 'corporate_tax', 'target', m.tgt, 'pull', 1.0))
FROM m
WHERE po.id = m.opt_id;

-- ── 2. Snap live nations to their enacted option's new anchor ──────────
WITH mc(opt_id, tgt) AS (VALUES
    ('a149e203-c42b-45d5-af23-3b342e14fbe3'::uuid,  5),
    ('1ef33bba-7157-4c9a-b36c-5267c4f61010'::uuid, 15),
    ('99429608-a10b-4a84-8861-0606dbd89c1f'::uuid, 25),
    ('01fb8791-b03c-42f8-b05a-d1d390e945f1'::uuid, 35),
    ('ed338045-29c0-4395-b0b3-04afc3361aae'::uuid, 45)
)
UPDATE public.nations n SET corporate_tax = mc.tgt
FROM public.active_laws al
JOIN mc ON mc.opt_id = al.selected_option_id
WHERE al.nation_id = n.id;

-- ── 3. Stragglers not on an enacted corporate option ───────────────────
-- The new anchors are exactly half the old ones (70→35, 90→45), so any
-- value still above the new max (45) is an old-scale leftover (seeds 52,
-- 48…): halve it to land in the real-world band. No more ×5, so nothing
-- clamps at 100% regardless.
UPDATE public.nations
   SET corporate_tax = LEAST(45, GREATEST(0, ROUND(corporate_tax / 2.0)))
 WHERE corporate_tax > 45;

-- ── 4. file_corporate_tax — read corporate_tax as a direct percent ─────
-- Re-emit of 20270887 with the ONE rate line changed (drop ×5); the
-- net-of-payroll base, Tax Holiday discount, disclosure tiers, evasion
-- roll, and budget credit are all byte-for-byte unchanged.
CREATE OR REPLACE FUNCTION public.file_corporate_tax(
    p_corp_id        uuid,
    p_disclosure_pct int
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid         uuid := auth.uid();
    v_corp        entrepreneur_corps%ROWTYPE;
    v_owner       factions%ROWTYPE;
    v_nation      nations%ROWTYPE;
    v_tick        int;
    v_year_start  int;
    v_year        int;
    v_profit_raw  numeric;
    v_profit      bigint;
    v_rate        int;
    v_holiday_pct int;
    v_tax_owed    bigint;
    v_declared    bigint;
    v_evaded      bigint;
    v_treasury    numeric;
    v_has_agent   boolean;
    v_corruption  int;
    v_roll        int;
    v_caught      boolean := false;
    v_fine        bigint := 0;
    v_clawback    bigint := 0;
    v_status      text;
    v_paid        bigint;
    v_filing_id   uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_disclosure_pct NOT IN (100, 75, 50, 25) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_disclosure');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;

    -- Owner gate: the corp's owner faction must belong to the caller.
    SELECT * INTO v_owner FROM factions
     WHERE id = v_corp.owner_faction_id
       AND (id = v_uid OR linked_user_id = v_uid);
    IF v_owner.id IS NULL AND NOT is_admin() THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authorized');
    END IF;

    SELECT * INTO v_nation FROM nations WHERE id = v_corp.hq_nation_id FOR UPDATE;
    IF v_nation.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_not_found');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick       := COALESCE(v_tick, 0);
    v_year_start := (v_tick / 12) * 12;
    v_year       := 2000 + (v_tick / 12);   -- matches utils.tickToYear

    IF EXISTS (SELECT 1 FROM corp_tax_filings WHERE corp_id = p_corp_id AND year = v_year) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_filed_this_year', 'year', v_year);
    END IF;

    -- Taxable profit YTD (20270887): ledger revenue MINUS the payroll
    -- accumulator (year-guarded). Payroll never writes corp_cash_events,
    -- so no double count. Production/materials spend has no YTD
    -- accumulator yet — flagged follow-up. Negative net → 0 owed.
    SELECT COALESCE(SUM(delta), 0) INTO v_profit_raw
      FROM corp_cash_events
     WHERE corp_id = p_corp_id
       AND tick >= v_year_start
       AND tick <= v_tick;
    IF COALESCE(v_corp.payroll_ytd_year, -1) = (v_tick / 12) THEN
        v_profit_raw := v_profit_raw - COALESCE(v_corp.payroll_ytd, 0);
    END IF;
    v_profit := GREATEST(0, FLOOR(v_profit_raw))::bigint;

    -- nations.corporate_tax is a direct 0-100 percent (20270934): the
    -- Corporate Taxation codebook pins it via the option target drift —
    -- Tax Haven 5 / Pro-Business 15 / Standard 25 / Progressive 35 /
    -- Heavy 45. Charged as that percent of net profit.
    v_rate     := GREATEST(0, LEAST(100, COALESCE(v_nation.corporate_tax, 0)));
    -- An active Tax Holiday Act (20270873) discounts the filing rate
    -- for covered years and sectors — sectors NULL means all.
    SELECT pct INTO v_holiday_pct FROM corporate_tax_holidays
     WHERE nation_id = v_corp.hq_nation_id
       AND v_year >= start_year AND v_year < start_year + years
       AND (sectors IS NULL OR v_corp.industry = ANY (sectors))
     ORDER BY created_at DESC LIMIT 1;
    IF v_holiday_pct IS NOT NULL THEN
        v_rate := FLOOR(v_rate * (100 - v_holiday_pct) / 100.0)::int;
    END IF;
    v_tax_owed := FLOOR(v_profit * v_rate / 100.0)::bigint;
    v_declared := FLOOR(v_tax_owed * p_disclosure_pct / 100.0)::bigint;
    v_evaded   := v_tax_owed - v_declared;
    v_treasury := COALESCE(v_corp.treasury_cash, 0);

    -- Must be able to cover the declared portion. A short corp can pick
    -- a lower disclosure tier to owe less.
    IF v_declared > v_treasury THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_treasury',
            'declared', v_declared, 'treasury', FLOOR(v_treasury)::bigint);
    END IF;

    -- Resolve outcome.
    IF p_disclosure_pct = 100 OR v_tax_owed = 0 THEN
        v_status := 'compliant';
        v_evaded := 0;
    ELSE
        v_has_agent := EXISTS (
            SELECT 1 FROM factions
             WHERE faction_type = 'politician'
               AND nation_id = v_corp.hq_nation_id
               AND politician_fis_joined_at_tick IS NOT NULL
               AND abandoned_at IS NULL
        );
        IF v_has_agent THEN
            -- Deferred: an FIS agent exists, so no auto-catch. The
            -- hidden income is logged for a later audit to uncover.
            v_status := 'evaded';
        ELSE
            -- No auditor → the game adjudicates with a Balanced roll.
            v_corruption := GREATEST(0, LEAST(100, COALESCE(v_nation.corruption, 0)::int));
            v_roll       := 1 + FLOOR(random() * 100)::int;
            v_caught     := (v_roll + v_corruption) <= (100 - p_disclosure_pct);
            v_status     := CASE WHEN v_caught THEN 'caught' ELSE 'evaded' END;
        END IF;
    END IF;

    -- Pay the declared portion now.
    v_paid     := v_declared;
    v_treasury := v_treasury - v_declared;

    -- If caught, claw back the evaded amount + 10% fine (clamped to
    -- whatever treasury is left). Nothing is "successfully evaded".
    IF v_status = 'caught' THEN
        v_fine     := FLOOR(v_evaded * 0.10)::bigint;
        v_clawback := LEAST(FLOOR(v_treasury)::bigint, v_evaded + v_fine);
        v_paid     := v_paid + v_clawback;
        v_treasury := v_treasury - v_clawback;
        v_evaded   := 0;
    END IF;

    UPDATE entrepreneur_corps
       SET treasury_cash = v_treasury, updated_at = now()
     WHERE id = p_corp_id;

    -- Credit the nation's budget for everything actually collected
    -- (/1e9 RAW_PER_ABSTRACT convention).
    IF v_paid > 0 THEN
        UPDATE nations
           SET budget = COALESCE(budget, 0) + (v_paid::numeric / 1000000000)
         WHERE id = v_corp.hq_nation_id;
    END IF;

    INSERT INTO corp_tax_filings (
        corp_id, nation_id, year, taxable_profit, rate_pct, tax_owed,
        disclosure_pct, amount_paid, amount_evaded, status,
        has_fis_agent, filed_by_faction_id, filed_at_tick
    ) VALUES (
        p_corp_id, v_corp.hq_nation_id, v_year, v_profit, v_rate, v_tax_owed,
        p_disclosure_pct, v_paid, v_evaded, v_status,
        COALESCE(v_has_agent, false), v_owner.id, v_tick
    ) RETURNING id INTO v_filing_id;

    RETURN jsonb_build_object(
        'success',         true,
        'filing_id',       v_filing_id,
        'year',            v_year,
        'taxable_profit',  v_profit,
        'rate_pct',        v_rate,
        'tax_owed',        v_tax_owed,
        'disclosure_pct',  p_disclosure_pct,
        'amount_paid',     v_paid,
        'amount_evaded',   v_evaded,
        'status',          v_status,
        'has_fis_agent',   COALESCE(v_has_agent, false),
        'caught',          v_caught
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.file_corporate_tax(uuid, int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.file_corporate_tax(uuid, int) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
