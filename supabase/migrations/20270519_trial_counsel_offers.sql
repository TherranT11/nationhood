-- ════════════════════════════════════════════════════════════════════
-- 20270519 — Trial counsel offers: corp-side OFFER → owner accepts
--
-- Player feedback: when a pre-trial has a corp on the open side
-- (e.g., GOLI CONSTRUCTIONS as defendant), two things should happen:
--   • The corp's entrepreneur owner sees a Pressing Issues card
--     telling them their corp needs counsel.
--   • Advocates in the nation see the case in their Pressing Issues
--     and can OFFER to represent (instead of the direct REPRESENT
--     claim used for person-party cases).
--
-- Person-party cases stay direct-claim — there's no real player to
-- accept on a person party's behalf. Corp cases route through the
-- corp owner.
--
-- This migration ships:
--   • trial_counsel_offers table (advocate → trial pending offers).
--   • offer_trial_counsel(p_faction_id, p_trial_id) — advocate
--     creates a pending offer for the trial's open corp-party side.
--   • accept_trial_counsel_offer(p_owner_faction_id, p_offer_id) —
--     corp owner accepts an advocate's offer; fills the trial side,
--     deals beats, flips to in_progress, drops the took_case career
--     event, declines all OTHER pending offers for the same trial.
--   • decline_trial_counsel_offer(p_owner_faction_id, p_offer_id) —
--     owner says no to one offer; other pending offers stay live.
--   • list_corp_trial_alerts_for_owner(p_faction_id) — returns
--     pre-trial trials where one of the caller's corps is the open
--     side, each with the trial's pending advocate offers inline so
--     the dashboard card can render an Accept / Decline row per
--     offer without a second round-trip.
--   • list_pretrial_cases_for_advocate broadened to flag corp-side
--     cases (open_party_type = 'corporation') and surface whether
--     the advocate already has a pending offer for that case
--     (offer_status). The client uses these to pick OFFER TO
--     REPRESENT vs REPRESENT and to disable already-offered rows.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE TABLE IF NOT EXISTS public.trial_counsel_offers (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    trial_id     uuid NOT NULL REFERENCES public.court_case_trials(id) ON DELETE CASCADE,
    advocate_id  uuid NOT NULL REFERENCES public.factions(id) ON DELETE CASCADE,
    side         text NOT NULL CHECK (side IN ('plaintiff', 'defendant')),
    status       text NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'accepted', 'declined', 'withdrawn')),
    initiated_at timestamptz NOT NULL DEFAULT now(),
    resolved_at  timestamptz,
    UNIQUE (trial_id, advocate_id)
);

CREATE INDEX IF NOT EXISTS idx_trial_counsel_offers_trial_status
    ON public.trial_counsel_offers (trial_id, status);
CREATE INDEX IF NOT EXISTS idx_trial_counsel_offers_advocate
    ON public.trial_counsel_offers (advocate_id, status);

ALTER TABLE public.trial_counsel_offers ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.trial_counsel_offers IS
    'Advocate-to-trial offers (advocate volunteers to be counsel for a specific case). UNIQUE(trial_id, advocate_id) means an advocate can offer to a given trial at most once. Owner accepts/declines via accept_trial_counsel_offer / decline_trial_counsel_offer.';

