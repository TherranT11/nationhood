-- 20260935_ap_deprecation_phase_a.sql
--
-- Phase A of the AP system removal.
--
-- Strategy: leave the schema in place but make every AP operation
-- a no-op that returns a success shape. The game stops costing AP
-- without any callsite needing to change. Phase B will strip the
-- UI; Phase C drops the column, the table, and these functions.
--
-- Backwards-compat shape so coupled callers stay green:
--   deduct_ap   → returns 999999 (caller checks `< 0` for failure)
--   accumulate_ap → returns 0 (caller checks `= -1` for "not found")
-- Two RPCs internally call deduct_ap and branch on `< 0`:
--   publish_platform               (20260413_faction_platforms.sql)
--   record_platform_sector_pop...  (20260727_platform_sector_popularity.sql)
-- Both keep working untouched: a positive return value means "AP
-- check passed", and the action proceeds without any actual deduct.
--
-- IDEMPOTENT — CREATE OR REPLACE FUNCTION on both. Re-runnable safely.

BEGIN;

CREATE OR REPLACE FUNCTION deduct_ap(
    p_faction_id UUID,
    p_cost INT
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- AP DEPRECATED (Phase A). Always return a positive value so any
    -- caller that branches on `result < 0` takes the success path.
    RETURN 999999;
END;
$$;

CREATE OR REPLACE FUNCTION accumulate_ap(
    p_faction_id UUID,
    p_gain INT,
    p_max_ap INT DEFAULT 10
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- AP DEPRECATED (Phase A). Always return 0 (a non-failure value).
    -- The legacy `-1 = "faction not found"` sentinel is no longer
    -- emitted; callers that previously checked for it still take the
    -- success path on 0.
    RETURN 0;
END;
$$;

GRANT EXECUTE ON FUNCTION deduct_ap(UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION deduct_ap(UUID, INT) TO service_role;
GRANT EXECUTE ON FUNCTION accumulate_ap(UUID, INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION accumulate_ap(UUID, INT, INT) TO service_role;

COMMENT ON FUNCTION deduct_ap(UUID, INT) IS
    'DEPRECATED (Phase A of AP removal). No-op stub that always succeeds. Slated for DROP in Phase C.';
COMMENT ON FUNCTION accumulate_ap(UUID, INT, INT) IS
    'DEPRECATED (Phase A of AP removal). No-op stub that always succeeds. Slated for DROP in Phase C.';

NOTIFY pgrst, 'reload schema';

COMMIT;
