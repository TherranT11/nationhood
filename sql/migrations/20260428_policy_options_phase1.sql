-- ═══════════════════════════════════════════════════════════════════════════════
-- POLICY OPTIONS — PHASE 1: data model (destructive)
-- ═══════════════════════════════════════════════════════════════════════════════
-- Restructures policies into a parent/child shape:
--   policies (umbrella)  →  policy_options (2..7 children, or 1 for levers)
--
-- Each option owns its own description, sector effects, stat effects, and
-- costs. The umbrella policy keeps only name, description, sector, law
-- category, fiscal category, policy_type, and opposed_policy_ids.
--
-- DESTRUCTIVE: wipes existing policies, bills, and bill-dependent rows on
-- the assumption that all previous bills are being thrown out. Re-author
-- bills via the policyadmin and bill flows once Phases 2–5 land.
--
-- Wiped:               bills, bill_articles, bill_support, bill_comments,
--                      bill_amendment_requests, amendment_requests,
--                      budget_item_allocations, active_laws,
--                      nation_policies, policies
-- FK columns NULLed:   diplomatic_proposals.{proposing_bill_id, target_bill_id}
--                      ambassadors.confirmation_bill_id
--                      default_resolutions.bill_id
--                      impeachment_proceedings.{motion_bill_id, conviction_bill_id}
--
-- New table:           policy_options
-- New columns:         bill_articles.policy_option_id
--                      nation_policies.policy_option_id
--                      active_laws.policy_option_id
--
-- Dropped from policies (per-option payload moves to policy_options):
--   ideology, ideologies, target_stat, stat_direction, stat_change,
--   secondary_stat, secondary_direction, secondary_change, ap_cost,
--   upfront_cost, ongoing_cost, cost_scaling_stat, cost_scaling_stat_2,
--   immediate_min, immediate_max, ongoing_tick_change, ongoing_max_total,
--   conflict_group, stat_change_per_tick, duration_months, stat_ceiling,
--   stat_floor, cost_relief, ongoing_cost_per_tick, side_effects,
--   approval_impact, one_time_only, enacted_nation_ids, ongoing_base_cost,
--   ongoing_scaling_stat, stat_effects, upfront_scaling_stat,
--   requires_policy_id, sector_effects
--
-- minor_sector is intentionally retained: it's read in places that fall
-- back to it when law_category is null. Phase 5 cleanup drops it.
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ───────────────────────────────────────────────────────────────────────────────
-- 1) Wipe primary tables. Children → parents to document intent even though
--    none of these have hard FK cascades.
-- ───────────────────────────────────────────────────────────────────────────────
DELETE FROM budget_item_allocations;
DELETE FROM bill_amendment_requests;
DELETE FROM amendment_requests;
DELETE FROM bill_support;
DELETE FROM bill_comments;
DELETE FROM bill_articles;
DELETE FROM nation_policies;
DELETE FROM active_laws;
DELETE FROM bills;
DELETE FROM policies;

-- ───────────────────────────────────────────────────────────────────────────────
-- 2) Clear dangling bill references in auxiliary tables. We keep the rows
--    (a diplomatic proposal can outlive its bill) but null the pointer so
--    UI doesn't render against deleted bills.
-- ───────────────────────────────────────────────────────────────────────────────
UPDATE diplomatic_proposals
   SET proposing_bill_id = NULL, target_bill_id = NULL
 WHERE proposing_bill_id IS NOT NULL OR target_bill_id IS NOT NULL;

UPDATE ambassadors
   SET confirmation_bill_id = NULL
 WHERE confirmation_bill_id IS NOT NULL;

UPDATE default_resolutions
   SET bill_id = NULL
 WHERE bill_id IS NOT NULL;

UPDATE impeachment_proceedings
   SET motion_bill_id = NULL, conviction_bill_id = NULL
 WHERE motion_bill_id IS NOT NULL OR conviction_bill_id IS NOT NULL;

-- ───────────────────────────────────────────────────────────────────────────────
-- 3) Drop per-option columns off policies. The sector_effects CHECK
--    constraint must lift before its column drops.
-- ───────────────────────────────────────────────────────────────────────────────
ALTER TABLE policies
    DROP CONSTRAINT IF EXISTS policies_sector_effects_shape;

