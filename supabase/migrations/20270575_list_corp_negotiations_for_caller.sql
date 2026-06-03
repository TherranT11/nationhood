-- ════════════════════════════════════════════════════════════════════
-- 20270575 — list_corp_negotiations_for_caller RPC
--
-- Powers the Contract Negotiation pressing-issue card on the
-- entrepreneur dashboard. Returns every active negotiation (status
-- 'drafting' or 'awaiting_signatures') where any corp the caller
-- owns is a party — both as initiator AND counterparty surfaces,
-- per the user's "Both parties" pick on the scope question.
--
-- Why a new RPC instead of extending list_corp_negotiations: that
-- one takes a single p_corp_id and the dashboard would need to call
-- it once per owned corp (N round trips). This RPC does the same
-- work in one round trip and joins the counterparty-side stats the
-- mockup card needs (CEO name, owner reputation, corp treasury,
-- article counts) so the client renders without follow-up lookups.
--
-- Stats sourced per the "owner+corp data, omit unknowns" pick:
--   • other_ceo_name             factions.leader_first + last_name
--   • other_ceo_reputation       factions.politician_reputation
--   • other_corp_treasury        entrepreneur_corps.treasury_cash
--   • articles_total / locked    counted from corp_negotiation_articles
-- The mockup's STD and PRI columns don't have natural mappings in
-- the current entrepreneur schema and are dropped on the client.
--
-- Excludes binding + cancelled — pressing issues are open work, not
-- archives.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.list_corp_negotiations_for_caller()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_caller_faction_id UUID := public._corp_negotiation_caller_faction();
    v_my_corp_ids       UUID[];
    v_rows              jsonb;
BEGIN
    IF v_caller_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;

    SELECT array_agg(id) INTO v_my_corp_ids
      FROM public.entrepreneur_corps
     WHERE owner_faction_id = v_caller_faction_id;

    IF v_my_corp_ids IS NULL OR array_length(v_my_corp_ids, 1) = 0 THEN
        RETURN jsonb_build_object('success', true, 'negotiations', '[]'::jsonb);
    END IF;

    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'contract_id',          r.id,
                'created_at_tick',      r.created_at_tick,
                'status',               r.status,
                'is_initiator',         r.is_initiator,
                'my_corp_id',           r.my_corp_id,
                'my_corp_name',         r.my_corp_name,
                'other_corp_id',        r.other_corp_id,
                'other_corp_name',      r.other_corp_name,
                'other_corp_nation',    r.other_corp_nation,
                'other_ceo_name',       r.other_ceo_name,
                'other_ceo_reputation', r.other_ceo_reputation,
                'other_corp_treasury',  r.other_corp_treasury,
                'articles_total',       r.articles_total,
                'articles_locked',      r.articles_locked
            ) ORDER BY r.created_at_tick DESC
        ),
        '[]'::jsonb
    )
      INTO v_rows
      FROM (
        SELECT
            c.id,
            c.created_at_tick,
            c.status,
            -- Caller is initiator when initiating corp is in the
            -- caller's owned-corp set.
            (c.initiating_corp_id = ANY(v_my_corp_ids)) AS is_initiator,
            CASE WHEN c.initiating_corp_id = ANY(v_my_corp_ids)
                 THEN c.initiating_corp_id
                 ELSE c.counterparty_corp_id END AS my_corp_id,
            CASE WHEN c.initiating_corp_id = ANY(v_my_corp_ids)
                 THEN ec_a.name ELSE ec_b.name END AS my_corp_name,
            CASE WHEN c.initiating_corp_id = ANY(v_my_corp_ids)
                 THEN c.counterparty_corp_id
                 ELSE c.initiating_corp_id END AS other_corp_id,
            CASE WHEN c.initiating_corp_id = ANY(v_my_corp_ids)
                 THEN ec_b.name ELSE ec_a.name END AS other_corp_name,
            CASE WHEN c.initiating_corp_id = ANY(v_my_corp_ids)
                 THEN n_b.name ELSE n_a.name END AS other_corp_nation,
            CASE WHEN c.initiating_corp_id = ANY(v_my_corp_ids)
                 THEN NULLIF(btrim(COALESCE(f_b.leader_first_name, '') || ' ' || COALESCE(f_b.leader_last_name, '')), '')
                 ELSE NULLIF(btrim(COALESCE(f_a.leader_first_name, '') || ' ' || COALESCE(f_a.leader_last_name, '')), '')
            END AS other_ceo_name,
            CASE WHEN c.initiating_corp_id = ANY(v_my_corp_ids)
                 THEN f_b.politician_reputation
                 ELSE f_a.politician_reputation END AS other_ceo_reputation,
            CASE WHEN c.initiating_corp_id = ANY(v_my_corp_ids)
                 THEN ec_b.treasury_cash
                 ELSE ec_a.treasury_cash END AS other_corp_treasury,
            (SELECT COUNT(*) FROM public.corp_negotiation_articles
              WHERE negotiation_id = c.id) AS articles_total,
            (SELECT COUNT(*) FROM public.corp_negotiation_articles
              WHERE negotiation_id = c.id AND locked) AS articles_locked
          FROM public.corp_negotiations c
          LEFT JOIN public.entrepreneur_corps ec_a ON ec_a.id = c.initiating_corp_id
          LEFT JOIN public.entrepreneur_corps ec_b ON ec_b.id = c.counterparty_corp_id
          LEFT JOIN public.factions          f_a  ON f_a.id  = ec_a.owner_faction_id
          LEFT JOIN public.factions          f_b  ON f_b.id  = ec_b.owner_faction_id
          LEFT JOIN public.nations           n_a  ON n_a.id  = ec_a.hq_nation_id
          LEFT JOIN public.nations           n_b  ON n_b.id  = ec_b.hq_nation_id
         WHERE c.status IN ('drafting', 'awaiting_signatures')
           AND (
               c.initiating_corp_id   = ANY(v_my_corp_ids)
            OR c.counterparty_corp_id = ANY(v_my_corp_ids)
           )
      ) r;

    RETURN jsonb_build_object('success', true, 'negotiations', v_rows);
END $$;

REVOKE EXECUTE ON FUNCTION public.list_corp_negotiations_for_caller() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.list_corp_negotiations_for_caller() TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
