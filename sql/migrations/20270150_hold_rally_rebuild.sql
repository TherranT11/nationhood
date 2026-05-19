-- ═══════════════════════════════════════════════════════════════════════════════
-- HOLD A RALLY — rebuilt RPC (ALPHA 2.6.2)
-- ═══════════════════════════════════════════════════════════════════════════════
-- The rally is consolidated to a single mechanic: pick a voter sector,
-- choose how much party_funds to spend, roll for a popularity gain in
-- that sector. The old weighted-1-of-6 / escalation / spillover / leader-
-- trait model and the retired Momentum system are gone.
--
-- Formula (server-authoritative, single source of truth):
--   spend → roll bonus:  $50k +0 · $100k +1 · $150k +2 · $250k +3 · $500k +4
--   roll  = 1d6 (1..6)
--   total = roll + bonus
--   gain  (popularity, in tenths):
--           total ≤2 → +0.2 ·  3-4 → +0.4 ·  5-6 → +0.6 ·  7-8 → +0.8 ·  ≥9 → +1.0
--   Applied to the chosen sector only. Always positive — a rally never
--   costs popularity, never spills into other sectors, never escalates.
--
-- CREATE OR REPLACE cannot change a function's argument list (adding the
-- p_spend parameter would create an overload), so the old single-arg
-- hold_rally(UUID) is dropped first; its GRANT drops with it.
--
-- SECURITY DEFINER because faction_sector_popularity is admin/service-
-- role write-only (RLS, 20260426_sectors_phase0.sql). The FOR UPDATE
-- faction lock makes the one-per-tick check + funds debit atomic, so a
-- double-clicked rally cannot both pass and double-charge.
--
-- Idempotent: DROP IF EXISTS + CREATE OR REPLACE + GRANT. No schema changes.
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

DROP FUNCTION IF EXISTS public.hold_rally(UUID);

