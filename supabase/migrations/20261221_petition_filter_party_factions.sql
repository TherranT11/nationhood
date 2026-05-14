-- Petition for Reform — scope the faction lookup to parties only.
--
-- Audit case: a user with both a party faction (Hajjaran NC, monarchy
-- nation) and a corporation faction (Calveth Air, parliamentary
-- nation, linked_user_id = the party's id) reported persistent
-- "not_monarchy" errors. The RPC's faction lookup was:
--
--     SELECT * INTO v_faction FROM factions
--         WHERE id = v_caller OR linked_user_id = v_caller
--         ORDER BY created_at DESC LIMIT 1;
--
-- Both factions match the OR. ORDER BY created_at DESC picked the
-- newer corporation, so v_nation resolved to Calveth — a parliamentary
-- country — and the not_monarchy gate fired correctly against the
-- wrong faction. Diagnostic via the SQL editor:
--
--     SET LOCAL request.jwt.claim.sub = '<party-faction-id>';
--     SELECT public.petition_for_reform();
--     -- {"reason":"not_monarchy","got_government_type":"Parliamentary"}
--
-- The petition is a political action; corporations have no role in
-- it. Restrict the lookup to faction_type = 'party' — the same scoping
-- pattern used by disband_party, leave_coalition, and the bloc RPCs.
-- A user can hold only one party per nation (enforced elsewhere) so
-- the lookup is unambiguous once corps are filtered out.
--
-- Belt-and-suspenders: respond_to_petition uses the same dual-key
-- pattern. The monarch's faction is also a party (the throne is held
-- by a party faction), so apply the same filter there for consistency.
-- process_expired_petitions is unchanged — it doesn't look up the
-- caller's faction.

CREATE OR REPLACE FUNCTION public.petition_for_reform()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller        UUID := auth.uid();
    v_faction       factions%ROWTYPE;
    v_nation        nations%ROWTYPE;
    v_tick          INT;
    v_cost_raw      CONSTANT BIGINT := 100000;
    v_cooldown      CONSTANT INT    := 6;
    v_auto_window   CONSTANT INT    := 3;
    v_strength      NUMERIC;
    v_d100          INT;
    v_total         NUMERIC;
    v_bucket        TEXT;
    v_pop_up        NUMERIC;
    v_pop_cp        NUMERIC;
    v_pop_rc        NUMERIC;
    v_petition_id   UUID;
    v_hos_name      TEXT;
    v_mood_text     TEXT;
    v_description   TEXT;
