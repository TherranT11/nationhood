-- ════════════════════════════════════════════════════════════════════════════════
-- Oil & gas stat rebalance — round 2
--
-- Flattens the non-petro nations so Hajjara (89) and Melizea (96) are cleanly
-- the dominant producers and the rest of the world consumes more than it pumps.
-- Updates both the live column and the seed_stats JSONB snapshot.
-- Idempotent — safe to re-run.
--
-- Final oil_and_gas distribution:
--   Melizea       96    (unchanged, top petro)
--   Hajjara       89.2  (unchanged, #2 petro)
--   Palvera       25.5  (unchanged, small producer)
--   Sangreza      21    (from 44 — downgraded mid to low producer)
--   Calveth        9    (from 18)
--   Vostia         6    (from 14)
--   Flandis        5    (from 14)
--   Dravka         4    (from 12)
--   San Estrella   3    (from 19)
--   Avelia         1    (from 6)
--   Montequilla    0    (from 12)
--   Sierramar      0    (from 7.2)
-- ════════════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
    v_targets CONSTANT jsonb := jsonb_build_object(
        'sangreza',      21,
        'calveth',        9,
        'vostia',         6,
        'flandis',        5,
        'dravka',         4,
        'san estrella',   3,
        'avelia',         1,
        'montequilla',    0,
        'sierramar',      0
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
    RAISE NOTICE 'Oil rebalance round 2 applied: 9 nations updated';
END $$;
