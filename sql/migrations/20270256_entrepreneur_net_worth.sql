-- ============================================================================
-- Entrepreneur Net Worth ranking (read RPC for the Character page leaderboard).
--
-- Net worth per entrepreneur =
--   cash on hand (factions.party_funds)
--   + value of held PUBLIC stock      (Σ shares × corp.share_price)
--   + value of held PRIVATE stakes    (Σ shares ÷ shares_outstanding × book)
--   + PRIVATE corps with no share model yet → full book to the owner.
-- Private valuation reads the one source, entrepreneur_corp_book_value, so it
-- matches the displayed corp valuation. Components are disjoint (public vs
-- private; share-model vs none) so nothing double-counts. Returns the ranked
-- TOTAL only — not the per-entrepreneur breakdown.
-- ============================================================================

BEGIN;

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
  pub AS (   -- held public stock, marked to share_price
    SELECT h.holder_faction_id AS fid,
           SUM(h.shares::numeric * COALESCE(c.share_price, 0)) AS v
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
    'Ranked entrepreneur net worth: party_funds + held public stock (× share_price) + private stakes (book-value proportion via entrepreneur_corp_book_value). Returns [{faction_id, name, net_worth}] desc. Read RPC for the Character page leaderboard.';

NOTIFY pgrst, 'reload schema';

COMMIT;
