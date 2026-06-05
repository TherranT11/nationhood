-- Clear stale minister-confirmation state when a new government forms.
--
-- Bug report: after an election seats a new PM, nominating ministers
-- via `nominateMinister` (js/game/presidential.js) throws "A
-- confirmation vote is already pending for this ministry" for any
-- ministry that the OLD administration had a pending nomination on.
-- Root cause: finalize_government_formation (20261120) does not
-- dissolve in-flight minister_confirmation bills or clear
-- ministries.confirmation_status / pending_minister when a new
-- formation transitions to 'formed'. For semi-presidential nations
-- it skips the ministry-table cleanup entirely (IF NOT v_is_semi_pres
-- blocks), so semi-pres systems are doubly exposed.
--
-- Avoiding a 380-line function rewrite. Instead, install a small
-- AFTER UPDATE trigger on government_formations that fires when the
-- row transitions to 'formed' and cleans up the stale state. Plus a
-- one-shot UPDATE at the bottom to unblock nations that are stuck
-- right now.
--
-- Bill cleanup: any floor-status minister_confirmation bill in the
-- nation flips to 'failed' with passed_tick = current tick (mirrors
-- the pattern enactFoundationalBill uses on PM transition,
-- advance-tick line ~9233, and the MLA hook at ~28962).
--
-- Ministry cleanup: confirmation_status NULL, pending_minister NULL
-- on every active ministry in the nation. The seated minister fields
-- (minister_first_name etc.) are left untouched — under
-- semi-presidential continuity rules the existing minister stays in
-- the seat until the new PM moves them; under parliamentary the
-- IF NOT v_is_semi_pres block in finalize_government_formation
-- already nulls those fields.

BEGIN;

CREATE OR REPLACE FUNCTION public._clear_stale_minister_noms()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_tick int;
BEGIN
    IF NEW.status = 'formed' AND (OLD.status IS NULL OR OLD.status <> 'formed') THEN
        SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;

        UPDATE bills
           SET status = 'failed',
               passed_tick = COALESCE(v_tick, 0)
         WHERE nation_id = NEW.nation_id
           AND bill_type = 'minister_confirmation'
           AND status IN ('committee', 'floor');

        UPDATE ministries
           SET confirmation_status = NULL,
               pending_minister    = NULL
         WHERE nation_id = NEW.nation_id
           AND confirmation_status = 'pending';
    END IF;
    RETURN NEW;
END $$;

COMMENT ON FUNCTION public._clear_stale_minister_noms() IS
    'AFTER UPDATE trigger handler on government_formations. When a row transitions to status=formed, dissolves any floor/committee-status minister_confirmation bills for the nation and clears confirmation_status + pending_minister on every ministry — so a new PM is not blocked by the previous administration''s pending nominations. Defense-in-depth for the gap that finalize_government_formation (20261120) does not address, especially for semi-presidential nations where the function skips ministry cleanup entirely.';

DROP TRIGGER IF EXISTS trg_clear_stale_minister_noms ON public.government_formations;
CREATE TRIGGER trg_clear_stale_minister_noms
    AFTER UPDATE ON public.government_formations
    FOR EACH ROW EXECUTE FUNCTION public._clear_stale_minister_noms();

-- ── One-shot cleanup of currently-stuck state ────────────────────────
-- Any nation whose current administration started AFTER a still-floor
-- minister_confirmation bill was proposed has a stale bill blocking new
-- nominations. Same logic as the trigger but applied retroactively.
WITH current_admin AS (
    SELECT nation_id, MAX(started_at_tick) AS started_tick
      FROM administrations
     WHERE ended_at_tick IS NULL
     GROUP BY nation_id
), stale_nations AS (
    SELECT DISTINCT b.nation_id
      FROM bills b
      JOIN current_admin ca ON ca.nation_id = b.nation_id
     WHERE b.bill_type = 'minister_confirmation'
       AND b.status IN ('committee', 'floor')
       AND b.proposed_tick < ca.started_tick
)
UPDATE bills
   SET status = 'failed',
       passed_tick = (SELECT current_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1)
 WHERE bill_type = 'minister_confirmation'
   AND status IN ('committee', 'floor')
   AND nation_id IN (SELECT nation_id FROM stale_nations)
   AND proposed_tick < (
       SELECT started_tick FROM current_admin WHERE nation_id = bills.nation_id
   );

UPDATE ministries
   SET confirmation_status = NULL,
       pending_minister    = NULL
 WHERE confirmation_status = 'pending'
   AND nation_id IN (
       SELECT nation_id FROM administrations
        WHERE ended_at_tick IS NULL
   )
   AND NOT EXISTS (
       SELECT 1 FROM bills b
        WHERE b.nation_id  = ministries.nation_id
          AND b.ministry_key = ministries.ministry_key
          AND b.bill_type  = 'minister_confirmation'
          AND b.status     IN ('committee', 'floor')
   );

NOTIFY pgrst, 'reload schema';

COMMIT;
