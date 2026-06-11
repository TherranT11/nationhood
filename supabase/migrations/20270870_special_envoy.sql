-- ════════════════════════════════════════════════════════════════════
-- 20270870 — The Special Envoy (Foreign Service tier 5)
--
-- The chosen rank: appointed BY the Foreign Minister (a player FM
-- picks; with no player FM, [Seek Appointment] auto-appoints).
-- Eligibility (design ruling): 55 Experience AND a COMPLETED
-- Ambassador term (the career event is the proof — a recall in
-- disgrace does not count). One envoy per nation; lower FS postings
-- vacate on appointment; a serving Ambassador must finish the term
-- first (terms are never ended early).
--
-- [NEGOTIATE]: the envoy picks a live nation and the mission routes
-- to the HIGHEST PLAYER in that nation's chain — Head of Government,
-- else Foreign Minister, else any Ambassador OF that nation. No
-- player in the chain, no mission (negotiations need a human).
-- Acceptance opens the NEGOTIATION SESSION — 'Special Envoy of
-- {year} between {A} and {B}' — a chatbox plus text articles plus up
-- to three standard accords. ANY article change resets both AGREE
-- flags; both parties agreeing signs the arrangement:
--   · Friendship Accord       — +5 relation_score, on signing
--   · Trade Understanding     — −10% market entry fees between the
--     pair (market_entry_cost gains a pair-aware overload; the two
--     expansion RPCs re-emitted to pass the corp's home nation)
--   · Consular Convention     — citizen-in-a-cell handles at double
--     effect between the pair (_apply_consul_effect re-emitted)
-- has_accord() is the one source every effect reads. Signed
-- arrangements are permanent public records — the legacy is the row.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.factions
    ADD COLUMN IF NOT EXISTS politician_special_envoy_at_tick int;

CREATE UNIQUE INDEX IF NOT EXISTS factions_one_envoy_per_nation
    ON public.factions (nation_id)
    WHERE politician_special_envoy_at_tick IS NOT NULL AND abandoned_at IS NULL;

CREATE TABLE IF NOT EXISTS public.envoy_sessions (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title                   text NOT NULL,
    envoy_faction_id        uuid NOT NULL REFERENCES public.factions(id) ON DELETE CASCADE,
    counterpart_faction_id  uuid NOT NULL REFERENCES public.factions(id) ON DELETE CASCADE,
    home_nation_id          uuid NOT NULL,
    target_nation_id        uuid NOT NULL,
    status                  text NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'active', 'signed', 'declined')),
    envoy_agreed            boolean NOT NULL DEFAULT false,
    counterpart_agreed      boolean NOT NULL DEFAULT false,
    created_at_tick         int NOT NULL,
    signed_tick             int,
    created_at              timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS envoy_sessions_party_idx
    ON public.envoy_sessions (envoy_faction_id, counterpart_faction_id);

CREATE TABLE IF NOT EXISTS public.envoy_session_articles (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id          uuid NOT NULL REFERENCES public.envoy_sessions(id) ON DELETE CASCADE,
    ordinal             int NOT NULL,
    kind                text NOT NULL CHECK (kind IN ('text', 'friendship_accord', 'trade_understanding', 'consular_convention')),
    body                text NOT NULL DEFAULT '' CHECK (char_length(body) <= 600),
    added_by_faction_id uuid,
    created_at          timestamptz NOT NULL DEFAULT now()
);
-- One of each standard accord per session.
CREATE UNIQUE INDEX IF NOT EXISTS envoy_session_articles_one_accord
    ON public.envoy_session_articles (session_id, kind) WHERE kind <> 'text';

CREATE TABLE IF NOT EXISTS public.envoy_session_chat (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id        uuid NOT NULL REFERENCES public.envoy_sessions(id) ON DELETE CASCADE,
    sender_faction_id uuid,
    sender_name       text NOT NULL,
    body              text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 500),
    created_at_tick   int NOT NULL,
    created_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS envoy_session_chat_session_idx
    ON public.envoy_session_chat (session_id, created_at);

