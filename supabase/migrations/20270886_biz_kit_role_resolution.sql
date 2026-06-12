-- ════════════════════════════════════════════════════════════════════
-- 20270886 — Businessman kit RPCs resolve by ROLE, not oldest character
--
-- The known follow-up flagged in bea8b3a: every kit helper resolved
-- the caller's businessman via ORDER BY created_at ASC LIMIT 1, so
-- on a multi-businessman account where the SECOND character holds
-- the desk job, the kit was a hard lockout (not_cmo / not_employed
-- regardless of which character the switcher shows).
--
-- Fix without touching ten RPC signatures: the ROLE disambiguates.
-- New _biz_role_check(uid, track, rung) selects the caller's
-- businessman WHO HOLDS THE HIRE ROW for that track/rung; the three
-- chief helpers become thin wrappers (same names + signatures, so
-- every caller — cmo/cco/product-engineer kits, plant expansion,
-- directives, envoy shipping, production_run wrappers — inherits
-- the fix with no re-emits). production_engineer_action and
-- sales_rep_action (which inlined the same oldest-first lookup)
-- re-emit from their 20270858 bodies on the new helper; their
-- no_businessman / not_employed reasons collapse into the accurate
-- not_production_engineer / not_sales_rep.
--
-- Edge: one account holding the SAME role at two corps resolves
-- oldest-first among the role-holders — ambiguous by nature, rare
-- by construction (one hire row per seat), and the cooldown lands
-- on the character that acted.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. The role resolver ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public._biz_role_check(
    p_uid   uuid,
    p_track text,
    p_rung  int
) RETURNS factions
LANGUAGE plpgsql
AS $$
DECLARE
    v_fac factions%ROWTYPE;
BEGIN
    SELECT f.* INTO v_fac FROM factions f
     WHERE (f.id = p_uid OR f.linked_user_id = p_uid)
       AND f.faction_type = 'businessman'
       AND f.abandoned_at IS NULL
       AND f.biz_employer_corp_id IS NOT NULL
       AND EXISTS (
            SELECT 1 FROM job_applicants a
              JOIN job_openings o ON o.id = a.opening_id
             WHERE a.applicant_faction_id = f.id
               AND a.status = 'hired'
               AND o.corp_id = f.biz_employer_corp_id
               AND o.track = p_track
               AND o.rung = p_rung
       )
     ORDER BY f.created_at ASC LIMIT 1
     FOR UPDATE;
    RETURN v_fac;   -- NULL-id row when no character holds the role
END $$;

REVOKE EXECUTE ON FUNCTION public._biz_role_check(uuid, text, int) FROM PUBLIC;

-- ── 2. The chief helpers become wrappers ──────────────────────────
CREATE OR REPLACE FUNCTION public._manufacturing_chief_check(p_uid uuid)
RETURNS factions
LANGUAGE plpgsql
AS $$
DECLARE
    v_fac factions%ROWTYPE;
BEGIN
    v_fac := _biz_role_check(p_uid, 'manufacturing', 6);
    IF v_fac.id IS NULL OR lower(COALESCE(v_fac.status, '')) = 'arrested' THEN
        RETURN NULL;
    END IF;
    RETURN v_fac;
END $$;

REVOKE EXECUTE ON FUNCTION public._manufacturing_chief_check(uuid) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public._commercial_chief_check(p_uid uuid)
RETURNS factions
LANGUAGE plpgsql
AS $$
DECLARE
    v_fac factions%ROWTYPE;
BEGIN
    v_fac := _biz_role_check(p_uid, 'commercial', 6);
    IF v_fac.id IS NULL OR lower(COALESCE(v_fac.status, '')) = 'arrested' THEN
        RETURN NULL;
    END IF;
    RETURN v_fac;
END $$;

REVOKE EXECUTE ON FUNCTION public._commercial_chief_check(uuid) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public._product_engineer_check(p_uid uuid)
RETURNS factions
LANGUAGE plpgsql
AS $$
DECLARE
    v_fac factions%ROWTYPE;
BEGIN
    v_fac := _biz_role_check(p_uid, 'product', 1);
    IF v_fac.id IS NULL OR lower(COALESCE(v_fac.status, '')) = 'arrested' THEN
        RETURN NULL;
    END IF;
    RETURN v_fac;
END $$;

REVOKE EXECUTE ON FUNCTION public._product_engineer_check(uuid) FROM PUBLIC;

-- ── 3. The two direct-lookup kits ─────────────────────────────────
CREATE OR REPLACE FUNCTION public.production_engineer_action(p_action text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid   uuid := auth.uid();
    v_fac   factions%ROWTYPE;
    v_tick int;
    v_res  jsonb;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_action NOT IN ('optimize_line', 'lean_procurement', 'tune_tooling') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    -- 20270886: resolve the caller's businessman WHO HOLDS THE ROLE
    -- (not the oldest character — the bea8b3a multi-character lockout).
    v_fac := _biz_role_check(v_uid, 'manufacturing', 1);
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_production_engineer');
    END IF;
    IF lower(COALESCE(v_fac.status, '')) = 'arrested' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'arrested');
    END IF;


    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_fac.biz_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    v_res := _apply_kit_charge(v_fac.biz_employer_corp_id, p_action);
    IF NOT COALESCE((v_res->>'success')::boolean, false) THEN
        RETURN v_res;
    END IF;
    UPDATE factions SET biz_action_tick = v_tick WHERE id = v_fac.id;
    RETURN v_res;
END $$;

REVOKE EXECUTE ON FUNCTION public.production_engineer_action(text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.production_engineer_action(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.sales_rep_action(p_action text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid   uuid := auth.uid();
    v_fac   factions%ROWTYPE;
    v_tick  int;
    v_res   jsonb;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_action NOT IN ('drum_up_buyers', 'sharpen_pitch', 'sweeten_financing') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    -- 20270886: resolve the caller's businessman WHO HOLDS THE ROLE
    -- (not the oldest character — the bea8b3a multi-character lockout).
    v_fac := _biz_role_check(v_uid, 'commercial', 1);
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_sales_rep');
    END IF;
    IF lower(COALESCE(v_fac.status, '')) = 'arrested' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'arrested');
    END IF;


    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_fac.biz_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    v_res := _apply_kit_charge(v_fac.biz_employer_corp_id, p_action);
    IF NOT COALESCE((v_res->>'success')::boolean, false) THEN
        RETURN v_res;
    END IF;
    UPDATE factions SET biz_action_tick = v_tick WHERE id = v_fac.id;
    RETURN v_res;
END $$;

REVOKE EXECUTE ON FUNCTION public.sales_rep_action(text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.sales_rep_action(text) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
