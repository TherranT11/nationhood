-- ════════════════════════════════════════════════════════════════════
-- ENTREPRENEUR CONSTRUCTION CONTRACTS — Step 1: marketplace backbone
-- ════════════════════════════════════════════════════════════════════
-- Lean port of the legacy corp_contracts marketplace onto the Entrepreneur
-- system. Government (and private entrepreneur corps) post construction
-- contracts; Entrepreneur CONSTRUCTION corps bid a price; the LOWEST bid
-- auto-wins when the bidding window closes; the winner builds over
-- timeline_ticks; on completion the winner is paid into treasury_cash and
-- (for government contracts) the issuing nation gets a stat bonus.
--
-- This step is the backbone only:
--   • ent_construction_contracts / ent_construction_bids (RPC-write-only)
--   • ent_place_construction_bid          — a construction corp bids
--   • ent_issue_private_construction_contract — a corp posts a private job
--   • ent_issue_construction_contract      — generic issuer (gov RPCs call
--     this in Steps 2-3: Interior public-works + Sports stadiums)
--   • process_ent_construction_contracts   — per-tick auto-award + build +
--     completion (wired into the tick processor in a later step)
--
-- Money units: bids/budget/treasury are RAW dollars. nations.budget is
-- ABSTRACT (millions) — converted via RAW_PER_ABSTRACT, mirroring the
-- shipping allocator (20270181). Government completion reward reuses the
-- shared award_construction_gdp_bonus (one source) + SoL/approval deltas.
-- Private contracts are CASH-FOR-WORK: no asset, no nation effect.
--
-- Idempotent. Additive.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE TABLE IF NOT EXISTS ent_construction_contracts (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_number     text NOT NULL,
    name                text NOT NULL,
    contract_type       text NOT NULL CHECK (contract_type IN ('government', 'private')),
    issuer_nation_id    uuid REFERENCES nations(id) ON DELETE CASCADE,            -- gov: issuer + beneficiary + payer
    issuer_corp_id      uuid REFERENCES entrepreneur_corps(id) ON DELETE CASCADE, -- private: issuer + payer
    issuer_name         text NOT NULL DEFAULT '',
    spec_tier           text NOT NULL CHECK (spec_tier IN ('light', 'heavy', 'mega')),
    budget              bigint NOT NULL CHECK (budget > 0),     -- max payable; bids must be <= budget
    timeline_ticks      int NOT NULL CHECK (timeline_ticks > 0),
    bidding_closes_tick int NOT NULL,                           -- lowest pending bid auto-wins at/after this tick
    status              text NOT NULL DEFAULT 'open'
                            CHECK (status IN ('open', 'active', 'completed', 'failed', 'cancelled')),
    winner_corp_id      uuid REFERENCES entrepreneur_corps(id) ON DELETE SET NULL,
    winning_bid         bigint,
    started_at_tick     int,
    progress_ticks      int NOT NULL DEFAULT 0,
    completion_effects  jsonb NOT NULL DEFAULT '{}'::jsonb,      -- gov only: {gdp, sol, approval} deltas
    created_at_tick     int NOT NULL,
    created_at          timestamptz NOT NULL DEFAULT now(),
    -- Exactly one issuer, matching the type.
    CONSTRAINT ent_cc_issuer_matches_type CHECK (
        (contract_type = 'government' AND issuer_nation_id IS NOT NULL AND issuer_corp_id IS NULL)
     OR (contract_type = 'private'    AND issuer_corp_id   IS NOT NULL)
    )
);
CREATE INDEX IF NOT EXISTS idx_ent_cc_status        ON ent_construction_contracts (status);
CREATE INDEX IF NOT EXISTS idx_ent_cc_open_close    ON ent_construction_contracts (status, bidding_closes_tick);

