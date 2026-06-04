-- ════════════════════════════════════════════════════════════════════
-- 20270610 — Corporate Contracts section: surface binding contracts
--
-- Bug: the "Corporate Contracts" section on entrepreneur-corp.html
-- (#cp-contracts at index.html:1070) is a static "No contracts yet."
-- placeholder — no JS populates it. A corp can have mutually-signed
-- (status='binding') contracts on file and the section still reads
-- "No contracts yet" because nothing queries them.
--
-- The Corporate Negotiations modal (cp-neg-btn) already lists
-- 'drafting' contracts via list_corp_negotiations. Binding contracts
-- need to surface in the main section, not in the modal.
--
-- Fix: instead of adding a new list_*_binding RPC alongside the
-- existing one (which would duplicate the cross-join + counterparty-
-- pick CASE block), this migration extends list_corp_negotiations
-- with an optional p_statuses parameter:
--
--   list_corp_negotiations(p_corp_id uuid,
--                          p_statuses text[] DEFAULT ARRAY['drafting'])
--
-- The DEFAULT preserves the existing call surface — the two modal
-- callsites in entrepreneur-corp.html keep working unchanged (they
-- pass only p_corp_id). The new Corporate Contracts section passes
-- ARRAY['binding'] to get fully-signed contracts.
--
-- Adding p_statuses to an existing function signature creates a NEW
-- overload in PG (CREATE OR REPLACE only matches identical signatures).
-- DROP FUNCTION IF EXISTS on the old single-arg version first to keep
-- PostgREST from getting two overloads it could pick between.
--
-- Also threads signed_at_tick + expires_at_tick into the return so
-- the client can render "signed T143 · expires T240" on binding rows.
-- The two extra fields are harmless to the existing modal callers
-- (they just go unused).
--
-- Apply after 20270609.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

DROP FUNCTION IF EXISTS public.list_corp_negotiations(uuid);

CREATE OR REPLACE FUNCTION public.list_corp_negotiations(
    p_corp_id  uuid,
    p_statuses text[] DEFAULT ARRAY['drafting']
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_negotiations jsonb;
BEGIN
    IF p_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;
    -- Empty / NULL statuses array falls back to the historic default so
    -- the modal callsites can't accidentally receive no rows on
    -- p_statuses => '{}'.
    IF p_statuses IS NULL OR cardinality(p_statuses) = 0 THEN
        p_statuses := ARRAY['drafting'];
    END IF;

    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'contract_id',              r.id,
                'created_at_tick',          r.created_at_tick,
                'signed_at_tick',           r.signed_at_tick,
                'expires_at_tick',          r.expires_at_tick,
                'status',                   r.status,
                'is_initiator',             r.is_initiator,
                'counterparty_corp_id',     r.counterparty_corp_id,
                'counterparty_corp_name',   r.counterparty_corp_name,
                'counterparty_corp_nation', r.counterparty_corp_nation
            ) ORDER BY COALESCE(r.signed_at_tick, r.created_at_tick) DESC
        ),
        '[]'::jsonb
    )
      INTO v_negotiations
      FROM (
        SELECT
            c.id,
            c.created_at_tick,
            c.signed_at_tick,
            c.expires_at_tick,
            c.status,
            (c.initiating_corp_id = p_corp_id) AS is_initiator,
            CASE WHEN c.initiating_corp_id = p_corp_id
                 THEN c.counterparty_corp_id
                 ELSE c.initiating_corp_id END AS counterparty_corp_id,
            CASE WHEN c.initiating_corp_id = p_corp_id
                 THEN ec_b.name
                 ELSE ec_a.name END           AS counterparty_corp_name,
            CASE WHEN c.initiating_corp_id = p_corp_id
                 THEN n_b.name
                 ELSE n_a.name END            AS counterparty_corp_nation
          FROM public.corp_negotiations c
          LEFT JOIN public.entrepreneur_corps ec_a ON ec_a.id = c.initiating_corp_id
          LEFT JOIN public.entrepreneur_corps ec_b ON ec_b.id = c.counterparty_corp_id
          LEFT JOIN public.nations n_a ON n_a.id = ec_a.hq_nation_id
          LEFT JOIN public.nations n_b ON n_b.id = ec_b.hq_nation_id
         WHERE c.status = ANY(p_statuses)
           AND (c.initiating_corp_id = p_corp_id OR c.counterparty_corp_id = p_corp_id)
      ) r;

    RETURN jsonb_build_object('success', true, 'negotiations', v_negotiations);
END $$;

REVOKE EXECUTE ON FUNCTION public.list_corp_negotiations(uuid, text[]) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.list_corp_negotiations(uuid, text[]) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
