-- ════════════════════════════════════════════════════════════════════
-- 20270801 — Hires bring their team: headcount = tier × 12
--
-- A hire isn't one person on the books — it's the staff that comes
-- under them. Hiring a role now adds rung × 12 to employee_count:
--
--   Tier I    Project Manager (PM)             +12
--   Tier II   Senior Project Manager           +24
--   Tier III  Regional Director of Operations  +36
--
-- hire_job_applicant body byte-faithful to 20270799 except the
-- employee_count increment (+1 → + rung × 12) and the comment above
-- it.
--
-- Backfill: employee_count is recomputed for every corp as
-- 1 (the owner) + Σ(rung × 12) over its hired applicants — the same
-- derivation the RPC now applies incrementally, so corps hired under
-- the old +1 rule land on the right number. Corps with no hires
-- recompute to their starting 1; nothing else has ever written this
-- column.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.hire_job_applicant(p_applicant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_tick int;
    v RECORD;
BEGIN
    SELECT * INTO v FROM _job_board_owner_check(p_applicant_id, auth.uid());
    IF v.o_reason IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', v.o_reason);
    END IF;
    IF (v.o_applicant).status <> 'applied' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_applied',
            'status', (v.o_applicant).status);
    END IF;
    IF (v.o_opening).status <> 'open' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'opening_not_open',
            'status', (v.o_opening).status);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE job_applicants SET status = 'hired'  WHERE id = p_applicant_id;
    UPDATE job_openings   SET status = 'filled' WHERE id = (v.o_opening).id;
    -- The hire brings their team: headcount grows by tier × 12
    -- (rung 1 → +12, rung 2 → +24, rung 3 → +36).
    UPDATE entrepreneur_corps
       SET employee_count = COALESCE(employee_count, 1) + (v.o_opening).rung * 12
     WHERE id = (v.o_corp).id;
    -- The role is filled: every candidate's open interview closes,
    -- not just the winner's — otherwise the losers keep orphaned
    -- chat banners on a posting that no longer exists.
    UPDATE job_interviews SET status = 'closed'
     WHERE opening_id = (v.o_opening).id AND status = 'open';

    -- A real player: stamp the employment record and their career
    -- history. Payroll (per-tick wage out of corp treasury) is the
    -- next economy step — not wired here.
    IF (v.o_applicant).applicant_faction_id IS NOT NULL THEN
        UPDATE factions
           SET biz_employer_corp_id = (v.o_corp).id,
               biz_job_title        = (v.o_opening).title,
               biz_salary_yearly    = (v.o_opening).salary_yearly,
               biz_hired_at_tick    = v_tick,
               biz_career_history   = COALESCE(biz_career_history, '[]'::jsonb)
                   || jsonb_build_array(jsonb_build_object(
                          'year',  2000 + (v_tick / 12),
                          'label', 'Hired as ' || (v.o_opening).title,
                          'sub',   (v.o_corp).name))
         WHERE id = (v.o_applicant).applicant_faction_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'hired',   (v.o_applicant).name,
        'title',   (v.o_opening).title
    );
END $$;

-- ── Backfill: recompute headcounts under the tier rule ────────────
UPDATE public.entrepreneur_corps ec
   SET employee_count = 1 + COALESCE((
       SELECT SUM(o.rung * 12)
         FROM public.job_applicants a
         JOIN public.job_openings o ON o.id = a.opening_id
        WHERE o.corp_id = ec.id
          AND a.status = 'hired'), 0);

NOTIFY pgrst, 'reload schema';

COMMIT;
