-- ════════════════════════════════════════════════════════════════════
-- 20270569 — Corporate Contracts: Phase A schema + entry point RPCs
--
-- First slice of the Corporate Negotiations / Corporate Contracts
-- mechanic. Phase A scope: schema for contract records, plus the
-- four RPCs needed to start a draft, list active drafts, render the
-- detail page, and cancel a draft. Article authoring + signing land
-- in subsequent phases — drafts ship in "drafting" state and can
-- only transition to "cancelled" for now.
--
-- Schema (deliberately barebones):
--   corp_negotiations — one row per inter-corp negotiation. Distinct
--                       table name (not corp_contracts) because the
--                       legacy infrastructure-bidding system in
--                       sql/migrations/20260328 already owns
--                       corp_contracts with an unrelated schema.
--                       Carries both parties, initiator, status, and
--                       the tick stamps Phase A needs (created,
--                       cancelled). signed_at_tick, expires_at_tick,
--                       terminated_at_tick all land in their
--                       respective phases via ALTER ADD COLUMN.
--
-- Permissions:
--   • Only the CEO (entrepreneur_corps.owner_faction_id) of the
--     initiating corp can start a negotiation.
--   • Either party's CEO can cancel a drafting contract.
--   • SELECT/INSERT/UPDATE on corp_negotiations revoked from clients
--     — all reads/writes must flow through the SECURITY DEFINER RPCs.
--
-- Status discipline:
--   'drafting'  → 'cancelled'           (this phase)
--   'drafting'  → 'awaiting_signatures' (Phase B: articles + agreements)
--   'awaiting_signatures' → 'binding'   (Phase C: signing)
--   'binding'   → 'expired' | 'terminated' (Phase C/D)
-- Each phase widens the CHECK as it adds states.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Schema ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.corp_negotiations (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Both parties are entrepreneur_corps rows. Distinct by CHECK so a
    -- corp can't negotiate with itself. CASCADE on corp delete: if
    -- either party folds, the negotiation goes with it.
    initiating_corp_id       UUID NOT NULL REFERENCES public.entrepreneur_corps(id) ON DELETE CASCADE,
    counterparty_corp_id     UUID NOT NULL REFERENCES public.entrepreneur_corps(id) ON DELETE CASCADE,

    -- The entrepreneur faction whose user actually clicked Start.
    -- SET NULL on faction delete — the contract record outlives the
    -- specific human, even if they abandon their entrepreneur.
    initiated_by_faction_id  UUID REFERENCES public.factions(id) ON DELETE SET NULL,

    status                   TEXT NOT NULL DEFAULT 'drafting'
        CHECK (status IN ('drafting', 'cancelled')),

    created_at_tick          INT NOT NULL,
    cancelled_at_tick        INT,
    cancelled_by_faction_id  UUID REFERENCES public.factions(id) ON DELETE SET NULL,

    created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT corp_negotiations_distinct_parties
        CHECK (initiating_corp_id <> counterparty_corp_id)
);

CREATE INDEX IF NOT EXISTS idx_corp_negotiations_initiating
    ON public.corp_negotiations (initiating_corp_id, status);
CREATE INDEX IF NOT EXISTS idx_corp_negotiations_counterparty
    ON public.corp_negotiations (counterparty_corp_id, status);

COMMENT ON TABLE public.corp_negotiations IS
    'One row per inter-corp contract negotiation. Phase A only supports drafting / cancelled states; Phase B adds awaiting_signatures, Phase C adds binding/expired/terminated. RPC-only — direct DML revoked from clients.';

-- Clients hit corp_negotiations only through the SECURITY DEFINER RPCs.
REVOKE ALL ON public.corp_negotiations FROM PUBLIC, anon, authenticated;

