-- ════════════════════════════════════════════════════════════════
-- Aviation — cancel in-progress design research
--
-- Lets a manufacturer pull an engine or aircraft design out of R&D
-- before completion. Status 'cancelled' already exists in the
-- corp_aircraft_designs CHECK (20261027_aviation_design_research.sql)
-- so no schema change is needed; this migration just adds the RPC
-- + sets is_active=false so the cancelled design drops out of every
-- list query (R&D, Current Designs, engine catalog, production
-- selectors) that already filters on is_active.
--
-- Money spent so far is NOT refunded. The $1M/tick research cost
-- has been emitted to corp_cash_events as an expense; the
-- manufacturer cancels to STOP further drain, not to undo prior
-- drain. Cancel-then-restart is a strategic re-roll, not a free
-- preview.
-- ════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION cancel_design_research(p_design_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user UUID := auth.uid();
    v_design corp_aircraft_designs%ROWTYPE;
    v_corp factions%ROWTYPE;
BEGIN
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    SELECT * INTO v_design FROM corp_aircraft_designs
     WHERE id = p_design_id FOR UPDATE;
    IF v_design.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Design not found');
    END IF;
    IF v_design.status <> 'researching' THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Design is %s — only researching designs can be cancelled', v_design.status));
    END IF;

    SELECT * INTO v_corp FROM factions WHERE id = v_design.corp_id;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Owning corporation not found');
    END IF;
    IF v_corp.id <> v_user
       AND COALESCE(v_corp.linked_user_id, '00000000-0000-0000-0000-000000000000'::uuid) <> v_user THEN
        RETURN jsonb_build_object('success', false,
            'error', 'Only the corporation that owns this design can cancel it');
    END IF;

    UPDATE corp_aircraft_designs
       SET status    = 'cancelled',
           is_active = FALSE
     WHERE id = p_design_id;

    RETURN jsonb_build_object(
        'success',   true,
        'design_id', p_design_id,
        'name',      v_design.name
    );
END;
$$;

GRANT EXECUTE ON FUNCTION cancel_design_research(UUID) TO authenticated;

COMMENT ON FUNCTION cancel_design_research(UUID) IS
    'Cancels an in-progress engine or aircraft design. Sets status=cancelled + is_active=false so the row drops out of all R&D / catalog / production-selector queries. Cash already spent on per-tick research costs is NOT refunded.';

COMMIT;

NOTIFY pgrst, 'reload schema';
