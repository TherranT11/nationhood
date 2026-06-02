-- ════════════════════════════════════════════════════════════════════
-- 20270520 — TRY A CASE: three cooldowns
--
-- Spec:
--   1. TRY A CASE is on a 3-tick cooldown per advocate.
--   2. A case used in a nation goes on a 12-tick cooldown for that
--      nation (can't be drawn again in that nation until expired).
--   3. A player party (corporation owner = entrepreneur, and in the
--      future politicians) can't be hit by a case for 60 ticks
--      after being a party in any trial.
--
-- Implementation:
--   • factions.try_case_cooldown_until_tick — set by draw_court_case
--     on a successful draw (current_tick + 3). The advocate variant
--     reads this via the existing cooldownColumn mechanism.
--   • factions.party_cooldown_until_tick — set by represent_drawn_case
--     on the corp's OWNER entrepreneur faction when their corp
--     becomes a party (current_tick + 60). Owner-level (not per-corp)
--     so an entrepreneur's OTHER corps are also shielded for 60 ticks
--     — matches the spec wording "cannot hit a CORPORATION,
--     ENTREPRENEUR or POLITICIAN".
--   • court_case_nation_cooldowns(case_draft_id, nation_id,
--     cooldown_until_tick) — set by represent_drawn_case when the
--     trial is created (current_tick + 12). draw_court_case filters
--     against this so the same case can't run in the same nation
--     back-to-back.
--
-- draw_court_case applies all three filters BEFORE the random pick
-- AND stamps the advocate's draw cooldown on success.
-- represent_drawn_case (the commit step) stamps the case-in-nation
-- + party cooldowns at trial-creation time.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Cooldown columns ────────────────────────────────────────────
ALTER TABLE public.factions
    ADD COLUMN IF NOT EXISTS try_case_cooldown_until_tick int,
    ADD COLUMN IF NOT EXISTS party_cooldown_until_tick    int;

COMMENT ON COLUMN public.factions.try_case_cooldown_until_tick IS
    'Advocate TRY A CASE cooldown: tick at which they can draw again. Set by draw_court_case = current_tick + 3 on success. NULL = no cooldown.';

COMMENT ON COLUMN public.factions.party_cooldown_until_tick IS
    'Player-party cooldown: tick at which any corp owned by this entrepreneur (or this politician, when politicians can be parties) can next appear as a case party. Set by represent_drawn_case = current_tick + 60 when their corp becomes a party. NULL = no cooldown.';

-- ── 2. Per-nation case cooldowns ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.court_case_nation_cooldowns (
    case_draft_id        uuid NOT NULL REFERENCES public.court_case_drafts(id) ON DELETE CASCADE,
    nation_id            uuid NOT NULL REFERENCES public.nations(id),
    cooldown_until_tick  int  NOT NULL,
    PRIMARY KEY (case_draft_id, nation_id)
);

CREATE INDEX IF NOT EXISTS idx_court_case_nation_cooldowns_active
    ON public.court_case_nation_cooldowns (nation_id, cooldown_until_tick);

ALTER TABLE public.court_case_nation_cooldowns ENABLE ROW LEVEL SECURITY;

-- ── 3. draw_court_case — three filters + cooldown stamp ────────────
-- Filters now exclude:
--   • cases with an active nation cooldown
--   • corps whose owner has an active party cooldown
-- Advocate cooldown is checked up front; on a successful draw the
-- advocate's cooldown is bumped to current_tick + 3 BEFORE returning
-- so a refresh of the modal can't re-roll the same tick.
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
    v_tick         int;
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
       AND abandoned_at IS NULL
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.bar_admitted_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_advocate');
    END IF;

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- Advocate TRY A CASE cooldown.
    IF v_pol.try_case_cooldown_until_tick IS NOT NULL
       AND v_pol.try_case_cooldown_until_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.try_case_cooldown_until_tick);
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
           AND NOT EXISTS (
               SELECT 1 FROM public.court_case_trials t
                WHERE t.case_draft_id = d.id
                  AND t.status IN ('pre_trial', 'in_progress')
           )
           -- 12-tick nation cooldown — exclude cases recently used here.
           AND NOT EXISTS (
               SELECT 1 FROM public.court_case_nation_cooldowns nc
                WHERE nc.case_draft_id      = d.id
                  AND nc.nation_id          = v_nation.id
                  AND nc.cooldown_until_tick > v_tick
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
            -- Corp pick excludes corps whose OWNER entrepreneur is in
            -- the 60-tick party cooldown — they're shielded.
            SELECT c.name INTO v_corp_name FROM public.entrepreneur_corps c
             JOIN public.factions owner ON owner.id = c.owner_faction_id
             WHERE c.industry = v_industry
               AND EXISTS (
                   SELECT 1 FROM public.corp_buildings b
                    WHERE b.owner_corp_id = c.id
                      AND b.nation_id     = v_nation.id
                      AND b.status        = 'completed'
               )
               AND (owner.party_cooldown_until_tick IS NULL
                    OR owner.party_cooldown_until_tick <= v_tick)
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
             JOIN public.factions owner ON owner.id = c.owner_faction_id
             WHERE c.industry = v_industry
               AND EXISTS (
                   SELECT 1 FROM public.corp_buildings b
                    WHERE b.owner_corp_id = c.id
                      AND b.nation_id     = v_nation.id
                      AND b.status        = 'completed'
               )
               AND (owner.party_cooldown_until_tick IS NULL
                    OR owner.party_cooldown_until_tick <= v_tick)
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

        -- Successful draw — stamp the advocate's 3-tick TRY A CASE
        -- cooldown so a refresh can't re-roll within the same tick.
        UPDATE public.factions
           SET try_case_cooldown_until_tick = v_tick + 3
         WHERE id = v_pol.id;

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
            'defendant_rep_on_win',   round(v_p_sum::numeric / 10.0, 1),
            'cooldown_until_tick',    v_tick + 3
        );
    END LOOP;

    RETURN jsonb_build_object('success', false, 'reason', 'no_viable_case');
