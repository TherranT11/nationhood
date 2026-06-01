-- ════════════════════════════════════════════════════════════════════
-- Local Government actions (Tier 1 Community Organizer) — Fundraising
-- Call · Civic Meeting · Office Hours
--
-- ── Design ──────────────────────────────────────────────────────────
-- Volunteers (factions.volunteers, numeric, capped at credibility × 3)
-- is the grassroots stat for local-tier politicians. Civic Meeting
-- grows it; Fundraising Call uses it as a money multiplier. The
-- January annual tick decays −1 per year — present national
-- politicians slowly lose the local base they built.
--
-- Three RPCs land here, all on a 1-tick per-action cooldown via the
-- new factions.next_local_action_tick column (parallel to next_mp_
-- action_tick for MPs — the surfaces are mutually exclusive but
-- the columns stay separate so a player who transitions doesn't
-- carry a stale cooldown). Each clamps the popularity write through
-- popularity_cap_pct, honouring the 20270457 cap.
--
-- ── politician_fundraising_call ─────────────────────────────────────
-- 1d10 + politician_credibility. Money = roll × $1,000 × (1 + vol×0.1).
--   Natural 1: -1 Credibility (donor blacklists you)
--   Total <5: $0 (slow day)
--   Total ≥5: standard payout to party_funds
--   Natural 10: 2× money + 1 Credibility (legendary call)
--
-- ── politician_civic_meeting ────────────────────────────────────────
-- 1d6 + politician_credibility.
--   Natural 1: -1 Volunteer (offensive remark, people walk out)
--   Total <5: -0.5 Credibility (rough room)
--   Total ≥5: +1 Volunteer (clamped at credibility × 3)
--   Natural 6: +2 Volunteers + 0.5 Party Popularity (clamped)
--
-- ── politician_office_hours ─────────────────────────────────────────
-- -$5,000 from party funds. 1d6 + politician_reputation.
--   Natural 1: -1 Reputation (someone leaks a bad story)
--   Total <5: -0.5 Party Popularity (no one came)
--   Total ≥5: +0.5 Credibility (showing up matters)
--   Natural 6: +1 Reputation only (great constituent encounter)
--
-- ── Credibility widened to numeric ──────────────────────────────────
-- politician_credibility was INT. Civic Meeting -0.5 and Office Hours
-- +0.5 require fractional support. Widen with explicit cast; existing
-- integer values survive unchanged. Same path 20270381 took for
-- politician_influence.
--
-- ── January volunteer decay ─────────────────────────────────────────
-- process_annual_january (20270457 + audit 20270458) gets one extra
-- column write: volunteers = GREATEST(0, COALESCE(volunteers, 0) - 1)
-- for all live politicians.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Schema ───────────────────────────────────────────────────────
ALTER TABLE factions
    ALTER COLUMN politician_credibility TYPE numeric USING politician_credibility::numeric;

ALTER TABLE factions
    ADD COLUMN IF NOT EXISTS volunteers numeric NOT NULL DEFAULT 0;
ALTER TABLE factions
    DROP CONSTRAINT IF EXISTS factions_volunteers_nonneg_chk;
ALTER TABLE factions
    ADD CONSTRAINT factions_volunteers_nonneg_chk CHECK (volunteers >= 0);

ALTER TABLE factions
    ADD COLUMN IF NOT EXISTS next_local_action_tick INT;

REVOKE UPDATE (volunteers, next_local_action_tick)
    ON factions FROM PUBLIC, anon, authenticated;

COMMENT ON COLUMN factions.volunteers IS
    'Grassroots stat for local-tier politicians (20270461). Capped at politician_credibility × 3 by the action RPCs. Decays -1 per game-year in process_annual_january. Server-only writes (REVOKE UPDATE).';

COMMENT ON COLUMN factions.next_local_action_tick IS
    'Earliest tick at which the politician may take another local-tier action (20270461). Stamped to current_tick + 1 by politician_fundraising_call, politician_civic_meeting, politician_office_hours. NULL = no cooldown. Server-only writes.';

