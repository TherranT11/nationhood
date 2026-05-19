-- ════════════════════════════════════════════════════════════════════
-- ENTREPRENEUR CORPS — re-snap shares_outstanding to 100 (data fix)
-- ════════════════════════════════════════════════════════════════════
-- Between 20270156 (the 100-share backfill in go_public) and 20270157
-- (the fixed-supply corp_trade that stops minting), corps could be
-- traded under the old minting curve and grow their supply past the
-- backfilled 100. Observed in alpha: Starliner 132 outstanding,
-- Wu Bank 105 outstanding. 20270157 stops the bleeding going forward
-- but doesn't normalise the existing data — this migration does.
--
-- Rule: shares_outstanding := GREATEST(100, Σ holdings). Two cases:
--   • Σ holdings ≤ 100 (the realistic alpha state — Starliner Σ=52,
--     Wu Bank Σ=25):  outstanding becomes 100, available = 100 − Σ.
--     Clean snap to the IPO basis.
--   • Σ holdings > 100 (heavy pre-20270157 minting): outstanding
--     becomes Σ — preserves the invariant Σheld ≤ outstanding so
--     `available` never goes negative; supply is "stuck" at Σ until
--     sells return shares to the float (corp_trade SELL still works
--     normally; sales reduce Σheld and unfreeze buys progressively).
--     Self-heals.
--
-- Intentionally LEFT ALONE:
--   • corp_shareholdings.shares — every share was paid for; never
--     take them away from the holders.
--   • share_price — the curve-discovered price stays. Recalibrating
--     it to keep market cap constant would re-price existing positions
--     by fiat. We accept the displayed market cap dropping
--     (e.g. Starliner: 132×952,988 = $125.8M → 100×952,988 = $95.3M);
--     individual positions' value (your shares × price) is unchanged.
--   • treasury_cash — real money. Untouched.
--
-- Founder ownership % rises mechanically because the denominator
-- shrinks (Starliner founder: 52/132 = 39% → 52/100 = 52%). This is
-- honest: they bought those extra 32 shares and paid for them.
--
-- Idempotent (re-runnable; GREATEST stabilises). No schema change,
-- no function change. Should be applied AFTER 20270157 — otherwise
-- the next buy mints again and undoes the snap.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

UPDATE entrepreneur_corps c
   SET shares_outstanding = GREATEST(
       100,
       COALESCE((SELECT SUM(shares) FROM corp_shareholdings WHERE corp_id = c.id), 0)
   )
 WHERE listing = 'public';

COMMIT;

-- ── ROLLBACK ──
-- No automatic rollback: the prior over-supply values are not
-- preserved. If a corp needs its old shares_outstanding back, set it
-- manually by UPDATE. The held positions and share price were never
-- touched, so reverting only the supply column restores the exact
-- pre-snap state.
