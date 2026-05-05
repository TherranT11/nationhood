-- 20260907_drop_finalize_formation_2arg_overload.sql
--
-- Phase C wrap-up. CREATE OR REPLACE FUNCTION only replaces a function
-- whose argument signature matches. The original
-- finalize_government_formation (20260309) was a 2-arg function
-- (p_formation_id, p_caller_faction_id). When 20260429 added a third
-- parameter (p_ministry_baselines JSONB DEFAULT '{}') via a fresh
-- CREATE OR REPLACE FUNCTION, PostgreSQL didn't drop the 2-arg one —
-- it created a separate overload alongside it.
--
-- Both overloads have lived in prod since. Supabase RPC resolves by
-- parameter names, so a JS call with all three params lands on the
-- 3-arg version, but anything that falls through (a missing param,
-- a future caller written without baselines, an internal SQL invocation)
-- could hit the stale 2-arg overload and skip every Phase A/B/C
-- improvement on the function.
--
-- Symptom that surfaced this: post-Phase-C diagnostic on Sangreza
-- showed pg_proc returning two rows for proname='finalize_government_formation'
-- with pronargs 2 and 3.
--
-- Drop the 2-arg overload. The 3-arg version (last rewritten by
-- 20260906_finalize_formation_atomic_ministries) is the only canonical
-- formation flow.
--
-- Idempotent (IF EXISTS).

BEGIN;

DROP FUNCTION IF EXISTS finalize_government_formation(UUID, UUID);

-- Sanity-check the post-state: exactly one overload should remain.
DO $$
DECLARE
    v_count INT;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM pg_proc
    WHERE proname = 'finalize_government_formation';

    IF v_count <> 1 THEN
        RAISE EXCEPTION
            'Expected exactly 1 finalize_government_formation overload, found %', v_count;
    END IF;
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
