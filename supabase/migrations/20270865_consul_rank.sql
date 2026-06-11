-- ════════════════════════════════════════════════════════════════════
-- 20270865 — The Consul (Foreign Service tier 2)
--
-- Promotion: a serving Attaché with 12 Experience (politician_skill)
-- takes a VACANT consulate — one consul per home→host nation pair
-- (design ruling). The attaché posting clears; the embassy stats
-- (Budget / Reputation / Trust / Leverage) carry over.
--
-- The mechanic inverts the Attaché's: instead of one drawn incident,
-- [RUN THE CONSULATE] opens the morning DOCKET — up to 2 cases minted
-- from REAL cross-border activity (market entries, plant
-- groundbreakings, cross-border hires, citizens arrested abroad),
-- topped up to 4 from a synthetic catalog. The cases land on the
-- consul's Pressing Issues; HANDLING one properly resolves the
-- docket — every other pending case gets the rubber stamp and its
-- cost lands immediately. Generation is lazy and idempotent (unique
-- (consul, source_kind, source_id)) — no timers, and a nation pair
-- with no player consul never mints anything (design ruling).
--
-- Stamp costs hit the consul's own stats; only genuinely
-- international cases touch diplomatic_relations.relation_score
-- (the existing −100..100 pairwise gauge), via _bump_relation_score.
--
-- [BUILD NETWORK]: −1 Relations, +1 Reputation, +0.3 Experience —
-- spend the nations' relationship to build your standing.
-- [BACKCHANNEL]: a one-time 240-char message to any player faction
-- in the host or home nation. No audit, no trace: no sender id is
-- stored (display name only) and the row DELETES when the recipient
-- burns it. RLS: only the recipient can read it.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.factions
    ADD COLUMN IF NOT EXISTS politician_consul_nation_id uuid,
    ADD COLUMN IF NOT EXISTS politician_consul_at_tick   int,
    ADD COLUMN IF NOT EXISTS next_backchannel_tick       int;

COMMENT ON COLUMN public.factions.politician_consul_nation_id IS
    'The consulate this politician runs (20270865). One consul per home→host pair — the partial unique index below is the structural backstop; abandoning the faction vacates the post.';

-- Two attachés racing for the same vacancy: the EXISTS check alone
-- can't see an uncommitted rival, so the pair rule lives in an index.
CREATE UNIQUE INDEX IF NOT EXISTS factions_one_consul_per_pair
    ON public.factions (nation_id, politician_consul_nation_id)
    WHERE politician_consul_nation_id IS NOT NULL AND abandoned_at IS NULL;

CREATE TABLE IF NOT EXISTS public.consulate_cases (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    consul_faction_id uuid NOT NULL REFERENCES public.factions(id) ON DELETE CASCADE,
    host_nation_id    uuid NOT NULL,
    kind              text NOT NULL,
    title             text NOT NULL,
    body              text NOT NULL DEFAULT '',
    handle_effect     text NOT NULL,
    stamp_effect      text NOT NULL,
    subject_corp_id   uuid,
    source_kind       text,
    source_id         text,
    status            text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'handled', 'stamped')),
    docket_tick       int  NOT NULL,
    created_at        timestamptz NOT NULL DEFAULT now()
);

-- A real-activity source becomes a case exactly once per consul.
CREATE UNIQUE INDEX IF NOT EXISTS consulate_cases_source_once
    ON public.consulate_cases (consul_faction_id, source_kind, source_id)
    WHERE source_kind IS NOT NULL;
CREATE INDEX IF NOT EXISTS consulate_cases_pending_idx
    ON public.consulate_cases (consul_faction_id) WHERE status = 'pending';

ALTER TABLE public.consulate_cases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow select for all" ON public.consulate_cases;
CREATE POLICY "Allow select for all" ON public.consulate_cases
    FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.backchannel_messages (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    to_faction_id   uuid NOT NULL,
    sender_name     text NOT NULL,
    body            text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 240),
    created_at_tick int  NOT NULL,
    created_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.backchannel_messages IS
    'Consul backchannels (20270865). By design there is no sender id and no audit trail — the row is deleted when the recipient burns it. to_faction_id is a plain uuid: faction purges must not trip over it.';

