-- 20260811_assign_construction_crews_total_cap.sql
--
-- Bug: assign_construction_crews (20260503) only validated `p_crews <=
-- corp_work_crews`. It never accounted for crews already deployed on
-- the corp's OTHER active contracts, so a player could assign their
-- full Work Crews stat to every parallel contract — total deployed
-- ended up well past the stat cap. The client modal had the same gap.
--
-- Fix: re-check the cap as `p_crews + sum(crews_assigned on every
-- other awarded/active contract owned by this corp) <= corp_work_crews`.
-- Idempotent CREATE OR REPLACE; function body otherwise unchanged
-- from the original.

BEGIN;

CREATE OR REPLACE FUNCTION assign_construction_crews(
    p_contract_id UUID,
    p_crews       NUMERIC
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id        UUID := auth.uid();
    v_contract       corp_contracts%ROWTYPE;
    v_corp           factions%ROWTYPE;
    v_others_total   NUMERIC;
    v_total_cap      NUMERIC;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    SELECT * INTO v_contract FROM corp_contracts WHERE id = p_contract_id;
    IF v_contract.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Contract not found');
    END IF;
    IF v_contract.winner_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Contract has no winner');
    END IF;

    -- Lock the corp row for the duration of the txn so two concurrent
    -- assign_construction_crews calls for the same corp can't both
    -- pass the cap check on stale reads. Cross-corp calls don't
    -- contend on this lock.
    SELECT * INTO v_corp FROM factions
    WHERE id = v_contract.winner_faction_id
    FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Winning corp missing');
    END IF;
    IF v_corp.id <> v_user_id AND v_corp.linked_user_id <> v_user_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not your contract');
    END IF;

    IF p_crews IS NULL OR p_crews < 0 OR p_crews > 10 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Crews must be between 0 and 10');
    END IF;

    -- Total cap: my Work Crews stat. Pool already eaten by every other
    -- awarded/active contract I own; this one's existing assignment is
    -- excluded so the player can re-assign their own crews freely.
    SELECT COALESCE(SUM(crews_assigned), 0) INTO v_others_total
    FROM corp_contracts
    WHERE winner_faction_id = v_corp.id
      AND status IN ('awarded', 'active')
      AND id <> p_contract_id;

    v_total_cap := COALESCE(v_corp.corp_work_crews, 0);

    IF p_crews + v_others_total > v_total_cap THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Cannot assign %s — your corp has %s Work Crews and %s are deployed on other contracts (%s available).',
                p_crews, v_total_cap, v_others_total, GREATEST(v_total_cap - v_others_total, 0)));
    END IF;

    UPDATE corp_contracts SET crews_assigned = p_crews WHERE id = p_contract_id;

    RETURN jsonb_build_object('success', true, 'crews_assigned', p_crews);
END;
$$;

GRANT EXECUTE ON FUNCTION assign_construction_crews(UUID, NUMERIC) TO authenticated;

COMMIT;

NOTIFY pgrst, 'reload schema';