BEGIN
    IF v_caller IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    -- Party-only lookup. Corporations also live in `factions` and can
    -- share linked_user_id with the player's party, so the previous
    -- unfiltered lookup picked the newest match (often the corp).
    SELECT * INTO v_faction FROM factions
        WHERE faction_type = 'party'
          AND (id = v_caller OR linked_user_id = v_caller)
        ORDER BY created_at DESC LIMIT 1
        FOR UPDATE;
    IF v_faction.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_faction');
    END IF;

    SELECT * INTO v_nation FROM nations WHERE id = v_faction.nation_id;
    IF v_nation.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_nation');
    END IF;

    IF NOT (COALESCE(v_nation.government_type, '') ILIKE '%absolute%monarchy%') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_monarchy',
            'got_government_type', v_nation.government_type);
    END IF;

    IF v_nation.monarch_faction_id IS NOT NULL
       AND v_nation.monarch_faction_id = v_faction.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_opposition');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM faction_agitators
        WHERE faction_id = v_faction.id AND status = 'active'
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_agitator');
    END IF;

    IF EXISTS (
        SELECT 1 FROM petitions
        WHERE nation_id = v_nation.id AND status = 'pending'
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'petition_pending');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;
    IF v_faction.last_petition_for_reform_tick IS NOT NULL
       AND v_tick < v_faction.last_petition_for_reform_tick + v_cooldown THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_faction.last_petition_for_reform_tick + v_cooldown);
    END IF;

    IF COALESCE(v_faction.party_funds, 0) < v_cost_raw THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'have', COALESCE(v_faction.party_funds, 0), 'need', v_cost_raw);
    END IF;

    SELECT popularity INTO v_pop_up FROM faction_sector_popularity fsp
        JOIN sectors s ON s.id = fsp.sector_id
        WHERE fsp.faction_id = v_faction.id AND s.sector_key = 'URBAN_PROFESSIONALS';
    SELECT popularity INTO v_pop_cp FROM faction_sector_popularity fsp
        JOIN sectors s ON s.id = fsp.sector_id
        WHERE fsp.faction_id = v_faction.id AND s.sector_key = 'CULTURAL_PRODUCERS';
    SELECT popularity INTO v_pop_rc FROM faction_sector_popularity fsp
        JOIN sectors s ON s.id = fsp.sector_id
        WHERE fsp.faction_id = v_faction.id AND s.sector_key = 'RELIGIOUS_CONSERVATIVES';
    v_pop_up := COALESCE(v_pop_up, 50);
    v_pop_cp := COALESCE(v_pop_cp, 50);
    v_pop_rc := COALESCE(v_pop_rc, 50);

    v_strength :=
          (COALESCE(v_nation.education,          50) / 10.0) * 1.5
        + (v_pop_up / 10.0) * 2.0
        + (v_pop_cp / 10.0) * 1.5
        + (10 - COALESCE(v_nation.standard_of_living, 50) / 10.0)
        + (COALESCE(v_nation.inequality, 50)   / 10.0) * 0.5
        +  COALESCE(v_nation.crown_authority, 50) / 20.0
        + (v_pop_rc / 10.0) * 1.0;

    v_d100  := 1 + floor(random() * 100)::INT;
    v_total := v_d100 + v_strength;

    IF v_total <= 40 THEN
        v_bucket := 'apathetic';
    ELSIF v_total <= 69 THEN
        v_bucket := 'hopeful';
    ELSE
        v_bucket := 'expectant';
    END IF;

    INSERT INTO petitions (
        nation_id, faction_id, monarch_faction_id,
        filed_at_tick, auto_accept_at_tick,
        d100, strength, total, bucket, status
    ) VALUES (
        v_nation.id, v_faction.id, v_nation.monarch_faction_id,
        v_tick, v_tick + v_auto_window,
        v_d100, round(v_strength::NUMERIC, 2), round(v_total::NUMERIC, 2), v_bucket, 'pending'
    )
    RETURNING id INTO v_petition_id;

    UPDATE factions
       SET party_funds                    = COALESCE(party_funds, 0) - v_cost_raw,
           last_petition_for_reform_tick = v_tick
     WHERE id = v_faction.id;

    v_hos_name :=
        coalesce(NULLIF(trim(coalesce(v_nation.head_of_state_title, '') || ' ' ||
                             coalesce(v_nation.head_of_state_first_name, '') || ' ' ||
                             coalesce(v_nation.head_of_state_last_name, '')), ''),
                 'the monarch');

    v_mood_text := CASE v_bucket
        WHEN 'apathetic' THEN 'The people are apathetic to this motion.'
        WHEN 'hopeful'   THEN 'The people are hopeful that the monarchy will hear their plea.'
        WHEN 'expectant' THEN 'The people expect this petition to be heard, and may lash out if they are ignored.'
    END;

    v_description := format(
        '%s has petitioned the monarch %s on a list of reforms, hoping to stabilize and potentially liberalize the nation. The nation waits for the throne''s response. %s',
        v_faction.faction_name, v_hos_name, v_mood_text);

    INSERT INTO event_log (
        nation_id, event_name, trigger_key, category,
        description_chosen, effects_applied, fired_at_tick
    ) VALUES (
        v_nation.id, 'PETITION FOR REFORM', 'petition_for_reform_filed', 'POLITICAL',
        v_description,
        jsonb_build_object(
            'petition_id',   v_petition_id,
            'bucket',        v_bucket,
            'd100',          v_d100,
            'strength',      round(v_strength::NUMERIC, 2),
            'total',         round(v_total::NUMERIC, 2),
            'faction_id',    v_faction.id,
            'faction_name',  v_faction.faction_name
        ),
        v_tick
    );

    RETURN jsonb_build_object(
        'success',      true,
        'petition_id',  v_petition_id,
        'bucket',       v_bucket,
        'd100',         v_d100,
        'strength',     round(v_strength::NUMERIC, 2),
        'total',        round(v_total::NUMERIC, 2),
        'auto_accept_at_tick', v_tick + v_auto_window
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.petition_for_reform() TO authenticated;


-- Same correction on respond_to_petition's caller lookup. The monarch's
-- faction is always a party (corps can't hold the throne), so this
-- filter is defensive — same shape, no behavioural change for the
-- happy path, just removes the symmetric corp-shadows-party bug.

CREATE OR REPLACE FUNCTION public.respond_to_petition(
    p_petition_id UUID,
    p_action      TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller        UUID := auth.uid();
    v_faction       factions%ROWTYPE;
    v_petition      petitions%ROWTYPE;
    v_nation        nations%ROWTYPE;
    v_tick          INT;
    v_d_ca          INT;
    v_d_unrest      INT;
    v_d_pa          INT;
    v_new_ca        NUMERIC;
    v_new_unrest    NUMERIC;
    v_new_pa        NUMERIC;
    v_new_status    TEXT;
    v_action_label  TEXT;
    v_hos_name      TEXT;
    v_event_name    TEXT;
    v_description   TEXT;
BEGIN
    IF v_caller IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    IF p_action NOT IN ('dismiss', 'partial', 'accept') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_action');
    END IF;

    SELECT * INTO v_faction FROM factions
        WHERE faction_type = 'party'
          AND (id = v_caller OR linked_user_id = v_caller)
        ORDER BY created_at DESC LIMIT 1;
    IF v_faction.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_faction');
    END IF;

    SELECT * INTO v_petition FROM petitions
        WHERE id = p_petition_id
        FOR UPDATE;
    IF v_petition.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_petition');
    END IF;
    IF v_petition.status != 'pending' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_resolved',
            'status', v_petition.status);
    END IF;

    SELECT * INTO v_nation FROM nations WHERE id = v_petition.nation_id FOR UPDATE;
    IF v_nation.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_nation');
    END IF;

    IF v_nation.monarch_faction_id IS NULL
       OR v_nation.monarch_faction_id != v_faction.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_monarch');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;

    IF p_action = 'dismiss' THEN
        v_action_label := 'dismissed';
        v_new_status   := 'dismissed';
        IF v_petition.bucket = 'apathetic' THEN
            v_d_ca := 2;  v_d_unrest := -2; v_d_pa := 2;
        ELSIF v_petition.bucket = 'hopeful' THEN
            v_d_ca := 2;  v_d_unrest := 2;  v_d_pa := -2;
        ELSE
            v_d_ca := 0;  v_d_unrest := 5;  v_d_pa := -6;
        END IF;
    ELSIF p_action = 'partial' THEN
        v_action_label := 'agreed to some of';
        v_new_status   := 'partial';
        IF v_petition.bucket = 'apathetic' THEN
            v_d_ca := -3; v_d_unrest := -2; v_d_pa := 2;
        ELSIF v_petition.bucket = 'hopeful' THEN
            v_d_ca := -2; v_d_unrest := -3; v_d_pa := 3;
        ELSE
            v_d_ca := -2; v_d_unrest := 3;  v_d_pa := 2;
        END IF;
    ELSE
        v_action_label := 'accepted';
        v_new_status   := 'accepted';
        IF v_petition.bucket = 'apathetic' THEN
            v_d_ca := -2; v_d_unrest := -1; v_d_pa := 2;
        ELSIF v_petition.bucket = 'hopeful' THEN
            v_d_ca := -3; v_d_unrest := -3; v_d_pa := 4;
        ELSE
            v_d_ca := -6; v_d_unrest := -5; v_d_pa := 7;
        END IF;
    END IF;

    v_new_ca     := LEAST(100, GREATEST(0, COALESCE(v_nation.crown_authority, 50) + v_d_ca));
    v_new_unrest := LEAST(100, GREATEST(0, COALESCE(v_nation.unrest, 50) + v_d_unrest));
    v_new_pa     := LEAST(100, GREATEST(0, COALESCE(v_nation.public_approval, 50) + v_d_pa));

    UPDATE nations SET crown_authority = v_new_ca,
                       unrest          = v_new_unrest,
                       public_approval = v_new_pa
        WHERE id = v_nation.id;

    UPDATE petitions
       SET status                 = v_new_status,
           resolved_at_tick       = v_tick,
           resolved_by_faction_id = v_faction.id
     WHERE id = v_petition.id;

    v_hos_name :=
        coalesce(NULLIF(trim(coalesce(v_nation.head_of_state_title, '') || ' ' ||
                             coalesce(v_nation.head_of_state_first_name, '') || ' ' ||
                             coalesce(v_nation.head_of_state_last_name, '')), ''),
                 'the monarch');

    v_event_name := CASE v_new_status
        WHEN 'dismissed' THEN 'Petition Dismissed'
        WHEN 'partial'   THEN 'Petition Partially Accepted'
        WHEN 'accepted'  THEN 'Petition Accepted'
    END;

    v_description := format(
        '%s has %s the petition for reform.',
        v_hos_name, v_action_label);

    INSERT INTO event_log (
        nation_id, event_name, trigger_key, category,
        description_chosen, effects_applied, fired_at_tick
    ) VALUES (
        v_nation.id, v_event_name, 'petition_for_reform_resolved', 'POLITICAL',
        v_description,
        jsonb_build_object(
            'petition_id',         v_petition.id,
            'action',              p_action,
            'bucket',              v_petition.bucket,
            'd_crown_authority',   v_d_ca,
            'd_unrest',            v_d_unrest,
            'd_public_approval',   v_d_pa,
            'new_crown_authority', v_new_ca,
            'new_unrest',          v_new_unrest,
            'new_public_approval', v_new_pa
        ),
        v_tick
    );

    RETURN jsonb_build_object(
        'success',  true,
        'action',   p_action,
        'status',   v_new_status,
        'new_crown_authority', v_new_ca,
        'new_unrest',          v_new_unrest,
        'new_public_approval', v_new_pa
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.respond_to_petition(UUID, TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';
