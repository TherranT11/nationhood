-- 20260802_rollover_administration_security_definer.sql
--
-- Fix: client "Form Government" call fails with row-level security
-- policy violation on administrations.
--
-- Root cause:
--   * 20260302_fix_rls_ownership.sql stripped the permissive
--     INSERT/UPDATE/DELETE policies on administrations on the basis
--     that "created by tick processor on government formation".
--   * The rollover_administration RPC (sql/administration_integrity
--     .sql) was defined WITHOUT SECURITY DEFINER, so it ran as the
--     calling user and hit the same RLS wall.
--   * The JS-side fallback (closeAdministration + createAdministration)
--     also writes administrations directly from the client and fails
--     with the same 42501.
--
-- Fix: republish rollover_administration as SECURITY DEFINER so it
-- bypasses RLS — administrations now have exactly one well-known
-- writer surface from the client. Ownership is enforced inside the
-- function: the caller must own the new lead party (pm_party_id) so
-- random authenticated users can't fabricate administrations for
-- nations they have no role in.
--
-- The tick processor + edge functions still write administrations as
-- service_role, which bypasses RLS regardless. They're unaffected.
--
-- Idempotent (CREATE OR REPLACE).

BEGIN;

CREATE OR REPLACE FUNCTION rollover_administration(
    p_nation_id UUID,
    p_end_reason TEXT,
    p_end_tick INT,
    p_end_date TEXT,
    p_end_approval INT,
    p_new_administration JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user           UUID := auth.uid();
    v_pm_party_id    UUID;
    v_pm_party       factions%ROWTYPE;
    v_closed_count   INT := 0;
    v_inserted_id    UUID;
BEGIN
    -- service_role calls (tick processor) bypass RLS and don't have
    -- an auth.uid(); skip the ownership check in that case.
    IF v_user IS NOT NULL THEN
        v_pm_party_id := NULLIF(p_new_administration->>'pm_party_id', '')::UUID;
        IF v_pm_party_id IS NULL THEN
            RETURN jsonb_build_object('success', false, 'error', 'Missing pm_party_id in new_administration');
        END IF;

        SELECT * INTO v_pm_party FROM factions WHERE id = v_pm_party_id;
        IF v_pm_party.id IS NULL THEN
            RETURN jsonb_build_object('success', false, 'error', 'PM party not found');
        END IF;

        -- Caller must own the lead party. The faction.id == auth.uid()
        -- pattern handles the legacy player-faction = auth-user link;
        -- linked_user_id covers the modern path.
        IF v_pm_party.id <> v_user
           AND COALESCE(v_pm_party.linked_user_id, '00000000-0000-0000-0000-000000000000'::uuid) <> v_user THEN
            RETURN jsonb_build_object('success', false,
                'error', 'You do not own the prime minister''s party');
        END IF;

        -- Sanity: the PM party should belong to the nation we're
        -- forming a government for.
        IF v_pm_party.nation_id IS DISTINCT FROM p_nation_id THEN
            RETURN jsonb_build_object('success', false,
                'error', 'PM party does not belong to this nation');
        END IF;
    END IF;

    UPDATE administrations
    SET
        stats_at_end = COALESCE(stats_at_end, '{}'::JSONB),
        approval_at_end = COALESCE(p_end_approval, approval_at_end),
        ended_at_tick = p_end_tick,
        ended_at_date = p_end_date,
        end_reason = p_end_reason,
        updated_at = now()
    WHERE nation_id = p_nation_id
      AND ended_at_tick IS NULL;

    GET DIAGNOSTICS v_closed_count = ROW_COUNT;

    INSERT INTO administrations (
        nation_id,
        admin_name,
        head_of_state,
        prime_minister,
        pm_party_name,
        pm_party_id,
        coalition_parties,
        total_seats,
        government_type,
        started_at_tick,
        started_at_date,
        stats_at_start,
        approval_at_start,
        head_of_state_title,
        hos_election_method
    ) VALUES (
        (p_new_administration->>'nation_id')::UUID,
        p_new_administration->>'admin_name',
        p_new_administration->>'head_of_state',
        p_new_administration->>'prime_minister',
        p_new_administration->>'pm_party_name',
        NULLIF(p_new_administration->>'pm_party_id', '')::UUID,
        COALESCE(p_new_administration->'coalition_parties', '[]'::JSONB),
        COALESCE((p_new_administration->>'total_seats')::INT, 0),
        p_new_administration->>'government_type',
        COALESCE((p_new_administration->>'started_at_tick')::INT, p_end_tick),
        p_new_administration->>'started_at_date',
        COALESCE(p_new_administration->'stats_at_start', '{}'::JSONB),
        CASE
            WHEN p_new_administration ? 'approval_at_start' AND p_new_administration->>'approval_at_start' IS NOT NULL
            THEN (p_new_administration->>'approval_at_start')::INT
            ELSE NULL
        END,
        p_new_administration->>'head_of_state_title',
        p_new_administration->>'hos_election_method'
    )
    RETURNING id INTO v_inserted_id;

    RETURN jsonb_build_object(
        'success', true,
        'closed_count', v_closed_count,
        'inserted_id', v_inserted_id
    );
END;
$$;

GRANT EXECUTE ON FUNCTION rollover_administration(UUID, TEXT, INT, TEXT, INT, JSONB) TO authenticated;

COMMIT;

NOTIFY pgrst, 'reload schema';