CREATE TABLE IF NOT EXISTS ent_construction_bids (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id     uuid NOT NULL REFERENCES ent_construction_contracts(id) ON DELETE CASCADE,
    bidder_corp_id  uuid NOT NULL REFERENCES entrepreneur_corps(id) ON DELETE CASCADE,
    bid_amount      bigint NOT NULL CHECK (bid_amount > 0),
    status          text NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'won', 'lost', 'withdrawn')),
    created_tick    int NOT NULL,
    created_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE (contract_id, bidder_corp_id)
);
CREATE INDEX IF NOT EXISTS idx_ent_cb_contract ON ent_construction_bids (contract_id, status);

COMMENT ON TABLE ent_construction_contracts IS
    'Entrepreneur construction-contract marketplace (lean port of legacy corp_contracts). Government or private (entrepreneur corp) issuers post; construction corps bid; lowest auto-wins; winner builds over timeline_ticks. RPC-write-only.';

ALTER TABLE ent_construction_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ent_construction_bids      ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ent_cc_read_all" ON ent_construction_contracts;
CREATE POLICY "ent_cc_read_all" ON ent_construction_contracts FOR SELECT USING (true);
DROP POLICY IF EXISTS "ent_cb_read_all" ON ent_construction_bids;
CREATE POLICY "ent_cb_read_all" ON ent_construction_bids FOR SELECT USING (true);
-- No write policies: RPC-only (SECURITY DEFINER).

