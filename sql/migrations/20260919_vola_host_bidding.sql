-- 20260919_vola_host_bidding.sql
--
-- VWC HOST BIDDING — Sports Minister "Bid to Host VWC" action.
--
-- Players bid up to 1 nation per cup; multiple nations can bid on the
-- same cup. 12 ticks before the cup's start tick (= the qualifier
-- tick), resolveVolaCupBids picks a winner via:
--
--   bid_score = (sports_culture / 2)
--             + (infrastructure × 3)
--             + (global_image × 3)
--             + (vola_stadiums × 5)
--             + 1d20
--
-- Highest score wins; tie → higher national_vola_culture.
--
-- Win effects (applied at resolution tick — 12 ticks before cup start):
--   • Marked as host in vola_cup_hosts (home_advantage = 15)
--   • +1d20+5 to nations.budget
--   • +3 nations.global_image
--   • +0.5 nations.public_approval
--   • +1d6 nations.national_vola_culture
--
-- Lose effects:
--   • -0.2 nations.public_approval (failed national bid)
--
-- All schema + the bid-action RPC ship here. The resolution function
-- is JS-side (resolveVolaCupBids in political-actions.js, called from
-- the post-loop block in handler-template).
--
-- Cup_number → cup_start_tick: 84 + 24 × (cup_number - 1). Hardcoded in
-- the RPC because the JS-side schedule constants don't cross into SQL.

BEGIN;

CREATE TABLE IF NOT EXISTS public.vola_host_bids (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nation_id       UUID NOT NULL REFERENCES nations(id) ON DELETE CASCADE,
    cup_number      INT  NOT NULL CHECK (cup_number > 0),
    cup_start_tick  INT  NOT NULL,
    bid_at_tick     INT  NOT NULL,
    bid_score       NUMERIC,
    won             BOOLEAN,
    resolved_at_tick INT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (nation_id, cup_number)  -- one bid per nation per cup
);

CREATE INDEX IF NOT EXISTS vola_host_bids_pending_idx
    ON public.vola_host_bids (cup_start_tick)
    WHERE resolved_at_tick IS NULL;

CREATE TABLE IF NOT EXISTS public.vola_cup_hosts (
    cup_number       INT PRIMARY KEY CHECK (cup_number > 0),
    cup_start_tick   INT NOT NULL,
    host_nation_id   UUID REFERENCES nations(id) ON DELETE SET NULL,
    awarded_at_tick  INT NOT NULL,
    winning_score    NUMERIC,
    home_advantage   INT NOT NULL DEFAULT 15,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.vola_host_bids  IS 'Per-nation per-cup bid log. resolveVolaCupBids picks a winner per cup at the qualifier tick (cup_start_tick - 12).';
COMMENT ON TABLE  public.vola_cup_hosts  IS 'One row per cup that has been awarded a host. PRIMARY KEY on cup_number enforces one host per cup.';

-- ── bid_to_host_vwc RPC ───────────────────────────────────────────────
-- Sports Minister submits a host bid. $10M discretionary cost. UNIQUE
-- on (nation_id, cup_number) makes a same-cycle re-bid hit constraint
-- and bail with already_bid.
CREATE OR REPLACE FUNCTION bid_to_host_vwc(p_cup_number INT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_caller         UUID := auth.uid();
    v_cost           BIGINT := 10000000;  -- $10M raw
    v_ministry       ministries%ROWTYPE;
    v_nation_id      UUID;
    v_tick           INT;
    v_cup_start      INT;
    v_resolution     INT;
    v_existing_host  UUID;
    v_balance        NUMERIC;
    v_year           INT;
    v_ordinal        TEXT;
    v_nation_name    TEXT;
BEGIN
    IF p_cup_number IS NULL OR p_cup_number <= 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_cup');
    END IF;

    -- Sports minister gate.
    SELECT * INTO v_ministry FROM ministries
        WHERE ministry_key = 'sports' AND is_active = true
          AND EXISTS (
              SELECT 1 FROM factions f
              WHERE f.id = ministries.party_id
                AND (f.id = v_caller OR f.linked_user_id = v_caller)
          )
        ORDER BY created_at DESC LIMIT 1;
    IF v_ministry.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_minister');
    END IF;
    v_nation_id := v_ministry.nation_id;
    v_balance := COALESCE(v_ministry.discretionary_balance, 0);

    IF v_balance < v_cost THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_balance',
            'balance', v_balance, 'cost', v_cost);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;

    -- Cup schedule: cup #N starts at tick 84 + 24*(N-1).
    v_cup_start  := 84 + 24 * (p_cup_number - 1);
    v_resolution := v_cup_start - 12;

    -- Bidding closes at the resolution tick. Reject bids placed at or
    -- after that tick — the winner is being decided this very tick.
    IF v_tick >= v_resolution THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bidding_closed');
    END IF;

    -- Cup already has a host?
    SELECT host_nation_id INTO v_existing_host FROM vola_cup_hosts
        WHERE cup_number = p_cup_number;
    IF v_existing_host IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_hosted');
    END IF;

    -- Insert bid (UNIQUE catches double-clicks → already_bid).
    BEGIN
        INSERT INTO vola_host_bids (
            nation_id, cup_number, cup_start_tick, bid_at_tick
        ) VALUES (
            v_nation_id, p_cup_number, v_cup_start, v_tick
        );
    EXCEPTION WHEN unique_violation THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_bid');
    END;

    -- Deduct discretionary.
    UPDATE ministries SET discretionary_balance = v_balance - v_cost
        WHERE id = v_ministry.id;

    -- Event log entry on the bidding nation.
    SELECT name INTO v_nation_name FROM nations WHERE id = v_nation_id;
    v_year := 2000 + (v_cup_start / 12);
    v_ordinal := CASE
        WHEN p_cup_number % 100 BETWEEN 11 AND 13 THEN p_cup_number::TEXT || 'th'
        WHEN p_cup_number % 10 = 1 THEN p_cup_number::TEXT || 'st'
        WHEN p_cup_number % 10 = 2 THEN p_cup_number::TEXT || 'nd'
        WHEN p_cup_number % 10 = 3 THEN p_cup_number::TEXT || 'rd'
        ELSE p_cup_number::TEXT || 'th'
    END;

    INSERT INTO event_log (
        nation_id, event_name, category, trigger_key, description_chosen, fired_at_tick
    ) VALUES (
        v_nation_id, 'VWC Host Bid Submitted', 'political', 'vwc_host_bid_submitted',
        format('The nation of %s has submitted a bid to host the %s Vola World Cup in %s',
               COALESCE(v_nation_name, 'Unknown'), v_ordinal, v_year),
        v_tick
    );

    RETURN jsonb_build_object(
        'success',          true,
        'cup_number',       p_cup_number,
        'cup_start_tick',   v_cup_start,
        'resolution_tick',  v_resolution,
        'cost',             v_cost
    );
END;
$$;

GRANT EXECUTE ON FUNCTION bid_to_host_vwc(INT) TO authenticated;

COMMENT ON FUNCTION bid_to_host_vwc(INT) IS
  'Sports Minister submits a host bid for the given cup number. $10M from discretionary; UNIQUE on (nation_id, cup_number) enforces once-per-cycle. Resolution runs JS-side at cup_start_tick - 12.';

NOTIFY pgrst, 'reload schema';

COMMIT;
