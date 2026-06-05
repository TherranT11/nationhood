-- ════════════════════════════════════════════════════════════════════
-- 20270624 — get_corp_contract: include signer name with each signature
--
-- The contract signature block on corp-contract.html renders the corp
-- name on the signature line ("Líneas Aéreas de Melizea") because the
-- get_corp_contract payload doesn't carry the signing CEO's name —
-- only corp_id, corp_name, signed_at_tick. The corp_negotiation_
-- signatures table DOES store signed_by_faction_id (FK → factions)
-- but the RPC never joins through to surface it.
--
-- Re-issue get_corp_contract from 20270573 with one extra LEFT JOIN
-- on factions in the signatures sub-SELECT, exposing the CEO's
-- display name as signed_by_name. Body is byte-identical except:
--
--   • LEFT JOIN public.factions f ON f.id = s.signed_by_faction_id
--   • 'signed_by_name' field on each signature JSONB object,
--     computed as "First Last" when leader name parts exist, or
--     faction_name as a final fallback (matches the same convention
--     used by entrepreneur-corporations.html, entrepreneur-assets.html,
--     politician-ministry-foreign.html — leader_first_name +
--     leader_last_name with faction_name as fallback).
--
-- Returns NULL for signed_by_name only when the signing faction row
-- was deleted (ON DELETE SET NULL on the FK) — client falls back to
-- the corp name in that case.
--
-- Apply after 20270623.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.get_corp_contract(
    p_contract_id UUID
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid                  UUID := auth.uid();
    v_caller_faction_id    UUID;
    v_contract             public.corp_negotiations%ROWTYPE;
    v_initiating_name      TEXT;
    v_initiating_nation    TEXT;
    v_counterparty_name    TEXT;
    v_counterparty_nation  TEXT;
    v_articles             jsonb;
    v_signatures           jsonb;
    v_caller_corp_ids      jsonb;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_contract_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    SELECT * INTO v_contract FROM public.corp_negotiations WHERE id = p_contract_id;
    IF v_contract.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'contract_not_found');
    END IF;

    v_caller_faction_id := public._corp_negotiation_caller_faction();
    IF v_caller_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.entrepreneur_corps
         WHERE owner_faction_id = v_caller_faction_id
           AND id IN (v_contract.initiating_corp_id, v_contract.counterparty_corp_id)
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_party_ceo');
    END IF;

    SELECT ec.name, n.name INTO v_initiating_name, v_initiating_nation
      FROM public.entrepreneur_corps ec
      LEFT JOIN public.nations n ON n.id = ec.hq_nation_id
     WHERE ec.id = v_contract.initiating_corp_id;

    SELECT ec.name, n.name INTO v_counterparty_name, v_counterparty_nation
      FROM public.entrepreneur_corps ec
      LEFT JOIN public.nations n ON n.id = ec.hq_nation_id
     WHERE ec.id = v_contract.counterparty_corp_id;

    SELECT COALESCE(jsonb_agg(id), '[]'::jsonb)
      INTO v_caller_corp_ids
      FROM public.entrepreneur_corps
     WHERE owner_faction_id = v_caller_faction_id
       AND id IN (v_contract.initiating_corp_id, v_contract.counterparty_corp_id);

    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'id',              a.id,
                'title',           a.title,
                'body',            a.body,
                'locked',          a.locked,
                'created_at_tick', a.created_at_tick,
                'updated_at_tick', a.updated_at_tick,
                'parties_agreed',  COALESCE(ag.agreements, '[]'::jsonb)
            ) ORDER BY a.created_at ASC, a.id ASC
        ),
        '[]'::jsonb
    )
      INTO v_articles
      FROM public.corp_negotiation_articles a
      LEFT JOIN LATERAL (
        SELECT jsonb_agg(jsonb_build_object(
            'corp_id',        agr.corp_id,
            'corp_name',      ec.name,
            'agreed_at_tick', agr.agreed_at_tick
        )) AS agreements
          FROM public.corp_negotiation_article_agreements agr
          LEFT JOIN public.entrepreneur_corps ec ON ec.id = agr.corp_id
         WHERE agr.article_id = a.id
      ) ag ON TRUE
     WHERE a.negotiation_id = p_contract_id;

    -- 20270624: signer's CEO name added via LEFT JOIN factions on
    -- signed_by_faction_id. Returns NULL when the signing faction
    -- row was deleted (FK is ON DELETE SET NULL); client falls back
    -- to corp_name in that case.
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'corp_id',        s.corp_id,
                'corp_name',      ec.name,
                'signed_at_tick', s.signed_at_tick,
                'signed_by_name', COALESCE(
                    NULLIF(TRIM(COALESCE(f.leader_first_name, '') || ' '
                              || COALESCE(f.leader_last_name,  '')), ''),
                    f.faction_name
                )
            )
        ),
        '[]'::jsonb
    )
      INTO v_signatures
      FROM public.corp_negotiation_signatures s
      LEFT JOIN public.entrepreneur_corps ec ON ec.id = s.corp_id
      LEFT JOIN public.factions f            ON f.id  = s.signed_by_faction_id
     WHERE s.contract_id = p_contract_id;

    RETURN jsonb_build_object(
        'success', true,
        'contract', jsonb_build_object(
            'id',                       v_contract.id,
            'status',                   v_contract.status,
            'created_at_tick',          v_contract.created_at_tick,
            'cancelled_at_tick',        v_contract.cancelled_at_tick,
            'expires_at_tick',          v_contract.expires_at_tick,
            'signed_at_tick',           v_contract.signed_at_tick,
            'initiating_corp_id',       v_contract.initiating_corp_id,
            'initiating_corp_name',     v_initiating_name,
            'initiating_corp_nation',   v_initiating_nation,
            'counterparty_corp_id',     v_contract.counterparty_corp_id,
            'counterparty_corp_name',   v_counterparty_name,
            'counterparty_corp_nation', v_counterparty_nation,
            'caller_corp_ids',          v_caller_corp_ids,
            'articles',                 v_articles,
            'signatures',               v_signatures
        )
    );
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
