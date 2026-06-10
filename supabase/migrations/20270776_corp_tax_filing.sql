-- ════════════════════════════════════════════════════════════════════
-- 20270773 — Corporate tax filing (new SOT on the entrepreneur_corps model)
--
-- The legacy corporate-tax system (corp_tax_bills + assess/pay/cook/
-- ignore RPCs, faction-keyed) was torn down in prod by the legacy-
-- economy teardown (20270251); list_corp_history (20270567) noted it
-- would stay gone "until the tax system gets a new SOT". This is that
-- new SOT, rebuilt on the live entrepreneur_corps model.
--
-- Design (per user direction):
--   • File on demand, once per game-year. No background assessor — the
--     owner clicks File Taxes when they choose; UNIQUE(corp, year)
--     locks re-filing until the next year ticks over.
--   • Taxable base = the corp's NET PROFIT for the year-to-date, i.e.
--     SUM(corp_cash_events.delta) over [year_start, current_tick] —
--     the same figure corp_revenue_by_year (20270645) feeds the corp
--     page's Revenue cards. Negative net → 0 owed.
--   • Tax owed = net_profit × nations.corporate_tax%.
--   • Four disclosure tiers — the corp declares a % of what it owes:
--       100 Full Disclosure · 75 Aggressive · 50 Hidden · 25 Inflated.
--     It pays the declared portion now (from treasury_cash → nation
--     budget); the rest is "evaded".
--   • Detection of evasion (disclosure < 100):
--       - If the nation has an FIS agent (a politician faction with
--         politician_fis_joined_at_tick set, 20270769) → NO dice roll.
--         The evaded amount is recorded (status='evaded') for a later
--         FIS audit to uncover. The corp is not auto-caught.
--       - If the nation has NO FIS agent → the game adjudicates at
--         filing with a Balanced roll: caught if
--         (1d100 + nation.corruption) <= (100 - disclosure_pct).
--         Caught → claw back the evaded amount + a 10% fine from
--         treasury, status='caught'. Survived → status='evaded'.
--     Nation corruption lowers the catch chance, as it did in the old
--     Cook-the-Books engine.
--
-- Money moves through entrepreneur_corps.treasury_cash directly (the
-- live cash field) — NOT emit_corp_cash_event, which writes the dead
-- legacy factions.corp_cash_reserves and whose corp_cash_events FK is
-- to factions(id), not entrepreneur_corps(id). Nation budget credit
-- uses the /1e9 RAW_PER_ABSTRACT convention (bills.js / legacy tax).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. corp_tax_filings — one filing per (corp, year) ───────────────
CREATE TABLE IF NOT EXISTS public.corp_tax_filings (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    corp_id             uuid NOT NULL REFERENCES public.entrepreneur_corps(id) ON DELETE CASCADE,
    nation_id           uuid NOT NULL REFERENCES public.nations(id)            ON DELETE CASCADE,
    year                int  NOT NULL,
    taxable_profit      bigint NOT NULL CHECK (taxable_profit >= 0),
    rate_pct            int  NOT NULL CHECK (rate_pct BETWEEN 0 AND 100),
    tax_owed            bigint NOT NULL CHECK (tax_owed >= 0),
    disclosure_pct      int  NOT NULL CHECK (disclosure_pct IN (100, 75, 50, 25)),
    amount_paid         bigint NOT NULL CHECK (amount_paid >= 0),
    amount_evaded       bigint NOT NULL DEFAULT 0 CHECK (amount_evaded >= 0),
    status              text NOT NULL CHECK (status IN ('compliant', 'evaded', 'caught')),
    has_fis_agent       boolean NOT NULL DEFAULT false,
    filed_by_faction_id uuid REFERENCES public.factions(id) ON DELETE SET NULL,
    filed_at_tick       int  NOT NULL,
    created_at          timestamptz NOT NULL DEFAULT now(),
    UNIQUE (corp_id, year)
);

CREATE INDEX IF NOT EXISTS corp_tax_filings_corp_idx ON public.corp_tax_filings (corp_id);
-- Hot path for a future FIS audit: outstanding hidden income by nation.
CREATE INDEX IF NOT EXISTS corp_tax_filings_evaded_idx
    ON public.corp_tax_filings (nation_id) WHERE status = 'evaded';

COMMENT ON TABLE public.corp_tax_filings IS
    'One corporate tax filing per (corp, year) on the entrepreneur_corps model (20270773). status: compliant (full disclosure or nothing owed) / evaded (hid income, not caught — FIS may uncover later) / caught (no-FIS-agent dice roll caught it at filing). Replaces the torn-down legacy corp_tax_bills SOT.';

ALTER TABLE public.corp_tax_filings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS corp_tax_filings_select ON public.corp_tax_filings;
CREATE POLICY corp_tax_filings_select ON public.corp_tax_filings
    FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS corp_tax_filings_service_all ON public.corp_tax_filings;
CREATE POLICY corp_tax_filings_service_all ON public.corp_tax_filings
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── 2. file_corporate_tax(p_corp_id, p_disclosure_pct) ──────────────
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

    -- Net profit YTD: SUM(corp_cash_events.delta) over [year_start,
    -- current_tick] — the same figure corp_revenue_by_year (20270645)
    -- feeds the page's Revenue cards. Negative net → 0 owed.
    SELECT COALESCE(SUM(delta), 0) INTO v_profit_raw
      FROM corp_cash_events
     WHERE corp_id = p_corp_id
       AND tick >= v_year_start
       AND tick <= v_tick;
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
    'Owner files a corp''s annual taxes once per game-year (20270773). Base = net profit YTD (SUM corp_cash_events.delta, year-to-date), tax = profit × nation.corporate_tax%. Declares p_disclosure_pct (100/75/50/25) of what is owed, paid from treasury_cash → nation.budget. Evasion (disclosure<100): if the nation has an FIS agent, the hidden amount is logged (status=evaded) for a later audit; otherwise a Balanced roll (1d100 + corruption <= 100-disclosure) may catch it (claw back evaded + 10%% fine, status=caught). UNIQUE(corp,year) locks re-filing.';

NOTIFY pgrst, 'reload schema';

COMMIT;
