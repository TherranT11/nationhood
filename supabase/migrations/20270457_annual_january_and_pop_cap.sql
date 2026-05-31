-- ════════════════════════════════════════════════════════════════════
-- Annual January tick + Party popularity cap
--
-- ── Annual January tick ─────────────────────────────────────────────
-- Every game-year January (current_tick % 12 = 0):
--   • All entrepreneur + politician factions: leader_age += 1
--   • All politician factions: politician_influence += 0.1
--   • All movement_party factions: popularity_pct -= 2 (clamped to cap)
--
-- Mechanism: AFTER UPDATE trigger on shard.current_tick → calls the
-- idempotent process_annual_january RPC. The RPC self-gates on month
-- (January only) and year (shard.last_annual_processed_year). Lock on
-- the shard row serialises concurrent triggers. If a tick advance
-- skips multiple years (manual reprocess, downtime catch-up), only
-- the LAST January's effects fire — by design, we don't replay
-- multiple years of accumulated decay.
--
-- ── Party popularity cap ────────────────────────────────────────────
-- factions.popularity_cap_pct (numeric, default 40). Each movement
-- party caps its popularity at this value. Cap is per-party so future
-- mechanisms (Brand Campaign motion, election wins, etc.) can raise
-- it individually. v1 ships every party at the 40 baseline.
--
-- All popularity-increasing RPCs clamp at popularity_cap_pct. The
-- party.html stats strip now shows "X% / 40%" so the ceiling is
-- visible at a glance.
--
-- Backfill clamps existing popularities down to 40 — honest to the
-- new rules. Parties above 40 today drop to 40 immediately.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Shard idempotency column ─────────────────────────────────────
ALTER TABLE shard
    ADD COLUMN IF NOT EXISTS last_annual_processed_year INT;

COMMENT ON COLUMN shard.last_annual_processed_year IS
    'Last calendar year (2000 + tick/12) for which process_annual_january ran. Idempotency stamp so the trigger re-fire is a no-op once a year is processed.';

-- ── 2. Per-party popularity cap column ──────────────────────────────
ALTER TABLE factions
    ADD COLUMN IF NOT EXISTS popularity_cap_pct numeric NOT NULL DEFAULT 40
    CHECK (popularity_cap_pct >= 0 AND popularity_cap_pct <= 100);

COMMENT ON COLUMN factions.popularity_cap_pct IS
    'Hard ceiling on factions.popularity_pct for movement_party rows. Default 40 (20270457). Raisable per-party by future mechanisms (Brand Campaign motion, election wins, etc.). Server clamps in every popularity-increasing RPC.';

REVOKE UPDATE (popularity_cap_pct)
    ON factions FROM PUBLIC, anon, authenticated;

-- ── 3. Backfill — clamp existing popularities to the cap ────────────
UPDATE factions
   SET popularity_pct = LEAST(popularity_cap_pct, GREATEST(0, COALESCE(popularity_pct, 0)))
 WHERE faction_type = 'movement_party'
   AND abandoned_at IS NULL;

-- ── 4. process_annual_january — idempotent annual tick ──────────────
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

    -- January only.
    IF v_month <> 0 THEN
        RETURN jsonb_build_object('ran', false, 'reason', 'not_january', 'tick', p_tick);
    END IF;

    -- Lock + read idempotency stamp.
    SELECT last_annual_processed_year INTO v_last_year
      FROM shard WHERE name = 'Alpha Shard' FOR UPDATE;
    IF v_last_year IS NOT NULL AND v_last_year >= v_year THEN
        RETURN jsonb_build_object('ran', false, 'reason', 'already_processed',
            'year', v_year, 'last_processed', v_last_year);
    END IF;

    -- Age +1 for all live entrepreneurs + politicians.
    UPDATE factions
       SET leader_age = COALESCE(leader_age, 0) + 1
     WHERE faction_type IN ('entrepreneur', 'politician')
       AND abandoned_at IS NULL;
    GET DIAGNOSTICS v_ages_bumped = ROW_COUNT;

    -- Influence +0.1 for live politicians only (entrepreneurs skipped
    -- per design — politician_influence is politician-specific).
    UPDATE factions
       SET politician_influence = COALESCE(politician_influence, 0) + 0.1
     WHERE faction_type = 'politician'
       AND abandoned_at IS NULL;
    GET DIAGNOSTICS v_inf_bumped = ROW_COUNT;

    -- Party popularity natural decay -2, clamped to [0, popularity_cap_pct].
    UPDATE factions
       SET popularity_pct = LEAST(popularity_cap_pct, GREATEST(0, COALESCE(popularity_pct, 0) - 2))
     WHERE faction_type = 'movement_party'
       AND abandoned_at IS NULL;
    GET DIAGNOSTICS v_pops_decayed = ROW_COUNT;

    -- Stamp the year so re-firing the trigger this tick is a no-op.
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