-- ── Helper: find the owner of a corp by name + nation ───────────────
-- Names are not strictly unique across the corp table, but combined
-- with hq_nation_id they're practically unique in the game. Returns
-- the corp's owner_faction_id (or NULL).
CREATE OR REPLACE FUNCTION public._corp_owner_for_party(p_name text, p_nation_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT c.owner_faction_id
      FROM public.entrepreneur_corps c
     WHERE c.name = p_name
       AND c.hq_nation_id = p_nation_id
     ORDER BY c.id LIMIT 1;
$$;

-- ── offer_trial_counsel ────────────────────────────────────────────
-- Advocate in the trial's nation creates a pending offer for the
-- trial's open side. Only valid when the open side's party type on
-- the underlying draft is 'corporation' (person-party cases stay
-- direct-claim via represent_pretrial).
CREATE OR REPLACE FUNCTION public.offer_trial_counsel(
    p_faction_id uuid,
    p_trial_id   uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid           uuid := auth.uid();
    v_pol           factions%ROWTYPE;
    v_trial         court_case_trials%ROWTYPE;
    v_draft         court_case_drafts%ROWTYPE;
    v_open_side     text;
    v_open_type     text;
    v_offer_id      uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL OR p_trial_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    SELECT * INTO v_pol FROM public.factions
     WHERE id = p_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.bar_admitted_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_advocate');
    END IF;

    SELECT * INTO v_trial FROM public.court_case_trials WHERE id = p_trial_id;
    IF v_trial.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'trial_not_found');
    END IF;
    IF v_trial.status <> 'pre_trial' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'trial_not_pretrial');
    END IF;
    IF v_trial.nation_id <> v_pol.bar_admitted_nation_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_mismatch');
    END IF;

    IF v_trial.plaintiff_advocate_id IS NULL THEN
        v_open_side := 'plaintiff';
    ELSIF v_trial.defendant_advocate_id IS NULL THEN
        v_open_side := 'defendant';
    ELSE
        RETURN jsonb_build_object('success', false, 'reason', 'both_sides_filled');
    END IF;

    -- Only corp-side cases route through offers. Person-side cases
    -- are handled by represent_pretrial (direct claim).
    SELECT * INTO v_draft FROM public.court_case_drafts WHERE id = v_trial.case_draft_id;
    v_open_type := CASE WHEN v_open_side = 'plaintiff'
                          THEN v_draft.plaintiff_party_type
                        ELSE v_draft.defendant_party_type END;
    IF v_open_type <> 'corporation' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'open_side_not_corp');
    END IF;

    -- Don't let an advocate offer for a case they've already responded
    -- to (accepted, declined, refused) via the attempts log.
    IF EXISTS (
        SELECT 1 FROM public.politician_court_case_attempts
         WHERE politician_id = v_pol.id AND case_id = v_trial.case_draft_id
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_decided');
    END IF;

    INSERT INTO public.trial_counsel_offers (trial_id, advocate_id, side)
    VALUES (p_trial_id, v_pol.id, v_open_side)
    ON CONFLICT (trial_id, advocate_id) DO NOTHING
    RETURNING id INTO v_offer_id;
    IF v_offer_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_offered');
    END IF;

    RETURN jsonb_build_object(
        'success',  true,
        'offer_id', v_offer_id,
        'trial_id', p_trial_id,
        'side',     v_open_side
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.offer_trial_counsel(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.offer_trial_counsel(uuid, uuid) TO authenticated;

-- ── accept_trial_counsel_offer ─────────────────────────────────────
-- Corp owner accepts: fills the trial's open side with the
-- offering advocate, deals beats, flips status to in_progress, drops
-- the took_case career event, declines all OTHER pending offers for
-- the same trial. Mirrors the represent_pretrial body from 20270518
-- for the dealing + judge_name picking.
CREATE OR REPLACE FUNCTION public.accept_trial_counsel_offer(
    p_owner_faction_id uuid,
    p_offer_id         uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid           uuid := auth.uid();
    v_owner         factions%ROWTYPE;
    v_offer         trial_counsel_offers%ROWTYPE;
    v_trial         court_case_trials%ROWTYPE;
    v_advocate      factions%ROWTYPE;
    v_draft         court_case_drafts%ROWTYPE;
    v_nation        nations%ROWTYPE;
    v_open_side     text;
    v_tick          int;
    v_corp_owner    uuid;
    v_last_pool     text[];
    v_last_len      int;
    v_judge         text;
    v_party_name    text;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_owner_faction_id IS NULL OR p_offer_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    SELECT * INTO v_owner FROM public.factions
     WHERE id = p_owner_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
     FOR UPDATE;
    IF v_owner.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;

    SELECT * INTO v_offer FROM public.trial_counsel_offers
     WHERE id = p_offer_id FOR UPDATE;
    IF v_offer.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'offer_not_found');
    END IF;
    IF v_offer.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'offer_not_pending');
    END IF;

    SELECT * INTO v_trial FROM public.court_case_trials
     WHERE id = v_offer.trial_id FOR UPDATE;
    IF v_trial.id IS NULL OR v_trial.status <> 'pre_trial' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'trial_not_pretrial');
    END IF;

    -- Verify the offered side matches what's still open AND that the
    -- party on that side is a corp owned by the caller.
    IF v_offer.side = 'plaintiff' THEN
        IF v_trial.plaintiff_advocate_id IS NOT NULL THEN
            RETURN jsonb_build_object('success', false, 'reason', 'side_taken');
        END IF;
        v_party_name := v_trial.plaintiff_name;
    ELSE
        IF v_trial.defendant_advocate_id IS NOT NULL THEN
            RETURN jsonb_build_object('success', false, 'reason', 'side_taken');
        END IF;
        v_party_name := v_trial.defendant_name;
    END IF;

    v_corp_owner := public._corp_owner_for_party(v_party_name, v_trial.nation_id);
    IF v_corp_owner IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp_owner <> p_owner_faction_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_corp_owner');
    END IF;

    SELECT * INTO v_advocate FROM public.factions
     WHERE id = v_offer.advocate_id FOR UPDATE;
    IF v_advocate.id IS NULL OR v_advocate.bar_admitted_nation_id IS NULL
       OR v_advocate.abandoned_at IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'advocate_unavailable');
    END IF;

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;
    IF v_trial.pre_trial_expires_at_tick < v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'pre_trial_expired');
    END IF;

    -- Same judge-pick as represent_pretrial: hyphenated pair from
    -- the nation's last_name_pool; NULL fallback if no pool.
    SELECT * INTO v_nation FROM public.nations WHERE id = v_trial.nation_id;
    v_last_pool := COALESCE(v_nation.last_name_pool, ARRAY[]::text[]);
    v_last_len  := COALESCE(array_length(v_last_pool, 1), 0);
    IF v_last_len >= 2 THEN
        v_judge := v_last_pool[1 + floor(random() * v_last_len)::int]
                || '-' ||
                   v_last_pool[1 + floor(random() * v_last_len)::int];
    ELSIF v_last_len = 1 THEN
        v_judge := v_last_pool[1];
    ELSE
        v_judge := NULL;
    END IF;

    -- Log the advocate's attempts row so they can't re-draw this case.
    INSERT INTO public.politician_court_case_attempts (politician_id, case_id, decision)
    VALUES (v_advocate.id, v_trial.case_draft_id,
            CASE WHEN v_offer.side = 'plaintiff'
                   THEN 'representing_plaintiff'
                 ELSE 'representing_defendant' END)
    ON CONFLICT (politician_id, case_id) DO NOTHING;

    -- Fill the open slot and flip status.
    IF v_offer.side = 'plaintiff' THEN
        UPDATE public.court_case_trials
           SET plaintiff_advocate_id = v_advocate.id,
               status                = 'in_progress',
               matched_at_tick       = v_tick,
               current_round         = 1,
               current_turn          = 'plaintiff',
               judge_name            = v_judge
         WHERE id = v_trial.id;
    ELSE
        UPDATE public.court_case_trials
           SET defendant_advocate_id = v_advocate.id,
               status                = 'in_progress',
               matched_at_tick       = v_tick,
               current_round         = 1,
               current_turn          = 'plaintiff',
               judge_name            = v_judge
         WHERE id = v_trial.id;
    END IF;

    -- Deal 5/5 beats.
    INSERT INTO public.court_case_trial_hands (trial_id, side, beat_index)
    SELECT
        v_trial.id,
        CASE WHEN rn <= 5 THEN 'plaintiff' ELSE 'defendant' END,
        i
      FROM (
        SELECT i, row_number() OVER (ORDER BY random()) AS rn
          FROM generate_series(0, 9) AS i
      ) shuffled;

    -- Mark the accepted offer + decline all other pending offers
    -- for this trial (side is now filled, they can't be accepted).
    UPDATE public.trial_counsel_offers
       SET status = 'accepted', resolved_at = now()
     WHERE id = p_offer_id;
    UPDATE public.trial_counsel_offers
       SET status = 'declined', resolved_at = now()
     WHERE trial_id = v_trial.id
       AND id <> p_offer_id
       AND status = 'pending';

    -- Career event for the advocate that just got the case.
    INSERT INTO public.politician_career_events (
        faction_id, event_tick, event_type, target_name, metadata
    ) VALUES (
        v_advocate.id, v_tick, 'took_case',
        v_trial.plaintiff_name || ' v. ' || v_trial.defendant_name,
        jsonb_build_object('side', v_offer.side)
    );

    RETURN jsonb_build_object(
        'success',     true,
        'trial_id',    v_trial.id,
        'advocate_id', v_advocate.id,
        'side',        v_offer.side,
        'judge_name',  v_judge
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.accept_trial_counsel_offer(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.accept_trial_counsel_offer(uuid, uuid) TO authenticated;

-- ── decline_trial_counsel_offer ────────────────────────────────────
-- Owner says no to one offer. Other pending offers stay live so the
-- owner can still pick someone else. The advocate's attempts row is
-- inserted here as 'refused' (so they can't draw this case via the
-- normal flow — the case is "past them" once the owner declines).
CREATE OR REPLACE FUNCTION public.decline_trial_counsel_offer(
    p_owner_faction_id uuid,
    p_offer_id         uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid        uuid := auth.uid();
    v_owner      factions%ROWTYPE;
    v_offer      trial_counsel_offers%ROWTYPE;
    v_trial      court_case_trials%ROWTYPE;
    v_corp_owner uuid;
    v_party_name text;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_owner_faction_id IS NULL OR p_offer_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    SELECT * INTO v_owner FROM public.factions
     WHERE id = p_owner_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'entrepreneur'
       AND abandoned_at IS NULL;
    IF v_owner.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;

    SELECT * INTO v_offer FROM public.trial_counsel_offers
     WHERE id = p_offer_id FOR UPDATE;
    IF v_offer.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'offer_not_found');
    END IF;
    IF v_offer.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'offer_not_pending');
    END IF;

    SELECT * INTO v_trial FROM public.court_case_trials WHERE id = v_offer.trial_id;
    v_party_name := CASE WHEN v_offer.side = 'plaintiff'
                           THEN v_trial.plaintiff_name
                         ELSE v_trial.defendant_name END;
    v_corp_owner := public._corp_owner_for_party(v_party_name, v_trial.nation_id);
    IF v_corp_owner <> p_owner_faction_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_corp_owner');
    END IF;

    UPDATE public.trial_counsel_offers
       SET status = 'declined', resolved_at = now()
     WHERE id = p_offer_id;

    INSERT INTO public.politician_court_case_attempts (politician_id, case_id, decision)
    VALUES (v_offer.advocate_id, v_trial.case_draft_id, 'refused')
    ON CONFLICT (politician_id, case_id) DO NOTHING;

    RETURN jsonb_build_object(
        'success',  true,
        'offer_id', p_offer_id
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.decline_trial_counsel_offer(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.decline_trial_counsel_offer(uuid, uuid) TO authenticated;

-- ── list_corp_trial_alerts_for_owner ───────────────────────────────
-- Returns one row per pre-trial trial where one of the caller's
-- corps is the open party (i.e., needs counsel). Inline embeds the
-- list of pending advocate offers + their stats so the dashboard
-- card can render Accept / Decline per offer without a second hop.
CREATE OR REPLACE FUNCTION public.list_corp_trial_alerts_for_owner(p_faction_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_owner   factions%ROWTYPE;
    v_alerts  jsonb;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    SELECT * INTO v_owner FROM public.factions
     WHERE id = p_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'entrepreneur'
       AND abandoned_at IS NULL;
    IF v_owner.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;

    -- For each pre-trial where one of the caller's corps is the open
    -- party, gather: trial info + corp + side info + the open side's
    -- pending advocate offers (with stats).
    WITH owner_corps AS (
        SELECT c.id, c.name, c.hq_nation_id
          FROM public.entrepreneur_corps c
         WHERE c.owner_faction_id = v_owner.id
    ),
    matches AS (
        SELECT
            t.id AS trial_id,
            t.case_draft_id,
            t.plaintiff_name,
            t.defendant_name,
            t.pre_trial_expires_at_tick,
            d.case_type,
            d.litigation_type,
            d.plaintiff_party_type,
            d.defendant_party_type,
            CASE WHEN t.plaintiff_advocate_id IS NULL THEN 'plaintiff' ELSE 'defendant' END AS open_side,
            oc_p.name AS plaintiff_corp_name,
            oc_d.name AS defendant_corp_name
          FROM public.court_case_trials t
          JOIN public.court_case_drafts d ON d.id = t.case_draft_id
          LEFT JOIN owner_corps oc_p
                 ON d.plaintiff_party_type = 'corporation'
                AND oc_p.hq_nation_id = t.nation_id
                AND oc_p.name = t.plaintiff_name
          LEFT JOIN owner_corps oc_d
                 ON d.defendant_party_type = 'corporation'
                AND oc_d.hq_nation_id = t.nation_id
                AND oc_d.name = t.defendant_name
         WHERE t.status = 'pre_trial'
           AND (
                (t.plaintiff_advocate_id IS NULL AND oc_p.id IS NOT NULL)
             OR (t.defendant_advocate_id IS NULL AND oc_d.id IS NOT NULL)
           )
    )
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'trial_id',                  m.trial_id,
        'case_id',                   m.case_draft_id,
        'case_type',                 m.case_type,
        'litigation_type',           m.litigation_type,
        'plaintiff_name',            m.plaintiff_name,
        'defendant_name',            m.defendant_name,
        'open_side',                 m.open_side,
        'corp_name',                 CASE WHEN m.open_side = 'plaintiff'
                                            THEN m.plaintiff_corp_name
                                          ELSE m.defendant_corp_name END,
        'pre_trial_expires_at_tick', m.pre_trial_expires_at_tick,
        'offers', (
            SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'offer_id',     o.id,
                'advocate_id',  o.advocate_id,
                'advocate_name', btrim(COALESCE(f.leader_first_name, '') || ' ' || COALESCE(f.leader_last_name, '')),
                'standing',     f.politician_standing,
                'credibility',  f.politician_credibility,
                'reputation',   f.politician_reputation,
                'initiated_at', o.initiated_at
            ) ORDER BY o.initiated_at ASC), '[]'::jsonb)
              FROM public.trial_counsel_offers o
              JOIN public.factions f ON f.id = o.advocate_id
             WHERE o.trial_id = m.trial_id
               AND o.status = 'pending'
        )
    ) ORDER BY m.pre_trial_expires_at_tick ASC), '[]'::jsonb)
      INTO v_alerts
      FROM matches m;

    RETURN jsonb_build_object('success', true, 'alerts', v_alerts);
