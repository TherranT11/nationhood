-- ════════════════════════════════════════════════════════════════════
-- 20270508 — Court Case Drafts + admin moderation queue
--
-- courtcase.html lets any logged-in player compose a case (parties,
-- nature of the dispute, ten beats). On Submit, the draft enters a
-- moderation queue; an admin reviews it on courtcaseadmin.html, may
-- edit any field, then Accepts — at which point the submitter's
-- entrepreneur faction is credited $1M and the case is approved for
-- the docket. (Drawing approved cases via Take a Case lands later.)
--
-- This migration ships:
--   • court_case_drafts table (parties + overview + 10 beats jsonb +
--     status + audit columns)
--   • is_court_admin() — true iff auth.email() = 'therrant@gmail.com'.
--     The email lives ONLY in this SQL; client JS never carries it.
--   • submit_court_case_draft(p_payload jsonb) — any authed user
--   • list_court_case_drafts(p_status_filter text) — admin only
--   • accept_court_case_draft(p_draft_id uuid, p_payload jsonb) —
--     admin only; rewrites the row with the admin's edits, marks it
--     approved, credits the submitter's entrepreneur faction
--     party_funds += $1,000,000. Returns whether the credit landed
--     (skipped if the submitter has no entrepreneur faction).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE TABLE IF NOT EXISTS public.court_case_drafts (
    id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    submitted_by_user_id  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    status                text NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending', 'approved', 'rejected')),
    case_type             text NOT NULL
                              CHECK (case_type IN ('civil', 'criminal', 'commercial')),
    litigation_type       text NOT NULL,
    plaintiff_party_type  text NOT NULL
                              CHECK (plaintiff_party_type IN ('person', 'corporation')),
    plaintiff_corp_type   text,
    defendant_party_type  text NOT NULL
                              CHECK (defendant_party_type IN ('person', 'corporation')),
    defendant_corp_type   text,
    overview              text NOT NULL,
    beats                 jsonb NOT NULL,
    created_at            timestamptz NOT NULL DEFAULT now(),
    accepted_at           timestamptz,
    accepted_by_user_id   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    entrepreneur_credited boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS court_case_drafts_status_idx
    ON public.court_case_drafts (status, created_at DESC);

-- RLS: deny direct table access. All paths run through SECURITY DEFINER RPCs.
ALTER TABLE public.court_case_drafts ENABLE ROW LEVEL SECURITY;

-- ── is_court_admin ──────────────────────────────────────────────────
-- Single source of truth for the admin gate. The email lives ONLY
-- here; client JS calls this RPC and trusts the boolean, so the admin
-- identity is never embedded in the frontend bundle.
CREATE OR REPLACE FUNCTION public.is_court_admin()
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_email text;
BEGIN
    SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();
    RETURN COALESCE(v_email = 'therrant@gmail.com', false);
END $$;

REVOKE EXECUTE ON FUNCTION public.is_court_admin() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.is_court_admin() TO authenticated;

-- ── submit_court_case_draft ─────────────────────────────────────────
-- p_payload shape:
--   {
--     case_type, litigation_type,
--     plaintiff_party_type, plaintiff_corp_type,
--     defendant_party_type, defendant_corp_type,
--     overview,
--     beats: [ { type, description, strength }, ... ]
--   }
CREATE OR REPLACE FUNCTION public.submit_court_case_draft(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid   uuid := auth.uid();
    v_id    uuid;
    v_beats jsonb;
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

    INSERT INTO public.court_case_drafts (
        submitted_by_user_id, status,
        case_type, litigation_type,
        plaintiff_party_type, plaintiff_corp_type,
        defendant_party_type, defendant_corp_type,
        overview, beats
    ) VALUES (
        v_uid, 'pending',
        COALESCE(p_payload ->> 'case_type', 'civil'),
        COALESCE(p_payload ->> 'litigation_type', ''),
        COALESCE(p_payload ->> 'plaintiff_party_type', 'person'),
        NULLIF(p_payload ->> 'plaintiff_corp_type', ''),
        COALESCE(p_payload ->> 'defendant_party_type', 'person'),
        NULLIF(p_payload ->> 'defendant_corp_type', ''),
        COALESCE(p_payload ->> 'overview', ''),
        v_beats
    ) RETURNING id INTO v_id;

    RETURN jsonb_build_object('success', true, 'draft_id', v_id);
END $$;

REVOKE EXECUTE ON FUNCTION public.submit_court_case_draft(jsonb) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.submit_court_case_draft(jsonb) TO authenticated;

-- ── list_court_case_drafts ──────────────────────────────────────────
-- Admin-only. Returns the queue plus the submitter's email so the
-- admin can see who filed what without a separate lookup.
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

    SELECT COALESCE(jsonb_agg(row_to_jsonb(d) || jsonb_build_object(
        'submitter_email', u.email
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

-- ── accept_court_case_draft ─────────────────────────────────────────
-- Admin-only. Rewrites the draft with the admin's edits (any field),
-- marks it approved, credits the submitter's entrepreneur faction
-- party_funds += $1,000,000. If the submitter has no entrepreneur
-- (or it's abandoned), the case still approves but the credit is
-- skipped and entrepreneur_credited stays false.
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

    -- Credit the submitter's entrepreneur faction. Same column the
    -- corp disband / loan paydown helpers use (party_funds doubles
    -- as personal liquid cash for the entrepreneur faction type).
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
       SET status               = 'approved',
           case_type            = COALESCE(p_payload ->> 'case_type', case_type),
           litigation_type      = COALESCE(p_payload ->> 'litigation_type', litigation_type),
           plaintiff_party_type = COALESCE(p_payload ->> 'plaintiff_party_type', plaintiff_party_type),
           plaintiff_corp_type  = NULLIF(p_payload ->> 'plaintiff_corp_type', ''),
           defendant_party_type = COALESCE(p_payload ->> 'defendant_party_type', defendant_party_type),
           defendant_corp_type  = NULLIF(p_payload ->> 'defendant_corp_type', ''),
           overview             = COALESCE(p_payload ->> 'overview', overview),
           beats                = v_beats,
           accepted_at          = now(),
           accepted_by_user_id  = v_uid,
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

NOTIFY pgrst, 'reload schema';

COMMIT;
