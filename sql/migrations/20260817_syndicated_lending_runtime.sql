-- 20260817_syndicated_lending_runtime.sql
--
-- Strategic Alliances — Push D: Syndicated Lending Portfolio runtime.
--
-- Article spec: "If any member corp's Overleverage hits 8+ (and has
-- not yet hit 10), every other member corp automatically absorbs
-- −0.5 Lending Capital and the over-leveraged member's leverage drops
-- back to 7. One-shot per member per alliance term — and if Overleverage
-- already hit 10, no rescue."
--
-- Pieces:
--   1. New nullable column alliance_members.lending_rescue_used_at_tick
--      Tracks the one-shot. Set when the rescue fires for that
--      member; rescue is skipped if already populated. Resets when a
--      member leaves and re-joins (new alliance_members row).
--
--   2. Helper RPC _apply_syndicated_lending_rescue(faction, current_tick)
--      — checks article membership + the [8, 10) band + one-shot flag,
--      adjusts the member's corp_overleverage_offset so the visible
--      stat drops to 7, deducts 0.5 from each peer's
--      corp_lending_capital_max, recomputes stats for all touched
--      corps, marks the one-shot flag. Returns 0 / 1 for caller.
--
--   3. Tick-driven RPC process_syndicated_lending_rescues(current_tick)
--      scans every Finance corp that is an active member of an
--      alliance with the article ratified AND has overleverage in
--      [8, 10) AND hasn't used the rescue yet. Calls the helper per
--      candidate. Returns count rescued.
--
--   4. Tick processor wires process_syndicated_lending_rescues into
--      advance-tick after the alliance dissolution sweep (4f).
--
-- Mechanics note on the overleverage drop:
-- corp_overleverage is recomputed by recompute_finance_stats from
--   GREATEST(0, LEAST(10, derived_reserve_ratio + corp_overleverage_offset))
-- where derived_reserve_ratio = (1 - cash/(cash+outstanding)) * 10. To
-- drop visible from current to 7, the helper subtracts (current - 7)
-- from corp_overleverage_offset. The offset persists post-rescue —
-- the bank has been given structural lending headroom by the alliance.

BEGIN;

-- ── 1. One-shot tracking column ──────────────────────────────────
ALTER TABLE alliance_members
    ADD COLUMN IF NOT EXISTS lending_rescue_used_at_tick INT;

COMMENT ON COLUMN alliance_members.lending_rescue_used_at_tick IS
    'Tick at which the Syndicated Lending Portfolio rescue fired for this member. NULL = not used. One-shot per member per alliance term; the rescue is skipped if this is set. Resets naturally when a member leaves + re-joins (new alliance_members row).';


-- ── 2. Per-member rescue helper ──────────────────────────────────
CREATE OR REPLACE FUNCTION _apply_syndicated_lending_rescue(
    p_over_leveraged_faction_id UUID,
    p_current_tick              INT
) RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_lc_per_peer    CONSTANT NUMERIC := 0.5;
    v_target_over    CONSTANT NUMERIC := 7;
    v_band_floor     CONSTANT NUMERIC := 8;
    v_band_ceiling   CONSTANT NUMERIC := 10;
    v_alliance_id    UUID;
    v_corp           factions%ROWTYPE;
    v_current_over   NUMERIC;
    v_offset_delta   NUMERIC;
    v_already_used   INT;
    v_peer_id        UUID;
    v_peer_count     INT := 0;
