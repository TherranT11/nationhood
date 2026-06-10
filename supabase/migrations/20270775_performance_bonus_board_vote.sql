-- ════════════════════════════════════════════════════════════════════
-- 20270775 — Performance Bonus (board-voted CEO payout, public corps)
--
-- The owner of a PUBLIC corp proposes a performance bonus for
-- themselves: pick a dollar amount, send it to the Board of
-- Directors as a YES/NO vote (Pressing Issues card per director).
--
--   • YES (majority): the escrowed amount pays out to the owner's
--     personal funds and the market reads board confidence —
--     share price +3%.
--   • NO (majority impossible to overturn): escrow refunds and the
--     market reads governance dysfunction — share price falls
--     0.2% per $1,000,000 proposed (a rejected $10M ask = −2%).
--     Total drop clamped at 90%; price floored at $0.01.
--
-- Why public-only: private corps already have Withdraw (treasury →
-- owner, no questions asked). Public corps lost that to the
-- use_dividend rule — the Performance Bonus is their extraction
-- path, priced in board oversight and market risk.
--
-- Vote mechanics mirror the board-join flow (20270160): voter pool
-- snapshot at proposal time (current corp_board_seats — the CEO
-- does NOT vote on their own bonus), YES threshold
-- ceil(pool × 0.51), corp row locked FIRST (global lock order).
-- Differences: the pool snapshot is a uuid[] on the proposal row
-- (no third table), and rejection resolves EARLY the moment a YES
-- majority becomes arithmetically impossible — no tick-processor
-- expiry. A dead board can't strand the escrow because the owner
-- can CANCEL a pending proposal (refund, no share-price effect).
--
-- Conservation: escrow out at proposal, exactly one of payout /
-- refund at resolution. Share price is a numeric column move, no
-- cash flow (same posture as board join/leave).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Proposals + votes ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.corp_bonus_proposals (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    corp_id          uuid   NOT NULL REFERENCES entrepreneur_corps(id) ON DELETE CASCADE,
    amount           bigint NOT NULL CHECK (amount > 0),
    status           text   NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','approved','rejected','cancelled')),
    voter_pool       uuid[] NOT NULL,   -- corp_board_seats members at proposal time
    proposed_at_tick int    NOT NULL,
    resolved_at_tick int,
    created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS corp_bonus_proposals_corp_pending_idx
    ON public.corp_bonus_proposals (corp_id) WHERE status = 'pending';

COMMENT ON TABLE public.corp_bonus_proposals IS
    'CEO performance-bonus proposals voted on by the board (public corps only). Escrowed at proposal; YES majority pays the owner +3%% share price, NO majority refunds and drops share price 0.2%%/$1M proposed. voter_pool snapshots corp_board_seats at proposal — the CEO never votes on their own bonus. RPC-only writes. 20270775.';

CREATE TABLE IF NOT EXISTS public.corp_bonus_votes (
    proposal_id      uuid NOT NULL REFERENCES corp_bonus_proposals(id) ON DELETE CASCADE,
    voter_faction_id uuid NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    vote_yes         boolean NOT NULL,
    voted_at_tick    int NOT NULL,
    PRIMARY KEY (proposal_id, voter_faction_id)
);

ALTER TABLE public.corp_bonus_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corp_bonus_votes     ENABLE ROW LEVEL SECURITY;

-- Public-market governance records — same public-SELECT class as
-- corp_board_seats / corp_board_requests (these are public corps by
-- definition, and the resolved amounts go in the public event log).
DROP POLICY IF EXISTS corp_bonus_proposals_select ON public.corp_bonus_proposals;
CREATE POLICY corp_bonus_proposals_select ON public.corp_bonus_proposals
    FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS corp_bonus_proposals_service_all ON public.corp_bonus_proposals;
CREATE POLICY corp_bonus_proposals_service_all ON public.corp_bonus_proposals
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS corp_bonus_votes_select ON public.corp_bonus_votes;
CREATE POLICY corp_bonus_votes_select ON public.corp_bonus_votes
    FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS corp_bonus_votes_service_all ON public.corp_bonus_votes;
CREATE POLICY corp_bonus_votes_service_all ON public.corp_bonus_votes
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── 2. propose_performance_bonus ─────────────────────────────────
CREATE OR REPLACE FUNCTION public.propose_performance_bonus(
    p_corp_id uuid,
    p_amount  bigint
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid   uuid := auth.uid();
    v_fac   factions%ROWTYPE;
    v_corp  entrepreneur_corps%ROWTYPE;
    v_pool  uuid[];
    v_tick  int;
    v_id    uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_amount IS NULL OR p_amount < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_amount');
    END IF;

    -- Corp row FIRST (global lock order with corp_trade / go_public /
    -- board join/leave).
    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur' AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1;
    IF v_fac.id IS NULL OR v_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    IF v_corp.listing <> 'public' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_public');
    END IF;

    -- Snapshot the board. The CEO doesn't vote on their own bonus,
    -- so the pool is exactly the corp_board_seats members.
    SELECT COALESCE(array_agg(member_faction_id), ARRAY[]::uuid[])
      INTO v_pool
      FROM corp_board_seats
     WHERE corp_id = v_corp.id;
    IF COALESCE(array_length(v_pool, 1), 0) = 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_board');
    END IF;

    IF EXISTS (SELECT 1 FROM corp_bonus_proposals
                WHERE corp_id = v_corp.id AND status = 'pending') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'proposal_already_pending');
    END IF;

    IF COALESCE(v_corp.treasury_cash, 0) < p_amount THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_treasury',
            'have', COALESCE(v_corp.treasury_cash, 0), 'need', p_amount);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- Escrow.
    UPDATE entrepreneur_corps
       SET treasury_cash = treasury_cash - p_amount
     WHERE id = v_corp.id;

    INSERT INTO corp_bonus_proposals (corp_id, amount, voter_pool, proposed_at_tick)
    VALUES (v_corp.id, p_amount, v_pool, v_tick)
    RETURNING id INTO v_id;

    RETURN jsonb_build_object(
        'success',     true,
        'proposal_id', v_id,
        'amount',      p_amount,
        'pool_size',   array_length(v_pool, 1)
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.propose_performance_bonus(uuid, bigint) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.propose_performance_bonus(uuid, bigint) TO authenticated;

-- ── 3. vote_performance_bonus ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.vote_performance_bonus(
    p_proposal_id uuid,
    p_faction_id  uuid,
    p_vote_yes    boolean
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid        uuid := auth.uid();
    v_voter      factions%ROWTYPE;
    v_prop       corp_bonus_proposals%ROWTYPE;
    v_corp       entrepreneur_corps%ROWTYPE;
    v_tick       int;
    v_pool_size  int;
    v_threshold  int;
    v_yes        int;
    v_no         int;
    v_resolved   text := NULL;
    v_drop_pct   numeric;
    v_new_price  numeric;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_proposal_id IS NULL OR p_faction_id IS NULL OR p_vote_yes IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_voter FROM factions
     WHERE id = p_faction_id
       AND faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid);
    IF v_voter.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;

    SELECT * INTO v_prop FROM corp_bonus_proposals
     WHERE id = p_proposal_id
     FOR UPDATE;
    IF v_prop.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'proposal_not_found');
    END IF;
    IF v_prop.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_resolved',
            'status', v_prop.status);
    END IF;
    IF NOT (v_voter.id = ANY(v_prop.voter_pool)) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_in_pool');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    BEGIN
        INSERT INTO corp_bonus_votes (proposal_id, voter_faction_id, vote_yes, voted_at_tick)
        VALUES (v_prop.id, v_voter.id, p_vote_yes, v_tick);
    EXCEPTION WHEN unique_violation THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_voted');
    END;

    v_pool_size := array_length(v_prop.voter_pool, 1);
    v_threshold := CEIL(v_pool_size::numeric * 0.51)::int;
    SELECT COUNT(*) FILTER (WHERE vote_yes),
           COUNT(*) FILTER (WHERE NOT vote_yes)
      INTO v_yes, v_no
      FROM corp_bonus_votes
     WHERE proposal_id = v_prop.id;

    IF v_yes >= v_threshold THEN
        v_resolved := 'approved';
    ELSIF v_pool_size - v_no < v_threshold THEN
        -- YES can no longer reach the threshold — reject early.
        v_resolved := 'rejected';
    END IF;

    IF v_resolved IS NOT NULL THEN
        SELECT * INTO v_corp FROM entrepreneur_corps
         WHERE id = v_prop.corp_id
         FOR UPDATE;
        IF v_corp.id IS NULL THEN
            -- Corp gone mid-vote (CASCADE should have removed the
            -- proposal; defend anyway).
            RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
        END IF;

        v_new_price := v_corp.share_price;

        IF v_resolved = 'approved' THEN
            -- Pay the escrow to the owner; board confidence → +3%.
            UPDATE factions
               SET party_funds = COALESCE(party_funds, 0) + v_prop.amount
             WHERE id = v_corp.owner_faction_id;
            IF v_corp.share_price IS NOT NULL THEN
                v_new_price := v_corp.share_price * 1.03;
                UPDATE entrepreneur_corps
                   SET share_price = v_new_price
                 WHERE id = v_corp.id;
            END IF;
        ELSE
            -- Refund the escrow; governance dysfunction →
            -- −0.2% per $1M proposed, clamped at −90%, floor $0.01.
            UPDATE entrepreneur_corps
               SET treasury_cash = COALESCE(treasury_cash, 0) + v_prop.amount
             WHERE id = v_corp.id;
            IF v_corp.share_price IS NOT NULL THEN
                v_drop_pct  := LEAST(90, 0.2 * floor(v_prop.amount / 1000000));
                v_new_price := GREATEST(0.01, v_corp.share_price * (1 - v_drop_pct / 100));
                UPDATE entrepreneur_corps
                   SET share_price = v_new_price
                 WHERE id = v_corp.id;
            END IF;
        END IF;

        UPDATE corp_bonus_proposals
           SET status = v_resolved, resolved_at_tick = v_tick
         WHERE id = v_prop.id;

        -- Public corp → amount disclosed in the corporate record.
        INSERT INTO event_log (
            nation_id, faction_id,
            event_name, description_used,
            category, trigger_key, effects_applied, fired_at_tick
        ) VALUES (
            v_corp.hq_nation_id, v_corp.owner_faction_id,
            CASE WHEN v_resolved = 'approved'
                 THEN 'Performance Bonus Approved'
                 ELSE 'Performance Bonus Rejected' END,
            CASE WHEN v_resolved = 'approved'
                 THEN v_corp.name || '''s board approved a $'
                      || to_char(v_prop.amount, 'FM999,999,999,999')
                      || ' performance bonus for its chief executive.'
                 ELSE v_corp.name || '''s board rejected a $'
                      || to_char(v_prop.amount, 'FM999,999,999,999')
                      || ' performance bonus for its chief executive.' END,
            'business', 'corp_performance_bonus',
            jsonb_build_object(
                'corp_id',     v_corp.id,
                'proposal_id', v_prop.id,
                'amount',      v_prop.amount,
                'outcome',     v_resolved,
                'share_price', v_new_price
            ),
            v_tick
        );
    END IF;

    RETURN jsonb_build_object(
        'success',    true,
        'vote',       p_vote_yes,
        'yes_count',  v_yes,
        'no_count',   v_no,
        'pool_size',  v_pool_size,
        'threshold',  v_threshold,
        'resolved',   v_resolved
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.vote_performance_bonus(uuid, uuid, boolean) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.vote_performance_bonus(uuid, uuid, boolean) TO authenticated;

-- ── 4. cancel_performance_bonus ──────────────────────────────────
-- Owner escape hatch for a board that never votes — refunds the
-- escrow, no share-price effect. No tick-processor expiry needed.
CREATE OR REPLACE FUNCTION public.cancel_performance_bonus(p_proposal_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid  uuid := auth.uid();
    v_fac  factions%ROWTYPE;
    v_prop corp_bonus_proposals%ROWTYPE;
    v_corp entrepreneur_corps%ROWTYPE;
    v_tick int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_proposal_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_prop FROM corp_bonus_proposals
     WHERE id = p_proposal_id
     FOR UPDATE;
    IF v_prop.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'proposal_not_found');
    END IF;
    IF v_prop.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_resolved',
            'status', v_prop.status);
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps
     WHERE id = v_prop.corp_id
     FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur' AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1;
    IF v_fac.id IS NULL OR v_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE entrepreneur_corps
       SET treasury_cash = COALESCE(treasury_cash, 0) + v_prop.amount
     WHERE id = v_corp.id;
    UPDATE corp_bonus_proposals
       SET status = 'cancelled', resolved_at_tick = v_tick
     WHERE id = v_prop.id;

    RETURN jsonb_build_object('success', true, 'refunded', v_prop.amount);
