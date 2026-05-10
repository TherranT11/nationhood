-- ════════════════════════════════════════════════════════════════
-- Allow founder corp deletion (bankruptcy) without FK-violating
-- on strategic_alliances.founder_faction_id.
--
-- Today the FK is ON DELETE RESTRICT + NOT NULL, so any
-- declare_corp_bankruptcy on a corp that founded any strategic
-- alliance fails with:
--   update or delete on table "factions" violates foreign key
--   constraint "strategic_alliances_founder_faction_id_fkey"
--
-- The runtime code already anticipated this case
-- (sql/migrations/20261009_alliance_founding_fee_emit_cash_events.sql:199-203
-- "If the founder corp was deleted between propose and withdraw
-- (e.g. bankruptcy), the helper's INSERT would FK-violate and abort"),
-- but the schema never allowed the underlying delete to actually
-- succeed.
--
-- Fix shape mirrors refund_escrow_on_faction_delete on
-- loan_negotiations (20260722_loan_negotiations_phase1.sql):
--
--   1. Drop NOT NULL + change FK to ON DELETE SET NULL so the
--      delete cascade has somewhere to land.
--   2. BEFORE DELETE trigger on factions marks any non-dissolved
--      alliance founded by the deleting corp as status='dissolved',
--      dissolved_reason='all_left' (the closest fit in the
--      existing CHECK; founder leaving = no one left to lead),
--      dissolved_at_tick=current_tick. Audit row stays so other
--      members can see the alliance ended.
--
-- After this migration:
--   - declare_corp_bankruptcy (+ any other DELETE FROM factions
--     path) works for founder corps.
--   - alliance_members rows where faction_id=founder CASCADE-delete
--     (their seat is gone) per the existing FK.
--   - Other members' alliance_members rows survive on the dissolved
--     alliance — they can see history.
--   - founder_faction_id ends up NULL on dissolved alliances; RPCs
--     that compare against it (`v_alliance.founder_faction_id <>
--     p_founder_faction_id`) safely return NULL → no false-positive
--     authorization.
-- ════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Schema relaxation ───────────────────────────────────────
ALTER TABLE public.strategic_alliances
    ALTER COLUMN founder_faction_id DROP NOT NULL;

ALTER TABLE public.strategic_alliances
    DROP CONSTRAINT IF EXISTS strategic_alliances_founder_faction_id_fkey;

ALTER TABLE public.strategic_alliances
    ADD CONSTRAINT strategic_alliances_founder_faction_id_fkey
        FOREIGN KEY (founder_faction_id) REFERENCES public.factions(id)
        ON DELETE SET NULL;


-- ── 2. BEFORE DELETE trigger on factions ───────────────────────
CREATE OR REPLACE FUNCTION public.dissolve_alliances_on_founder_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tick INT;
BEGIN
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE strategic_alliances
       SET status            = 'dissolved',
           dissolved_at_tick = v_tick,
           dissolved_reason  = 'all_left'
     WHERE founder_faction_id = OLD.id
       AND status <> 'dissolved';

    RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_dissolve_alliances_on_founder_delete ON public.factions;
CREATE TRIGGER trg_dissolve_alliances_on_founder_delete
    BEFORE DELETE ON public.factions
    FOR EACH ROW
    EXECUTE FUNCTION dissolve_alliances_on_founder_delete();

COMMIT;

NOTIFY pgrst, 'reload schema';
