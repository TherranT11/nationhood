-- ==================== FIX: Avelia-Montequilla Aid Agreement ====================
-- The bilateral ratification path activated the diplomatic_proposals record
-- but never created the trade_agreements + aid_agreement_state rows that the
-- tick processor needs to actually transfer aid.
--
-- This script creates the missing rows for the existing active agreement.
-- Safe to re-run: checks for existing rows before inserting.

DO $$
DECLARE
  v_proposal RECORD;
  v_avelia_id UUID;
  v_montequilla_id UUID;
  v_nation_a UUID;
  v_nation_b UUID;
  v_articles JSONB;
  v_duration_ticks INT;
  v_expires_at INT;
  v_ta_id UUID;
  v_aid_art JSONB;
  v_donor_id UUID;
  v_recipient_id UUID;
  v_annual_amount NUMERIC;
  v_current_tick INT;
  v_auto_renew BOOLEAN;
  v_notice_ticks INT;
BEGIN
  -- Get current tick
  SELECT current_tick INTO v_current_tick FROM shard WHERE name = 'Alpha Shard';

  -- Get nation IDs
  SELECT id INTO v_avelia_id FROM nations WHERE name = 'Avelia';
  SELECT id INTO v_montequilla_id FROM nations WHERE name = 'Montequilla';

  IF v_avelia_id IS NULL OR v_montequilla_id IS NULL THEN
    RAISE NOTICE 'Avelia or Montequilla not found.';
    RETURN;
  END IF;

  -- Canonical nation ordering (A < B)
  IF v_avelia_id < v_montequilla_id THEN
    v_nation_a := v_avelia_id; v_nation_b := v_montequilla_id;
  ELSE
    v_nation_a := v_montequilla_id; v_nation_b := v_avelia_id;
  END IF;

  -- Find the active economic aid diplomatic proposal
  SELECT * INTO v_proposal
  FROM diplomatic_proposals
  WHERE status = 'active'
    AND (
      (proposing_nation_id = v_avelia_id AND target_nation_id = v_montequilla_id) OR
      (proposing_nation_id = v_montequilla_id AND target_nation_id = v_avelia_id)
    )
    AND proposal_data->>'agreement_type' = 'economic_aid'
  ORDER BY activated_at_tick DESC
  LIMIT 1;

  IF v_proposal.id IS NULL THEN
    RAISE NOTICE 'No active economic_aid proposal found between Avelia and Montequilla.';
    RETURN;
  END IF;

  RAISE NOTICE 'Found proposal: % (activated tick %)', v_proposal.id, v_proposal.activated_at_tick;

  -- Check if trade_agreements row already exists for this pair + type
  SELECT id INTO v_ta_id
  FROM trade_agreements
  WHERE nation_a_id = v_nation_a
    AND nation_b_id = v_nation_b
    AND agreement_type = 'economic_aid'
    AND status = 'active';

  IF v_ta_id IS NOT NULL THEN
    RAISE NOTICE 'trade_agreements row already exists: % — skipping insert.', v_ta_id;
  ELSE
    -- Build the active articles list
    v_articles := COALESCE(v_proposal.proposal_data->'articles', '[]'::JSONB);

    -- Extract duration
    v_duration_ticks := 480;
    v_auto_renew := false;
    v_notice_ticks := 3;
    FOR i IN 0..jsonb_array_length(v_articles)-1 LOOP
      IF v_articles->i->>'type' = 'duration' THEN
        v_duration_ticks := COALESCE((v_articles->i->'data'->>'duration_ticks')::INT, 480);
        v_auto_renew := COALESCE((v_articles->i->'data'->>'auto_renew')::BOOLEAN, false);
        v_notice_ticks := COALESCE((v_articles->i->'data'->>'withdrawal_notice_ticks')::INT, 3);
        EXIT;
      END IF;
    END LOOP;

    v_expires_at := v_proposal.activated_at_tick + v_duration_ticks;

    INSERT INTO trade_agreements (
      nation_a_id, nation_b_id, agreement_type, agreement_name,
      articles, status, enacted_at_tick, expires_at_tick,
      auto_renew, withdrawal_notice_ticks
    ) VALUES (
      v_nation_a, v_nation_b,
      'economic_aid',
      COALESCE(v_proposal.proposal_data->>'agreement_name', v_proposal.proposal_data->>'name', 'Economic Aid Agreement'),
      v_articles,
      'active',
      v_proposal.activated_at_tick,
      v_expires_at,
      v_auto_renew,
      v_notice_ticks
    )
    RETURNING id INTO v_ta_id;

    RAISE NOTICE 'Created trade_agreements row: %', v_ta_id;
  END IF;

  -- Create aid_agreement_state if missing
  IF NOT EXISTS (SELECT 1 FROM aid_agreement_state WHERE agreement_id = v_ta_id) THEN
    v_articles := COALESCE(v_proposal.proposal_data->'articles', '[]'::JSONB);

    -- Find the aid_terms article
    FOR i IN 0..jsonb_array_length(v_articles)-1 LOOP
      IF v_articles->i->>'type' = 'aid_terms' THEN
        v_aid_art := v_articles->i;
        EXIT;
      END IF;
    END LOOP;

    IF v_aid_art IS NULL THEN
      v_donor_id := v_avelia_id;
      v_annual_amount := 30000000000;
    ELSE
      v_donor_id := (v_aid_art->'data'->>'donor_nation_id')::UUID;
      v_annual_amount := COALESCE((v_aid_art->'data'->>'annual_amount')::NUMERIC, 0);
      IF v_donor_id IS NULL THEN v_donor_id := v_avelia_id; END IF;
      IF v_annual_amount = 0 THEN v_annual_amount := 30000000000; END IF;
    END IF;

    v_recipient_id := CASE WHEN v_donor_id = v_avelia_id THEN v_montequilla_id ELSE v_avelia_id END;

    INSERT INTO aid_agreement_state (
      agreement_id, donor_nation_id, recipient_nation_id,
      current_annual_amount, original_annual_amount,
      next_review_tick, condition_failures, is_suspended
    ) VALUES (
      v_ta_id, v_donor_id, v_recipient_id,
      v_annual_amount, v_annual_amount,
      v_current_tick + 12,
      '{}'::JSONB, false
    );

    RAISE NOTICE 'Created aid_agreement_state: donor=%, recipient=%, amount=$%B/yr',
      v_donor_id, v_recipient_id, (v_annual_amount / 1000000000.0);
  ELSE
    RAISE NOTICE 'aid_agreement_state already exists.';
  END IF;

  RAISE NOTICE 'Done — Avelia-Montequilla aid pipeline fixed.';
END $$;
