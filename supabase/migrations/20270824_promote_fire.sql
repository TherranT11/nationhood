-- ════════════════════════════════════════════════════════════════════
-- 20270824 — Promote and Fire: the owner manages the roster
--
-- Every Prominent Employees row gains [PROMOTE] and [FIRE].
--
--   promote_employee: +1 rung on the Operations ladder (capped at
--   rung 3 until 4-6 are chartered for hiring). Salary rises 25%,
--   clamped to the nation's expected-salary band ceiling (the same
--   wages × standard_of_living × 30 × 200% that gates postings).
--   Headcount grows by the tier difference (×12 rule). The hire's
--   opening row IS the position record, so the rung/title/salary
--   move there — every reader (roster, payroll, player employment)
--   stays single-source. Player hires get their employment record
--   updated and a 'Promoted to …' career-history entry.
--
--   fire_employee: hired → fired (status CHECK widened). Headcount
--   drops by rung × 12 (floor 1 — the owner remains); payroll stops
--   naturally (it sums status='hired' only). Player hires get their
--   employment record cleared and a 'Let go as …' history entry.
--   No severance (none specced). The filled opening stays filled —
--   post a fresh opening to rehire.
--
-- Both are owner-only management actions (free, like hiring) built
-- on the shared _job_board_owner_check guard from 20270799.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.job_applicants
    DROP CONSTRAINT IF EXISTS job_applicants_status_check;
ALTER TABLE public.job_applicants
    ADD CONSTRAINT job_applicants_status_check
    CHECK (status IN ('applied', 'rejected', 'hired', 'fired'));

-- ── promote_employee ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.promote_employee(p_applicant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v RECORD;
    v_nation     nations%ROWTYPE;
    v_expected   numeric;
    v_new_rung   int;
    v_new_title  text;
    v_new_salary bigint;
    v_tick       int;
BEGIN
    SELECT * INTO v FROM _job_board_owner_check(p_applicant_id, auth.uid());
    IF v.o_reason IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', v.o_reason);
    END IF;
    IF (v.o_applicant).status <> 'hired' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_hired');
    END IF;

    v_new_rung := (v.o_opening).rung + 1;
    v_new_title := CASE v_new_rung
        WHEN 2 THEN 'Senior Project Manager'
        WHEN 3 THEN 'Regional Director of Operations'
        ELSE NULL
    END;
    IF v_new_title IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'max_rung');
    END IF;

    -- +25%, clamped to the nation band's 200% ceiling.
    SELECT * INTO v_nation FROM nations WHERE id = (v.o_corp).hq_nation_id;
    v_expected := GREATEST(1, COALESCE(v_nation.wages, 50))
                  * GREATEST(1, COALESCE(v_nation.standard_of_living, 50))
                  * 30;
    v_new_salary := LEAST(ROUND(v_expected * 2.0),
                          ROUND((v.o_opening).salary_yearly * 1.25))::bigint;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE job_openings
       SET rung = v_new_rung, title = v_new_title, salary_yearly = v_new_salary
     WHERE id = (v.o_opening).id;
    -- The promotion brings a bigger team: +1 tier × 12.
    UPDATE entrepreneur_corps
       SET employee_count = COALESCE(employee_count, 1) + 12
     WHERE id = (v.o_corp).id;

    IF (v.o_applicant).applicant_faction_id IS NOT NULL THEN
        UPDATE factions
           SET biz_job_title      = v_new_title,
               biz_salary_yearly  = v_new_salary,
               biz_career_history = COALESCE(biz_career_history, '[]'::jsonb)
                   || jsonb_build_array(jsonb_build_object(
                          'year',  2000 + (v_tick / 12),
                          'label', 'Promoted to ' || v_new_title,
                          'sub',   (v.o_corp).name))
         WHERE id = (v.o_applicant).applicant_faction_id;
    END IF;

    RETURN jsonb_build_object('success', true,
        'title', v_new_title, 'salary_yearly', v_new_salary);
END $$;

REVOKE EXECUTE ON FUNCTION public.promote_employee(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.promote_employee(uuid) TO authenticated;

-- ── fire_employee ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fire_employee(p_applicant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v RECORD;
    v_tick int;
BEGIN
    SELECT * INTO v FROM _job_board_owner_check(p_applicant_id, auth.uid());
    IF v.o_reason IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', v.o_reason);
    END IF;
    IF (v.o_applicant).status <> 'hired' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_hired');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE job_applicants SET status = 'fired' WHERE id = p_applicant_id;
    -- The team leaves with them; the owner always remains.
    UPDATE entrepreneur_corps
       SET employee_count = GREATEST(1,
           COALESCE(employee_count, 1) - (v.o_opening).rung * 12)
     WHERE id = (v.o_corp).id;

    IF (v.o_applicant).applicant_faction_id IS NOT NULL THEN
        UPDATE factions
           SET biz_employer_corp_id = NULL,
               biz_job_title        = NULL,
               biz_salary_yearly    = NULL,
               biz_hired_at_tick    = NULL,
               biz_career_history   = COALESCE(biz_career_history, '[]'::jsonb)
                   || jsonb_build_array(jsonb_build_object(
                          'year',  2000 + (v_tick / 12),
                          'label', 'Let go as ' || (v.o_opening).title,
                          'sub',   (v.o_corp).name))
         WHERE id = (v.o_applicant).applicant_faction_id;
    END IF;

    RETURN jsonb_build_object('success', true, 'fired', (v.o_applicant).name);
END $$;

REVOKE EXECUTE ON FUNCTION public.fire_employee(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.fire_employee(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
