-- 20260911_cancel_open_nation_bonds.sql
--
-- Bond system retired (2026-05). National debt now moves directly each
-- tick by (revenue − expenditures) — no more bond offers, no coupon
-- payments, no printing-to-reserves. The processBond* tick processors
-- are gone; without them, any open nation bond offers in
-- finance_loan_requests would sit forever in the Deal Flow UI with no
-- expiry path. Cancel them all in one shot.
--
-- Filter is intentional:
--   request_type = 'bond'   → don't touch corp loan requests
--   issuer_nation_id NOT NULL → only sovereign bond offers
--   status = 'open'         → leave already-closed offers alone
--
-- Existing bond_holdings rows (purchased bonds held by Investment Corps)
-- are NOT touched here. They become inert without the per-tick coupon
-- and maturity processors; a separate cleanup can refund holders if/
-- when the design wants to.

BEGIN;

UPDATE public.finance_loan_requests
   SET status = 'cancelled'
 WHERE request_type     = 'bond'
   AND issuer_nation_id IS NOT NULL
   AND status           = 'open';

COMMIT;
