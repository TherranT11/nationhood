-- ════════════════════════════════════════════════════════════════════
-- Entrepreneur net worth — consolidate to one source of truth.
-- ════════════════════════════════════════════════════════════════════
-- Before this migration, entrepreneur net worth was computed in TWO
-- places that disagreed on three points:
--
--   1. PUBLIC holdings
--      Server (get_entrepreneur_net_worth → leaderboard):
--        Σ shares × share_price                — pumpable
--      Client (entrepreneur-dashboard.html → home page):
--        Σ corpShareLiquidationValue(shares, share_price)  — pump-proof
--      (The 20270325 + 20270367 chain meant to fix the server, but the
--      live DB has been observed running the older 20270256 body —
--      same drift pattern as corp_trade pre-20270365.)
--
--   2. PRIVATE-with-shares holdings
--      Server: shares / shares_outstanding × entrepreneur_corp_book_value
--      Client: shares × share_price            (stale IPO seed/20)
--      Structurally different formulas, not a sync issue.
--
--   3. PRIVATE-without-shares founded corps
--      Server: full entrepreneur_corp_book_value to the owner
--      Client: $0 — the home page only counted corp_shareholdings rows
--      and silently dropped founders whose corp never IPO'd.
--
-- Visible symptom: Erik Mogensen shows $217.23M on his home page and
-- $384.9M on the leaderboard, same moment. The dashboard comment that
-- claimed it "Mirrors get_entrepreneur_net_worth" was aspirational.
--
-- THE CONSOLIDATION
-- ─────────────────
-- One SQL helper, entrepreneur_net_worth_components(faction_id), is the
-- ONLY place the formula lives. Two callers delegate to it:
--
--   get_entrepreneur_net_worth()       — leaderboard (ranked list).
--   get_my_net_worth_breakdown()       — home page (single faction
--                                        with the components broken
--                                        out for the "cash $X · holdings $Y"
--                                        subline).
--
-- Whichever surface displays a figure, both reach the same SQL helper
-- via their respective RPC, so there's no way for them to drift again.
--
-- ALSO RE-APPLIED HERE (paranoia)
-- ───────────────────────────────
-- corp_share_liquidation_value body from 20270367. The helper depends
-- on this for the public-holdings mark. If the live DB happens to be
-- running the pre-20270367 bonding-curve body, the helper's number
-- would silently diverge from the JS corpShareLiquidationValue mirror
-- in js/game/corp-valuation.js. A CREATE OR REPLACE here is a no-op
-- when 20270367 has already been applied and a fix when it hasn't.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Re-apply corp_share_liquidation_value (linear flat-fill) ──
-- Byte-for-byte identical to 20270367. See that file's header for
-- formula derivation. Idempotent CREATE OR REPLACE.
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

-- ── 2. The single formula: per-faction net-worth components ──
-- Cash + three disjoint holding buckets. Disjoint by construction:
--   public         → c.listing = 'public'
--   private_share  → c.listing = 'private' AND shares_outstanding > 0
--   private_own    → c.listing = 'private' AND shares_outstanding = 0
-- so a single corp contributes to exactly one bucket and nothing
-- double-counts.
--
-- Returns numerics (not bigints) so the caller can round at the
-- display boundary; rounding earlier would compound across the four
-- buckets and produce a total off-by-one from the leaderboard rank.
CREATE OR REPLACE FUNCTION public.entrepreneur_net_worth_components(p_faction_id uuid)
RETURNS TABLE (
    cash                   numeric,
    public_holdings        numeric,
    private_holdings_share numeric,
    private_holdings_own   numeric,
    total                  numeric
)
LANGUAGE sql STABLE
AS $$
  WITH
  c_cash AS (
    SELECT GREATEST(0, COALESCE(party_funds, 0))::numeric AS v
      FROM factions
     WHERE id = p_faction_id AND faction_type = 'entrepreneur'
  ),
  c_pub AS (
    SELECT COALESCE(SUM(corp_share_liquidation_value(c.share_price, h.shares::numeric)), 0)::numeric AS v
      FROM corp_shareholdings h
      JOIN entrepreneur_corps c ON c.id = h.corp_id
     WHERE h.holder_faction_id = p_faction_id
       AND c.listing = 'public'
  ),
  c_priv_held AS (
    SELECT COALESCE(SUM(h.shares::numeric / NULLIF(c.shares_outstanding, 0)
                        * entrepreneur_corp_book_value(c.id)), 0)::numeric AS v
      FROM corp_shareholdings h
      JOIN entrepreneur_corps c ON c.id = h.corp_id
     WHERE h.holder_faction_id = p_faction_id
       AND c.listing = 'private' AND COALESCE(c.shares_outstanding, 0) > 0
  ),
  c_priv_own AS (
    SELECT COALESCE(SUM(entrepreneur_corp_book_value(c.id)), 0)::numeric AS v
      FROM entrepreneur_corps c
     WHERE c.owner_faction_id = p_faction_id
       AND c.listing = 'private' AND COALESCE(c.shares_outstanding, 0) = 0
  )
  SELECT
    COALESCE((SELECT v FROM c_cash), 0)      AS cash,
    (SELECT v FROM c_pub)                    AS public_holdings,
    (SELECT v FROM c_priv_held)              AS private_holdings_share,
    (SELECT v FROM c_priv_own)               AS private_holdings_own,
    COALESCE((SELECT v FROM c_cash), 0)
      + (SELECT v FROM c_pub)
      + (SELECT v FROM c_priv_held)
      + (SELECT v FROM c_priv_own)           AS total;
