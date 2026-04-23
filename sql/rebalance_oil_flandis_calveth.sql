-- ════════════════════════════════════════════════════════════════════════════════
-- Oil & gas stat rebalance — Flandis 34 -> 14, Calveth 4 -> 18
--
-- Paired with the fuel production formula change (commit 5eceeb4): oil_and_gas
-- is now the primary driver of fuel production with energy_generation as a
-- modifier, so the stat distribution matters more than it did under the old
-- (oil × gen) formula. Shifts Flandis down to a mid-tier producer and Calveth
-- up to a marginal producer.
--
-- Updates both the live column and the seed_stats JSONB snapshot so the new
-- values are treated as the baseline for any "change since founding" display.
-- Idempotent — safe to re-run.
-- ════════════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
    -- Flandis: 34 -> 14
    UPDATE nations
       SET oil_and_gas = 14,
           seed_stats = CASE
               WHEN seed_stats IS NOT NULL AND seed_stats ? 'oil_and_gas'
               THEN jsonb_set(seed_stats, '{oil_and_gas}', to_jsonb(14))
               ELSE seed_stats
           END
     WHERE LOWER(name) = 'flandis';

    -- Calveth: 4 -> 18
    UPDATE nations
       SET oil_and_gas = 18,
           seed_stats = CASE
               WHEN seed_stats IS NOT NULL AND seed_stats ? 'oil_and_gas'
               THEN jsonb_set(seed_stats, '{oil_and_gas}', to_jsonb(18))
               ELSE seed_stats
           END
     WHERE LOWER(name) = 'calveth';

    RAISE NOTICE 'Oil rebalance applied: Flandis 34->14, Calveth 4->18';
END $$;