ALTER TABLE public.envoy_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow select for all" ON public.envoy_sessions;
CREATE POLICY "Allow select for all" ON public.envoy_sessions FOR SELECT USING (true);
ALTER TABLE public.envoy_session_articles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow select for all" ON public.envoy_session_articles;
CREATE POLICY "Allow select for all" ON public.envoy_session_articles FOR SELECT USING (true);
ALTER TABLE public.envoy_session_chat ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow select for all" ON public.envoy_session_chat;
CREATE POLICY "Allow select for all" ON public.envoy_session_chat FOR SELECT USING (true);

-- ── has_accord — the one source every signed effect reads ─────────
CREATE OR REPLACE FUNCTION public.has_accord(p_a uuid, p_b uuid, p_kind text)
RETURNS boolean
LANGUAGE sql STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM envoy_sessions s
          JOIN envoy_session_articles a ON a.session_id = s.id AND a.kind = p_kind
         WHERE s.status = 'signed'
           AND ((s.home_nation_id = p_a AND s.target_nation_id = p_b)
             OR (s.home_nation_id = p_b AND s.target_nation_id = p_a))
    );
$$;

REVOKE EXECUTE ON FUNCTION public.has_accord(uuid, uuid, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.has_accord(uuid, uuid, text) TO authenticated;

-- ── _envoy_eligible — 55 Experience + a completed Ambassador term ──
CREATE OR REPLACE FUNCTION public._envoy_eligible(p_pol factions)
RETURNS text
LANGUAGE plpgsql STABLE
AS $$
BEGIN
    IF COALESCE(p_pol.politician_skill, 0) < 55 THEN
        RETURN 'not_enough_experience';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM politician_career_events
                    WHERE faction_id = p_pol.id
                      AND event_type = 'ambassador_term_ended') THEN
        RETURN 'no_completed_term';
    END IF;
    IF p_pol.politician_ambassador_nation_id IS NOT NULL THEN
        RETURN 'term_in_progress';
    END IF;
    IF p_pol.politician_special_envoy_at_tick IS NOT NULL THEN
        RETURN 'already_envoy';
    END IF;
    IF EXISTS (SELECT 1 FROM factions
                WHERE nation_id = p_pol.nation_id
                  AND politician_special_envoy_at_tick IS NOT NULL
                  AND abandoned_at IS NULL) THEN
        RETURN 'post_filled';
    END IF;
    RETURN NULL;
END $$;

REVOKE EXECUTE ON FUNCTION public._envoy_eligible(factions) FROM PUBLIC;

-- ── _appoint_envoy — the one pen (both paths) ─────────────────────
CREATE OR REPLACE FUNCTION public._appoint_envoy(p_pol_id uuid, p_tick int, p_path text)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
BEGIN
    BEGIN
        UPDATE factions
           SET politician_special_envoy_at_tick = p_tick,
               -- lower FS postings vacate (ladder pattern)
               politician_consul_nation_id = NULL,
               politician_consul_at_tick   = NULL,
               politician_dcm_region       = NULL,
               politician_dcm_at_tick      = NULL
         WHERE id = p_pol_id AND abandoned_at IS NULL;
        IF NOT FOUND THEN
            RETURN jsonb_build_object('success', false, 'reason', 'applicant_gone');
        END IF;
    EXCEPTION WHEN unique_violation THEN
        RETURN jsonb_build_object('success', false, 'reason', 'post_filled');
    END;
    INSERT INTO politician_career_events (faction_id, event_tick, event_type, target_name, metadata)
    VALUES (p_pol_id, p_tick, 'envoy_appointed', '', jsonb_build_object('path', p_path));
    RETURN jsonb_build_object('success', true);
END $$;

REVOKE EXECUTE ON FUNCTION public._appoint_envoy(uuid, int, text) FROM PUBLIC;

