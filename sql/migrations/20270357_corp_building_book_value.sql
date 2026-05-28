-- ════════════════════════════════════════════════════════════════════
-- BUILDING BOOK VALUE — specialty plants count even when seeded free
-- ════════════════════════════════════════════════════════════════════
-- corp_buildings.cost_paid honestly records what the corp spent — which
-- means a starter Engine Assembly Plant (seeded at corp founding with
-- cost_paid = 0 in found_entrepreneur_corp) contributed $0 to the book
-- value, so a corp with $60M cash, $47M debt and one of these plants was
-- valued at $13M. The plant is worth $225M intrinsically (per the
-- ENGINE_ASSEMBLY_BASE_COST constant in js/game/corp-valuation.js).
--
-- Single source: corp_building_book_value_of(cost_paid, building_type)
-- returns GREATEST(cost_paid, specialty_intrinsic_for_type). For tier-
-- based generic buildings (regional_hq, construction_yard, port, banking
-- _office, real_estate_office) the specialty CASE returns 0 and cost_paid
-- — set by begin_construction at the cost-of-living-adjusted tier price —
-- wins. For the four assembly plants the specialty CASE wins when seeded
-- at cost_paid 0 OR when cost_paid happens to be lower than the base.
--
-- entrepreneur_corp_book_value() (existing aggregator used by net-worth
-- ranking + sell-equity buyback) is rewritten to call the helper.
-- entrepreneur_corp_book_aggregates([]) is new — the client aggregator
-- (js/corp-book-value.js) now calls this one RPC instead of doing three
-- separate SELECT aggregations and re-implementing the book-value rule.
-- Server is the one source for the formula; the client just renders it.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── Single per-building book-value rule ──────────────────────────
-- Mirrors the LIGHT/ENGINE/AIRCRAFT/HEAVY_ASSEMBLY_BASE_COST constants
-- in js/game/corp-valuation.js. Keep both in sync; the JS values are the
-- design source. IMMUTABLE — pure function of its inputs.
CREATE OR REPLACE FUNCTION public.corp_building_book_value_of(
    p_cost_paid bigint, p_building_type text
) RETURNS bigint
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT GREATEST(
        COALESCE(p_cost_paid, 0),
        CASE p_building_type
            WHEN 'light_assembly_plant'       THEN 175000000
            WHEN 'engine_assembly_plant'      THEN 225000000
            WHEN 'aircraft_assembly_facility' THEN 225000000
            WHEN 'heavy_manufacturing_plant'  THEN 375000000
            ELSE 0
        END
    )::bigint;
$$;

GRANT EXECUTE ON FUNCTION public.corp_building_book_value_of(bigint, text) TO authenticated, anon;

-- ── Rewrite entrepreneur_corp_book_value to use the helper ───────
-- Body from 20270212 with the SUM(cost_paid) swapped for
-- SUM(corp_building_book_value_of(...)).
CREATE OR REPLACE FUNCTION public.entrepreneur_corp_book_value(p_corp_id uuid)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT GREATEST(0, ROUND(
          COALESCE((SELECT treasury_cash FROM entrepreneur_corps WHERE id = p_corp_id), 0)
        + COALESCE((SELECT SUM(corp_building_book_value_of(cost_paid, building_type))
                      FROM corp_buildings WHERE owner_corp_id = p_corp_id), 0)
        - COALESCE((SELECT SUM(GREATEST(0, principal - COALESCE(total_paid, 0)))
                      FROM corp_loans
                     WHERE borrower_corp_id = p_corp_id
                       AND status IN ('approved', 'active')), 0)
    ));
$$;

GRANT EXECUTE ON FUNCTION public.entrepreneur_corp_book_value(uuid) TO authenticated;

-- ── New aggregator RPC for the client ────────────────────────────
-- Returns (corp_id, building_book_value, outstanding_debt) for each id
-- in the input array. Lets js/corp-book-value.js make ONE call and trust
-- the server's book-value rule instead of summing cost_paid itself.
CREATE OR REPLACE FUNCTION public.entrepreneur_corp_book_aggregates(p_corp_ids uuid[])
RETURNS TABLE (corp_id uuid, building_book_value bigint, outstanding_debt bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT c.id AS corp_id,
           COALESCE((
               SELECT SUM(corp_building_book_value_of(b.cost_paid, b.building_type))::bigint
                 FROM corp_buildings b WHERE b.owner_corp_id = c.id
           ), 0) AS building_book_value,
           COALESCE((
               SELECT SUM(GREATEST(0, COALESCE(principal, 0) - COALESCE(total_paid, 0)))::bigint
                 FROM corp_loans WHERE borrower_corp_id = c.id AND status = 'active'
           ), 0) + COALESCE((
               SELECT SUM(GREATEST(0, COALESCE(outstanding, 0)))::bigint
                 FROM central_bank_loans WHERE borrower_corp_id = c.id AND status = 'active'
           ), 0) AS outstanding_debt
      FROM entrepreneur_corps c
     WHERE c.id = ANY(p_corp_ids);
$$;

GRANT EXECUTE ON FUNCTION public.entrepreneur_corp_book_aggregates(uuid[]) TO authenticated, anon;

NOTIFY pgrst, 'reload schema';

COMMIT;
