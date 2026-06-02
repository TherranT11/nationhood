-- ════════════════════════════════════════════════════════════════════
-- 20270523 — Court case witnesses (Section VI)
--
-- Optional witnesses on each case (max 3 per case). Each witness has:
--   • name + description
--   • direct[]  — up to 3 Q&A pairs (friendly examination)
--   • cross[]   — up to 3 Q&A pairs (opposing examination)
--
-- Each Q&A pair stores:
--   • question + answer text (≤240 chars each, matching the
--     in-trial message limit)
--   • supports: 'plaintiff' | 'defendant'  — the side this
--     testimony favours, same axis as beats
--   • strength: 1-10                       — hidden until the
--     answer is given in trial, then contributes to the verdict
--     tally exactly like a beat strength
--   • requires_beat: int | null            — INDEX into the case's
--     beats[] array of a beat that must be in evidence before this
--     question can be asked. Phase 4+ trial mechanic; the composer
--     ships the data shape here.
--
-- Storage: jsonb on court_case_drafts. The shape mirrors beats —
-- both are append-only, content-validated client-side, freeform on
-- the server (no per-element CHECK), and stripped of strengths in
-- the advocate-facing draw payload by the future witness draw RPC.
--
-- This migration ships:
--   • court_case_drafts.witnesses jsonb DEFAULT '[]'
--   • submit_court_case_draft accepts witnesses (validated for
--     "if present, complete" client-side; server stores verbatim)
--   • accept_court_case_draft preserves the witnesses field on
--     admin save (same UPSERT-on-fields pattern beats use)
--   • list_court_case_drafts surfaces witnesses to admin queue
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.court_case_drafts
    ADD COLUMN IF NOT EXISTS witnesses jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.court_case_drafts.witnesses IS
    'Optional witnesses (max 3 per case). Each entry: {name, description, direct:[{question,answer,supports,strength,requires_beat}], cross:[...]}. requires_beat is the INDEX into beats[] of a beat that must be played before the question can be asked. Composer + admin editor both manage this; server stores verbatim.';

-- ── submit_court_case_draft — pass-through for witnesses ───────────
-- Same shape as 20270523's existing RPC otherwise; just adds the
-- witnesses extraction. Composer client validates "if present,
-- complete" so the server can store the array verbatim.
CREATE OR REPLACE FUNCTION public.submit_court_case_draft(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_id        uuid;
    v_beats     jsonb;
    v_witnesses jsonb;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_payload IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_payload');
    END IF;

    v_beats := p_payload -> 'beats';
    IF v_beats IS NULL OR jsonb_typeof(v_beats) <> 'array'
       OR jsonb_array_length(v_beats) < 10 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'need_ten_beats');
    END IF;

    -- Witnesses: optional array. Default to []. Cap at 3 server-side
    -- as a defensive trim — composer already enforces this client-side.
    v_witnesses := COALESCE(p_payload -> 'witnesses', '[]'::jsonb);
    IF jsonb_typeof(v_witnesses) <> 'array' THEN
        v_witnesses := '[]'::jsonb;
    END IF;
    IF jsonb_array_length(v_witnesses) > 3 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'too_many_witnesses');
    END IF;

    INSERT INTO public.court_case_drafts (
        submitted_by_user_id, status,
        case_type, litigation_type,
        plaintiff_party_type, plaintiff_corp_type,
        defendant_party_type, defendant_corp_type,
        overview, beats, witnesses
    ) VALUES (
        v_uid, 'pending',
        COALESCE(p_payload ->> 'case_type', 'civil'),
        COALESCE(p_payload ->> 'litigation_type', ''),
        COALESCE(p_payload ->> 'plaintiff_party_type', 'person'),
        NULLIF(p_payload ->> 'plaintiff_corp_type', ''),
        COALESCE(p_payload ->> 'defendant_party_type', 'person'),
        NULLIF(p_payload ->> 'defendant_corp_type', ''),
        COALESCE(p_payload ->> 'overview', ''),
        v_beats,
        v_witnesses
    ) RETURNING id INTO v_id;

    RETURN jsonb_build_object('success', true, 'draft_id', v_id);
END $$;

REVOKE EXECUTE ON FUNCTION public.submit_court_case_draft(jsonb) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.submit_court_case_draft(jsonb) TO authenticated;

