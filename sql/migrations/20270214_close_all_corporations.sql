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
--
-- FK cycles (e.g. a "contracts" table's winning_bid_id → its bids, while
-- the bids' contract_id → contracts) would otherwise recurse forever.
-- p_path carries the ancestor table OIDs on the current recursion stack;
-- when a child is an ancestor (a real cycle, not a diamond), we break it
-- by NULLing the nullable back-edge FK for the in-scope rows — those rows
-- are being deleted anyway — instead of recursing. A non-nullable cyclic
-- FK can't be auto-broken and raises a clear error.
CREATE OR REPLACE FUNCTION _cull_cascade(p_table regclass, p_where text, p_path oid[] DEFAULT '{}')
RETURNS void
LANGUAGE plpgsql
AS $fn$
DECLARE
    r record;
BEGIN
    IF array_length(p_path, 1) > 60 THEN
        RAISE EXCEPTION 'cull cascade exceeded depth 60 at %', p_table;
    END IF;

    FOR r IN
        SELECT con.conrelid             AS child_oid,
               con.conrelid::regclass   AS child_tbl,
               ac.attname               AS child_col,
               ap.attname               AS parent_col,
               ac.attnotnull            AS child_col_notnull
          FROM pg_constraint con
          JOIN pg_attribute ac ON ac.attrelid = con.conrelid  AND ac.attnum = con.conkey[1]
          JOIN pg_attribute ap ON ap.attrelid = con.confrelid AND ap.attnum = con.confkey[1]
         WHERE con.contype = 'f'
           AND con.confrelid = p_table
           AND con.confdeltype IN ('a', 'r', 'c')   -- block/cascade; skip set-null/default
           AND array_length(con.conkey, 1) = 1
    LOOP
        IF r.child_oid = ANY(p_path) THEN
            -- Cycle: child is an ancestor on this path. Break the back-edge
            -- by NULLing the in-scope rows' FK rather than recursing.
            IF r.child_col_notnull THEN
                RAISE EXCEPTION 'cull: non-nullable FK cycle at %.% — cannot auto-break', r.child_tbl, r.child_col;
            END IF;
            EXECUTE format('UPDATE %s SET %I = NULL WHERE %I IN (SELECT %I FROM %s WHERE %s)',
                           r.child_tbl::text, r.child_col, r.child_col, r.parent_col, p_table::text, p_where);
            CONTINUE;
        END IF;

        PERFORM _cull_cascade(
            r.child_tbl,
            format('%I IN (SELECT %I FROM %s WHERE %s)',
                   r.child_col, r.parent_col, p_table::text, p_where),
            p_path || p_table::oid
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

    -- (1b) Pre-delete corp-tied loan negotiations. They cascade off factions
    --      anyway, but must go BEFORE their bank_loans: deleting a bank_loan
    --      fires SET NULL on loan_negotiations.fired_to_loan_id, which the
    --      loan_negotiations_fired_has_loan CHECK (status='fired' ⇔ loan set)
    --      rejects. (loan_negotiations is the only set-null/CHECK coupling.)
    DELETE FROM loan_negotiations
     WHERE borrower_faction_id IN (SELECT id FROM factions WHERE faction_type = 'corporation')
        OR lender_faction_id   IN (SELECT id FROM factions WHERE faction_type = 'corporation');

    -- (2) Cascade-delete every corporation faction + all blocking dependents.
    PERFORM _cull_cascade('factions'::regclass, 'faction_type = ''corporation''');

    RAISE NOTICE 'Closed % corporation faction(s) and deleted all strategic alliances.', v_n;
END $do$;

DROP FUNCTION _cull_cascade(regclass, text, oid[]);

COMMIT;

-- ── ROLLBACK ── (data deletion is irreversible; this only drops the helper)
-- DROP FUNCTION IF EXISTS _cull_cascade(regclass, text, oid[]);
