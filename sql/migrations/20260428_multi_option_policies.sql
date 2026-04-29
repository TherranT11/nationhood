-- =========================================================================
-- Multi-option policies refactor
--
-- Changes the policy model from binary (active / inactive) to multi-option:
-- each policy holds 1..N options (e.g. Citizenship Framework Act has Blood-
-- Based, Restricted Naturalization, Birthright, Open, Tiered). A nation
-- always has exactly one option of each multi-option policy selected. Bills
-- switch nations between options; switching hard-cancels the prior option's
-- pending stat_effects + ongoing cost and fires the new option's effects.
--
-- Costs, sector_effects, stat_effects, fiscal_category, and starting-nation
-- assignments move from policies onto policy_options. Top-level policy
-- identity (name, description, sector, law_category, policy_type) stays
-- on policies.
--
-- This migration is destructive: it wipes existing policies and any rows
-- referencing them. In-flight bills (voting / pending_president) are
-- cancelled; passed/failed bills remain as history but lose policy
-- articles. The opposed_policy_ids / requires_policy_id columns are kept
-- in place but no longer authored or enforced.
-- =========================================================================

BEGIN;

-- 1. policy_options table -------------------------------------------------
-- Defensive: a previous run may have created the table with a different
-- column set. CREATE TABLE IF NOT EXISTS would skip recreating it, so we
-- explicitly ADD COLUMN IF NOT EXISTS for every column afterwards.
CREATE TABLE IF NOT EXISTS policy_options (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    policy_id uuid NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
    option_name text NOT NULL
);

ALTER TABLE policy_options ADD COLUMN IF NOT EXISTS option_description text;
ALTER TABLE policy_options ADD COLUMN IF NOT EXISTS option_order integer NOT NULL DEFAULT 0;
ALTER TABLE policy_options ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE policy_options ADD COLUMN IF NOT EXISTS sector_effects jsonb DEFAULT '[]'::jsonb;
ALTER TABLE policy_options ADD COLUMN IF NOT EXISTS stat_effects jsonb DEFAULT '[]'::jsonb;
ALTER TABLE policy_options ADD COLUMN IF NOT EXISTS upfront_cost numeric DEFAULT 0;
ALTER TABLE policy_options ADD COLUMN IF NOT EXISTS upfront_scaling_stat text;
ALTER TABLE policy_options ADD COLUMN IF NOT EXISTS ongoing_base_cost numeric DEFAULT 0;
ALTER TABLE policy_options ADD COLUMN IF NOT EXISTS ongoing_scaling_stat text;
ALTER TABLE policy_options ADD COLUMN IF NOT EXISTS fiscal_category text;
ALTER TABLE policy_options ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_policy_options_policy_id ON policy_options(policy_id);
CREATE INDEX IF NOT EXISTS idx_policy_options_order ON policy_options(policy_id, option_order);

ALTER TABLE policy_options ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public'
            AND tablename = 'policy_options' AND policyname = 'policy_options_select'
    ) THEN
        CREATE POLICY policy_options_select ON policy_options FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public'
            AND tablename = 'policy_options' AND policyname = 'policy_options_all'
    ) THEN
        CREATE POLICY policy_options_all ON policy_options FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- 2. selected_option_id on referencing tables -----------------------------
ALTER TABLE nation_policies        ADD COLUMN IF NOT EXISTS selected_option_id uuid REFERENCES policy_options(id) ON DELETE SET NULL;
ALTER TABLE active_laws            ADD COLUMN IF NOT EXISTS selected_option_id uuid REFERENCES policy_options(id) ON DELETE SET NULL;
ALTER TABLE bill_articles          ADD COLUMN IF NOT EXISTS selected_option_id uuid REFERENCES policy_options(id) ON DELETE SET NULL;
ALTER TABLE amendment_requests     ADD COLUMN IF NOT EXISTS selected_option_id uuid REFERENCES policy_options(id) ON DELETE SET NULL;
ALTER TABLE bill_amendment_requests ADD COLUMN IF NOT EXISTS selected_option_id uuid REFERENCES policy_options(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_nation_policies_option_id ON nation_policies(selected_option_id);
CREATE INDEX IF NOT EXISTS idx_active_laws_option_id     ON active_laws(selected_option_id);
CREATE INDEX IF NOT EXISTS idx_bill_articles_option_id   ON bill_articles(selected_option_id);

-- 3. Cancel in-flight bills ----------------------------------------------
-- 'voting' and 'pending_president' bills depend on policies that are about
-- to be wiped, so we mark them cancelled. 'passed' / 'failed' / 'cancelled'
-- bills stay as historical records.
UPDATE bills
SET status = 'cancelled'
WHERE status IN ('voting', 'pending_president');

-- 4. Wipe binary policy data ---------------------------------------------
DELETE FROM bill_amendment_requests;
DELETE FROM amendment_requests;
DELETE FROM bill_articles WHERE policy_id IS NOT NULL;
DELETE FROM active_laws;
DELETE FROM nation_policies;
DELETE FROM policies;

COMMIT;
