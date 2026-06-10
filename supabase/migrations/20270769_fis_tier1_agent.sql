-- ════════════════════════════════════════════════════════════════════
-- 20270769 — Federal Investigations Tier 1 (Agent) mechanic
--
-- Wires the Foreign Investigations Service Tier 1 rung from inert
-- flavor (7aa6175) into a playable surface:
--
--   1. [Join the Academy] activates the rung. Stamps the join tick,
--      grants +1 Experience (politician_skill) and +1 Influence
--      (politician_influence). Logs to career events + event_log.
--
--   2. As an Agent, three repeatable actions become available
--      (shared per-tick cooldown via next_fis_action_tick):
--        • Begin Investigation — opens a long-running case row
--        • Run Field Ops       — +0.5 Experience
--        • Make Friends at the Bureau — +0.3 Influence
--
--   3. Begin Investigation creates a fis_investigations row. v1
--      only supports category='financial_crimes' (corruption and
--      anti_terrorism live in the enum for the modal's greyed-out
--      buttons but the RPC rejects them as 'category_not_unlocked'
--      until the mechanics land). target_corp_id is denormalized
--      with target_corp_name so the case survives the corp's
--      bankruptcy / deletion.
--
--   4. Active investigations surface as persistent Pressing Issues
--      cards via list_active_fis_investigations_for_agent, mirroring
--      the existing pressing-issues fetch pattern on
--      politician-home.
--
-- Schema:
--   factions.politician_fis_joined_at_tick   int — set on academy pass
--   factions.next_fis_action_tick            int — per-tick action lock
--   fis_investigations                       table (one row per case)
--
-- Cooldown convention matches MP: actions burn the tick by stamping
-- next_fis_action_tick = current_tick + 1. Per-tick gate identical
-- to next_member_action_tick in shape.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Schema ────────────────────────────────────────────────────
ALTER TABLE public.factions
    ADD COLUMN IF NOT EXISTS politician_fis_joined_at_tick int,
    ADD COLUMN IF NOT EXISTS next_fis_action_tick          int;

COMMENT ON COLUMN public.factions.politician_fis_joined_at_tick IS
    'Tick the politician passed FIS academy onboarding. NULL until they join. Drives the FIS Tier 1 (Agent) rung''s held() check and the politician-home Agent affiliation card. 20270769.';

