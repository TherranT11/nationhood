-- ════════════════════════════════════════════════════════════════════
-- ENTREPRENEUR STOCK SYSTEM — mark held public stock at LIQUIDATION value
-- ════════════════════════════════════════════════════════════════════
-- Net worth (and the dashboard) marked held public shares at S × share_price.
-- On the +5%/share bonding curve that's the *marginal* top-of-curve price, which
-- a holder can never actually realise — selling the stake walks the price back
-- down. So buying N shares pumped share_price and inflated paper net worth far
-- above what the position could fetch (a valuation-manipulation loophole).
--
-- Fix: mark a position at its SELL-SIDE (liquidation) value — what the holder
-- would actually receive selling the whole stake back into the curve at the
-- current price. This is the exact inverse the corp_trade sell side pays:
--
--   liquidation(S, P) = P · (1 − r^−S) / (r − 1),   r = 1.05
--
-- Under this mark a price pump can't create wealth: buying N converts cash into
-- shares of equal liquidation value (ΔNW = 0). Only PUBLIC holdings change;
-- private stakes keep their book-value proportion.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- Sell-side value of a bonding-curve share position. IMMUTABLE/pure so it can be
-- used inline in the net-worth query. The rate (1.05) MUST match corp_trade's
-- v_r — the bonding curve has no shared SQL constant, so keep the two in sync.
-- Negative exponent (not corp_trade's positive-exponent exact path) is fine here:
-- this is a display mark, and it stays bounded for any holding size (huge S →
-- r^−S → 0 → asymptote P/(r−1)), where a positive exponent would overflow.
CREATE OR REPLACE FUNCTION public.corp_share_liquidation_value(p_price numeric, p_shares numeric)
RETURNS numeric
LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE
           WHEN p_price IS NULL OR p_shares IS NULL OR p_shares <= 0 THEN 0
           ELSE p_price * (1 - power(1.05, -p_shares)) / 0.05
         END;
$$;

GRANT EXECUTE ON FUNCTION public.corp_share_liquidation_value(numeric, numeric) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_entrepreneur_net_worth()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH ent AS (
    SELECT id, faction_name, leader_first_name, leader_last_name,
           GREATEST(0, COALESCE(party_funds, 0))::numeric AS cash
      FROM factions
     WHERE faction_type = 'entrepreneur' AND abandoned_at IS NULL
  ),
  pub AS (   -- held public stock, marked to its sell-side (liquidation) value
    SELECT h.holder_faction_id AS fid,
           SUM(corp_share_liquidation_value(c.share_price, h.shares::numeric)) AS v
      FROM corp_shareholdings h
      JOIN entrepreneur_corps c ON c.id = h.corp_id
     WHERE c.listing = 'public'
     GROUP BY h.holder_faction_id
  ),
  priv_held AS (   -- private stakes with a share model, valued by book proportion
    SELECT h.holder_faction_id AS fid,
           SUM(h.shares::numeric / NULLIF(c.shares_outstanding, 0)
               * entrepreneur_corp_book_value(c.id)) AS v
      FROM corp_shareholdings h
      JOIN entrepreneur_corps c ON c.id = h.corp_id
     WHERE c.listing = 'private' AND COALESCE(c.shares_outstanding, 0) > 0
     GROUP BY h.holder_faction_id
  ),
  priv_owned AS (  -- private corps with no share model yet → full book to owner
    SELECT c.owner_faction_id AS fid,
           SUM(entrepreneur_corp_book_value(c.id)) AS v
      FROM entrepreneur_corps c
     WHERE c.listing = 'private' AND COALESCE(c.shares_outstanding, 0) = 0
     GROUP BY c.owner_faction_id
  ),
  worth AS (
    SELECT e.id, e.faction_name, e.leader_first_name, e.leader_last_name,
           e.cash + COALESCE(p.v, 0) + COALESCE(ph.v, 0) + COALESCE(po.v, 0) AS net_worth
      FROM ent e
      LEFT JOIN pub        p  ON p.fid  = e.id
      LEFT JOIN priv_held  ph ON ph.fid = e.id
      LEFT JOIN priv_owned po ON po.fid = e.id
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'faction_id', id,
           'name', COALESCE(NULLIF(btrim(concat_ws(' ', leader_first_name, leader_last_name)), ''),
                            faction_name, 'Unknown'),
           'net_worth', ROUND(net_worth)::bigint
         ) ORDER BY net_worth DESC, faction_name ASC), '[]'::jsonb)
    FROM worth;
$$;

GRANT EXECUTE ON FUNCTION public.get_entrepreneur_net_worth() TO authenticated;

COMMENT ON FUNCTION public.get_entrepreneur_net_worth() IS
    'Ranked entrepreneur net worth: party_funds + held public stock (sell-side liquidation value via corp_share_liquidation_value) + private stakes (book-value proportion via entrepreneur_corp_book_value). Returns [{faction_id, name, net_worth}] desc. Read RPC for the Character page leaderboard.';

NOTIFY pgrst, 'reload schema';

COMMIT;
