-- ════════════════════════════════════════════════════════════════════
-- 20270615 — Fix COO-succession ordering (CFO must not rank ahead of
--            plain Directors)
--
-- 20270614's corp_no_confidence_resolve uses
--   ORDER BY (s.role = 'coo') DESC NULLS LAST, shares DESC, joined_tick ASC
-- to pick the successor when a CEO is ousted. The expression
-- (s.role = 'coo') evaluates to TRUE for COO, FALSE for CFO,
-- NULL for plain Director. Under DESC NULLS LAST that sorts as
-- TRUE → FALSE → NULL, meaning the CFO ranks BETWEEN the COO and
-- the plain Directors. So if there's no COO but there is a CFO,
-- the CFO inherits the chair ahead of every plain Director,
-- regardless of share count.
--
-- That violates the Phase-1 rule: only the COO is a preferred
-- successor. Everyone else (CFO, plain Directors) competes on
-- shares + joined_tick equally.
--
-- Fix: replace the boolean expression with an explicit two-bucket
-- CASE so CFO and plain Director land in the same rank bucket:
--   ORDER BY CASE s.role WHEN 'coo' THEN 0 ELSE 1 END ASC,
--            shares DESC, joined_tick ASC
-- CASE with WHEN-equality treats NULL as "not matching" → falls to
-- ELSE, so CFO (1) and plain Director (1) tie and proceed to the
-- shares/joined_tick tiebreakers.
--
-- Body otherwise byte-identical to 20270614's corp_no_confidence
-- _resolve. Every other surface (corp_appoint_role, corp_clear_role,
-- corp_board_resign, corp_remove_director, corp_board_request_join,
-- and the schema additions) is unchanged.
--
-- Apply after 20270614.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.corp_no_confidence_resolve(p_motion_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_motion         corp_no_confidence_motions%ROWTYPE;
    v_corp           entrepreneur_corps%ROWTYPE;
    v_filer          factions%ROWTYPE;
    v_total_shares   bigint;
    v_quorum_shares  bigint;
    v_quorum_met     boolean;
    v_pass           boolean;
    v_outcome        text;
    v_successor      uuid;
    v_tick           int;
    v_corp_name      text;
    v_old_ceo_name   text;
    v_new_ceo_name   text;
BEGIN
    IF p_motion_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    SELECT * INTO v_motion FROM corp_no_confidence_motions
     WHERE id = p_motion_id FOR UPDATE;
    IF v_motion.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'motion_not_found');
    END IF;
    IF v_motion.status <> 'open' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'motion_not_open',
            'status', v_motion.status);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    IF v_motion.resolve_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_yet_due',
            'resolve_tick', v_motion.resolve_tick, 'current_tick', v_tick);
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps
     WHERE id = v_motion.corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        UPDATE corp_no_confidence_motions
           SET status = 'resolved', resolved_at_tick = v_tick,
               outcome = 'survived'
         WHERE id = p_motion_id;
        RETURN jsonb_build_object('success', false, 'reason', 'corp_gone');
    END IF;

    SELECT COALESCE(SUM(eligible_shares), 0) INTO v_total_shares
      FROM corp_no_confidence_eligibility
     WHERE motion_id = p_motion_id;

    v_quorum_shares := CEIL(v_total_shares * 0.30)::bigint;
    v_quorum_met    := (v_motion.yes_shares + v_motion.no_shares) >= v_quorum_shares;
    v_pass          := (v_motion.yes_shares > v_motion.no_shares) AND v_quorum_met;

    IF v_pass THEN
        v_outcome := 'ousted';
    ELSIF NOT v_quorum_met THEN
        v_outcome := 'failed_quorum';
    ELSE
        v_outcome := 'survived';
    END IF;

    IF v_outcome = 'ousted' THEN
        -- 20270615: COO-only preference. Two-bucket CASE so CFO and
        -- plain Director tie in the role rank (bucket 1) and proceed
        -- to the shares/joined_tick tiebreakers. (20270614 used
        -- (role='coo') DESC NULLS LAST, which incorrectly ranked
        -- CFO between COO and Director.)
        SELECT s.member_faction_id
          INTO v_successor
          FROM corp_board_seats s
          LEFT JOIN corp_shareholdings sh
            ON sh.corp_id = s.corp_id
           AND sh.holder_faction_id = s.member_faction_id
         WHERE s.corp_id = v_motion.corp_id
         ORDER BY CASE s.role WHEN 'coo' THEN 0 ELSE 1 END ASC,
                  COALESCE(sh.shares, 0) DESC,
                  s.joined_tick ASC
         LIMIT 1;

        IF v_successor IS NULL THEN
            v_outcome := 'survived';
        ELSE
            DELETE FROM corp_board_seats
             WHERE corp_id = v_motion.corp_id
               AND member_faction_id = v_successor;

            SELECT COALESCE(NULLIF(btrim(COALESCE(leader_first_name, '') || ' ' || COALESCE(leader_last_name, '')), ''),
                            faction_name, 'Outgoing CEO')
              INTO v_old_ceo_name FROM factions WHERE id = v_corp.owner_faction_id;
            SELECT COALESCE(NULLIF(btrim(COALESCE(leader_first_name, '') || ' ' || COALESCE(leader_last_name, '')), ''),
                            faction_name, 'New CEO')
              INTO v_new_ceo_name FROM factions WHERE id = v_successor;
            v_corp_name := v_corp.name;

            UPDATE entrepreneur_corps
               SET owner_faction_id = v_successor,
                   updated_at = now()
             WHERE id = v_motion.corp_id;

            UPDATE factions
               SET ent_reputation = COALESCE(ent_reputation, 0) - 2
             WHERE id = v_corp.owner_faction_id;
        END IF;
    END IF;

    IF v_outcome IN ('survived', 'failed_quorum') THEN
        UPDATE factions
           SET ent_reputation = COALESCE(ent_reputation, 0) + 3
         WHERE id = v_corp.owner_faction_id;

        SELECT * INTO v_filer FROM factions WHERE id = v_motion.filed_by_faction_id;
        IF v_filer.id IS NOT NULL THEN
            UPDATE factions
               SET ent_reputation = COALESCE(ent_reputation, 0) - 1
             WHERE id = v_motion.filed_by_faction_id;
        END IF;
    END IF;

    UPDATE corp_no_confidence_motions
       SET status = 'resolved', resolved_at_tick = v_tick,
           outcome = v_outcome,
           successor_faction_id = CASE WHEN v_outcome = 'ousted' THEN v_successor END
     WHERE id = p_motion_id;

    INSERT INTO event_log (
        nation_id, faction_id, event_name, description_used,
        category, trigger_key, effects_applied, fired_at_tick
    ) VALUES (
        v_corp.hq_nation_id, v_corp.owner_faction_id,
        CASE WHEN v_outcome = 'ousted'        THEN 'CEO Ousted by Board'
             WHEN v_outcome = 'failed_quorum' THEN 'Confidence Vote Failed Quorum'
             ELSE 'CEO Survived Confidence Vote' END,
        CASE WHEN v_outcome = 'ousted'
             THEN format('%s removed %s as CEO of %s; %s assumes the chair.',
                         'The board', COALESCE(v_old_ceo_name, 'the outgoing CEO'),
                         COALESCE(v_corp_name, v_corp.name),
                         COALESCE(v_new_ceo_name, 'the new CEO'))
             WHEN v_outcome = 'failed_quorum'
             THEN format('A no-confidence motion against the CEO of %s failed to meet quorum.', v_corp.name)
             ELSE format('The CEO of %s has survived a no-confidence motion.', v_corp.name) END,
        'corporate', 'corp_no_confidence_vote',
        jsonb_build_object(
            'corp_id', v_motion.corp_id, 'corp_name', v_corp.name,
            'motion_id', p_motion_id, 'outcome', v_outcome,
            'yes_shares', v_motion.yes_shares, 'no_shares', v_motion.no_shares,
            'total_eligible', v_total_shares, 'quorum_shares', v_quorum_shares,
            'successor_faction_id', v_successor
        ),
        v_tick
    );

    RETURN jsonb_build_object(
        'success', true, 'outcome', v_outcome,
        'yes_shares', v_motion.yes_shares, 'no_shares', v_motion.no_shares,
        'total_eligible', v_total_shares, 'quorum_shares', v_quorum_shares,
        'successor_faction_id', v_successor
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.corp_no_confidence_resolve(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.corp_no_confidence_resolve(uuid) TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