CREATE TABLE IF NOT EXISTS public.fis_investigations (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_faction_id  uuid NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    category          text NOT NULL CHECK (category IN ('financial_crimes','corruption','anti_terrorism')),
    -- target_corp_id is allowed to go NULL if the corp is later
    -- disbanded/bankrupted; target_corp_name is denormalized so the
    -- case still reads sensibly. ON DELETE SET NULL on the FK.
    target_corp_id    uuid REFERENCES entrepreneur_corps(id) ON DELETE SET NULL,
    target_corp_name  text NOT NULL,
    status            text NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active','closed','dismissed')),
    opened_at_tick    int  NOT NULL,
    closed_at_tick    int,
    created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS fis_investigations_agent_active_idx
    ON public.fis_investigations (agent_faction_id, status)
    WHERE status = 'active';
CREATE INDEX IF NOT EXISTS fis_investigations_target_idx
    ON public.fis_investigations (target_corp_id);

COMMENT ON TABLE public.fis_investigations IS
    'FIS agent investigations. One row per case opened by an Agent (politician_fis_joined_at_tick set). target_corp_id can go NULL if the corp later disbands; target_corp_name survives. status=active until closed by the case-resolution flow (out of scope for 20270769). 20270769.';

ALTER TABLE public.fis_investigations ENABLE ROW LEVEL SECURITY;

-- Reads: any authenticated user (FIS records are public-record on the
-- politician-home Pressing Issues card; matching the bar-exam/career
-- events posture).
DROP POLICY IF EXISTS fis_investigations_select ON public.fis_investigations;
CREATE POLICY fis_investigations_select ON public.fis_investigations
    FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS fis_investigations_service_all ON public.fis_investigations;
CREATE POLICY fis_investigations_service_all ON public.fis_investigations
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── 2. politician_fis_join_academy ───────────────────────────────
CREATE OR REPLACE FUNCTION public.politician_fis_join_academy(p_faction_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_tick      int;
    v_full_name text;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
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
    IF v_pol.politician_fis_joined_at_tick IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_agent');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE factions
       SET politician_fis_joined_at_tick = v_tick,
           politician_skill              = COALESCE(politician_skill, 0) + 1,
           politician_influence          = COALESCE(politician_influence, 0) + 1
     WHERE id = v_pol.id;

    v_full_name := btrim(COALESCE(v_pol.leader_first_name, '') || ' ' || COALESCE(v_pol.leader_last_name, ''));
    IF length(v_full_name) = 0 THEN
        v_full_name := COALESCE(v_pol.faction_name, 'A politician');
    END IF;

    INSERT INTO politician_career_events (faction_id, event_tick, event_type, target_name, metadata)
    VALUES (
        v_pol.id, v_tick, 'fis_academy_passed', '',
        jsonb_build_object('skill_delta', 1, 'influence_delta', 1)
    );

    INSERT INTO event_log (
        nation_id, faction_id,
        event_name, description_used,
        category, trigger_key, fired_at_tick
    ) VALUES (
        v_pol.nation_id, v_pol.id,
        'FIS Academy Passed',
        v_full_name || ' has joined the Federal Investigations Service as a probationary agent.',
        'politician', 'politician_passed_fis_academy', v_tick
    );

    RETURN jsonb_build_object(
        'success',        true,
        'joined_at_tick', v_tick,
        'skill_delta',    1,
        'influence_delta',1
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.politician_fis_join_academy(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.politician_fis_join_academy(uuid) TO authenticated;

-- ── 3. list_fis_targetable_corps_for_agent ───────────────────────
-- Distinct entrepreneur corps with at least one completed building
-- in the agent's nation. corp_buildings.owner_corp_id reflects
-- CURRENT ownership (per 20270427 disband-liquidation pattern), so
-- a building that flipped to NULL on a bankruptcy doesn't surface
-- its former owner.
CREATE OR REPLACE FUNCTION public.list_fis_targetable_corps_for_agent(p_faction_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid    uuid := auth.uid();
    v_pol    factions%ROWTYPE;
    v_result jsonb;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.politician_fis_joined_at_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_agent');
    END IF;
    IF v_pol.nation_id IS NULL THEN
        RETURN jsonb_build_object('success', true, 'corps', '[]'::jsonb);
    END IF;

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'corp_id',  ec.id,
                'name',     ec.name,
                'industry', ec.industry
           ) ORDER BY ec.name), '[]'::jsonb)
      INTO v_result
      FROM entrepreneur_corps ec
     WHERE EXISTS (
         SELECT 1 FROM corp_buildings cb
          WHERE cb.owner_corp_id = ec.id
            AND cb.nation_id     = v_pol.nation_id
            AND cb.status        = 'completed'
     );

    RETURN jsonb_build_object('success', true, 'corps', v_result);
END $$;

REVOKE EXECUTE ON FUNCTION public.list_fis_targetable_corps_for_agent(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.list_fis_targetable_corps_for_agent(uuid) TO authenticated;

-- ── 4. politician_fis_begin_investigation ────────────────────────
CREATE OR REPLACE FUNCTION public.politician_fis_begin_investigation(
    p_faction_id     uuid,
    p_category       text,
    p_target_corp_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_corp      entrepreneur_corps%ROWTYPE;
    v_tick      int;
    v_id        uuid;
    v_full_name text;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL OR p_target_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    -- Category enum is forward-compatible with corruption / anti_terrorism
    -- so the modal's greyed buttons can light up later without an enum
    -- migration. Only financial_crimes is unlocked in v1.
    IF p_category IS NULL OR p_category NOT IN ('financial_crimes','corruption','anti_terrorism') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_category');
    END IF;
    IF p_category <> 'financial_crimes' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'category_not_unlocked',
            'category', p_category);
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
    IF v_pol.politician_fis_joined_at_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_agent');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF v_pol.next_fis_action_tick IS NOT NULL
       AND v_pol.next_fis_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_fis_action_tick);
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_target_corp_id;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'target_not_found');
    END IF;
    -- Target must hold at least one completed building in the agent's
    -- nation. Same gate the list RPC enforces.
    IF NOT EXISTS (
        SELECT 1 FROM corp_buildings
         WHERE owner_corp_id = v_corp.id
           AND nation_id     = v_pol.nation_id
           AND status        = 'completed'
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'target_not_in_nation');
    END IF;

    INSERT INTO fis_investigations (
        agent_faction_id, category, target_corp_id, target_corp_name,
        opened_at_tick
    ) VALUES (
        v_pol.id, p_category, v_corp.id, v_corp.name,
        v_tick
    ) RETURNING id INTO v_id;

    UPDATE factions
       SET next_fis_action_tick = v_tick + 1
     WHERE id = v_pol.id;

    v_full_name := btrim(COALESCE(v_pol.leader_first_name, '') || ' ' || COALESCE(v_pol.leader_last_name, ''));
    IF length(v_full_name) = 0 THEN
        v_full_name := COALESCE(v_pol.faction_name, 'An FIS agent');
    END IF;

    INSERT INTO politician_career_events (faction_id, event_tick, event_type, target_name, metadata)
    VALUES (
        v_pol.id, v_tick, 'fis_investigation_opened', v_corp.name,
        jsonb_build_object('investigation_id', v_id, 'category', p_category, 'target_corp_id', v_corp.id)
    );

    INSERT INTO event_log (
        nation_id, faction_id,
        event_name, description_used,
        category, trigger_key, fired_at_tick
    ) VALUES (
        v_pol.nation_id, v_pol.id,
        'Investigation Opened',
        v_full_name || ' has opened a Federal Investigations Service inquiry into ' || v_corp.name || '.',
        'politician', 'politician_fis_investigation_opened', v_tick
    );

    RETURN jsonb_build_object(
        'success',          true,
        'investigation_id', v_id,
        'target_corp_id',   v_corp.id,
        'target_corp_name', v_corp.name,
        'category',         p_category,
        'opened_at_tick',   v_tick,
        'next_action_tick', v_tick + 1
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.politician_fis_begin_investigation(uuid, text, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.politician_fis_begin_investigation(uuid, text, uuid) TO authenticated;

-- ── 5. politician_fis_run_field_ops ──────────────────────────────
-- +0.5 Experience (politician_skill). Per-tick cooldown shared with
-- begin_investigation + make_friends via next_fis_action_tick.
CREATE OR REPLACE FUNCTION public.politician_fis_run_field_ops(p_faction_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_pol     factions%ROWTYPE;
    v_tick    int;
    v_new_pol numeric;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
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
    IF v_pol.politician_fis_joined_at_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_agent');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF v_pol.next_fis_action_tick IS NOT NULL
       AND v_pol.next_fis_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_fis_action_tick);
    END IF;

    UPDATE factions
       SET politician_skill     = COALESCE(politician_skill, 0) + 0.5,
           next_fis_action_tick = v_tick + 1
     WHERE id = v_pol.id
    RETURNING politician_skill INTO v_new_pol;

    RETURN jsonb_build_object(
        'success',          true,
        'skill_delta',      0.5,
        'new_skill',        v_new_pol,
        'next_action_tick', v_tick + 1
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.politician_fis_run_field_ops(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.politician_fis_run_field_ops(uuid) TO authenticated;

-- ── 6. politician_fis_make_friends ───────────────────────────────
-- +0.3 Influence (politician_influence). Shares the cooldown.
CREATE OR REPLACE FUNCTION public.politician_fis_make_friends(p_faction_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_pol     factions%ROWTYPE;
    v_tick    int;
    v_new_inf numeric;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
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
    IF v_pol.politician_fis_joined_at_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_agent');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF v_pol.next_fis_action_tick IS NOT NULL
       AND v_pol.next_fis_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_fis_action_tick);
    END IF;

    UPDATE factions
       SET politician_influence = COALESCE(politician_influence, 0) + 0.3,
           next_fis_action_tick = v_tick + 1
     WHERE id = v_pol.id
    RETURNING politician_influence INTO v_new_inf;

    RETURN jsonb_build_object(
        'success',          true,
        'influence_delta',  0.3,
        'new_influence',    v_new_inf,
        'next_action_tick', v_tick + 1
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.politician_fis_make_friends(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.politician_fis_make_friends(uuid) TO authenticated;

-- ── 7. list_active_fis_investigations_for_agent ──────────────────
-- Pressing Issues source. Returns the active cases for the agent so
-- politician-home can render one persistent card per open case.
CREATE OR REPLACE FUNCTION public.list_active_fis_investigations_for_agent(p_faction_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid    uuid := auth.uid();
    v_pol    factions%ROWTYPE;
    v_result jsonb;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'investigation_id', id,
                'category',         category,
                'target_corp_id',   target_corp_id,
                'target_corp_name', target_corp_name,
                'opened_at_tick',   opened_at_tick
           ) ORDER BY opened_at_tick DESC), '[]'::jsonb)
      INTO v_result
      FROM fis_investigations
     WHERE agent_faction_id = v_pol.id
       AND status           = 'active';

    RETURN jsonb_build_object('success', true, 'investigations', v_result);
END $$;

REVOKE EXECUTE ON FUNCTION public.list_active_fis_investigations_for_agent(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.list_active_fis_investigations_for_agent(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
