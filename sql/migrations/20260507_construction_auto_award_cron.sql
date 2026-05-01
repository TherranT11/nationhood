-- ══════════════════════════════════════════════════════════════
-- Construction Operations: Auto-Award (Phase C of bid-modal redesign)
--
-- Wraps award_construction_contract for cron consumption. Walks every
-- AI/government contract that has reached its expires_at_tick and is
-- still 'open', then calls the per-contract award RPC.
--
-- Designed to be called from a pg_cron job that runs every minute (see
-- the cron.schedule snippet posted alongside this migration). pg_cron
-- jobs run without an authenticated JWT, so auth.uid() is NULL inside
-- the inner award call — the AI/government auth branch passes.
--
-- Scope: AI/government contracts ONLY (issuer_faction_id IS NULL).
-- Player-issued contracts still wait for the human issuer to award via
-- their own UI (no auto-resolution path for those — by design).
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION auto_award_expired_construction_contracts()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tick      INT;
    v_contract  RECORD;
    v_result    JSONB;
    v_awarded   INT := 0;
    v_cancelled INT := 0;
BEGIN
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN 0;
    END IF;

    FOR v_contract IN
        SELECT id
        FROM corp_contracts
        WHERE status              = 'open'
          AND issuer_faction_id   IS NULL                  -- AI / government only
          AND expires_at_tick     IS NOT NULL
          AND expires_at_tick     <= v_tick
        ORDER BY expires_at_tick  -- oldest first, deterministic
    LOOP
        v_result := award_construction_contract(v_contract.id);

        IF COALESCE((v_result ->> 'success')::boolean, false) THEN
            -- award_construction_contract returns success=true with
            -- winner=null when there were zero bids (contract gets
            -- cancelled). Track those separately for visibility.
            IF v_result -> 'winner' IS NULL OR v_result ->> 'winner' = 'null' THEN
                v_cancelled := v_cancelled + 1;
            ELSE
                v_awarded := v_awarded + 1;
            END IF;
        ELSE
            -- Log but don't abort the loop — one bad contract
            -- shouldn't stop the rest from being processed.
            RAISE NOTICE 'auto-award failed for contract %: %',
                v_contract.id, v_result ->> 'error';
        END IF;
    END LOOP;

    IF v_awarded > 0 OR v_cancelled > 0 THEN
        RAISE NOTICE 'auto-award sweep: % awarded, % cancelled (no bids), tick %',
            v_awarded, v_cancelled, v_tick;
    END IF;

    RETURN v_awarded + v_cancelled;
END;
$$;

-- Lock down execution: the cron / service_role calls this. Authenticated
-- users have no business triggering an AI-contract resolution sweep, and
-- the per-contract auth branch in award_construction_contract would
-- reject their attempts anyway — but keep them out at the wrapper level
-- to avoid any DoS via repeated calls.
REVOKE EXECUTE ON FUNCTION auto_award_expired_construction_contracts() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION auto_award_expired_construction_contracts() FROM authenticated;
GRANT  EXECUTE ON FUNCTION auto_award_expired_construction_contracts() TO   service_role;

COMMENT ON FUNCTION auto_award_expired_construction_contracts() IS
  'Cron-driven sweep that awards every AI/government contract whose expires_at_tick has passed. Calls award_construction_contract per match. Returns the number of contracts processed. Service-role only — pg_cron schedules this every minute.';