GRANT EXECUTE ON FUNCTION public.process_annual_january(int) TO authenticated, service_role;

COMMENT ON FUNCTION public.process_annual_january(int) IS
    'Idempotent annual game-year tick (20270457). Run on every shard.current_tick advance via trigger; no-ops unless month=January AND year > shard.last_annual_processed_year. Bumps leader_age +1 (entrepreneurs + politicians), politician_influence +0.1 (politicians), popularity_pct -2 clamped to cap (movement parties).';

-- ── 5. Trigger on shard tick advance ────────────────────────────────
CREATE OR REPLACE FUNCTION public.trg_shard_annual_january()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    -- Only forward advances. Reprocess mode doesn't update current_tick,
    -- but defensive check anyway: we don't want to fire on rollbacks.
    IF NEW.current_tick IS DISTINCT FROM OLD.current_tick
       AND NEW.current_tick > COALESCE(OLD.current_tick, -1) THEN
        PERFORM public.process_annual_january(NEW.current_tick);
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS shard_annual_january_trigger ON shard;
CREATE TRIGGER shard_annual_january_trigger
    AFTER UPDATE ON shard
    FOR EACH ROW EXECUTE FUNCTION public.trg_shard_annual_january();

-- ── 6. Update popularity-increasing RPCs to clamp at popularity_cap_pct ─
-- politician_door_knock (20270450) — pop deltas are -1/-0.5/0; the
-- cap clamp is a no-op on negatives but kept for shape consistency.
CREATE OR REPLACE FUNCTION public.politician_door_knock(p_party_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_tick      int;
    v_roll      int;
    v_total     int;
    v_bracket   text;
    v_pop_delta numeric := 0;
    v_inf_delta numeric := 0;
    v_new_pop   numeric;
    v_new_inf   numeric;
    v_cooldown  int;
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
    IF v_pol.door_knock_cooldown_until_tick IS NOT NULL
       AND v_pol.door_knock_cooldown_until_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.door_knock_cooldown_until_tick);
    END IF;
    v_roll  := 1 + floor(random() * 6)::int;
    v_total := v_roll + COALESCE(v_pol.politician_reputation, 0);
    IF v_roll = 1 THEN
        v_bracket := 'crit_fail'; v_pop_delta := -1;
    ELSIF v_roll = 6 THEN
        v_bracket := 'crit';      v_inf_delta := 0.4;
    ELSIF v_total >= 5 THEN
        v_bracket := 'hit';       v_inf_delta := 0.2;
    ELSE
        v_bracket := 'fail';      v_pop_delta := -0.5;
    END IF;
    UPDATE factions
       SET popularity_pct = LEAST(popularity_cap_pct, GREATEST(0, COALESCE(popularity_pct, 0) + v_pop_delta))
     WHERE id = p_party_id
       AND faction_type = 'movement_party'
    RETURNING popularity_pct INTO v_new_pop;
    IF v_new_pop IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'party_not_found');
    END IF;
    v_cooldown := v_tick + 2;
    UPDATE factions
       SET politician_influence            = GREATEST(0, COALESCE(politician_influence, 0) + v_inf_delta),
           door_knock_cooldown_until_tick  = v_cooldown
     WHERE id = v_pol.id
    RETURNING politician_influence INTO v_new_inf;
    RETURN jsonb_build_object(
        'success',              true,
        'roll',                 v_roll,
        'reputation',           COALESCE(v_pol.politician_reputation, 0),
        'total',                v_total,
        'bracket',              v_bracket,
        'popularity_delta',     v_pop_delta,
        'influence_delta',      v_inf_delta,
        'popularity_pct',       v_new_pop,
        'politician_influence', v_new_inf,
        'cooldown_until_tick',  v_cooldown
    );
END;
$$;

