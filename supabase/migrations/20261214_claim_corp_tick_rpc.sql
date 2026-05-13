-- ════════════════════════════════════════════════════════════════
-- claim_corp_tick() — atomic corp-tick claim that bypasses
-- PostgREST's column schema cache.
--
-- This RPC is the permanent fix for the recurring
--   "Tick claim failed: column shard.corp_last_processed_tick does not exist"
-- error. Past fixes only addressed the schema side (adding the
-- column with a fresh-timestamp migration). But the column already
-- exists in PostgreSQL — every SQL-editor query confirms it. The
-- error comes from PostgREST, whose schema cache occasionally
-- misses or delays processing NOTIFY pgrst, 'reload schema' (multi-
-- replica deployment, network blip, etc.). The deployed
-- advance-corp-tick edge function uses
--   supabase.from('shard').select('corp_last_processed_tick')
-- which goes through PostgREST and trusts its cached schema. When
-- the cache is stale, every cron fire errors regardless of the
-- actual DB state.
--
-- SECURITY DEFINER RPCs are introspected by name only; their body
-- runs in pg/plpgsql where the live schema is consulted at exec
-- time. By moving the read + check + claim into one RPC, the edge
-- function never asks PostgREST about the column directly. The
-- cache can stay stale forever and the corp tick still runs.
--
-- The function also folds the time-based gating + the atomic
-- conditional UPDATE into a single round-trip, so concurrent cron
-- fires can't double-claim the same tick (Postgres serializes the
-- UPDATE on the row).
-- ════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.claim_corp_tick(
    p_force   BOOLEAN DEFAULT false,
    p_run_now BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id                    UUID;
    v_current_tick          INT;
    v_shard_date            TEXT;
    v_next_tick_at          TIMESTAMPTZ;
    v_tick_interval_hours   INT;
    v_corp_last_processed   INT;
    v_now                   TIMESTAMPTZ := NOW();
    v_interval_ms           BIGINT;
    v_last_advance_at       TIMESTAMPTZ;
    v_corp_due_at           TIMESTAMPTZ;
    v_corp_due_in_ms        BIGINT;
    v_prev_marker           INT;
    v_claimed_rows          INT;
BEGIN
    SELECT id,
           current_tick,
           "current_date",
           next_tick_at,
           tick_interval_hours,
           corp_last_processed_tick
      INTO v_id, v_current_tick, v_shard_date, v_next_tick_at,
           v_tick_interval_hours, v_corp_last_processed
      FROM public.shard
     WHERE name = 'Alpha Shard'
     LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('status', 'shard_not_found');
    END IF;

    -- Idempotency: don't re-process a tick we've already done.
    IF NOT p_force AND v_current_tick <= COALESCE(v_corp_last_processed, -1) THEN
        RETURN jsonb_build_object(
            'status', 'already_processed',
            'tick', v_current_tick
        );
    END IF;

    -- Time gating: only run at the midpoint of the tick interval
    -- (e.g. 4 h after tick advance when intervals are 8 h). Skipped
    -- in force mode and in run_now mode (manual debug invocations).
    IF NOT p_force AND NOT p_run_now AND v_next_tick_at IS NOT NULL THEN
        v_interval_ms := COALESCE(v_tick_interval_hours, 8)::BIGINT * 3600000;
        v_last_advance_at := v_next_tick_at - make_interval(secs => v_interval_ms / 1000.0);
        v_corp_due_at     := v_last_advance_at + make_interval(secs => (v_interval_ms / 2) / 1000.0);

        IF v_now < v_corp_due_at THEN
            v_corp_due_in_ms := GREATEST(
                0,
                EXTRACT(EPOCH FROM (v_corp_due_at - v_now))::BIGINT * 1000
            );
            RETURN jsonb_build_object(
                'status', 'not_due',
                'tick', v_current_tick,
                'corp_due_in_ms', v_corp_due_in_ms
            );
        END IF;
    END IF;

    -- Atomic claim. The conditional WHERE serializes concurrent
    -- cron fires: exactly one UPDATE wins, every other sees 0
    -- affected rows and reports already_claimed.
    v_prev_marker := v_corp_last_processed;
    IF p_force THEN
        UPDATE public.shard
           SET corp_last_processed_tick = v_current_tick
         WHERE id = v_id;
    ELSE
        UPDATE public.shard
           SET corp_last_processed_tick = v_current_tick
         WHERE id = v_id
           AND (corp_last_processed_tick IS NULL OR corp_last_processed_tick < v_current_tick);
    END IF;
    GET DIAGNOSTICS v_claimed_rows = ROW_COUNT;

    IF v_claimed_rows = 0 AND NOT p_force THEN
        RETURN jsonb_build_object(
            'status', 'already_claimed',
            'tick', v_current_tick
        );
    END IF;

    RETURN jsonb_build_object(
        'status', 'claimed',
        'tick', v_current_tick,
        'current_date', v_shard_date,
        'previous_corp_last_processed_tick', v_prev_marker
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_corp_tick(BOOLEAN, BOOLEAN)
    TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
