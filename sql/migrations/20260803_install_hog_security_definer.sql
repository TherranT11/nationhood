-- 20260803_install_hog_security_definer.sql
--
-- Fix: client "Form Government" alert "row-level security policy
-- for head_of_government" after the rollover_administration RPC
-- succeeds.
--
-- Same root cause as 20260802 (rollover_administration): the JS
-- autoAppointPartyLeaderAsPM → installHOG path writes
-- head_of_government directly from the client, but
-- 20260302_fix_rls_ownership stripped client INSERT/UPDATE policies
-- on the table ("set by tick processor").
--
-- Fix: SECURITY DEFINER RPC install_hog that performs the
-- deactivate-outgoing + upsert-new pair atomically. Caller must own
-- the incoming PM's faction; the RPC bypasses RLS on its own
-- service-owner privilege so the deactivate-outgoing branch (which
-- mutates a different party's row) can proceed.
--
-- Tick processor + edge functions still write head_of_government as
-- service_role and bypass RLS regardless.
--
-- Idempotent (CREATE OR REPLACE).

BEGIN;

CREATE OR REPLACE FUNCTION install_hog(
    p_nation_id    UUID,
    p_faction_id   UUID,
    p_first_name   TEXT,
    p_last_name    TEXT,
    p_age          INT,
    p_current_tick INT,
    p_trait_key    TEXT,
    p_candidate_id UUID,
    p_reason       TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user        UUID := auth.uid();
    v_pm_party    factions%ROWTYPE;
    v_outgoing    RECORD;
    v_outgoing_name TEXT;
    v_new_name    TEXT;
BEGIN
    -- service_role calls (tick processor) bypass RLS and don't have
    -- an auth.uid(); skip the ownership check in that case.
    IF v_user IS NOT NULL THEN
        SELECT * INTO v_pm_party FROM factions WHERE id = p_faction_id;
        IF v_pm_party.id IS NULL THEN
            RETURN jsonb_build_object('success', false, 'error', 'Faction not found');
        END IF;
        IF v_pm_party.id <> v_user
           AND COALESCE(v_pm_party.linked_user_id, '00000000-0000-0000-0000-000000000000'::uuid) <> v_user THEN
            RETURN jsonb_build_object('success', false,
                'error', 'You do not own the incoming PM''s faction');
        END IF;
        IF v_pm_party.nation_id IS DISTINCT FROM p_nation_id THEN
            RETURN jsonb_build_object('success', false,
                'error', 'PM faction does not belong to this nation');
        END IF;
    END IF;

    -- Snapshot outgoing HOG before deactivating (for the leader_changes
    -- event the JS appends afterward in semi-pres flows).
    SELECT faction_id, first_name, last_name INTO v_outgoing
      FROM head_of_government
     WHERE nation_id = p_nation_id
       AND active = true
     LIMIT 1;

    -- Deactivate any active HOG rows for this nation. head_of_government
    -- has UNIQUE(nation_id) so a stale inactive row would block a plain
    -- insert; we deactivate first, then upsert in one tx.
    UPDATE head_of_government
       SET active = false
     WHERE nation_id = p_nation_id
       AND active = true;

    INSERT INTO head_of_government (
        nation_id, faction_id, candidate_id,
        first_name, last_name, age,
        trait_key, appointed_tick, active
    ) VALUES (
        p_nation_id, p_faction_id, p_candidate_id,
        p_first_name, p_last_name, COALESCE(p_age, 50),
        p_trait_key, p_current_tick, true
    )
    ON CONFLICT (nation_id) DO UPDATE
        SET faction_id     = EXCLUDED.faction_id,
            candidate_id   = EXCLUDED.candidate_id,
            first_name     = EXCLUDED.first_name,
            last_name      = EXCLUDED.last_name,
            age            = EXCLUDED.age,
            trait_key      = EXCLUDED.trait_key,
            appointed_tick = EXCLUDED.appointed_tick,
            active         = true;

    v_outgoing_name := CASE
        WHEN v_outgoing.faction_id IS NULL THEN NULL
        ELSE COALESCE(NULLIF(trim(concat_ws(' ', v_outgoing.first_name, v_outgoing.last_name)), ''), NULL)
    END;
    v_new_name := COALESCE(NULLIF(trim(concat_ws(' ', p_first_name, p_last_name)), ''), NULL);

    RETURN jsonb_build_object(
        'success',          true,
        'outgoing_pm_name', v_outgoing_name,
        'outgoing_party_id', v_outgoing.faction_id,
        'new_pm_name',      v_new_name,
        'new_party_id',     p_faction_id
    );
END;
$$;

GRANT EXECUTE ON FUNCTION install_hog(UUID, UUID, TEXT, TEXT, INT, INT, TEXT, UUID, TEXT) TO authenticated;

COMMIT;

NOTIFY pgrst, 'reload schema';