END $$;

REVOKE EXECUTE ON FUNCTION public.cancel_performance_bonus(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.cancel_performance_bonus(uuid) TO authenticated;

-- ── 5. list_pending_bonus_votes_for_director ─────────────────────
-- Pressing Issues source: pending proposals where the caller is in
-- the voter pool and hasn't voted yet.
CREATE OR REPLACE FUNCTION public.list_pending_bonus_votes_for_director(p_faction_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid    uuid := auth.uid();
    v_fac    factions%ROWTYPE;
    v_result jsonb;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE id = p_faction_id
       AND faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid);
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'proposal_id',      bp.id,
                'corp_id',          bp.corp_id,
                'corp_name',        ec.name,
                'amount',           bp.amount,
                'proposed_at_tick', bp.proposed_at_tick,
                'pool_size',        array_length(bp.voter_pool, 1)
           ) ORDER BY bp.proposed_at_tick DESC), '[]'::jsonb)
      INTO v_result
      FROM corp_bonus_proposals bp
      JOIN entrepreneur_corps ec ON ec.id = bp.corp_id
     WHERE bp.status = 'pending'
       AND v_fac.id = ANY(bp.voter_pool)
       AND NOT EXISTS (
           SELECT 1 FROM corp_bonus_votes v
            WHERE v.proposal_id = bp.id
              AND v.voter_faction_id = v_fac.id
       );

    RETURN jsonb_build_object('success', true, 'proposals', v_result);
END $$;

REVOKE EXECUTE ON FUNCTION public.list_pending_bonus_votes_for_director(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.list_pending_bonus_votes_for_director(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