-- ── 2. politician_fundraising_call ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.politician_fundraising_call(p_party_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid               uuid := auth.uid();
    v_pol               factions%ROWTYPE;
    v_tick              int;
    v_roll              int;
    v_total             numeric;
    v_bracket           text;
    v_money_raised      bigint := 0;
    v_volunteers_mult   numeric;
    v_new_funds         bigint;
    v_new_cred          numeric;
    v_cooldown          int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    SELECT * INTO v_pol FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND politician_party_id = p_party_id
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_member');
    END IF;
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;
    IF v_pol.next_local_action_tick IS NOT NULL
       AND v_pol.next_local_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_local_action_tick);
    END IF;

    v_roll  := 1 + floor(random() * 10)::int;
    v_total := v_roll + COALESCE(v_pol.politician_credibility, 0);
    v_volunteers_mult := 1 + COALESCE(v_pol.volunteers, 0) * 0.1;

    IF v_roll = 1 THEN
        v_bracket := 'crit_fail';
        UPDATE factions
           SET politician_credibility = GREATEST(0, COALESCE(politician_credibility, 0) - 1)
         WHERE id = v_pol.id
        RETURNING politician_credibility INTO v_new_cred;
    ELSIF v_total < 5 THEN
        v_bracket := 'fail';
    ELSIF v_roll = 10 THEN
        v_bracket := 'crit';
        v_money_raised := (round(v_roll * 1000 * v_volunteers_mult * 2))::bigint;
        UPDATE factions
           SET politician_credibility = COALESCE(politician_credibility, 0) + 1
         WHERE id = v_pol.id
        RETURNING politician_credibility INTO v_new_cred;
    ELSE
        v_bracket := 'hit';
        v_money_raised := (round(v_roll * 1000 * v_volunteers_mult))::bigint;
    END IF;

    IF v_money_raised > 0 THEN
        UPDATE factions
           SET party_funds = COALESCE(party_funds, 0) + v_money_raised
         WHERE id = p_party_id
           AND faction_type = 'movement_party'
        RETURNING party_funds INTO v_new_funds;
    END IF;

    v_cooldown := v_tick + 1;
    UPDATE factions SET next_local_action_tick = v_cooldown WHERE id = v_pol.id;

    RETURN jsonb_build_object(
        'success',              true,
        'action',               'fundraising_call',
        'roll',                 v_roll,
        'credibility',          COALESCE(v_pol.politician_credibility, 0),
        'total',                v_total,
        'bracket',              v_bracket,
        'volunteers',           COALESCE(v_pol.volunteers, 0),
        'volunteers_multiplier', v_volunteers_mult,
        'money_raised',         v_money_raised,
        'party_funds_after',    v_new_funds,
        'new_credibility',      v_new_cred,
        'next_action_tick',     v_cooldown
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.politician_fundraising_call(uuid) TO authenticated;

-- ── 3. politician_civic_meeting ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.politician_civic_meeting(p_party_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid               uuid := auth.uid();
    v_pol               factions%ROWTYPE;
    v_tick              int;
    v_roll              int;
    v_total             numeric;
    v_bracket           text;
    v_volunteer_delta   int := 0;
    v_pop_delta         numeric := 0;
    v_cred_delta        numeric := 0;
    v_vol_cap           numeric;
    v_new_vol           numeric;
    v_new_cred          numeric;
    v_new_pop           numeric;
    v_cooldown          int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    SELECT * INTO v_pol FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND politician_party_id = p_party_id
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_member');
    END IF;
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;
    IF v_pol.next_local_action_tick IS NOT NULL
       AND v_pol.next_local_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_local_action_tick);
    END IF;

    v_roll  := 1 + floor(random() * 6)::int;
    v_total := v_roll + COALESCE(v_pol.politician_credibility, 0);
    v_vol_cap := COALESCE(v_pol.politician_credibility, 0) * 3;

    IF v_roll = 1 THEN
        v_bracket := 'crit_fail';
        v_volunteer_delta := -1;
    ELSIF v_total < 5 THEN
        v_bracket := 'fail';
        v_cred_delta := -0.5;
    ELSIF v_roll = 6 THEN
        v_bracket := 'crit';
        v_volunteer_delta := 2;
        v_pop_delta := 0.5;
    ELSE
        v_bracket := 'hit';
        v_volunteer_delta := 1;
    END IF;

    -- Volunteers: clamp at [0, cap]. The cap is recomputed AFTER any
    -- credibility delta so a fail+gain sequence doesn't free-overflow.
    -- Apply credibility first.
    IF v_cred_delta <> 0 THEN
        UPDATE factions
           SET politician_credibility = GREATEST(0, COALESCE(politician_credibility, 0) + v_cred_delta)
         WHERE id = v_pol.id
        RETURNING politician_credibility INTO v_new_cred;
        v_vol_cap := v_new_cred * 3;
    END IF;
    IF v_volunteer_delta <> 0 THEN
        UPDATE factions
           SET volunteers = GREATEST(0, LEAST(v_vol_cap, COALESCE(volunteers, 0) + v_volunteer_delta))
         WHERE id = v_pol.id
        RETURNING volunteers INTO v_new_vol;
    END IF;
    IF v_pop_delta <> 0 THEN
        UPDATE factions
           SET popularity_pct = LEAST(popularity_cap_pct, GREATEST(0, COALESCE(popularity_pct, 0) + v_pop_delta))
         WHERE id = p_party_id
           AND faction_type = 'movement_party'
        RETURNING popularity_pct INTO v_new_pop;
    END IF;

    v_cooldown := v_tick + 1;
    UPDATE factions SET next_local_action_tick = v_cooldown WHERE id = v_pol.id;

    RETURN jsonb_build_object(
        'success',          true,
        'action',           'civic_meeting',
        'roll',             v_roll,
        'credibility',      COALESCE(v_pol.politician_credibility, 0),
        'total',            v_total,
        'bracket',          v_bracket,
        'volunteer_delta',  v_volunteer_delta,
        'credibility_delta', v_cred_delta,
        'popularity_delta', v_pop_delta,
        'new_volunteers',   COALESCE(v_new_vol, COALESCE(v_pol.volunteers, 0)),
        'new_credibility',  COALESCE(v_new_cred, COALESCE(v_pol.politician_credibility, 0)),
        'new_popularity',   v_new_pop,
        'volunteer_cap',    v_vol_cap,
        'next_action_tick', v_cooldown
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.politician_civic_meeting(uuid) TO authenticated;

-- ── 4. politician_office_hours ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.politician_office_hours(p_party_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid               uuid := auth.uid();
    v_pol               factions%ROWTYPE;
    v_party_funds       bigint;
    v_tick              int;
    v_cost              bigint := 5000;
    v_roll              int;
    v_total             int;
    v_bracket           text;
    v_rep_delta         int := 0;
    v_cred_delta        numeric := 0;
    v_pop_delta         numeric := 0;
    v_new_funds         bigint;
    v_new_rep           int;
    v_new_cred          numeric;
    v_new_pop           numeric;
    v_cooldown          int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    SELECT * INTO v_pol FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND politician_party_id = p_party_id
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_member');
    END IF;
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;
    IF v_pol.next_local_action_tick IS NOT NULL
       AND v_pol.next_local_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_local_action_tick);
    END IF;

    SELECT party_funds INTO v_party_funds
      FROM factions
     WHERE id = p_party_id
       AND faction_type = 'movement_party'
       AND abandoned_at IS NULL
     FOR UPDATE;
    IF v_party_funds IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'party_not_found');
    END IF;
    IF v_party_funds < v_cost THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_party_funds',
            'have', v_party_funds, 'need', v_cost);
    END IF;

    UPDATE factions
       SET party_funds = party_funds - v_cost
     WHERE id = p_party_id
    RETURNING party_funds INTO v_new_funds;

    v_roll  := 1 + floor(random() * 6)::int;
    v_total := v_roll + COALESCE(v_pol.politician_reputation, 0);

    IF v_roll = 1 THEN
        v_bracket := 'crit_fail';
        v_rep_delta := -1;
    ELSIF v_total < 5 THEN
        v_bracket := 'fail';
        v_pop_delta := -0.5;
    ELSIF v_roll = 6 THEN
        v_bracket := 'crit';
        v_rep_delta := 1;
    ELSE
        v_bracket := 'hit';
        v_cred_delta := 0.5;
    END IF;

    IF v_rep_delta <> 0 THEN
        UPDATE factions
           SET politician_reputation = GREATEST(0, COALESCE(politician_reputation, 0) + v_rep_delta)
         WHERE id = v_pol.id
        RETURNING politician_reputation INTO v_new_rep;
    END IF;
    IF v_cred_delta <> 0 THEN
        UPDATE factions
           SET politician_credibility = COALESCE(politician_credibility, 0) + v_cred_delta
         WHERE id = v_pol.id
        RETURNING politician_credibility INTO v_new_cred;
    END IF;
    IF v_pop_delta <> 0 THEN
        UPDATE factions
           SET popularity_pct = LEAST(popularity_cap_pct, GREATEST(0, COALESCE(popularity_pct, 0) + v_pop_delta))
         WHERE id = p_party_id
           AND faction_type = 'movement_party'
        RETURNING popularity_pct INTO v_new_pop;
    END IF;

    v_cooldown := v_tick + 1;
    UPDATE factions SET next_local_action_tick = v_cooldown WHERE id = v_pol.id;

    RETURN jsonb_build_object(
        'success',          true,
        'action',           'office_hours',
        'roll',             v_roll,
        'reputation',       COALESCE(v_pol.politician_reputation, 0),
        'total',            v_total,
        'bracket',          v_bracket,
        'cost',             v_cost,
        'reputation_delta', v_rep_delta,
        'credibility_delta', v_cred_delta,
        'popularity_delta', v_pop_delta,
        'party_funds_after', v_new_funds,
        'new_reputation',   v_new_rep,
        'new_credibility',  v_new_cred,
        'new_popularity',   v_new_pop,
        'next_action_tick', v_cooldown
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.politician_office_hours(uuid) TO authenticated;

-- ── 5. process_annual_january — add volunteer decay ─────────────────
-- Re-paste from 20270457 with one additional column write on the
-- politician bump UPDATE: volunteers GREATEST(0, ... - 1). National-
-- politics drag, slow, per spec.
CREATE OR REPLACE FUNCTION public.process_annual_january(p_tick int)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_month         int := (p_tick % 12);
    v_year          int := 2000 + (p_tick / 12);
    v_last_year     int;
    v_ages_bumped   int := 0;
    v_inf_bumped    int := 0;
    v_pops_decayed  int := 0;
BEGIN
    IF p_tick IS NULL THEN
        RETURN jsonb_build_object('ran', false, 'reason', 'null_tick');
    END IF;
    IF v_month <> 0 THEN
        RETURN jsonb_build_object('ran', false, 'reason', 'not_january', 'tick', p_tick);
    END IF;

    SELECT last_annual_processed_year INTO v_last_year
      FROM shard WHERE name = 'Alpha Shard' FOR UPDATE;
    IF v_last_year IS NOT NULL AND v_last_year >= v_year THEN
        RETURN jsonb_build_object('ran', false, 'reason', 'already_processed',
            'year', v_year, 'last_processed', v_last_year);
    END IF;

    UPDATE factions
       SET leader_age = COALESCE(leader_age, 0) + 1
     WHERE faction_type IN ('entrepreneur', 'politician')
       AND abandoned_at IS NULL;
    GET DIAGNOSTICS v_ages_bumped = ROW_COUNT;

    UPDATE factions
       SET politician_influence = COALESCE(politician_influence, 0) + 0.1,
           volunteers           = GREATEST(0, COALESCE(volunteers, 0) - 1)
     WHERE faction_type = 'politician'
       AND abandoned_at IS NULL;
    GET DIAGNOSTICS v_inf_bumped = ROW_COUNT;

    UPDATE factions
       SET popularity_pct = LEAST(popularity_cap_pct, GREATEST(0, COALESCE(popularity_pct, 0) - 2))
     WHERE faction_type = 'movement_party'
       AND abandoned_at IS NULL;
    GET DIAGNOSTICS v_pops_decayed = ROW_COUNT;

    UPDATE shard SET last_annual_processed_year = v_year WHERE name = 'Alpha Shard';

    RETURN jsonb_build_object(
        'ran',              true,
        'tick',             p_tick,
        'year',             v_year,
        'ages_bumped',      v_ages_bumped,
        'influence_bumped', v_inf_bumped,
        'parties_decayed',  v_pops_decayed
    );
END;
$$;

NOTIFY pgrst, 'reload schema';

COMMIT;
