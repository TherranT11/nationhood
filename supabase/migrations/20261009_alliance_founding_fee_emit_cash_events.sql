-- ════════════════════════════════════════════════════════════════
-- Strategic Alliances: route founding-fee cash flows through
-- emit_corp_cash_event
--
-- Pre-fix: three RPCs mutated factions.corp_cash_reserves directly
-- without writing a corp_cash_events row. Identical pattern to the
-- silent leaks 20260714 patched in the construction/finance RPCs
-- and 20261007 patched in pay_out_equity. Got missed because
-- alliances landed (20260813 / 20260814) AFTER the silent-leak
-- pattern was established but in their own subsystem.
--
-- Affected RPCs:
--   propose_strategic_alliance         — founder pays $20M + $7M×N
--                                        invitees on propose
--   withdraw_strategic_alliance        — refund on founder-driven
--                                        withdrawal during
--                                        negotiation
--   dissolve_failed_alliance_negotiations
--                                       — refund on tick-driven
--                                        auto-dissolve after the
--                                        6-tick negotiation window
--
-- Result of the leak: a $20M-$90M founding fee debit, and any
-- subsequent refund, both invisible on the corp dashboards
-- Revenue / Costs ledger. Founders saw their cash balance drop
-- without an explanation row.
--
-- Fix shape:
--   * Replace the direct UPDATE factions ... corp_cash_reserves
--     blocks with PERFORM emit_corp_cash_event(...). The helper
--     atomically (a) writes a corp_cash_events row and (b) adjusts
--     corp_cash_reserves by the same delta — single transaction,
--     ledger and balance can't drift.
--   * dissolve_failed_alliance_negotiations also gets the alliance
--     name added to its SELECT projection so the refund label can
--     identify which alliance is being refunded.
--
-- Categories used:
--   capital_out  — founder pays the founding fee (non-P&L cash out)
--   capital_in   — founder receives a refund (non-P&L cash in)
--
-- Fee is sunk on a successful ratification (no refund event fires);
-- the original capital_out remains uncancelled on the ledger, which
-- is the correct accounting story.
--
-- Idempotent (CREATE OR REPLACE on all three functions). No schema
-- changes; all three columns referenced in new code already exist.
-- ════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. propose_strategic_alliance ───────────────────────────────
CREATE OR REPLACE FUNCTION propose_strategic_alliance(
    p_founder_faction_id UUID,
    p_name               TEXT,
    p_mission            TEXT,
    p_invitee_ids        UUID[]
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_founder       factions%ROWTYPE;
    v_invitee       factions%ROWTYPE;
    v_invitee_id    UUID;
    v_alliance_id   UUID;
    v_tick          INT;
    v_base_fee      CONSTANT BIGINT := 20000000;
    v_per_invitee   CONSTANT BIGINT :=  7000000;
    v_total_fee     BIGINT;
    v_n_invitees    INT;
    v_alliance_name TEXT;
BEGIN
    v_founder := _alliance_owner_faction(p_founder_faction_id);
    IF v_founder.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not own this corporation');
    END IF;
    SELECT * INTO v_founder FROM factions WHERE id = p_founder_faction_id FOR UPDATE;
    IF v_founder.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Founder corporation not found');
    END IF;
    IF p_name IS NULL OR length(trim(p_name)) = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Alliance name is required');
    END IF;

    v_n_invitees := COALESCE(array_length(p_invitee_ids, 1), 0);
    IF v_n_invitees < 2 OR v_n_invitees > 10 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Need 2–10 invitees');
    END IF;

    v_total_fee := v_base_fee + v_per_invitee * v_n_invitees;
    IF COALESCE(v_founder.corp_cash_reserves, 0) < v_total_fee THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Need $%s for the founding fee', to_char(v_total_fee, 'FM999,999,999')));
    END IF;

    FOREACH v_invitee_id IN ARRAY p_invitee_ids LOOP
        IF v_invitee_id = p_founder_faction_id THEN
            RETURN jsonb_build_object('success', false, 'error', 'Cannot invite yourself');
        END IF;
        SELECT * INTO v_invitee FROM factions
        WHERE id = v_invitee_id AND faction_type = 'corporation' AND abandoned_at IS NULL;
        IF v_invitee.id IS NULL THEN
            RETURN jsonb_build_object('success', false,
                'error', 'Invited corporation not found or abandoned');
        END IF;
        IF v_invitee.corp_sector IS DISTINCT FROM v_founder.corp_sector THEN
            RETURN jsonb_build_object('success', false,
                'error', format('Invitees must be %s corporations', v_founder.corp_sector));
        END IF;
    END LOOP;
    IF v_n_invitees <> (SELECT count(DISTINCT id) FROM unnest(p_invitee_ids) AS id) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Duplicate invitees');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    v_alliance_name := trim(p_name);

    INSERT INTO strategic_alliances (
        name, sector, founder_faction_id, mission,
        founding_fee_paid, proposed_at_tick
    ) VALUES (
        v_alliance_name, v_founder.corp_sector, p_founder_faction_id,
        NULLIF(trim(COALESCE(p_mission, '')), ''),
        v_total_fee, v_tick
    ) RETURNING id INTO v_alliance_id;

    INSERT INTO alliance_members (alliance_id, faction_id, role, joined_at_tick)
    VALUES (v_alliance_id, p_founder_faction_id, 'founder', v_tick);

    INSERT INTO alliance_members (alliance_id, faction_id, role, joined_at_tick)
    SELECT v_alliance_id, id, 'member', v_tick FROM unnest(p_invitee_ids) AS id;

    -- Founder pays the founding fee. Routed through the SSoT helper so
    -- the dashboards Costs card reflects the outflow with an explicit
    -- label. Pre-fix this was a direct UPDATE on corp_cash_reserves
    -- with no event row — silent leak.
    PERFORM emit_corp_cash_event(
        p_founder_faction_id,
        'capital_out',
        'Alliance founding fee: ' || v_alliance_name,
        -v_total_fee,
        v_tick
    );

    RETURN jsonb_build_object(
        'success', true,
        'alliance_id', v_alliance_id,
        'founding_fee', v_total_fee
    );
END;
$$;

GRANT EXECUTE ON FUNCTION propose_strategic_alliance(UUID, TEXT, TEXT, UUID[]) TO authenticated;


-- ── 2. withdraw_strategic_alliance ──────────────────────────────
CREATE OR REPLACE FUNCTION withdraw_strategic_alliance(
    p_founder_faction_id UUID,
    p_alliance_id        UUID
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_founder  factions%ROWTYPE;
    v_alliance strategic_alliances%ROWTYPE;
    v_tick     INT;
BEGIN
    v_founder := _alliance_owner_faction(p_founder_faction_id);
    IF v_founder.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not own this corporation');
    END IF;
    SELECT * INTO v_alliance FROM strategic_alliances WHERE id = p_alliance_id FOR UPDATE;
    IF v_alliance.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Alliance not found');
    END IF;
    IF v_alliance.founder_faction_id <> p_founder_faction_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Only the founder can withdraw');
    END IF;
    IF v_alliance.status <> 'negotiating' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Only negotiating proposals can be withdrawn');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE strategic_alliances
    SET status = 'dissolved',
        dissolved_at_tick = v_tick,
        dissolved_reason = 'withdrawn'
    WHERE id = p_alliance_id;

    -- Refund the founding fee. Routed through the SSoT helper so the
    -- dashboards Revenue card reflects the refund. Pre-fix: direct
    -- UPDATE on corp_cash_reserves with no event — silent leak.
    --
    -- EXISTS guard: corp_cash_events.corp_id has an FK to factions(id).
    -- If the founder corp was deleted between propose and withdraw
    -- (e.g. bankruptcy), the helper's INSERT would FK-violate and
    -- abort. Original code's direct UPDATE silently matched 0 rows;
    -- preserve that semantic — refund is silently lost if the founder
    -- corp no longer exists.
    IF EXISTS (SELECT 1 FROM factions WHERE id = p_founder_faction_id) THEN
        PERFORM emit_corp_cash_event(
            p_founder_faction_id,
            'capital_in',
            'Alliance withdrawn — refund: ' || v_alliance.name,
            v_alliance.founding_fee_paid,
            v_tick
        );
    END IF;

    UPDATE alliance_members SET left_at_tick = v_tick
    WHERE alliance_id = p_alliance_id AND left_at_tick IS NULL;

    DELETE FROM alliance_negotiation_votes WHERE alliance_id = p_alliance_id;

    RETURN jsonb_build_object('success', true, 'refunded', v_alliance.founding_fee_paid);
END;
$$;

GRANT EXECUTE ON FUNCTION withdraw_strategic_alliance(UUID, UUID) TO authenticated;


-- ── 3. dissolve_failed_alliance_negotiations ────────────────────
-- SELECT projection adds `name` so the refund label identifies the
-- specific alliance being dissolved.
CREATE OR REPLACE FUNCTION dissolve_failed_alliance_negotiations(
    p_current_tick INT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_timeout       CONSTANT INT := 6;
    v_rep_penalty   CONSTANT NUMERIC := -1;
    v_alliance      RECORD;
    v_dissolved     INT := 0;
    v_total_refund  BIGINT := 0;
BEGIN
    FOR v_alliance IN
        SELECT id, name, founder_faction_id, founding_fee_paid
        FROM strategic_alliances
        WHERE status = 'negotiating'
          AND p_current_tick - proposed_at_tick >= v_timeout
        FOR UPDATE
    LOOP
        -- Refund the founding fee. Routed through the SSoT helper so
        -- the refund is visible on the dashboard. Pre-fix: direct
        -- UPDATE — silent leak.
        --
        -- EXISTS guard: corp_cash_events.corp_id FK to factions(id)
        -- means a deleted founder (e.g. went bankrupt mid-negotiation)
        -- would FK-violate on INSERT and blow up the entire sweep.
        -- Skip silently in that case — same semantic as the original
        -- "UPDATE matches 0 rows = silently lost" path.
        IF EXISTS (SELECT 1 FROM factions WHERE id = v_alliance.founder_faction_id) THEN
            PERFORM emit_corp_cash_event(
                v_alliance.founder_faction_id,
                'capital_in',
                'Alliance auto-dissolved — refund: ' || v_alliance.name,
                v_alliance.founding_fee_paid,
                p_current_tick
            );
        END IF;

        -- −1 Reputation to every still-active member (founder included).
        -- Floored at 0 so a corp at reputation 0 can't go negative.
        UPDATE factions
        SET corp_reputation = GREATEST(0::numeric,
                                       COALESCE(corp_reputation, 0) + v_rep_penalty)
        WHERE id IN (
            SELECT faction_id FROM alliance_members
            WHERE alliance_id = v_alliance.id AND left_at_tick IS NULL
        );

        UPDATE alliance_members
        SET left_at_tick = p_current_tick
        WHERE alliance_id = v_alliance.id AND left_at_tick IS NULL;

        DELETE FROM alliance_negotiation_votes
        WHERE alliance_id = v_alliance.id;

        UPDATE strategic_alliances
        SET status = 'dissolved',
            dissolved_at_tick = p_current_tick,
            dissolved_reason = 'consensus_failed'
        WHERE id = v_alliance.id;

        v_dissolved := v_dissolved + 1;
        v_total_refund := v_total_refund + v_alliance.founding_fee_paid;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'dissolved_count', v_dissolved,
        'total_refunded', v_total_refund
    );
END;
$$;

GRANT EXECUTE ON FUNCTION dissolve_failed_alliance_negotiations(INT) TO service_role;

COMMIT;

NOTIFY pgrst, 'reload schema';
