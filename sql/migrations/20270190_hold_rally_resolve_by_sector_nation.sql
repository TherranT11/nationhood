-- ═══════════════════════════════════════════════════════════════════════════════
-- HOLD A RALLY — resolve the party by the SECTOR'S nation (not a guess)
-- ═══════════════════════════════════════════════════════════════════════════════
-- Recurring bug report: "That sector is not available." (invalid_sector)
-- when holding a rally on a sector the modal listed as active.
--
-- Root cause: hold_rally re-resolves the caller's party faction with
--   WHERE faction_type='party' AND (id=caller OR linked_user_id=caller)
--   ORDER BY created_at DESC LIMIT 1
-- — i.e. it GUESSES the newest party. For a player who has a party in
-- more than one nation (or whose newest party isn't the one they're
-- viewing), v_nation resolves to the wrong nation, so the chosen
-- sector fails the `nation_id = v_nation.id` check and the RPC returns
-- invalid_sector. (Before 20270151 it was worse: the newest faction of
-- ANY type was picked — now common, since players found entrepreneur
-- corps that are newer than their party.)
--
-- Fix: the rally follows the SECTOR the player picked. Resolve the
-- sector first (active, any nation), then look up the caller's party
-- faction IN THAT SECTOR'S NATION. The faction and the sector now share
-- a nation by construction, so they can never mismatch — no guessing.
-- A player rallying a sector they have no party in gets no_faction.
--
-- Supersedes 20270151 (keeps its faction_type='party' filter, adds the
-- nation tie). Signature unchanged → plain CREATE OR REPLACE; existing
-- GRANT persists. Body identical to 20270151 except the reordered
-- sector→faction resolution at the top. Idempotent.
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.hold_rally(p_sector_id UUID, p_spend BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller        UUID := auth.uid();
    v_faction       factions%ROWTYPE;
    v_nation        nations%ROWTYPE;
    v_tick          INT;
    v_sec_id        UUID;
    v_sec_key       TEXT;
    v_sec_name      TEXT;
    v_sec_nation_id UUID;
    v_bonus         INT;
    v_roll          INT;
    v_total         INT;
    v_gain          INT;   -- popularity gain in tenths (+2 .. +10)
    v_cur_pop       INT;
    v_next_pop      INT;
    v_outcome       TEXT;
    v_headline      TEXT;
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

    -- Resolve the chosen sector FIRST (active, any nation). The rally
    -- follows the sector — that's what fixes the wrong-nation mismatch.
    SELECT id, sector_key, name, nation_id
      INTO v_sec_id, v_sec_key, v_sec_name, v_sec_nation_id
      FROM sectors
     WHERE id = p_sector_id AND is_active = true
     LIMIT 1;
    IF v_sec_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_sector');
    END IF;

    -- The caller's PARTY faction IN THE SECTOR'S NATION (locked for the
    -- atomic one-per-tick + debit). faction_type='party' keeps a
    -- co-owned corp/entrepreneur faction from being picked; nation_id
    -- ties the faction to the sector so the two can never mismatch.
    SELECT * INTO v_faction FROM factions
        WHERE faction_type = 'party'
          AND nation_id = v_sec_nation_id
          AND (id = v_caller OR linked_user_id = v_caller)
        ORDER BY created_at DESC LIMIT 1
        FOR UPDATE;
    IF v_faction.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_faction');
    END IF;

    SELECT * INTO v_nation FROM nations WHERE id = v_sec_nation_id;
    IF v_nation.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_nation');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
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
    'Hold a Rally. SECURITY DEFINER. Resolves the chosen sector first (active), then the caller''s faction_type=''party'' faction IN THAT SECTOR''S NATION (20270190 — fixes invalid_sector when the player''s newest party/faction was in a different nation). Pick a sector + fixed spend tier ($50k/$100k/$150k/$250k/$500k → +0/+1/+2/+3/+4); rolls 1d6+bonus, raises that sector''s popularity +0.2..+1.0 (tenths, clamp 0..100). Always positive. Gates auth + one-per-tick + party_funds atomically (FOR UPDATE). Logs to campaign_actions.';

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK ──
-- Re-apply 20270151_hold_rally_filter_party_factions.sql (resolves the
-- party by created_at DESC instead of by the sector's nation).
