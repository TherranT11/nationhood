-- ════════════════════════════════════════════════════════════════════
-- get_my_construction_bids — switch valuation to book value for both
-- listings (was: market cap for public, book value for private).
-- ════════════════════════════════════════════════════════════════════
-- Mirrors the JS-side change in computeEntrepreneurValuation (see
-- js/game/corp-valuation.js §3). The 'valuation' field returned with
-- each pending construction bid was the only mechanically-consumed
-- server-side site that still computed market cap for public corps:
--   ROUND(ec.share_price * ec.shares_outstanding)::bigint
-- which a founder could pump 1% per share via corp_trade self-buys
-- (flat-fill linear curve, sql/migrations/20270199 + 20270365). The
-- pumped figure made shell corps look like credible bidders to the
-- issuing corp reviewing its inbox.
--
-- entrepreneur_corp_book_value(id) reads treasury + Σ building book
-- value − Σ outstanding debt, all of which move with real economic
-- activity — self-trading is a wash on treasury (buy puts cash in,
-- a same-tick sell or dividend pulls it back out) so the book figure
-- can't be self-pumped.
--
-- Body is otherwise verbatim from 20270252_director_read_shipping_
-- construction_rpcs.sql:102-161; the only diff is the valuation
-- CASE — collapsed to the book-value branch. CREATE OR REPLACE,
-- idempotent.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.get_my_construction_bids(p_corp_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid uuid := auth.uid();
    v_fac factions%ROWTYPE;
    v_corp entrepreneur_corps%ROWTYPE;
    v_out jsonb;
BEGIN
    IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated'); END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id;
    IF v_corp.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found'); END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur' AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1;
    -- Owner OR a board director (corp_board_seats) may read — directors get
    -- read-only operational visibility (entrepreneur-corp.html). The query
    -- only ever returns this corp's OWN bids/positions, never a rival's.
    IF v_fac.id IS NULL OR (v_corp.owner_faction_id <> v_fac.id
        AND NOT EXISTS (SELECT 1 FROM corp_board_seats b
                        WHERE b.corp_id = v_corp.id AND b.member_faction_id = v_fac.id)) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authorized');
    END IF;

    SELECT COALESCE(jsonb_agg(bid_obj ORDER BY (bid_obj->>'bid_amount')::bigint ASC), '[]'::jsonb)
      INTO v_out
      FROM (
        SELECT jsonb_build_object(
            'contract_id',    b.contract_id,
            'bid_id',         b.id,
            'bid_amount',     b.bid_amount,
            'corp_id',        ec.id,
            'corp_name',      ec.name,
            'hq',             COALESCE(n.name, '—'),
            'ceo',            COALESCE(NULLIF(btrim(concat_ws(' ', f.leader_first_name, f.leader_last_name)), ''),
                                       f.faction_name, '—'),
            'ceo_reputation', COALESCE(f.ent_reputation, 0),
            'valuation',      entrepreneur_corp_book_value(ec.id)::bigint
        ) AS bid_obj
        FROM ent_construction_bids b
        JOIN ent_construction_contracts cc ON cc.id = b.contract_id
        JOIN entrepreneur_corps ec ON ec.id = b.bidder_corp_id
        JOIN factions f ON f.id = ec.owner_faction_id
        LEFT JOIN nations n ON n.id = ec.hq_nation_id
        WHERE cc.issuer_corp_id = p_corp_id AND cc.status = 'open' AND b.status = 'pending'
      ) s;

    RETURN jsonb_build_object('success', true, 'bids', v_out);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_construction_bids(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