BEGIN
    -- Fast no-op: not in a Syndicated Lending alliance.
    v_alliance_id := _alliance_member_has_article(p_over_leveraged_faction_id, 'syndicated_portfolio');
    IF v_alliance_id IS NULL THEN RETURN 0; END IF;

    -- One-shot guard.
    SELECT count(*) INTO v_already_used
    FROM alliance_members
    WHERE alliance_id = v_alliance_id
      AND faction_id = p_over_leveraged_faction_id
      AND left_at_tick IS NULL
      AND lending_rescue_used_at_tick IS NOT NULL;
    IF v_already_used > 0 THEN RETURN 0; END IF;

    -- Re-load the corp and re-check the band server-side. The
    -- tick-processor scan filtered for [8, 10), but a concurrent
    -- pay_out_loan / cash event could have moved the stat between
    -- scan and rescue. Fail closed if outside the band — never rescue
    -- a corp at 10+ (per spec) or below 8.
    SELECT * INTO v_corp FROM factions
    WHERE id = p_over_leveraged_faction_id
      AND faction_type = 'corporation'
      AND corp_sector = 'Finance'
    FOR UPDATE;
    IF v_corp.id IS NULL THEN RETURN 0; END IF;
    v_current_over := COALESCE(v_corp.corp_overleverage, 0);
    IF v_current_over < v_band_floor OR v_current_over >= v_band_ceiling THEN
        RETURN 0;
    END IF;

    -- Offset delta to drop visible overleverage to the target.
    -- recompute folds offset into the visible value, so subtracting
    -- (current - target) from offset moves the visible value down by
    -- exactly that much. Negative delta is fine.
    v_offset_delta := -(v_current_over - v_target_over);
    UPDATE factions
    SET corp_overleverage_offset = GREATEST(-10::numeric, LEAST(10::numeric,
        COALESCE(corp_overleverage_offset, 0) + v_offset_delta
    ))
    WHERE id = p_over_leveraged_faction_id;
    PERFORM recompute_finance_stats(p_over_leveraged_faction_id);

    -- Each peer: −0.5 Lending Capital (max). Same pattern as
    -- _apply_bad_debt_mutual_aid — modify the persistent base, not
    -- the derived value, then recompute.
    FOR v_peer_id IN
        SELECT m.faction_id
        FROM alliance_members m
        WHERE m.alliance_id = v_alliance_id
          AND m.left_at_tick IS NULL
          AND m.faction_id <> p_over_leveraged_faction_id
    LOOP
        UPDATE factions
        SET corp_lending_capital_max = GREATEST(0::numeric,
            COALESCE(corp_lending_capital_max, 5) - v_lc_per_peer
        )
        WHERE id = v_peer_id;
        PERFORM recompute_finance_stats(v_peer_id);
        v_peer_count := v_peer_count + 1;
    END LOOP;

    -- Mark the one-shot.
    UPDATE alliance_members
    SET lending_rescue_used_at_tick = p_current_tick
    WHERE alliance_id = v_alliance_id
      AND faction_id = p_over_leveraged_faction_id
      AND left_at_tick IS NULL;

    RETURN 1;
END;
$$;

REVOKE EXECUTE ON FUNCTION _apply_syndicated_lending_rescue(UUID, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION _apply_syndicated_lending_rescue(UUID, INT) TO service_role;

COMMENT ON FUNCTION _apply_syndicated_lending_rescue(UUID, INT) IS
    'Syndicated Lending Portfolio rescue. If the given Finance corp is in an alliance with the article ratified, has overleverage in [8, 10), and hasn''t used the rescue this term, drops their visible overleverage to 7 (via corp_overleverage_offset adjustment) and deducts 0.5 corp_lending_capital_max from each other active member. One-shot per member per alliance term. Returns 1 on rescue, 0 on no-op.';


-- ── 3. Tick-driven sweep ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION process_syndicated_lending_rescues(
    p_current_tick INT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_candidate UUID;
    v_rescued   INT := 0;
BEGIN
    -- Single query finds every Finance corp that's a candidate for
    -- a rescue this tick. The helper re-validates each candidate
    -- under FOR UPDATE so a stat change between scan and rescue
    -- can't fire an invalid rescue.
    FOR v_candidate IN
        SELECT DISTINCT f.id
        FROM factions f
        JOIN alliance_members  m  ON m.faction_id  = f.id  AND m.left_at_tick IS NULL
        JOIN alliance_articles ar ON ar.alliance_id = m.alliance_id
                                  AND ar.status = 'active'
                                  AND ar.article_id = 'syndicated_portfolio'
        JOIN strategic_alliances a ON a.id = m.alliance_id AND a.status = 'active'
        WHERE f.faction_type = 'corporation'
          AND f.corp_sector  = 'Finance'
          AND f.abandoned_at IS NULL
          AND COALESCE(f.corp_overleverage, 0) >= 8
          AND COALESCE(f.corp_overleverage, 0) <  10
          AND m.lending_rescue_used_at_tick IS NULL
    LOOP
        v_rescued := v_rescued + _apply_syndicated_lending_rescue(v_candidate, p_current_tick);
    END LOOP;

    RETURN jsonb_build_object('success', true, 'rescued_count', v_rescued);
END;
$$;

GRANT EXECUTE ON FUNCTION process_syndicated_lending_rescues(INT) TO service_role;

COMMENT ON FUNCTION process_syndicated_lending_rescues(INT) IS
    'Tick-driven sweep. Finds every Finance corp in a Syndicated-Lending alliance with overleverage in [8, 10) and an unused rescue, then fires _apply_syndicated_lending_rescue against each. Called once per tick from advance-tick.';

COMMIT;

NOTIFY pgrst, 'reload schema';
