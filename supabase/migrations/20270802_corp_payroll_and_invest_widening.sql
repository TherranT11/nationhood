-- ════════════════════════════════════════════════════════════════════
-- 20270802 — Corp payroll goes live + invest_into_corp for businessmen
--
-- Running a corporation gets expensive. Every tick, every corp pays:
--
--     employee_count × $1,000  (base staffing cost)
--   + Σ(hired salaries) ÷ 12   (the named hires' monthly wages)
--
-- out of treasury_cash. The treasury floors at $0 — a corp that can't
-- cover payroll still RECORDS the full cost (the accumulators track
-- what payroll costs, not what was managed), but a shortfall tick
-- pays no player wages: hired players receive their salary ÷ 12 into
-- party_funds only on ticks where the corp covered payroll in full.
--
--   entrepreneur_corps gains:
--     payroll_ytd / payroll_ytd_year  year accumulator, same rollover
--                                     shape as revenue_ytd (20270780)
--     last_tick_payroll               this tick's full cost
--     last_payroll_tick               idempotency stamp
--
--   process_corp_payroll(p_tick): called once per tick from
--   advance-corp-tick (same per-tick RPC pattern as
--   process_entrepreneur_airline_routes). Idempotent — corps already
--   stamped this tick are skipped. service_role only.
--
-- Also: invest_into_corp re-emitted to accept businessman owners.
-- Body byte-faithful to 20270411 except the faction gate
-- (faction_type IN ('entrepreneur', 'businessman')) and the ORDER BY
-- now prefers the faction that owns the corp, so a player holding
-- both faction types resolves to the right one instead of whichever
-- is older.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.entrepreneur_corps
    ADD COLUMN IF NOT EXISTS payroll_ytd       bigint NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS payroll_ytd_year  int,
    ADD COLUMN IF NOT EXISTS last_tick_payroll bigint NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_payroll_tick int;

-- ── process_corp_payroll ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.process_corp_payroll(p_tick int)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    c           RECORD;
    r           RECORD;
    v_wages     bigint;
    v_cost      bigint;
    v_paid      bigint;
    v_corps     int := 0;
    v_total     bigint := 0;
    v_players   int := 0;
    v_shortfall int := 0;
BEGIN
    IF p_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    FOR c IN
        SELECT id, employee_count, treasury_cash
          FROM entrepreneur_corps
         WHERE COALESCE(last_payroll_tick, -1) < p_tick
         ORDER BY id
           FOR UPDATE
    LOOP
        SELECT COALESCE(SUM(o.salary_yearly), 0) INTO v_wages
          FROM job_applicants a
          JOIN job_openings o ON o.id = a.opening_id
         WHERE o.corp_id = c.id AND a.status = 'hired';

        v_cost := GREATEST(1, COALESCE(c.employee_count, 1)) * 1000
                  + FLOOR(v_wages / 12.0)::bigint;
        v_paid := LEAST(FLOOR(GREATEST(COALESCE(c.treasury_cash, 0), 0))::bigint, v_cost);

        UPDATE entrepreneur_corps
           SET treasury_cash     = COALESCE(treasury_cash, 0) - v_paid,
               payroll_ytd       = CASE
                   WHEN COALESCE(payroll_ytd_year, -1) = p_tick / 12
                        THEN COALESCE(payroll_ytd, 0) + v_cost
                   ELSE v_cost
               END,
               payroll_ytd_year  = p_tick / 12,
               last_tick_payroll = v_cost,
               last_payroll_tick = p_tick
         WHERE id = c.id;

        v_corps := v_corps + 1;
        v_total := v_total + v_paid;

        -- Full payroll made → hired players collect their month's wage.
        IF v_paid = v_cost THEN
            FOR r IN
                SELECT a.applicant_faction_id, o.salary_yearly
                  FROM job_applicants a
                  JOIN job_openings o ON o.id = a.opening_id
                 WHERE o.corp_id = c.id
                   AND a.status = 'hired'
                   AND a.applicant_faction_id IS NOT NULL
            LOOP
                UPDATE factions
                   SET party_funds = COALESCE(party_funds, 0) + FLOOR(r.salary_yearly / 12.0)
                 WHERE id = r.applicant_faction_id
                   AND abandoned_at IS NULL;
                v_players := v_players + 1;
            END LOOP;
        ELSE
            v_shortfall := v_shortfall + 1;
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'success',         true,
        'corps_processed', v_corps,
        'total_charged',   v_total,
        'players_paid',    v_players,
        'shortfalls',      v_shortfall
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.process_corp_payroll(int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.process_corp_payroll(int) TO service_role;

COMMENT ON FUNCTION public.process_corp_payroll(int) IS
    'Per-tick corp payroll: employee_count × $1k + hired salaries ÷ 12 out of treasury_cash (floored at $0; full cost still accumulates into payroll_ytd). Hired players receive salary ÷ 12 into party_funds only on fully-covered ticks. Idempotent via last_payroll_tick. Called by advance-corp-tick; service_role only.';

-- ── invest_into_corp — businessman owners welcome ─────────────────
CREATE OR REPLACE FUNCTION public.invest_into_corp(p_corp_id UUID, p_amount BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid       UUID := auth.uid();
    v_fac       factions%ROWTYPE;
    v_corp      entrepreneur_corps%ROWTYPE;
    v_funds     BIGINT;
    v_tick      INT;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF p_amount IS NULL OR p_amount < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_amount');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    -- Public corps raise capital via share issuance, not founder cash
    -- injections (which would silently dilute the public float).
    IF v_corp.listing = 'public' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'use_share_issuance');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type IN ('entrepreneur', 'businessman')
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY (id = v_corp.owner_faction_id) DESC, created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;

    IF v_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    -- Personal-cash gate. floor() so a fractional party_funds value
    -- doesn't permit an over-spend via int truncation either side.
    v_funds := floor(COALESCE(v_fac.party_funds, 0))::bigint;
    IF p_amount > v_funds THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'have', v_funds, 'need', p_amount);
    END IF;

    -- Atomic: debit founder's Cash on Hand, credit corp treasury.
    UPDATE factions
       SET party_funds = COALESCE(party_funds, 0) - p_amount
     WHERE id = v_fac.id;

    UPDATE entrepreneur_corps
       SET treasury_cash = COALESCE(treasury_cash, 0) + p_amount
     WHERE id = p_corp_id;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    INSERT INTO event_log (
        nation_id, faction_id, event_name, description_used,
        category, trigger_key, effects_applied, fired_at_tick
    ) VALUES (
        v_corp.hq_nation_id, v_fac.id,
        'Owner Investment',
        format('%s invested $%s of personal funds into %s.',
               COALESCE(v_fac.faction_name, 'The founder'), p_amount, v_corp.name),
        'corporate', 'corp_owner_invest',
        jsonb_build_object('corp_id', p_corp_id, 'corp_name', v_corp.name, 'amount', p_amount),
        v_tick
    );

    RETURN jsonb_build_object(
        'success',      true,
        'corp_id',      p_corp_id,
        'amount',       p_amount,
        'new_treasury', floor(COALESCE(v_corp.treasury_cash, 0))::bigint + p_amount,
        'new_funds',    v_funds - p_amount
    );
END;
$$;

NOTIFY pgrst, 'reload schema';

COMMIT;
