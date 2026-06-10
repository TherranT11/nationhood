-- ════════════════════════════════════════════════════════════════════
-- 20270800 — Executive Actions: Draft Blueprint (+ the action allowance)
--
-- The first of the five Executive Action slots goes live. Draft
-- Blueprint designs a proprietary structural template the corp can
-- later build from.
--
--   entrepreneur_corps.exec_action_tick: the last tick an executive
--   action was spent. The "1 remaining" pill finally derives —
--   current_tick > exec_action_tick means one action is available
--   this tick. Every future executive action RPC checks and stamps
--   this same column.
--
--   corp_blueprints: the drafted template. Residential is the only
--   chartered category (the CHECK widens as Tier I-III Commercial /
--   Industrial / Military are designed). Building type and quality
--   tier from the modal; materials_needed / equipment_needed are the
--   residential baselines (1 / light) until a real cost model lands;
--   the assigned Project Manager is a hired job_applicants row (works
--   for NPC and player hires alike). Build city is the corp's HQ.
--
--   Experience Point allocation into Speed / Procurement / Quality is
--   the mechanic's end state, but corps don't accumulate EP yet —
--   drafting is free until the EP ledger exists.
--
--   draft_blueprint RPC: owner-only (businessman, not arrested),
--   construction corps, residential only, valid type/tier, PM must be
--   a hired applicant on this corp's openings, one executive action
--   per tick (corp row locked FOR UPDATE so a double-click can't
--   spend the allowance twice).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.entrepreneur_corps
    ADD COLUMN IF NOT EXISTS exec_action_tick int;

CREATE TABLE IF NOT EXISTS public.corp_blueprints (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    corp_id          uuid NOT NULL REFERENCES public.entrepreneur_corps(id) ON DELETE CASCADE,
    category         text NOT NULL CHECK (category IN ('residential')),
    city             text NOT NULL,
    building_type    text NOT NULL CHECK (building_type IN
                         ('single_story_home', 'double_story', 'multitenant_living')),
    quality_tier     text NOT NULL CHECK (quality_tier IN
                         ('low_cost', 'standard', 'high_end', 'luxury', 'ultra_rich')),
    materials_needed int  NOT NULL DEFAULT 1,
    equipment_needed text NOT NULL DEFAULT 'light',
    pm_applicant_id  uuid REFERENCES public.job_applicants(id) ON DELETE SET NULL,
    created_at_tick  int  NOT NULL DEFAULT 0,
    created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS corp_blueprints_corp_idx
    ON public.corp_blueprints (corp_id);

ALTER TABLE public.corp_blueprints ENABLE ROW LEVEL SECURITY;

-- Public game data like the rest of the corp registry; writes only
-- through the RPC.
DROP POLICY IF EXISTS "Allow select for all" ON public.corp_blueprints;
CREATE POLICY "Allow select for all" ON public.corp_blueprints
    FOR SELECT USING (true);

-- ── draft_blueprint ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.draft_blueprint(
    p_corp_id         uuid,
    p_category        text,
    p_building_type   text,
    p_quality_tier    text,
    p_pm_applicant_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid  uuid := auth.uid();
    v_fac  factions%ROWTYPE;
    v_corp entrepreneur_corps%ROWTYPE;
    v_pm   job_applicants%ROWTYPE;
    v_tick int;
    v_id   uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL OR p_pm_applicant_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_category IS DISTINCT FROM 'residential' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'category_not_chartered');
    END IF;
    IF p_building_type NOT IN ('single_story_home', 'double_story', 'multitenant_living')
       OR p_quality_tier NOT IN ('low_cost', 'standard', 'high_end', 'luxury', 'ultra_rich') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    -- Lock the corp row: the per-tick allowance check below must
    -- serialize against a concurrent draft.
    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.industry <> 'construction' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'industry_not_chartered');
    END IF;

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

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_corp.exec_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    -- The assigned PM must be someone this corp actually hired.
    SELECT a.* INTO v_pm
      FROM job_applicants a
      JOIN job_openings o ON o.id = a.opening_id
     WHERE a.id = p_pm_applicant_id
       AND o.corp_id = p_corp_id
       AND a.status = 'hired';
    IF v_pm.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'pm_not_found');
    END IF;

    INSERT INTO corp_blueprints (
        corp_id, category, city, building_type, quality_tier,
        pm_applicant_id, created_at_tick
    ) VALUES (
        p_corp_id, p_category, COALESCE(v_corp.hq_city, '—'),
        p_building_type, p_quality_tier, p_pm_applicant_id, v_tick
    ) RETURNING id INTO v_id;

    UPDATE entrepreneur_corps SET exec_action_tick = v_tick WHERE id = p_corp_id;

    RETURN jsonb_build_object('success', true, 'blueprint_id', v_id);
END $$;

REVOKE EXECUTE ON FUNCTION public.draft_blueprint(uuid, text, text, text, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.draft_blueprint(uuid, text, text, text, uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
