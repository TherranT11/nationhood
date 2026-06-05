-- ════════════════════════════════════════════════════════════════════
-- 20270629 — Politician term expiry: clear orphaned local roles
--
-- User flagged a Community Organizer card showing "TERM ENDS January,
-- 2001 · 0 TICKS REMAINING" while the in-game date sat at 2012.
-- Diagnosis: the politician has politician_office = 'community_
-- organizer' but politician_office_won_at_tick IS NULL — the office
-- was set somewhere along the line without a tick stamp. The client
-- coerces NULL to 0 in tickToDate math, producing the fake "Jan 2001"
-- (tick 0 + 12 = tick 12). The 20270625 expiry RPC's WHERE clause
-- includes `politician_office_won_at_tick IS NOT NULL` so the row
-- never matches and the role hangs forever.
--
-- Fix:
--   1. Re-issue politician_resolve_expired_terms with the WHERE
--      relaxed so NULL won-at-tick local roles ALSO expire. Without
--      a tick anchor we can't compute a term length, so we treat
--      orphaned local roles as immediately expired (the term either
--      ran out long ago or was never properly seated). Career event
--      still logs as term_ended.
--
--   2. Backfill at the tail of this migration: clear politician_
--      office + politician_office_won_at_tick on every politician
--      whose office is a local tier AND won-at-tick is NULL. Logs
--      term_ended career events the same shape as the on-demand
--      RPC. Idempotent — re-running finds no orphans.
--
-- MP / Senior MP roles unchanged. Those reseat on the nation's
-- next_election_tick (general-election cycle), not a per-politician
-- term, so the won-at-tick stamp isn't required for them to
-- eventually clear.
--
-- Body otherwise byte-identical to 20270625 except the WHERE
-- predicate and the comment block.
--
-- Apply after 20270628.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.politician_resolve_expired_terms()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid           uuid := auth.uid();
    v_tick          int;
    v_pol           RECORD;
    v_office_label  text;
    v_expired_count int := 0;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    FOR v_pol IN
        SELECT id, politician_office, politician_office_won_at_tick
          FROM factions
         WHERE (id = v_uid OR linked_user_id = v_uid)
           AND faction_type = 'politician'
           AND abandoned_at IS NULL
           AND politician_office IN ('community_organizer', 'city_council_member')
           -- Two expiry paths:
           --   (a) stamped won-at + 12 ticks have passed (the normal
           --       end-of-term case).
           --   (b) office set but won-at-tick NULL (orphaned — no
           --       anchor, so the term either ran out long ago or was
           --       never properly seated). Same teardown either way.
           AND (
               politician_office_won_at_tick IS NULL
               OR v_tick >= politician_office_won_at_tick + 12
           )
         FOR UPDATE
    LOOP
        v_office_label := CASE v_pol.politician_office
            WHEN 'community_organizer' THEN 'Community Organizer'
            WHEN 'city_council_member' THEN 'City Council Member'
            ELSE initcap(replace(v_pol.politician_office, '_', ' '))
        END;

        UPDATE factions
           SET politician_office             = NULL,
               politician_office_won_at_tick = NULL
         WHERE id = v_pol.id;

        INSERT INTO politician_career_events (faction_id, event_tick, event_type, target_name)
        VALUES (v_pol.id, v_tick, 'term_ended', v_office_label);

        v_expired_count := v_expired_count + 1;
    END LOOP;

    RETURN jsonb_build_object(
        'success',       true,
        'tick',          v_tick,
        'expired_count', v_expired_count
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.politician_resolve_expired_terms() TO authenticated;

-- ── Backfill: clear every orphaned local role across the DB ───────
-- Runs once at apply time. Same teardown shape as the on-demand RPC,
-- but unscoped to a single caller — sweeps every politician sitting
-- on a NULL-tick local office. v_tick stamped from the live shard so
-- the career event lands at the current in-game date.
DO $$
DECLARE
    v_tick          int;
    v_pol           RECORD;
    v_office_label  text;
BEGIN
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    FOR v_pol IN
        SELECT id, politician_office
          FROM factions
         WHERE faction_type = 'politician'
           AND abandoned_at IS NULL
           AND politician_office IN ('community_organizer', 'city_council_member')
           AND politician_office_won_at_tick IS NULL
         FOR UPDATE
    LOOP
        v_office_label := CASE v_pol.politician_office
            WHEN 'community_organizer' THEN 'Community Organizer'
            WHEN 'city_council_member' THEN 'City Council Member'
            ELSE initcap(replace(v_pol.politician_office, '_', ' '))
        END;

        UPDATE factions
           SET politician_office             = NULL,
               politician_office_won_at_tick = NULL
         WHERE id = v_pol.id;

        INSERT INTO politician_career_events (faction_id, event_tick, event_type, target_name)
        VALUES (v_pol.id, v_tick, 'term_ended', v_office_label);
    END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
