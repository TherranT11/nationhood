-- ════════════════════════════════════════════════════════════════════
-- 20270514 — Court Case Trial: pre-trial state + nation broadcast
--
-- Phase 1 of the trial loop. When an advocate represents a side
-- (existing represent_drawn_case path), the case now creates a
-- court_case_trials row in 'pre_trial' status with that side filled.
-- Every other advocate admitted to the same nation sees the pre-trial
-- in their Pressing Issues as a "case looking for [open side]" card
-- and can join via represent_pretrial. When both sides are filled the
-- trial status flips to 'in_progress'; trial UI + beat dealing land in
-- Phase 2.
--
-- pre_trial_expires_at_tick = started_at + 3. Phase 1 doesn't
-- auto-expire (per the no-automation-without-confirmation rule);
-- expired pre-trials simply stop appearing in the broadcast list.
--
-- This migration ships:
--   • court_case_trials table.
--   • draw_court_case re-authored: excludes cases that already have an
--     active pre-trial / in-progress trial, so fresh draws never
--     collide with the matchmaking surface.
--   • represent_drawn_case re-authored: in addition to logging the
--     attempt, creates the pre-trial row with the calling side filled.
--   • list_pretrial_cases_for_advocate(p_faction_id) — broadcast.
--   • represent_pretrial(p_faction_id, p_trial_id) — join an existing
--     pre-trial as the open side. Same advocate-cap (one attempt per
--     case) as the normal draw path.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. court_case_trials ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.court_case_trials (
    id                         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    case_draft_id              uuid NOT NULL REFERENCES public.court_case_drafts(id) ON DELETE CASCADE,
    nation_id                  uuid NOT NULL REFERENCES public.nations(id),
    plaintiff_advocate_id      uuid REFERENCES public.factions(id) ON DELETE SET NULL,
    defendant_advocate_id      uuid REFERENCES public.factions(id) ON DELETE SET NULL,
    plaintiff_name             text NOT NULL,
    defendant_name             text NOT NULL,
    status                     text NOT NULL DEFAULT 'pre_trial'
                                   CHECK (status IN ('pre_trial', 'in_progress', 'resolved', 'settled', 'expired')),
    pre_trial_started_at_tick  int NOT NULL,
    pre_trial_expires_at_tick  int NOT NULL,
    matched_at_tick            int,
    created_at                 timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_court_case_trials_nation_status
    ON public.court_case_trials (nation_id, status);

-- One active pre-trial / in-progress trial per case: prevents parallel
-- trials of the same case template.
CREATE UNIQUE INDEX IF NOT EXISTS idx_court_case_trials_one_active
    ON public.court_case_trials (case_draft_id)
 WHERE status IN ('pre_trial', 'in_progress');

ALTER TABLE public.court_case_trials ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.court_case_trials IS
    'Active trial instances spawned from court_case_drafts. status pre_trial = one side filled and broadcasting in Pressing Issues; in_progress = both sides matched (Phase 2+ trial mechanics).';

-- ── 2. draw_court_case (re-authored) ────────────────────────────────
-- Cases with an active pre-trial / in-progress trial are filtered out
-- of fresh draws — they're surfaced via the pre-trial broadcast
-- instead. Everything else from 20270511 is preserved.
CREATE OR REPLACE FUNCTION public.draw_court_case(p_faction_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_pol          factions%ROWTYPE;
    v_nation       nations%ROWTYPE;
    v_case         court_case_drafts%ROWTYPE;
    v_first_pool   text[];
    v_last_pool    text[];
    v_first_len    int;
    v_last_len     int;
    v_plaintiff    text;
    v_defendant    text;
    v_corp_name    text;
    v_skipped      uuid[] := ARRAY[]::uuid[];
    v_max_tries    int := 20;
    v_tries        int := 0;
    v_industry     text;
    v_p_sum        int;
    v_d_sum        int;
    v_p_count      int;
    v_d_count      int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
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

    SELECT * INTO v_nation FROM public.nations WHERE id = v_pol.nation_id;
    IF v_nation.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_nation');
    END IF;

    v_first_pool := COALESCE(v_nation.first_name_pool, ARRAY[]::text[]);
    v_last_pool  := COALESCE(v_nation.last_name_pool,  ARRAY[]::text[]);
    v_first_len  := COALESCE(array_length(v_first_pool, 1), 0);
    v_last_len   := COALESCE(array_length(v_last_pool,  1), 0);
    IF v_first_len = 0 OR v_last_len = 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_name_pool');
    END IF;

    LOOP
        v_tries := v_tries + 1;
        EXIT WHEN v_tries > v_max_tries;

        SELECT * INTO v_case FROM public.court_case_drafts d
         WHERE d.status = 'approved'
           AND NOT (d.id = ANY(v_skipped))
           AND NOT EXISTS (
               SELECT 1 FROM public.politician_court_case_attempts a
                WHERE a.politician_id = v_pol.id
                  AND a.case_id       = d.id
           )
           -- Skip cases with an active pre-trial / in-progress trial.
           -- These are reached via list_pretrial_cases_for_advocate now.
           AND NOT EXISTS (
               SELECT 1 FROM public.court_case_trials t
                WHERE t.case_draft_id = d.id
                  AND t.status IN ('pre_trial', 'in_progress')
           )
         ORDER BY random() LIMIT 1;
        IF v_case.id IS NULL THEN
            RETURN jsonb_build_object('success', false, 'reason', 'no_cases_available');
        END IF;

        v_plaintiff := NULL;
        v_defendant := NULL;

        IF v_case.plaintiff_party_type = 'person' THEN
            v_plaintiff := v_first_pool[1 + floor(random() * v_first_len)::int]
                        || ' '
                        || v_last_pool[1 + floor(random() * v_last_len)::int];
        ELSE
            v_industry := CASE WHEN v_case.plaintiff_corp_type = 'aviation'
                                 THEN 'aviation_manufacturing'
                               ELSE v_case.plaintiff_corp_type END;
            SELECT c.name INTO v_corp_name FROM public.entrepreneur_corps c
             WHERE c.industry = v_industry
               AND EXISTS (
                   SELECT 1 FROM public.corp_buildings b
                    WHERE b.owner_corp_id = c.id
                      AND b.nation_id     = v_nation.id
                      AND b.status        = 'completed'
               )
             ORDER BY random() LIMIT 1;
            IF v_corp_name IS NULL THEN
                v_skipped := array_append(v_skipped, v_case.id);
                CONTINUE;
            END IF;
            v_plaintiff := v_corp_name;
        END IF;

        IF v_case.defendant_party_type = 'person' THEN
            v_defendant := v_first_pool[1 + floor(random() * v_first_len)::int]
                        || ' '
                        || v_last_pool[1 + floor(random() * v_last_len)::int];
        ELSE
            v_industry := CASE WHEN v_case.defendant_corp_type = 'aviation'
                                 THEN 'aviation_manufacturing'
                               ELSE v_case.defendant_corp_type END;
            SELECT c.name INTO v_corp_name FROM public.entrepreneur_corps c
             WHERE c.industry = v_industry
               AND EXISTS (
                   SELECT 1 FROM public.corp_buildings b
                    WHERE b.owner_corp_id = c.id
                      AND b.nation_id     = v_nation.id
                      AND b.status        = 'completed'
               )
             ORDER BY random() LIMIT 1;
            IF v_corp_name IS NULL THEN
                v_skipped := array_append(v_skipped, v_case.id);
                CONTINUE;
            END IF;
            v_defendant := v_corp_name;
        END IF;

        SELECT
            COALESCE(sum(CASE WHEN b.support = 'plaintiff' THEN b.strength END), 0),
            COALESCE(sum(CASE WHEN b.support = 'defendant' THEN b.strength END), 0),
            COALESCE(count(*) FILTER (WHERE b.support = 'plaintiff'), 0),
            COALESCE(count(*) FILTER (WHERE b.support = 'defendant'), 0)
          INTO v_p_sum, v_d_sum, v_p_count, v_d_count
          FROM (
            SELECT
                elem ->> 'support' AS support,
                COALESCE((elem ->> 'strength')::int, 0) AS strength
              FROM jsonb_array_elements(v_case.beats) elem
          ) b;

        RETURN jsonb_build_object(
            'success',                true,
            'case_id',                v_case.id,
            'case_type',              v_case.case_type,
            'litigation_type',        v_case.litigation_type,
            'overview',               v_case.overview,
            'plaintiff_name',         v_plaintiff,
            'plaintiff_party_type',   v_case.plaintiff_party_type,
            'plaintiff_corp_type',    v_case.plaintiff_corp_type,
            'plaintiff_strength_sum', v_p_sum,
            'plaintiff_beat_count',   v_p_count,
            'plaintiff_rep_on_win',   round(v_d_sum::numeric / 10.0, 1),
            'defendant_name',         v_defendant,
            'defendant_party_type',   v_case.defendant_party_type,
            'defendant_corp_type',    v_case.defendant_corp_type,
            'defendant_strength_sum', v_d_sum,
            'defendant_beat_count',   v_d_count,
            'defendant_rep_on_win',   round(v_p_sum::numeric / 10.0, 1)
        );
    END LOOP;

    RETURN jsonb_build_object('success', false, 'reason', 'no_viable_case');
END $$;

REVOKE EXECUTE ON FUNCTION public.draw_court_case(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.draw_court_case(uuid) TO authenticated;

-- ── 3. represent_drawn_case (re-authored) ───────────────────────────
-- In addition to logging the attempt, this now creates the pre-trial
-- row with the calling side filled. The names + nation_id come from
-- the draw payload the client passes through (same values it just
-- showed in the modal). The pre-trial expires three ticks from the
-- shard's current tick — Phase 1 doesn't enforce expiration in code;
-- expired pre-trials just stop appearing in the broadcast.
DROP FUNCTION IF EXISTS public.represent_drawn_case(uuid, uuid, text);
CREATE OR REPLACE FUNCTION public.represent_drawn_case(
    p_faction_id      uuid,
    p_case_id         uuid,
    p_side            text,
    p_plaintiff_name  text,
    p_defendant_name  text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid         uuid := auth.uid();
    v_pol         factions%ROWTYPE;
    v_case_status text;
    v_decision    text;
    v_inserted    int;
    v_tick        int;
    v_trial_id    uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL OR p_case_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;
    IF p_side NOT IN ('plaintiff', 'defendant') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_side');
    END IF;
    IF COALESCE(btrim(p_plaintiff_name), '') = ''
       OR COALESCE(btrim(p_defendant_name), '') = '' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_party_name');
    END IF;

    SELECT * INTO v_pol FROM public.factions
     WHERE id = p_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.bar_admitted_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_advocate');
    END IF;

    SELECT status INTO v_case_status FROM public.court_case_drafts WHERE id = p_case_id;
    IF v_case_status IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'case_not_found');
    END IF;
    IF v_case_status <> 'approved' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'case_not_approved');
    END IF;

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;

    v_decision := CASE WHEN p_side = 'plaintiff'
                         THEN 'representing_plaintiff'
                       ELSE 'representing_defendant' END;

    INSERT INTO public.politician_court_case_attempts (politician_id, case_id, decision)
    VALUES (v_pol.id, p_case_id, v_decision)
    ON CONFLICT (politician_id, case_id) DO NOTHING;
    GET DIAGNOSTICS v_inserted = ROW_COUNT;
    IF v_inserted = 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_decided');
    END IF;

    -- Create the pre-trial row. The partial unique index on
    -- (case_draft_id) WHERE status IN ('pre_trial','in_progress')
    -- means this can only succeed if no live pre-trial exists for
    -- this case. draw_court_case already excludes such cases, so a
    -- conflict here means someone else opened a pre-trial in the
    -- race window — the entire function transaction rolls back and
    -- the lawyer's attempts row is undone too.
    INSERT INTO public.court_case_trials (
        case_draft_id, nation_id,
        plaintiff_advocate_id, defendant_advocate_id,
        plaintiff_name, defendant_name,
        status,
        pre_trial_started_at_tick, pre_trial_expires_at_tick
    ) VALUES (
        p_case_id, v_pol.bar_admitted_nation_id,
        CASE WHEN p_side = 'plaintiff' THEN v_pol.id ELSE NULL END,
        CASE WHEN p_side = 'defendant' THEN v_pol.id ELSE NULL END,
        btrim(p_plaintiff_name), btrim(p_defendant_name),
        'pre_trial',
        v_tick, v_tick + 3
    ) RETURNING id INTO v_trial_id;

    RETURN jsonb_build_object(
        'success',  true,
        'decision', v_decision,
        'side',     p_side,
        'case_id',  p_case_id,
        'trial_id', v_trial_id,
        'pre_trial_expires_at_tick', v_tick + 3
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.represent_drawn_case(uuid, uuid, text, text, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.represent_drawn_case(uuid, uuid, text, text, text) TO authenticated;

-- ── 4. list_pretrial_cases_for_advocate ─────────────────────────────
-- Surfaces active pre-trials in the advocate's bar nation that they
-- haven't already responded to. Caps the result with the case's
-- public info + which side is still open. Expired pre-trials
-- (pre_trial_expires_at_tick < current_tick) are filtered out so the
-- list stays honest even without a tick-driven sweeper.
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
        'expires_at_tick', t.pre_trial_expires_at_tick,
        'ticks_remaining', t.pre_trial_expires_at_tick - v_tick
    ) ORDER BY t.pre_trial_started_at_tick ASC), '[]'::jsonb)
      INTO v_pretrial
      FROM public.court_case_trials t
      JOIN public.court_case_drafts d ON d.id = t.case_draft_id
     WHERE t.nation_id = v_pol.bar_admitted_nation_id
       AND t.status = 'pre_trial'
       AND t.pre_trial_expires_at_tick >= v_tick
       -- One slot still open.
       AND (t.plaintiff_advocate_id IS NULL OR t.defendant_advocate_id IS NULL)
       -- This advocate hasn't already responded to this case.
       AND NOT EXISTS (
           SELECT 1 FROM public.politician_court_case_attempts a
            WHERE a.politician_id = v_pol.id
              AND a.case_id       = t.case_draft_id
       );

    RETURN jsonb_build_object('success', true, 'pretrials', v_pretrial);
END $$;

REVOKE EXECUTE ON FUNCTION public.list_pretrial_cases_for_advocate(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.list_pretrial_cases_for_advocate(uuid) TO authenticated;

-- ── 5. represent_pretrial ───────────────────────────────────────────
-- Join an existing pre-trial as the open side. The advocate's
-- attempt is logged (so they can't re-draw this case), the trial's
-- open slot is filled, and if both sides are now filled the trial
-- flips to 'in_progress' (Phase 2 wires up the trial UI from there).
CREATE OR REPLACE FUNCTION public.represent_pretrial(
    p_faction_id uuid,
    p_trial_id   uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_trial     court_case_trials%ROWTYPE;
    v_tick      int;
    v_open_side text;
    v_decision  text;
    v_inserted  int;
    v_both      boolean;
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
       AND abandoned_at IS NULL
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.bar_admitted_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_advocate');
    END IF;

    SELECT * INTO v_trial FROM public.court_case_trials
     WHERE id = p_trial_id FOR UPDATE;
    IF v_trial.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'trial_not_found');
    END IF;
    IF v_trial.status <> 'pre_trial' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'trial_not_pretrial');
    END IF;
    IF v_trial.nation_id <> v_pol.bar_admitted_nation_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_mismatch');
    END IF;

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;
    IF v_trial.pre_trial_expires_at_tick < v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'pre_trial_expired');
    END IF;

    IF v_trial.plaintiff_advocate_id IS NULL THEN
        v_open_side := 'plaintiff';
    ELSIF v_trial.defendant_advocate_id IS NULL THEN
        v_open_side := 'defendant';
    ELSE
        RETURN jsonb_build_object('success', false, 'reason', 'both_sides_filled');
    END IF;

    v_decision := CASE WHEN v_open_side = 'plaintiff'
                         THEN 'representing_plaintiff'
                       ELSE 'representing_defendant' END;

    INSERT INTO public.politician_court_case_attempts (politician_id, case_id, decision)
    VALUES (v_pol.id, v_trial.case_draft_id, v_decision)
    ON CONFLICT (politician_id, case_id) DO NOTHING;
    GET DIAGNOSTICS v_inserted = ROW_COUNT;
    IF v_inserted = 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_decided');
    END IF;

    v_both := true;
    IF v_open_side = 'plaintiff' THEN
        UPDATE public.court_case_trials
           SET plaintiff_advocate_id = v_pol.id,
               status                = 'in_progress',
               matched_at_tick       = v_tick
         WHERE id = p_trial_id;
    ELSE
        UPDATE public.court_case_trials
           SET defendant_advocate_id = v_pol.id,
               status                = 'in_progress',
               matched_at_tick       = v_tick
         WHERE id = p_trial_id;
    END IF;

    RETURN jsonb_build_object(
        'success',  true,
        'decision', v_decision,
        'side',     v_open_side,
        'trial_id', p_trial_id,
        'case_id',  v_trial.case_draft_id,
        'trial_status', 'in_progress',
        'matched_at_tick', v_tick
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.represent_pretrial(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.represent_pretrial(uuid, uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
