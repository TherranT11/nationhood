-- Ensure ambassador nomination RPC exists with the expected signature used by select-candidate.html?role=ambassador.
CREATE OR REPLACE FUNCTION public.create_ambassador_nomination_with_bill(
    p_nation_id UUID,
    p_target_nation_id UUID,
    p_faction_id UUID,
    p_proposed_by UUID,
    p_first_name TEXT,
    p_last_name TEXT,
    p_age INT,
    p_current_tick INT,
    p_bill_name TEXT,
    p_preamble TEXT,
    p_voting_ends_tick INT
)
RETURNS TABLE(ambassador_id UUID, bill_id UUID)
LANGUAGE plpgsql
AS $$
DECLARE
    v_ambassador_id UUID;
    v_bill_id UUID;
BEGIN
    INSERT INTO ambassadors (
        nation_id,
        target_nation_id,
        faction_id,
        ambassador_first_name,
        ambassador_last_name,
        ambassador_age,
        status,
        is_active,
        appointed_at_tick
    )
    VALUES (
        p_nation_id,
        p_target_nation_id,
        p_faction_id,
        p_first_name,
        p_last_name,
        p_age,
        'pending_confirmation',
        true,
        p_current_tick
    )
    RETURNING id INTO v_ambassador_id;

    INSERT INTO bills (
        nation_id,
        proposed_by,
        proposed_tick,
        bill_name,
        bill_type,
        status,
        voting_ends_tick,
        ambassador_id,
        preamble
    )
    VALUES (
        p_nation_id,
        p_proposed_by,
        p_current_tick,
        p_bill_name,
        'confirmation',
        'floor',
        p_voting_ends_tick,
        v_ambassador_id,
        p_preamble
    )
    RETURNING id INTO v_bill_id;

    UPDATE ambassadors
    SET confirmation_bill_id = v_bill_id
    WHERE id = v_ambassador_id;

    RETURN QUERY SELECT v_ambassador_id, v_bill_id;
EXCEPTION
    WHEN OTHERS THEN
        DELETE FROM ambassadors
        WHERE id = v_ambassador_id
          AND is_active = true
          AND status = 'pending_confirmation';
        RAISE;
END;
$$;

-- Ensure API role can invoke this RPC.
GRANT EXECUTE ON FUNCTION public.create_ambassador_nomination_with_bill(UUID, UUID, UUID, UUID, TEXT, TEXT, INT, INT, TEXT, TEXT, INT) TO anon, authenticated, service_role;

-- Refresh PostgREST schema cache.
NOTIFY pgrst, 'reload schema';
