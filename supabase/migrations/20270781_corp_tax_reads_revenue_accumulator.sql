-- ════════════════════════════════════════════════════════════════════
-- 20270781 — Corp tax reads the revenue accumulator; column hardening
--
-- Audit follow-up to 20270780, two parts:
--
-- 1. The three accumulator columns get the same column-REVOKE
--    posture 20270605 gave last_tick_revenue / last_revenue_tick.
--    KNOWN ISSUE (pre-existing, same as those stamp columns and
--    treasury_cash): the "Owner writes" FOR ALL policy (20270139)
--    plus Supabase's default table-level grants mean a corp owner
--    can still UPDATE these columns directly — column-level REVOKE
--    does not subtract from a table-level UPDATE grant (verified on
--    PG16). The REVOKE is kept for convention and for deployments
--    with column-list grants; real hardening is a table-wide grants
--    project.
--
-- 2. file_corporate_tax (20270776_corp_tax_filing on main) computes
--    taxable profit as SUM(corp_cash_events.delta) year-to-date. Its
--    header pins the invariant "the same figure corp_revenue_by_year
--    feeds the corp page's Revenue cards" — but corp_cash_events is
--    the ledger the corp simplification stopped writing (frozen at
--    tick ~140), so every filing assesses $0 profit, owes $0, and
--    stamps itself 'compliant'. And since 20270780 moved the Revenue
--    cards onto the accumulator, tax and the cards no longer even
--    agree on the figure. Re-pointing the profit query at the
--    accumulator restores both: real taxable profit, and one source
--    of truth shared with the cards. Body byte-faithful to main's
--    20270776_corp_tax_filing except the profit block (and dropping
--    the now-unused v_year_start variable).
--
-- A stale accumulator (corp idle since last year) correctly assesses
-- $0 this year — same CASE the read RPC uses. Negative YTD (loss
-- year) → 0 owed, as before.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Server-only writes on the accumulator columns ─────────────
REVOKE UPDATE (revenue_ytd, revenue_ytd_year, revenue_last_year)
    ON entrepreneur_corps FROM PUBLIC, anon, authenticated;

COMMENT ON COLUMN entrepreneur_corps.revenue_ytd IS
    'Net revenue accumulated across the current game-year, rolled by stamp_entrepreneur_corp_revenue (20270780). Server-only writes. Read by corp_revenue_by_year (Revenue cards) and file_corporate_tax (taxable profit).';
COMMENT ON COLUMN entrepreneur_corps.revenue_ytd_year IS
    'Game-year index (tick / 12) the revenue_ytd accumulator belongs to. NULL = corp has not earned since 20270780 landed. Server-only writes.';
COMMENT ON COLUMN entrepreneur_corps.revenue_last_year IS
    'Previous game-year''s final revenue_ytd, archived at the first stamp of a new year; zeroed when a full year passes with no revenue. Server-only writes.';

-- ── 2. file_corporate_tax — taxable profit from the accumulator ───
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
    v_year        int;
    v_profit_raw  numeric;
    v_profit      bigint;
    v_rate        int;
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
    v_tick := COALESCE(v_tick, 0);
    v_year := 2000 + (v_tick / 12);   -- matches utils.tickToYear

    IF EXISTS (SELECT 1 FROM corp_tax_filings WHERE corp_id = p_corp_id AND year = v_year) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_filed_this_year', 'year', v_year);
    END IF;

    -- Net profit YTD: read through corp_revenue_by_year itself, so the
    -- taxable base IS the figure on the corp page's Revenue card — the
    -- invariant this function's original header pinned — by
    -- construction, not by parallel math. The previous inline
    -- SUM(corp_cash_events.delta) read a ledger the corp
    -- simplification stopped writing (frozen at tick ~140), so every
    -- filing assessed $0 profit. A stale accumulator from an earlier
    -- year reads as $0 this year. Loss year (negative) → 0 owed.
    v_profit_raw := COALESCE(
        (corp_revenue_by_year(p_corp_id, v_tick)->>'this_year_delta')::numeric, 0);
    v_profit := GREATEST(0, FLOOR(v_profit_raw))::bigint;

    v_rate     := GREATEST(0, LEAST(100, COALESCE(v_nation.corporate_tax, 0)));
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

COMMENT ON FUNCTION public.file_corporate_tax(uuid, int) IS
    'Owner files a corp''s annual taxes once per game-year. Base = net revenue YTD from the entrepreneur_corps accumulator (20270780/20270781) — the same figure the corp page''s Revenue cards show. Tax = profit × nation.corporate_tax%%. Declares p_disclosure_pct (100/75/50/25) of what is owed, paid from treasury_cash → nation.budget. Evasion (disclosure<100): if the nation has an FIS agent, the hidden amount is logged (status=evaded) for a later audit; otherwise a Balanced roll (1d100 + corruption <= 100-disclosure) may catch it (claw back evaded + 10%% fine, status=caught). UNIQUE(corp,year) locks re-filing.';

NOTIFY pgrst, 'reload schema';

COMMIT;
