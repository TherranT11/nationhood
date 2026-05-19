-- ═══════════════════════════════════════════════════════════════════════════════
-- HOLD A RALLY — scope the faction lookup to parties only
-- ═══════════════════════════════════════════════════════════════════════════════
-- Bug report: "That sector is not available." (reason: invalid_sector)
-- when holding a rally, even though the player picked a sector the
-- modal listed as active for their nation.
--
-- Root cause — the same class of bug 20261221 fixed for petitions, which
-- the 2.6.2 rally rebuild (20270150) reintroduced. The faction lookup was:
--
--     SELECT * INTO v_faction FROM factions
--         WHERE id = v_caller OR linked_user_id = v_caller
--         ORDER BY created_at DESC LIMIT 1 FOR UPDATE;
--
-- A user with a party faction AND a second faction (an entrepreneur /
-- corporation faction, linked_user_id = the party's id) matches the OR
-- twice. ORDER BY created_at DESC picks the newer non-party faction, so
-- v_nation resolves to that faction's nation (or none). The chosen
-- sector belongs to the *party's* nation, so the
--   WHERE id = p_sector_id AND nation_id = v_nation.id AND is_active
-- check finds nothing → invalid_sector, fired against the wrong faction.
--
-- The rally is a political action; corporations/entrepreneurs have no
-- role in it. Restrict the lookup to faction_type = 'party' — the same
-- scoping pattern used by petition_for_reform, disband_party,
-- leave_coalition and the bloc RPCs. A user holds only one party per
-- nation (enforced by 20260419), so the lookup is unambiguous once the
-- non-party factions are filtered out.
--
-- Signature is unchanged from 20270150, so a plain CREATE OR REPLACE
-- suffices (no DROP, the existing GRANT persists). Body is identical to
-- 20270150 except for the one added faction_type predicate. Idempotent.
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

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

    -- Resolve + lock the caller's PARTY faction (atomic one-per-tick +
    -- debit). faction_type = 'party' so a co-owned entrepreneur /
    -- corporation faction can't be picked by ORDER BY created_at DESC.
    SELECT * INTO v_faction FROM factions
        WHERE faction_type = 'party'
          AND (id = v_caller OR linked_user_id = v_caller)
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
    'Hold a Rally (ALPHA 2.6.2). SECURITY DEFINER (faction_sector_popularity is admin-write-only). Resolves the caller''s faction_type=''party'' faction (20270151: filter parties so a co-owned entrepreneur/corp faction can''t be picked). Pick a sector + a fixed spend tier ($50k/$100k/$150k/$250k/$500k → roll bonus +0/+1/+2/+3/+4); rolls 1d6+bonus and raises that sector''s popularity by +0.2..+1.0 (tenths, clamp 0..100). Always positive — no negatives, spillover, escalation, traits or momentum. Gates auth + one-per-tick + party_funds atomically (FOR UPDATE on the faction). Logs to campaign_actions; returns the result payload for the client.';

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK ──
-- Re-apply 20270150_hold_rally_rebuild.sql (its body is identical except
-- it lacks the faction_type = 'party' predicate).