-- ── accept_court_case_draft — preserve witnesses on admin save ────
-- The admin editor on courtcaseadmin.html mirrors the composer
-- shape (Phase 2 of this Section VI work). For now the RPC stores
-- whatever the admin passes through; if the field is absent we keep
-- the existing value (COALESCE behaviour). Future tightening can
-- add per-field CHECK constraints once the schema is settled.
CREATE OR REPLACE FUNCTION public.accept_court_case_draft(
    p_draft_id uuid,
    p_payload  jsonb
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_draft        public.court_case_drafts%ROWTYPE;
    v_ent_id       uuid;
    v_beats        jsonb;
    v_witnesses    jsonb;
    v_credited     boolean := false;
    v_credit_amt   bigint  := 1000000;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF NOT public.is_court_admin() THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_admin');
    END IF;
    IF p_draft_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_draft_id');
    END IF;

    SELECT * INTO v_draft FROM public.court_case_drafts
     WHERE id = p_draft_id FOR UPDATE;
    IF v_draft.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'draft_not_found');
    END IF;
    IF v_draft.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_resolved',
            'status', v_draft.status);
    END IF;

    v_beats := p_payload -> 'beats';
    IF v_beats IS NULL OR jsonb_typeof(v_beats) <> 'array'
       OR jsonb_array_length(v_beats) < 10 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'need_ten_beats');
    END IF;

    -- Witnesses: if the admin sent them, use them. Otherwise keep the
    -- existing draft's witnesses (no admin edit to that section).
    v_witnesses := p_payload -> 'witnesses';
    IF v_witnesses IS NULL OR jsonb_typeof(v_witnesses) <> 'array' THEN
        v_witnesses := v_draft.witnesses;
    ELSIF jsonb_array_length(v_witnesses) > 3 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'too_many_witnesses');
    END IF;

    IF v_draft.submitted_by_user_id IS NOT NULL THEN
        SELECT id INTO v_ent_id FROM public.factions
         WHERE faction_type = 'entrepreneur'
           AND abandoned_at IS NULL
           AND (id = v_draft.submitted_by_user_id
                OR linked_user_id = v_draft.submitted_by_user_id)
         ORDER BY created_at ASC LIMIT 1
         FOR UPDATE;
        IF v_ent_id IS NOT NULL THEN
            UPDATE public.factions
               SET party_funds = COALESCE(party_funds, 0) + v_credit_amt
             WHERE id = v_ent_id;
            v_credited := true;
        END IF;
    END IF;

    UPDATE public.court_case_drafts
       SET status                = 'approved',
           case_type             = COALESCE(p_payload ->> 'case_type', case_type),
           litigation_type       = COALESCE(p_payload ->> 'litigation_type', litigation_type),
           plaintiff_party_type  = COALESCE(p_payload ->> 'plaintiff_party_type', plaintiff_party_type),
           plaintiff_corp_type   = NULLIF(p_payload ->> 'plaintiff_corp_type', ''),
           defendant_party_type  = COALESCE(p_payload ->> 'defendant_party_type', defendant_party_type),
           defendant_corp_type   = NULLIF(p_payload ->> 'defendant_corp_type', ''),
           overview              = COALESCE(p_payload ->> 'overview', overview),
           beats                 = v_beats,
           witnesses             = v_witnesses,
           accepted_at           = now(),
           accepted_by_user_id   = v_uid,
           entrepreneur_credited = v_credited
     WHERE id = p_draft_id;

    RETURN jsonb_build_object(
        'success', true,
        'draft_id', p_draft_id,
        'entrepreneur_credited', v_credited,
        'credit_amount', CASE WHEN v_credited THEN v_credit_amt ELSE 0 END
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.accept_court_case_draft(uuid, jsonb) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.accept_court_case_draft(uuid, jsonb) TO authenticated;

-- ── list_court_case_drafts — return witnesses to admin ──────────────
-- Re-author with witnesses in the payload (using the same
-- jsonb_build_object pattern 20270510 fixed). All other fields
-- preserved verbatim.
CREATE OR REPLACE FUNCTION public.list_court_case_drafts(p_status_filter text DEFAULT 'pending')
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_result jsonb;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF NOT public.is_court_admin() THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_admin');
    END IF;

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id',                    d.id,
        'submitted_by_user_id',  d.submitted_by_user_id,
        'submitter_email',       u.email,
        'status',                d.status,
        'case_type',             d.case_type,
        'litigation_type',       d.litigation_type,
        'plaintiff_party_type',  d.plaintiff_party_type,
        'plaintiff_corp_type',   d.plaintiff_corp_type,
        'defendant_party_type',  d.defendant_party_type,
        'defendant_corp_type',   d.defendant_corp_type,
        'overview',              d.overview,
        'beats',                 d.beats,
        'witnesses',             d.witnesses,
        'created_at',            d.created_at,
        'accepted_at',           d.accepted_at,
        'accepted_by_user_id',   d.accepted_by_user_id,
        'entrepreneur_credited', d.entrepreneur_credited
    ) ORDER BY d.created_at DESC), '[]'::jsonb)
      INTO v_result
      FROM public.court_case_drafts d
      LEFT JOIN auth.users u ON u.id = d.submitted_by_user_id
     WHERE p_status_filter IS NULL
        OR p_status_filter = 'all'
        OR d.status = p_status_filter;

    RETURN jsonb_build_object('success', true, 'drafts', v_result);
END $$;

REVOKE EXECUTE ON FUNCTION public.list_court_case_drafts(text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.list_court_case_drafts(text) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
