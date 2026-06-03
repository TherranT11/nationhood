-- ════════════════════════════════════════════════════════════════════
-- 20270577 — read_statute_books RPC
--
-- Powers the Advocate panel's STATUTE BOOKS action. Until now the
-- button was vapor copy ("just Legal Acumen" — no such stat exists).
-- Mechanic, per design:
--
--   • Reward:  +2 Credibility, -1 Reputation (floored at 0).
--   • Gate:    No active cases (count from helper must be 0).
--   • Rate:    Shares try_case_cooldown_until_tick — reading the codes
--              consumes the politician's once-per-tick action slot,
--              matching the panel header "PICK ONE EACH TICK".
--
-- Reusing the existing try_case cooldown column (vs. inventing a new
-- per-action column) is the SIMPLEST honest fit: the row of buttons
-- is one tick-action per tick, and TRY A CASE was already stamping
-- v_tick + 1. APPEAL opts out of that cooldown on the client; STATUTE
-- BOOKS shares it.
--
-- Active-case count comes from _advocate_active_case_count(uuid)
-- (20270576) — same SoT helper draw_court_case and start_appeal use
-- for their cap check.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.read_statute_books()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid             uuid := auth.uid();
    v_pol             factions%ROWTYPE;
    v_tick            int;
    v_active_count    int;
    v_new_cred        int;
    v_new_rep         int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    SELECT * INTO v_pol FROM public.factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.bar_admitted_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_advocate');
    END IF;
    IF v_pol.politician_magistrate_at_tick IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_advocate');
    END IF;

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    IF v_pol.try_case_cooldown_until_tick IS NOT NULL
       AND v_pol.try_case_cooldown_until_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.try_case_cooldown_until_tick);
    END IF;

    v_active_count := public._advocate_active_case_count(v_pol.id);
    IF v_active_count > 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'active_cases',
            'active', v_active_count);
    END IF;

    UPDATE public.factions
       SET politician_credibility       = GREATEST(0, COALESCE(politician_credibility, 0) + 2),
           politician_reputation        = GREATEST(0, COALESCE(politician_reputation, 0)  - 1),
           try_case_cooldown_until_tick = v_tick + 1
     WHERE id = v_pol.id
    RETURNING politician_credibility, politician_reputation
         INTO v_new_cred, v_new_rep;

    -- Actual deltas after the GREATEST floor — Reputation at 0
    -- doesn't move, so the client message stays honest.
    RETURN jsonb_build_object(
        'success',              true,
        'action',               'read_statute_books',
        'credibility_delta',    v_new_cred - COALESCE(v_pol.politician_credibility, 0),
        'reputation_delta',     v_new_rep  - COALESCE(v_pol.politician_reputation,  0),
        'new_credibility',      v_new_cred,
        'new_reputation',       v_new_rep,
        'cooldown_until_tick',  v_tick + 1
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.read_statute_books() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.read_statute_books() TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
