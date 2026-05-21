-- ════════════════════════════════════════════════════════════════════
-- CENTRAL BANK + GOVERNOR OF THE CENTRAL BANK (v1)
-- ════════════════════════════════════════════════════════════════════
-- Design (spec):
--   • Each nation has a Central Bank with an interest rate (starts 5%).
--   • A Governor of the Central Bank is an appointed PARTY (not a new
--     faction type, not an NPC) holding the seat. The head of government
--     appoints them. Parliamentary systems must confirm by vote;
--     presidential / semi-presidential / monarchy appoint directly.
--   • The Governor serves a fixed 8-year term = 96 ticks (8 × 12). They
--     cannot be dismissed in v1; the seat only reopens when the term ends.
--   • Rate actions (Governor only): spend $1 to RAISE the rate by up to
--     3%, or $1 to LOWER it by up to 3%. Rate clamps 0–20%.
--   • One-shot GDP effect at the action: lowering by X% nudges gdp_growth
--     +0.2·X; raising by X% nudges gdp_growth −0.3·X (gdp_growth is the
--     0–100 momentum stat, 50 = neutral; numeric, so fractions are kept).
--   • Lending capital is DISPLAY-ONLY: central_bank_discretionary is a raw-
--     dollar pool (same unit as ministries.discretionary_balance); lending
--     capital = (pool ÷ $1M) × $100M. The $1 rate-change cost is drawn from
--     this pool ($1 = $1M raw, the game's abstract unit).
--
-- FUNDING: the pool is filled by a funding bill, exactly like a ministry —
-- the funding-article framework (bills.js enactBill) credits
-- central_bank_discretionary and pulls the money from the national budget
-- (overflow to debt). The funding target key is 'central_bank'.
--
-- faction_sector_popularity-style admin-write tables aren't involved; the
-- nations columns are written through these SECURITY DEFINER RPCs (and the
-- enactBill funding path, which runs service-role) so the client never
-- needs direct write access.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── Schema ──────────────────────────────────────────────────────────
ALTER TABLE public.nations
    ADD COLUMN IF NOT EXISTS central_bank_interest_rate      NUMERIC(4,2) NOT NULL DEFAULT 5.00,
    ADD COLUMN IF NOT EXISTS central_bank_discretionary       BIGINT       NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS central_bank_governor_party_id   UUID REFERENCES public.factions(id),
    ADD COLUMN IF NOT EXISTS central_bank_governor_term_end_tick  INT;

COMMENT ON COLUMN public.nations.central_bank_interest_rate IS
    'Central Bank policy interest rate, percent (0–20). Starts at 5.00. Moved by central_bank_set_rate.';
COMMENT ON COLUMN public.nations.central_bank_discretionary IS
    'Central Bank discretionary pool, in RAW dollars (same unit as ministries.discretionary_balance; $1M = 1000000). Filled by funding bills (target key ''central_bank''). Lending capital (display-only) = (pool / 1e6) * $100M. The rate-change cost ($1M raw) is drawn from here.';
COMMENT ON COLUMN public.nations.central_bank_governor_party_id IS
    'Party faction currently holding the Governor of the Central Bank seat (NULL = vacant). Set via appoint_central_bank_governor / governor_confirmation bill.';
COMMENT ON COLUMN public.nations.central_bank_governor_term_end_tick IS
    'Tick the Governor''s 8-year (96-tick) term ends. While > current_tick the seat is occupied and cannot be reappointed (no dismissal in v1).';

-- ── Appointment RPC ─────────────────────────────────────────────────
-- The head of government appoints a party to the Governor seat. Routing
-- by government_type mirrors the JS convention (lower(government_type)
-- LIKE '%president%'/'%monarch%'): presidential / semi-presidential /
-- monarchy appoint directly; everything else (parliamentary) goes to a
-- confirmation vote (governor_confirmation bill, resolved in bills.js).
CREATE OR REPLACE FUNCTION public.appoint_central_bank_governor(p_party_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller     uuid := auth.uid();
    v_nation     uuid;
    v_govtype    text;
    v_tick       int;
    v_term_end   int;
    v_appointer  uuid;   -- the HOG / president faction owned by the caller
    v_is_direct  boolean;
    v_bill_id    uuid;
BEGIN
    IF v_caller IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    -- Nominee must be a party; its nation is the nation being served.
    SELECT nation_id INTO v_nation FROM factions
     WHERE id = p_party_id AND faction_type = 'party';
    IF v_nation IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nominee_not_party');
    END IF;

    SELECT government_type INTO v_govtype FROM nations WHERE id = v_nation;

    -- Caller must be the head of government: owns the active HOG party
    -- (parliamentary / monarchy PM) OR the active president (presidential /
    -- semi-presidential). Either proves head-of-government standing.
    SELECT hg.faction_id INTO v_appointer
      FROM head_of_government hg
      JOIN factions f ON f.id = hg.faction_id
     WHERE hg.nation_id = v_nation AND hg.active = true
       AND (f.id = v_caller OR f.linked_user_id = v_caller)
     LIMIT 1;
    IF v_appointer IS NULL THEN
        SELECT p.faction_id INTO v_appointer
          FROM presidents p
          JOIN factions f ON f.id = p.faction_id
         WHERE p.nation_id = v_nation AND p.is_active = true
           AND (f.id = v_caller OR f.linked_user_id = v_caller)
         LIMIT 1;
    END IF;
    IF v_appointer IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_head_of_government');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- No dismissal in v1: a seated Governor whose term hasn't ended blocks
    -- reappointment. The seat reopens only once term_end_tick <= now.
    IF EXISTS (
        SELECT 1 FROM nations
         WHERE id = v_nation
           AND central_bank_governor_party_id IS NOT NULL
           AND COALESCE(central_bank_governor_term_end_tick, 0) > v_tick
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'governor_seated');
    END IF;

    v_term_end  := v_tick + 96;  -- 8 years × 12 ticks
    v_is_direct := lower(COALESCE(v_govtype, '')) LIKE '%president%'
                OR lower(COALESCE(v_govtype, '')) LIKE '%monarch%';

    IF v_is_direct THEN
        UPDATE nations SET
            central_bank_governor_party_id      = p_party_id,
            central_bank_governor_term_end_tick  = v_term_end
         WHERE id = v_nation;
        RETURN jsonb_build_object('success', true, 'status', 'appointed',
                                  'partyId', p_party_id, 'termEndTick', v_term_end);
    END IF;

    -- Parliamentary: confirmation vote. Don't stack a second nomination
    -- while one is already on the floor.
    IF EXISTS (
        SELECT 1 FROM bills
         WHERE nation_id = v_nation
           AND bill_type = 'governor_confirmation'
           AND status = 'floor'
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'confirmation_pending');
    END IF;

    -- A governor_confirmation bill goes to the floor for the standard
    -- confirmation window (6 ticks, matching minister confirmations);
    -- resolveGovernorConfirmationBill installs the governor on a pass.
    -- Nominee carried in metadata.pending_governor. The 96-tick term is
    -- stamped at confirmation time by the resolver (it starts when the
    -- seat is taken), so it is intentionally NOT carried here.
    INSERT INTO bills (nation_id, proposed_by, proposed_tick, bill_name, bill_type,
                       status, floor_tick, voting_ends_tick, metadata)
    VALUES (v_nation, v_appointer, v_tick,
            'Confirmation: Governor of the Central Bank',
            'governor_confirmation', 'floor', v_tick, v_tick + 6,
            jsonb_build_object('pending_governor',
                jsonb_build_object('party_id', p_party_id)))
    RETURNING id INTO v_bill_id;

    RETURN jsonb_build_object('success', true, 'status', 'pending_confirmation',
                              'partyId', p_party_id, 'billId', v_bill_id,
                              'votingEndsTick', v_tick + 6);
END;
$$;

GRANT EXECUTE ON FUNCTION public.appoint_central_bank_governor(uuid) TO authenticated;

COMMENT ON FUNCTION public.appoint_central_bank_governor(uuid) IS
    'Head of government appoints a party to the Governor of the Central Bank seat. Presidential / semi-presidential / monarchy appoint directly; parliamentary opens a governor_confirmation bill (resolved in bills.js). 96-tick term, no dismissal — a seated, in-term Governor blocks reappointment.';

-- ── Rate-change RPC ─────────────────────────────────────────────────
-- Governor-only. $1 (= $1M raw, from central_bank_discretionary) per
-- action; moves the rate up/down by up to 3%, clamped 0–20%. One-shot
-- GDP nudge.
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

    -- One-shot GDP nudge: lower +0.2·X, raise −0.3·X (clamp 0–100).
    v_new_gdp := GREATEST(0, LEAST(100,
        COALESCE(v_gdp, 50) + (CASE WHEN v_lower THEN 0.2 ELSE -0.3 END) * p_pct));

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
    'Governor of the Central Bank moves the policy rate up/down by up to 3% (clamp 0–20%) for $1 ($1M raw) from central_bank_discretionary. One-shot GDP nudge: lower +0.2·X, raise −0.3·X on gdp_growth.';

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK ──
-- BEGIN;
-- DROP FUNCTION IF EXISTS public.central_bank_set_rate(text, int);
-- DROP FUNCTION IF EXISTS public.appoint_central_bank_governor(uuid);
-- ALTER TABLE public.nations
--     DROP COLUMN IF EXISTS central_bank_governor_term_end_tick,
--     DROP COLUMN IF EXISTS central_bank_governor_party_id,
--     DROP COLUMN IF EXISTS central_bank_discretionary,
--     DROP COLUMN IF EXISTS central_bank_interest_rate;
-- NOTIFY pgrst, 'reload schema';
-- COMMIT;
