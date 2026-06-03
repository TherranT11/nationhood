-- ════════════════════════════════════════════════════════════════════
-- 20270567 — list_corp_history: drop corp_tax_bills UNION arms
--
-- The Phase A function (20270564) UNIONed event_log with two
-- corp_tax_bills derivations (Tax Bill Issued / Taxes Paid) to
-- surface tax history alongside the rest of the corp timeline.
--
-- The legacy economy teardown migration
-- sql/migrations/20270251_corp_cull_p5b_teardown_legacy_economy
-- dropped corp_tax_bills in prod (verified via to_regclass returning
-- NULL). With the table gone, list_corp_history fails at execution
-- against the missing relation.
--
-- This migration replaces the function with the event_log-only shape.
-- The "Tax Bill Issued" and "Taxes Paid" categories are dropped from
-- the timeline until the tax system gets a new SOT — at which point
-- list_corp_history adds whichever arms surface that SOT.
--
-- Function body identical to 20270564 with the two corp_tax_bills
-- UNION ALL arms removed and the inner SELECT no longer needing a
-- UNION wrapper at all — single source, single SELECT, same ORDER
-- and LIMIT semantics.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.list_corp_history(p_corp_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_events jsonb;
BEGIN
    IF p_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    SELECT COALESCE(jsonb_agg(row_to_jsonb(c) ORDER BY c.tick DESC), '[]'::jsonb)
      INTO v_events
      FROM (
        -- event_log entries scoped to this corp via either match arm:
        --   faction_id = corp_id           — corp is the subject
        --   effects_applied->>'corp_id'    — actor acted on the corp
        -- Text comparison on the JSON value rather than ::uuid cast
        -- so a malformed historical corp_id string can't tank the
        -- query for the entire corp.
        SELECT
            el.fired_at_tick                                AS tick,
            el.trigger_key                                  AS kind,
            el.event_name                                   AS title,
            el.description_used                             AS body
          FROM public.event_log el
         WHERE el.fired_at_tick IS NOT NULL
           AND (
               el.faction_id = p_corp_id
               OR (el.effects_applied IS NOT NULL
                   AND el.effects_applied ->> 'corp_id' = p_corp_id::text)
           )
         ORDER BY el.fired_at_tick DESC
         LIMIT 50
      ) c;

    RETURN jsonb_build_object('success', true, 'events', v_events);
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
