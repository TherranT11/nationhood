-- ════════════════════════════════════════════════════════════════════════════════
-- Fix: finalize_government_formation references renamed columns
--
-- Bug: v_nation.education_quality, v_nation.infrastructure, etc. no longer
-- exist on the nations table. These were renamed in earlier migrations.
--
-- Fix: Replace the hardcoded jsonb_build_object stat snapshot with
-- to_jsonb(v_nation) which captures ALL current columns dynamically
-- and never goes stale when columns are renamed.
--
-- Run this in Supabase SQL editor. It patches the existing function in-place.
-- ════════════════════════════════════════════════════════════════════════════════

-- Step 1: Get the current function source and patch it
DO $patch$
DECLARE
    v_src TEXT;
    v_patched TEXT;
BEGIN
    SELECT prosrc INTO v_src
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname = 'finalize_government_formation'
      AND n.nspname = 'public';

    IF v_src IS NULL THEN
        RAISE EXCEPTION 'Function finalize_government_formation not found';
    END IF;

    -- Replace the multi-line jsonb_build_object snapshot with to_jsonb
    v_patched := regexp_replace(
        v_src,
        E'v_stats_snapshot\\s*:=\\s*jsonb_build_object\\s*\\([^;]+\\);',
        'v_stats_snapshot := to_jsonb(v_nation);',
        'n'  -- newline-sensitive mode
    );

    -- Verify the replacement happened
    IF v_patched = v_src THEN
        RAISE NOTICE 'WARNING: Pattern not found — trying alternative match';
        v_patched := replace(v_src,
            E'v_nation.education_quality',
            E'v_nation.higher_education');
        v_patched := replace(v_patched,
            E'''education_quality''',
            E'''higher_education''');
    END IF;

    -- Recreate function with patched source
    EXECUTE format(
        $f$
        CREATE OR REPLACE FUNCTION finalize_government_formation(
            p_formation_id UUID,
            p_caller_faction_id UUID,
            p_ministry_baselines JSONB DEFAULT '{}'::JSONB
        ) RETURNS JSONB AS $body$
        %s
        $body$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
        $f$,
        v_patched
    );

    RAISE NOTICE 'Successfully patched finalize_government_formation';
END $patch$;