-- ── Generic issuer (called by the private wrapper + future gov RPCs) ──
CREATE OR REPLACE FUNCTION public.ent_issue_construction_contract(
    p_contract_type    text,
    p_issuer_nation_id uuid,
    p_issuer_corp_id   uuid,
    p_issuer_name      text,
    p_name             text,
    p_spec_tier        text,
    p_budget           bigint,
    p_timeline_ticks   int,
    p_bidding_ticks    int,
    p_effects          jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tick int;
    v_id   uuid;
    v_num  text;
BEGIN
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    v_num := upper(left(p_contract_type, 3)) || '-' || v_tick || '-' || left(replace(gen_random_uuid()::text, '-', ''), 5);

    INSERT INTO ent_construction_contracts (
        contract_number, name, contract_type, issuer_nation_id, issuer_corp_id,
        issuer_name, spec_tier, budget, timeline_ticks, bidding_closes_tick,
        completion_effects, created_at_tick
    ) VALUES (
        v_num, p_name, p_contract_type, p_issuer_nation_id, p_issuer_corp_id,
        COALESCE(p_issuer_name, ''), p_spec_tier, p_budget, p_timeline_ticks,
        v_tick + GREATEST(1, COALESCE(p_bidding_ticks, 6)),
        COALESCE(p_effects, '{}'::jsonb), v_tick
    ) RETURNING id INTO v_id;
    RETURN v_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.ent_issue_construction_contract(text,uuid,uuid,text,text,text,bigint,int,int,jsonb) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.ent_issue_construction_contract(text,uuid,uuid,text,text,text,bigint,int,int,jsonb) TO service_role;

-- ── Private issuer: an entrepreneur corp posts a cash-for-work job ──
CREATE OR REPLACE FUNCTION public.ent_issue_private_construction_contract(
    p_issuer_corp_id uuid,
    p_name           text,
    p_spec_tier      text,
    p_budget         bigint,
    p_timeline_ticks int
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid  uuid := auth.uid();
    v_fac  factions%ROWTYPE;
    v_corp entrepreneur_corps%ROWTYPE;
    v_id   uuid;
BEGIN
    IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated'); END IF;
    IF length(btrim(COALESCE(p_name, ''))) < 2 THEN RETURN jsonb_build_object('success', false, 'reason', 'invalid_name'); END IF;
    IF p_spec_tier NOT IN ('light','heavy','mega') THEN RETURN jsonb_build_object('success', false, 'reason', 'invalid_tier'); END IF;
    IF p_budget IS NULL OR p_budget <= 0 THEN RETURN jsonb_build_object('success', false, 'reason', 'invalid_budget'); END IF;
    IF p_timeline_ticks IS NULL OR p_timeline_ticks <= 0 THEN RETURN jsonb_build_object('success', false, 'reason', 'invalid_timeline'); END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_issuer_corp_id;
    IF v_corp.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found'); END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur' AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1;
    IF v_fac.id IS NULL OR v_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;
    -- Must be able to cover the job (paid on completion; checked again then).
    IF COALESCE(v_corp.treasury_cash, 0) < p_budget THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'have', COALESCE(v_corp.treasury_cash,0)::bigint, 'need', p_budget);
    END IF;

    v_id := ent_issue_construction_contract('private', NULL, p_issuer_corp_id,
        v_corp.name, btrim(p_name), p_spec_tier, p_budget, p_timeline_ticks, 6, '{}'::jsonb);
    RETURN jsonb_build_object('success', true, 'contract_id', v_id);
END;
$$;
GRANT EXECUTE ON FUNCTION public.ent_issue_private_construction_contract(uuid,text,text,bigint,int) TO authenticated;

-- ── Bid: an entrepreneur CONSTRUCTION corp bids a price ──
CREATE OR REPLACE FUNCTION public.ent_place_construction_bid(
    p_corp_id     uuid,
    p_contract_id uuid,
    p_bid_amount  bigint
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid      uuid := auth.uid();
    v_fac      factions%ROWTYPE;
    v_corp     entrepreneur_corps%ROWTYPE;
    v_contract ent_construction_contracts%ROWTYPE;
    v_tick     int;
BEGIN
    IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated'); END IF;
    IF p_bid_amount IS NULL OR p_bid_amount <= 0 THEN RETURN jsonb_build_object('success', false, 'reason', 'invalid_amount'); END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id;
    IF v_corp.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found'); END IF;
    IF v_corp.industry <> 'construction' THEN RETURN jsonb_build_object('success', false, 'reason', 'not_construction'); END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur' AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1;
    IF v_fac.id IS NULL OR v_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    SELECT * INTO v_contract FROM ent_construction_contracts WHERE id = p_contract_id FOR UPDATE;
    IF v_contract.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'contract_not_found'); END IF;
    IF v_contract.status <> 'open' THEN RETURN jsonb_build_object('success', false, 'reason', 'not_open'); END IF;
    -- Can't bid on your own private contract.
    IF v_contract.issuer_corp_id IS NOT NULL AND v_contract.issuer_corp_id = p_corp_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'own_contract');
    END IF;
    IF p_bid_amount > v_contract.budget THEN
        RETURN jsonb_build_object('success', false, 'reason', 'over_budget', 'budget', v_contract.budget);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    INSERT INTO ent_construction_bids (contract_id, bidder_corp_id, bid_amount, created_tick)
    VALUES (p_contract_id, p_corp_id, p_bid_amount, v_tick)
    ON CONFLICT (contract_id, bidder_corp_id)
        DO UPDATE SET bid_amount = EXCLUDED.bid_amount, status = 'pending', created_tick = EXCLUDED.created_tick;

    RETURN jsonb_build_object('success', true, 'bid_amount', p_bid_amount);
END;
$$;
GRANT EXECUTE ON FUNCTION public.ent_place_construction_bid(uuid,uuid,bigint) TO authenticated;

-- ── Per-tick: auto-award lowest at close, advance builds, complete ──
CREATE OR REPLACE FUNCTION public.process_ent_construction_contracts(p_tick int)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    RAW_PER_ABSTRACT constant numeric := 1000000;
    v_tick      int;
    c           RECORD;
    v_bid       RECORD;
    v_awarded   int := 0;
    v_cancelled int := 0;
    v_completed int := 0;
    v_failed    int := 0;
    v_pay_ok    boolean;
    v_eff       jsonb;
