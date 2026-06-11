-- ════════════════════════════════════════════════════════════════════
-- 20270867 — The DCM's regional actions
--
-- One move per tick (next_dcm_action_tick, design ruling — the boss
-- rank picks review OR priority OR summit each day):
--
-- · dcm_review_station — inspect one officer on the Station Board
--   and GRADE them: commend (+1) or reprimand (−1) to their embassy
--   Reputation, +0.3 Experience to the DCM. Management as judgment,
--   not puppetry — subordinates are players.
--
-- · dcm_set_priority — a standing ask flagged on one station,
--   rendered as a banner on the officer's own card. Two enforceable
--   kinds, fulfilled by single hooks in the officer RPCs
--   (re-emitted from their latest emissions with one PERFORM line):
--     work_the_docket → consul_handle_case
--     build_standing  → consul_build_network / politician_build_contacts
--   Compliance pays +0.3 Experience to BOTH. A new priority
--   supersedes the old; nobody's agency is overridden.
--
-- · dcm_call_summit — the big lever: $20 embassy budget, and every
--   officer on the board gets a Pressing Issues invite (consuls
--   included — they hold the staffed stations). Each ACCEPT lands
--   +1 Relations between the home nation and that officer's posting,
--   immediately. Coverage multiplies the lever, which loops back to
--   the Station Board's nag. One summit open at a time.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.factions
    ADD COLUMN IF NOT EXISTS next_dcm_action_tick int;

