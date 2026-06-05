-- ════════════════════════════════════════════════════════════════════
-- 20270633 — Civil Servant: Apply for Promotion → Senior Civil Servant
--
-- Adds the Tier 2 Senior Civil Servant promotion path. A Civil Servant
-- (politician_ministry set) with politician_reputation ≥ 10 can
-- promote themselves at any tick by calling politician_apply_for_
-- promotion(). The promotion stamps politician_senior_civil_servant_
-- at_tick on the faction so the role card flips to the Tier 2 variant
-- on next page load.
--
-- "At any time" per the user's spec — this action is NOT gated by
-- next_civil_service_action_tick (the per-tick FILE A MEMO / FILE
-- PAPERWORK lock from 20270632). A civil servant can submit a
-- promotion application alongside their usual once-per-tick action,
-- or in isolation.
--
-- Gates:
--   • caller has politician_ministry (i.e. is a civil servant)
--   • politician_senior_civil_servant_at_tick IS NULL (not already
--     promoted — bumps are one-way for this commit; demotion lives
--     wherever future role-management surfaces land)
--   • politician_reputation ≥ 10
--
-- On promotion, logs a career event ('promoted_senior_civil_servant')
-- so the politician-career timeline reflects the milestone.
--
-- Apply after 20270632.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Schema ─────────────────────────────────────────────────────
ALTER TABLE public.factions
    ADD COLUMN IF NOT EXISTS politician_senior_civil_servant_at_tick int;

COMMENT ON COLUMN public.factions.politician_senior_civil_servant_at_tick IS
    'Tick at which the politician was promoted from Civil Servant (Tier 1) to Senior Civil Servant / Section Head (Tier 2). NULL = not promoted. Set by politician_apply_for_promotion (20270633) when politician_reputation ≥ 20.';

REVOKE UPDATE (politician_senior_civil_servant_at_tick) ON public.factions
    FROM PUBLIC, anon, authenticated;

-- ── 2. politician_apply_for_promotion ─────────────────────────────
-- Threshold (10 Reputation) inlined per the user''s spec. If we ever
-- expose other promotion tiers / cross-rung thresholds, lift this
-- into a SQL helper.
CREATE OR REPLACE FUNCTION public.politician_apply_for_promotion()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid    uuid := auth.uid();
    v_pol    factions%ROWTYPE;
    v_tick   int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
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
    IF COALESCE(v_pol.politician_reputation, 0) < 10 THEN
        RETURN jsonb_build_object(
            'success',         false,
            'reason',          'insufficient_reputation',
            'have',            COALESCE(v_pol.politician_reputation, 0),
            'need',            10
        );
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE factions
       SET politician_senior_civil_servant_at_tick = v_tick
     WHERE id = v_pol.id;

    -- target_name is the human-readable label that lands on the career
    -- timeline. event_type stays 'promoted_senior_civil_servant' as
    -- the stable analytics key (the rename to "Agency Head" was a
    -- display swap only — schema and event-type strings keep their
    -- original names so historical greps still work).
    INSERT INTO politician_career_events
        (faction_id, event_tick, event_type, target_name)
    VALUES
        (v_pol.id, v_tick, 'promoted_senior_civil_servant', 'Agency Head');

    RETURN jsonb_build_object(
        'success',       true,
        'action',        'apply_for_promotion',
        'promoted_at',   v_tick,
        'reputation',    v_pol.politician_reputation
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.politician_apply_for_promotion() TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