ALTER TABLE policies
    DROP COLUMN IF EXISTS ideology,
    DROP COLUMN IF EXISTS ideologies,
    DROP COLUMN IF EXISTS target_stat,
    DROP COLUMN IF EXISTS stat_direction,
    DROP COLUMN IF EXISTS stat_change,
    DROP COLUMN IF EXISTS secondary_stat,
    DROP COLUMN IF EXISTS secondary_direction,
    DROP COLUMN IF EXISTS secondary_change,
    DROP COLUMN IF EXISTS ap_cost,
    DROP COLUMN IF EXISTS upfront_cost,
    DROP COLUMN IF EXISTS ongoing_cost,
    DROP COLUMN IF EXISTS cost_scaling_stat,
    DROP COLUMN IF EXISTS cost_scaling_stat_2,
    DROP COLUMN IF EXISTS immediate_min,
    DROP COLUMN IF EXISTS immediate_max,
    DROP COLUMN IF EXISTS ongoing_tick_change,
    DROP COLUMN IF EXISTS ongoing_max_total,
    DROP COLUMN IF EXISTS conflict_group,
    DROP COLUMN IF EXISTS stat_change_per_tick,
    DROP COLUMN IF EXISTS duration_months,
    DROP COLUMN IF EXISTS stat_ceiling,
    DROP COLUMN IF EXISTS stat_floor,
    DROP COLUMN IF EXISTS cost_relief,
    DROP COLUMN IF EXISTS ongoing_cost_per_tick,
    DROP COLUMN IF EXISTS side_effects,
    DROP COLUMN IF EXISTS approval_impact,
    DROP COLUMN IF EXISTS one_time_only,
    DROP COLUMN IF EXISTS enacted_nation_ids,
    DROP COLUMN IF EXISTS ongoing_base_cost,
    DROP COLUMN IF EXISTS ongoing_scaling_stat,
    DROP COLUMN IF EXISTS stat_effects,
    DROP COLUMN IF EXISTS upfront_scaling_stat,
    DROP COLUMN IF EXISTS requires_policy_id,
    DROP COLUMN IF EXISTS sector_effects;

-- ───────────────────────────────────────────────────────────────────────────────
-- 4) Create policy_options. ON DELETE CASCADE so deleting a policy cleans
--    its children too. UNIQUE (policy_id, sort_order) keeps display order
--    stable and prevents duplicate slots.
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS policy_options (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    policy_id uuid NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
    sort_order integer NOT NULL,
    option_label text NOT NULL,
    description text,
    sector_effects jsonb NOT NULL DEFAULT '[]'::jsonb,
    stat_effects jsonb NOT NULL DEFAULT '[]'::jsonb,
    upfront_cost numeric NOT NULL DEFAULT 0,
    upfront_scaling_stat text,
    ongoing_base_cost numeric NOT NULL DEFAULT 0,
    ongoing_scaling_stat text,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE (policy_id, sort_order)
);

-- Top-level array guards only. Per-element shape (sector_key string,
-- change_tenths number, stat_effects fields) is enforced by the authoring
-- UI and save handlers — Postgres rejects iterating subqueries inside
-- CHECK constraints, so we don't try to do it at the DB layer.
ALTER TABLE policy_options
    ADD CONSTRAINT policy_options_sector_effects_array
    CHECK (jsonb_typeof(sector_effects) = 'array');

ALTER TABLE policy_options
    ADD CONSTRAINT policy_options_stat_effects_array
    CHECK (jsonb_typeof(stat_effects) = 'array');

CREATE INDEX IF NOT EXISTS idx_policy_options_policy_id
    ON policy_options(policy_id);

COMMENT ON TABLE policy_options IS
    'Per-option payload for a policy. Structural policies have 2..7 options (one is active per nation at a time); levers have exactly 1 option (fire-and-forget).';

-- ───────────────────────────────────────────────────────────────────────────────
-- 5) Track which option was chosen / activated on the rows that need it.
--    No hard FK to mirror the rest of the schema's FK-light convention;
--    application code enforces integrity. Indexes keep lookups by option
--    cheap (used by the engine when option-switch fires).
-- ───────────────────────────────────────────────────────────────────────────────
ALTER TABLE bill_articles
    ADD COLUMN IF NOT EXISTS policy_option_id uuid;

ALTER TABLE nation_policies
    ADD COLUMN IF NOT EXISTS policy_option_id uuid;

ALTER TABLE active_laws
    ADD COLUMN IF NOT EXISTS policy_option_id uuid;

CREATE INDEX IF NOT EXISTS idx_bill_articles_policy_option_id
    ON bill_articles(policy_option_id);
CREATE INDEX IF NOT EXISTS idx_nation_policies_policy_option_id
    ON nation_policies(policy_option_id);
CREATE INDEX IF NOT EXISTS idx_active_laws_policy_option_id
    ON active_laws(policy_option_id);

COMMIT;