-- politician_give_speech — +0.2/+0.4 pop on success. The cap clamp
-- matters here: a successful speech at popularity = 40 lands a no-op.
CREATE OR REPLACE FUNCTION public.politician_give_speech(p_party_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_tick      int;
    v_cooldown  int;
    v_roll      int;
    v_total     int;
    v_bracket   text;
    v_pop_delta numeric := 0;
    v_rep_delta int     := 0;
    v_new_pop   numeric;
    v_new_rep   int;
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
    IF v_pol.speech_cooldown_until_tick IS NOT NULL
       AND v_pol.speech_cooldown_until_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.speech_cooldown_until_tick);
    END IF;
    v_roll  := 1 + floor(random() * 6)::int;
    v_total := v_roll + COALESCE(v_pol.politician_charisma, 0);
    IF v_roll = 1 THEN
        v_bracket := 'crit_fail'; v_rep_delta := -3;
    ELSIF v_roll = 6 THEN
        v_bracket := 'crit';      v_pop_delta := 0.4;
    ELSIF v_total >= 5 THEN
        v_bracket := 'hit';       v_pop_delta := 0.2;
    ELSE
        v_bracket := 'fail';      v_rep_delta := -2;
    END IF;
    UPDATE factions
       SET popularity_pct = LEAST(popularity_cap_pct, GREATEST(0, COALESCE(popularity_pct, 0) + v_pop_delta))
     WHERE id = p_party_id
       AND faction_type = 'movement_party'
    RETURNING popularity_pct INTO v_new_pop;
    IF v_new_pop IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'party_not_found');
    END IF;
    v_cooldown := v_tick + 3;
    UPDATE factions
       SET politician_reputation       = GREATEST(0, COALESCE(politician_reputation, 0) + v_rep_delta),
           speech_cooldown_until_tick  = v_cooldown
     WHERE id = v_pol.id
    RETURNING politician_reputation INTO v_new_rep;
    RETURN jsonb_build_object(
        'success',              true,
        'roll',                 v_roll,
        'charisma',             COALESCE(v_pol.politician_charisma, 0),
        'total',                v_total,
        'bracket',              v_bracket,
        'popularity_delta',     v_pop_delta,
        'reputation_delta',     v_rep_delta,
        'popularity_pct',       v_new_pop,
        'politician_reputation', v_new_rep,
        'cooldown_until_tick',  v_cooldown
    );
END;
$$;

