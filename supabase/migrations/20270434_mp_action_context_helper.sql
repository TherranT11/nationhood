-- ════════════════════════════════════════════════════════════════════
-- Audit fix on 20270433: extract MP action gate helper (SOT)
--
-- The three MP-action RPCs shipped in 20270433 (floor_speech /
-- hold_rally / fundraising_dinner) each carried ~25 lines of identical
-- guard code:
--   • not_authenticated check
--   • politician lookup + FOR UPDATE
--   • office IN ('member_of_parliament', 'senior_mp') check
--   • politician_party_id NOT NULL check
--   • current_tick lookup
--   • next_mp_action_tick cooldown check
--   • party lookup + FOR UPDATE
-- Three callers × ~25 lines = ~75 duplicated lines. Adding a 4th MP
-- action down the road would copy-paste the same gate. Exactly the
-- pattern the design philosophy flags as "fix duplication before
-- adding new code."
--
-- Resolution: new SECURITY DEFINER helper public._mp_action_check()
-- returns one jsonb. Either:
--   { ok: false, reason: <code>, ...extra }
-- or:
--   { ok: true,
--     politician_id, credibility, charisma, reputation, influence,
--     party_id, party_name, party_funds,
--     current_tick }
-- Each RPC's guard collapses to:
--   v_ctx := _mp_action_check();
--   IF NOT (v_ctx->>'ok')::bool THEN
--     RETURN (v_ctx - 'ok') || jsonb_build_object('success', false);
--   END IF;
-- The helper's FOR UPDATE locks on politician + party persist into
-- the calling RPC's transaction (same tx scope), so the cooldown +
-- party-funds writes are race-safe without re-locking.
--
-- Helper is internal: REVOKE EXECUTE from PUBLIC. Only the three
-- existing SECURITY DEFINER RPCs (which run as their owner, not the
-- caller) reach it.
--
-- Bodies below = 20270433 with the inline gate replaced by the helper
-- call. Dice rolls, stat thresholds, clamping, money math, and cooldown
-- stamps are byte-for-byte identical.
--
-- One intentional payload tightening in floor_speech: 20270433 only
-- populated party_name on the FAIL branch (via the ELSE clause's
-- RETURNING) and returned NULL on PASS. 20270434 sources party_name
-- from the helper context, so it's now set in both branches. The UI
-- (fmtMpResult in politician-home.html) doesn't reference party_name
-- on the PASS line, so this is invisible to players — but it makes
-- the three RPCs' return shapes consistent.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Helper ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public._mp_action_check()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid   uuid := auth.uid();
    v_pol   factions%ROWTYPE;
    v_party factions%ROWTYPE;
    v_tick  int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'not_authenticated');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.politician_office NOT IN ('member_of_parliament', 'senior_mp') THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'wrong_office',
            'have', v_pol.politician_office);
    END IF;
    IF v_pol.politician_party_id IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'not_in_party');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    IF v_pol.next_mp_action_tick IS NOT NULL AND v_pol.next_mp_action_tick > v_tick THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_mp_action_tick, 'current_tick', v_tick);
    END IF;

    SELECT * INTO v_party FROM factions WHERE id = v_pol.politician_party_id FOR UPDATE;
    IF v_party.id IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'party_not_found');
    END IF;

    RETURN jsonb_build_object(
        'ok',           true,
        'politician_id', v_pol.id,
        'credibility',  COALESCE(v_pol.politician_credibility, 0),
        'charisma',     COALESCE(v_pol.politician_charisma, 0),
        'reputation',   COALESCE(v_pol.politician_reputation, 0),
        'influence',    COALESCE(v_pol.politician_influence, 0),
        'party_id',     v_party.id,
        'party_name',   v_party.faction_name,
        'party_funds',  COALESCE(v_party.party_funds, 0),
        'current_tick', v_tick
    );
