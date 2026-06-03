-- ════════════════════════════════════════════════════════════════════
-- 20270579 — Player-filed corp lawsuit: schema + evidence bucket
--
-- Adds the columns court_case_trials needs to represent a lawsuit
-- one entrepreneur corp files against another, and provisions the
-- Supabase Storage bucket their counsel's evidence beats live in.
--
-- The trial table already covers everything procedural (status,
-- advocates, magistrate, rounds, verdict) — what was missing is the
-- party identity (which corps are at the bar) and the statement of
-- claim. Three new columns + a stash flag:
--
--   plaintiff_corp_id  uuid  — who's suing (FK entrepreneur_corps)
--   defendant_corp_id  uuid  — who's being sued
--   claim_text         text  — the statement of claim as filed
--   filed_by_player    bool  — distinguishes these rows from cases
--                              drawn out of court_case_drafts so the
--                              old random-case math doesn't trip on
--                              a player-filed row with empty beats
--                              when nobody seeded one. Default false
--                              keeps every legacy row identifiably a
--                              draft-drawn case.
--
-- Bucket: lawsuit-evidence (public, 2MB cap, MIME-restricted to the
-- five formats the modal accepts). Each uploaded file becomes a
-- support='plaintiff' beat on the synthesized draft row that backs
-- the trial (see 20270580). Public-read matches the party-logos
-- precedent; if discovery / sealed-evidence is a future requirement,
-- swap to signed URLs and tighten the SELECT policy.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── court_case_trials columns ──────────────────────────────────────
ALTER TABLE public.court_case_trials
    ADD COLUMN IF NOT EXISTS plaintiff_corp_id uuid REFERENCES public.entrepreneur_corps(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS defendant_corp_id uuid REFERENCES public.entrepreneur_corps(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS claim_text        text,
    ADD COLUMN IF NOT EXISTS filed_by_player   boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.court_case_trials.plaintiff_corp_id IS
    'When the trial was player-filed (file_corp_lawsuit), the corp that brought the suit. SET NULL on corp delete so the case survives but stops referencing a ghost.';
COMMENT ON COLUMN public.court_case_trials.defendant_corp_id IS
    'When the trial was player-filed, the corp being sued. SET NULL on corp delete.';
COMMENT ON COLUMN public.court_case_trials.claim_text IS
    'Statement of claim as filed by the plaintiff CEO. NULL for cases drawn from court_case_drafts.';
COMMENT ON COLUMN public.court_case_trials.filed_by_player IS
    'True when the trial was created via file_corp_lawsuit. The synthesized draft row carries empty beats unless evidence was attached; this flag lets the verdict path and the legal-cases display branch on player-filed vs. draft-drawn without re-reading the draft.';

-- ── Storage bucket for evidence ─────────────────────────────────────
-- 2 MB per file matches the modal's stated limit. MIME restriction
-- enforces the modal's accepted formats server-side; the client list
-- is informational only.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'lawsuit-evidence',
    'lawsuit-evidence',
    true,
    2097152,
    ARRAY[
        'application/pdf',
        'image/png',
        'image/jpeg',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users can upload (the file_corp_lawsuit RPC re-checks
-- ownership; the bucket policy only enforces "must be signed in").
CREATE POLICY "Authenticated users can upload lawsuit evidence"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'lawsuit-evidence');

CREATE POLICY "Anyone can view lawsuit evidence"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'lawsuit-evidence');

NOTIFY pgrst, 'reload schema';

COMMIT;