END $$;

REVOKE EXECUTE ON FUNCTION public.list_corp_trial_alerts_for_owner(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.list_corp_trial_alerts_for_owner(uuid) TO authenticated;

-- ── list_pretrial_cases_for_advocate — flag corp-side cases ────────
-- Adds open_party_type + offer_status to the existing payload so the
-- advocate's Pressing Issues card can switch between OFFER TO
-- REPRESENT (corp open side) and REPRESENT (person open side), and
-- can render an "OFFER SENT" pill on already-offered rows.
CREATE OR REPLACE FUNCTION public.list_pretrial_cases_for_advocate(p_faction_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid      uuid := auth.uid();
    v_pol      factions%ROWTYPE;
    v_tick     int;
    v_pretrial jsonb;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    SELECT * INTO v_pol FROM public.factions
     WHERE id = p_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.bar_admitted_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', true, 'pretrials', '[]'::jsonb);
    END IF;

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'trial_id',        t.id,
        'case_id',         t.case_draft_id,
        'case_type',       d.case_type,
        'litigation_type', d.litigation_type,
        'plaintiff_name',  t.plaintiff_name,
        'defendant_name',  t.defendant_name,
        'open_side',       CASE WHEN t.plaintiff_advocate_id IS NULL THEN 'plaintiff' ELSE 'defendant' END,
        'open_party_type', CASE WHEN t.plaintiff_advocate_id IS NULL
                                  THEN d.plaintiff_party_type
                                ELSE d.defendant_party_type END,
        'expires_at_tick', t.pre_trial_expires_at_tick,
        'ticks_remaining', t.pre_trial_expires_at_tick - v_tick,
        'offer_status',    o.status
    ) ORDER BY t.pre_trial_started_at_tick ASC), '[]'::jsonb)
      INTO v_pretrial
      FROM public.court_case_trials t
      JOIN public.court_case_drafts d ON d.id = t.case_draft_id
      LEFT JOIN public.trial_counsel_offers o
             ON o.trial_id = t.id AND o.advocate_id = v_pol.id
     WHERE t.nation_id = v_pol.bar_admitted_nation_id
       AND t.status = 'pre_trial'
       AND t.pre_trial_expires_at_tick >= v_tick
       AND (t.plaintiff_advocate_id IS NULL OR t.defendant_advocate_id IS NULL)
       -- Filter out cases the advocate has already attempted in the
       -- normal flow (refused, accepted via represent_drawn_case,
       -- etc.); offered ones stay visible with offer_status set.
       AND NOT EXISTS (
           SELECT 1 FROM public.politician_court_case_attempts a
            WHERE a.politician_id = v_pol.id
              AND a.case_id       = t.case_draft_id
       );

    RETURN jsonb_build_object('success', true, 'pretrials', v_pretrial);
END $$;

REVOKE EXECUTE ON FUNCTION public.list_pretrial_cases_for_advocate(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.list_pretrial_cases_for_advocate(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
