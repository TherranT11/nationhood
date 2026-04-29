-- =========================================================================
-- Hard-delete legacy open/bidding construction contracts that carry
-- inflated budgets from before commit bde38f9 (2026-04-28 14:51:03 UTC),
-- when the auto-generation path multiplied workforce requirements by 100.
--
-- Symptom: industrial-sector contracts posting at $26B-$38B budgets,
-- well over the formula's ~$1.5B max under the corrected formula. Labor
-- alone for an oil_refinery at the buggy 33,000-worker max was
-- 33,000 × $15,200/tick × 75 ticks ≈ $37.6B — matches the screenshots.
--
-- Filter: status IN ('open', 'bidding') AND created_at < commit time.
-- Awarded / in_progress / completed / expired contracts are left
-- untouched — they carry real player history (bids, deliveries, bonds,
-- insurance) and FK constraints would block the delete anyway.
--
-- ON DELETE CASCADE on contract_bids / construction_deliveries /
-- construction_events / project_material_allocations means cleanup is
-- automatic for the dropped rows. The bond / insurance FK references
-- (finance_loan_requests, finance_active_loans, insurance_claims) only
-- attach to AWARDED contracts, which the filter excludes.
-- =========================================================================

-- ── Pre-check: how many contracts will be deleted ──
SELECT
    sector,
    COUNT(*)                              AS rows,
    MIN(budget_ceiling)                   AS min_budget,
    MAX(budget_ceiling)                   AS max_budget,
    ROUND(AVG(budget_ceiling)/1e9, 2)     AS avg_budget_billions
FROM construction_contracts
WHERE status IN ('open', 'bidding')
  AND created_at < '2026-04-28 14:51:03+00'::timestamptz
GROUP BY sector
ORDER BY sector;

-- ── The delete ──
DELETE FROM construction_contracts
WHERE status IN ('open', 'bidding')
  AND created_at < '2026-04-28 14:51:03+00'::timestamptz;

-- ── Post-check: what's left in open/bidding ──
SELECT
    sector,
    COUNT(*)                              AS rows,
    ROUND(AVG(budget_ceiling)/1e6, 1)     AS avg_budget_millions
FROM construction_contracts
WHERE status IN ('open', 'bidding')
GROUP BY sector
ORDER BY sector;
-- Expected: avg budgets in line with template ranges
-- (civil ~$25M-$300M, industrial ~$180M-$2.5B, mega ~$1.5B-$36B).
