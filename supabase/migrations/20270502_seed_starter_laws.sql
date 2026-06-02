-- ════════════════════════════════════════════════════════════════════
-- Starter laws — seed 3 enacted statutes per nation for Avelia + Melizea
--
-- politician-statutes.html ships with five blank-state code sections.
-- This migration gives the page real content for the two active
-- politician-side nations: three enacted laws each, one per section
-- (Criminal / Civil / Commercial). Constitutional Charter and
-- Electoral Code stay blank for now.
--
-- Status semantics:
--   queued        → submitted, awaiting committee
--   tabled        → in committee, hearing held / awaiting action
--   reported_out  → out of committee, ready for chamber floor
--   withdrawn     → pulled by the author
--   enacted (NEW) → passed into law, in force
--
-- For starter content we go directly to 'enacted' — these are
-- pre-existing statutes of the nation, not proposals to be debated.
-- author_faction_id is NULL (no in-game proposer), proposed_at_tick
-- is 0 (pre-shard sentinel). committee_id is set to the natural-fit
-- committee for each category (Civil + Criminal → Judiciary &
-- Constitutional Affairs, Commercial → Industry, Trade and Labor)
-- so the FK NOT NULL constraint is satisfied honestly.
--
-- Content was authored in the chat alongside the design pass on RP
-- laws; each statute carries 3 articles tagged operative / remedy /
-- administration / exception per the modal's tag vocabulary.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Widen status CHECK constraint to allow 'enacted' ─────────────
ALTER TABLE committee_proposals
    DROP CONSTRAINT IF EXISTS committee_proposals_status_check;
ALTER TABLE committee_proposals
    ADD  CONSTRAINT committee_proposals_status_check
    CHECK (status IN ('queued','tabled','reported_out','withdrawn','enacted'));

-- ── 2. Seed 3 enacted laws per nation × 2 nations ───────────────────
-- DO block reads committee_id by (nation_name, committee_key) so the
-- INSERTs work without knowing the UUIDs at write time. Idempotent
-- via NOT EXISTS guard on (nation_id, category, section).
DO $$
DECLARE
    rec           RECORD;
    v_nation_id   uuid;
    v_committee   uuid;
    v_articles    jsonb;
BEGIN
    FOR rec IN
        SELECT * FROM (VALUES
            -- ── Avelia (parliamentary republic, civic-minded) ──
            ('Avelia', 'criminal', 'judiciary_constitutional', 'Tax Evasion',
             '[{"ordinal":1,"tag":"operative","text":"Knowingly underreporting income above 50,000 carries 8-15 years imprisonment plus restitution of 200% of the evaded amount."},
               {"ordinal":2,"tag":"remedy","text":"The statute of limitations is 7 years from the date the falsified return was filed; concealment tolls the clock for the duration of the concealment."},
               {"ordinal":3,"tag":"administration","text":"Voluntary disclosure before any audit notice has been issued reduces the otherwise-applicable sentence by half."}]'::jsonb),

            ('Avelia', 'civil', 'judiciary_constitutional', 'Statute of Limitations',
             '[{"ordinal":1,"tag":"operative","text":"Contract disputes must be filed within 6 years of the alleged breach. Personal-injury actions must be filed within 3 years of the date of injury."},
               {"ordinal":2,"tag":"exception","text":"Claims of fraud may be brought within 10 years of the date the fraud was discovered or could reasonably have been discovered."},
               {"ordinal":3,"tag":"operative","text":"Under no circumstances may a claim be filed more than 20 years after the underlying event, including in cases of continuing concealment."}]'::jsonb),

            ('Avelia', 'commercial', 'industry_trade_labor', 'Personal Bankruptcy',
             '[{"ordinal":1,"tag":"operative","text":"Personal debts are discharged 7 years after filing, provided the debtor has made a documented good-faith effort to repay."},
               {"ordinal":2,"tag":"remedy","text":"Fraudulent bankruptcy filings receive no discharge ever and carry an additional 5-10 years imprisonment."},
               {"ordinal":3,"tag":"administration","text":"Debtors who reaffirm secured debts remain personally liable on those debts after discharge."}]'::jsonb),

            -- ── Melizea (petrostate, entrenched corruption) ──
            ('Melizea', 'criminal', 'judiciary_constitutional', 'Bribery of Public Officials',
             '[{"ordinal":1,"tag":"operative","text":"Both the giver and the receiver of a bribe are liable. The standard sentence is 4-12 years imprisonment."},
               {"ordinal":2,"tag":"remedy","text":"Where the bribe exceeds 1 million, the sentence is doubled and the convicted person is permanently barred from holding any public office."},
               {"ordinal":3,"tag":"exception","text":"A bribery scheme reported by a participant within 30 days of the offer earns that participant prosecutorial immunity."}]'::jsonb),

            ('Melizea', 'civil', 'judiciary_constitutional', 'Defamation',
             '[{"ordinal":1,"tag":"operative","text":"Public figures must prove actual malice — knowing falsehood, or reckless disregard for the truth — to recover damages."},
               {"ordinal":2,"tag":"operative","text":"Private individuals must prove only negligence on the part of the defendant."},
               {"ordinal":3,"tag":"remedy","text":"Non-economic damages are capped at 500,000. Truth is an absolute defense in all defamation actions."}]'::jsonb),

            ('Melizea', 'commercial', 'industry_trade_labor', 'Whistleblower Protection',
             '[{"ordinal":1,"tag":"operative","text":"Employees who report employer wrongdoing to lawful authorities are protected from termination for 36 months from the date the report is filed."},
               {"ordinal":2,"tag":"remedy","text":"Unlawful termination of a protected whistleblower entitles the employee to three times annual salary plus reinstatement at the employee''s option."},
               {"ordinal":3,"tag":"exception","text":"Reports filed in bad faith forfeit all protection under this section and may be referred for prosecution as false accusations."}]'::jsonb)
        ) AS t(nation_name, category, committee_key, section, articles)
    LOOP
        SELECT id INTO v_nation_id FROM nations WHERE name = rec.nation_name LIMIT 1;
        IF v_nation_id IS NULL THEN
            CONTINUE;  -- nation not present on this shard
        END IF;

        SELECT id INTO v_committee FROM committees
         WHERE nation_id = v_nation_id AND committee_key = rec.committee_key;
        IF v_committee IS NULL THEN
            CONTINUE;  -- committee not seeded (depends on 20270496)
        END IF;

        IF EXISTS (
            SELECT 1 FROM committee_proposals
             WHERE nation_id = v_nation_id
               AND category  = rec.category
               AND section   = rec.section
        ) THEN
            CONTINUE;  -- idempotency: don't double-seed
        END IF;

        INSERT INTO committee_proposals (
            committee_id, nation_id, author_faction_id,
            category, section, articles,
            status, proposed_at_tick
        ) VALUES (
            v_committee, v_nation_id, NULL,
            rec.category, rec.section, rec.articles,
            'enacted', 0
        );
    END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
