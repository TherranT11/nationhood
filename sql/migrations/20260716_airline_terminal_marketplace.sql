-- ══════════════════════════════════════════════════════════════
-- Airline Terminal Marketplace (Phase 4)
--
-- Two artifacts:
--   1. airline_city_ranges — pairwise range table for the 6 seeded
--      cities (15 unique pairs). Phase 5 aircraft logic will read
--      this to decide which routes a given plane can fly. Stored
--      canonically (city_a_id < city_b_id) so each pair has one
--      row; queries can OR both directions or use a view if needed.
--
--   2. buy_airline_terminal RPC — atomic terminal acquisition.
--      Auth, cash gate, race-safe terminal flip, corp_properties
--      row insert (so the terminal shows up on Expansion / in
--      valuation / in the maintenance loop), and a cash debit
--      through emit_corp_cash_event so the Cash card's drawer can
--      attribute the spend.
--
-- Cost formula (clamped to [$3M, $20M]):
--   scarcity   = 1 - (free_terminals / total_terminals)
--   sol_mult   = 0.5 + clamp(sol, 0, 100) / 100
--   cost       = round($3M + $17M × scarcity × sol_mult)
--
-- First buy at any city: cost = $3M (scarcity = 0 since all free).
-- Last buy: scarcity ≈ (total-1)/total; with high SoL the formula
-- overshoots $20M and gets clamped down.
-- ══════════════════════════════════════════════════════════════


-- ══════════════════════════════════════════════════════════════
-- 1. airline_city_ranges — pairwise range data
-- ══════════════════════════════════════════════════════════════
-- Stored canonically: city_a_id < city_b_id so each undirected pair
-- is one row. Queries that want either direction use
-- LEAST/GREATEST or a coalesced lookup.
CREATE TABLE IF NOT EXISTS public.airline_city_ranges (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_a_id   UUID NOT NULL REFERENCES public.airline_cities(id) ON DELETE CASCADE,
    city_b_id   UUID NOT NULL REFERENCES public.airline_cities(id) ON DELETE CASCADE,
    range_units INT  NOT NULL CHECK (range_units > 0),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT airline_city_ranges_canonical CHECK (city_a_id < city_b_id),
    UNIQUE (city_a_id, city_b_id)
);

CREATE INDEX IF NOT EXISTS idx_acr_city_a ON public.airline_city_ranges (city_a_id);
CREATE INDEX IF NOT EXISTS idx_acr_city_b ON public.airline_city_ranges (city_b_id);

ALTER TABLE public.airline_city_ranges ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
         WHERE schemaname = 'public'
           AND tablename  = 'airline_city_ranges'
           AND policyname = 'airline_city_ranges_read_all'
    ) THEN
        CREATE POLICY "airline_city_ranges_read_all" ON public.airline_city_ranges
            FOR SELECT TO authenticated USING (true);
    END IF;
END $$;

COMMENT ON TABLE public.airline_city_ranges IS
    'Pairwise range between airline_cities (Phase 4). Stored canonically with city_a_id < city_b_id; one row per undirected pair. Phase 5 aircraft logic reads this to decide route eligibility.';


-- Seed the 15 unique pairs from the Phase 4 design matrix. LEAST/
-- GREATEST normalises pair order so the canonical-order CHECK
-- accepts the row regardless of which direction the source tuple
-- listed. ON CONFLICT DO NOTHING makes re-runs no-ops.
INSERT INTO public.airline_city_ranges (city_a_id, city_b_id, range_units)
SELECT LEAST(a.id, b.id), GREATEST(a.id, b.id), p.range_units
  FROM (VALUES
    ('Kolvenstaad', 'Dinsag',     5),
    ('Kolvenstaad', 'Gosmund',    4),
    ('Kolvenstaad', 'Oros',      78),
    ('Kolvenstaad', 'Buenavera', 76),
    ('Kolvenstaad', 'Valdomar',  79),
    ('Dinsag',      'Gosmund',    6),
    ('Dinsag',      'Oros',      77),
    ('Dinsag',      'Buenavera', 75),
    ('Dinsag',      'Valdomar',  78),
    ('Gosmund',     'Oros',      79),
    ('Gosmund',     'Buenavera', 77),
    ('Gosmund',     'Valdomar',  80),
    ('Oros',        'Buenavera',  9),
    ('Oros',        'Valdomar',  11),
    ('Buenavera',   'Valdomar',  10)
  ) AS p(name_a, name_b, range_units)
  JOIN public.airline_cities a ON a.name = p.name_a
  JOIN public.airline_cities b ON b.name = p.name_b
ON CONFLICT (city_a_id, city_b_id) DO NOTHING;


