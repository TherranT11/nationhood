-- Fix foreign keys that block corporation bankruptcy.
--
-- Background: declaring bankruptcy ultimately runs DELETE on the factions
-- row. Every other corp-facing table (corp_vessels, corp_properties,
-- shipping_claims, subsidiary_*, finance_active_loans, etc.) has
-- ON DELETE CASCADE on its faction FK. Four constraints were missed —
-- they use the default NO ACTION, so the DELETE raises
--   "update or delete on table factions violates foreign key constraint X"
-- and the bankruptcy transaction fails.
--
-- Reported against shipping_applications_faction_id_fkey (a shipping corp
-- that had submitted route applications). insurance_claims has the same
-- class of bug and will bite the first corp that files or underwrites a
-- claim and later declares bankruptcy.
--
-- Fix: drop + recreate each constraint with the semantically-correct
-- ON DELETE action, matching the cascade pattern the rest of the schema
-- already follows. Idempotent (DROP IF EXISTS).

-- shipping_applications.faction_id: applicant corp — applications die with the corp.
ALTER TABLE shipping_applications
    DROP CONSTRAINT IF EXISTS shipping_applications_faction_id_fkey;
ALTER TABLE shipping_applications
    ADD CONSTRAINT shipping_applications_faction_id_fkey
        FOREIGN KEY (faction_id) REFERENCES factions(id) ON DELETE CASCADE;

-- shipping_applications.reviewed_by_faction_id: reviewing gov/party — keep the
-- application row for history but null out the reviewer reference.
ALTER TABLE shipping_applications
    DROP CONSTRAINT IF EXISTS shipping_applications_reviewed_by_faction_id_fkey;
ALTER TABLE shipping_applications
    ADD CONSTRAINT shipping_applications_reviewed_by_faction_id_fkey
        FOREIGN KEY (reviewed_by_faction_id) REFERENCES factions(id) ON DELETE SET NULL;

-- insurance_claims.claimant_faction_id: filer — claim dies with claimant.
ALTER TABLE insurance_claims
    DROP CONSTRAINT IF EXISTS insurance_claims_claimant_faction_id_fkey;
ALTER TABLE insurance_claims
    ADD CONSTRAINT insurance_claims_claimant_faction_id_fkey
        FOREIGN KEY (claimant_faction_id) REFERENCES factions(id) ON DELETE CASCADE;

-- insurance_claims.insurer_faction_id: underwriter — claim dies with insurer.
-- (If the insurer goes bankrupt, outstanding claims become uncollectible
-- in gameplay terms; dropping the row keeps the schema clean.)
ALTER TABLE insurance_claims
    DROP CONSTRAINT IF EXISTS insurance_claims_insurer_faction_id_fkey;
ALTER TABLE insurance_claims
    ADD CONSTRAINT insurance_claims_insurer_faction_id_fkey
        FOREIGN KEY (insurer_faction_id) REFERENCES factions(id) ON DELETE CASCADE;
