-- ════════════════════════════════════════════════════════════════
-- Shipping-corp Pressing Issues surface + wire it into
-- cancel_trade_agreement.
--
-- 20270118 deferred the shipping-corp notice: corp_contract_events
-- .contract_id is NOT NULL FK→corp_contracts(id), so a shipping
-- contract id can't go there. This adds the missing surface:
--
--   1. shipping_contract_events — mirrors corp_contract_events
--      field-for-field but FK'd to shipping_contracts(id). Same
--      status/responses/expiry semantics so the Pressing Issues UI
--      and Acknowledge flow reuse with minimal change.
--   2. acknowledge_shipping_contract_event — trimmed mirror of
--      acknowledge_corp_contract_event. The trade-cancel notice is a
--      zero-cost informational issue (single 'acknowledge' response,
--      no cash/delay), and there is no corp_contracts finish-tick to
--      slip — so the cost/delay machinery is intentionally omitted.
--   3. CREATE OR REPLACE cancel_trade_agreement — re-adds the
--      per-corp notice insert, now FK-valid against
--      shipping_contract_events. Supersedes the 20270118 definition
--      (that migration stays immutable / safe-core).
--
-- "Requires acknowledgement" (product decision): expires_at_tick is
-- set far out (tick+1000) and there is deliberately NO auto-expire
-- sweep for this table, so the issue persists until the corp clicks
-- Acknowledge. Idempotent: CREATE [OR REPLACE] / CREATE TABLE IF NOT
-- EXISTS; the cancel RPC stays single-fire via its status='active'
-- + ROW_COUNT guard.
-- ════════════════════════════════════════════════════════════════

-- ── 1. shipping_contract_events ──────────────────────────────────
CREATE TABLE IF NOT EXISTS shipping_contract_events (
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id       UUID         NOT NULL REFERENCES shipping_contracts(id) ON DELETE CASCADE,
    faction_id        UUID         REFERENCES factions(id) ON DELETE SET NULL,
    nation_id         UUID         NOT NULL REFERENCES nations(id),
    event_key         TEXT         NOT NULL,
    type              TEXT         NOT NULL,
    severity          TEXT         NOT NULL CHECK (severity IN ('LOW','MODERATE','HIGH','CRITICAL')),
    title             TEXT         NOT NULL,
    description       TEXT,
    impact            TEXT,
    responses         JSONB        NOT NULL DEFAULT '[]'::jsonb,
    status            TEXT         NOT NULL DEFAULT 'ACTIVE'
                          CHECK (status IN ('ACTIVE','RESOLVED','EXPIRED')),
    fired_at_tick     INT          NOT NULL,
    expires_at_tick   INT          NOT NULL,
    resolved_at_tick  INT,
    resolution_choice TEXT,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sce_contract       ON shipping_contract_events (contract_id);
CREATE INDEX IF NOT EXISTS idx_sce_faction        ON shipping_contract_events (faction_id);
CREATE INDEX IF NOT EXISTS idx_sce_faction_status ON shipping_contract_events (faction_id, status);

ALTER TABLE shipping_contract_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "shipping_contract_events_read_all" ON shipping_contract_events;
CREATE POLICY "shipping_contract_events_read_all"
    ON shipping_contract_events FOR SELECT TO authenticated USING (true);
-- No write policy: inserts via cancel_trade_agreement (SECURITY
-- DEFINER), resolution via acknowledge_shipping_contract_event.

-- ── 2. acknowledge_shipping_contract_event ───────────────────────
CREATE OR REPLACE FUNCTION acknowledge_shipping_contract_event(
    p_event_id     UUID,
    p_response_key TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
    v_user    UUID := auth.uid();
    v_event   shipping_contract_events%ROWTYPE;
    v_corp    factions%ROWTYPE;
    v_tick    INT;
    v_rows    INT;
BEGIN
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    SELECT * INTO v_event FROM shipping_contract_events WHERE id = p_event_id;
    IF v_event.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Event not found');
    END IF;
    IF v_event.status <> 'ACTIVE' THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Event is %s; cannot acknowledge', v_event.status));
    END IF;

    SELECT * INTO v_corp FROM factions WHERE id = v_event.faction_id;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Event corp not found');
    END IF;
    IF v_corp.id <> v_user AND v_corp.linked_user_id IS DISTINCT FROM v_user THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not own this corporation');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;

    -- Optimistic flip on status='ACTIVE' so a double-click resolves once.
    UPDATE shipping_contract_events
       SET status            = 'RESOLVED',
           resolved_at_tick  = COALESCE(v_tick, 0),
           resolution_choice = 'acknowledge',
           updated_at        = now()
     WHERE id     = p_event_id
       AND status = 'ACTIVE';
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Event already resolved or expired');
    END IF;

    -- Informational notice: no cost / no delay to apply. cost_applied
    -- / delay_applied returned as 0 so the existing client toast code
    -- (acknowledgeIssue) works unchanged.
    RETURN jsonb_build_object(
        'success',           true,
        'event_id',          p_event_id,
        'resolution_choice', 'acknowledge',
        'cost_applied',      0,
        'delay_applied',     0
    );
END;
$fn$;

GRANT EXECUTE ON FUNCTION acknowledge_shipping_contract_event(UUID, TEXT) TO authenticated;

-- ── 3. cancel_trade_agreement — re-add the corp notice ───────────
-- Full definition (supersedes 20270118). Identical core; the only
-- change is the now-FK-valid shipping_contract_events insert.
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

    -- Status change → 20260621 trigger cascades the shipping cleanup
    -- (cancels the contracts; preserves winner_faction_id).
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
    -- FK-valid: contract_id → shipping_contracts(id). Requires-ack
    -- (long expiry, no auto-sweep) per product decision.
    INSERT INTO shipping_contract_events
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
