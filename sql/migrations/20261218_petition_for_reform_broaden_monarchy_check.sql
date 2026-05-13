-- Petition for Reform: broaden the monarchy detection.
--
-- The initial RPC used a strict IN-list comparison after lower(coalesce(...)):
--   lower(coalesce(government_type, '')) IN (
--     'absolute monarchy', 'absolute_monarchy', 'monarchy'
--   )
-- That fired "not_monarchy" against Hajjara even though the JS UI
-- (which uses the same alias table via getCanonicalGovernmentType)
-- treats it as a monarchy. The failure mode is a quiet string drift
-- — trailing whitespace, an unexpected capitalisation, or a stored
-- variant the alias table maps but our IN-list didn't.
--
-- Aligning to the established codebase convention for monarchy
-- detection used by form_minority_government and elsewhere:
--   government_type ILIKE '%absolute%monarchy%'
-- This matches every documented variant and is what
-- 20261003_form_minority_government_rpc.sql, 20261011_..., and
-- 20261012_... already use. Single rule, repeated across the SQL
-- layer.
--
-- Only the monarchy gate changes; all other logic in petition_for_reform
-- (auth, cooldown, agitator check, strength calc, dice, stat writes,
-- event_log) is unchanged.

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
    v_strength      NUMERIC;
    v_d100          INT;
    v_total         NUMERIC;
    v_outcome       TEXT;
    v_pop_up        NUMERIC;
    v_pop_cp        NUMERIC;
    v_pop_rc        NUMERIC;
    v_new_ca        NUMERIC;
    v_new_pa        NUMERIC;
    v_hos_name      TEXT;
    v_event_name    TEXT;
    v_description   TEXT;
BEGIN
    IF v_caller IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    SELECT * INTO v_faction FROM factions
        WHERE id = v_caller OR linked_user_id = v_caller
        ORDER BY created_at DESC LIMIT 1
        FOR UPDATE;
    IF v_faction.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_faction');
    END IF;

    SELECT * INTO v_nation FROM nations WHERE id = v_faction.nation_id;
    IF v_nation.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_nation');
    END IF;

    -- Monarchy detection: ILIKE pattern matches every variant in use
    -- ("Absolute Monarchy", "absolute_monarchy", any title-cased or
    -- whitespace-padded form). Mirrors the convention in
    -- form_minority_government_rpc and friends.
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

    -- ── Petition strength ─────────────────────────────────────
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
        v_outcome := 'ignored';
        UPDATE faction_sector_popularity
           SET popularity = GREATEST(0, popularity - 2)
         WHERE faction_id = v_faction.id;
    ELSIF v_total <= 69 THEN
        v_outcome := 'accepted';
        v_new_ca := GREATEST(0, COALESCE(v_nation.crown_authority, 50) - 1);
        v_new_pa := LEAST(100, COALESCE(v_nation.public_approval, 50) + 1);
        UPDATE nations SET crown_authority = v_new_ca,
                           public_approval  = v_new_pa
            WHERE id = v_nation.id;
    ELSE
        v_outcome := 'major';
        v_new_ca := GREATEST(0, COALESCE(v_nation.crown_authority, 50) - 4);
        v_new_pa := LEAST(100, COALESCE(v_nation.public_approval, 50) + 2);
        UPDATE nations SET crown_authority = v_new_ca,
                           public_approval  = v_new_pa
            WHERE id = v_nation.id;
    END IF;

    UPDATE factions
       SET party_funds                    = COALESCE(party_funds, 0) - v_cost_raw,
           last_petition_for_reform_tick = v_tick
     WHERE id = v_faction.id;

    v_hos_name :=
        coalesce(NULLIF(trim(coalesce(v_nation.head_of_state_title, '') || ' ' ||
                             coalesce(v_nation.head_of_state_first_name, '') || ' ' ||
                             coalesce(v_nation.head_of_state_last_name, '')), ''),
                 'the head of state');

    IF v_outcome = 'ignored' THEN
        v_event_name  := 'Petition Rejected';
        v_description := format(
            'A petition for reform in the nation of %s has been reviewed and formally rejected by %s.',
            v_nation.name, v_hos_name);
    ELSIF v_outcome = 'accepted' THEN
        v_event_name  := 'Petition Accepted';
        v_description := format(
            'Upon reviewing and consulting with advisors, %s has accepted the terms of a petition put together by %s.',
            v_hos_name, v_faction.faction_name);
    ELSE
        v_event_name  := 'Petition Signed (Major Reform)';
        v_description := format(
            'Major changes in %s as a government petition with considerable momentum was signed by %s, with many believing bigger issues if it had not been signed.',
            v_nation.name, v_hos_name);
    END IF;

    INSERT INTO event_log (
        nation_id, event_name, trigger_key, category,
        description_chosen, effects_applied, fired_at_tick
    ) VALUES (
        v_nation.id, v_event_name, 'petition_for_reform', 'POLITICAL',
        v_description,
        jsonb_build_object(
            'outcome',           v_outcome,
            'd100',              v_d100,
            'strength',          round(v_strength::NUMERIC, 2),
            'total',             round(v_total::NUMERIC, 2),
            'faction_id',        v_faction.id,
            'faction_name',      v_faction.faction_name,
            'new_crown_authority', v_new_ca,
            'new_public_approval', v_new_pa
        ),
        v_tick
    );

    RETURN jsonb_build_object(
        'success',  true,
        'outcome',  v_outcome,
        'd100',     v_d100,
        'strength', round(v_strength::NUMERIC, 2),
        'total',    round(v_total::NUMERIC, 2),
        'new_crown_authority', v_new_ca,
        'new_public_approval', v_new_pa,
        'event_name',          v_event_name,
        'description',         v_description
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.petition_for_reform() TO authenticated;
NOTIFY pgrst, 'reload schema';
