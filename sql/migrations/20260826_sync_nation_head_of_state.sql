-- 20260826_sync_nation_head_of_state.sql
--
-- Fix B: nations.head_of_state_first_name / head_of_state_last_name /
-- head_of_state_age stay in sync with the active row in `presidents`.
--
-- Avelia's "Fabrizio Orellana" symptom: the seed-time caretaker name
-- on the nations row was never overwritten when actual presidents
-- took office. The UI reads from the nations row, so the dashboard
-- displayed the stale caretaker for ~50 ticks while the underlying
-- presidents table had the correct active row.
--
-- This file ships the single mirror primitive. JS callers at the
-- four `presidents` mutation sites (inauguratePresident, two
-- foundational-bill paths, impeachment) call this RPC after their
-- write. Backfill at the bottom syncs every nation in the database.
--
-- Per design philosophy (no triggers without asking): explicit RPC
-- calls, not a row-level trigger. Single source of mirror logic
-- here means future president-mutation paths only need to call this
-- once each — no logic duplication at the call site.
--
-- Idempotent. Safe to re-run.

BEGIN;

CREATE OR REPLACE FUNCTION sync_nation_head_of_state(p_nation_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_active RECORD;
BEGIN
    SELECT first_name, last_name, age
      INTO v_active
      FROM presidents
     WHERE nation_id = p_nation_id
       AND is_active = true
     LIMIT 1;

    IF FOUND THEN
        -- Active president exists — mirror the name + age onto the
        -- nation row.
        UPDATE nations
           SET head_of_state_first_name = v_active.first_name,
               head_of_state_last_name  = v_active.last_name,
               head_of_state_age        = v_active.age
         WHERE id = p_nation_id;
    ELSE
        -- No active president. Only null out the cache if the
        -- nation has actually held a presidential election at some
        -- point (i.e., there's any row in presidents for it). This
        -- protects caretaker-only nations whose head_of_state_* was
        -- populated at seed and intentionally has no presidents row.
        IF EXISTS (SELECT 1 FROM presidents WHERE nation_id = p_nation_id) THEN
            UPDATE nations
               SET head_of_state_first_name = NULL,
                   head_of_state_last_name  = NULL,
                   head_of_state_age        = NULL
             WHERE id = p_nation_id;
        END IF;
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION sync_nation_head_of_state(UUID) TO authenticated, service_role;

-- One-time backfill: sync every nation that has ever held a
-- presidential election. Caretaker-only nations are skipped by the
-- IF EXISTS guard inside the function.
SELECT sync_nation_head_of_state(id)
  FROM nations
 WHERE EXISTS (SELECT 1 FROM presidents WHERE presidents.nation_id = nations.id);

COMMIT;

NOTIFY pgrst, 'reload schema';
