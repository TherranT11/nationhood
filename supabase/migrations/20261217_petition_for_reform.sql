-- Agitator action: Petition for Reform (Absolute Monarchy only).
--
-- Eligibility:
--   - Caller is the faction owner (id = auth.uid() OR linked_user_id).
--   - Nation is an absolute monarchy.
--   - Caller's party is NOT the monarch's party (= opposition in a
--     monarchy, since there's no coalition system there).
--   - Caller has an active agitator hired (faction_agitators.status =
--     'active').
--   - 6-tick cooldown since last petition by this faction.
--   - party_funds >= $100k raw ($0.1 abstract).
--
-- Petition strength (deterministic, additive). All 0-100 stats are
-- normalised to the displayed 0-10 scale before the multiplier is
-- applied, matching the rapport convention and keeping the spec's
-- "(10 − Standard of Living)" term meaningful (SoL is stored 0-100 but
-- the player sees it on a 0-10 scale). Crown Authority is the explicit
-- exception — the spec divides by 20 directly, so it stays on the
-- 0-100 raw scale.
--
--   education / 10           × 1.5
--   urban_professionals  / 10 × 2          (displayed 0-10 rapport)
--   cultural_producers   / 10 × 1.5         (displayed 0-10 rapport)
--   (10 − standard_of_living / 10)
--   inequality / 10           × 0.5
--   crown_authority           / 20          (raw 0-100, per spec)
--   religious_conservatives / 10 × 1        (displayed 0-10 rapport)
--
-- Strength range ~0-73. Plus 1d100. Total ~2-173 lands cleanly across
-- the three outcome buckets (≤40 / 41-69 / ≥70).
--
-- Roll: 1d100 + strength.
--   0-40:  Ignored. -0.2 popularity across every sector (faction_sector_popularity).
--   41-69: -1 crown_authority. +1 public_approval.
--   70+:   -4 crown_authority. +2 public_approval.
--
-- Side effects:
--   - $100k debited from party_funds.
--   - factions.last_petition_for_reform_tick = current_tick (cooldown).
--   - event_log row written with the appropriate description.

BEGIN;

-- ── Cooldown column ────────────────────────────────────────────
ALTER TABLE public.factions
    ADD COLUMN IF NOT EXISTS last_petition_for_reform_tick INT;

COMMENT ON COLUMN public.factions.last_petition_for_reform_tick IS
    'Tick at which this faction last invoked the Petition for Reform agitator action. NULL = never used. Cooldown gate is current_tick >= last + 6.';


-- ── petition_for_reform RPC ────────────────────────────────────
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

    -- Resolve caller's faction. Either the faction id is the user
    -- (legacy single-faction users) or it's linked via linked_user_id.
    -- Lock the row so the cooldown / funds checks see a consistent state.
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

    -- Government type must be an absolute monarchy. Compare on the
    -- lowercased canonical token to absorb the "absolute monarchy" /
    -- "absolute_monarchy" / "Monarchy" variants game-common accepts.
    IF lower(coalesce(v_nation.government_type, '')) NOT IN
       ('absolute monarchy', 'absolute_monarchy', 'monarchy') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_monarchy');
    END IF;

    -- Opposition in a monarchy = not the monarch's party. There's no
    -- coalition system in absolute monarchies, so the monarch_faction_id
    -- check is the complete governing/opposition test.
    IF v_nation.monarch_faction_id IS NOT NULL
       AND v_nation.monarch_faction_id = v_faction.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_opposition');
    END IF;

    -- Active agitator required.
    IF NOT EXISTS (
        SELECT 1 FROM faction_agitators
        WHERE faction_id = v_faction.id AND status = 'active'
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_agitator');
    END IF;

    -- Cooldown: current_tick >= last + 6.
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;
    IF v_faction.last_petition_for_reform_tick IS NOT NULL
       AND v_tick < v_faction.last_petition_for_reform_tick + v_cooldown THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_faction.last_petition_for_reform_tick + v_cooldown);
    END IF;

    -- Party funds (raw scale; $100k = 100000).
    IF COALESCE(v_faction.party_funds, 0) < v_cost_raw THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'have', COALESCE(v_faction.party_funds, 0), 'need', v_cost_raw);
    END IF;

    -- ── Petition strength ─────────────────────────────────────
    -- All three sector rapport values default to 50 (neutral 0-100 ⇒ 5.0
    -- displayed) when missing, matching the rest of the rapport stack.
    SELECT COALESCE(popularity, 50) INTO v_pop_up FROM faction_sector_popularity fsp
        JOIN sectors s ON s.id = fsp.sector_id
        WHERE fsp.faction_id = v_faction.id AND s.sector_key = 'URBAN_PROFESSIONALS';
    SELECT COALESCE(popularity, 50) INTO v_pop_cp FROM faction_sector_popularity fsp
        JOIN sectors s ON s.id = fsp.sector_id
        WHERE fsp.faction_id = v_faction.id AND s.sector_key = 'CULTURAL_PRODUCERS';
    SELECT COALESCE(popularity, 50) INTO v_pop_rc FROM faction_sector_popularity fsp
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

    -- 1d100 + strength
    v_d100  := 1 + floor(random() * 100)::INT;
    v_total := v_d100 + v_strength;

    -- ── Outcome bucket ────────────────────────────────────────
    IF v_total <= 40 THEN
        v_outcome := 'ignored';
        -- -0.2 popularity across every sector for this faction (0-100 scale,
        -- so -0.2 displayed = -2 stored). Clamp at 0.
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

    -- ── Debit + stamp cooldown ────────────────────────────────
    UPDATE factions
       SET party_funds                    = COALESCE(party_funds, 0) - v_cost_raw,
           last_petition_for_reform_tick = v_tick
     WHERE id = v_faction.id;

    -- ── Event log ─────────────────────────────────────────────
    -- Head-of-state phrasing uses the canonical title + name fields.
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

COMMENT ON FUNCTION public.petition_for_reform() IS
    'Agitator action available only in absolute monarchies to opposition parties with an active agitator. Costs $100k from party_funds, 6-tick cooldown. Petition strength = education*1.5 + (rapport up/cp/rc displayed)*weights + (10-SoL) + inequality*0.5 + crown_authority/20. Rolls 1d100 + strength; 0-40 ignored (-0.2 popularity all sectors), 41-69 accepted (-1 CA / +1 PA), 70+ major (-4 CA / +2 PA). Writes an event_log row per outcome.';

COMMIT;

NOTIFY pgrst, 'reload schema';
