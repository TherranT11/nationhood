-- ════════════════════════════════════════════════════════════════════
-- 20270554 — Re-run private-corp 100-share-cap normalisation
--
-- 20270444 introduced the fixed 100-share cap for private corps and
-- shipped a one-shot DO-block backfill that normalised every existing
-- 1000-base corp to the 100 cap. The new respond_corp_investment_offer
-- + sell_corp_equity bodies shipped in the same migration, so any
-- accept-offer / sell-back after 20270444 was supposed to stay on the
-- cap.
--
-- Production audit (Monteq Building Group, June 2026 game state):
--   Wu Yi-feng  (founder)   1000 sh   55%
--   Erik Mogensen (director) 818 sh   45%
--   total                   1818 sh
--
-- 1000 + ROUND(1000 × 45/55) = 1818 — the exact 20270212 dilution-mint
-- signature for a 45% accept on a brand-new private corp. So either
-- (a) the 20270444 RPC bodies didn't replace cleanly on this DB (a
-- stale function definition is still in pg_proc), or (b) the accept
-- raced the migration deploy, or (c) some other path bypassed the new
-- function. Without DB access we can't tell which — but the data is
-- visibly wrong on the corp page and the corporations list, and
-- viewerStakePct's percentage display now leans entirely on the
-- shares table being correct.
--
-- This migration re-runs the IDENTICAL backfill body from 20270444 —
-- safe on every code path because:
--   • The WHERE clause filters out corps already at exactly 100, so
--     this is a true no-op for everything that doesn't need fixing.
--   • Proportions are preserved (each holder rescaled by shares ×
--     100 / shares_outstanding; founder absorbs the rounding remainder
--     so the cap lands exactly at 100).
--   • Sweeps zero-share rows (e.g. director slots that round to 0).
--
-- The RPC bodies are NOT re-issued here. If the 20270444 function
-- replace genuinely failed in prod, that's a separate problem — but
-- re-running the same CREATE OR REPLACE would be no different from
-- 20270444 itself (which apparently didn't take). Fixing the live
-- data is what unblocks the immediate display bug; if a future accept
-- mints 1000 again, this backfill is safe to re-run, and the function
-- mystery becomes diagnosable from a confirmed-bad reproduction.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

DO $$
DECLARE
    r           RECORD;
    v_dir_total int;
    v_founder   int;
BEGIN
    FOR r IN
        SELECT id, owner_faction_id, shares_outstanding
          FROM entrepreneur_corps
         WHERE COALESCE(listing, 'private') = 'private'
           AND shares_outstanding IS NOT NULL
           AND shares_outstanding <> 100
    LOOP
        SELECT COALESCE(SUM(GREATEST(1, ROUND(shares * 100.0 / r.shares_outstanding))), 0)::int
          INTO v_dir_total
          FROM corp_shareholdings
         WHERE corp_id = r.id
           AND holder_faction_id <> r.owner_faction_id
           AND shares > 0;

        UPDATE corp_shareholdings
           SET shares = GREATEST(1, ROUND(shares * 100.0 / r.shares_outstanding))::int
         WHERE corp_id = r.id
           AND holder_faction_id <> r.owner_faction_id
           AND shares > 0;

        v_founder := GREATEST(0, 100 - v_dir_total);
        INSERT INTO corp_shareholdings (corp_id, holder_faction_id, shares)
        VALUES (r.id, r.owner_faction_id, v_founder)
        ON CONFLICT (corp_id, holder_faction_id) DO UPDATE SET shares = v_founder;

        DELETE FROM corp_shareholdings WHERE corp_id = r.id AND shares <= 0;

        UPDATE entrepreneur_corps
           SET shares_outstanding = 100, updated_at = now()
         WHERE id = r.id;
    END LOOP;
END $$;

COMMIT;
