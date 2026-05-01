-- ══════════════════════════════════════════════════════════════
-- Path 1 Phase 1C: regulatory_bonus + applies_to on permit catalog
--
-- Permits become a per-project boost to a corp's effective regulatory
-- standing for incident-roll purposes. Each catalog row gets:
--
--   regulatory_bonus  — points added to a holder's effective
--                       regulatory_standing on projects this permit
--                       covers. Default 0 (admins tune later).
--
--   applies_to        — sector keys this permit applies to. Empty
--                       array means "applies to all sectors". Sector
--                       keys mirror the catalog: 'civil_engineering',
--                       'industrial', 'mega_project'.
--
-- Effective-standing math (lives in advance-corp-tick):
--   effective = corp.corp_regulatory_standing
--             + Σ (regulatory_bonus from held active permits whose
--                 applies_to matches the project's sector or is empty)
--             − (1 per required permit the corp doesn't hold)
--   gap       = max(0, contract.requirements.regulatory_standing − effective)
--   per_tick  = min(0.90, 0.15 × gap) / contract.timeline_months
--
-- Held-permit lookup uses corp_permits.status='active' (existing).
-- ══════════════════════════════════════════════════════════════

ALTER TABLE construction_permits
  ADD COLUMN IF NOT EXISTS regulatory_bonus INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS applies_to       TEXT[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN construction_permits.regulatory_bonus IS
    'Points added to a holder''s effective regulatory_standing on projects this permit covers. Default 0; admins tune via SQL.';

COMMENT ON COLUMN construction_permits.applies_to IS
    'Sector keys this permit applies to (civil_engineering, industrial, mega_project). Empty array = applies to all sectors.';
