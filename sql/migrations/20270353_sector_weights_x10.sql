-- ════════════════════════════════════════════════════════════════════
-- SECTOR WEIGHTS ×10 — coarse 1/2/3 → 10/20/30 for finer province splits
-- ════════════════════════════════════════════════════════════════════
-- Sector weight was a 1–3 tier (stat-driven: ≥65→3, 35-65→2, <35→1, soft-
-- capped to 32 nation-wide). That coarse scale forces province partitions into
-- whole thirds. Rescaling the whole system ×10 (10/20/30, cap 320) lets the
-- admin Provinces tab split a sector's weight finely across provinces.
--
-- WHY THIS DOESN'T MOVE ELECTIONS OR POPULATION:
--   * Weight is only ever consumed as a RELATIVE share — TWP = popularity ×
--     weight × turnout, and turnout = Σ(weight×base)/Σ(weight). Both divide by
--     the weight total, so a uniform ×10 cancels out exactly.
--   * Population is a nation stat, independent of sector weight.
--   * The dynamic recompute (js/game/sectors.js: stepStatToWeight + the
--     SECTOR_WEIGHT_* constants and nation cap) was rescaled ×10 in lockstep,
--     so the next election rewrites the same ×10 values rather than reverting
--     to 1/2/3. DEPLOY THE CODE BEFORE/WITH THIS MIGRATION: under the old code
--     the old cap (32) would treat the new ×10 weights as oversized and scale
--     them back down on the next election.
--
-- This migration applies the ×10 to existing rows so the change is immediate
-- (and so CUSTOM sectors without a primary_stat — which the recompute leaves
-- untouched — also move). Province partitions are scaled in step so any saved
-- splits stay balanced (Σ province weights still equals the sector weight).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- Province cell weight was capped at the old per-sector max (3). Drop the
-- upper bound (it would reject the ×10 below and any future override); a cell
-- still can't go negative, and the admin UI caps each cell at its sector's
-- nation weight + blocks save unless the cells sum to it.
ALTER TABLE public.province_sector_weights
    DROP CONSTRAINT IF EXISTS province_sector_weights_weight_check;
ALTER TABLE public.province_sector_weights
    ADD  CONSTRAINT province_sector_weights_weight_check CHECK (weight >= 0);

-- Rescale existing data ×10 (sectors has no upper CHECK; just weight >= 1).
UPDATE public.sectors                 SET weight = weight * 10;
UPDATE public.province_sector_weights SET weight = weight * 10;

COMMENT ON COLUMN public.sectors.weight IS
    'National importance multiplier (10/20/30 tiers, soft-capped to 320 nation-wide). Used as a relative share in Total Weighted Popularity = popularity * weight * base_turnout. Source of the scale: SECTOR_WEIGHT_* in js/game/sectors.js.';

COMMIT;
