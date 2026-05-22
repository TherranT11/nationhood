-- ════════════════════════════════════════════════════════════════════
-- ONE-TIME: Close (hard-delete) all legacy corporation factions
-- ════════════════════════════════════════════════════════════════════
-- Retires the legacy corporation system. Removes every faction_type =
-- 'corporation' row entirely ("clean removal" — NO game-wide economic
-- unwind: no loan paybacks, no GDP penalties, no mutual-aid cascade).
--
-- ⚠ DESTRUCTIVE & IRREVERSIBLE. Operates on shared shard state. APPLY TO
--   A BACKUP / STAGING COPY FIRST to confirm it completes, then run on
--   live. The whole thing is ONE transaction — if any unhandled foreign
--   key blocks the final delete, the entire migration rolls back with
--   zero partial damage (and the error names the table to handle next).
--
-- Approach:
--   1. Delete ALL strategic alliances (per directive — every alliance,
--      not just corp-founded). alliance_id dependents (interest votes,
--      ballots, members) are ON DELETE CASCADE, so they cascade away;
--      this also clears strategic_alliances.founder_faction_id (RESTRICT)
--      for every faction at once.
--   2. Clear every BLOCKING (RESTRICT / NO ACTION) FK reference to the
--      corp factions, table-agnostically via the catalog (pg_constraint).
--      This covers the legacy finance web (bank_loans, finance_active_loans,
--      bank_loan_offers, equity_offers, equity_positions),
--      shipping_contract_bids, and anything else that hard-references a
--      faction — without hand-listing tables. CASCADE / SET NULL FKs are
--      left to resolve themselves on the final delete.
--   3. DELETE the corporation factions.
--
-- Residual risk (fails SAFELY/atomically if hit): a transitive RESTRICT FK
-- pointing at one of the blocking-FK tables (not at factions directly).
-- The pass loop re-runs to absorb multi-level faction-FK ordering; a
-- non-faction transitive block would surface as a clean rollback.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

DO $$
DECLARE
    v_ids        uuid[];
    v_n          int;
    r            record;
    v_pass       int := 0;
    v_deleted    bigint;
    v_pass_total bigint;
BEGIN
    SELECT array_agg(id) INTO v_ids FROM factions WHERE faction_type = 'corporation';
    v_n := COALESCE(array_length(v_ids, 1), 0);
    IF v_n = 0 THEN
        RAISE NOTICE 'No corporation factions to close.';
        RETURN;
    END IF;

    -- (1) Delete ALL strategic alliances (dependents cascade on alliance_id).
    DELETE FROM strategic_alliances;

    -- (2) Clear every blocking (RESTRICT / NO ACTION) FK ref to the corps.
    LOOP
        v_pass := v_pass + 1;
        v_pass_total := 0;
        FOR r IN
            SELECT con.conrelid::regclass::text AS tbl, att.attname AS col
              FROM pg_constraint con
              JOIN pg_attribute att
                ON att.attrelid = con.conrelid AND att.attnum = con.conkey[1]
             WHERE con.contype = 'f'
               AND con.confrelid = 'public.factions'::regclass
               AND con.confdeltype IN ('a', 'r')        -- no action / restrict
               AND array_length(con.conkey, 1) = 1
        LOOP
            EXECUTE format('DELETE FROM %s WHERE %I = ANY($1)', r.tbl, r.col) USING v_ids;
            GET DIAGNOSTICS v_deleted = ROW_COUNT;
            v_pass_total := v_pass_total + v_deleted;
        END LOOP;
        EXIT WHEN v_pass_total = 0 OR v_pass >= 25;
    END LOOP;

    IF v_pass >= 25 THEN
        RAISE EXCEPTION 'Blocking-FK cleanup did not converge in 25 passes — aborting (transaction rolled back).';
    END IF;

    -- (3) Delete the corporation factions; CASCADE / SET NULL FKs resolve.
    DELETE FROM factions WHERE id = ANY(v_ids);

    RAISE NOTICE 'Closed % corporation faction(s) and deleted all strategic alliances.', v_n;
END $$;

COMMIT;
