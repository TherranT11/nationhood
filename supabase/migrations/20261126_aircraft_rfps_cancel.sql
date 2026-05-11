-- ════════════════════════════════════════════════════════════════
-- Aircraft RFPs — airline-initiated cancel
--
-- Adds a fourth status value 'cancelled' for RFPs the airline pulled
-- before award or expiry, plus a cancelled_at_tick audit column and
-- the cancel_aircraft_rfp RPC. Behaviour mirrors the
-- processAircraftRfpExpiry path: pending bids reject, awarded/expired
-- RFPs cannot be cancelled.
--
-- Only the airline that posted the RFP can cancel it. No cash moves;
-- nothing was committed before award.
-- ════════════════════════════════════════════════════════════════

BEGIN;

-- Widen the status CHECK to allow 'cancelled'. The original
-- constraint was declared inline on the column, so PostgreSQL
-- auto-named it aircraft_rfps_status_check.
ALTER TABLE public.aircraft_rfps
    DROP CONSTRAINT IF EXISTS aircraft_rfps_status_check;
ALTER TABLE public.aircraft_rfps
    ADD CONSTRAINT aircraft_rfps_status_check
    CHECK (status IN ('open', 'awarded', 'expired', 'cancelled'));

ALTER TABLE public.aircraft_rfps
    ADD COLUMN IF NOT EXISTS cancelled_at_tick INT;

COMMENT ON COLUMN public.aircraft_rfps.cancelled_at_tick IS
    'Tick when the airline cancelled this RFP. Set by cancel_aircraft_rfp; mirrors awarded_at_tick/expires_at_tick for audit.';

-- ── cancel_aircraft_rfp RPC ────────────────────────────────────
-- Airline pulls an open RFP. Status transitions: open → cancelled.
-- Any pending bids transition to 'rejected' (same outcome as
-- processAircraftRfpExpiry so bidders see a consistent terminal
-- state regardless of why the RFP closed).
CREATE OR REPLACE FUNCTION cancel_aircraft_rfp(p_rfp_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user UUID := auth.uid();
    v_rfp aircraft_rfps%ROWTYPE;
    v_airline factions%ROWTYPE;
    v_tick INT;
    v_rejected INT;
BEGIN
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    -- Lock the row so concurrent cancel/award on the same RFP
    -- serialize.
    SELECT * INTO v_rfp FROM aircraft_rfps WHERE id = p_rfp_id FOR UPDATE;
    IF v_rfp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'RFP not found');
    END IF;
    IF v_rfp.status <> 'open' THEN
        RETURN jsonb_build_object('success', false,
            'error', format('RFP is %s — only open RFPs can be cancelled', v_rfp.status));
    END IF;

    SELECT * INTO v_airline FROM factions WHERE id = v_rfp.airline_corp_id;
    IF v_airline.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Airline corporation not found');
    END IF;
    IF v_airline.id <> v_user
       AND COALESCE(v_airline.linked_user_id, '00000000-0000-0000-0000-000000000000'::uuid) <> v_user THEN
        RETURN jsonb_build_object('success', false,
            'error', 'Only the airline that posted this RFP can cancel it');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE aircraft_rfp_bids
       SET status = 'rejected'
     WHERE rfp_id = p_rfp_id AND status = 'pending';
    GET DIAGNOSTICS v_rejected = ROW_COUNT;

    UPDATE aircraft_rfps
       SET status = 'cancelled',
           cancelled_at_tick = v_tick
     WHERE id = p_rfp_id;

    RETURN jsonb_build_object(
        'success',       true,
        'rfp_id',        p_rfp_id,
        'rejected_bids', v_rejected
    );
END;
$$;

GRANT EXECUTE ON FUNCTION cancel_aircraft_rfp(UUID) TO authenticated;

COMMIT;

NOTIFY pgrst, 'reload schema';
