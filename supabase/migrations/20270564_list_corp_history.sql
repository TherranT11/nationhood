-- ════════════════════════════════════════════════════════════════════
-- 20270564 — list_corp_history RPC
--
-- Phase A of the Corporate History container on entrepreneur-corp.
-- Aggregates corp-scoped events from two sources:
--
--   1. event_log — most corp events already write here. We match on
--      either faction_id = corp_id (events the corp is the subject of:
--      HQ relocations, bankruptcy, board accept/leave) OR on
--      effects_applied->>'corp_id' = corp_id (events where faction_id
--      is the actor, not the corp — e.g., a director's investment
--      offer, where the JSONB carries the target corp).
--
--   2. corp_tax_bills — tax history doesn't flow through event_log
--      (table-only audit per 20261016). Each bill row yields up to
--      two events: "Tax Bill Issued" at assessment time, "Taxes Paid"
--      at paid_at_tick when status is 'paid' or 'paid_with_fraud'.
--
-- The assessment-tick reconstruction uses due_at_tick - 6. The 6 is
-- the assessor's grace constant baked into 20261017
-- (assess_corp_tax_year inserts with due_at_tick = current + 6).
-- Coupled, but the alternative — using due_at_tick directly — would
-- place the "issued" event 6 ticks after the bill actually existed,
-- which reads wrong on the timeline.
--
-- Phase A surfaces the 12 of 18 event types whose data already
-- lives in event_log or corp_tax_bills:
--   construction starts/completes, loans funded, investments,
--   owner withdrawals, building listed/purchased, HQ moves,
--   bankruptcy, board accept/reject/leave, taxes owed/paid.
--
-- Phase B (next commit) will add capture hooks for the missing six:
--   corp founding, IPO/going-private, share purchases, share sells,
--   loan payments (gated on the future manual-pay-loan mechanic).
--
-- Cap of 50 events keeps the payload bounded — the container is a
-- recent-history scroll, not a full audit trail.
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

    SELECT COALESCE(jsonb_agg(row_to_jsonb(c) ORDER BY c.tick DESC, c.kind), '[]'::jsonb)
      INTO v_events
      FROM (
        -- (1) event_log entries scoped to this corp via either match.
        SELECT
            el.fired_at_tick                                AS tick,
            el.trigger_key                                  AS kind,
            el.event_name                                   AS title,
            el.description_used                             AS body,
            el.effects_applied                              AS metadata
          FROM public.event_log el
         WHERE el.fired_at_tick IS NOT NULL
           AND (
               el.faction_id = p_corp_id
               OR (el.effects_applied IS NOT NULL
                   AND (el.effects_applied ->> 'corp_id') IS NOT NULL
                   AND (el.effects_applied ->> 'corp_id')::uuid = p_corp_id)
           )

        UNION ALL

        -- (2a) Tax bill issuance — assessment-tick reconstructed from
        -- due_at_tick - 6 (assessor grace constant from 20261017).
        SELECT
            (b.due_at_tick - 6)                             AS tick,
            'tax_owed'::text                                AS kind,
            'Tax Bill Issued'::text                         AS title,
            format('Tax bill of $%s issued for year %s (revenue $%s @ %s%%).',
                   to_char(b.amount_due, 'FM999,999,999,999'),
                   b.year,
                   to_char(b.revenue_taxed, 'FM999,999,999,999'),
                   b.rate_pct)                              AS body,
            jsonb_build_object(
                'tax_bill_id', b.id,
                'amount_due',  b.amount_due,
                'year',        b.year,
                'rate_pct',    b.rate_pct,
                'status',      b.status
            )                                                AS metadata
          FROM public.corp_tax_bills b
         WHERE b.corp_id = p_corp_id

        UNION ALL

        -- (2b) Tax payment — separate row, only when the bill resolves
        -- as paid (clean or with fraud). The status text disambiguates
        -- on the client.
        SELECT
            b.paid_at_tick                                  AS tick,
            CASE WHEN b.status = 'paid_with_fraud'
                 THEN 'tax_paid_fraud'
                 ELSE 'tax_paid' END                        AS kind,
            CASE WHEN b.status = 'paid_with_fraud'
                 THEN 'Taxes Paid (Fraud)'
                 ELSE 'Taxes Paid' END                      AS title,
            format('Tax bill of $%s for year %s paid.',
                   to_char(b.amount_due, 'FM999,999,999,999'),
                   b.year)                                   AS body,
            jsonb_build_object(
                'tax_bill_id', b.id,
                'amount_paid', b.amount_due,
                'year',        b.year
            )                                                AS metadata
          FROM public.corp_tax_bills b
         WHERE b.corp_id = p_corp_id
           AND b.status IN ('paid', 'paid_with_fraud')
           AND b.paid_at_tick IS NOT NULL

        ORDER BY tick DESC
        LIMIT 50
      ) c;

    RETURN jsonb_build_object('success', true, 'events', v_events);
END $$;

REVOKE EXECUTE ON FUNCTION public.list_corp_history(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.list_corp_history(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
