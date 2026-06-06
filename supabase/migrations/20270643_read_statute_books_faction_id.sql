-- ════════════════════════════════════════════════════════════════════
-- 20270643 — read_statute_books: take p_faction_id to fix the
-- multi-politician selection bug
--
-- User on a 3-politician account hit the Read the Statute Books
-- action from their bar-admitted politician (Germán Sandoval,
-- created 2026-06-02) and got rejected with 'not_advocate'. The
-- RPC's SELECT uses ORDER BY created_at ASC LIMIT 1 — same shape
-- the 20270558 fix patched for politician_resolve_due_elections —
-- so it was reading Esteban Fuentes (created 2026-05-29, MP, not
-- bar-admitted) instead. UI variant chooser reads ctx.faction.id
-- (the active politician via sessionStorage), so the two surfaces
-- disagreed on which row to grade.
--
-- Fix: the function now takes p_faction_id and looks up that
-- specific politician with the standard ownership guard
-- (id = auth.uid() OR linked_user_id = auth.uid()). Same pattern
-- accept_drawn_case (20270583) has used since the start. The
-- arg-less signature is DROP'd so stale callers fail loud rather
-- than silently grading the wrong politician.
--
-- The broader sweep — every other arg-less politician RPC that
-- uses ORDER BY created_at ASC LIMIT 1 — is its own follow-up,
-- flagged here so the next pass can pick it up.
--
-- Apply after 20270642.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- Signature change: the old arg-less version goes away so any
-- caller still on the old shape errors loud (PostgrREST will fail
-- the RPC lookup) rather than silently grading the wrong row.
DROP FUNCTION IF EXISTS public.read_statute_books();

CREATE OR REPLACE FUNCTION public.read_statute_books(p_faction_id uuid)
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
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;

    -- 20270643: select by the explicit p_faction_id with an ownership
    -- guard, not by oldest-first. accept_drawn_case (20270583 line
    -- 628) uses the same shape.
    SELECT * INTO v_pol FROM public.factions
     WHERE id = p_faction_id
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
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
       SET politician_skill              = GREATEST(0, COALESCE(politician_skill, 0)      + 2),
           politician_reputation         = GREATEST(0, COALESCE(politician_reputation, 0) - 1),
           try_case_cooldown_until_tick  = v_tick + 1
     WHERE id = v_pol.id
    RETURNING politician_skill, politician_reputation
         INTO v_new_cred, v_new_rep;

    RETURN jsonb_build_object(
        'success',             true,
        'action',              'read_statute_books',
        'skill_delta',         v_new_cred - COALESCE(v_pol.politician_skill, 0),
        'reputation_delta',    v_new_rep  - COALESCE(v_pol.politician_reputation, 0),
        'new_skill',           v_new_cred,
        'new_reputation',      v_new_rep,
        'cooldown_until_tick', v_tick + 1
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.read_statute_books(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.read_statute_books(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
