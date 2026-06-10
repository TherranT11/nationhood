-- ════════════════════════════════════════════════════════════════════
-- 20270816 — Supply & Material gets tier state
--
-- The first department to move from display copy to a real column.
-- Every corp starts at Tier 0 — the Retail Hardware Store — which
-- has NO storage: the Procurement Run modal (Executive Action #4)
-- lists Construction Materials and Construction Equipment at live
-- market prices but refuses purchases until the asset is upgraded.
--
-- The purchase flow itself (stockpiles, supply depletion, the
-- Procurement Credits that discount Advance Build) lands with the
-- Supply & Material upgrade mechanics — unreachable machinery isn't
-- built ahead of them.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.entrepreneur_corps
    ADD COLUMN IF NOT EXISTS supply_tier int NOT NULL DEFAULT 0 CHECK (supply_tier >= 0);

COMMENT ON COLUMN public.entrepreneur_corps.supply_tier IS
    'Supply & Material department tier (20270816). 0 = Retail Hardware Store — no storage, Procurement Run refuses purchases. Upgrade mechanics increment this.';

NOTIFY pgrst, 'reload schema';

COMMIT;
