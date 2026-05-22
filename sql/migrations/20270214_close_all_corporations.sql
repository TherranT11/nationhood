-- ════════════════════════════════════════════════════════════════════
-- ONE-TIME: Close (hard-delete) all legacy corporation factions
-- ════════════════════════════════════════════════════════════════════
-- Retires the legacy corporation system. Removes every faction_type =
-- 'corporation' row entirely ("clean removal" — NO game-wide economic
-- unwind: no loan paybacks, no GDP penalties, no mutual-aid cascade).
-- Also deletes ALL strategic alliances (per directive).
--
-- ⚠ DESTRUCTIVE & IRREVERSIBLE on shared shard state. ONE transaction —
--   any failure rolls the whole thing back with zero partial damage.
--   APPLY TO A BACKUP / STAGING COPY FIRST.
--
-- Mechanism: a generic recursive cascade (_cull_cascade) walks the FK
-- graph from the corp factions and deletes every BLOCKING dependent
-- (ON DELETE NO ACTION / RESTRICT / CASCADE — confdeltype a/r/c) child-
-- first, to arbitrary depth. It deliberately does NOT descend SET NULL /
-- SET DEFAULT FKs ('n'/'d') — the DB nulls/defaults those on the final
-- delete (no over-deletion). This replaces the earlier hand-listed
-- approach, which broke on transitive chains like
-- corp_production_runs → corp_aircraft_designs → factions.
--
-- Scope safety: only rows that (transitively) reference a DELETED
-- corporation faction are removed. Entrepreneur factions, entrepreneur_corps
-- and their data reference entrepreneur factions, not corporation ones, so
-- they are untouched. The helper is created and DROPped inside this tx.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- Recursive blocking-FK cascade: delete every row matching p_where in
-- p_table, after first deleting all rows that block it via a/r/c FKs.
CREATE OR REPLACE FUNCTION _cull_cascade(p_table regclass, p_where text, p_depth int DEFAULT 0)
RETURNS void
LANGUAGE plpgsql
AS $fn$
DECLARE
    r record;
BEGIN
    IF p_depth > 50 THEN
        RAISE EXCEPTION 'cull cascade exceeded depth 50 (FK cycle?) at %', p_table;
    END IF;

    FOR r IN
        SELECT con.conrelid::regclass AS child_tbl,
               ac.attname             AS child_col,
               ap.attname             AS parent_col
          FROM pg_constraint con
          JOIN pg_attribute ac ON ac.attrelid = con.conrelid  AND ac.attnum = con.conkey[1]
          JOIN pg_attribute ap ON ap.attrelid = con.confrelid AND ap.attnum = con.confkey[1]
         WHERE con.contype = 'f'
           AND con.confrelid = p_table
           AND con.confdeltype IN ('a', 'r', 'c')   -- block/cascade; skip set-null/default
           AND array_length(con.conkey, 1) = 1
    LOOP
        PERFORM _cull_cascade(
            r.child_tbl,
            format('%I IN (SELECT %I FROM %s WHERE %s)',
                   r.child_col, r.parent_col, p_table::text, p_where),
            p_depth + 1
        );
    END LOOP;

    EXECUTE format('DELETE FROM %s WHERE %s', p_table::text, p_where);
END;
$fn$;

DO $do$
DECLARE
    v_n int;
BEGIN
    SELECT count(*) INTO v_n FROM factions WHERE faction_type = 'corporation';
    IF v_n = 0 THEN
        RAISE NOTICE 'No corporation factions to close.';
        RETURN;
    END IF;

    -- (1) Delete ALL strategic alliances (per directive). alliance_id
    --     dependents are ON DELETE CASCADE, so votes/ballots/members go too.
    DELETE FROM strategic_alliances;

    -- (2) Cascade-delete every corporation faction + all blocking dependents.
    PERFORM _cull_cascade('factions'::regclass, 'faction_type = ''corporation''');

    RAISE NOTICE 'Closed % corporation faction(s) and deleted all strategic alliances.', v_n;
END $do$;

DROP FUNCTION _cull_cascade(regclass, text, int);

COMMIT;

-- ── ROLLBACK ── (data deletion is irreversible; this only drops the helper)
-- DROP FUNCTION IF EXISTS _cull_cascade(regclass, text, int);
