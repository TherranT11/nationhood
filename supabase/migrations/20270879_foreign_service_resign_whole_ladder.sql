-- ════════════════════════════════════════════════════════════════════
-- 20270879 — Foreign Service resign covers the whole ladder
--
-- 'Every role needs a [Resign] button' — the consul / DCM / special
-- envoy cards gained one, but politician_foreign_service_resign
-- (20270771, last emitted 20270778) predates those ranks: its gate
-- read only politician_foreign_service_nation_id, so anyone above
-- attaché bounced on not_in_service. Re-emitted to:
--
--   • accept resignation from any rung (attaché / consul / DCM /
--     ambassador / special envoy);
--   • clear the WHOLE ladder — postings, ticks, strikes, the
--     per-rung cooldowns — and reset embassy stats to baseline
--     (they belong to the posting, not the politician);
--   • name the highest-rung posting nation in the career event
--     (ambassador > consul > attaché; DCM/envoy have no single
--     nation).
--
-- Vacancies free automatically: the one-consul-per-pair /
-- one-dcm-per-region / one-ambassador-per-pair / one-envoy-per-
-- nation partial unique indexes key on the cleared columns.
-- politician_ambassador_resign (posting-only, keeps nothing else)
-- remains the ambassador card's dedicated exit. KNOWN: an envoy
-- resigning mid-negotiation leaves the open session for the other
-- party to decline — same as the pre-existing envoy lapse path.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.politician_foreign_service_resign(p_faction_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid         uuid := auth.uid();
    v_pol         factions%ROWTYPE;
    v_tick        int;
    v_nation_name text;
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
    -- In service at ANY rung (20270879): attaché, consul, DCM,
    -- ambassador or special envoy. The pre-20270879 emission only
    -- knew Tier 1 — every higher rung's RESIGN dead-ended on
    -- not_in_service.
    IF v_pol.politician_foreign_service_nation_id IS NULL
       AND v_pol.politician_consul_nation_id IS NULL
       AND v_pol.politician_dcm_region IS NULL
       AND v_pol.politician_ambassador_nation_id IS NULL
       AND v_pol.politician_special_envoy_at_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_in_service');
    END IF;

    -- Career-event flavor: name the highest-rung posting nation.
    SELECT name INTO v_nation_name FROM nations
     WHERE id = COALESCE(v_pol.politician_ambassador_nation_id,
                         v_pol.politician_consul_nation_id,
                         v_pol.politician_foreign_service_nation_id);

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- No stat claw-back: re-entry requires re-passing the FS exam
    -- (plus its 1-tick retry cooldown), which is its own barrier.
    -- foreign_service_last_attempt_tick is intentionally preserved.
    -- Embassy stats reset to baseline (20270778) — they belong to
    -- the posting, not the politician.
    UPDATE factions
       SET politician_foreign_service_nation_id = NULL,
           politician_foreign_service_at_tick   = NULL,
           politician_consul_nation_id          = NULL,
           politician_consul_at_tick            = NULL,
           politician_dcm_region                = NULL,
           politician_dcm_at_tick               = NULL,
           politician_ambassador_nation_id      = NULL,
           politician_ambassador_at_tick        = NULL,
           politician_ambassador_strikes        = 0,
           politician_special_envoy_at_tick     = NULL,
           embassy_budget             = 100,
           embassy_reputation         = 50,
           embassy_trust              = 50,
           embassy_leverage           = 50,
           next_embassy_action_tick   = NULL,
           next_embassy_contacts_tick = NULL,
           next_backchannel_tick      = NULL,
           next_dcm_action_tick       = NULL,
           next_ambassador_action_tick = NULL
     WHERE id = v_pol.id;

    -- Discard any unresolved embassy event — the posting it belonged
    -- to is over. Resolved rows stay as the historical record.
    DELETE FROM embassy_event_draws
     WHERE faction_id = v_pol.id
       AND resolved_at_tick IS NULL;

    INSERT INTO politician_career_events (faction_id, event_tick, event_type, target_name, metadata)
    VALUES (
        v_pol.id, v_tick, 'foreign_service_resigned', COALESCE(v_nation_name, ''),
        jsonb_build_object('posted_nation_name', v_nation_name)
    );

    RETURN jsonb_build_object('success', true, 'resigned_from', v_nation_name);
END $$;

REVOKE EXECUTE ON FUNCTION public.politician_foreign_service_resign(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.politician_foreign_service_resign(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