CREATE TABLE IF NOT EXISTS public.regional_summits (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    dcm_faction_id  uuid NOT NULL REFERENCES public.factions(id) ON DELETE CASCADE,
    region          text NOT NULL,
    cost            int  NOT NULL,
    created_at_tick int  NOT NULL,
    created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.summit_invites (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    summit_id          uuid NOT NULL REFERENCES public.regional_summits(id) ON DELETE CASCADE,
    officer_faction_id uuid NOT NULL REFERENCES public.factions(id) ON DELETE CASCADE,
    nation_id          uuid NOT NULL,
    status             text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at_tick    int  NOT NULL,
    created_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS summit_invites_officer_idx
    ON public.summit_invites (officer_faction_id) WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS public.dcm_priorities (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    dcm_faction_id     uuid NOT NULL REFERENCES public.factions(id) ON DELETE CASCADE,
    officer_faction_id uuid NOT NULL REFERENCES public.factions(id) ON DELETE CASCADE,
    kind               text NOT NULL CHECK (kind IN ('work_the_docket', 'build_standing')),
    status             text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled', 'superseded')),
    created_at_tick    int  NOT NULL,
    created_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS dcm_priorities_officer_idx
    ON public.dcm_priorities (officer_faction_id) WHERE status = 'pending';

ALTER TABLE public.regional_summits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow select for all" ON public.regional_summits;
CREATE POLICY "Allow select for all" ON public.regional_summits FOR SELECT USING (true);
ALTER TABLE public.summit_invites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow select for all" ON public.summit_invites;
CREATE POLICY "Allow select for all" ON public.summit_invites FOR SELECT USING (true);
ALTER TABLE public.dcm_priorities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow select for all" ON public.dcm_priorities;
CREATE POLICY "Allow select for all" ON public.dcm_priorities FOR SELECT USING (true);

-- ── _dcm_check — eligibility, the chief-check shape ───────────────
CREATE OR REPLACE FUNCTION public._dcm_check(p_uid uuid, p_faction_id uuid)
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
       OR v_fac.politician_dcm_region IS NULL THEN
        RETURN NULL;
    END IF;
    RETURN v_fac;
END $$;

REVOKE EXECUTE ON FUNCTION public._dcm_check(uuid, uuid) FROM PUBLIC;

-- ── _dcm_officer_station — is this officer on the DCM's board? ────
-- Returns the officer's posting nation when they serve the DCM's
-- home nation inside the region; NULL otherwise. The one source the
-- review, priority, and summit RPCs all share.
CREATE OR REPLACE FUNCTION public._dcm_officer_station(
    p_home uuid, p_region text, p_officer_id uuid
) RETURNS uuid
LANGUAGE sql STABLE
AS $$
    SELECT COALESCE(f.politician_consul_nation_id, f.politician_foreign_service_nation_id)
      FROM factions f
      JOIN nations n ON n.id = COALESCE(f.politician_consul_nation_id,
                                        f.politician_foreign_service_nation_id)
     WHERE f.id = p_officer_id
       AND f.faction_type = 'politician'
       AND f.abandoned_at IS NULL
       AND f.nation_id = p_home
       AND n.continent = p_region;
$$;

REVOKE EXECUTE ON FUNCTION public._dcm_officer_station(uuid, text, uuid) FROM PUBLIC;

-- ── _fulfill_priority — compliance pays both sides ────────────────
CREATE OR REPLACE FUNCTION public._fulfill_priority(p_officer_id uuid, p_kind text)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    v_pri dcm_priorities%ROWTYPE;
BEGIN
    SELECT * INTO v_pri FROM dcm_priorities
     WHERE officer_faction_id = p_officer_id AND kind = p_kind AND status = 'pending'
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE SKIP LOCKED;
    IF v_pri.id IS NULL THEN RETURN; END IF;
    UPDATE dcm_priorities SET status = 'fulfilled' WHERE id = v_pri.id;
    UPDATE factions SET politician_skill = COALESCE(politician_skill, 0) + 0.3
     WHERE id IN (v_pri.officer_faction_id, v_pri.dcm_faction_id);
END $$;

REVOKE EXECUTE ON FUNCTION public._fulfill_priority(uuid, text) FROM PUBLIC;

-- ── dcm_review_station ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.dcm_review_station(
    p_faction_id uuid,
    p_officer_id uuid,
    p_grade      text
) RETURNS jsonb
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
    IF p_officer_id IS NULL OR p_grade NOT IN ('commend', 'reprimand') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    v_fac := _dcm_check(v_uid, p_faction_id);
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_dcm');
    END IF;
    IF _dcm_officer_station(v_fac.nation_id, v_fac.politician_dcm_region, p_officer_id) IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_your_officer');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF v_fac.next_dcm_action_tick IS NOT NULL AND v_fac.next_dcm_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_fac.next_dcm_action_tick);
    END IF;

    UPDATE factions
       SET embassy_reputation = GREATEST(0, LEAST(100,
               COALESCE(embassy_reputation, 50) + CASE p_grade WHEN 'commend' THEN 1 ELSE -1 END))
     WHERE id = p_officer_id;
    UPDATE factions
       SET politician_skill     = COALESCE(politician_skill, 0) + 0.3,
           next_dcm_action_tick = v_tick + 1
     WHERE id = v_fac.id;

    RETURN jsonb_build_object('success', true, 'grade', p_grade);
END $$;

REVOKE EXECUTE ON FUNCTION public.dcm_review_station(uuid, uuid, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.dcm_review_station(uuid, uuid, text) TO authenticated;

-- ── dcm_set_priority ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.dcm_set_priority(
    p_faction_id uuid,
    p_officer_id uuid,
    p_kind       text
) RETURNS jsonb
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
    IF p_officer_id IS NULL OR p_kind NOT IN ('work_the_docket', 'build_standing') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    v_fac := _dcm_check(v_uid, p_faction_id);
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_dcm');
    END IF;
    IF _dcm_officer_station(v_fac.nation_id, v_fac.politician_dcm_region, p_officer_id) IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_your_officer');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF v_fac.next_dcm_action_tick IS NOT NULL AND v_fac.next_dcm_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_fac.next_dcm_action_tick);
    END IF;

    -- A standing ask: the new priority supersedes the old.
    UPDATE dcm_priorities SET status = 'superseded'
     WHERE dcm_faction_id = v_fac.id AND status = 'pending';

    INSERT INTO dcm_priorities (dcm_faction_id, officer_faction_id, kind, created_at_tick)
    VALUES (v_fac.id, p_officer_id, p_kind, v_tick);

    UPDATE factions SET next_dcm_action_tick = v_tick + 1 WHERE id = v_fac.id;

    RETURN jsonb_build_object('success', true, 'kind', p_kind);
END $$;

REVOKE EXECUTE ON FUNCTION public.dcm_set_priority(uuid, uuid, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.dcm_set_priority(uuid, uuid, text) TO authenticated;

-- ── dcm_call_summit ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.dcm_call_summit(p_faction_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_fac     factions%ROWTYPE;
    v_tick    int;
    v_summit  uuid;
    v_officer RECORD;
    v_count   int := 0;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    v_fac := _dcm_check(v_uid, p_faction_id);
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_dcm');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF v_fac.next_dcm_action_tick IS NOT NULL AND v_fac.next_dcm_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_fac.next_dcm_action_tick);
    END IF;
    -- One summit open at a time.
    IF EXISTS (SELECT 1 FROM summit_invites i
                JOIN regional_summits s ON s.id = i.summit_id
               WHERE s.dcm_faction_id = v_fac.id AND i.status = 'pending') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'summit_open');
    END IF;
    IF COALESCE(v_fac.embassy_budget, 100) < 20 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_budget',
            'need', 20, 'have', COALESCE(v_fac.embassy_budget, 100));
    END IF;

    INSERT INTO regional_summits (dcm_faction_id, region, cost, created_at_tick)
    VALUES (v_fac.id, v_fac.politician_dcm_region, 20, v_tick)
    RETURNING id INTO v_summit;

    FOR v_officer IN
        SELECT f.id,
               COALESCE(f.politician_consul_nation_id, f.politician_foreign_service_nation_id) AS station_id
          FROM factions f
          JOIN nations n ON n.id = COALESCE(f.politician_consul_nation_id,
                                            f.politician_foreign_service_nation_id)
         WHERE f.faction_type = 'politician'
           AND f.abandoned_at IS NULL
           AND f.nation_id = v_fac.nation_id
           AND f.id <> v_fac.id
           AND n.continent = v_fac.politician_dcm_region
    LOOP
        INSERT INTO summit_invites (summit_id, officer_faction_id, nation_id, created_at_tick)
        VALUES (v_summit, v_officer.id, v_officer.station_id, v_tick);
        v_count := v_count + 1;
    END LOOP;

    IF v_count = 0 THEN
        -- Nobody to invite — the summit doesn't happen and nothing
        -- is spent (validate-then-apply: the budget debit is below).
        DELETE FROM regional_summits WHERE id = v_summit;
        RETURN jsonb_build_object('success', false, 'reason', 'no_officers');
    END IF;

    UPDATE factions
       SET embassy_budget       = COALESCE(embassy_budget, 100) - 20,
           next_dcm_action_tick = v_tick + 1
     WHERE id = v_fac.id;

    RETURN jsonb_build_object('success', true, 'invited', v_count, 'cost', 20);
END $$;

REVOKE EXECUTE ON FUNCTION public.dcm_call_summit(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.dcm_call_summit(uuid) TO authenticated;

-- ── summit_invite_decide — the officer's ACCEPT / REJECT ──────────
CREATE OR REPLACE FUNCTION public.summit_invite_decide(
    p_faction_id uuid,
    p_invite_id  uuid,
    p_accept     boolean
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid    uuid := auth.uid();
    v_pol    factions%ROWTYPE;
    v_invite summit_invites%ROWTYPE;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_invite_id IS NULL OR p_accept IS NULL THEN
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

    SELECT * INTO v_invite FROM summit_invites
     WHERE id = p_invite_id AND officer_faction_id = v_pol.id
     FOR UPDATE;
    IF v_invite.id IS NULL OR v_invite.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invite_not_pending');
    END IF;

    UPDATE summit_invites
       SET status = CASE WHEN p_accept THEN 'accepted' ELSE 'rejected' END
     WHERE id = v_invite.id;

    IF p_accept THEN
        PERFORM _bump_relation_score(v_pol.nation_id, v_invite.nation_id, 1);
    END IF;

    RETURN jsonb_build_object('success', true, 'accepted', p_accept);
END $$;

REVOKE EXECUTE ON FUNCTION public.summit_invite_decide(uuid, uuid, boolean) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.summit_invite_decide(uuid, uuid, boolean) TO authenticated;



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

    -- A standing DCM ask (20270867): working the docket fulfills it.
    PERFORM _fulfill_priority(v_fac.id, 'work_the_docket');

    RETURN jsonb_build_object('success', true,
        'handled', v_case.title, 'stamped', v_stamped);
END $$;

REVOKE EXECUTE ON FUNCTION public.consul_handle_case(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.consul_handle_case(uuid, uuid) TO authenticated;

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

    -- A standing DCM ask (20270867): building standing fulfills it.
    PERFORM _fulfill_priority(v_fac.id, 'build_standing');

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

CREATE OR REPLACE FUNCTION public.politician_build_contacts(p_faction_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid  uuid := auth.uid();
    v_pol  factions%ROWTYPE;
    v_tick int;
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
    IF lower(COALESCE(v_pol.status, '')) = 'arrested' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'arrested');
    END IF;
    IF v_pol.politician_foreign_service_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_attache');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF v_pol.next_embassy_contacts_tick IS NOT NULL
       AND v_pol.next_embassy_contacts_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_embassy_contacts_tick);
    END IF;

    IF COALESCE(v_pol.embassy_budget, 100) < 2 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_budget',
            'have', COALESCE(v_pol.embassy_budget, 100));
    END IF;

    UPDATE factions
       SET embassy_budget             = COALESCE(embassy_budget, 100) - 2,
           embassy_reputation         = GREATEST(0, COALESCE(embassy_reputation, 50) - 1),
           politician_skill           = COALESCE(politician_skill, 0) + 0.3,
           politician_influence       = COALESCE(politician_influence, 0) + 0.3,
           next_embassy_contacts_tick = v_tick + 1
     WHERE id = v_pol.id;

    -- A standing DCM ask (20270867): building standing fulfills it.
    PERFORM _fulfill_priority(v_pol.id, 'build_standing');

    RETURN jsonb_build_object(
        'success',          true,
        'budget_delta',     -2,
        'reputation_delta', -1,
        'skill_delta',      0.3,
        'influence_delta',  0.3,
        'next_action_tick', v_tick + 1
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.politician_build_contacts(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.politician_build_contacts(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