ALTER TABLE public.backchannel_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS backchannel_recipient_select ON public.backchannel_messages;
CREATE POLICY backchannel_recipient_select ON public.backchannel_messages
    FOR SELECT TO authenticated
    USING (to_faction_id IN (SELECT id FROM factions
                              WHERE id = auth.uid() OR linked_user_id = auth.uid()));
-- No insert/update/delete policies — send and burn go through RPCs.

-- ── _bump_relation_score — the one hand on the gauge ──────────────
-- diplomatic_relations rows are keyed (nation_a_id < nation_b_id);
-- the score clamps −100..100. UPDATE-then-INSERT (the legacy table
-- carries no unique constraint we can ON CONFLICT against). KNOWN
-- EDGE: two consuls on the same pair racing the very first bump can
-- mint a duplicate pair row — readers take the first match, so the
-- effect is a lost point, not corruption.
CREATE OR REPLACE FUNCTION public._bump_relation_score(
    p_nation_x uuid, p_nation_y uuid, p_delta numeric
) RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    v_a uuid := LEAST(p_nation_x, p_nation_y);
    v_b uuid := GREATEST(p_nation_x, p_nation_y);
BEGIN
    IF v_a IS NULL OR v_b IS NULL OR v_a = v_b THEN RETURN; END IF;
    UPDATE diplomatic_relations
       SET relation_score = GREATEST(-100, LEAST(100, COALESCE(relation_score, 0) + p_delta)),
           updated_at     = now()
     WHERE nation_a_id = v_a AND nation_b_id = v_b;
    IF NOT FOUND THEN
        INSERT INTO diplomatic_relations (nation_a_id, nation_b_id, relation_score, relation_type)
        VALUES (v_a, v_b, GREATEST(-100, LEAST(100, p_delta)), 'neutral');
    END IF;
END $$;

REVOKE EXECUTE ON FUNCTION public._bump_relation_score(uuid, uuid, numeric) FROM PUBLIC;

-- ── _consul_check — eligibility, the chief-check shape ────────────
CREATE OR REPLACE FUNCTION public._consul_check(p_uid uuid, p_faction_id uuid)
RETURNS factions
LANGUAGE plpgsql
AS $$
DECLARE
    v_fac factions%ROWTYPE;
