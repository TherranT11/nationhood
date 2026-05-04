-- 20260825_install_hog_dual_role_guard.sql
--
-- Prevents the dual-role bug observed in Avelia (ticks 14–48):
-- Aurelio Salcedo was simultaneously the active President AND the
-- active PM. install_hog had no check that the incoming PM was not
-- already serving as President in the same nation. When a party
-- whose leader was the sitting President went through PM rotation
-- (coalition formation, leadership change, ministerial confirmation),
-- the same person got installed in both seats.
--
-- Fix: name-match guard at the top of the RPC. If the incoming PM
-- matches the active President of this nation by first+last name
-- (case-insensitive, trimmed), refuse the install with a clear
-- error. The caller surfaces the error and the party must select a
-- different person for PM.
--
-- Intentionally a name match, not a faction match: the rule is
-- "one person can't hold both seats", not "the President's party
-- can't hold the PM seat" — those are different constitutional
-- principles. A party that elects its leader to the presidency
-- promotes someone else to lead the legislative side.
--
-- The legacy fallback path inside JS installHOG (used when the RPC
-- is not yet deployed) does NOT carry this guard. That path is
-- service_role only and rarely exercised; consolidating both paths
-- behind the RPC is a separate cleanup.
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

    -- Dual-role guard: a sitting President cannot also be installed
    -- as PM (separation of powers). Name-matched against the active
    -- president for this nation. If the incoming PM is the President,
    -- refuse — the caller must pick someone else for the PM seat.
    PERFORM 1
      FROM presidents
     WHERE nation_id = p_nation_id
       AND is_active = true
       AND lower(trim(first_name)) = lower(trim(p_first_name))
       AND lower(trim(last_name))  = lower(trim(p_last_name));
    IF FOUND THEN
        RETURN jsonb_build_object('success', false,
            'error', 'Cannot install ' || COALESCE(p_first_name, '') || ' ' || COALESCE(p_last_name, '')
                  || ' as Prime Minister: they are the active President of this nation. '
                  || 'Separation of powers — the party must select a different leader for PM.');
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
