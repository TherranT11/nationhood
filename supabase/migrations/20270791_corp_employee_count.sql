-- ════════════════════════════════════════════════════════════════════
-- 20270791 — entrepreneur_corps.employee_count
--
-- The businessman corp page (business-corp.html) shows "Number of
-- Employees". Founding staff = 1 (the owner counts themselves) — a
-- real column with a default rather than display hardcode, so hiring
-- mechanics increment one place and every surface reads it. Applies
-- to existing corps too: they gain the same baseline of 1.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.entrepreneur_corps
    ADD COLUMN IF NOT EXISTS employee_count int NOT NULL DEFAULT 1
        CHECK (employee_count >= 0);

COMMENT ON COLUMN public.entrepreneur_corps.employee_count IS
    'Headcount shown on corp pages (20270791). Defaults to 1 — the owner. Hiring mechanics increment here; server-only writes go through whatever RPC does the hiring.';

NOTIFY pgrst, 'reload schema';

COMMIT;