CREATE OR REPLACE FUNCTION public.hold_rally(p_sector_id UUID, p_spend BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller    UUID := auth.uid();
    v_faction   factions%ROWTYPE;
    v_nation    nations%ROWTYPE;
    v_tick      INT;
    v_sec_id    UUID;
    v_sec_key   TEXT;
    v_sec_name  TEXT;
    v_bonus     INT;
    v_roll      INT;
    v_total     INT;
    v_gain      INT;   -- popularity gain in tenths (+2 .. +10)
    v_cur_pop   INT;
    v_next_pop  INT;
    v_outcome   TEXT;
    v_headline  TEXT;
BEGIN
    IF v_caller IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_sector_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_sector');
    END IF;

    -- Spend must be one of the five fixed tiers; the tier sets the bonus.
    v_bonus := CASE p_spend
        WHEN 50000  THEN 0
        WHEN 100000 THEN 1
        WHEN 150000 THEN 2
        WHEN 250000 THEN 3
        WHEN 500000 THEN 4
        ELSE NULL
    END;
    IF v_bonus IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_spend');
    END IF;

    -- Resolve + lock the caller's faction (atomic one-per-tick + debit).
    SELECT * INTO v_faction FROM factions
        WHERE id = v_caller OR linked_user_id = v_caller
        ORDER BY created_at DESC LIMIT 1
        FOR UPDATE;
    IF v_faction.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_faction');
    END IF;

    SELECT * INTO v_nation FROM nations WHERE id = v_faction.nation_id;
    IF v_nation.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_nation');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;

    -- Target sector must be active and belong to the caller's nation.
    SELECT id, sector_key, name INTO v_sec_id, v_sec_key, v_sec_name
      FROM sectors
     WHERE id = p_sector_id AND nation_id = v_nation.id AND is_active = true
     LIMIT 1;
    IF v_sec_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_sector');
    END IF;

    -- One rally per tick (hard).
    IF EXISTS (
        SELECT 1 FROM campaign_actions
         WHERE party_id = v_faction.id AND action_type = 'rally'
           AND tick_performed = v_tick
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_rallied_this_tick');
    END IF;

    IF COALESCE(v_faction.party_funds, 0) < p_spend THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'have', COALESCE(v_faction.party_funds, 0), 'need', p_spend);
    END IF;

    -- Roll 1d6, add the spend tier bonus.
    v_roll  := floor(random() * 6)::INT + 1;   -- 1..6
    v_total := v_roll + v_bonus;

    -- Popularity gain in tenths — always positive (a rally never backfires).
    v_gain := CASE
        WHEN v_total <= 2 THEN 2
        WHEN v_total <= 4 THEN 4
        WHEN v_total <= 6 THEN 6
        WHEN v_total <= 8 THEN 8
        ELSE 10
    END;

    v_outcome := CASE v_gain
        WHEN 2  THEN 'Tepid Reception'
        WHEN 4  THEN 'Modest Turnout'
        WHEN 6  THEN 'Solid Turnout'
        WHEN 8  THEN 'Strong Showing'
        ELSE       'Rousing Success'
    END;
    v_headline := format('%s — the %s rally lifts your standing (+%s)',
                         v_outcome, v_sec_name, round(v_gain / 10.0, 1));

    -- Apply to the chosen sector only (clamp 0..100). No spillover.
    SELECT popularity INTO v_cur_pop
      FROM faction_sector_popularity
     WHERE faction_id = v_faction.id AND sector_id = v_sec_id;
    v_cur_pop  := COALESCE(v_cur_pop, 0);
    v_next_pop := GREATEST(0, LEAST(100, v_cur_pop + v_gain));

    INSERT INTO faction_sector_popularity (faction_id, sector_id, popularity)
    VALUES (v_faction.id, v_sec_id, v_next_pop)
    ON CONFLICT (faction_id, sector_id) DO UPDATE
        SET popularity = GREATEST(0, LEAST(100,
                faction_sector_popularity.popularity + v_gain)),
            updated_at = NOW();

    -- Debit + stamp (gated above, so no underflow).
    UPDATE factions
       SET party_funds      = COALESCE(party_funds, 0) - p_spend,
           last_action_tick = v_tick
     WHERE id = v_faction.id;

    INSERT INTO campaign_actions (
        party_id, nation_id, action_type, ap_cost, money_cost,
        tick_performed, result
    ) VALUES (
        v_faction.id, v_nation.id, 'rally', 0, p_spend, v_tick,
        jsonb_build_object(
            'sectorId',       v_sec_id,
            'sectorKey',      v_sec_key,
            'sectorName',     v_sec_name,
            'spend',          p_spend,
            'bonus',          v_bonus,
            'roll',           v_roll,
            'total',          v_total,
            'gainTenths',     v_gain,
            'popularityGain', round(v_gain / 10.0, 1),
            'outcomeName',    v_outcome,
            'headline',       v_headline
        )
    );

    RETURN jsonb_build_object(
        'success',        true,
        'sectorId',       v_sec_id,
        'sectorName',     v_sec_name,
        'spend',          p_spend,
        'bonus',          v_bonus,
        'roll',           v_roll,
        'total',          v_total,
        'gainTenths',     v_gain,
        'popularityGain', round(v_gain / 10.0, 1),
        'outcomeName',    v_outcome,
        'headline',       v_headline,
        'cost_paid',      p_spend,
        'newFunds',       GREATEST(0, COALESCE(v_faction.party_funds, 0) - p_spend),
        'newPopularity',  round(v_next_pop / 10.0, 1)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.hold_rally(UUID, BIGINT) TO authenticated;

COMMENT ON FUNCTION public.hold_rally(UUID, BIGINT) IS
    'Hold a Rally (ALPHA 2.6.2). SECURITY DEFINER (faction_sector_popularity is admin-write-only). Pick a sector + a fixed spend tier ($50k/$100k/$150k/$250k/$500k → roll bonus +0/+1/+2/+3/+4); rolls 1d6+bonus and raises that sector''s popularity by +0.2..+1.0 (tenths, clamp 0..100). Always positive — no negatives, spillover, escalation, traits or momentum. Gates auth + one-per-tick + party_funds atomically (FOR UPDATE on the faction). Logs to campaign_actions; returns the result payload for the client.';

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK (restores the pre-2.6.2 single-arg shape, not its body) ──
-- The previous body lives in 20270106_hold_rally_rpc.sql; re-apply that
-- migration and DROP FUNCTION public.hold_rally(UUID, BIGINT) to revert.
