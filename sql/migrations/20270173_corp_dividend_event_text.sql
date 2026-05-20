-- ════════════════════════════════════════════════════════════════════
-- corp_dividend — event description includes CEO name + per-share copy
-- ════════════════════════════════════════════════════════════════════
-- Cosmetic-only: rewords the event_log description that corp_dividend
-- emits. Previously:
--   "{Corp} declared a dividend of $X per share ($Y total to N holders)."
-- Now:
--   "{CEO Name} of {Corp} has provided a dividend to shareholders of $X
--    per share."
--
-- CEO Name uses the standard codebase pattern (leader_first +
-- leader_last; falls back to faction_name then a generic literal). Per
-- share amount is formatted with thousands-separators via to_char,
-- matching the building-event style (20270168 building_offer events).
--
-- Body otherwise verbatim from 20270162. Same signature, GRANT, and
-- jsonb effects payload — only the description_used string changes,
-- so any client that reads description_used picks up the new copy
-- without a redeploy.
--
-- Idempotent (CREATE OR REPLACE).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.corp_dividend(p_corp_id UUID, p_per_share BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid        UUID := auth.uid();
    v_fac        factions%ROWTYPE;
    v_corp       entrepreneur_corps%ROWTYPE;
    v_held_sum   BIGINT;
    v_recipients INT;
    v_total      BIGINT;
    v_tick       INT;
    v_ceo_name   TEXT;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF p_per_share IS NULL OR p_per_share < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_amount');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps
     WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.listing <> 'public' OR v_corp.share_price IS NULL
       OR v_corp.shares_outstanding IS NULL OR v_corp.treasury_cash IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_public');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;

    IF v_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    SELECT COALESCE(SUM(shares), 0)::bigint, COUNT(*)
      INTO v_held_sum, v_recipients
      FROM corp_shareholdings
     WHERE corp_id = p_corp_id AND shares > 0;

    IF v_held_sum < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_recipients');
    END IF;

    v_total := p_per_share * v_held_sum;

    IF v_total > floor(v_corp.treasury_cash)::bigint THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_treasury',
            'have', floor(v_corp.treasury_cash)::bigint, 'need', v_total);
    END IF;

    UPDATE entrepreneur_corps
       SET treasury_cash = treasury_cash - v_total
     WHERE id = p_corp_id;

    UPDATE factions f
       SET party_funds = COALESCE(f.party_funds, 0) + (p_per_share * cs.shares)
      FROM corp_shareholdings cs
     WHERE cs.corp_id = p_corp_id
       AND cs.shares  > 0
       AND f.id = cs.holder_faction_id;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- CEO display name: standard codebase fallback chain (full leader
    -- name → faction name → generic literal). Matches the pattern used
    -- by corp_board_leave / corp_board_vote.
    v_ceo_name := COALESCE(
        NULLIF(btrim(COALESCE(v_fac.leader_first_name, '') || ' ' || COALESCE(v_fac.leader_last_name, '')), ''),
        v_fac.faction_name,
        'The CEO'
    );

    INSERT INTO event_log (
        nation_id, faction_id, event_name, description_used,
        category, trigger_key, effects_applied, fired_at_tick
    ) VALUES (
        v_corp.hq_nation_id, v_fac.id,
        'Dividend Declared',
        format('%s of %s has provided a dividend to shareholders of $%s per share.',
               v_ceo_name, v_corp.name, to_char(p_per_share, 'FM999,999,999,999')),
        'corporate', 'corp_dividend',
        jsonb_build_object(
            'corp_id',     p_corp_id,
            'corp_name',   v_corp.name,
            'ceo_name',    v_ceo_name,
            'per_share',   p_per_share,
            'total',       v_total,
            'recipients',  v_recipients,
            'shares_paid', v_held_sum
        ),
        v_tick
    );

    RETURN jsonb_build_object(
        'success',      true,
        'corp_id',      p_corp_id,
        'per_share',    p_per_share,
        'total',        v_total,
        'recipients',   v_recipients,
        'new_treasury', floor(v_corp.treasury_cash)::bigint - v_total
    );
END;
$$;

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK ──
-- Re-apply 20270162 to restore the old "{Corp} declared a dividend..."
-- description. Effects payload of past events is preserved either way
-- (this migration only changes the human-readable description_used
-- on NEW events going forward).
