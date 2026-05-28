-- ─────────────────────────────────────────────────────────────────────────────
-- Re-align corp_share_liquidation_value to corp_trade's linear flat-fill rule.
--
-- 20270325 introduced a SELL-SIDE mark for held public stock so net worth
-- couldn't be inflated by pumping share_price. That formula was the exact
-- inverse of the +5%-per-share BONDING curve in effect at the time:
--     liquidation(S, P) = P · (1 − 1.05^−S) / 0.05
-- corp_trade has since switched to a flat-fill LINEAR rule (20270178 →
-- 20270199): a single trade fills the whole quantity at the current price
-- and moves new_price = P·(1 − 0.01·N). The bonding-curve formula no longer
-- inverts the sell side; net-worth dashboards drift from actual sell
-- proceeds — the gap is small per trade but compounds for big positions.
--
-- New formula under the linear rule. Per 20270199:132-136, a single trade
-- caps at p_quantity = floor(1/v_pct) - 1 = 99 shares (anything ≥ 100 drives
-- new_price ≤ 0 and gets price_floor'd). Liquidating S > 99 therefore takes
-- multiple trades. Greedy (sell 99 per trade until exhausted) is optimal —
-- trade-order doesn't matter for the total proceeds because the slippage
-- term is symmetric in trade sizes (Σproceeds = SP − pct·P·Σ_{i<j} k_i·k_j),
-- and concentrating into 99-share trades minimises that quadratic loss.
--
-- Closed form for S shares at price P (with pct = 0.01, M = 99,
-- factor = 1 − M·pct = 0.01):
--     k = ⌊S / M⌋,   r = S − M·k
--     liquidation(S, P) = (P / pct) · (1 − factor^k · (1 − pct·r))
--                       = 100·P · (1 − 0.01^k · (1 − 0.01·r))
--
-- Sanity:
--   S=1   →  P              (single trade of 1 at P)
--   S=99  →  99·P
--   S=100 →  99.01·P        (99 at P, then 1 at 0.01·P)
--   S=198 →  99.99·P        (99 + 99 at 0.01·P)
--   S→∞   →  100·P          (asymptote: the curve never gives more)
--
-- Bounded: the 100·P asymptote is real. Under the linear-flat rule with the
-- 99-share cap, you genuinely can't extract more than 100·P of value from
-- the curve regardless of how many shares you hold. The pre-bonding-curve
-- S × P mark always overstated; the bonding-curve mark only happened to
-- match because of the exponential shape; this linear mark matches what
-- the actual sell mechanism delivers.
--
-- ONE SOURCE OF TRUTH: this formula is mirrored in
-- js/game/corp-valuation.js → corpShareLiquidationValue. Both must change
-- together. If corp_trade's v_pct ever moves off 0.01, both consumers of
-- the rate need to follow.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.corp_share_liquidation_value(p_price numeric, p_shares numeric)
RETURNS numeric
LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE
           WHEN p_price IS NULL OR p_shares IS NULL OR p_shares <= 0 THEN 0
           ELSE 100 * p_price * (1 - power(0.01, floor(p_shares / 99))
                                     * (1 - 0.01 * (p_shares - 99 * floor(p_shares / 99))))
         END;
$$;

GRANT EXECUTE ON FUNCTION public.corp_share_liquidation_value(numeric, numeric) TO authenticated;

COMMENT ON FUNCTION public.corp_share_liquidation_value(numeric, numeric) IS
    'Sell-side (liquidation) value of a held public-stock position under corp_trade''s 1%-per-share flat-fill linear curve (20270199). Greedy 99-per-trade closed form: 100·P·(1 − 0.01^k·(1 − 0.01·r)) with k = ⌊S/99⌋, r = S − 99·k. Bounded at 100·P. Mirror in js/game/corp-valuation.js must change in lockstep.';

NOTIFY pgrst, 'reload schema';
