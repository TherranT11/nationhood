-- ════════════════════════════════════════════════════════════════════
-- Bills + voting audit fixes (follow-up to 20270423)
--
-- Two problems shipped in 20270423:
--
-- 1. RACE CONDITION on propose_bill. The "EXISTS … status='voting'"
--    check + the subsequent INSERT aren't atomic. Two concurrent
--    propose_bill calls (different politicians, same policy, same
--    tick) can both pass the EXISTS check (no row visible to either
--    transaction yet) and both INSERT, leaving the policy with two
--    bills in flight — the second-resolved one would silently
--    overwrite the first's outcome.
--
--    Fix: unique partial index on (nation_id, policy_id) WHERE
--    status='voting'. The DB enforces atomicity for us; the RPC
--    catches unique_violation and returns reason='bill_in_flight'
--    so client UX is the same.
--
-- 2. DEAD STATE on proposer columns. assembly_bills.proposer_politician_id
--    and proposer_party_id are written at proposal time but nothing
--    reads them. Per the "columns written and never queried" rule,
--    surface the proposer name + party on the bill card in
--    politician-laws.html (in the matching commit) rather than drop
--    the columns — the data is useful context ("Proposed by Mariana
--    Castillo · Partido Patria Roja") and we already have it.
--
-- Idempotent: CREATE UNIQUE INDEX uses IF NOT EXISTS;
-- propose_bill is CREATE OR REPLACE.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS assembly_bills_one_voting_per_policy
    ON assembly_bills (nation_id, policy_id) WHERE status = 'voting';

-- Body = 20270423 + EXCEPTION WHEN unique_violation. The EXISTS check
-- stays as a fast path (skips the wasted derive_bill_stance call when
-- there's clearly a bill in flight already); the unique index is the
-- last line of defence for the race-condition window.
CREATE OR REPLACE FUNCTION public.propose_bill(
    p_policy_id uuid,
    p_option_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_tick      int;
    v_option    policy_options%ROWTYPE;
    v_current   uuid;
    v_stance    jsonb;
    v_bill_id   uuid;
    v_next_pr   int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_nation');
    END IF;
    IF v_pol.politician_party_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_in_party');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    IF v_pol.next_bill_propose_tick IS NOT NULL
       AND v_pol.next_bill_propose_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_bill_propose_tick);
    END IF;

    SELECT * INTO v_option FROM policy_options WHERE id = p_option_id;
    IF v_option.id IS NULL OR v_option.policy_id <> p_policy_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_option');
    END IF;

    SELECT selected_option_id INTO v_current
      FROM active_laws
     WHERE nation_id = v_pol.nation_id
       AND policy_id = p_policy_id
       AND COALESCE(is_reversal, false) = false
     ORDER BY passed_tick DESC NULLS LAST LIMIT 1;
    IF v_current IS NOT NULL AND v_current = p_option_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_active');
    END IF;

    -- Fast-path EXISTS check — same-tx racers fall through to the
    -- unique-index EXCEPTION handler at the INSERT.
    IF EXISTS (SELECT 1 FROM assembly_bills
                WHERE nation_id = v_pol.nation_id
                  AND policy_id = p_policy_id
                  AND status    = 'voting') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bill_in_flight');
    END IF;

    v_stance := derive_bill_stance(p_option_id);

    BEGIN
        INSERT INTO assembly_bills (
            nation_id, policy_id, current_option_id, proposed_option_id,
            proposer_politician_id, proposer_party_id,
            archetype_alignment, proposed_at_tick, close_at_tick
        ) VALUES (
            v_pol.nation_id, p_policy_id, v_current, p_option_id,
            v_pol.id, v_pol.politician_party_id,
            v_stance, v_tick, v_tick + 3
        ) RETURNING id INTO v_bill_id;
    EXCEPTION WHEN unique_violation THEN
        -- Concurrent racer beat us to the INSERT via the partial
        -- unique index assembly_bills_one_voting_per_policy.
        RETURN jsonb_build_object('success', false, 'reason', 'bill_in_flight');
    END;

    v_next_pr := v_tick + 5;
    UPDATE factions SET next_bill_propose_tick = v_next_pr WHERE id = v_pol.id;

    RETURN jsonb_build_object(
        'success', true,
        'bill_id', v_bill_id,
        'archetype_alignment', v_stance,
        'close_at_tick', v_tick + 3,
        'next_propose_tick', v_next_pr
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.propose_bill(uuid, uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