END $$;

REVOKE EXECUTE ON FUNCTION public.draw_court_case(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.draw_court_case(uuid) TO authenticated;

-- ── 4. represent_drawn_case — stamp case-nation + party cooldowns ─
-- Otherwise unchanged from 20270518; the only new behaviour is the
-- two cooldown UPSERTs after the trial row is created.
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
    v_uid           uuid := auth.uid();
    v_pol           factions%ROWTYPE;
    v_case_status   text;
    v_case          court_case_drafts%ROWTYPE;
    v_decision      text;
    v_inserted      int;
    v_tick          int;
    v_trial_id      uuid;
    v_p_name_clean  text;
    v_d_name_clean  text;
    v_p_owner_id    uuid;
    v_d_owner_id    uuid;
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
    v_p_name_clean := btrim(COALESCE(p_plaintiff_name, ''));
    v_d_name_clean := btrim(COALESCE(p_defendant_name, ''));
    IF v_p_name_clean = '' OR v_d_name_clean = '' THEN
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

    SELECT * INTO v_case FROM public.court_case_drafts WHERE id = p_case_id;
    IF v_case.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'case_not_found');
    END IF;
    IF v_case.status <> 'approved' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'case_not_approved');
    END IF;

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;

    v_decision := CASE WHEN p_side = 'plaintiff'
                         THEN 'representing_plaintiff'
                       ELSE 'representing_defendant' END;

    -- Attempts INSERT lives INSIDE the BEGIN/EXCEPTION so it rolls
    -- back with the trial INSERT on the partial-UNIQUE race — without
    -- this, a race-loser would be stuck with an attempts row but no
    -- trial and could never re-attempt this case.
    BEGIN
        INSERT INTO public.politician_court_case_attempts (politician_id, case_id, decision)
        VALUES (v_pol.id, p_case_id, v_decision)
        ON CONFLICT (politician_id, case_id) DO NOTHING;
        GET DIAGNOSTICS v_inserted = ROW_COUNT;
        IF v_inserted = 0 THEN
            RETURN jsonb_build_object('success', false, 'reason', 'already_decided');
        END IF;

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
            v_p_name_clean, v_d_name_clean,
            'pre_trial',
            v_tick, v_tick + 3
        ) RETURNING id INTO v_trial_id;
    EXCEPTION
        WHEN unique_violation THEN
            RETURN jsonb_build_object('success', false, 'reason', 'case_in_trial');
    END;

    INSERT INTO public.politician_career_events (
        faction_id, event_tick, event_type, target_name, metadata
    ) VALUES (
        v_pol.id, v_tick, 'took_case',
        v_p_name_clean || ' v. ' || v_d_name_clean,
        jsonb_build_object('side', p_side)
    );

    -- 12-tick nation cooldown for this case.
    INSERT INTO public.court_case_nation_cooldowns
        (case_draft_id, nation_id, cooldown_until_tick)
    VALUES (p_case_id, v_pol.bar_admitted_nation_id, v_tick + 12)
    ON CONFLICT (case_draft_id, nation_id) DO UPDATE
       SET cooldown_until_tick = EXCLUDED.cooldown_until_tick;

    -- 60-tick party cooldown on the OWNER entrepreneur(s) of any
    -- corp party. Reuse _corp_owner_for_party (20270519) — same
    -- match strategy the offer flow uses, one source of truth.
    IF v_case.plaintiff_party_type = 'corporation' THEN
        v_p_owner_id := public._corp_owner_for_party(v_p_name_clean, v_pol.bar_admitted_nation_id);
        IF v_p_owner_id IS NOT NULL THEN
            UPDATE public.factions
               SET party_cooldown_until_tick = v_tick + 60
             WHERE id = v_p_owner_id;
        END IF;
    END IF;
    IF v_case.defendant_party_type = 'corporation' THEN
        v_d_owner_id := public._corp_owner_for_party(v_d_name_clean, v_pol.bar_admitted_nation_id);
        IF v_d_owner_id IS NOT NULL THEN
            UPDATE public.factions
               SET party_cooldown_until_tick = v_tick + 60
             WHERE id = v_d_owner_id;
        END IF;
    END IF;

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

NOTIFY pgrst, 'reload schema';

COMMIT;
