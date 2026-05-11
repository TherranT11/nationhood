-- ════════════════════════════════════════════════════════════════
-- nations_history — single source of truth for tracked columns
--
-- Replaces the column-by-column drift fixes (20261108 public_approval,
-- 20261115 gdp, 20261116 state_apparatus, 20261132 crime + sweep) with
-- a derivation: the canonical list of "what to snapshot per tick" is
-- the set of numeric columns on `nations`. Adding a column to nations
-- automatically propagates to nations_history on the next sync run.
--
-- Two functions ship here:
--   • nation_history_columns()  — STABLE, reads information_schema
--     and returns a TEXT[] of numeric column names from nations. Used
--     by JS (advance-tick snapshotNationHistory) as the column list,
--     and by sync_nations_history_columns() below.
--   • sync_nations_history_columns() — VOID, runs ADD COLUMN IF NOT
--     EXISTS … NUMERIC for every name returned by (1). Idempotent.
--
-- The migration then calls (2) so the current nations_history schema
-- is up to date. Going forward, callers (deploy script, manual run,
-- or — if desired later — an event trigger on DDL) re-invoke (2)
-- after schema changes to keep history in lockstep.
--
-- Opt-out: any numeric column on nations that you do NOT want to
-- track per tick should be listed in NATION_HISTORY_EXCLUDE (see
-- function body). Empty list at install — add names if/when needed.
-- ════════════════════════════════════════════════════════════════

BEGIN;

-- ── nation_history_columns() ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.nation_history_columns()
RETURNS TEXT[]
LANGUAGE sql
STABLE
SET search_path = public
AS $$
    -- Every numeric column on nations. ORDER BY ordinal_position keeps
    -- the result stable for golden tests + JS-side cache equality. We
    -- intentionally exclude non-numeric types — text fields like
    -- `name` aren't time-series data, and booleans / timestamps don't
    -- fit a NUMERIC mirror column.
    SELECT array_agg(column_name::text ORDER BY ordinal_position)
      FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name   = 'nations'
       AND data_type IN ('numeric', 'integer', 'bigint', 'smallint',
                         'double precision', 'real')
       AND column_name NOT IN (
           -- Opt-out list for numeric columns on nations that should
           -- NOT be tracked per tick. Add names here if a numeric
           -- nations column is config-only (rare). Empty by default
           -- so adding any new numeric stat propagates with zero
           -- additional edits.
           ''
       );
$$;

GRANT EXECUTE ON FUNCTION public.nation_history_columns() TO authenticated, anon, service_role;

COMMENT ON FUNCTION public.nation_history_columns() IS
    'Single source of truth for which nations columns get snapshotted into nations_history each tick. Reads information_schema, so adding a numeric column to nations automatically extends what the snapshot tracks. Called by advance-tick snapshotNationHistory and by sync_nations_history_columns(). Opt-out list lives in the function body.';

-- ── sync_nations_history_columns() ────────────────────────────────
CREATE OR REPLACE FUNCTION public.sync_nations_history_columns()
RETURNS INT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    col TEXT;
    cols TEXT[];
    added INT := 0;
BEGIN
    cols := nation_history_columns();
    FOREACH col IN ARRAY cols
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public'
               AND table_name   = 'nations_history'
               AND column_name  = col
        ) THEN
            EXECUTE format(
                'ALTER TABLE public.nations_history ADD COLUMN %I NUMERIC',
                col
            );
            added := added + 1;
            RAISE NOTICE 'Added nations_history.%', col;
        END IF;
    END LOOP;
    RETURN added;
END;
$$;

GRANT EXECUTE ON FUNCTION public.sync_nations_history_columns() TO service_role;

COMMENT ON FUNCTION public.sync_nations_history_columns() IS
    'Idempotent: ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS for every name returned by nation_history_columns(). Returns the count added. Run after any ALTER TABLE nations ADD COLUMN to keep history schema in lockstep — or invoke from a deploy hook / event trigger.';

-- ── Run sync once so current schema is aligned ────────────────────
SELECT public.sync_nations_history_columns();

COMMIT;

NOTIFY pgrst, 'reload schema';
