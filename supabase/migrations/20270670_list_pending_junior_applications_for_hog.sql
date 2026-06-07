-- ════════════════════════════════════════════════════════════════════
-- 20270670 — list_pending_junior_applications_for_hog
--
-- Read-side companion for 20270669. The Pressing Issues feed on
-- politician-home.html needs the player-PM's pending Junior Minister
-- applications, joined with each applicant's name / party / age /
-- stats so the "Candidate Review" card can render without a second
-- round trip.
--
-- Could have been a PostgREST join on politician_junior_appointments
-- (RLS already permits SELECT for authenticated users), but:
--   1. The "is the caller the active HoG?" gate is server-side
--      logic, not row-level — collapsing it into a SECURITY DEFINER
--      RPC keeps the policy story simple.
--   2. The card needs columns from factions that aren't otherwise
--      surfaced to non-self readers (politician_capital,
--      politician_influence, etc). Going through a controlled RPC
--      lets us pick exactly the fields we expose for this surface
--      rather than relaxing the factions RLS broadly.
--
-- Mirrors the shape of list_pending_state_advocate_requests_for_
-- reviewer (20270555) — same Pressing Issues pattern, same return
-- table shape, same client-side rendering plumbing.
--
-- Returns one row per pending application; the empty result for
-- non-HoG callers is the contract (the client calls unconditionally
-- and renders nothing when the array is empty).
--
-- Apply after 20270669.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

DROP FUNCTION IF EXISTS public.list_pending_junior_applications_for_hog();

CREATE OR REPLACE FUNCTION public.list_pending_junior_applications_for_hog()
RETURNS TABLE (
    application_id        uuid,
    portfolio             text,
    submitted_tick        int,
    applicant_faction_id  uuid,
    applicant_first_name  text,
    applicant_last_name   text,
    applicant_age         int,
    applicant_party_name  text,
    applicant_skill       numeric,
    applicant_reputation  numeric,
    applicant_influence   int,
    applicant_capital     numeric
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid      uuid := auth.uid();
    v_pol      factions%ROWTYPE;
    v_nation   uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN;  -- empty result; client renders nothing
    END IF;

    -- Identify the caller's politician faction. Same lookup the
    -- decide RPC uses (20270669).
    SELECT * INTO v_pol FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1;
    IF v_pol.id IS NULL THEN
        RETURN;
    END IF;

    -- Is this politician the active HoG of any nation? The
    -- head_of_government row carries candidate_id = the politician
    -- faction id; 20270594 / 20270666 keep it always-on.
    SELECT nation_id INTO v_nation
      FROM head_of_government
     WHERE candidate_id = v_pol.id
       AND active = true
     ORDER BY appointed_tick DESC
     LIMIT 1;
    IF v_nation IS NULL THEN
        RETURN;  -- not currently the PM of any nation
    END IF;

    RETURN QUERY
    SELECT
        a.id                              AS application_id,
        a.portfolio,
        a.submitted_tick,
        a.applicant_faction_id,
        f.leader_first_name               AS applicant_first_name,
        f.leader_last_name                AS applicant_last_name,
        f.leader_age                      AS applicant_age,
        p.faction_name                    AS applicant_party_name,
        f.politician_skill,
        f.politician_reputation,
        f.politician_influence,
        f.politician_capital
      FROM politician_junior_appointments a
      JOIN factions f ON f.id = a.applicant_faction_id
      LEFT JOIN factions p ON p.id = f.politician_party_id
                          AND p.faction_type = 'party'
     WHERE a.target_nation_id = v_nation
       AND a.status           = 'pending'
     ORDER BY a.submitted_tick ASC;
END;
$$;
GRANT EXECUTE ON FUNCTION public.list_pending_junior_applications_for_hog() TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
