-- ════════════════════════════════════════════════════════════════
-- cancel_trade_agreement(p_agreement_id, p_by_nation_id)
--
-- A signatory nation withdraws from an active trade agreement.
-- Immediate (per product decision). One atomic, SECURITY DEFINER RPC
-- because:
--   • corp_contract_events is RLS read-only for clients (only the
--     service role / definer may insert) — a client-side notify path
--     is impossible and opening that table to client writes would let
--     any player fabricate Pressing Issues for any corp.
--   • status + dispatch events + corp notice must be all-or-nothing.
--
-- Effects:
--   1. trade_agreements.status → 'withdrawn' (+ withdrawn_at_tick /
--      withdrawn_by_nation). The existing AFTER UPDATE trigger
--      (20260621) then cancels the spawned shipping_contracts, reverts
--      the winning corp's route-risk, and auto-rejects pending bids —
--      so "no longer trade those resources" is handled by reused
--      machinery, not duplicated here.
--   2. Politics | Nation + World dispatch: one event_log row per
--      signatory (category 'politics' ⇒ Politics tab; Nation feed per
--      nation, World feed = same rows unfiltered). Mirrors the
--      ratification 'trade_agreement_signed' shape.
--   3. Pressing Issue for every shipping corp that held an awarded
--      contract under the agreement (status ACTIVE + an Acknowledge
--      response; long expiry so it persists until the corp
--      acknowledges via the existing ack-issue RPC).
--
-- Single-fire by construction: the UPDATE is guarded on
-- status='active' and ROW_COUNT; a second call (or double-click) finds
-- it already withdrawn and returns success=false without re-emitting
-- events. Returns jsonb { success, error? } matching the
-- acknowledgeIssue RPC convention the client already handles.
-- ════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.cancel_trade_agreement(
    p_agreement_id UUID,
    p_by_nation_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
    v_name    TEXT;
    v_a       UUID;
    v_b       UUID;
    v_status  TEXT;
    v_tick    INT;
    v_actor   TEXT;
    v_rows    INT;
BEGIN
    SELECT agreement_name, nation_a_id, nation_b_id, status
      INTO v_name, v_a, v_b, v_status
      FROM trade_agreements
     WHERE id = p_agreement_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Agreement not found');
    END IF;
    IF v_status <> 'active' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Agreement is no longer active');
    END IF;
    IF p_by_nation_id IS NULL OR (p_by_nation_id <> v_a AND p_by_nation_id <> v_b) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Only a signatory nation can withdraw from this agreement');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    SELECT name INTO v_actor FROM nations WHERE id = p_by_nation_id;
    v_actor := COALESCE(v_actor, 'A nation');
    v_name  := COALESCE(NULLIF(v_name, ''), 'the trade agreement');

    -- Status change → 20260621 trigger cascades the shipping cleanup.
    UPDATE trade_agreements
       SET status = 'withdrawn',
           withdrawn_at_tick = v_tick,
           withdrawn_by_nation = p_by_nation_id
     WHERE id = p_agreement_id
       AND status = 'active';
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Agreement is no longer active');
    END IF;

    -- Politics | Nation + World — one row per signatory nation.
    INSERT INTO event_log (nation_id, event_name, trigger_key, category, description_chosen, fired_at_tick)
    SELECT nid,
           v_name || ' — Cancelled',
           'trade_agreement_cancelled',
           'politics',
           v_actor || ' has canceled ' || v_name || '.',
           v_tick
      FROM (VALUES (v_a), (v_b)) AS s(nid)
     WHERE nid IS NOT NULL;

    -- Pressing Issue per shipping corp that held an awarded contract.
    INSERT INTO corp_contract_events
        (contract_id, faction_id, nation_id, event_key, type, severity,
         title, description, impact, responses, status,
         fired_at_tick, expires_at_tick)
    SELECT sc.id,
           sc.winner_faction_id,
           sc.nation_id,
           'trade_agreement_cancelled',
           'Trade',
           'MODERATE',
           'Trade Agreement Cancelled',
           v_actor || ' has canceled ' || v_name || '.',
           'Recurring shipping revenue from this route has ended.',
           '[{"key":"acknowledge","label":"Acknowledge","tag":null,"detail":null,"cost":0,"delay":0,"qualityImpact":0}]'::jsonb,
           'ACTIVE',
           v_tick,
           v_tick + 1000
      FROM shipping_contracts sc
     WHERE sc.trade_agreement_id = p_agreement_id
       AND sc.winner_faction_id IS NOT NULL;

    RETURN jsonb_build_object('success', true);
END;
$fn$;

GRANT EXECUTE ON FUNCTION public.cancel_trade_agreement(UUID, UUID) TO authenticated;