BEGIN
    SELECT * INTO v_fac FROM factions
     WHERE id = p_faction_id
       AND (id = p_uid OR linked_user_id = p_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     FOR UPDATE;
    IF v_fac.id IS NULL
       OR lower(COALESCE(v_fac.status, '')) = 'arrested'
       OR v_fac.politician_consul_nation_id IS NULL THEN
        RETURN NULL;
    END IF;
    RETURN v_fac;
END $$;

REVOKE EXECUTE ON FUNCTION public._consul_check(uuid, uuid) FROM PUBLIC;

-- ── _apply_consul_effect — every case effect, one home ────────────
CREATE OR REPLACE FUNCTION public._apply_consul_effect(
    p_consul_id uuid, p_home uuid, p_host uuid, p_effect text, p_corp_id uuid
) RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    IF p_effect = 'rep_up' THEN
        UPDATE factions SET embassy_reputation = LEAST(100, COALESCE(embassy_reputation, 50) + 1)
         WHERE id = p_consul_id;
    ELSIF p_effect = 'rep_down' THEN
        UPDATE factions SET embassy_reputation = GREATEST(0, COALESCE(embassy_reputation, 50) - 1)
         WHERE id = p_consul_id;
    ELSIF p_effect = 'rep_down2' THEN
        UPDATE factions SET embassy_reputation = GREATEST(0, COALESCE(embassy_reputation, 50) - 2)
         WHERE id = p_consul_id;
    ELSIF p_effect = 'trust_down' THEN
        UPDATE factions SET embassy_trust = GREATEST(0, COALESCE(embassy_trust, 50) - 1)
         WHERE id = p_consul_id;
    ELSIF p_effect = 'lev_up' THEN
        UPDATE factions SET embassy_leverage = LEAST(100, COALESCE(embassy_leverage, 50) + 1)
         WHERE id = p_consul_id;
    ELSIF p_effect = 'xp_up' THEN
        UPDATE factions SET politician_skill = COALESCE(politician_skill, 0) + 1
         WHERE id = p_consul_id;
    ELSIF p_effect = 'relations_up' THEN
        PERFORM _bump_relation_score(p_home, p_host, 1);
    ELSIF p_effect = 'relations_down' THEN
        PERFORM _bump_relation_score(p_home, p_host, -1);
    ELSIF p_effect = 'trade_boost' THEN
        -- Trade Registration handled properly: +1 Relations AND the
        -- corp's next campaign gets the sharpened pitch — best
        -- effort, the charge may already be primed.
        PERFORM _bump_relation_score(p_home, p_host, 1);
        IF p_corp_id IS NOT NULL THEN
            PERFORM _apply_kit_charge(p_corp_id, 'sharpen_pitch');
        END IF;
    END IF;
END $$;

REVOKE EXECUTE ON FUNCTION public._apply_consul_effect(uuid, uuid, uuid, text, uuid) FROM PUBLIC;

-- ── politician_take_consul_post ───────────────────────────────────
CREATE OR REPLACE FUNCTION public.politician_take_consul_post(
    p_faction_id uuid,
    p_nation_id  uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid    uuid := auth.uid();
    v_pol    factions%ROWTYPE;
    v_nation nations%ROWTYPE;
    v_tick   int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL OR p_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF lower(COALESCE(v_pol.status, '')) = 'arrested' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'arrested');
    END IF;
    IF v_pol.politician_foreign_service_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_attache');
    END IF;
    IF COALESCE(v_pol.politician_skill, 0) < 12 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_enough_experience',
            'need', 12, 'have', COALESCE(v_pol.politician_skill, 0));
    END IF;
    IF p_nation_id = v_pol.nation_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_nation');
    END IF;
    SELECT * INTO v_nation FROM nations
     WHERE id = p_nation_id AND name = ANY (market_nation_names());
    IF v_nation.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_not_live');
    END IF;
    -- One consul per home→host pair.
    IF EXISTS (SELECT 1 FROM factions
                WHERE faction_type = 'politician'
                  AND abandoned_at IS NULL
                  AND nation_id = v_pol.nation_id
                  AND politician_consul_nation_id = p_nation_id) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'consulate_occupied');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    BEGIN
        UPDATE factions
           SET politician_consul_nation_id          = p_nation_id,
               politician_consul_at_tick            = v_tick,
               politician_foreign_service_nation_id = NULL,
               politician_foreign_service_at_tick   = NULL
         WHERE id = v_pol.id;
    EXCEPTION WHEN unique_violation THEN
        -- Lost the race for the vacancy.
        RETURN jsonb_build_object('success', false, 'reason', 'consulate_occupied');
    END;

    INSERT INTO politician_career_events (faction_id, event_tick, event_type, target_name, metadata)
    VALUES (v_pol.id, v_tick, 'consul_posted', COALESCE(v_nation.name, ''),
            jsonb_build_object('posted_nation_name', v_nation.name));

    RETURN jsonb_build_object('success', true, 'nation', v_nation.name);
END $$;