-- politician_resolve_due_elections — community/city_council win adds
-- +1 pop. The cap clamp now reads from the row instead of LEAST(100).
-- The rest of the function is preserved verbatim from 20270452.
CREATE OR REPLACE FUNCTION public.politician_resolve_due_elections()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_pol          factions%ROWTYPE;
    v_tick         int;
    v_race         politician_active_election%ROWTYPE;
    v_won          boolean;
    v_stake        int;
    v_inf_before   numeric;
    v_new_inf      numeric;
    v_actual_delta numeric;
    v_event        text;
    v_opp_full     text;
    v_party_seats  int;
    v_party_pop    numeric;
    v_party_name   text;
    v_party_reward jsonb;
    v_party_penalty jsonb;
    v_new_cha      int;
    v_new_cred     int;
    v_stat_reward  jsonb;
    v_office       text;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    SELECT * INTO v_pol FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', true, 'resolved', false, 'reason', 'no_politician');
    END IF;
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', true, 'resolved', false, 'reason', 'no_shard');
    END IF;
    SELECT * INTO v_race FROM politician_active_election WHERE politician_id = v_pol.id;
    IF v_race.politician_id IS NULL THEN
        RETURN jsonb_build_object('success', true, 'resolved', false);
    END IF;
    IF v_race.resolve_tick >= v_tick THEN
        RETURN jsonb_build_object(
            'success', true, 'resolved', false,
            'race_tier', v_race.race_tier,
            'resolve_tick', v_race.resolve_tick,
            'current_tick', v_tick
        );
    END IF;
    IF v_race.polling_you_pct > v_race.polling_opp_pct THEN
        v_won := true;
    ELSIF v_race.polling_you_pct < v_race.polling_opp_pct THEN
        v_won := false;
    ELSE
        v_won := random() < 0.5;
    END IF;
    v_stake := CASE WHEN v_won THEN v_race.stake_win ELSE v_race.stake_lose END;
    v_event := CASE WHEN v_won THEN 'won_election' ELSE 'lost_election' END;
    v_opp_full := v_race.opp_first || ' ' || v_race.opp_last;
    v_inf_before := COALESCE(v_pol.politician_influence, 0);
    UPDATE factions
       SET politician_influence = GREATEST(0, v_inf_before + v_stake)
     WHERE id = v_pol.id
    RETURNING politician_influence INTO v_new_inf;
    v_actual_delta := v_new_inf - v_inf_before;
    IF v_won AND v_race.party_id IS NOT NULL THEN
        IF v_race.race_tier IN ('parliament', 'senior_mp') THEN
            UPDATE factions
               SET seats = COALESCE(seats, 0) + 1
             WHERE id = v_race.party_id
               AND faction_type = 'movement_party'
               AND abandoned_at IS NULL
            RETURNING seats, faction_name INTO v_party_seats, v_party_name;
            IF FOUND THEN
                v_party_reward := jsonb_build_object(
                    'kind',       'seats',
                    'delta',      1,
                    'new_value',  v_party_seats,
                    'party_name', v_party_name
                );
            END IF;
        ELSIF v_race.race_tier IN ('community', 'city_council') THEN
            UPDATE factions
               SET popularity_pct = LEAST(popularity_cap_pct, COALESCE(popularity_pct, 0) + 1)
             WHERE id = v_race.party_id
               AND faction_type = 'movement_party'
               AND abandoned_at IS NULL
            RETURNING popularity_pct, faction_name INTO v_party_pop, v_party_name;
            IF FOUND THEN
                v_party_reward := jsonb_build_object(
                    'kind',       'popularity',
                    'delta',      1,
                    'new_value',  v_party_pop,
                    'party_name', v_party_name
                );
            END IF;
        END IF;
    END IF;
    IF NOT v_won AND v_race.party_id IS NOT NULL
       AND v_race.race_tier = 'parliament' THEN
        UPDATE factions
           SET popularity_pct = GREATEST(0, COALESCE(popularity_pct, 0) - 0.5)
         WHERE id = v_race.party_id
           AND faction_type = 'movement_party'
           AND abandoned_at IS NULL
        RETURNING popularity_pct, faction_name INTO v_party_pop, v_party_name;
        IF FOUND THEN
            v_party_penalty := jsonb_build_object(
                'kind',       'popularity',
                'delta',      -0.5,
                'new_value',  v_party_pop,
                'party_name', v_party_name
            );
        END IF;
    END IF;
    IF v_won THEN
        IF v_race.race_tier IN ('parliament', 'senior_mp') THEN
            UPDATE factions
               SET politician_charisma = COALESCE(politician_charisma, 1) + 1
             WHERE id = v_pol.id
            RETURNING politician_charisma INTO v_new_cha;
            v_stat_reward := jsonb_build_object('kind', 'charisma', 'delta', 1, 'new_value', v_new_cha);
        ELSIF v_race.race_tier IN ('community', 'city_council') THEN
            UPDATE factions
               SET politician_credibility = COALESCE(politician_credibility, 1) + 1
             WHERE id = v_pol.id
            RETURNING politician_credibility INTO v_new_cred;
            v_stat_reward := jsonb_build_object('kind', 'credibility', 'delta', 1, 'new_value', v_new_cred);
        END IF;
        v_office := CASE v_race.race_tier
                        WHEN 'community'    THEN 'community_organizer'
                        WHEN 'parliament'   THEN 'member_of_parliament'
                        WHEN 'city_council' THEN 'city_council_member'
                        WHEN 'senior_mp'    THEN 'senior_mp'
                    END;
        IF v_office IS NOT NULL THEN
            UPDATE factions
               SET politician_office             = v_office,
                   politician_office_won_at_tick = v_tick
             WHERE id = v_pol.id;
        END IF;
    END IF;
    INSERT INTO politician_career_events (
        faction_id, event_tick, event_type, target_name, metadata
    ) VALUES (
        v_pol.id, v_tick, v_event, v_race.district,
        jsonb_build_object(
            'race_tier',       v_race.race_tier,
            'district',        v_race.district,
            'opponent',        v_opp_full,
            'opp_party_name',  v_race.opp_party_name,
            'polling_you',     v_race.polling_you_pct,
            'polling_opp',     v_race.polling_opp_pct,
            'influence_delta', v_actual_delta,
            'party_reward',    v_party_reward,
            'party_penalty',   v_party_penalty,
            'stat_reward',     v_stat_reward,
            'office_gained',   v_office
        )
    );
    DELETE FROM politician_active_election WHERE politician_id = v_pol.id;
    RETURN jsonb_build_object(
        'success',              true,
        'resolved',             true,
        'won',                  v_won,
        'race_tier',            v_race.race_tier,
        'district',             v_race.district,
        'opponent',             v_opp_full,
        'opp_party_name',       v_race.opp_party_name,
        'polling_you',          v_race.polling_you_pct,
        'polling_opp',          v_race.polling_opp_pct,
        'influence_delta',      v_actual_delta,
        'politician_influence', v_new_inf,
        'party_reward',         v_party_reward,
        'party_penalty',        v_party_penalty,
        'stat_reward',          v_stat_reward,
        'office_gained',        v_office
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.politician_resolve_due_elections() TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
