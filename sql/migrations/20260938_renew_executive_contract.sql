-- 20260938_renew_executive_contract.sql
--
-- Manual executive contract renewal. Replaces the unintentional
-- "auto-renewal" behavior where createInitialExecutiveRoster was
-- re-firing on every Actions-tab page load and re-hiring execs
-- into any role that wasn't currently active.
--
-- Renewal terms (matches the player-spec):
--   • Salary: existing salary + 15% counter-offer markup. Fixed
--     value (no per-exec hash) so client-side preview and server-
--     applied salary always agree — single source of truth via the
--     EXEC_RENEWAL_MARKUP_PCT constant in actions.html. Per-exec
--     variance was deferred during audit because the original two
--     hash implementations (JS char codes vs PG raw bytes) never
--     produced matching values; revisit when there's a row-stored
--     markup column to read from.
--   • Length: 4 years (48 ticks).
--   • Cost: free.
--
-- Gating:
--   • Caller's auth.uid() must own the corp faction (auth.uid() =
--     factions.id OR factions.linked_user_id).
--   • Exec row must still be status='active'. Once status='expired'
--     (set by the advance-corp-tick expiry pass when contract_end_tick
--     drops below the current tick), the row is unrenewable — player
--     must use Executive Search to refill.

BEGIN;

CREATE OR REPLACE FUNCTION renew_executive_contract(p_exec_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_caller       UUID := auth.uid();
    v_exec         corp_executives%ROWTYPE;
    v_tick         INT;
    v_markup_pct   INT  := 15;  -- fixed; mirrors EXEC_RENEWAL_MARKUP_PCT in actions.html
    v_new_salary   BIGINT;
    v_new_end_tick INT;
BEGIN
    SELECT * INTO v_exec FROM corp_executives WHERE id = p_exec_id FOR UPDATE;
    IF v_exec.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_found');
    END IF;
    IF v_exec.status <> 'active' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_active');
    END IF;

    -- Linked-account aware ownership check (same pattern as the
    -- presidential bill-sign fix in 20260936). auth.uid() can be the
    -- corp faction's id directly OR the human user's auth UUID stored
    -- on factions.linked_user_id.
    IF v_caller IS NULL OR NOT EXISTS (
        SELECT 1 FROM factions f
        WHERE f.id = v_exec.faction_id
          AND (f.id = v_caller OR f.linked_user_id = v_caller)
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;

    v_new_salary   := ROUND(COALESCE(v_exec.salary_per_year, 0) * (100 + v_markup_pct) / 100.0)::BIGINT;
    v_new_end_tick := v_tick + 48;  -- 4 years × 12 ticks

    UPDATE corp_executives SET
        salary_per_year     = v_new_salary,
        contract_years      = 4,
        contract_start_tick = v_tick,
        contract_end_tick   = v_new_end_tick,
        updated_at          = NOW()
    WHERE id = p_exec_id;

    RETURN jsonb_build_object(
        'success',           true,
        'exec_id',           p_exec_id,
        'markup_pct',        v_markup_pct,
        'new_salary',        v_new_salary,
        'contract_end_tick', v_new_end_tick
    );
END;
$$;

GRANT EXECUTE ON FUNCTION renew_executive_contract(UUID) TO authenticated;

COMMENT ON FUNCTION renew_executive_contract(UUID) IS
    'Player-triggered executive renewal. Salary +15% (fixed; mirrored client-side via EXEC_RENEWAL_MARKUP_PCT), 4yr term, free. Linked-account aware. Refuses non-active execs.';

NOTIFY pgrst, 'reload schema';

COMMIT;