-- ── 2. start_corp_negotiation ────────────────────────────────────
-- Creates a 'drafting' contract row. Caller must be the CEO of the
-- initiating corp (entrepreneur_corps.owner_faction_id matches their
-- entrepreneur faction). Counterparty must exist and be a corp.
CREATE OR REPLACE FUNCTION public.start_corp_negotiation(
    p_initiating_corp_id   UUID,
    p_counterparty_corp_id UUID
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid                UUID := auth.uid();
    v_caller_faction_id  UUID;
    v_tick               INT;
    v_contract_id        UUID;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_initiating_corp_id IS NULL OR p_counterparty_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;
    IF p_initiating_corp_id = p_counterparty_corp_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'same_corp');
    END IF;

    -- Caller's entrepreneur faction (same pattern used by go_public,
    -- corp_trade, etc.).
    SELECT id INTO v_caller_faction_id FROM public.factions
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1;
    IF v_caller_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;

    -- CEO check: the initiating corp's owner_faction_id must match.
    IF NOT EXISTS (
        SELECT 1 FROM public.entrepreneur_corps
         WHERE id = p_initiating_corp_id
           AND owner_faction_id = v_caller_faction_id
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_ceo');
    END IF;

    -- Counterparty must be a real corp.
    IF NOT EXISTS (
        SELECT 1 FROM public.entrepreneur_corps WHERE id = p_counterparty_corp_id
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'counterparty_not_found');
    END IF;

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;

    INSERT INTO public.corp_negotiations (
        initiating_corp_id, counterparty_corp_id,
        initiated_by_faction_id, status, created_at_tick
    ) VALUES (
        p_initiating_corp_id, p_counterparty_corp_id,
        v_caller_faction_id, 'drafting', COALESCE(v_tick, 0)
    ) RETURNING id INTO v_contract_id;

    RETURN jsonb_build_object('success', true, 'contract_id', v_contract_id);
END $$;

REVOKE EXECUTE ON FUNCTION public.start_corp_negotiation(UUID, UUID) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.start_corp_negotiation(UUID, UUID) TO authenticated;

-- ── 3. cancel_corp_negotiation ───────────────────────────────────
-- Either party's CEO can cancel a 'drafting' contract.
CREATE OR REPLACE FUNCTION public.cancel_corp_negotiation(
    p_contract_id UUID
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid                UUID := auth.uid();
    v_contract           public.corp_negotiations%ROWTYPE;
    v_caller_faction_id  UUID;
    v_tick               INT;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_contract_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    SELECT * INTO v_contract FROM public.corp_negotiations
     WHERE id = p_contract_id FOR UPDATE;
    IF v_contract.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'contract_not_found');
    END IF;
    IF v_contract.status <> 'drafting' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_cancellable');
    END IF;

    SELECT id INTO v_caller_faction_id FROM public.factions
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1;
    IF v_caller_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;

    -- Caller must be CEO of either party.
    IF NOT EXISTS (
        SELECT 1 FROM public.entrepreneur_corps
         WHERE owner_faction_id = v_caller_faction_id
           AND id IN (v_contract.initiating_corp_id, v_contract.counterparty_corp_id)
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_party_ceo');
    END IF;

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;

    UPDATE public.corp_negotiations
       SET status                  = 'cancelled',
           cancelled_at_tick       = COALESCE(v_tick, 0),
           cancelled_by_faction_id = v_caller_faction_id,
           updated_at              = now()
     WHERE id = p_contract_id;

    RETURN jsonb_build_object('success', true, 'contract_id', p_contract_id);
END $$;

REVOKE EXECUTE ON FUNCTION public.cancel_corp_negotiation(UUID) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.cancel_corp_negotiation(UUID) TO authenticated;

-- ── 4. list_corp_negotiations ────────────────────────────────────
-- Returns drafting contracts where the corp is either party. Carries
-- the OTHER party's name + nation so the client can render a single
-- "with X (Y)" row without further lookups.
CREATE OR REPLACE FUNCTION public.list_corp_negotiations(
    p_corp_id UUID
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_negotiations jsonb;
BEGIN
    IF p_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'contract_id',       row.id,
                'created_at_tick',   row.created_at_tick,
                'status',            row.status,
                'is_initiator',      row.is_initiator,
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

REVOKE EXECUTE ON FUNCTION public.list_corp_negotiations(UUID) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.list_corp_negotiations(UUID) TO authenticated;

-- ── 5. get_corp_contract ─────────────────────────────────────────
-- Returns one contract with both parties' names + nations. Used by
-- corp-contract.html on load. Anyone authenticated can read — Phase A
-- only has drafting/cancelled states, neither of which is sensitive
-- (the parties are visible from other UI). Tighten in Phase C if
-- binding contracts ever need party-only visibility.
CREATE OR REPLACE FUNCTION public.get_corp_contract(
    p_contract_id UUID
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_contract               public.corp_negotiations%ROWTYPE;
    v_initiating_name        TEXT;
    v_initiating_nation      TEXT;
    v_counterparty_name      TEXT;
    v_counterparty_nation    TEXT;
BEGIN
    IF p_contract_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    SELECT * INTO v_contract FROM public.corp_negotiations WHERE id = p_contract_id;
    IF v_contract.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'contract_not_found');
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

REVOKE EXECUTE ON FUNCTION public.get_corp_contract(UUID) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_corp_contract(UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
