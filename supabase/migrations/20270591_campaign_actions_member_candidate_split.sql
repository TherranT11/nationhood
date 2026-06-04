-- ════════════════════════════════════════════════════════════════════
-- 20270591 — Campaign actions redesign: member + candidate split
--
-- Replaces the 20270588 design (politician_door_knock=ads body,
-- politician_give_speech=1d6 polling) with the actual member /
-- candidate split:
--
--   Party Member (no race needed):
--     • politician_door_knock — 1d6 → ±Influence (political_capital).
--                                1 = -1; 2-5 = +1; 6 = +2. No cost.
--                                Shared 1-per-tick gate.
--     • politician_give_speech — random 50/50 +1 Skill OR +1 Capital
--                                (politician_skill / politician_influence).
--                                3-tick speech-specific cooldown PLUS the
--                                shared 1-per-tick gate. No cost.
--
--   Candidate (requires politician_active_election row):
--     • politician_run_political_ads — 1d10 + 6 polling. Cost: 1 Capital.
--     • politician_campaign_rally    — +1d6 polling. No cost.
--     • politician_request_endorsement — 1d6 + politician_reputation.
--                                Total ≥ 3 → 'endorsed', +7 polling.
--                                Total < 3 → 'rejected', -1d3 polling
--                                (loss sent back to undecided, not opp).
--                                Once per race; outcome persisted on the
--                                active_election row so the UI can swap
--                                the button for a result badge.
--
-- Schema:
--   • factions.next_speech_tick — speech-specific cooldown anchor
--                                  (separate from next_member_action_tick).
--   • politician_active_election.endorsement_outcome
--                                  ('endorsed' | 'rejected' | NULL).
--                                  NULL = button shows; non-NULL = badge.
--                                  Per-race; cleared with the row on
--                                  race resolution (politician_active_election
--                                  rows are deleted/replaced when races end).
--
-- All campaign actions still share next_member_action_tick as the
-- "one per tick" gate. The candidate actions (ads / rally / endorse)
-- also consume the same gate, so a candidate spends ONE action per tick
-- across both surfaces (member-side and campaign-side combined).
--
-- politician_mp_hold_rally (existing MP-in-office Hold a Rally) is
-- unrelated and unchanged — that's the office-holder action, this
-- migration adds a separate politician_campaign_rally for the candidate
-- surface so the two RPCs don't clobber each other.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Schema additions ────────────────────────────────────────────
ALTER TABLE public.factions
    ADD COLUMN IF NOT EXISTS next_speech_tick int;

COMMENT ON COLUMN public.factions.next_speech_tick IS
    'Earliest tick at which politician_give_speech (20270591) may fire again. 3-tick cooldown set on success. NULL = no cooldown active. Separate from next_member_action_tick (the shared 1-per-tick gate across all member + candidate campaign actions).';

ALTER TABLE public.politician_active_election
    ADD COLUMN IF NOT EXISTS endorsement_outcome text
        CHECK (endorsement_outcome IS NULL OR endorsement_outcome IN ('endorsed', 'rejected'));

COMMENT ON COLUMN public.politician_active_election.endorsement_outcome IS
    'Per-race result of politician_request_endorsement (20270591). NULL = not attempted (button live). endorsed = +7 polling locked in (badge: PARTY ENDORSED YOU). rejected = -1d3 polling already applied (badge: NO ENDORSEMENT). Once-only per race; row is cleared on race resolution alongside the rest of the active_election state.';

-- ── 2. politician_door_knock — Door Knocking mechanic ──────────────
-- Replaces the 20270588 ads body. 1d6 against the Influence column
-- (political_capital, labeled "Influence" post-relabel scheme).
CREATE OR REPLACE FUNCTION public.politician_door_knock(p_party_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_tick      int;
    v_roll      int;
    v_delta     int;
    v_new_inf   int;
    v_next      int;
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

    IF v_pol.next_member_action_tick IS NOT NULL
       AND v_pol.next_member_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_member_action_tick);
    END IF;

    v_roll  := 1 + floor(random() * 6)::int;
    v_delta := CASE WHEN v_roll = 1 THEN -1
                    WHEN v_roll <= 5 THEN  1
                    ELSE                   2 END;
    v_next  := v_tick + 1;

    UPDATE factions
       SET political_capital       = GREATEST(0, COALESCE(political_capital, 0) + v_delta),
           next_member_action_tick = v_next
     WHERE id = v_pol.id
    RETURNING political_capital INTO v_new_inf;

    RETURN jsonb_build_object(
        'success',                 true,
        'action',                  'door_knock',
        'roll',                    v_roll,
        'influence_delta',         v_delta,
        'political_capital',       v_new_inf,
        'next_member_action_tick', v_next
    );
END;
$$;