END;
$$;
-- Internal helper — explicit revoke so authenticated clients can't
-- invoke it directly even though SECURITY DEFINER would mask the
-- caller's identity.
REVOKE EXECUTE ON FUNCTION public._mp_action_check() FROM PUBLIC;

COMMENT ON FUNCTION public._mp_action_check() IS
    'Canonical gate for MP-action RPCs (politician_mp_*). Acquires FOR UPDATE locks on politician + party rows; returns either {ok:false, reason, …} or {ok:true, …context-fields…}. Internal — reached only via SECURITY DEFINER RPC callers running as the function owner.';

-- ── 2. politician_mp_floor_speech (refactored) ──────────────────────
CREATE OR REPLACE FUNCTION public.politician_mp_floor_speech()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_ctx        jsonb;
    v_pol_id     uuid;
    v_party_id   uuid;
    v_tick       int;
    v_roll       int;
    v_stat       int;
    v_total      int;
    v_passed     boolean;
    v_new_rep    int;
    v_new_pop    numeric;
    v_party_name text;
BEGIN
    v_ctx := _mp_action_check();
    IF NOT (v_ctx->>'ok')::bool THEN
        RETURN (v_ctx - 'ok') || jsonb_build_object('success', false);
    END IF;

    v_pol_id     := (v_ctx->>'politician_id')::uuid;
    v_party_id   := (v_ctx->>'party_id')::uuid;
    v_party_name := v_ctx->>'party_name';
    v_tick       := (v_ctx->>'current_tick')::int;
    v_stat       := (v_ctx->>'credibility')::int;

    v_roll  := 1 + floor(random() * 6)::int;
    v_total := v_roll + v_stat;
    v_passed := v_total >= 5;

    IF v_passed THEN
        UPDATE factions
           SET politician_reputation = COALESCE(politician_reputation, 0) + 1
         WHERE id = v_pol_id
        RETURNING politician_reputation INTO v_new_rep;
    ELSE
        UPDATE factions
           SET popularity_pct = GREATEST(0, COALESCE(popularity_pct, 0) - 1)
         WHERE id = v_party_id
        RETURNING popularity_pct INTO v_new_pop;
    END IF;

    UPDATE factions SET next_mp_action_tick = v_tick + 6 WHERE id = v_pol_id;

    RETURN jsonb_build_object(
        'success',              true,
        'action',               'floor_speech',
        'roll',                 v_roll,
        'stat',                 v_stat,
        'total',                v_total,
        'passed',               v_passed,
        'new_reputation',       v_new_rep,
        'new_party_popularity', v_new_pop,
        'party_name',           v_party_name,
        'next_action_tick',     v_tick + 6
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.politician_mp_floor_speech() TO authenticated;

-- ── 3. politician_mp_hold_rally (refactored) ────────────────────────
CREATE OR REPLACE FUNCTION public.politician_mp_hold_rally()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_ctx        jsonb;
    v_pol_id     uuid;
    v_party_id   uuid;
    v_party_name text;
    v_tick       int;
    v_funds      bigint;
    v_roll       int;
    v_stat       int;
    v_total      int;
    v_passed     boolean;
    v_new_pop    numeric;
    v_new_rep    int;
    v_new_funds  numeric;
    v_cost       bigint := 10000;
BEGIN
    v_ctx := _mp_action_check();
    IF NOT (v_ctx->>'ok')::bool THEN
        RETURN (v_ctx - 'ok') || jsonb_build_object('success', false);
    END IF;

    v_pol_id     := (v_ctx->>'politician_id')::uuid;
    v_party_id   := (v_ctx->>'party_id')::uuid;
    v_party_name := v_ctx->>'party_name';
    v_tick       := (v_ctx->>'current_tick')::int;
    v_funds      := (v_ctx->>'party_funds')::bigint;
    v_stat       := (v_ctx->>'charisma')::int;

    IF v_funds < v_cost THEN
        -- Cooldown intentionally NOT burned — the action didn't happen.
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_party_funds',
            'have', v_funds, 'need', v_cost);
    END IF;

    UPDATE factions SET party_funds = COALESCE(party_funds, 0) - v_cost
     WHERE id = v_party_id
    RETURNING party_funds INTO v_new_funds;

    v_roll  := 1 + floor(random() * 6)::int;
    v_total := v_roll + v_stat;
    v_passed := v_total >= 5;

    IF v_passed THEN
        UPDATE factions
           SET popularity_pct = LEAST(100, COALESCE(popularity_pct, 0) + 1)
         WHERE id = v_party_id
        RETURNING popularity_pct INTO v_new_pop;
    ELSE
        UPDATE factions
           SET politician_reputation = GREATEST(0, COALESCE(politician_reputation, 0) - 1)
         WHERE id = v_pol_id
        RETURNING politician_reputation INTO v_new_rep;
    END IF;

    UPDATE factions SET next_mp_action_tick = v_tick + 6 WHERE id = v_pol_id;

    RETURN jsonb_build_object(
        'success',              true,
        'action',               'hold_rally',
        'roll',                 v_roll,
        'stat',                 v_stat,
        'total',                v_total,
        'passed',               v_passed,
        'cost',                 v_cost,
        'party_funds_after',    v_new_funds,
        'new_party_popularity', v_new_pop,
        'new_reputation',       v_new_rep,
        'party_name',           v_party_name,
        'next_action_tick',     v_tick + 6
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.politician_mp_hold_rally() TO authenticated;

-- ── 4. politician_mp_fundraising_dinner (refactored) ────────────────
CREATE OR REPLACE FUNCTION public.politician_mp_fundraising_dinner()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_ctx        jsonb;
    v_pol_id     uuid;
    v_party_id   uuid;
    v_party_name text;
    v_tick       int;
    v_roll       int;
    v_stat       int;
    v_total      int;
    v_money      bigint;
    v_new_funds  numeric;
    v_new_inf    numeric;
    v_new_cha    int;
    v_stat_delta text := NULL;
BEGIN
    v_ctx := _mp_action_check();
    IF NOT (v_ctx->>'ok')::bool THEN
        RETURN (v_ctx - 'ok') || jsonb_build_object('success', false);
    END IF;

    v_pol_id     := (v_ctx->>'politician_id')::uuid;
    v_party_id   := (v_ctx->>'party_id')::uuid;
    v_party_name := v_ctx->>'party_name';
    v_tick       := (v_ctx->>'current_tick')::int;
    v_stat       := (v_ctx->>'reputation')::int;

    v_roll  := 1 + floor(random() * 30)::int;
    v_total := v_roll + v_stat;
    v_money := (v_total * 1000)::bigint;

    UPDATE factions SET party_funds = COALESCE(party_funds, 0) + v_money
     WHERE id = v_party_id
    RETURNING party_funds INTO v_new_funds;

    IF v_total <= 10 THEN
        UPDATE factions
           SET politician_influence = GREATEST(0, COALESCE(politician_influence, 0) - 1)
         WHERE id = v_pol_id
        RETURNING politician_influence INTO v_new_inf;
        v_stat_delta := 'influence';
    ELSIF v_total >= 25 THEN
        UPDATE factions
           SET politician_charisma = COALESCE(politician_charisma, 0) + 1
         WHERE id = v_pol_id
        RETURNING politician_charisma INTO v_new_cha;
        v_stat_delta := 'charisma';
    END IF;

    UPDATE factions SET next_mp_action_tick = v_tick + 6 WHERE id = v_pol_id;

    RETURN jsonb_build_object(
        'success',           true,
        'action',            'fundraising_dinner',
        'roll',              v_roll,
        'stat',              v_stat,
        'total',             v_total,
        'money_raised',      v_money,
        'party_funds_after', v_new_funds,
        'party_name',        v_party_name,
        'stat_delta',        v_stat_delta,
        'new_influence',     v_new_inf,
        'new_charisma',      v_new_cha,
        'next_action_tick',  v_tick + 6
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.politician_mp_fundraising_dinner() TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
