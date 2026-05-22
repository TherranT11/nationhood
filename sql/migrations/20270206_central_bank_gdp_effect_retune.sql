-- ════════════════════════════════════════════════════════════════════
-- CENTRAL BANK — retune the one-shot GDP effect of rate moves
-- ════════════════════════════════════════════════════════════════════
-- Design change. The Governor's rate action nudges gdp_growth (0–100
-- momentum stat, 50 = neutral) once, at the moment of the move:
--   • Lower rates by X% → gdp_growth +3·X  (stimulus)
--   • Raise rates by X% → gdp_growth −5·X  (tightening)
-- (Previously +0.2·X / −0.3·X — see 20270195.) p_pct is 1–3, so a single
-- action moves gdp_growth by up to +9 (cut) or −15 (hike), clamped 0–100.
--
-- Only the coefficients change; the rest of central_bank_set_rate
-- (ownership, term gate, $1 cost, rate clamp 0–20) is unchanged.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.central_bank_set_rate(p_direction text, p_pct int)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller    uuid := auth.uid();
    v_nation    uuid;
    v_tick      int;
    v_term_end  int;
    v_rate      numeric;
    v_disc      bigint;
    v_gdp       numeric;
    v_lower     boolean;
    v_new_rate  numeric;
    v_new_gdp   numeric;
BEGIN
    IF v_caller IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_direction NOT IN ('raise', 'lower') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_direction');
    END IF;
    IF p_pct IS NULL OR p_pct < 1 OR p_pct > 3 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_pct');
    END IF;

    -- Caller must own the party currently holding the Governor seat.
    SELECT n.id INTO v_nation
      FROM nations n
      JOIN factions f ON f.id = n.central_bank_governor_party_id
     WHERE (f.id = v_caller OR f.linked_user_id = v_caller)
     LIMIT 1;
    IF v_nation IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_governor');
    END IF;

    -- Lock the nation row so the balance check + debit is atomic.
    SELECT central_bank_interest_rate, central_bank_discretionary, gdp_growth,
           central_bank_governor_term_end_tick
      INTO v_rate, v_disc, v_gdp, v_term_end
      FROM nations WHERE id = v_nation FOR UPDATE;

    -- Term gate: the column may still point to the outgoing party after
    -- their 8-year term ends (the seat is "reopened" but not cleared until
    -- a successor is installed). An expired-term Governor can't act.
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF COALESCE(v_term_end, 0) <= COALESCE(v_tick, 0) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'term_expired');
    END IF;

    -- Each rate move costs $1 = $1M raw, drawn from the lending pool.
    IF COALESCE(v_disc, 0) < 1000000 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_discretionary');
    END IF;

    v_lower    := (p_direction = 'lower');
    v_new_rate := GREATEST(0, LEAST(20, COALESCE(v_rate, 5) + (CASE WHEN v_lower THEN -p_pct ELSE p_pct END)));
    -- No movement (already clamped at 0 or 20) ⇒ don't burn the $1.
    IF v_new_rate = COALESCE(v_rate, 5) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'rate_at_limit',
                                  'rate', v_rate);
    END IF;

    -- One-shot GDP nudge: lower +3·X, raise −5·X (clamp 0–100).
    v_new_gdp := GREATEST(0, LEAST(100,
        COALESCE(v_gdp, 50) + (CASE WHEN v_lower THEN 3 ELSE -5 END) * p_pct));

    UPDATE nations SET
        central_bank_interest_rate = v_new_rate,
        central_bank_discretionary = v_disc - 1000000,
        gdp_growth = v_new_gdp
     WHERE id = v_nation;

    RETURN jsonb_build_object(
        'success',         true,
        'direction',       p_direction,
        'pct',             p_pct,
        'rate',            v_new_rate,
        'gdpGrowth',       v_new_gdp,
        'discretionary',   v_disc - 1000000
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.central_bank_set_rate(text, int) TO authenticated;

COMMENT ON FUNCTION public.central_bank_set_rate(text, int) IS
    'Governor of the Central Bank moves the policy rate up/down by up to 3% (clamp 0–20%) for $1 ($1M raw) from central_bank_discretionary. One-shot GDP nudge: lower +3·X, raise −5·X on gdp_growth.';

NOTIFY pgrst, 'reload schema';

COMMIT;
