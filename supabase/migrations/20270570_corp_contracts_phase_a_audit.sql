-- ════════════════════════════════════════════════════════════════════
-- 20270570 — Corporate Contracts Phase A audit fixes
--
-- Pre-commit audit findings on 20270569. Originally there were three;
-- two are folded back into 20270569 itself now that the user hit the
-- corp_contracts name collision and we had to revise that file anyway:
--
--   • [folded into 20270569] FK target was REFERENCES factions(id);
--     entrepreneur_corps.id is a standalone UUID. Fixed at the source.
--
--   • [folded into 20270569] Table renamed corp_contracts →
--     corp_negotiations because sql/migrations/20260328 already owns
--     corp_contracts with an unrelated infrastructure-bidding schema.
--
--   • [this migration] Privacy on list_corp_negotiations + get_corp
--     _contract. Both RPCs were callable with any corp_id /
--     contract_id by any authenticated user. A competitor could
--     enumerate to discover a corp's negotiations and counterparties.
--     Tighten: only the CEO of a corp can list its drafts; only the
--     CEO of either party can fetch a contract. Phase C will widen
--     get_corp_contract for status='binding' once those exist —
--     binding contracts are public knowledge once executed, but
--     drafts and cancelled drafts stay party-private.
--
--   • [client-side, in the entrepreneur-corp.html edit] picker race:
--     disable ALL picker rows on the first click so rapid taps can't
--     create duplicate drafts.
--
-- Bodies of list_corp_negotiations and get_corp_contract are
-- byte-identical to 20270569 except for the inserted CEO check at
-- the top of each.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── list_corp_negotiations — CEO gate ────────────────────────────
CREATE OR REPLACE FUNCTION public.list_corp_negotiations(
    p_corp_id UUID
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid               UUID := auth.uid();
    v_caller_faction_id UUID;
    v_negotiations      jsonb;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    SELECT id INTO v_caller_faction_id FROM public.factions
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1;
    IF v_caller_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;

    -- Only the CEO of the corp can see its negotiation drafts.
    IF NOT EXISTS (
        SELECT 1 FROM public.entrepreneur_corps
         WHERE id = p_corp_id
           AND owner_faction_id = v_caller_faction_id
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_ceo');
    END IF;

    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'contract_id',              row.id,
                'created_at_tick',          row.created_at_tick,
                'status',                   row.status,
                'is_initiator',             row.is_initiator,
                'counterparty_corp_id',     row.counterparty_corp_id,
                'counterparty_corp_name',   row.counterparty_corp_name,
                'counterparty_corp_nation', row.counterparty_corp_nation
            ) ORDER BY row.created_at_tick DESC
        ),
        '[]'::jsonb
    )
      INTO v_negotiations
      FROM (
        SELECT
            c.id,
            c.created_at_tick,
            c.status,
            (c.initiating_corp_id = p_corp_id) AS is_initiator,
            CASE WHEN c.initiating_corp_id = p_corp_id
                 THEN c.counterparty_corp_id
                 ELSE c.initiating_corp_id END AS counterparty_corp_id,
            CASE WHEN c.initiating_corp_id = p_corp_id
                 THEN ec_b.name
                 ELSE ec_a.name END           AS counterparty_corp_name,
            CASE WHEN c.initiating_corp_id = p_corp_id
                 THEN n_b.name
                 ELSE n_a.name END            AS counterparty_corp_nation
          FROM public.corp_negotiations c
          LEFT JOIN public.entrepreneur_corps ec_a ON ec_a.id = c.initiating_corp_id
          LEFT JOIN public.entrepreneur_corps ec_b ON ec_b.id = c.counterparty_corp_id
          LEFT JOIN public.nations n_a ON n_a.id = ec_a.hq_nation_id
          LEFT JOIN public.nations n_b ON n_b.id = ec_b.hq_nation_id
         WHERE c.status = 'drafting'
           AND (c.initiating_corp_id = p_corp_id OR c.counterparty_corp_id = p_corp_id)
      ) row;

    RETURN jsonb_build_object('success', true, 'negotiations', v_negotiations);
END $$;

-- ── get_corp_contract — party-CEO gate ──────────────────────────
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

    SELECT id INTO v_caller_faction_id FROM public.factions
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1;
    IF v_caller_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;

    -- Caller must be CEO of either party. Drafts + cancelled drafts
    -- are party-private. Phase C widens this for status='binding'
    -- (binding contracts become public once executed).
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

    RETURN jsonb_build_object(
        'success', true,
        'contract', jsonb_build_object(
            'id',                       v_contract.id,
            'status',                   v_contract.status,
            'created_at_tick',          v_contract.created_at_tick,
            'cancelled_at_tick',        v_contract.cancelled_at_tick,
            'initiating_corp_id',       v_contract.initiating_corp_id,
            'initiating_corp_name',     v_initiating_name,
            'initiating_corp_nation',   v_initiating_nation,
            'counterparty_corp_id',     v_contract.counterparty_corp_id,
            'counterparty_corp_name',   v_counterparty_name,
            'counterparty_corp_nation', v_counterparty_nation
        )
    );
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
