-- ════════════════════════════════════════════════════════════════════
-- ADMIN / MODERATION: RELEASE Alejandro Aguilar (entrepreneur)
-- ════════════════════════════════════════════════════════════════════
-- Counterpart to 20270412_arrest_entrepreneurs.sql. Flips Aguilar's
-- entrepreneur faction status from 'arrested' back to 'active', which
-- simultaneously:
--   • Releases him from "jail" (no more
--     ENTREPRENEUR_ARRESTED exceptions from
--     block_arrested_entrepreneur_action).
--   • Unfreezes his assets — block_arrested_entrepreneur_funds stops
--     blocking party_funds movement once status is no longer 'arrested'.
-- The arrest machinery (triggers, status column) is intentionally
-- left in place so the same lock can be reapplied later without
-- re-running the schema work.
--
-- Scoping:
--   • faction_type = 'entrepreneur' so we don't touch any political
--     party / military / politician faction this user may also own
--     (different rows, different faction_type — see the arrest
--     migration's SCOPING note).
--   • Accent-tolerant match on the name pair via ILIKE.
--   • Status guard means re-running the script after the release is
--     a no-op.
-- Idempotent. Transactional.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

DO $$
DECLARE
    v_count int;
    r       record;
BEGIN
    UPDATE public.factions
       SET status = 'active'
     WHERE faction_type = 'entrepreneur'
       AND status       = 'arrested'
       AND leader_first_name ILIKE 'Alejandro'
       AND leader_last_name  ILIKE 'Aguilar';
    GET DIAGNOSTICS v_count = ROW_COUNT;

    RAISE NOTICE 'Released % entrepreneur faction(s) from arrest:', v_count;
    FOR r IN
        SELECT id, leader_first_name, leader_last_name, faction_name, status
          FROM public.factions
         WHERE faction_type = 'entrepreneur'
           AND leader_first_name ILIKE 'Alejandro'
           AND leader_last_name  ILIKE 'Aguilar'
    LOOP
        RAISE NOTICE '  • % % (%) — id=% · status=%',
            r.leader_first_name, r.leader_last_name, r.faction_name, r.id, r.status;
    END LOOP;

    IF v_count = 0 THEN
        RAISE WARNING
            'No matching arrested entrepreneur found. Aguilar may already be active, or the name may not match. Review the rows above before assuming the release went through.';
    ELSIF v_count > 1 THEN
        RAISE WARNING
            'Released % entrepreneurs matching "Alejandro Aguilar." Expected 1. Verify each id above is intended.',
            v_count;
    END IF;
END $$;

COMMIT;
