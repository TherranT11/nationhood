-- Drop the orphaned health-insurance tables.
--
-- The health-insurance subsystem was retired in two commits:
--   b21c9f6 — strip processHealthInsurancePools + processHealthInsuranceLawsuits
--             + generateHealthInsuranceClaim + flavor tables from
--             advance-corp-tick (-555 lines).
--   <this commit> — strip the B2B insurance branch from advance-corp-tick's
--             finance_active_loans loop + the insurance subsector
--             conversion options on corp-dashboard-home2.html + the
--             claims_office reputation bonus.
--
-- After both commits land, nothing in the codebase reads or writes
-- health_insurance_pools, health_insurance_claims, or
-- health_insurance_lawsuits. Codebase-wide grep confirmed zero
-- consumers; no FK constraints reference these tables. Safe to drop.
--
-- Idempotent via IF EXISTS. CASCADE is intentional: each table's own
-- indexes and any latent constraints go with it.

DROP TABLE IF EXISTS public.health_insurance_lawsuits CASCADE;
DROP TABLE IF EXISTS public.health_insurance_claims   CASCADE;
DROP TABLE IF EXISTS public.health_insurance_pools    CASCADE;

NOTIFY pgrst, 'reload schema';
