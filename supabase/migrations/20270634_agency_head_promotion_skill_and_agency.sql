-- ════════════════════════════════════════════════════════════════════
-- 20270634 — Agency Head promotion: 10 Skill + agency assignment
--
-- Refines the promotion mechanic from 20270633 along two axes per the
-- user's clarification:
--
--   1. Threshold flips Reputation → Skill. Civil servants now need
--      politician_skill ≥ 10 to apply. (politician_skill has been
--      numeric since 20270461, so the 0.3 increments from FILE
--      PAPERWORK accumulate correctly to a 10.0 target.)
--
--   2. Promotion is to a SPECIFIC agency within the caller's
--      ministry, not a generic "senior civil servant" label. The
--      agency choice is the player's, but constrained to the 5
--      agencies that ministry has in the paperwork taxonomy (the
--      SoT for ministry × agency pairs lives in
--      js/paperwork-taxonomy.js + the _paperwork_valid_ministry_
--      agency SQL helper from 20270627).
--
-- Schema:
--   factions.politician_agency_head_of text — agency key (e.g.
--   'bilateral_relations', 'industrial_concessions'). NULL until
--   promotion; set in lockstep with politician_senior_civil_servant_
--   at_tick.
--
-- The RPC's signature changes (was arg-less, now takes
-- p_agency_key), so DROP FUNCTION precedes CREATE FUNCTION rather
-- than CREATE OR REPLACE.
--
-- Defense civil servants caveat: politician_ministry='defense' has
-- no entry in the paperwork taxonomy (the paperwork side uses
-- 'security' for that domain). A defense civil servant calling
-- apply_for_promotion with any agency key will trip the invalid_
-- routing check. Aligning the two slug sets — or mapping
-- defense → security at the helper layer — is its own follow-up.
--
-- Apply after 20270633.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Schema ─────────────────────────────────────────────────────
ALTER TABLE public.factions
    ADD COLUMN IF NOT EXISTS politician_agency_head_of text;

COMMENT ON COLUMN public.factions.politician_agency_head_of IS
    'Agency key the politician was assigned to head on promotion to Agency Head (Tier 2 civil service). NULL until promotion. Set in lockstep with politician_senior_civil_servant_at_tick by politician_apply_for_promotion (20270634). Valid (ministry, agency) pairs enforced via _paperwork_valid_ministry_agency.';

REVOKE UPDATE (politician_agency_head_of) ON public.factions
    FROM PUBLIC, anon, authenticated;

-- ── 2. politician_apply_for_promotion(p_agency_key) ───────────────
-- Signature change from 20270633 (arg-less → one text param), so
-- DROP precedes CREATE.
DROP FUNCTION IF EXISTS public.politician_apply_for_promotion();

CREATE OR REPLACE FUNCTION public.politician_apply_for_promotion(
    p_agency_key text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_pol     factions%ROWTYPE;
    v_tick    int;
    v_agency  text := NULLIF(btrim(p_agency_key), '');
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF v_agency IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_agency');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.politician_ministry IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_civil_servant');
    END IF;
    IF v_pol.politician_senior_civil_servant_at_tick IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_senior');
    END IF;

    -- 10 Skill threshold (numeric — the 0.3 deltas from FILE
    -- PAPERWORK accumulate cleanly here).
    IF COALESCE(v_pol.politician_skill, 0) < 10 THEN
        RETURN jsonb_build_object(
            'success', false,
            'reason',  'insufficient_skill',
            'have',    COALESCE(v_pol.politician_skill, 0),
            'need',    10
        );
    END IF;

    -- Agency must be in the caller's ministry. _paperwork_valid_
    -- ministry_agency (20270627) is the SoT taxonomy guard.
    IF NOT public._paperwork_valid_ministry_agency(v_pol.politician_ministry, v_agency) THEN
        RETURN jsonb_build_object(
            'success',  false,
            'reason',   'invalid_agency',
            'ministry', v_pol.politician_ministry,
            'agency',   v_agency
        );
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE factions
       SET politician_senior_civil_servant_at_tick = v_tick,
           politician_agency_head_of               = v_agency
     WHERE id = v_pol.id;

    -- target_name lifts the agency label for the career timeline.
    -- event_type stays 'promoted_senior_civil_servant' as the stable
    -- analytics key (display swap to "Agency Head" was label-only).
    INSERT INTO politician_career_events
        (faction_id, event_tick, event_type, target_name)
    VALUES
        (v_pol.id, v_tick, 'promoted_senior_civil_servant',
         'Agency Head · ' || v_agency);

    RETURN jsonb_build_object(
        'success',     true,
        'action',      'apply_for_promotion',
        'promoted_at', v_tick,
        'agency',      v_agency,
        'skill',       v_pol.politician_skill
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.politician_apply_for_promotion(text) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
