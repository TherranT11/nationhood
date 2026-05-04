-- 20260819_alliance_lc_helper_consolidation.sql
--
-- Audit consolidation. The peer-LC-deduction loop now appears in three
-- article helpers (Push C Bad Debt, Push D Syndicated Lending, Push E
-- Joint Equity), all doing the same thing:
--
--   FOR each active peer (excluding one)
--     UPDATE factions SET corp_lending_capital_max = GREATEST(0, ... - amt)
--     PERFORM recompute_finance_stats(peer)
--   END LOOP
--   RETURN peer count
--
-- Three duplications justifies a helper. Adds
-- _deduct_peer_lending_capital(alliance_id, exclude, amount) and
-- re-issues the three article helpers to call it. Behavior is
-- bit-for-bit identical to the existing implementations — pure
-- refactor, no logic changes.

BEGIN;

-- ── 1. Shared peer-deduction helper ──────────────────────────────
CREATE OR REPLACE FUNCTION _deduct_peer_lending_capital(
    p_alliance_id          UUID,
    p_excluded_faction_id  UUID,
    p_amount               NUMERIC
) RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_peer_id UUID;
    v_count   INT := 0;
BEGIN
    IF p_amount IS NULL OR p_amount <= 0 THEN RETURN 0; END IF;
    FOR v_peer_id IN
        SELECT faction_id
        FROM alliance_members
        WHERE alliance_id = p_alliance_id
          AND left_at_tick IS NULL
          AND faction_id <> p_excluded_faction_id
    LOOP
        UPDATE factions
        SET corp_lending_capital_max = GREATEST(
            0::numeric,
            COALESCE(corp_lending_capital_max, 5) - p_amount
        )
        WHERE id = v_peer_id;
        PERFORM recompute_finance_stats(v_peer_id);
        v_count := v_count + 1;
    END LOOP;
    RETURN v_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION _deduct_peer_lending_capital(UUID, UUID, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION _deduct_peer_lending_capital(UUID, UUID, NUMERIC) TO service_role;

COMMENT ON FUNCTION _deduct_peer_lending_capital(UUID, UUID, NUMERIC) IS
    'Shared loop: deduct p_amount from corp_lending_capital_max (clamped ≥ 0) on every active alliance member except p_excluded_faction_id, then recompute_finance_stats per peer. Returns peer count. Used by Bad Debt Mutual Aid, Syndicated Lending Portfolio, and Joint Equity Ventures runtime helpers.';


-- ── 2. Re-issue _apply_bad_debt_mutual_aid using the helper ──────
CREATE OR REPLACE FUNCTION _apply_bad_debt_mutual_aid(
    p_lender_faction_id UUID,
    p_default_amount    NUMERIC
) RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_threshold     CONSTANT NUMERIC := 20000000;
    v_share         CONSTANT NUMERIC := 0.15;
    v_lc_per_dollar CONSTANT NUMERIC := 50000000.0;
    v_alliance_id   UUID;
    v_lc_reduction  NUMERIC;
BEGIN
    IF p_default_amount IS NULL OR p_default_amount < v_threshold THEN
        RETURN 0;
    END IF;
    v_alliance_id := _alliance_member_has_article(p_lender_faction_id, 'bad_debt_mutual');
    IF v_alliance_id IS NULL THEN
        RETURN 0;
    END IF;

    v_lc_reduction := (p_default_amount * v_share) / v_lc_per_dollar;
    RETURN _deduct_peer_lending_capital(v_alliance_id, p_lender_faction_id, v_lc_reduction);
END;
$$;


-- ── 3. Re-issue _apply_syndicated_lending_rescue using the helper ──
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
BEGIN
    v_alliance_id := _alliance_member_has_article(p_over_leveraged_faction_id, 'syndicated_portfolio');
    IF v_alliance_id IS NULL THEN RETURN 0; END IF;

    SELECT count(*) INTO v_already_used
    FROM alliance_members
    WHERE alliance_id = v_alliance_id
      AND faction_id = p_over_leveraged_faction_id
      AND left_at_tick IS NULL
      AND lending_rescue_used_at_tick IS NOT NULL;
    IF v_already_used > 0 THEN RETURN 0; END IF;

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

    v_offset_delta := -(v_current_over - v_target_over);
    UPDATE factions
    SET corp_overleverage_offset = GREATEST(-10::numeric, LEAST(10::numeric,
        COALESCE(corp_overleverage_offset, 0) + v_offset_delta
    ))
    WHERE id = p_over_leveraged_faction_id;
    PERFORM recompute_finance_stats(p_over_leveraged_faction_id);

    PERFORM _deduct_peer_lending_capital(v_alliance_id, p_over_leveraged_faction_id, v_lc_per_peer);

    UPDATE alliance_members
    SET lending_rescue_used_at_tick = p_current_tick
    WHERE alliance_id = v_alliance_id
      AND faction_id = p_over_leveraged_faction_id
      AND left_at_tick IS NULL;

    RETURN 1;
END;
$$;


-- ── 4. Re-issue _apply_joint_equity_split using the helper ───────
CREATE OR REPLACE FUNCTION _apply_joint_equity_split(
    p_position_id           UUID,
    p_investor_faction_id   UUID
) RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_lc_per_peer  CONSTANT NUMERIC := 0.5;
    v_alliance_id  UUID;
    v_member_ids   UUID[];
    v_member_n     INT;
    v_share_pct    NUMERIC;
    v_split_json   JSONB;
BEGIN
    v_alliance_id := _alliance_member_has_article(p_investor_faction_id, 'joint_equity');
    IF v_alliance_id IS NULL THEN RETURN 0; END IF;

    SELECT array_agg(faction_id)
    INTO v_member_ids
    FROM alliance_members
    WHERE alliance_id = v_alliance_id AND left_at_tick IS NULL;

    v_member_n := COALESCE(array_length(v_member_ids, 1), 0);
    IF v_member_n <= 1 THEN RETURN 0; END IF;

    v_share_pct := ROUND(100.0 / v_member_n, 4);

    SELECT jsonb_build_object(
        'alliance_id', v_alliance_id,
        'members',     jsonb_agg(jsonb_build_object(
                            'faction_id', mid,
                            'share_pct',  v_share_pct
                       ))
    )
    INTO v_split_json
    FROM unnest(v_member_ids) AS mid;

    UPDATE equity_positions
    SET alliance_split = v_split_json,
        updated_at     = now()
    WHERE id = p_position_id;

    -- Investor excluded — they put up the cash via pay_out_equity;
    -- peers contribute lending capacity.
    RETURN _deduct_peer_lending_capital(v_alliance_id, p_investor_faction_id, v_lc_per_peer);
END;
$$;

COMMIT;

NOTIFY pgrst, 'reload schema';
