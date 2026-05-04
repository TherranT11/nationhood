-- 20260815_aligned_interest_runtime.sql
--
-- Strategic Alliances — Push B: Aligned Interest article runtime.
--
-- Wires the first per-article rule into actual gameplay. The article
-- spec: "Members agree on a band of acceptable interest rates for
-- commercial lending. Loans extended at rates outside the agreed band
-- trigger −2 Cohesion for the alliance and −1 Reputation for the
-- corporation that violated."
--
-- Pieces:
--   1. Two new nullable columns on strategic_alliances:
--        aligned_interest_floor_apr   numeric
--        aligned_interest_ceiling_apr numeric
--      Set when the article is ratified (auto-derived from the median
--      of members' corp_interest_rates ± a buffer). Stay NULL on
--      alliances that never ratified the article — the runtime hook
--      treats NULL as "no constraint" and is a no-op.
--
--   2. Helper RPC _apply_aligned_interest_penalty(lender, apr) that
--      checks if the lender is in an Aligned-Interest alliance and
--      applies the penalties when the APR is outside the band. Returns
--      true on breach. Single source of truth so the same logic runs
--      whether the loan fires from _fire_negotiation, the legacy bank
--      offer flow, or any future loan-issuance path.
--
--   3. ratify_strategic_alliance re-issued: same body as 20260813 but
--      with an extra block that auto-derives the band when ratifying
--      'aligned_interest'.
--
--   4. _fire_negotiation re-issued: same body as 20260725 but with the
--      penalty helper called immediately after the loan is created.
--
-- Penalties are clamped at floor 0 (cohesion + reputation never go
-- negative). Loan still fires regardless — Aligned Interest is a
-- self-policing penalty, not a hard block.

BEGIN;

-- ── 1. Schema columns ────────────────────────────────────────────
ALTER TABLE strategic_alliances
    ADD COLUMN IF NOT EXISTS aligned_interest_floor_apr   NUMERIC,
    ADD COLUMN IF NOT EXISTS aligned_interest_ceiling_apr NUMERIC;

COMMENT ON COLUMN strategic_alliances.aligned_interest_floor_apr IS
    'Minimum APR (per cent) the alliance allows on commercial loans, set when the Aligned Interest article is ratified. NULL = article not active. Loans below the floor trigger −2 Cohesion + −1 Reputation via _apply_aligned_interest_penalty.';
COMMENT ON COLUMN strategic_alliances.aligned_interest_ceiling_apr IS
    'Maximum APR (per cent) the alliance allows on commercial loans. Mirror of the floor.';

-- ── 2. Penalty helper ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION _apply_aligned_interest_penalty(
    p_lender_faction_id UUID,
    p_apr               NUMERIC
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_alliance_id UUID;
    v_floor       NUMERIC;
    v_ceiling     NUMERIC;
BEGIN
    -- No-op fast path: not in an Aligned-Interest alliance.
    v_alliance_id := _alliance_member_has_article(p_lender_faction_id, 'aligned_interest');
    IF v_alliance_id IS NULL THEN RETURN false; END IF;

    SELECT aligned_interest_floor_apr, aligned_interest_ceiling_apr
    INTO v_floor, v_ceiling
    FROM strategic_alliances WHERE id = v_alliance_id;

    -- Band not configured yet (NULL on either side) — nothing to enforce.
    IF v_floor IS NULL OR v_ceiling IS NULL THEN RETURN false; END IF;

    -- APR null/non-numeric guards: treat as "inside band" — no penalty
    -- (the upstream loan-fire path already validates apr).
    IF p_apr IS NULL THEN RETURN false; END IF;
    IF p_apr >= v_floor AND p_apr <= v_ceiling THEN RETURN false; END IF;

    -- Breach. Apply penalties (clamp ≥ 0 so a low-rep corp can't go negative).
    UPDATE strategic_alliances
    SET cohesion = GREATEST(0::numeric, COALESCE(cohesion, 0) - 2)
    WHERE id = v_alliance_id;

    UPDATE factions
    SET corp_reputation = GREATEST(0::numeric, COALESCE(corp_reputation, 0) - 1)
    WHERE id = p_lender_faction_id;

    RETURN true;
END;
$$;

REVOKE EXECUTE ON FUNCTION _apply_aligned_interest_penalty(UUID, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION _apply_aligned_interest_penalty(UUID, NUMERIC) TO service_role;

COMMENT ON FUNCTION _apply_aligned_interest_penalty(UUID, NUMERIC) IS
    'Aligned Interest enforcement. If the lender is in an alliance with the Aligned Interest article ratified and a configured band, and the APR is outside [floor, ceiling], deducts 2 Cohesion from the alliance and 1 Reputation from the lender (both clamped ≥ 0). Returns true on breach. Loan is NOT blocked — penalty is self-policing.';


-- ── 3. ratify_strategic_alliance — auto-derive band on Aligned Interest ──
-- Re-issue with the extra dispatch block. Body otherwise unchanged
-- from 20260813.
CREATE OR REPLACE FUNCTION ratify_strategic_alliance(
    p_founder_faction_id UUID,
    p_alliance_id        UUID,
    p_article_name       TEXT,
    p_article_kind       TEXT,
    p_article_body       TEXT,
    p_cartel_score       NUMERIC,
    p_chs_bonus          NUMERIC
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_founder    factions%ROWTYPE;
    v_alliance   strategic_alliances%ROWTYPE;
    v_member_n   INT;
    v_voted_n    INT;
    v_distinct_n INT;
    v_consensus  TEXT;
    v_tick       INT;
    v_median_apr NUMERIC;
    v_floor      NUMERIC;
    v_ceiling    NUMERIC;
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
        RETURN jsonb_build_object('success', false, 'error', 'Only the founder can ratify');
    END IF;
    IF v_alliance.status <> 'negotiating' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Alliance is not in negotiation');
    END IF;

    SELECT count(*) INTO v_member_n
    FROM alliance_members WHERE alliance_id = p_alliance_id AND left_at_tick IS NULL;

    SELECT count(*), count(DISTINCT article_id)
    INTO v_voted_n, v_distinct_n
    FROM alliance_negotiation_votes WHERE alliance_id = p_alliance_id;

    IF v_voted_n < v_member_n THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Awaiting %s more vote(s) before ratification', v_member_n - v_voted_n));
    END IF;
    IF v_distinct_n <> 1 THEN
        RETURN jsonb_build_object('success', false,
            'error', 'Members are split — all must vote on the same article');
    END IF;

    SELECT article_id INTO v_consensus
    FROM alliance_negotiation_votes WHERE alliance_id = p_alliance_id LIMIT 1;

    IF p_article_kind IS NULL OR p_article_kind NOT IN ('cooperative','coordinating','cartel') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid article kind');
    END IF;
    p_cartel_score := LEAST(10::numeric, GREATEST(0::numeric, COALESCE(p_cartel_score, 0)));
    p_chs_bonus    := LEAST(10::numeric, GREATEST(0::numeric, COALESCE(p_chs_bonus,   0)));

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE strategic_alliances
    SET status = 'active',
        founded_at_tick = v_tick,
        cohesion = LEAST(10::numeric, COALESCE(cohesion, 0) + p_chs_bonus)
    WHERE id = p_alliance_id;

    INSERT INTO alliance_articles (
        alliance_id, article_id, article_name, article_kind, article_body,
        cartel_score, chs_bonus, ratified_at_tick
    ) VALUES (
        p_alliance_id, v_consensus, p_article_name, p_article_kind, p_article_body,
        p_cartel_score, p_chs_bonus, v_tick
    );

    DELETE FROM alliance_negotiation_votes WHERE alliance_id = p_alliance_id;

    -- ── Article-specific initialization ──
    -- Aligned Interest: derive a sensible default rate band from the
    -- median of members' corp_interest_rates. Floor = median (typical
    -- bank floor); Ceiling = median + 4 (4-pt spread). Clamped to
    -- [0, 12] to match the system-wide APR cap.
    IF v_consensus = 'aligned_interest' THEN
        SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY COALESCE(f.corp_interest_rates, 5))
        INTO v_median_apr
        FROM factions f
        JOIN alliance_members am ON am.faction_id = f.id
        WHERE am.alliance_id = p_alliance_id AND am.left_at_tick IS NULL;
        v_median_apr := COALESCE(v_median_apr, 5.0);
        v_floor   := GREATEST(0::numeric,  v_median_apr);
        v_ceiling := LEAST(12::numeric,    v_median_apr + 4.0);

        UPDATE strategic_alliances
        SET aligned_interest_floor_apr   = v_floor,
            aligned_interest_ceiling_apr = v_ceiling
        WHERE id = p_alliance_id;
    END IF;

    RETURN jsonb_build_object('success', true, 'article_id', v_consensus);
END;
$$;

GRANT EXECUTE ON FUNCTION ratify_strategic_alliance(UUID, UUID, TEXT, TEXT, TEXT, NUMERIC, NUMERIC) TO authenticated;


-- ── 4. _fire_negotiation — apply Aligned Interest check on loan fire ──
-- Re-issue the latest body (from 20260725) with one additional line:
-- after the loan is created and the borrower's debt updated, run the
-- penalty helper. Single PERFORM call so the diff against 20260725 is
-- minimal and the article wiring stays surgical.
CREATE OR REPLACE FUNCTION _fire_negotiation(p_neg_id UUID, p_tick INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_neg          loan_negotiations%ROWTYPE;
    v_borrower     factions%ROWTYPE;
    v_lender       factions%ROWTYPE;
    v_request_id   UUID;
    v_loan_id      UUID;
    v_sibling      RECORD;
    v_siblings_abandoned INTEGER := 0;
    v_aligned_breach BOOLEAN;
BEGIN
    SELECT * INTO v_neg FROM loan_negotiations WHERE id = p_neg_id FOR UPDATE;

    IF v_neg.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Negotiation not found');
    END IF;
    IF v_neg.status <> 'open' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Negotiation is not open');
    END IF;
    IF NOT v_neg.borrower_agreed OR NOT v_neg.lender_agreed THEN
        RETURN jsonb_build_object('success', false, 'error', 'Both parties must agree first');
    END IF;
    IF v_neg.escrowed_lender_cash <> v_neg.principal THEN
        RETURN jsonb_build_object('success', false, 'error', 'Escrow does not match principal');
    END IF;

    SELECT * INTO v_borrower FROM factions WHERE id = v_neg.borrower_faction_id;
    SELECT * INTO v_lender   FROM factions WHERE id = v_neg.lender_faction_id;
    IF v_borrower.id IS NULL OR v_lender.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Borrower or lender no longer exists');
    END IF;

    INSERT INTO bank_loan_requests (
        requesting_faction_id, requesting_nation_id,
        target_bank_ids, principal, term_ticks, requested_apr,
        risk_grade, purpose, status,
        expires_at_tick, winning_bank_id,
        created_at_tick, resolved_at_tick
    ) VALUES (
        v_neg.borrower_faction_id, v_neg.nation_id,
        ARRAY[v_neg.lender_faction_id]::UUID[],
        v_neg.principal, v_neg.term_ticks, v_neg.apr,
        'B', COALESCE(NULLIF(v_neg.purpose, ''), 'Negotiated loan'), 'approved',
        p_tick + v_neg.term_ticks, v_neg.lender_faction_id,
        p_tick, p_tick
    ) RETURNING id INTO v_request_id;

    INSERT INTO bank_loans (
        request_id, lender_faction_id, borrower_faction_id, nation_id,
        principal, apr, term_ticks, outstanding, payments_missed,
        status, issued_at_tick, matures_at_tick, last_payment_tick,
        collateral
    ) VALUES (
        v_request_id, v_neg.lender_faction_id, v_neg.borrower_faction_id, v_neg.nation_id,
        v_neg.principal, v_neg.apr, v_neg.term_ticks, v_neg.principal, 0,
        'active', p_tick, p_tick + v_neg.term_ticks, NULL,
        v_neg.collateral
    ) RETURNING id INTO v_loan_id;

    PERFORM emit_corp_cash_event(
        v_neg.borrower_faction_id,
        'capital_in',
        'Loan principal · negotiated with ' || COALESCE(v_lender.faction_name, 'lender'),
        v_neg.principal,
        p_tick
    );

    UPDATE factions
       SET corp_debt = COALESCE(corp_debt, 0) + v_neg.principal
     WHERE id = v_neg.borrower_faction_id;

    -- ── Aligned Interest check (added in 20260815) ──
    -- Penalty helper is a no-op when the lender isn't in an
    -- Aligned-Interest alliance; safe to call unconditionally.
    v_aligned_breach := _apply_aligned_interest_penalty(v_neg.lender_faction_id, v_neg.apr);

    UPDATE loan_negotiations
       SET status               = 'fired',
           fired_to_loan_id     = v_loan_id,
           escrowed_lender_cash = 0,
           last_activity_at     = NOW()
     WHERE id = p_neg_id;

    -- Sibling auto-abandon (Phase 6 unification) ──
    IF v_neg.request_id IS NOT NULL THEN
        FOR v_sibling IN
            SELECT id, lender_faction_id, escrowed_lender_cash
              FROM loan_negotiations
             WHERE request_id = v_neg.request_id
               AND id <> p_neg_id
               AND status = 'open'
             FOR UPDATE
        LOOP
            IF v_sibling.escrowed_lender_cash > 0
               AND EXISTS (SELECT 1 FROM factions WHERE id = v_sibling.lender_faction_id) THEN
                PERFORM emit_corp_cash_event(
                    v_sibling.lender_faction_id,
                    'capital_in',
                    'Escrow refund · borrower closed with another bank',
                    v_sibling.escrowed_lender_cash,
                    p_tick
                );
            END IF;

            UPDATE loan_negotiations
               SET status               = 'abandoned',
                   escrowed_lender_cash = 0,
                   last_activity_at     = NOW()
             WHERE id = v_sibling.id;

            INSERT INTO loan_negotiation_messages
                (negotiation_id, author_faction_id, body, system_msg, posted_at_tick)
            VALUES
                (v_sibling.id, NULL,
                 'Auto-abandoned: borrower closed the loan request with another bank. Escrow refunded.',
                 true, p_tick);

            v_siblings_abandoned := v_siblings_abandoned + 1;
        END LOOP;

        UPDATE bank_loan_requests
           SET status           = 'expired',
               resolved_at_tick = p_tick
         WHERE id               = v_neg.request_id
           AND status           = 'pending';
    END IF;

    INSERT INTO loan_negotiation_messages (negotiation_id, author_faction_id, body, system_msg, posted_at_tick)
    VALUES (p_neg_id, NULL,
            'Loan disbursed: $' || to_char(v_neg.principal, 'FM999,999,999,999')
                || ' for ' || v_neg.term_ticks || ' ticks at ' || v_neg.apr || '%'
                || CASE WHEN jsonb_array_length(v_neg.collateral) > 0
                        THEN ' · ' || jsonb_array_length(v_neg.collateral) || ' collateral item'
                          || CASE WHEN jsonb_array_length(v_neg.collateral) = 1 THEN '' ELSE 's' END
                          || ' pledged'
                        ELSE ''
                   END
                || CASE WHEN v_siblings_abandoned > 0
                        THEN ' · ' || v_siblings_abandoned || ' sibling negotiation'
                          || CASE WHEN v_siblings_abandoned = 1 THEN '' ELSE 's' END
                          || ' auto-abandoned'
                        ELSE ''
                   END
                || CASE WHEN v_aligned_breach
                        THEN ' · ⚠ Aligned Interest breach: −2 Cohesion, −1 Reputation'
                        ELSE ''
                   END,
            true, p_tick);

    PERFORM recompute_finance_stats(v_neg.lender_faction_id);

    RETURN jsonb_build_object(
        'success', true,
        'loan_id', v_loan_id,
        'negotiation_id', p_neg_id,
        'siblings_abandoned', v_siblings_abandoned,
        'aligned_interest_breach', v_aligned_breach
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION _fire_negotiation(UUID, INTEGER) FROM PUBLIC;

COMMIT;

NOTIFY pgrst, 'reload schema';