BEGIN
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, p_tick, 0);

    -- (A) Award: lowest pending bid wins once the window closes.
    FOR c IN
        SELECT * FROM ent_construction_contracts
         WHERE status = 'open' AND bidding_closes_tick <= v_tick FOR UPDATE
    LOOP
        SELECT * INTO v_bid FROM ent_construction_bids
         WHERE contract_id = c.id AND status = 'pending'
         ORDER BY bid_amount ASC, created_tick ASC LIMIT 1;
        IF v_bid.id IS NULL THEN
            UPDATE ent_construction_contracts SET status = 'cancelled' WHERE id = c.id;
            v_cancelled := v_cancelled + 1;
            CONTINUE;
        END IF;
        UPDATE ent_construction_contracts
           SET status = 'active', winner_corp_id = v_bid.bidder_corp_id,
               winning_bid = v_bid.bid_amount, started_at_tick = v_tick, progress_ticks = 0
         WHERE id = c.id;
        UPDATE ent_construction_bids SET status = 'won'  WHERE id = v_bid.id;
        UPDATE ent_construction_bids SET status = 'lost'
         WHERE contract_id = c.id AND id <> v_bid.id AND status = 'pending';
        v_awarded := v_awarded + 1;
    END LOOP;

    -- (B) Advance + complete active builds.
    FOR c IN
        SELECT * FROM ent_construction_contracts WHERE status = 'active' FOR UPDATE
    LOOP
        IF c.progress_ticks + 1 < c.timeline_ticks THEN
            UPDATE ent_construction_contracts SET progress_ticks = progress_ticks + 1 WHERE id = c.id;
            CONTINUE;
        END IF;

        -- Completion: issuer pays winning_bid; winner credited; gov nation bonus.
        v_pay_ok := false;
        IF c.contract_type = 'government' THEN
            UPDATE nations
               SET budget = budget - (c.winning_bid / RAW_PER_ABSTRACT)
             WHERE id = c.issuer_nation_id
               AND COALESCE(budget, 0) * RAW_PER_ABSTRACT >= c.winning_bid;
            v_pay_ok := FOUND;
        ELSE
            UPDATE entrepreneur_corps
               SET treasury_cash = COALESCE(treasury_cash, 0) - c.winning_bid
             WHERE id = c.issuer_corp_id AND COALESCE(treasury_cash, 0) >= c.winning_bid;
            v_pay_ok := FOUND;
        END IF;

        IF NOT v_pay_ok THEN
            UPDATE ent_construction_contracts SET status = 'failed', progress_ticks = c.timeline_ticks WHERE id = c.id;
            v_failed := v_failed + 1;
            CONTINUE;
        END IF;

        UPDATE entrepreneur_corps
           SET treasury_cash = COALESCE(treasury_cash, 0) + c.winning_bid, updated_at = now()
         WHERE id = c.winner_corp_id;

        -- Government completion reward to the issuing nation.
        IF c.contract_type = 'government' THEN
            v_eff := c.completion_effects;
            IF COALESCE((v_eff->>'gdp')::numeric, 0) <> 0 THEN
                PERFORM award_construction_gdp_bonus(c.issuer_nation_id, (v_eff->>'gdp')::numeric);
            END IF;
            UPDATE nations SET
                standard_of_living = LEAST(100, GREATEST(0, COALESCE(standard_of_living,50) + COALESCE((v_eff->>'sol')::numeric, 0))),
                public_approval    = LEAST(100, GREATEST(0, COALESCE(public_approval,50)    + COALESCE((v_eff->>'approval')::numeric, 0)))
             WHERE id = c.issuer_nation_id;
        END IF;

        UPDATE ent_construction_contracts SET status = 'completed', progress_ticks = c.timeline_ticks WHERE id = c.id;
        v_completed := v_completed + 1;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'tick', v_tick,
        'awarded', v_awarded, 'cancelled', v_cancelled, 'completed', v_completed, 'failed', v_failed);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.process_ent_construction_contracts(int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.process_ent_construction_contracts(int) TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