-- ── fm_appoint_envoy — the player FM's pick ───────────────────────
CREATE OR REPLACE FUNCTION public.fm_appoint_envoy(
    p_faction_id   uuid,
    p_politician_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid  uuid := auth.uid();
    v_fm   factions%ROWTYPE;
    v_pol  factions%ROWTYPE;
    v_why  text;
    v_tick int;
    v_res  jsonb;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_politician_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    SELECT * INTO v_fm FROM factions
     WHERE id = p_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL;
    IF v_fm.id IS NULL OR v_fm.politician_foreign_minister_at_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_fm');
    END IF;
    SELECT * INTO v_pol FROM factions
     WHERE id = p_politician_id
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
       AND nation_id = v_fm.nation_id
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'applicant_gone');
    END IF;
    v_why := _envoy_eligible(v_pol);
    IF v_why IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', v_why);
    END IF;
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_res := _appoint_envoy(v_pol.id, COALESCE(v_tick, 0), 'player_fm');
    RETURN v_res;
END $$;

REVOKE EXECUTE ON FUNCTION public.fm_appoint_envoy(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.fm_appoint_envoy(uuid, uuid) TO authenticated;

-- ── politician_seek_envoy_appointment — the NPC-FM path ───────────
CREATE OR REPLACE FUNCTION public.politician_seek_envoy_appointment(p_faction_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid  uuid := auth.uid();
    v_pol  factions%ROWTYPE;
    v_why  text;
    v_tick int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
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
    -- A player FM appoints directly — the seek path is the NPC desk.
    IF _foreign_minister_of(v_pol.nation_id) IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'fm_appoints');
    END IF;
    v_why := _envoy_eligible(v_pol);
    IF v_why IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', v_why);
    END IF;
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    RETURN _appoint_envoy(v_pol.id, COALESCE(v_tick, 0), 'npc_fm');
END $$;

REVOKE EXECUTE ON FUNCTION public.politician_seek_envoy_appointment(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.politician_seek_envoy_appointment(uuid) TO authenticated;

-- ── envoy_start_mission — [NEGOTIATE] ─────────────────────────────
CREATE OR REPLACE FUNCTION public.envoy_start_mission(
    p_faction_id uuid,
    p_nation_id  uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid    uuid := auth.uid();
    v_pol    factions%ROWTYPE;
    v_target nations%ROWTYPE;
    v_home   nations%ROWTYPE;
    v_cp     uuid;
    v_tick   int;
    v_title  text;
    v_id     uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     FOR UPDATE;
    IF v_pol.id IS NULL OR v_pol.politician_special_envoy_at_tick IS NULL
       OR lower(COALESCE(v_pol.status, '')) = 'arrested' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_envoy');
    END IF;
    IF p_nation_id = v_pol.nation_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_nation');
    END IF;
    SELECT * INTO v_target FROM nations
     WHERE id = p_nation_id AND name = ANY (market_nation_names());
    IF v_target.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_not_live');
    END IF;
    IF EXISTS (SELECT 1 FROM envoy_sessions
                WHERE envoy_faction_id = v_pol.id
                  AND status IN ('proposed', 'active')) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'mission_open');
    END IF;

    -- Route to the highest PLAYER in the target's chain (design
    -- ruling): Head of Government → Foreign Minister → any
    -- Ambassador OF that nation. No player, no mission.
    SELECT f.id INTO v_cp
      FROM head_of_government h
      JOIN factions f ON f.id = h.candidate_id
     WHERE h.nation_id = p_nation_id
       AND f.linked_user_id IS NOT NULL
       AND f.abandoned_at IS NULL
     ORDER BY h.created_at DESC LIMIT 1;
    IF v_cp IS NULL THEN
        v_cp := _foreign_minister_of(p_nation_id);
    END IF;
    IF v_cp IS NULL THEN
        SELECT id INTO v_cp FROM factions
         WHERE nation_id = p_nation_id
           AND politician_ambassador_nation_id IS NOT NULL
           AND abandoned_at IS NULL
         LIMIT 1;
    END IF;
    IF v_cp IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_counterpart');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    SELECT * INTO v_home FROM nations WHERE id = v_pol.nation_id;
    -- Year anchor mirrors tickToDate: tick 0 = January 2000.
    v_title := format('Special Envoy of %s between %s and %s',
        2000 + FLOOR(v_tick / 12.0)::int,
        COALESCE(v_home.name, '—'), COALESCE(v_target.name, '—'));

    INSERT INTO envoy_sessions (
        title, envoy_faction_id, counterpart_faction_id,
        home_nation_id, target_nation_id, created_at_tick
    ) VALUES (
        v_title, v_pol.id, v_cp, v_pol.nation_id, p_nation_id, v_tick
    ) RETURNING id INTO v_id;

    RETURN jsonb_build_object('success', true, 'session_id', v_id, 'title', v_title);
END $$;

REVOKE EXECUTE ON FUNCTION public.envoy_start_mission(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.envoy_start_mission(uuid, uuid) TO authenticated;

-- ── _envoy_session_party — shared access check ────────────────────
CREATE OR REPLACE FUNCTION public._envoy_session_party(p_uid uuid, p_faction_id uuid, p_session_id uuid)
RETURNS envoy_sessions
LANGUAGE plpgsql
AS $$
DECLARE
    v_session envoy_sessions%ROWTYPE;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM factions
                    WHERE id = p_faction_id
                      AND (id = p_uid OR linked_user_id = p_uid)
                      AND abandoned_at IS NULL) THEN
        RETURN NULL;
    END IF;
    SELECT * INTO v_session FROM envoy_sessions
     WHERE id = p_session_id
       AND (envoy_faction_id = p_faction_id OR counterpart_faction_id = p_faction_id)
     FOR UPDATE;
    RETURN v_session;
END $$;

REVOKE EXECUTE ON FUNCTION public._envoy_session_party(uuid, uuid, uuid) FROM PUBLIC;

-- ── envoy_mission_decide — the counterpart answers ────────────────
CREATE OR REPLACE FUNCTION public.envoy_mission_decide(
    p_faction_id uuid,
    p_session_id uuid,
    p_accept     boolean
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_session envoy_sessions%ROWTYPE;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_session_id IS NULL OR p_accept IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    v_session := _envoy_session_party(v_uid, p_faction_id, p_session_id);
    IF v_session.id IS NULL OR v_session.counterpart_faction_id <> p_faction_id
       OR v_session.status <> 'proposed' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_proposed');
    END IF;
    UPDATE envoy_sessions
       SET status = CASE WHEN p_accept THEN 'active' ELSE 'declined' END
     WHERE id = v_session.id;
    RETURN jsonb_build_object('success', true, 'accepted', p_accept);
END $$;

REVOKE EXECUTE ON FUNCTION public.envoy_mission_decide(uuid, uuid, boolean) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.envoy_mission_decide(uuid, uuid, boolean) TO authenticated;

-- ── envoy_session_post_chat ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.envoy_session_post_chat(
    p_faction_id uuid,
    p_session_id uuid,
    p_text       text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_session envoy_sessions%ROWTYPE;
    v_text    text := TRIM(COALESCE(p_text, ''));
    v_name    text;
    v_tick    int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF length(v_text) < 1 OR length(v_text) > 500 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_text');
    END IF;
    v_session := _envoy_session_party(v_uid, p_faction_id, p_session_id);
    IF v_session.id IS NULL OR v_session.status <> 'active' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_active');
    END IF;
    SELECT TRIM(COALESCE(leader_first_name, '') || ' ' || COALESCE(leader_last_name, ''))
      INTO v_name FROM factions WHERE id = p_faction_id;
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    INSERT INTO envoy_session_chat (session_id, sender_faction_id, sender_name, body, created_at_tick)
    VALUES (v_session.id, p_faction_id, COALESCE(NULLIF(v_name, ''), 'Delegate'), v_text, COALESCE(v_tick, 0));
    RETURN jsonb_build_object('success', true);
END $$;

REVOKE EXECUTE ON FUNCTION public.envoy_session_post_chat(uuid, uuid, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.envoy_session_post_chat(uuid, uuid, text) TO authenticated;

-- ── envoy_session_add_article — text or a standard accord ─────────
CREATE OR REPLACE FUNCTION public.envoy_session_add_article(
    p_faction_id uuid,
    p_session_id uuid,
    p_kind       text,
    p_body       text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_session envoy_sessions%ROWTYPE;
    v_body    text := TRIM(COALESCE(p_body, ''));
    v_ord     int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_kind NOT IN ('text', 'friendship_accord', 'trade_understanding', 'consular_convention') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_kind = 'text' AND (length(v_body) < 1 OR length(v_body) > 600) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_text');
    END IF;
    v_session := _envoy_session_party(v_uid, p_faction_id, p_session_id);
    IF v_session.id IS NULL OR v_session.status <> 'active' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_active');
    END IF;

    SELECT COALESCE(MAX(ordinal), 0) + 1 INTO v_ord
      FROM envoy_session_articles WHERE session_id = v_session.id;
    BEGIN
        INSERT INTO envoy_session_articles (session_id, ordinal, kind, body, added_by_faction_id)
        VALUES (v_session.id, v_ord, p_kind,
                CASE WHEN p_kind = 'text' THEN v_body ELSE '' END, p_faction_id);
    EXCEPTION WHEN unique_violation THEN
        RETURN jsonb_build_object('success', false, 'reason', 'accord_already_on_table');
    END;

    -- The text changed under everyone's signature: both flags reset.
    UPDATE envoy_sessions
       SET envoy_agreed = false, counterpart_agreed = false
     WHERE id = v_session.id;

    RETURN jsonb_build_object('success', true, 'ordinal', v_ord);
END $$;

REVOKE EXECUTE ON FUNCTION public.envoy_session_add_article(uuid, uuid, text, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.envoy_session_add_article(uuid, uuid, text, text) TO authenticated;

-- ── envoy_session_remove_article — the adder withdraws it ─────────
CREATE OR REPLACE FUNCTION public.envoy_session_remove_article(
    p_faction_id uuid,
    p_session_id uuid,
    p_article_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_session envoy_sessions%ROWTYPE;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    v_session := _envoy_session_party(v_uid, p_faction_id, p_session_id);
    IF v_session.id IS NULL OR v_session.status <> 'active' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_active');
    END IF;
    DELETE FROM envoy_session_articles
     WHERE id = p_article_id AND session_id = v_session.id
       AND added_by_faction_id = p_faction_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_yours');
    END IF;
    UPDATE envoy_sessions
       SET envoy_agreed = false, counterpart_agreed = false
     WHERE id = v_session.id;
    RETURN jsonb_build_object('success', true);
END $$;

REVOKE EXECUTE ON FUNCTION public.envoy_session_remove_article(uuid, uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.envoy_session_remove_article(uuid, uuid, uuid) TO authenticated;

-- ── envoy_session_agree — both signatures close the arrangement ───
CREATE OR REPLACE FUNCTION public.envoy_session_agree(
    p_faction_id uuid,
    p_session_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_session envoy_sessions%ROWTYPE;
    v_tick    int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    v_session := _envoy_session_party(v_uid, p_faction_id, p_session_id);
    IF v_session.id IS NULL OR v_session.status <> 'active' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_active');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM envoy_session_articles WHERE session_id = v_session.id) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'empty_arrangement');
    END IF;

    UPDATE envoy_sessions
       SET envoy_agreed       = envoy_agreed       OR (envoy_faction_id = p_faction_id),
           counterpart_agreed = counterpart_agreed OR (counterpart_faction_id = p_faction_id)
     WHERE id = v_session.id
     RETURNING * INTO v_session;

    IF NOT (v_session.envoy_agreed AND v_session.counterpart_agreed) THEN
        RETURN jsonb_build_object('success', true, 'signed', false,
            'envoy_agreed', v_session.envoy_agreed,
            'counterpart_agreed', v_session.counterpart_agreed);
    END IF;

    -- Both pens down: SIGNED.
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    UPDATE envoy_sessions SET status = 'signed', signed_tick = v_tick
     WHERE id = v_session.id;

    -- The Friendship Accord lands its swing on signing; Trade and
    -- Consular live as standing effects through has_accord().
    IF EXISTS (SELECT 1 FROM envoy_session_articles
                WHERE session_id = v_session.id AND kind = 'friendship_accord') THEN
        PERFORM _bump_relation_score(v_session.home_nation_id, v_session.target_nation_id, 5);
    END IF;

    INSERT INTO politician_career_events (faction_id, event_tick, event_type, target_name, metadata)
    SELECT f, v_tick, 'envoy_arrangement_signed', v_session.title,
           jsonb_build_object('session_id', v_session.id)
      FROM unnest(ARRAY[v_session.envoy_faction_id, v_session.counterpart_faction_id]) AS f;

    RETURN jsonb_build_object('success', true, 'signed', true, 'title', v_session.title);
END $$;

REVOKE EXECUTE ON FUNCTION public.envoy_session_agree(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.envoy_session_agree(uuid, uuid) TO authenticated;

-- ── market_entry_cost — the pair-aware overload ───────────────────
-- The 2-arg base stays the formula's one home; the 3-arg reads the
-- Trade Understanding between the corp's home nation and the target.
CREATE OR REPLACE FUNCTION public.market_entry_cost(p_kind text, p_nation_id uuid, p_home_nation_id uuid)
RETURNS bigint
LANGUAGE sql STABLE
AS $$
    SELECT ROUND(market_entry_cost(p_kind, p_nation_id)
        * CASE WHEN has_accord(p_home_nation_id, p_nation_id, 'trade_understanding')
               THEN 0.9 ELSE 1.0 END)::bigint;
$$;

REVOKE EXECUTE ON FUNCTION public.market_entry_cost(text, uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.market_entry_cost(text, uuid, uuid) TO authenticated;

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
        -- A signed Consular Convention (20270870) doubles the
        -- citizen-case handle between the pair.
        UPDATE factions SET politician_skill = COALESCE(politician_skill, 0)
            + CASE WHEN has_accord(p_home, p_host, 'consular_convention') THEN 2 ELSE 1 END
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

-- ── cco_propose_expansion ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.cco_propose_expansion(
    p_nation_id       uuid,
    p_kind            text,
    p_subsidiary_name text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid    uuid := auth.uid();
    v_fac    factions%ROWTYPE;
    v_corp   entrepreneur_corps%ROWTYPE;
    v_nation nations%ROWTYPE;
    v_tick   int;
    v_name   text := TRIM(COALESCE(p_subsidiary_name, ''));
    v_id     uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_nation_id IS NULL OR p_kind NOT IN ('expansion', 'subsidiary') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_kind = 'subsidiary' AND (length(v_name) < 2 OR length(v_name) > 60) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_name');
    END IF;
    v_fac := _commercial_chief_check(v_uid);
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_cco');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps
     WHERE id = v_fac.biz_employer_corp_id;
    IF p_nation_id = v_corp.hq_nation_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'home_nation');
    END IF;
    SELECT * INTO v_nation FROM nations
     WHERE id = p_nation_id AND name = ANY (market_nation_names());
    IF v_nation.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_not_live');
    END IF;
    IF EXISTS (SELECT 1 FROM corp_market_presence
                WHERE corp_id = v_corp.id AND nation_id = p_nation_id) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_present');
    END IF;
    -- One pitch on the boss's desk at a time.
    IF EXISTS (SELECT 1 FROM market_expansion_proposals
                WHERE proposer_faction_id = v_fac.id AND status = 'pending') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'proposal_pending');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_fac.biz_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    INSERT INTO market_expansion_proposals (
        corp_id, proposer_faction_id, nation_id, kind, subsidiary_name, created_at_tick
    ) VALUES (
        v_corp.id, v_fac.id, p_nation_id, p_kind,
        CASE WHEN p_kind = 'subsidiary' THEN v_name END, v_tick
    ) RETURNING id INTO v_id;

    UPDATE factions SET biz_action_tick = v_tick WHERE id = v_fac.id;

    RETURN jsonb_build_object('success', true, 'proposal_id', v_id,
        'nation', v_nation.name, 'kind', p_kind,
        'cost', market_entry_cost(p_kind, p_nation_id, v_corp.hq_nation_id));
END $$;

REVOKE EXECUTE ON FUNCTION public.cco_propose_expansion(uuid, text, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.cco_propose_expansion(uuid, text, text) TO authenticated;

-- ── review_expansion_proposal — the owner's call ──────────────────
CREATE OR REPLACE FUNCTION public.review_expansion_proposal(
    p_proposal_id uuid,
    p_accept      boolean
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid    uuid := auth.uid();
    v_prop   market_expansion_proposals%ROWTYPE;
    v_corp   entrepreneur_corps%ROWTYPE;
    v_fac    factions%ROWTYPE;
    v_nation nations%ROWTYPE;
    v_tick   int;
    v_cost   bigint;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_proposal_id IS NULL OR p_accept IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_prop FROM market_expansion_proposals
     WHERE id = p_proposal_id FOR UPDATE;
    IF v_prop.id IS NULL OR v_prop.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_pending');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps
     WHERE id = v_prop.corp_id FOR UPDATE;
    SELECT * INTO v_fac FROM factions
     WHERE id = v_corp.owner_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'businessman'
       AND abandoned_at IS NULL;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;
    IF lower(COALESCE(v_fac.status, '')) = 'arrested' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'arrested');
    END IF;

    IF NOT p_accept THEN
        UPDATE market_expansion_proposals SET status = 'rejected' WHERE id = v_prop.id;
        RETURN jsonb_build_object('success', true, 'accepted', false);
    END IF;

    -- The window may have closed since the pitch.
    IF EXISTS (SELECT 1 FROM corp_market_presence
                WHERE corp_id = v_corp.id AND nation_id = v_prop.nation_id) THEN
        UPDATE market_expansion_proposals SET status = 'rejected' WHERE id = v_prop.id;
        RETURN jsonb_build_object('success', false, 'reason', 'already_present');
    END IF;
    SELECT * INTO v_nation FROM nations
     WHERE id = v_prop.nation_id AND name = ANY (market_nation_names());
    IF v_nation.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_not_live');
    END IF;

    -- Acceptance pays the entry fee — no executive action; the
    -- CCO's daily action already paid for this pitch.
    v_cost := market_entry_cost(v_prop.kind, v_prop.nation_id, v_corp.hq_nation_id);
    IF floor(COALESCE(v_corp.treasury_cash, 0))::bigint < v_cost THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_treasury',
            'need', v_cost, 'have', floor(COALESCE(v_corp.treasury_cash, 0))::bigint);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    INSERT INTO corp_market_presence (
        corp_id, nation_id, kind, subsidiary_name, cost_paid, established_tick
    ) VALUES (
        v_corp.id, v_prop.nation_id, v_prop.kind, v_prop.subsidiary_name, v_cost, v_tick
    );
    UPDATE entrepreneur_corps
       SET treasury_cash = COALESCE(treasury_cash, 0) - v_cost
     WHERE id = v_corp.id;
    UPDATE market_expansion_proposals SET status = 'accepted' WHERE id = v_prop.id;

    PERFORM _log_corp_history(v_corp.id, v_tick, CASE WHEN v_prop.kind = 'subsidiary'
        THEN format('Opened the subsidiary “%s” in %s ($%s) — the CCO''s pitch.', v_prop.subsidiary_name, v_nation.name, v_cost)
        ELSE format('Expanded into %s ($%s) — the CCO''s pitch.', v_nation.name, v_cost) END);

    RETURN jsonb_build_object('success', true, 'accepted', true,
        'nation', v_nation.name, 'kind', v_prop.kind, 'cost', v_cost);
END $$;

REVOKE EXECUTE ON FUNCTION public.review_expansion_proposal(uuid, boolean) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.review_expansion_proposal(uuid, boolean) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
