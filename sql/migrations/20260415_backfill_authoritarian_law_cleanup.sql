-- Backfill cleanup for removed authoritarian foundational law fields/options.
-- Ensures old saves do not fail after schema/runtime cleanup.

DO $$
BEGIN
  -- Reset legacy nation flags if present.
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'nations' AND column_name = 'term_limits_abolished'
  ) THEN
    UPDATE nations SET term_limits_abolished = false WHERE term_limits_abolished IS DISTINCT FROM false;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'nations' AND column_name = 'state_media_control'
  ) THEN
    UPDATE nations SET state_media_control = false WHERE state_media_control IS DISTINCT FROM false;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'nations' AND column_name = 'emergency_powers_act'
  ) THEN
    UPDATE nations SET emergency_powers_act = false WHERE emergency_powers_act IS DISTINCT FROM false;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'nations' AND column_name = 'seize_power_rejected'
  ) THEN
    UPDATE nations SET seize_power_rejected = false WHERE seize_power_rejected IS DISTINCT FROM false;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'nations' AND column_name = 'authoritarianism_seize_available_tick'
  ) THEN
    UPDATE nations SET authoritarianism_seize_available_tick = NULL;
  END IF;

  -- Remove stale timed momentum effects created by State Media Control Act.
  UPDATE nations
  SET timed_momentum_effects = (
    SELECT COALESCE(jsonb_agg(effect), '[]'::jsonb)
    FROM jsonb_array_elements(COALESCE(nations.timed_momentum_effects, '[]'::jsonb)) AS effect
    WHERE COALESCE(effect->>'source', '') <> 'state_media_control'
  )
  WHERE timed_momentum_effects IS NOT NULL
    AND jsonb_typeof(timed_momentum_effects) = 'array';

  -- Fail in-flight legacy foundational bills so they do not remain unresolved.
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'bills' AND column_name = 'proposed_abolish_term_limits'
  ) THEN
    UPDATE bills
    SET status = 'failed'
    WHERE status IN ('committee', 'floor', 'voting')
      AND (
        COALESCE(proposed_abolish_term_limits, false)
        OR COALESCE(proposed_state_media_control, false)
        OR COALESCE(proposed_emergency_powers_act, false)
      );

    UPDATE bills
    SET proposed_abolish_term_limits = NULL,
        proposed_state_media_control = NULL,
        proposed_emergency_powers_act = NULL
    WHERE COALESCE(proposed_abolish_term_limits, false)
       OR COALESCE(proposed_state_media_control, false)
       OR COALESCE(proposed_emergency_powers_act, false);
  END IF;
END $$;

-- Remove stale log references tied to removed mechanics.
DELETE FROM event_log
WHERE trigger_key IN (
  'term_limits_abolished',
  'state_media_control',
  'emergency_powers_act',
  'authoritarian_crisis_bonus',
  'authoritarian_crisis_law'
);