REVOKE EXECUTE ON FUNCTION public.politician_take_consul_post(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.politician_take_consul_post(uuid, uuid) TO authenticated;

-- ── consul_run_consulate — open the morning docket ────────────────
CREATE OR REPLACE FUNCTION public.consul_run_consulate(p_faction_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid    uuid := auth.uid();
    v_fac    factions%ROWTYPE;
    v_tick   int;
    v_home   uuid;
    v_host   uuid;
    v_minted int := 0;
    v_cand   RECORD;
    v_syn    RECORD;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    v_fac := _consul_check(v_uid, p_faction_id);
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_consul');
    END IF;
    v_home := v_fac.nation_id;
    v_host := v_fac.politician_consul_nation_id;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- An undecided docket blocks a new one; the case rows themselves
    -- are the once-per-tick ledger.
    IF EXISTS (SELECT 1 FROM consulate_cases
                WHERE consul_faction_id = v_fac.id AND status = 'pending') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'docket_pending');
    END IF;
    IF EXISTS (SELECT 1 FROM consulate_cases
                WHERE consul_faction_id = v_fac.id AND docket_tick = v_tick) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_ran');
    END IF;

    -- Up to 2 cases minted from real cross-border activity. The
    -- partial-unique source index makes every mint idempotent.
    FOR v_cand IN
        SELECT * FROM (
        SELECT 'trade_registration' AS kind,
               'corp_market_presence' AS source_kind, p.id::text AS source_id,
               format('TRADE REGISTRATION — %s entered the %s market.', c.name, hn.name) AS title,
               'Their paperwork needs a consular counter-signature.' AS body,
               'trade_boost' AS handle_effect, 'rep_down' AS stamp_effect,
               c.id AS subject_corp_id
          FROM corp_market_presence p
          JOIN entrepreneur_corps c ON c.id = p.corp_id
          JOIN nations hn ON hn.id = p.nation_id
         WHERE p.nation_id = v_host AND c.hq_nation_id = v_home
        UNION ALL
        SELECT 'groundbreaking', 'construction_project_requests', r.id::text,
               format('GROUNDBREAKING — %s breaks ground in %s.', rc.name, r.city),
               'The locals want a familiar face at the ceremony.',
               'relations_up', 'relations_down', rc.id
          FROM construction_project_requests r
          JOIN entrepreneur_corps rc ON rc.id = r.requester_corp_id
         WHERE r.requester_corp_id IS NOT NULL
           AND r.nation_id = v_host AND rc.hq_nation_id = v_home
        UNION ALL
        SELECT 'work_visa', 'job_applicants', a.id::text,
               format('WORK VISA FILE — %s signed on with %s.', a.name, ec.name),
               'A countryman''s papers sit in the tray.',
               'rep_up', 'relations_down', NULL
          FROM job_applicants a
          JOIN job_openings o ON o.id = a.opening_id
          JOIN entrepreneur_corps ec ON ec.id = o.corp_id
          JOIN factions ef ON ef.id = a.applicant_faction_id
         WHERE a.status = 'hired' AND ef.nation_id = v_home AND ec.hq_nation_id = v_host
        UNION ALL
        SELECT 'citizen_in_a_cell', 'arrested_factions', f.id::text,
               format('CITIZEN IN A CELL — %s sits in detention.',
                      TRIM(COALESCE(f.leader_first_name, '') || ' ' || COALESCE(f.leader_last_name, ''))),
               'A national of yours, arrested on host soil. The family is calling.',
               'xp_up', 'rep_down2', NULL
          FROM factions f
         WHERE f.nation_id = v_home
           AND lower(COALESCE(f.status, '')) = 'arrested'
           AND f.politician_foreign_service_nation_id = v_host
        ) AS cand
        WHERE NOT EXISTS (
            SELECT 1 FROM consulate_cases cc
             WHERE cc.consul_faction_id = v_fac.id
               AND cc.source_kind = cand.source_kind
               AND cc.source_id   = cand.source_id)
        LIMIT 2
    LOOP
        INSERT INTO consulate_cases (
            consul_faction_id, host_nation_id, kind, title, body,
            handle_effect, stamp_effect, subject_corp_id,
            source_kind, source_id, docket_tick
        ) VALUES (
            v_fac.id, v_host, v_cand.kind, v_cand.title, v_cand.body,
            v_cand.handle_effect, v_cand.stamp_effect, v_cand.subject_corp_id,
            v_cand.source_kind, v_cand.source_id, v_tick
        );
        v_minted := v_minted + 1;
    END LOOP;

    -- Synthetic catalog fills the morning to 4 cases.
    FOR v_syn IN
        SELECT * FROM (VALUES
            ('VISA BACKLOG', 'Forty applications, one stamp, no coffee.', 'rep_up', 'rep_down'),
            ('LOST PASSPORT', 'A tourist of yours left theirs in a taxi.', 'rep_up', 'rep_down'),
            ('FOUNTAIN INCIDENT', 'A national of yours took a swim in the plaza fountain. The police are amused; the press is not.', 'rep_up', 'trust_down'),
            ('EXPAT PROPERTY DISPUTE', 'A retired countryman swears the deed is real.', 'rep_up', 'rep_down'),
            ('COUNTERFEIT COMPLAINT', 'A local trader claims your nation''s goods are knock-offs.', 'lev_up', 'relations_down'),
            ('TRADE FAIR INVITATION', 'The chamber of commerce wants a keynote.', 'relations_up', 'rep_down'),
            ('JOURNALIST SNIFFING', 'A stringer wants a quote about the embassy budget.', 'lev_up', 'trust_down'),
            ('MARRIAGE REGISTRATION', 'Two nationals, one wedding, six forms.', 'rep_up', 'rep_down'),
            ('SISTER SCHOOL VISIT', 'Thirty schoolchildren and a choir. Attendance is diplomacy.', 'relations_up', 'rep_down'),
            ('NOTARIZATION QUEUE', 'The morning line wraps the block.', 'rep_up', 'rep_down'),
            ('CUSTOMS SPOT-CHECK', 'A shipment of your nationals'' household goods is held on a technicality.', 'rep_up', 'relations_down'),
            ('CULTURAL DELEGATION', 'A folk ensemble needs visas, lodging, and patience.', 'relations_up', 'rep_down')
        ) AS syn(title, body, handle_effect, stamp_effect)
        ORDER BY random()
        LIMIT GREATEST(0, 4 - v_minted)
    LOOP
        INSERT INTO consulate_cases (
            consul_faction_id, host_nation_id, kind, title, body,
            handle_effect, stamp_effect, docket_tick
        ) VALUES (
            v_fac.id, v_host, 'synthetic', v_syn.title, v_syn.body,
            v_syn.handle_effect, v_syn.stamp_effect, v_tick
        );
    END LOOP;

    RETURN jsonb_build_object('success', true, 'tick', v_tick,
        'player_led', v_minted, 'cases', 4);
END $$;

REVOKE EXECUTE ON FUNCTION public.consul_run_consulate(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.consul_run_consulate(uuid) TO authenticated;

-- ── consul_handle_case — handle one, stamp the rest ───────────────
CREATE OR REPLACE FUNCTION public.consul_handle_case(
    p_faction_id uuid,
    p_case_id    uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_fac     factions%ROWTYPE;
    v_case    consulate_cases%ROWTYPE;
    v_other   consulate_cases%ROWTYPE;
    v_stamped int := 0;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    v_fac := _consul_check(v_uid, p_faction_id);
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_consul');
    END IF;

    SELECT * INTO v_case FROM consulate_cases
     WHERE id = p_case_id AND consul_faction_id = v_fac.id
     FOR UPDATE;
    IF v_case.id IS NULL OR v_case.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'case_not_pending');
    END IF;

    UPDATE consulate_cases SET status = 'handled' WHERE id = v_case.id;
    PERFORM _apply_consul_effect(v_fac.id, v_fac.nation_id, v_fac.politician_consul_nation_id,
                                 v_case.handle_effect, v_case.subject_corp_id);

    -- The rubber stamp falls on everything else still pending.
    FOR v_other IN
        SELECT * FROM consulate_cases
         WHERE consul_faction_id = v_fac.id AND status = 'pending' AND id <> v_case.id
         FOR UPDATE
    LOOP
        UPDATE consulate_cases SET status = 'stamped' WHERE id = v_other.id;
        PERFORM _apply_consul_effect(v_fac.id, v_fac.nation_id, v_fac.politician_consul_nation_id,
                                     v_other.stamp_effect, v_other.subject_corp_id);
        v_stamped := v_stamped + 1;
    END LOOP;

    RETURN jsonb_build_object('success', true,
        'handled', v_case.title, 'stamped', v_stamped);
END $$;

REVOKE EXECUTE ON FUNCTION public.consul_handle_case(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.consul_handle_case(uuid, uuid) TO authenticated;

-- ── consul_build_network ──────────────────────────────────────────
-- −1 Relations · +1 Reputation · +0.3 Experience. Once per tick via
-- next_embassy_contacts_tick — the consul is no longer an attaché,
-- so the column is free for its tier-2 sibling.
CREATE OR REPLACE FUNCTION public.consul_build_network(p_faction_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid  uuid := auth.uid();
    v_fac  factions%ROWTYPE;
    v_tick int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    v_fac := _consul_check(v_uid, p_faction_id);
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_consul');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF v_fac.next_embassy_contacts_tick IS NOT NULL
       AND v_fac.next_embassy_contacts_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_fac.next_embassy_contacts_tick);
    END IF;

    PERFORM _bump_relation_score(v_fac.nation_id, v_fac.politician_consul_nation_id, -1);
    UPDATE factions
       SET embassy_reputation         = LEAST(100, COALESCE(embassy_reputation, 50) + 1),
           politician_skill           = COALESCE(politician_skill, 0) + 0.3,
           next_embassy_contacts_tick = v_tick + 1
     WHERE id = v_fac.id;

    RETURN jsonb_build_object(
        'success',          true,
        'relations_delta',  -1,
        'reputation_delta', 1,
        'skill_delta',      0.3,
        'next_action_tick', v_tick + 1
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.consul_build_network(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.consul_build_network(uuid) TO authenticated;

-- ── consul_backchannel ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.consul_backchannel(
    p_faction_id uuid,
    p_target_faction_id uuid,
    p_text text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid    uuid := auth.uid();
    v_fac    factions%ROWTYPE;
    v_target factions%ROWTYPE;
    v_text   text := TRIM(COALESCE(p_text, ''));
    v_tick   int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_target_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF length(v_text) < 1 OR length(v_text) > 240 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_text');
    END IF;
    v_fac := _consul_check(v_uid, p_faction_id);
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_consul');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF v_fac.next_backchannel_tick IS NOT NULL
       AND v_fac.next_backchannel_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_fac.next_backchannel_tick);
    END IF;

    -- Range: any player faction based in the host or home nation.
    SELECT * INTO v_target FROM factions
     WHERE id = p_target_faction_id
       AND abandoned_at IS NULL
       AND id <> v_fac.id
       AND faction_type IN ('politician', 'businessman', 'entrepreneur')
       AND nation_id IN (v_fac.nation_id, v_fac.politician_consul_nation_id);
    IF v_target.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'target_out_of_range');
    END IF;

    INSERT INTO backchannel_messages (to_faction_id, sender_name, body, created_at_tick)
    VALUES (v_target.id,
            COALESCE(NULLIF(TRIM(COALESCE(v_fac.leader_first_name, '') || ' '
                          || COALESCE(v_fac.leader_last_name, '')), ''), 'A consul'),
            v_text, v_tick);

    UPDATE factions SET next_backchannel_tick = v_tick + 1 WHERE id = v_fac.id;

    RETURN jsonb_build_object('success', true);
END $$;

REVOKE EXECUTE ON FUNCTION public.consul_backchannel(uuid, uuid, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.consul_backchannel(uuid, uuid, text) TO authenticated;

-- ── backchannel_burn — the recipient destroys the message ─────────
CREATE OR REPLACE FUNCTION public.backchannel_burn(p_message_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid uuid := auth.uid();
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    DELETE FROM backchannel_messages
     WHERE id = p_message_id
       AND to_faction_id IN (SELECT id FROM factions
                              WHERE id = v_uid OR linked_user_id = v_uid);
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_yours');
    END IF;
    RETURN jsonb_build_object('success', true);
END $$;

REVOKE EXECUTE ON FUNCTION public.backchannel_burn(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.backchannel_burn(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