-- ── 3. politician_give_speech — Skill/Capital random 50/50 ─────────
-- Replaces the 20270588 1d6-polling body. Coin-flip between +1 Skill
-- (politician_skill) and +1 Capital (politician_influence). 3-tick
-- speech-specific cooldown on top of the shared 1-per-tick gate.
CREATE OR REPLACE FUNCTION public.politician_give_speech(p_party_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    SPEECH_COOLDOWN CONSTANT int := 3;
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_tick      int;
    v_pick      text;
    v_next      int;
    v_new_skill int;
    v_new_cap   int;
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

    -- Shared 1-per-tick gate (any member or candidate action).
    IF v_pol.next_member_action_tick IS NOT NULL
       AND v_pol.next_member_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_member_action_tick);
    END IF;
    -- Speech-specific 3-tick cooldown.
    IF v_pol.next_speech_tick IS NOT NULL
       AND v_pol.next_speech_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'speech_cooldown',
            'ready_at_tick', v_pol.next_speech_tick);
    END IF;

    v_pick := CASE WHEN random() < 0.5 THEN 'skill' ELSE 'capital' END;
    v_next := v_tick + 1;

    IF v_pick = 'skill' THEN
        UPDATE factions
           SET politician_skill        = COALESCE(politician_skill, 0) + 1,
               next_member_action_tick = v_next,
               next_speech_tick        = v_tick + SPEECH_COOLDOWN
         WHERE id = v_pol.id
        RETURNING politician_skill INTO v_new_skill;
    ELSE
        UPDATE factions
           SET politician_influence    = COALESCE(politician_influence, 0) + 1,
               next_member_action_tick = v_next,
               next_speech_tick        = v_tick + SPEECH_COOLDOWN
         WHERE id = v_pol.id
        RETURNING politician_influence INTO v_new_cap;
    END IF;

    RETURN jsonb_build_object(
        'success',                 true,
        'action',                  'speech',
        'reward',                  v_pick,
        'politician_skill',        v_new_skill,
        'politician_influence',    v_new_cap,
        'next_member_action_tick', v_next,
        'next_speech_tick',        v_tick + SPEECH_COOLDOWN
    );
END;
$$;

-- ── 4. politician_run_political_ads — candidate Ads ────────────────
-- 1d10 + 6 → polling. Cost 1 Capital (politician_influence). Shared gate.
CREATE OR REPLACE FUNCTION public.politician_run_political_ads(p_party_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    AD_COST    CONSTANT int := 1;
    FLAT_BONUS CONSTANT int := 6;
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_tick      int;
    v_roll      int;
    v_total     int;
    v_race      politician_active_election%ROWTYPE;
    v_und_take  int;
    v_opp_take  int;
    v_new_cap   int;
    v_next      int;
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

    IF v_pol.next_member_action_tick IS NOT NULL
       AND v_pol.next_member_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_member_action_tick);
    END IF;

    IF COALESCE(v_pol.politician_influence, 0) < AD_COST THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_capital',
            'required', AD_COST,
            'have',     COALESCE(v_pol.politician_influence, 0));
    END IF;

    v_roll  := 1 + floor(random() * 10)::int;
    v_total := v_roll + FLAT_BONUS;
    v_next  := v_tick + 1;

    UPDATE factions
       SET politician_influence    = GREATEST(0, COALESCE(politician_influence, 0) - AD_COST),
           next_member_action_tick = v_next
     WHERE id = v_pol.id
    RETURNING politician_influence INTO v_new_cap;

    SELECT * INTO v_race FROM politician_active_election WHERE politician_id = v_pol.id;
    IF v_race.politician_id IS NOT NULL THEN
        v_und_take := LEAST(v_total, v_race.polling_undecided_pct);
        v_opp_take := v_total - v_und_take;
        UPDATE politician_active_election
           SET polling_you_pct       = LEAST(100, polling_you_pct + v_total),
               polling_undecided_pct = polling_undecided_pct - v_und_take,
               polling_opp_pct       = GREATEST(0, polling_opp_pct - v_opp_take)
         WHERE politician_id = v_pol.id;
    END IF;

    RETURN jsonb_build_object(
        'success',                 true,
        'action',                  'run_political_ads',
        'roll',                    v_roll,
        'polling_delta',           v_total,
        'cost',                    AD_COST,
        'politician_influence',    v_new_cap,
        'next_member_action_tick', v_next,
        'has_active_race',         v_race.politician_id IS NOT NULL
    );
END;
$$;

-- ── 5. politician_campaign_rally — candidate Rally ─────────────────
-- +1d6 polling. No cost. Shared 1-per-tick gate.
-- Named *_campaign_rally to disambiguate from the existing
-- politician_mp_hold_rally (the MP-in-office Hold a Rally, unrelated).
CREATE OR REPLACE FUNCTION public.politician_campaign_rally(p_party_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_tick      int;
    v_roll      int;
    v_race      politician_active_election%ROWTYPE;
    v_und_take  int;
    v_opp_take  int;
    v_next      int;
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

    IF v_pol.next_member_action_tick IS NOT NULL
       AND v_pol.next_member_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_member_action_tick);
    END IF;

    v_roll := 1 + floor(random() * 6)::int;
    v_next := v_tick + 1;

    UPDATE factions
       SET next_member_action_tick = v_next
     WHERE id = v_pol.id;

    SELECT * INTO v_race FROM politician_active_election WHERE politician_id = v_pol.id;
    IF v_race.politician_id IS NOT NULL THEN
        v_und_take := LEAST(v_roll, v_race.polling_undecided_pct);
        v_opp_take := v_roll - v_und_take;
        UPDATE politician_active_election
           SET polling_you_pct       = LEAST(100, polling_you_pct + v_roll),
               polling_undecided_pct = polling_undecided_pct - v_und_take,
               polling_opp_pct       = GREATEST(0, polling_opp_pct - v_opp_take)
         WHERE politician_id = v_pol.id;
    END IF;

    RETURN jsonb_build_object(
        'success',                 true,
        'action',                  'campaign_rally',
        'roll',                    v_roll,
        'polling_delta',           v_roll,
        'next_member_action_tick', v_next,
        'has_active_race',         v_race.politician_id IS NOT NULL
    );
