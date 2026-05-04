-- 20260827_head_of_government_history_preserving.sql
--
-- Fix C: head_of_government becomes history-preserving.
--
-- Before: head_of_government had UNIQUE(nation_id), so every PM
-- change overwrote the prior PM in place. Avelia couldn't answer
-- "who was PM before Salcedo?" because the prior row was clobbered.
-- The "Lombardi as PM" the player remembered was unverifiable from
-- the data — head_of_government had only one row (Salcedo) with no
-- audit trail.
--
-- After: UNIQUE(nation_id) is replaced by a partial unique index
-- on (nation_id) WHERE active = true. Inactive rows accumulate,
-- one per former PM, and the active row is unique per nation.
-- Future "who was PM at tick X?" queries are answerable from data.
--
-- Two-step write pattern (already used by install_hog, now uniformly
-- enforced): UPDATE active=false on existing active row → INSERT new
-- row with active=true. The just-deactivated row no longer collides
-- on the partial unique because its active flag is false.
--
-- Idempotent.

BEGIN;

-- 1. Drop the old whole-table UNIQUE constraint. Default Postgres
--    name for an inline UNIQUE column is <table>_<column>_key.
ALTER TABLE head_of_government
    DROP CONSTRAINT IF EXISTS head_of_government_nation_id_key;

-- 2. Add the partial unique index. Inactive history rows are
--    unconstrained; only one active row per nation can exist.
CREATE UNIQUE INDEX IF NOT EXISTS head_of_government_active_nation_idx
    ON head_of_government (nation_id)
    WHERE active = true;

-- 3. Re-issue install_hog without the ON CONFLICT (nation_id) DO
--    UPDATE clause. The deactivate-then-insert pair is sufficient:
--    after the UPDATE, no active row exists for this nation, so the
--    INSERT lands cleanly under the new partial unique. Inactive
--    history rows are kept.
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

    -- Dual-role guard (Fix A): a sitting President cannot also be
    -- installed as PM. Name-matched against the active president.
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

    -- Snapshot outgoing HOG before deactivating (for the
    -- leader_changes event the JS appends afterward in semi-pres
    -- flows).
    SELECT faction_id, first_name, last_name INTO v_outgoing
      FROM head_of_government
     WHERE nation_id = p_nation_id
       AND active = true
     LIMIT 1;

    -- Deactivate any active HOG row for this nation. The partial
    -- unique index allows multiple inactive rows but exactly one
    -- active row per nation. After this UPDATE, no active row
    -- exists; the INSERT below lands cleanly without ON CONFLICT.
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
    );

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
