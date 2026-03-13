-- ============================================================
-- Fix: Enrich closed administration records with bills_passed,
-- laws_repealed, crises, elections_survived, trade_agreements.
--
-- Problem: The SQL RPCs (finalize_government_formation,
-- rollover_administration) close administrations but only set
-- stats_at_end, approval_at_end, ended_at_tick, end_reason.
-- The JS closeAdministration() populates legislation/crises
-- but hardcoded laws_repealed to [].
--
-- Solution:
-- 1) Add trade_agreements column
-- 2) Create trigger that auto-populates missing fields when
--    an administration is closed (ended_at_tick set to non-NULL)
--    but bills_passed is still NULL (i.e. SQL path was used).
--    The JS path already sets these fields, so the trigger skips.
-- ============================================================

-- 1. Add trade_agreements column
ALTER TABLE administrations ADD COLUMN IF NOT EXISTS trade_agreements JSONB;

-- 2. Helper function called by trigger
CREATE OR REPLACE FUNCTION enrich_closed_administration()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_bills_passed JSONB;
  v_laws_repealed JSONB;
  v_crises_started JSONB;
  v_crises_solved JSONB;
  v_elections_survived INT;
  v_trade_agreements JSONB;
BEGIN
  -- Only run when the admin was just closed and JS didn't already populate
  IF OLD.ended_at_tick IS NOT NULL THEN RETURN NEW; END IF;
  IF NEW.ended_at_tick IS NULL THEN RETURN NEW; END IF;
  IF NEW.bills_passed IS NOT NULL THEN RETURN NEW; END IF;

  -- Bills passed (excluding repeals)
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'bill_id', b.id,
    'bill_name', b.bill_name,
    'passed_tick', b.passed_tick
  )), '[]'::jsonb)
  INTO v_bills_passed
  FROM bills b
  WHERE b.nation_id = NEW.nation_id
    AND b.status = 'passed'
    AND b.bill_type IS DISTINCT FROM 'repeal'
    AND b.passed_tick >= NEW.started_at_tick
    AND b.passed_tick <= NEW.ended_at_tick;

  -- Laws repealed
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'bill_id', b.id,
    'bill_name', b.bill_name,
    'repealed_tick', b.passed_tick
  )), '[]'::jsonb)
  INTO v_laws_repealed
  FROM bills b
  WHERE b.nation_id = NEW.nation_id
    AND b.bill_type = 'repeal'
    AND b.status = 'passed'
    AND b.passed_tick >= NEW.started_at_tick
    AND b.passed_tick <= NEW.ended_at_tick;

  -- Crises started
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'event_id', e.event_id,
    'title', e.event_name,
    'started_tick', e.fired_at_tick
  )), '[]'::jsonb)
  INTO v_crises_started
  FROM event_log e
  WHERE e.nation_id = NEW.nation_id
    AND e.category IN ('crisis', 'disaster', 'conflict')
    AND (e.event_name IS NULL OR e.event_name NOT LIKE 'CRISIS_RESOLVED:%')
    AND e.fired_at_tick >= NEW.started_at_tick
    AND e.fired_at_tick <= NEW.ended_at_tick;

  -- Crises solved
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'title', REPLACE(e.event_name, 'CRISIS_RESOLVED: ', ''),
    'solved_tick', e.fired_at_tick
  )), '[]'::jsonb)
  INTO v_crises_solved
  FROM event_log e
  WHERE e.nation_id = NEW.nation_id
    AND e.event_name LIKE 'CRISIS_RESOLVED:%'
    AND e.fired_at_tick >= NEW.started_at_tick
    AND e.fired_at_tick <= NEW.ended_at_tick;

  -- Elections survived
  SELECT COUNT(*)
  INTO v_elections_survived
  FROM elections el
  WHERE el.nation_id = NEW.nation_id
    AND el.status = 'completed'
    AND el.election_tick >= NEW.started_at_tick
    AND el.election_tick < NEW.ended_at_tick;

  -- Trade agreements enacted during this administration
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'agreement_id', ta.id,
    'agreement_type', ta.agreement_type,
    'agreement_name', ta.agreement_name,
    'partner_nation_id', CASE WHEN ta.nation_a_id = NEW.nation_id THEN ta.nation_b_id ELSE ta.nation_a_id END,
    'enacted_at_tick', ta.enacted_at_tick,
    'status', ta.status
  )), '[]'::jsonb)
  INTO v_trade_agreements
  FROM trade_agreements ta
  WHERE (ta.nation_a_id = NEW.nation_id OR ta.nation_b_id = NEW.nation_id)
    AND ta.enacted_at_tick >= NEW.started_at_tick
    AND ta.enacted_at_tick <= NEW.ended_at_tick;

  -- Update the fields directly on NEW (before row is written)
  NEW.bills_passed := v_bills_passed;
  NEW.laws_repealed := v_laws_repealed;
  NEW.crises_started := v_crises_started;
  NEW.crises_solved := v_crises_solved;
  NEW.elections_survived := v_elections_survived;
  NEW.trade_agreements := v_trade_agreements;

  RETURN NEW;
END;
$$;

-- 3. Create BEFORE UPDATE trigger (so we can modify NEW directly)
DROP TRIGGER IF EXISTS trg_enrich_closed_administration ON administrations;
CREATE TRIGGER trg_enrich_closed_administration
  BEFORE UPDATE ON administrations
  FOR EACH ROW
  WHEN (OLD.ended_at_tick IS NULL AND NEW.ended_at_tick IS NOT NULL)
  EXECUTE FUNCTION enrich_closed_administration();