END;
$$;

-- ── 6. politician_request_endorsement — candidate, once per race ───
-- Roll 1d6 + politician_reputation. Total ≥ 3 → endorsed, +7 polling.
-- Total < 3 → rejected, -1d3 polling (loss returns to undecided pool,
-- not transferred to opponent — a fumble doesn't help the opp directly).
-- Once-only per race: gated on endorsement_outcome IS NULL.
CREATE OR REPLACE FUNCTION public.politician_request_endorsement(p_party_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    SUCCESS_THRESHOLD CONSTANT int := 3;
    SUCCESS_BONUS     CONSTANT int := 7;
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_tick      int;
    v_race      politician_active_election%ROWTYPE;
    v_roll      int;
    v_total     int;
    v_outcome   text;
    v_penalty   int;
    v_loss      int;
    v_und_take  int;
    v_opp_take  int;
    v_next      int;
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

    IF v_pol.next_member_action_tick IS NOT NULL
       AND v_pol.next_member_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_member_action_tick);
    END IF;

    SELECT * INTO v_race FROM politician_active_election
     WHERE politician_id = v_pol.id
     FOR UPDATE;
    IF v_race.politician_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_active_race');
    END IF;
    IF v_race.endorsement_outcome IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'endorsement_already_used',
            'outcome', v_race.endorsement_outcome);
    END IF;

    v_roll  := 1 + floor(random() * 6)::int;
    v_total := v_roll + COALESCE(v_pol.politician_reputation, 0);
    v_next  := v_tick + 1;

    UPDATE factions
       SET next_member_action_tick = v_next
     WHERE id = v_pol.id;

    IF v_total >= SUCCESS_THRESHOLD THEN
        v_outcome  := 'endorsed';
        v_und_take := LEAST(SUCCESS_BONUS, v_race.polling_undecided_pct);
        v_opp_take := SUCCESS_BONUS - v_und_take;
        UPDATE politician_active_election
           SET polling_you_pct       = LEAST(100, polling_you_pct + SUCCESS_BONUS),
               polling_undecided_pct = polling_undecided_pct - v_und_take,
               polling_opp_pct       = GREATEST(0, polling_opp_pct - v_opp_take),
               endorsement_outcome   = 'endorsed'
         WHERE politician_id = v_pol.id;

        RETURN jsonb_build_object(
            'success',                 true,
            'action',                  'request_endorsement',
            'roll',                    v_roll,
            'reputation',              COALESCE(v_pol.politician_reputation, 0),
            'total',                   v_total,
            'outcome',                 'endorsed',
            'polling_delta',           SUCCESS_BONUS,
            'next_member_action_tick', v_next
        );
    ELSE
        v_outcome := 'rejected';
        v_penalty := 1 + floor(random() * 3)::int;   -- 1d3
        v_loss    := LEAST(v_penalty, v_race.polling_you_pct);
        UPDATE politician_active_election
           SET polling_you_pct       = polling_you_pct - v_loss,
               polling_undecided_pct = polling_undecided_pct + v_loss,
               endorsement_outcome   = 'rejected'
         WHERE politician_id = v_pol.id;

        RETURN jsonb_build_object(
            'success',                 true,
            'action',                  'request_endorsement',
            'roll',                    v_roll,
            'reputation',              COALESCE(v_pol.politician_reputation, 0),
            'total',                   v_total,
            'outcome',                 'rejected',
            'polling_delta',           -v_loss,
            'penalty_roll',            v_penalty,
            'next_member_action_tick', v_next
        );
    END IF;
END;
$$;

-- ── 7. GRANTs ──────────────────────────────────────────────────────
-- politician_door_knock + politician_give_speech inherit existing
-- GRANTs from prior migrations (function bodies replaced; signatures
-- unchanged, so GRANT TO authenticated stays in effect).
REVOKE EXECUTE ON FUNCTION public.politician_run_political_ads(uuid)    FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.politician_run_political_ads(uuid)    TO authenticated;

REVOKE EXECUTE ON FUNCTION public.politician_campaign_rally(uuid)       FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.politician_campaign_rally(uuid)       TO authenticated;

REVOKE EXECUTE ON FUNCTION public.politician_request_endorsement(uuid)  FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.politician_request_endorsement(uuid)  TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
