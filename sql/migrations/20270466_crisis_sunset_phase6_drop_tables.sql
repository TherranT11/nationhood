-- Crisis system sunset — Phase 6 (final): DROP the tables.
--
-- Phases 1–5 stripped every writer, reader, edge-function bundle entry,
-- HTML page, and CSS file that referenced the crisis system. With no
-- code paths left, the tables themselves are now dead state. This
-- migration finishes the sunset by dropping them in dependents-first
-- order.
--
-- One live SQL dependency remains: hold_rally(UUID) reads
-- COUNT(*) FROM active_crises to bias rally outcome weights toward
-- gaffe/divisive/counter-protest when a nation is in crisis. That
-- bias is dropped here too — if the "rallies go worse when things
-- are on fire" effect is wanted back, switch the count to
-- active_modifiers WHERE severity = 'red' once a modifier-based
-- replacement is configured via modifieradmin.html.
--
-- Drop order (children of crisis_templates first):
--   1. crisis_triggers        FK → crisis_templates
--   2. crisis_effects         FK → crisis_templates
--   3. crisis_end_triggers    FK → crisis_templates
--   4. active_crises          FK → crisis_templates
--   5. crisis_templates       (the parent)
--
-- IF EXISTS makes the migration idempotent against partial replays.
-- CASCADE is a belt-and-suspenders against any RLS policy / index /
-- constraint I didn't enumerate in the Phase 6 audit; nothing useful
-- should depend on these tables at this point.

BEGIN;

-- ── 1. Drop the active_crises read from hold_rally ─────────────────
-- Same body as 20270106_hold_rally_rpc.sql, minus the v_crisis
-- DECLARE, the SELECT COUNT(*) ... FROM active_crises, and the
-- IF v_crisis > 0 weight-bias block. Everything else (lock semantics,
-- escalation curve, weight comments, trait modifiers, spillover, log
-- shape) carries forward unchanged so the function's contract stays
-- identical for every caller.

CREATE OR REPLACE FUNCTION public.hold_rally(p_sector_id UUID)
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
    v_base          CONSTANT BIGINT := 50000;
    v_step          CONSTANT BIGINT := 25000;
    v_cd_window     CONSTANT INT := 5;
    v_sec_id        UUID;
    v_sec_key       TEXT;
    v_sec_name      TEXT;
    v_count         INT;
    v_last_tick     INT;
    v_escalation    INT;
    v_cost          BIGINT;
    v_rallied_rec   INT;
    v_target_pop    INT;
    v_unrest        NUMERIC;
    v_pos           JSONB;   -- leader_positive_traits is JSONB
    v_neg           JSONB;   -- leader_negative_traits is JSONB
    -- raw clamped weights used for the pick
    w_rousing       INT;
    w_solid         INT;
    w_low           INT;
    w_gaffe         INT;
    w_divisive      INT;
    w_counter       INT;
    v_wsum          INT;
    v_pick          NUMERIC;
    v_outcome       TEXT;
    v_outcome_name  TEXT;
    v_tmin          INT;
    v_tmax          INT;
    v_spill         INT;
    v_spill_scope   TEXT;
    v_delta         INT;
    v_mult          NUMERIC;
    v_sign          INT;
    v_diminish      NUMERIC;
    v_target_next   INT;
    v_headline      TEXT;
    v_effects       JSONB;
    v_weights       JSONB;
    v_other         RECORD;
