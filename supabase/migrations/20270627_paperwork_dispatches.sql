-- ════════════════════════════════════════════════════════════════════
-- 20270627 — Paperwork dispatches: player-authored, admin-approved
--
-- New content type: a Civil Servant inbox item (a "dispatch") that
-- represents a piece of paperwork the player must route to the correct
-- ministry + agency and optionally flag for the Senior Civil Servant.
-- Players author dispatches on /handlepaperwork.html; admins moderate
-- on /courtcaseadmin.html before the dispatch enters the rotation
-- pool (rotation + grading is future work — this migration ships the
-- authoring + moderation pieces only).
--
-- Lifecycle:
--   pending_approval (author submits) → approved (admin OKs)
--                                     → rejected (admin discards)
--
-- The answer key (correct_ministry / correct_agency / should_flag /
-- affected_stat / stat_direction) lives on the dispatch row alongside
-- the document body. Civil-servant-facing surfaces select only the
-- document columns; the answer-key columns are read by the grading
-- RPC (future) and by the admin moderation surface.
--
-- Ministry + agency keys are TEXT (not FKs) — the taxonomy lives in
-- js/paperwork-taxonomy.js and the validate helper below enforces the
-- 10 × 5 set in defence of bypass-the-form callers. Future ministry /
-- agency additions update the JS module + this CHECK list.
--
-- RPCs:
--   submit_paperwork_dispatch(p_payload jsonb)
--     Authenticated. Inserts a row at status='pending_approval' with
--     the calling faction as author. Returns the new dispatch id +
--     display id.
--
--   list_pending_paperwork_dispatches()
--     Admin only. Returns pending + recently-reviewed dispatches for
--     the courtcaseadmin moderation list.
--
--   approve_paperwork_dispatch(p_dispatch_id uuid, p_edits jsonb)
--     Admin only. Accepts the dispatch, optionally overriding fields
--     from p_edits (same shape as the submit payload, partial). Mirrors
--     the courtcaseadmin "accept with inline edits" pattern.
--
--   reject_paperwork_dispatch(p_dispatch_id uuid, p_note text)
--     Admin only. Marks the dispatch rejected with a note for the
--     author.
--
-- RLS:
--   • Authors can SELECT their own dispatches at any status.
--   • Anyone can SELECT approved dispatches (Civil Servants pull from
--     this set).
--   • All writes go through the SECURITY DEFINER RPCs (REVOKE all
--     direct INSERT / UPDATE / DELETE).
--
-- Apply after 20270626.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Table ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.paperwork_dispatches (
    id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    -- authoring
    author_faction_id     uuid REFERENCES public.factions(id) ON DELETE SET NULL,
    shard_id              uuid REFERENCES public.shard(id)    ON DELETE CASCADE,
    created_at_tick       int,
    created_at            timestamptz NOT NULL DEFAULT now(),
    -- document (what the Civil Servant sees)
    office_of             text NOT NULL,
    doc_title             text NOT NULL,
    sender_title          text NOT NULL,
    body                  text NOT NULL,
    -- answer key (hidden from Civil Servants)
    correct_ministry      text NOT NULL,
    correct_agency        text NOT NULL,
    should_flag           boolean NOT NULL DEFAULT false,
    affected_stat         text,
    stat_direction        text CHECK (stat_direction IS NULL OR stat_direction IN ('up', 'down')),
    -- lifecycle
    status                text NOT NULL DEFAULT 'pending_approval'
                          CHECK (status IN ('pending_approval', 'approved', 'rejected')),
    reviewer_faction_id   uuid REFERENCES public.factions(id) ON DELETE SET NULL,
    reviewed_at_tick      int,
    review_note           text,
    -- display id stamped at insert: DSP-YYYY-MM-NNNN
    display_id            text NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pw_dispatch_status
    ON public.paperwork_dispatches (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pw_dispatch_author
    ON public.paperwork_dispatches (author_faction_id, created_at DESC);

COMMENT ON TABLE public.paperwork_dispatches IS
    'Civil Servant inbox items authored by players on /handlepaperwork.html and moderated by admins on /courtcaseadmin.html. correct_ministry / correct_agency / should_flag form the answer key the grading RPC compares routing decisions against. RPC-only writes.';

-- ── 2. Allowed ministry × agency CHECK (defence in depth) ─────────
-- Mirrors js/paperwork-taxonomy.js PAPERWORK_MINISTRIES. The CHECK
-- guards against payloads that bypass the form (curl / dev console).
-- Update both this CHECK and the JS module when adding ministries /
-- agencies — they're a coordinated pair.
ALTER TABLE public.paperwork_dispatches
    DROP CONSTRAINT IF EXISTS paperwork_dispatches_ministry_check;
ALTER TABLE public.paperwork_dispatches
    ADD CONSTRAINT paperwork_dispatches_ministry_check
    CHECK (correct_ministry IN (
        'foreign_affairs','trade','economic_development','interior','security',
        'agriculture','sports','transportation','energy','finance'
    ));

-- ── 3. RLS ────────────────────────────────────────────────────────
ALTER TABLE public.paperwork_dispatches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pw_read_self_or_approved ON public.paperwork_dispatches;
CREATE POLICY pw_read_self_or_approved ON public.paperwork_dispatches
    FOR SELECT USING (
        status = 'approved'
        OR author_faction_id IN (
            SELECT id FROM public.factions
             WHERE id = auth.uid() OR linked_user_id = auth.uid()
        )
    );

REVOKE INSERT, UPDATE, DELETE ON public.paperwork_dispatches FROM PUBLIC, anon, authenticated;

-- ── 4. Helper: validate ministry / agency pair ────────────────────
-- Returns true when (ministry, agency) is a valid pair per the
-- taxonomy. Hardcoded list mirrors js/paperwork-taxonomy.js — keep in
-- sync. SQL function instead of a giant CHECK so the per-pair logic
-- stays readable.
CREATE OR REPLACE FUNCTION public._paperwork_valid_ministry_agency(
    p_ministry text, p_agency text
) RETURNS boolean
LANGUAGE sql IMMUTABLE
AS $$
    SELECT (p_ministry, p_agency) IN (
        ('foreign_affairs', 'bilateral_relations'),
        ('foreign_affairs', 'treaties_conventions'),
        ('foreign_affairs', 'consular_services'),
        ('foreign_affairs', 'multilateral_affairs'),
        ('foreign_affairs', 'public_diplomacy'),
        ('trade', 'tariffs_customs'),
        ('trade', 'export_promotion'),
        ('trade', 'trade_agreements'),
        ('trade', 'import_regulation'),
        ('trade', 'commercial_disputes'),
        ('economic_development', 'industrial_concessions'),
        ('economic_development', 'environmental_compliance'),
        ('economic_development', 'sectoral_planning'),
        ('economic_development', 'special_economic_zones'),
        ('economic_development', 'foreign_investment'),
        ('interior', 'provincial_affairs'),
        ('interior', 'civil_registry'),
        ('interior', 'disaster_management'),
        ('interior', 'lands_heritage'),
        ('interior', 'municipal_affairs'),
        ('security', 'national_police'),
        ('security', 'border_security'),
        ('security', 'counterterrorism'),
        ('security', 'defence_procurement'),
        ('security', 'intelligence'),
        ('agriculture', 'crop_production'),
        ('agriculture', 'livestock_fisheries'),
        ('agriculture', 'agricultural_subsidies'),
        ('agriculture', 'rural_development'),
        ('agriculture', 'food_safety'),
        ('sports', 'olympic_affairs'),
        ('sports', 'sports_federations'),
        ('sports', 'youth_athletics'),
        ('sports', 'venue_management'),
        ('sports', 'doping_control'),
        ('transportation', 'roads_highways'),
        ('transportation', 'civil_aviation'),
        ('transportation', 'maritime_affairs'),
        ('transportation', 'rail_services'),
        ('transportation', 'public_transit'),
        ('energy', 'oil_gas_concessions'),
        ('energy', 'electricity_regulator'),
        ('energy', 'renewable_energy'),
        ('energy', 'nuclear_affairs'),
        ('energy', 'energy_conservation'),
        ('finance', 'tax_collection'),
        ('finance', 'public_debt'),
        ('finance', 'treasury_cash'),
        ('finance', 'banking_supervision'),
        ('finance', 'public_investment')
    );
$$;

-- ── 5. submit_paperwork_dispatch ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.submit_paperwork_dispatch(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_fac          factions%ROWTYPE;
    v_shard_id     uuid;
    v_tick         int;
    v_id           uuid;
    v_display_id   text;
    v_seq          int;
    v_office       text := btrim(COALESCE(p_payload->>'office_of', ''));
    v_title        text := btrim(COALESCE(p_payload->>'doc_title', ''));
    v_sender       text := btrim(COALESCE(p_payload->>'sender_title', ''));
    v_body         text := btrim(COALESCE(p_payload->>'body', ''));
    v_ministry     text := NULLIF(btrim(p_payload->>'correct_ministry'), '');
    v_agency       text := NULLIF(btrim(p_payload->>'correct_agency'), '');
    v_should_flag  bool := COALESCE((p_payload->>'should_flag')::bool, false);
    v_stat         text := NULLIF(btrim(p_payload->>'affected_stat'), '');
    v_direction    text := NULLIF(btrim(p_payload->>'stat_direction'), '');
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    -- Author resolution: any faction the caller owns. Logs against the
    -- first owned faction (consistent with politician_* RPCs that pick
    -- the oldest faction for the caller).
    SELECT * INTO v_fac FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_faction');
    END IF;

    -- Field validation. Char limits are generous but bounded so the
    -- form doesn't end up shipping pasted novels.
    IF length(v_office) < 2 OR length(v_office) > 120 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_office_of');
    END IF;
    IF length(v_title) < 2 OR length(v_title) > 160 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_doc_title');
    END IF;
    IF length(v_sender) < 2 OR length(v_sender) > 120 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_sender_title');
    END IF;
    IF length(v_body) < 20 OR length(v_body) > 8000 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_body');
    END IF;
    IF v_ministry IS NULL OR v_agency IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_routing');
    END IF;
    IF NOT public._paperwork_valid_ministry_agency(v_ministry, v_agency) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_routing');
    END IF;
    IF v_direction IS NOT NULL AND v_direction NOT IN ('up', 'down') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_direction');
    END IF;
    -- Stat + direction are paired — having one without the other is a
    -- form bug. Reject so the user sees it.
    IF (v_stat IS NULL) <> (v_direction IS NULL) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'stat_direction_paired');
    END IF;

    SELECT shard_id INTO v_shard_id FROM factions WHERE id = v_fac.id;
    SELECT current_tick INTO v_tick FROM shard WHERE id = v_shard_id;
    v_tick := COALESCE(v_tick, 0);

    -- Display id: DSP-YYYYMM-NNNN. Sequence is the per-month dispatch
    -- count + 1 (small race window since this is a non-locking COUNT;
    -- two simultaneous submits in the same month could collide on the
    -- display id only — the PK uuid stays unique). Acceptable for a
    -- cosmetic identifier; if collisions become visible we add a real
    -- sequence later.
    SELECT COUNT(*) + 1 INTO v_seq
      FROM paperwork_dispatches
     WHERE created_at >= date_trunc('month', now())
       AND created_at <  date_trunc('month', now()) + interval '1 month';
    v_display_id := 'DSP-' || to_char(now(), 'YYYYMM') || '-' || lpad(v_seq::text, 4, '0');

    INSERT INTO paperwork_dispatches (
        author_faction_id, shard_id, created_at_tick,
        office_of, doc_title, sender_title, body,
        correct_ministry, correct_agency, should_flag,
        affected_stat, stat_direction,
        status, display_id
    ) VALUES (
        v_fac.id, v_shard_id, v_tick,
        v_office, v_title, v_sender, v_body,
        v_ministry, v_agency, v_should_flag,
        v_stat, v_direction,
        'pending_approval', v_display_id
    )
    RETURNING id INTO v_id;

    RETURN jsonb_build_object(
        'success',    true,
        'dispatch_id', v_id,
        'display_id',  v_display_id,
        'status',      'pending_approval'
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.submit_paperwork_dispatch(jsonb) TO authenticated;

-- ── 6. list_pending_paperwork_dispatches (admin) ──────────────────
CREATE OR REPLACE FUNCTION public.list_pending_paperwork_dispatches()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_result jsonb;
BEGIN
    IF NOT is_admin() THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_admin');
    END IF;

    SELECT COALESCE(jsonb_agg(row), '[]'::jsonb)
      INTO v_result
      FROM (
        SELECT jsonb_build_object(
                   'id',                 d.id,
                   'display_id',         d.display_id,
                   'status',             d.status,
                   'office_of',          d.office_of,
                   'doc_title',          d.doc_title,
                   'sender_title',       d.sender_title,
                   'body',               d.body,
                   'correct_ministry',   d.correct_ministry,
                   'correct_agency',     d.correct_agency,
                   'should_flag',        d.should_flag,
                   'affected_stat',      d.affected_stat,
                   'stat_direction',     d.stat_direction,
                   'author_faction_id',  d.author_faction_id,
                   'author_name',        COALESCE(
                       NULLIF(TRIM(COALESCE(a.leader_first_name, '') || ' '
                                || COALESCE(a.leader_last_name,  '')), ''),
                       a.faction_name
                   ),
                   'created_at',         d.created_at,
                   'created_at_tick',    d.created_at_tick,
                   'reviewed_at_tick',   d.reviewed_at_tick,
                   'review_note',        d.review_note
               ) AS row
          FROM paperwork_dispatches d
          LEFT JOIN factions a ON a.id = d.author_faction_id
         WHERE d.status = 'pending_approval'
            OR (d.status IN ('approved','rejected')
                AND d.reviewed_at_tick IS NOT NULL
                AND d.created_at > now() - interval '14 days')
         ORDER BY
             CASE d.status WHEN 'pending_approval' THEN 0 ELSE 1 END,
             d.created_at DESC
      ) s;

    RETURN jsonb_build_object('success', true, 'dispatches', v_result);
END;
$$;
GRANT EXECUTE ON FUNCTION public.list_pending_paperwork_dispatches() TO authenticated;

-- ── 7. approve_paperwork_dispatch (admin) ─────────────────────────
-- Optional p_edits is a partial submit-shape payload. Each provided
-- field overrides the stored field; omitted fields stay as authored.
-- Same routing validation runs against the (post-edit) values so an
-- admin can't approve a dispatch into an invalid (ministry, agency)
-- pair.
CREATE OR REPLACE FUNCTION public.approve_paperwork_dispatch(
    p_dispatch_id uuid,
    p_edits       jsonb DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_admin_fac factions%ROWTYPE;
    v_d         paperwork_dispatches%ROWTYPE;
    v_tick      int;
    v_office       text;
    v_title        text;
    v_sender       text;
    v_body         text;
    v_ministry     text;
    v_agency       text;
    v_should_flag  bool;
    v_stat         text;
    v_direction    text;
BEGIN
    IF NOT is_admin() THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_admin');
    END IF;
    IF p_dispatch_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    SELECT * INTO v_d FROM paperwork_dispatches WHERE id = p_dispatch_id FOR UPDATE;
    IF v_d.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'dispatch_not_found');
    END IF;
    IF v_d.status <> 'pending_approval' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_pending');
    END IF;

    -- Apply edits, falling through to the stored value when a field
    -- is absent. NULLs in p_edits explicitly mean "no change".
    v_office      := COALESCE(NULLIF(btrim(p_edits->>'office_of'),       ''), v_d.office_of);
    v_title       := COALESCE(NULLIF(btrim(p_edits->>'doc_title'),       ''), v_d.doc_title);
    v_sender      := COALESCE(NULLIF(btrim(p_edits->>'sender_title'),    ''), v_d.sender_title);
    v_body        := COALESCE(NULLIF(btrim(p_edits->>'body'),            ''), v_d.body);
    v_ministry    := COALESCE(NULLIF(btrim(p_edits->>'correct_ministry'), ''), v_d.correct_ministry);
    v_agency      := COALESCE(NULLIF(btrim(p_edits->>'correct_agency'),   ''), v_d.correct_agency);
    v_should_flag := COALESCE((p_edits->>'should_flag')::bool, v_d.should_flag);
    -- stat / direction: explicit edits can clear them via the
    -- 'clear_stat' boolean (admin flow needs a way to remove an
    -- author-set stat that the admin disagrees with).
    IF COALESCE((p_edits->>'clear_stat')::bool, false) THEN
        v_stat      := NULL;
        v_direction := NULL;
    ELSE
        v_stat      := COALESCE(NULLIF(btrim(p_edits->>'affected_stat'),  ''), v_d.affected_stat);
        v_direction := COALESCE(NULLIF(btrim(p_edits->>'stat_direction'), ''), v_d.stat_direction);
    END IF;

    -- Same routing validation as submit. An admin shouldn't be able to
    -- approve into an invalid pair, even via direct RPC.
    IF NOT public._paperwork_valid_ministry_agency(v_ministry, v_agency) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_routing');
    END IF;
    IF v_direction IS NOT NULL AND v_direction NOT IN ('up', 'down') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_direction');
    END IF;
    IF (v_stat IS NULL) <> (v_direction IS NULL) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'stat_direction_paired');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- Reviewer id is the admin's first owned faction. Best-effort —
    -- if the admin has no faction (system admin) the reviewer stays
    -- NULL and the review timestamp / status still land.
    SELECT * INTO v_admin_fac FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1;

    UPDATE paperwork_dispatches
       SET office_of           = v_office,
           doc_title           = v_title,
           sender_title        = v_sender,
           body                = v_body,
           correct_ministry    = v_ministry,
           correct_agency      = v_agency,
           should_flag         = v_should_flag,
           affected_stat       = v_stat,
           stat_direction      = v_direction,
           status              = 'approved',
           reviewer_faction_id = v_admin_fac.id,
           reviewed_at_tick    = v_tick
     WHERE id = p_dispatch_id;

    RETURN jsonb_build_object(
        'success',    true,
        'dispatch_id', p_dispatch_id,
        'status',      'approved'
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.approve_paperwork_dispatch(uuid, jsonb) TO authenticated;

-- ── 8. reject_paperwork_dispatch (admin) ──────────────────────────
CREATE OR REPLACE FUNCTION public.reject_paperwork_dispatch(
    p_dispatch_id uuid,
    p_note        text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_admin_fac factions%ROWTYPE;
    v_d         paperwork_dispatches%ROWTYPE;
    v_tick      int;
BEGIN
    IF NOT is_admin() THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_admin');
    END IF;
    IF p_dispatch_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    SELECT * INTO v_d FROM paperwork_dispatches WHERE id = p_dispatch_id FOR UPDATE;
    IF v_d.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'dispatch_not_found');
    END IF;
    IF v_d.status <> 'pending_approval' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_pending');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    SELECT * INTO v_admin_fac FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1;

    UPDATE paperwork_dispatches
       SET status              = 'rejected',
           reviewer_faction_id = v_admin_fac.id,
           reviewed_at_tick    = v_tick,
           review_note         = NULLIF(btrim(p_note), '')
     WHERE id = p_dispatch_id;

    RETURN jsonb_build_object(
        'success',    true,
        'dispatch_id', p_dispatch_id,
        'status',      'rejected'
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.reject_paperwork_dispatch(uuid, text) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
