-- ════════════════════════════════════════════════════════════════════════════════
-- Oil & gas stat rebalance — Hajjara 89.2 -> 82, Melizea 96 -> 86
--
-- Trims the top two petro-states' oil reserves. Keeps them as the dominant
-- producers but reduces the global supply glut. Idempotent — safe to re-run.
-- ════════════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
    v_targets CONSTANT jsonb := jsonb_build_object(
        'hajjara', 82,
        'melizea', 86
    );
    v_name   text;
    v_value  int;
BEGIN
    FOR v_name, v_value IN SELECT key, value::text::int FROM jsonb_each(v_targets) LOOP
        UPDATE nations
           SET oil_and_gas = v_value,
               seed_stats = CASE
                   WHEN seed_stats IS NOT NULL AND seed_stats ? 'oil_and_gas'
                   THEN jsonb_set(seed_stats, '{oil_and_gas}', to_jsonb(v_value))
                   ELSE seed_stats
               END
         WHERE LOWER(name) = v_name;
    END LOOP;
    RAISE NOTICE 'Oil rebalance: Hajjara 89.2->82, Melizea 96->86';
END $$;