$$;

GRANT EXECUTE ON FUNCTION public.entrepreneur_net_worth_components(uuid) TO authenticated;

-- ── 3. Leaderboard delegates to the helper ──
-- Replaces the 20270256 / 20270325 body. The CTE used to inline the
-- formula four ways; now it just iterates the helper per entrepreneur
-- and sorts. The helper IS the formula.
CREATE OR REPLACE FUNCTION public.get_entrepreneur_net_worth()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH ent AS (
    SELECT id, faction_name, leader_first_name, leader_last_name
      FROM factions
     WHERE faction_type = 'entrepreneur' AND abandoned_at IS NULL
  ),
  scored AS (
    SELECT e.id, e.faction_name, e.leader_first_name, e.leader_last_name,
           (entrepreneur_net_worth_components(e.id)).total AS net_worth
      FROM ent e
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'faction_id', id,
           'name', COALESCE(NULLIF(btrim(concat_ws(' ', leader_first_name, leader_last_name)), ''),
                            faction_name, 'Unknown'),
           'net_worth', ROUND(net_worth)::bigint
         ) ORDER BY net_worth DESC, faction_name ASC), '[]'::jsonb)
    FROM scored;
$$;

GRANT EXECUTE ON FUNCTION public.get_entrepreneur_net_worth() TO authenticated;

COMMENT ON FUNCTION public.get_entrepreneur_net_worth() IS
    'Ranked entrepreneur net worth for the Character page leaderboard. Delegates per-row to entrepreneur_net_worth_components(faction_id), the ONE source for the net-worth formula. Returns [{faction_id, name, net_worth}] desc.';

-- ── 4. Per-user breakdown for the home page ──
-- Returns the same components the helper computes, plus 'success'
-- envelope matching the rest of the entrepreneur RPC set. Resolves
-- the calling user to their entrepreneur faction with the same prelude
-- used by corp_trade / corp_dividend / found_entrepreneur_corp etc.
-- so a linked_user_id session resolves the same faction as a direct
-- id session.
CREATE OR REPLACE FUNCTION public.get_my_net_worth_breakdown()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid uuid := auth.uid();
    v_fac factions%ROWTYPE;
    v_cmp record;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC
     LIMIT 1;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;

    SELECT * INTO v_cmp FROM entrepreneur_net_worth_components(v_fac.id);

    RETURN jsonb_build_object(
        'success',                true,
        'faction_id',             v_fac.id,
        'cash',                   ROUND(v_cmp.cash)::bigint,
        'public_holdings',        ROUND(v_cmp.public_holdings)::bigint,
        'private_holdings_share', ROUND(v_cmp.private_holdings_share)::bigint,
        'private_holdings_own',   ROUND(v_cmp.private_holdings_own)::bigint,
        'total',                  ROUND(v_cmp.total)::bigint
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_net_worth_breakdown() TO authenticated;

COMMENT ON FUNCTION public.get_my_net_worth_breakdown() IS
    'Per-user net-worth breakdown for the home-page anchor: {cash, public_holdings, private_holdings_share, private_holdings_own, total}. Delegates to entrepreneur_net_worth_components(faction_id) — the same helper get_entrepreneur_net_worth uses — so the home-page headline can never drift from the leaderboard.';

NOTIFY pgrst, 'reload schema';

COMMIT;