-- ══════════════════════════════════════════════════════════════
-- 2. buy_airline_terminal RPC
-- ══════════════════════════════════════════════════════════════
-- Player-triggered terminal acquisition. Atomic:
--   * Locks the corp's faction row (FOR UPDATE) so two concurrent
--     buys can't both pass the cash gate.
--   * Computes cost from the city's scarcity + nation SoL.
--   * Race-safe terminal flip: WHERE owner_airline_id IS NULL —
--     ROW_COUNT=0 means another corp claimed it first, error out.
--   * Inserts a corp_properties row (role='airline_terminal') so
--     the terminal participates in the existing maintenance loop,
--     valuation, bankruptcy cascade, and Expansion display.
--   * Debits cash through emit_corp_cash_event so the Cash card's
--     drawer attributes the spend.
CREATE OR REPLACE FUNCTION buy_airline_terminal(
    p_corp_id     UUID,
    p_terminal_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user        UUID := auth.uid();
    v_corp        factions%ROWTYPE;
    v_terminal    airline_terminals%ROWTYPE;
    v_city        airline_cities%ROWTYPE;
    v_nation      nations%ROWTYPE;
    v_tick        INT;
    v_total       INT;
    v_free        INT;
    v_scarcity    NUMERIC;
    v_sol         NUMERIC;
    v_sol_mult    NUMERIC;
    v_cost        BIGINT;
    v_maint       BIGINT;
    v_updated     INT;
    v_label       TEXT;
BEGIN
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    -- Lock the corp row to serialize concurrent buys.
    SELECT * INTO v_corp FROM factions WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Corporation not found');
    END IF;
    IF v_corp.id <> v_user AND v_corp.linked_user_id IS DISTINCT FROM v_user THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not own this corporation');
    END IF;
    IF v_corp.faction_type <> 'corporation' OR v_corp.corp_sector <> 'Airline' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Only Airline corporations can buy terminals');
    END IF;

    SELECT * INTO v_terminal FROM airline_terminals WHERE id = p_terminal_id;
    IF v_terminal.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Terminal not found');
    END IF;
    IF v_terminal.owner_airline_id IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Terminal already owned');
    END IF;

    SELECT * INTO v_city FROM airline_cities WHERE id = v_terminal.city_id;
    IF v_city.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Terminal city missing');
    END IF;

    SELECT * INTO v_nation FROM nations WHERE id = v_city.nation_id;
    IF v_nation.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Hub nation missing');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard';
    v_tick := COALESCE(v_tick, 0);

    -- Cost: scarcity model × SoL multiplier, clamped to [3M, 20M].
    SELECT COUNT(*)                                          INTO v_total
      FROM airline_terminals WHERE city_id = v_city.id;
    SELECT COUNT(*) FILTER (WHERE owner_airline_id IS NULL)  INTO v_free
      FROM airline_terminals WHERE city_id = v_city.id;
    IF v_total <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'City has no terminals');
    END IF;

    v_scarcity := 1 - (v_free::NUMERIC / v_total::NUMERIC);
    v_sol      := GREATEST(0, LEAST(100, COALESCE(v_nation.standard_of_living, 50)));
    v_sol_mult := 0.5 + (v_sol / 100.0);
    v_cost     := LEAST(20000000, GREATEST(3000000,
                    ROUND(3000000 + 17000000 * v_scarcity * v_sol_mult)::BIGINT));
    v_maint    := ROUND(v_cost * 0.01)::BIGINT;  -- 1% of purchase per tick

    IF COALESCE(v_corp.corp_cash_reserves, 0) < v_cost THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', format('Insufficient cash — need $%sM, have $%sM',
                (v_cost / 1000000)::TEXT,
                (COALESCE(v_corp.corp_cash_reserves, 0) / 1000000)::TEXT)
        );
    END IF;

    -- Atomic terminal flip. WHERE owner_airline_id IS NULL guards
    -- the race: a concurrent buyer that won the lock first will
    -- have set owner already, and ROW_COUNT will come back 0.
    UPDATE airline_terminals
       SET owner_airline_id  = p_corp_id,
           acquired_at_tick  = v_tick
     WHERE id = p_terminal_id
       AND owner_airline_id IS NULL;
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    IF v_updated = 0 THEN
        RETURN jsonb_build_object('success', false,
            'error', 'Terminal was claimed by another airline before your buy completed');
    END IF;

    -- Persist as a corp_properties row so the existing systems pick
    -- it up: maintenance loop, valuation SUM, bankruptcy cascade,
    -- Expansion display. role='airline_terminal' lets consumers
    -- filter for terminals specifically.
    v_label := v_city.name || ' Terminal #' || v_terminal.terminal_number;
    INSERT INTO corp_properties (
        faction_id, nation_id, name, type, role, style,
        capacity, purchase_price, monthly_maintenance, condition,
        city, purchased_at_tick, is_active
    ) VALUES (
        p_corp_id,
        v_city.nation_id,
        v_label,
        'airline_terminal',
        'airline_terminal',
        v_city.runway_type,
        0,
        v_cost,
        v_maint,
        100,
        v_city.name,
        v_tick,
        true
    );

    -- Cash debit via the SSoT helper. Lands as a corp_cash_events
    -- row so the Cash drawer can attribute the spend.
    PERFORM emit_corp_cash_event(
        p_corp_id,
        'capital_out',
        'Terminal acquisition: ' || v_label,
        -v_cost,
        v_tick
    );

    RETURN jsonb_build_object(
        'success',          true,
        'terminal_id',      p_terminal_id,
        'city',             v_city.name,
        'terminal_number',  v_terminal.terminal_number,
        'cost',             v_cost,
        'monthly_maint',    v_maint
    );
END;
$$;

GRANT EXECUTE ON FUNCTION buy_airline_terminal(UUID, UUID) TO authenticated;

COMMENT ON FUNCTION buy_airline_terminal(UUID, UUID) IS
    'Phase 4 marketplace: airline corp buys an unowned terminal at any seeded airline_cities row. Cost = scarcity × SoL formula clamped to [3M, 20M]; 1% per-tick maintenance. Atomic: locks the corp row, race-safe terminal flip, corp_properties row insert (role=airline_terminal so the existing maintenance / valuation / bankruptcy / Expansion plumbing picks it up automatically), and a cash debit via emit_corp_cash_event.';

NOTIFY pgrst, 'reload schema';
