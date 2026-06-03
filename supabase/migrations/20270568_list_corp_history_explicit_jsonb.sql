-- ════════════════════════════════════════════════════════════════════
-- 20270568 — list_corp_history: explicit jsonb_build_object
--
-- Prod surfaced "function row_to_jsonb(record) does not exist" when
-- the 20270567 function was invoked. The row_to_jsonb(c) pattern over
-- an anonymous subquery row works fine in other migrations
-- (list_resolved_cases_for_nation, list_appealable_cases) on the same
-- DB, so the failure is a runtime quirk of how the planner resolves
-- the composite type in this specific call shape rather than a
-- portable issue. Switching to explicit jsonb_build_object sidesteps
-- the composite-type inference entirely — same payload shape, just
-- spelled out.
--
-- Same return contract as 20270567: { success: bool, events: [...] }
-- with each event carrying tick / kind / title / body. Still capped
-- at 50 newest-first event_log rows scoped to the corp via either
-- the faction_id or effects_applied corp_id match.
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

    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'tick',  sub.tick,
                'kind',  sub.kind,
                'title', sub.title,
                'body',  sub.body
            ) ORDER BY sub.tick DESC
        ),
        '[]'::jsonb
    )
      INTO v_events
      FROM (
        SELECT
            el.fired_at_tick    AS tick,
            el.trigger_key      AS kind,
            el.event_name       AS title,
            el.description_used AS body
          FROM public.event_log el
         WHERE el.fired_at_tick IS NOT NULL
           AND (
               el.faction_id = p_corp_id
               OR (el.effects_applied IS NOT NULL
                   AND el.effects_applied ->> 'corp_id' = p_corp_id::text)
           )
         ORDER BY el.fired_at_tick DESC
         LIMIT 50
      ) sub;

    RETURN jsonb_build_object('success', true, 'events', v_events);
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