BEGIN
    IF v_caller IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_sector_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_sector');
    END IF;

    -- Resolve + lock the caller's faction. The lock makes the
    -- one-per-tick / funds checks and the debit atomic, so a
    -- double-clicked rally can't both pass and both charge.
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

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;

    -- Target sector must be active and belong to the caller's nation.
    SELECT id, sector_key, name INTO v_sec_id, v_sec_key, v_sec_name
      FROM sectors
     WHERE id = p_sector_id AND nation_id = v_nation.id AND is_active = true
     LIMIT 1;
    IF v_sec_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_sector');
    END IF;

    -- One rally per tick (hard).
    IF EXISTS (
        SELECT 1 FROM campaign_actions
         WHERE party_id = v_faction.id AND action_type = 'rally'
           AND tick_performed = v_tick
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_rallied_this_tick');
    END IF;

    -- Escalation: rallies in the last 10 ticks; level decays 1 per
    -- tick since the most recent rally.
    SELECT COUNT(*), MAX(tick_performed) INTO v_count, v_last_tick
      FROM campaign_actions
     WHERE party_id = v_faction.id AND action_type = 'rally'
       AND tick_performed >= v_tick - 10;
    v_escalation := GREATEST(0, COALESCE(v_count, 0)
                       - (v_tick - COALESCE(v_last_tick, v_tick)));
    v_cost := v_base + v_escalation::BIGINT * v_step;

    IF COALESCE(v_faction.party_funds, 0) < v_cost THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'have', COALESCE(v_faction.party_funds, 0), 'need', v_cost);
    END IF;

    -- Times this sector was rallied within the cooldown window (stale
    -- material → more gaffes).
    SELECT COUNT(*) INTO v_rallied_rec
      FROM campaign_actions
     WHERE party_id = v_faction.id AND action_type = 'rally'
       AND tick_performed >= v_tick - v_cd_window
       AND (result->>'sectorId') = p_sector_id::text;

    -- Current popularity in the target sector (missing row = 0).
    SELECT popularity INTO v_target_pop
      FROM faction_sector_popularity
     WHERE faction_id = v_faction.id AND sector_id = v_sec_id;
    v_target_pop := COALESCE(v_target_pop, 0);

    v_unrest := COALESCE(v_nation.unrest, 0);

    -- ── Outcome weights (mirrors getRallyOutcomeWeights) ──────────
    w_rousing := 20; w_solid := 38; w_low := 15;
    w_gaffe := 12; w_divisive := 8; w_counter := 5;

    IF v_target_pop > 45 THEN
        w_rousing := w_rousing + 12; w_low := w_low - 5; w_gaffe := w_gaffe - 4;
    ELSIF v_target_pop < 20 THEN
        w_rousing := w_rousing - 10; w_low := w_low + 10; w_gaffe := w_gaffe + 8;
    END IF;

    -- Crisis sunset Phase 6: active_crises count bias removed
    -- (was: +6 gaffe / +4 divisive / +10 counter / -8 rousing / -6 solid
    --  when any active_crises row existed for the nation). Reintroduce
    -- via an active_modifiers WHERE severity = 'red' count if a similar
    -- "things on fire → rallies go worse" damper is wanted back.

    IF v_rallied_rec >= 1 THEN
        w_gaffe := w_gaffe + 5 * v_rallied_rec;
        w_rousing := w_rousing - 3 * v_rallied_rec;
        w_low := w_low + 3 * v_rallied_rec;
    END IF;

    IF v_unrest > 40 THEN
        w_counter := w_counter + 8; w_rousing := w_rousing - 4;
    END IF;

    -- Leader trait modifiers (ported from applyRallyTraitModifiers).
    -- Traits are JSONB string arrays; `@> '"x"'` tests array membership.
    v_pos := COALESCE(v_faction.leader_positive_traits, '[]'::jsonb);
    v_neg := COALESCE(v_faction.leader_negative_traits, '[]'::jsonb);
    IF v_pos @> '"crowd_pleaser"'::jsonb THEN
        w_rousing := w_rousing + 8; w_solid := w_solid + 4;
    END IF;
    IF v_neg @> '"wooden_speaker"'::jsonb THEN
        w_gaffe := w_gaffe + 5; w_rousing := w_rousing - 8; w_low := w_low + 5;
    END IF;

    -- Clamp to >= 1 (matches the JS Math.max(1, ...) before normalize).
    w_rousing  := GREATEST(1, w_rousing);
    w_solid    := GREATEST(1, w_solid);
    w_low      := GREATEST(1, w_low);
    w_gaffe    := GREATEST(1, w_gaffe);
    w_divisive := GREATEST(1, w_divisive);
    w_counter  := GREATEST(1, w_counter);
    v_wsum := w_rousing + w_solid + w_low + w_gaffe + w_divisive + w_counter;

    -- Normalized integer percentages — stored in the log/result so the
    -- payload shape matches the old JS `weights` object.
    v_weights := jsonb_build_object(
        'rousing',  round(w_rousing  * 100.0 / v_wsum),
        'solid',    round(w_solid    * 100.0 / v_wsum),
        'low',      round(w_low      * 100.0 / v_wsum),
        'gaffe',    round(w_gaffe    * 100.0 / v_wsum),
        'divisive', round(w_divisive * 100.0 / v_wsum),
        'counter',  round(w_counter  * 100.0 / v_wsum)
    );

    -- Weighted pick on the raw clamped weights (cumulative thresholds;
    -- plpgsql has no inline assignment, so the sums are spelled out).
    v_pick := random() * v_wsum;
    IF    v_pick < w_rousing THEN
        v_outcome := 'rousing';
    ELSIF v_pick < w_rousing + w_solid THEN
        v_outcome := 'solid';
    ELSIF v_pick < w_rousing + w_solid + w_low THEN
        v_outcome := 'low';
    ELSIF v_pick < w_rousing + w_solid + w_low + w_gaffe THEN
        v_outcome := 'gaffe';
    ELSIF v_pick < w_rousing + w_solid + w_low + w_gaffe + w_divisive THEN
        v_outcome := 'divisive';
    ELSE
        v_outcome := 'counter';
    END IF;

    -- Outcome table (mirrors RALLY_OUTCOMES). Spillover is in tenths and
    -- only the 'others' scope survives — sectors have no adjacency graph.
    CASE v_outcome
        WHEN 'rousing' THEN
            v_outcome_name := 'Rousing Success'; v_tmin := 6; v_tmax := 8;
            v_spill := 0; v_spill_scope := 'none';
            v_headline := format('Massive turnout at the %s rally — supporters overflow the venue', v_sec_name);
        WHEN 'solid' THEN
            v_outcome_name := 'Solid Turnout'; v_tmin := 3; v_tmax := 5;
            v_spill := 0; v_spill_scope := 'none';
            v_headline := format('Party rally draws a steady crowd among %s — a strong showing', v_sec_name);
        WHEN 'low' THEN
            v_outcome_name := 'Low Turnout'; v_tmin := 1; v_tmax := 2;
            v_spill := 0; v_spill_scope := 'none';
            v_headline := format('Sparse attendance at the %s rally raises questions about grassroots support', v_sec_name);
        WHEN 'gaffe' THEN
            v_outcome_name := 'Gaffe'; v_tmin := -3; v_tmax := -2;
            v_spill := 0; v_spill_scope := 'none';
            v_headline := format('The party leader''s remarks draw swift backlash among %s', v_sec_name);
        WHEN 'divisive' THEN
            v_outcome_name := 'Divisive Speech'; v_tmin := 5; v_tmax := 7;
            v_spill := -2; v_spill_scope := 'others';
            v_headline := format('Fiery rally speech energizes %s but draws condemnation elsewhere', v_sec_name);
        ELSE
            v_outcome_name := 'Counter-Protest'; v_tmin := -1; v_tmax := -1;
            v_spill := -2; v_spill_scope := 'others';
            v_headline := format('The %s rally is disrupted by counter-protesters — police intervene as tensions escalate', v_sec_name);
    END CASE;

    -- Roll the target delta in [tmin, tmax] (integer tenths).
    v_delta := v_tmin + floor(random() * (v_tmax - v_tmin + 1))::INT;

    -- Positive results scale with telegenic / crowd_pleaser
    -- (getTraitApprovalMultiplier; multiplicative, like the JS).
    IF v_delta > 0 THEN
        v_mult := 1.0;
        IF v_pos @> '"telegenic"'::jsonb     THEN v_mult := v_mult * 1.3; END IF;
        IF v_pos @> '"crowd_pleaser"'::jsonb THEN v_mult := v_mult * 1.3; END IF;
        v_delta := round(v_delta * v_mult)::INT;
    END IF;

    -- Diminishing returns: -25% per escalation level, floor 25%,
    -- preserve direction even at the minimum.
    IF v_escalation > 0 AND v_delta <> 0 THEN
        v_sign := CASE WHEN v_delta > 0 THEN 1 ELSE -1 END;
        v_diminish := GREATEST(0.25, 1 - v_escalation * 0.25);
        v_delta := round(v_delta * v_diminish)::INT;
        IF v_delta = 0 THEN v_delta := v_sign; END IF;
    END IF;

    -- Crowd Pleaser flat +2 to the targeted sector.
    IF v_pos @> '"crowd_pleaser"'::jsonb THEN
        v_delta := v_delta + 2;
    END IF;

    -- ── Apply: target sector (canonical clamp-upsert) ─────────────
    v_target_next := GREATEST(0, LEAST(100, v_target_pop + v_delta));
    INSERT INTO faction_sector_popularity (faction_id, sector_id, popularity)
    VALUES (v_faction.id, v_sec_id, v_target_next)
    ON CONFLICT (faction_id, sector_id) DO UPDATE
        SET popularity = GREATEST(0, LEAST(100,
                faction_sector_popularity.popularity + v_delta)),
            updated_at = NOW();

    v_effects := jsonb_build_array(
        jsonb_build_object('label', v_sec_name,
                           'value', round((v_target_next - v_target_pop) / 10.0, 1))
    );

    -- Spillover: divisive / counter bleed into every OTHER active sector.
    IF v_spill_scope = 'others' AND v_spill <> 0 THEN
        FOR v_other IN
            SELECT id FROM sectors
             WHERE nation_id = v_nation.id AND is_active = true AND id <> v_sec_id
        LOOP
            INSERT INTO faction_sector_popularity (faction_id, sector_id, popularity)
            VALUES (v_faction.id, v_other.id, GREATEST(0, LEAST(100, v_spill)))
            ON CONFLICT (faction_id, sector_id) DO UPDATE
                SET popularity = GREATEST(0, LEAST(100,
                        faction_sector_popularity.popularity + v_spill)),
                    updated_at = NOW();
        END LOOP;
        v_effects := v_effects || jsonb_build_object(
            'label', 'Other sectors', 'value', round(v_spill / 10.0, 1));
    END IF;

    -- ── Debit + stamp (gated above, so no underflow) ──────────────
    UPDATE factions
       SET party_funds      = COALESCE(party_funds, 0) - v_cost,
           last_action_tick = v_tick
     WHERE id = v_faction.id;

    -- ── Log (same campaign_actions shape the rally has always used) ─
    INSERT INTO campaign_actions (
        party_id, nation_id, action_type, ap_cost, money_cost,
        tick_performed, result
    ) VALUES (
        v_faction.id, v_nation.id, 'rally', 0, v_cost, v_tick,
        jsonb_build_object(
            'sectorId',      v_sec_id,
            'sectorKey',     v_sec_key,
            'sectorName',    v_sec_name,
            'outcomeId',     v_outcome,
            'outcomeName',   v_outcome_name,
            'headline',      v_headline,
            'effects',       v_effects,
            'weights',       v_weights,
            'ralliedRecently', v_rallied_rec
        )
    );

    RETURN jsonb_build_object(
        'success',     true,
        'outcomeId',   v_outcome,
        'outcomeName', v_outcome_name,
        'headline',    v_headline,
        'effects',     v_effects,
        'weights',     v_weights,
        'cost_paid',   v_cost,
        'newFunds',    GREATEST(0, COALESCE(v_faction.party_funds, 0) - v_cost)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.hold_rally(UUID) TO authenticated;

COMMENT ON FUNCTION public.hold_rally(UUID) IS
    'Hold a Rally campaign action. SECURITY DEFINER (faction_sector_popularity is admin-write-only). Gates auth + one-per-tick + escalating $50k/+$25k party_funds cost atomically (FOR UPDATE on the faction). Weighted 1-of-6 outcome shifts the chosen sector''s popularity (tenths, clamp 0..100); divisive/counter bleed -0.2 to other sectors. crowd_pleaser/wooden_speaker shift weights; telegenic/crowd_pleaser scale positive results. Logs to campaign_actions; returns the result payload for the client.';

-- ── 2. Drop the crisis tables (children first, CASCADE for safety) ──

DROP TABLE IF EXISTS public.crisis_triggers     CASCADE;
DROP TABLE IF EXISTS public.crisis_effects      CASCADE;
DROP TABLE IF EXISTS public.crisis_end_triggers CASCADE;
DROP TABLE IF EXISTS public.active_crises       CASCADE;
DROP TABLE IF EXISTS public.crisis_templates    CASCADE;

NOTIFY pgrst, 'reload schema';

COMMIT;
